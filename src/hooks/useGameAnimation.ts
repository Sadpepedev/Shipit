import { useCallback } from 'react';
import { GAME_CONFIG } from '../config/gameConfig';

const { ANIMATIONS } = GAME_CONFIG;

export function useGameAnimation() {
  const createDeathParticles = useCallback((x: number, y: number) => {
    return Array.from({ length: ANIMATIONS.DEATH.PARTICLE_COUNT }, () => ({
      x,
      y,
      vx: (Math.random() - 0.5) * 15,
      vy: (Math.random() - 0.5) * 15,
      size: Math.random() * (ANIMATIONS.DEATH.PARTICLE_SIZE.MAX - ANIMATIONS.DEATH.PARTICLE_SIZE.MIN) + ANIMATIONS.DEATH.PARTICLE_SIZE.MIN,
      color: ANIMATIONS.DEATH.COLORS[Math.floor(Math.random() * ANIMATIONS.DEATH.COLORS.length)],
      life: 1,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      rotation: Math.random() * Math.PI * 2,
    }));
  }, []);

  const updateParticles = useCallback((
    ctx: CanvasRenderingContext2D,
    particles: any[],
    deltaTime: number
  ) => {
    return particles.filter(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.3;
      particle.rotation += particle.rotationSpeed;
      particle.life -= deltaTime / ANIMATIONS.DEATH.DURATION;

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

  return {
    createDeathParticles,
    updateParticles,
  };
}