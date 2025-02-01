import React from 'react';
import { useGameStore } from '../store/gameStore';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface GameControlsProps {
  isPaused: boolean;
  isMuted: boolean;
  onPauseToggle: () => void;
  onMuteToggle: () => void;
  className?: string;
}

const GameControls: React.FC<GameControlsProps> = ({
  isPaused,
  isMuted,
  onPauseToggle,
  onMuteToggle,
  className = '',
}) => {
  const { isPlaying, gameOver } = useGameStore();

  if (!isPlaying || gameOver) return null;

  return (
    <div 
      className={`flex items-center gap-2 ${className}`}
      role="group"
      aria-label="Game controls"
    >
      <button
        onClick={onPauseToggle}
        className="p-2 rounded-lg bg-white/90 hover:bg-white transition-colors"
        aria-label={isPaused ? 'Resume game' : 'Pause game'}
      >
        {isPaused ? (
          <Play className="w-5 h-5 text-blue-600" />
        ) : (
          <Pause className="w-5 h-5 text-blue-600" />
        )}
      </button>
      
      <button
        onClick={onMuteToggle}
        className="p-2 rounded-lg bg-white/90 hover:bg-white transition-colors"
        aria-label={isMuted ? 'Unmute game' : 'Mute game'}
      >
        {isMuted ? (
          <VolumeX className="w-5 h-5 text-blue-600" />
        ) : (
          <Volume2 className="w-5 h-5 text-blue-600" />
        )}
      </button>
    </div>
  );
};

export default GameControls;