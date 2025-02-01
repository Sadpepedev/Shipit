import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Game from '../components/Game';
import { useGameStore } from '../store/gameStore';

// Mock canvas operations
const mockContext = {
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  beginPath: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  createLinearGradient: vi.fn(() => ({
    addColorStop: vi.fn(),
  })),
};

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(mockContext as any);
});

describe('Game Component', () => {
  it('renders game canvas', () => {
    render(<Game />);
    const canvas = screen.getByRole('presentation');
    expect(canvas).toBeInTheDocument();
    expect(canvas.tagName.toLowerCase()).toBe('canvas');
  });

  it('responds to space bar for flapping', async () => {
    const user = userEvent.setup();
    render(<Game />);
    
    useGameStore.setState({ isPlaying: true, gameOver: false });
    
    await user.keyboard(' ');
    
    // Verify game physics were updated
    expect(mockContext.clearRect).toHaveBeenCalled();
    expect(mockContext.drawImage).toHaveBeenCalled();
  });

  it('shows game over screen when game ends', () => {
    useGameStore.setState({ isPlaying: true, gameOver: true, score: 10 });
    
    render(<Game />);
    
    expect(screen.getByText(/RUGGED!/i)).toBeInTheDocument();
    expect(screen.getByText(/Final Score: 10/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /I can beat that!/i })).toBeInTheDocument();
  });

  it('pauses game when escape is pressed', async () => {
    const user = userEvent.setup();
    render(<Game />);
    
    useGameStore.setState({ isPlaying: true, gameOver: false });
    
    await user.keyboard('{Escape}');
    
    expect(screen.getByText(/PAUSED/i)).toBeInTheDocument();
  });
});