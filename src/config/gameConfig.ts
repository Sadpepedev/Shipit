export const GAME_CONFIG = {
  PHYSICS: {
    GRAVITY: 0.25,
    FLAP_STRENGTH: -8,
    FIXED_TIME_STEP: 1000 / 60, // 60 FPS
  },
  DIMENSIONS: {
    PENGUIN_WIDTH: 50,
    PENGUIN_HEIGHT: 50,
    RUG_WIDTH: 70,
    RUG_GAP: 250,
  },
  GAMEPLAY: {
    RUG_SPEED: 2.5,
    IMMUNITY_DURATION: 1500,
  },
  ANIMATIONS: {
    DEATH: {
      DURATION: 1500,
      PARTICLE_COUNT: 50,
      PARTICLE_SIZE: { MIN: 2, MAX: 5 },
      COLORS: ['#FF0000', '#FF5555', '#FF8888', '#FFFFFF'],
    },
    SPARKLINE: {
      MAX_POINTS: 100,
      LINE_COLOR: 'rgba(0, 255, 128, 0.2)',
      DEATH_COLOR: 'rgba(255, 0, 0, 0.5)',
      TRANSITION_DURATION: 300,
      SPACING: 5,
    },
  },
} as const;