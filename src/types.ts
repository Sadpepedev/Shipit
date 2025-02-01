import { Address } from 'viem';

export interface GameState {
  isPlaying: boolean;
  gameOver: boolean;
  score: number;
  highScore: number;
  playerName: string;
  walletAddress: Address | undefined;
}

export interface Penguin {
  y: number;
  velocity: number;
  rotation: number;
}

export interface Rug {
  x: number;
  topHeight: number;
  passed: boolean;
}

export interface LeaderboardEntry {
  id: string;
  player_name: string;
  wallet_address?: string;
  score: number;
  created_at: string;
}

export interface CollisionBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export enum GameState {
  MENU,
  PLAYING,
  PAUSED,
  GAME_OVER,
}