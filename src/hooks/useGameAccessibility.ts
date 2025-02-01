import { useEffect, useCallback } from 'react';

interface GameAccessibilityProps {
  onFlap: () => void;
  onPause: () => void;
  onMute: () => void;
  isPlaying: boolean;
  gameOver: boolean;
}

export function useGameAccessibility({
  onFlap,
  onPause,
  onMute,
  isPlaying,
  gameOver,
}: GameAccessibilityProps) {
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (!isPlaying || gameOver) return;

    switch (event.code) {
      case 'Space':
        event.preventDefault();
        onFlap();
        break;
      case 'Escape':
        event.preventDefault();
        onPause();
        break;
      case 'KeyM':
        event.preventDefault();
        onMute();
        break;
      default:
        break;
    }
  }, [isPlaying, gameOver, onFlap, onPause, onMute]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  // Add ARIA live region for game status announcements
  useEffect(() => {
    const statusRegion = document.createElement('div');
    statusRegion.setAttribute('role', 'status');
    statusRegion.setAttribute('aria-live', 'polite');
    statusRegion.className = 'sr-only';
    document.body.appendChild(statusRegion);

    return () => {
      document.body.removeChild(statusRegion);
    };
  }, []);

  const announceGameStatus = useCallback((message: string) => {
    const statusRegion = document.querySelector('[role="status"]');
    if (statusRegion) {
      statusRegion.textContent = message;
    }
  }, []);

  return {
    announceGameStatus,
  };
}