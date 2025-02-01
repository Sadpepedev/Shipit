import { create } from 'zustand';
import { GameState } from '../types';
import { Address } from 'viem';

interface GameStore extends GameState {
  setPlaying: (isPlaying: boolean) => void;
  setGameOver: (gameOver: boolean) => void;
  setScore: (score: number) => void;
  setHighScore: (score: number) => void;
  setPlayerName: (name: string) => void;
  setWalletAddress: (address: Address | undefined) => void;
  resetGame: () => void;
  resetAll: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  isPlaying: false,
  gameOver: false,
  score: 0,
  highScore: 0,
  playerName: '',
  walletAddress: undefined,
  
  setPlaying: (isPlaying) => set({ isPlaying }),
  setGameOver: (gameOver) => set({ gameOver }),
  setScore: (score) => set({ score }),
  setHighScore: (score) => set({ highScore }),
  setPlayerName: (playerName) => set({ playerName }),
  setWalletAddress: (walletAddress) => set({ walletAddress }),
  resetGame: () => set((state) => ({ 
    isPlaying: false,
    gameOver: false,
    score: 0,
  })),
  resetAll: () => set({
    isPlaying: false,
    gameOver: false,
    score: 0,
    highScore: 0,
    playerName: '',
    walletAddress: undefined,
  }),
}));