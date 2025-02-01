import { useCallback, useEffect, useRef, useState } from 'react';

interface GameSounds {
  flap: HTMLAudioElement;
  score: HTMLAudioElement;
  hit: HTMLAudioElement;
  background: HTMLAudioElement;
}

export function useGameAudio() {
  const [isMuted, setIsMuted] = useState(() => {
    const saved = localStorage.getItem('gameAudioMuted');
    return saved ? JSON.parse(saved) : false;
  });
  
  const sounds = useRef<Partial<GameSounds>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  const loadSounds = useCallback(async () => {
    const soundFiles = {
      flap: 'https://assets.codepen.io/21542/flap.wav',
      score: 'https://assets.codepen.io/21542/score.wav',
      hit: 'https://assets.codepen.io/21542/hit.wav',
      background: 'https://assets.codepen.io/21542/background-music.mp3',
    };

    try {
      const loadedSounds: Partial<GameSounds> = {};
      
      for (const [key, url] of Object.entries(soundFiles)) {
        const audio = new Audio(url);
        audio.preload = 'auto';
        
        if (key === 'background') {
          audio.loop = true;
          audio.volume = 0.3;
        }
        
        await new Promise((resolve, reject) => {
          audio.addEventListener('canplaythrough', resolve, { once: true });
          audio.addEventListener('error', reject, { once: true });
          audio.load();
        });
        
        loadedSounds[key as keyof GameSounds] = audio;
      }
      
      sounds.current = loadedSounds;
      setIsLoaded(true);
    } catch (error) {
      console.error('Error loading game sounds:', error);
      // Continue without sound if loading fails
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadSounds();
  }, [loadSounds]);

  useEffect(() => {
    localStorage.setItem('gameAudioMuted', JSON.stringify(isMuted));
  }, [isMuted]);

  const playSound = useCallback((soundName: keyof GameSounds) => {
    if (!isMuted && sounds.current[soundName]) {
      const sound = sounds.current[soundName];
      if (sound) {
        sound.currentTime = 0;
        sound.play().catch(() => {
          // Ignore autoplay errors
        });
      }
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  return {
    playSound,
    toggleMute,
    isMuted,
    isLoaded,
  };
}