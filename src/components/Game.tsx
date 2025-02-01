import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { Penguin, Rug, CollisionBox } from '../types';
import { supabase } from '../lib/supabase';
import { RefreshCw, Share2 } from 'lucide-react';
import { GAME_CONFIG } from '../config/gameConfig';
import { useAccount } from 'wagmi';

const {
  PHYSICS: { GRAVITY, FLAP_STRENGTH, FIXED_TIME_STEP },
  DIMENSIONS: { PENGUIN_WIDTH, PENGUIN_HEIGHT, RUG_WIDTH, RUG_GAP },
  GAMEPLAY: { RUG_SPEED, IMMUNITY_DURATION },
} = GAME_CONFIG;

const SPARKLINE_CONFIG = {
  maxPoints: 100,
  lineColor: 'rgba(0, 255, 128, 0.2)',
  deathColor: 'rgba(255, 0, 0, 0.5)',
  transitionDuration: 300,
  spacing: 5,
};

const DEATH_ANIMATION = {
  duration: 1500,
  particleCount: 50,
  particleSize: { min: 2, max: 5 },
  colors: ['#FF0000', '#FF5555', '#FF8888', '#FFFFFF'],
};

const Game: React.FC = () => {
  const { address } = useAccount();
  const { isPlaying, gameOver, score, playerName, setPlaying, setGameOver, setScore, resetGame } = useGameStore();
  const [playerRank, setPlayerRank] = useState<number | null>(null);
  const [totalPlayers, setTotalPlayers] = useState<number | null>(null);
  const [isDying, setIsDying] = useState(false);
  const [isImmune, setIsImmune] = useState(false);
  const [isPaused, setPaused] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sparklineCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const sparklineContextRef = useRef<CanvasRenderingContext2D | null>(null);
  const penguinImgRef = useRef<HTMLImageElement>(new Image());
  const lastTimeRef = useRef(0);
  const rugPool = useRef<Rug[]>([]);
  const sparklinePoints = useRef<Array<{x: number, y: number, velocity: number}>>([]);
  const deathAnimationStartTime = useRef<number>(0);
  const particles = useRef<Array<{x: number; y: number; vx: number; vy: number; size: number; color: string; life: number; rotationSpeed: number; rotation: number}>>([]);
  
  const penguinRef = useRef<Penguin>({
    y: 300,
    velocity: 0,
    rotation: 0,
  });
  
  const rugsRef = useRef<Rug[]>([]);
  const scoreRef = useRef(0);

  const createDeathParticles = useCallback((x: number, y: number) => {
    particles.current = Array.from({ length: DEATH_ANIMATION.particleCount }, () => ({
      x,
      y,
      vx: (Math.random() - 0.5) * 15,
      vy: (Math.random() - 0.5) * 15,
      size: Math.random() * (DEATH_ANIMATION.particleSize.max - DEATH_ANIMATION.particleSize.min) + DEATH_ANIMATION.particleSize.min,
      color: DEATH_ANIMATION.colors[Math.floor(Math.random() * DEATH_ANIMATION.colors.length)],
      life: 1,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      rotation: Math.random() * Math.PI * 2,
    }));
  }, []);

  const handleGameOver = useCallback(async () => {
    if (isDying) return;
    
    setIsDying(true);
    deathAnimationStartTime.current = performance.now();
    
    createDeathParticles(100 + PENGUIN_WIDTH / 2, penguinRef.current.y + PENGUIN_HEIGHT / 2);
    
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.transform = 'translate(5px, 5px)';
      setTimeout(() => {
        canvas.style.transform = 'translate(-5px, -5px)';
        setTimeout(() => {
          canvas.style.transform = 'none';
        }, 50);
      }, 50);
    }

    try {
      const { count } = await supabase
        .from('leaderboard')
        .select('*', { count: 'exact' });

      const { data: higherScores } = await supabase
        .from('leaderboard')
        .select('id')
        .gt('score', scoreRef.current);

      if (count !== null) {
        const higherScoreCount = higherScores?.length || 0;
        const rank = scoreRef.current > 0 ? higherScoreCount + 1 : count;
        setPlayerRank(rank);
        setTotalPlayers(Math.max(count, rank));
      }

      if (playerName && scoreRef.current > 0) {
        await supabase
          .from('leaderboard')
          .insert([{ 
            player_name: playerName,
            wallet_address: address,
            score: scoreRef.current 
          }]);
      }
    } catch (error) {
      console.error('Error handling game over:', error);
      setPlayerRank(null);
      setTotalPlayers(null);
    }

    setTimeout(() => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
      setGameOver(true);
      setIsDying(false);
    }, DEATH_ANIMATION.duration);
  }, [playerName, setGameOver, isDying, createDeathParticles, address]);

  const checkCollision = useCallback((box1: CollisionBox, box2: CollisionBox): boolean => {
    return (
      box1.x < box2.x + box2.width &&
      box1.x + box1.width > box2.x &&
      box1.y < box2.y + box2.height &&
      box1.y + box1.height > box2.y
    );
  }, []);

  const checkCollisions = useCallback(() => {
    const penguinBox: CollisionBox = {
      x: 100,
      y: penguinRef.current.y,
      width: PENGUIN_WIDTH,
      height: PENGUIN_HEIGHT,
    };

    const canvas = canvasRef.current;
    if (!canvas) return;

    if (penguinRef.current.y < 0 || penguinRef.current.y > canvas.height) {
      handleGameOver();
      return;
    }

    for (const rug of rugsRef.current) {
      const topRugBox: CollisionBox = {
        x: rug.x,
        y: 0,
        width: RUG_WIDTH,
        height: rug.topHeight,
      };

      const bottomRugBox: CollisionBox = {
        x: rug.x,
        y: rug.topHeight + RUG_GAP,
        width: RUG_WIDTH,
        height: canvas.height - (rug.topHeight + RUG_GAP),
      };

      if (checkCollision(penguinBox, topRugBox) || checkCollision(penguinBox, bottomRugBox)) {
        handleGameOver();
        return;
      }
    }
  }, [checkCollision, handleGameOver]);

  const handlePlayAgain = useCallback(() => {
    resetGame();
    setPlayerRank(null);
    setTotalPlayers(null);
    setTimeout(() => {
      setPlaying(true);
    }, 50);
  }, [resetGame, setPlaying]);

  const handleShareScore = useCallback(() => {
    const tweetText = `I just got ${score} points on Cygaar's Circuit! Think you can beat it? #Cygaarcoin`;
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(tweetUrl, '_blank');
  }, [score]);

  const handleFlap = useCallback(() => {
    if (gameOver || isPaused) return;
    
    penguinRef.current = {
      ...penguinRef.current,
      velocity: FLAP_STRENGTH,
    };
  }, [gameOver, isPaused]);

  const updateScore = useCallback(() => {
    rugsRef.current.forEach(rug => {
      if (!rug.passed && rug.x < 100 - PENGUIN_WIDTH) {
        scoreRef.current += 1;
        rug.passed = true;
        setScore(scoreRef.current);
      }
    });
  }, [setScore]);

  const getRugFromPool = useCallback((): Rug => {
    return rugPool.current.pop() || {
      x: 0,
      topHeight: 0,
      passed: false,
    };
  }, []);

  const returnRugToPool = useCallback((rug: Rug) => {
    rugPool.current.push(rug);
  }, []);

  const updatePhysics = useCallback((deltaTime: number) => {
    if (!isPlaying || gameOver || isPaused) return;

    penguinRef.current = {
      ...penguinRef.current,
      y: penguinRef.current.y + penguinRef.current.velocity * (deltaTime / FIXED_TIME_STEP),
      velocity: penguinRef.current.velocity + GRAVITY * (deltaTime / FIXED_TIME_STEP),
      rotation: Math.min(Math.max(-15, penguinRef.current.velocity * 1.5), 70),
    };

    const canvas = canvasRef.current;
    if (!canvas) return;

    const newRugs = rugsRef.current.map(rug => ({
      ...rug,
      x: rug.x - RUG_SPEED * (deltaTime / FIXED_TIME_STEP),
    }));

    const filteredRugs = newRugs.filter(rug => {
      if (rug.x <= -RUG_WIDTH) {
        returnRugToPool(rug);
        return false;
      }
      return true;
    });

    if (filteredRugs.length === 0 || filteredRugs[filteredRugs.length - 1].x < canvas.width - 300) {
      const newRug = getRugFromPool();
      newRug.x = canvas.width;
      newRug.topHeight = Math.random() * (canvas.height - RUG_GAP - 100) + 50;
      newRug.passed = false;
      filteredRugs.push(newRug);
    }

    rugsRef.current = filteredRugs;

    if (!isImmune) {
      checkCollisions();
    }

    updateScore();
  }, [isPlaying, gameOver, isPaused, isImmune, getRugFromPool, returnRugToPool, checkCollisions, updateScore]);

  const updateSparkline = useCallback((ctx: CanvasRenderingContext2D, y: number, dying: boolean = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    sparklinePoints.current.push({ 
      x: 100,
      y,
      velocity: penguinRef.current.velocity
    });

    sparklinePoints.current = sparklinePoints.current
      .map(point => ({
        ...point,
        x: point.x - SPARKLINE_CONFIG.spacing
      }))
      .filter(point => point.x > -50);

    ctx.save();
    
    if (sparklinePoints.current.length > 0) {
      ctx.beginPath();
      ctx.moveTo(sparklinePoints.current[0].x, canvas.height);
      
      sparklinePoints.current.forEach((point, i) => {
        if (i === 0) {
          ctx.lineTo(point.x, point.y);
        } else {
          const xc = (point.x + sparklinePoints.current[i - 1].x) / 2;
          const yc = (point.y + sparklinePoints.current[i - 1].y) / 2;
          ctx.quadraticCurveTo(sparklinePoints.current[i - 1].x, sparklinePoints.current[i - 1].y, xc, yc);
        }
      });

      ctx.lineTo(sparklinePoints.current[sparklinePoints.current.length - 1].x, canvas.height);
      
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      if (dying) {
        gradient.addColorStop(0, 'rgba(255, 0, 0, 0.2)');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0.05)');
      } else {
        const isGoingUp = penguinRef.current.velocity < 0;
        if (isGoingUp) {
          gradient.addColorStop(0, 'rgba(0, 255, 128, 0.2)');
          gradient.addColorStop(1, 'rgba(0, 255, 128, 0.05)');
        } else {
          gradient.addColorStop(0, 'rgba(255, 0, 0, 0.2)');
          gradient.addColorStop(1, 'rgba(255, 0, 0, 0.05)');
        }
      }
      
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.beginPath();
      sparklinePoints.current.forEach((point, i) => {
        if (i === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          const xc = (point.x + sparklinePoints.current[i - 1].x) / 2;
          const yc = (point.y + sparklinePoints.current[i - 1].y) / 2;
          ctx.quadraticCurveTo(sparklinePoints.current[i - 1].x, sparklinePoints.current[i - 1].y, xc, yc);
        }
      });

      if (dying) {
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
      } else {
        const isGoingUp = penguinRef.current.velocity < 0;
        ctx.strokeStyle = isGoingUp 
          ? 'rgba(0, 255, 128, 0.5)'
          : 'rgba(255, 0, 0, 0.5)';
      }
      
      ctx.lineWidth = 2;
      ctx.stroke();

      sparklinePoints.current.forEach((point, i) => {
        const alpha = i / sparklinePoints.current.length;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
        
        if (dying) {
          ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
        } else {
          const isGoingUp = point.velocity < 0;
          ctx.fillStyle = isGoingUp 
            ? `rgba(0, 255, 128, ${alpha})`
            : `rgba(255, 0, 0, ${alpha})`;
        }
        
        ctx.fill();
      });
    }

    ctx.restore();
  }, []);

  const updateParticles = useCallback((ctx: CanvasRenderingContext2D, deltaTime: number) => {
    particles.current = particles.current.filter(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.3;
      particle.rotation += particle.rotationSpeed;
      particle.life -= deltaTime / DEATH_ANIMATION.duration;

      if (particle.life > 0) {
        const alpha = particle.life;
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation);
        ctx.fillStyle = particle.color.replace(')', `,${alpha})`).replace('rgb', 'rgba');
        ctx.beginPath();
        ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.restore();
        return true;
      }
      return false;
    });
  }, []);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        handleFlap();
      } else if (event.code === 'Escape') {
        setPaused(prev => !prev);
      }
    };

    const handleTouch = (e: TouchEvent) => {
      e.preventDefault();
      handleFlap();
    };

    window.addEventListener('keydown', handleKeyPress);
    canvasRef.current?.addEventListener('touchstart', handleTouch);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      canvasRef.current?.removeEventListener('touchstart', handleTouch);
    };
  }, [handleFlap]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isPlaying) {
        setPaused(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPlaying]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.style.backgroundColor = '#87CEEB';
    contextRef.current = canvas.getContext('2d');
    
    if (contextRef.current) {
      contextRef.current.fillStyle = '#87CEEB';
      contextRef.current.fillRect(0, 0, canvas.width, canvas.height);
      penguinRef.current.y = canvas.height / 2;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const onImageLoad = () => {
      if (mounted) {
        setImagesLoaded(true);
        
        if (contextRef.current && penguinImgRef.current) {
          const ctx = contextRef.current;
          ctx.save();
          ctx.translate(100 + PENGUIN_WIDTH / 2, penguinRef.current.y + PENGUIN_HEIGHT / 2);
          ctx.drawImage(
            penguinImgRef.current,
            -PENGUIN_WIDTH / 2,
            -PENGUIN_HEIGHT / 2,
            PENGUIN_WIDTH,
            PENGUIN_HEIGHT
          );
          ctx.restore();
        }
      }
    };

    const onImageError = () => {
      console.log('Using fallback penguin drawing');
      setImagesLoaded(true);
    };

    penguinImgRef.current = new Image();
    penguinImgRef.current.crossOrigin = "anonymous";
    penguinImgRef.current.onload = onImageLoad;
    penguinImgRef.current.onerror = onImageError;
    penguinImgRef.current.src = 'https://raw.githubusercontent.com/Sadpepedev/Cygaarverse-live/main/0682a8ef-dd5b-4eff-a538-028436b3e3a5_rEKKc4YC-400x400.png';

    return () => {
      mounted = false;
      if (penguinImgRef.current) {
        penguinImgRef.current.onload = null;
        penguinImgRef.current.onerror = null;
      }
    };
  }, []);

  useEffect(() => {
    if (isPlaying && canvasRef.current) {
      penguinRef.current = {
        y: canvasRef.current.height / 2,
        velocity: 0,
        rotation: 0,
      };
      rugsRef.current = [];
      scoreRef.current = 0;
      setScore(0);
      setIsImmune(true);
      
      const immunityTimer = setTimeout(() => {
        setIsImmune(false);
      }, IMMUNITY_DURATION);
      
      const canvas = canvasRef.current;
      if (canvas && contextRef.current) {
        contextRef.current.fillStyle = '#87CEEB';
        contextRef.current.fillRect(0, 0, canvas.width, canvas.height);
      }

      return () => {
        clearTimeout(immunityTimer);
      };
    }
  }, [isPlaying, setScore]);

  useEffect(() => {
    if (!imagesLoaded || !isPlaying || gameOver || !contextRef.current) {
      return;
    }

    const ctx = contextRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gameLoop = (timestamp: number) => {
      if (!isPlaying || gameOver || isPaused) return;

      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      if (!isDying) {
        updatePhysics(deltaTime);
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, 'rgba(41, 121, 255, 0.9)');
      gradient.addColorStop(1, 'rgba(0, 64, 128, 0.9)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      updateSparkline(ctx, penguinRef.current.y + PENGUIN_HEIGHT / 2, isDying);

      rugsRef.current.forEach(rug => {
        ctx.save();
        
        const rugGradient = ctx.createLinearGradient(rug.x, 0, rug.x + RUG_WIDTH, 0);
        rugGradient.addColorStop(0, '#D35400');
        rugGradient.addColorStop(0.5, '#E67E22');
        rugGradient.addColorStop(1, '#D35400');
        
        ctx.fillStyle = rugGradient;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetY = 5;
        
        ctx.fillRect(rug.x, 0, RUG_WIDTH, rug.topHeight);
        ctx.fillRect(
          rug.x,
          rug.topHeight + RUG_GAP,
          RUG_WIDTH,
          canvas.height - (rug.topHeight + RUG_GAP)
        );
        
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 4;
        
        for (let i = 0; i < rug.topHeight; i += 20) {
          ctx.beginPath();
          ctx.moveTo(rug.x, i);
          ctx.lineTo(rug.x + RUG_WIDTH, i);
          ctx.stroke();
        }
        
        for (let i = rug.topHeight + RUG_GAP; i < canvas.height; i += 20) {
          ctx.beginPath();
          ctx.moveTo(rug.x, i);
          ctx.lineTo(rug.x + RUG_WIDTH, i);
          ctx.stroke();
        }
        
        ctx.restore();
      });

      ctx.save();
      ctx.translate(100 + PENGUIN_WIDTH / 2, penguinRef.current.y + PENGUIN_HEIGHT / 2);
      
      if (isDying) {
        const progress = (timestamp - deathAnimationStartTime.current) / DEATH_ANIMATION.duration;
        const rotationProgress = Math.min(1, progress * 3);
        ctx.rotate((penguinRef.current.rotation + rotationProgress * 720) * Math.PI / 180);
      } else {
        ctx.rotate((penguinRef.current.rotation) * Math.PI / 180);
      }
      
      if (isImmune) {
        ctx.globalAlpha = 0.6 + Math.sin(Date.now() / 100) * 0.2;
      }
      
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 5;
      
      if (penguinImgRef.current.naturalWidth === 0) {
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(0, 0, PENGUIN_WIDTH/2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, 5, PENGUIN_WIDTH/3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const cornerRadius = 12;
        
        ctx.beginPath();
        ctx.moveTo(-PENGUIN_WIDTH/2 + cornerRadius, -PENGUIN_HEIGHT/2);
        ctx.lineTo(PENGUIN_WIDTH/2 - cornerRadius, -PENGUIN_HEIGHT/2);
        ctx.arcTo(PENGUIN_WIDTH/2, -PENGUIN_HEIGHT/2, PENGUIN_WIDTH/2, -PENGUIN_HEIGHT/2 + cornerRadius, cornerRadius);
        ctx.lineTo(PENGUIN_WIDTH/2, PENGUIN_HEIGHT/2 - cornerRadius);
        ctx.arcTo(PENGUIN_WIDTH/2, PENGUIN_HEIGHT/2, PENGUIN_WIDTH/2 - cornerRadius, PENGUIN_HEIGHT/2, cornerRadius);
        ctx.lineTo(-PENGUIN_WIDTH/2 + cornerRadius, PENGUIN_HEIGHT/2);
        ctx.arcTo(-PENGUIN_WIDTH/2, PENGUIN_HEIGHT/2, -PENGUIN_WIDTH/2, PENGUIN_HEIGHT/2 - cornerRadius, cornerRadius);
        ctx.lineTo(-PENGUIN_WIDTH/2, -PENGUIN_HEIGHT/2 + cornerRadius);
        ctx.arcTo(-PENGUIN_WIDTH/2, -PENGUIN_HEIGHT/2, -PENGUIN_WIDTH/2 + cornerRadius, -PENGUIN_HEIGHT/2, cornerRadius);
        ctx.closePath();
        
        ctx.clip();
        
        ctx.drawImage(
          penguinImgRef.current,
          -PENGUIN_WIDTH / 2,
          -PENGUIN_HEIGHT / 2,
          PENGUIN_WIDTH,
          PENGUIN_HEIGHT
        );
      }
      
      ctx.restore();

      if (isDying) {
        updateParticles(ctx, deltaTime);
      }

      ctx.save();
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 4;
      ctx.font = 'bold 48px Arial';
      const scoreText = scoreRef.current.toString();
      const scoreWidth = ctx.measureText(scoreText).width;
      ctx.strokeText(scoreText, canvas.width / 2 - scoreWidth / 2, 50);
      ctx.fillText(scoreText, canvas.width / 2 - scoreWidth / 2, 50);
      ctx.restore();

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    lastTimeRef.current = performance.now();
    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
    };
  }, [isPlaying, gameOver, imagesLoaded, isPaused, updatePhysics, isImmune, isDying, updateSparkline, updateParticles]);

  return (
    <div className="relative bg-white/95 backdrop-blur rounded-2xl shadow-xl overflow-hidden">
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        onClick={handleFlap}
        className="w-full h-auto transition-transform duration-50"
        tabIndex={0}
      />
      {isPaused && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/75 backdrop-blur-sm">
          <div className="text-white text-2xl font-bold">PAUSED</div>
        </div>
      )}
      {gameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/75 backdrop-blur-sm rounded-lg">
          <div className="bg-white p-8 rounded-2xl text-center max-w-md w-full mx-4">
            <h2 className="text-3xl font-bold mb-2 text-red-500">RUGGED!</h2>
            <p className="text-2xl mb-2 text-blue-600">Final Score: {score}</p>
            
            {playerRank !== null && totalPlayers !== null && (
              <div className="mb-6">
                <p className="text-gray-600">You placed</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 text-transparent bg-clip-text">
                  #{playerRank}
                </p>
                <p className="text-sm text-gray-500">
                  out of {totalPlayers} {totalPlayers === 1 ? 'player' : 'players'}
                </p>
              </div>
            )}
            
            <div className="space-y-4">
              <button
                onClick={handlePlayAgain}
                className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-semibold text-lg"
              >
                <RefreshCw className="w-6 h-6" />
                I can beat that!
              </button>
              
              <button
                onClick={handleShareScore}
                className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-[#1DA1F2] text-white rounded-xl hover:bg-[#1a8cd8] transition -colors font-semibold text-lg"
              >
                <Share2 className="w-6 h-6" />
                Share on X
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;