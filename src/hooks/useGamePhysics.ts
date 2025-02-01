import { useCallback } from 'react';
import { GAME_CONFIG } from '../config/gameConfig';
import { Penguin, Rug, CollisionBox } from '../types';

const { PHYSICS: { GRAVITY, FIXED_TIME_STEP }, GAMEPLAY: { RUG_SPEED } } = GAME_CONFIG;

export function useGamePhysics() {
  const updatePhysics = useCallback((
    penguin: Penguin,
    rugs: Rug[],
    deltaTime: number,
    canvasWidth: number,
    canvasHeight: number,
    onRugReturn: (rug: Rug) => void,
    getNewRug: () => Rug
  ) => {
    if (!penguin) return { penguin, rugs };

    // Update penguin physics
    const updatedPenguin = {
      ...penguin,
      y: penguin.y + penguin.velocity * (deltaTime / FIXED_TIME_STEP),
      velocity: penguin.velocity + GRAVITY * (deltaTime / FIXED_TIME_STEP),
      rotation: Math.min(Math.max(-15, penguin.velocity * 1.5), 70),
    };

    // Update rug positions
    const newRugs = rugs.map(rug => ({
      ...rug,
      x: rug.x - RUG_SPEED * (deltaTime / FIXED_TIME_STEP),
    }));

    // Remove off-screen rugs and return them to pool
    const filteredRugs = newRugs.filter(rug => {
      if (rug.x <= -GAME_CONFIG.DIMENSIONS.RUG_WIDTH) {
        onRugReturn(rug);
        return false;
      }
      return true;
    });

    // Add new rug if needed
    if (filteredRugs.length === 0 || 
        filteredRugs[filteredRugs.length - 1].x < canvasWidth - 300) {
      const newRug = getNewRug();
      newRug.x = canvasWidth;
      newRug.topHeight = Math.random() * (canvasHeight - GAME_CONFIG.DIMENSIONS.RUG_GAP - 100) + 50;
      newRug.passed = false;
      filteredRugs.push(newRug);
    }

    return {
      penguin: updatedPenguin,
      rugs: filteredRugs,
    };
  }, []);

  const checkCollision = useCallback((box1: CollisionBox, box2: CollisionBox): boolean => {
    return (
      box1.x < box2.x + box2.width &&
      box1.x + box1.width > box2.x &&
      box1.y < box2.y + box2.height &&
      box1.y + box1.height > box2.y
    );
  }, []);

  return {
    updatePhysics,
    checkCollision,
  };
}