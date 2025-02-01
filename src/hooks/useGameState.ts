import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useGameStore } from '../store/gameStore';

export function useGameState() {
  const { setScore, setGameOver } = useGameStore();

  const handleGameOver = useCallback(async (
    score: number,
    playerName: string,
    walletAddress?: string
  ) => {
    try {
      // Get rankings
      const { count } = await supabase
        .from('leaderboard')
        .select('*', { count: 'exact' });

      const { data: higherScores } = await supabase
        .from('leaderboard')
        .select('id')
        .gt('score', score);

      const rank = score > 0 ? (higherScores?.length || 0) + 1 : count;
      
      // Save score if greater than 0
      if (playerName && score > 0) {
        await supabase
          .from('leaderboard')
          .insert([{ 
            player_name: playerName,
            wallet_address: walletAddress,
            score 
          }]);
      }

      setGameOver(true);
      return { rank, totalPlayers: count };
    } catch (error) {
      console.error('Error handling game over:', error);
      setGameOver(true);
      return null;
    }
  }, [setGameOver]);

  return {
    handleGameOver,
  };
}