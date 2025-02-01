import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Leaderboard from '../components/Leaderboard';
import { supabase } from '../lib/supabase';

// Mock Supabase client
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => ({
            data: [
              {
                id: '1',
                player_name: 'Test Player',
                score: 100,
                created_at: new Date().toISOString(),
              },
            ],
          })),
        })),
      })),
    })),
    channel: vi.fn(() => ({
      on: vi.fn(() => ({
        subscribe: vi.fn(),
      })),
    })),
  },
}));

describe('Leaderboard Component', () => {
  it('renders leaderboard with scores', async () => {
    render(<Leaderboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Player')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    render(<Leaderboard />);
    expect(screen.getByText(/Loading scores/i)).toBeInTheDocument();
  });

  it('handles empty leaderboard', async () => {
    vi.mocked(supabase.from).mockImplementationOnce(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => ({
            data: [],
          })),
        })),
      })),
    }));

    render(<Leaderboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/No scores yet/i)).toBeInTheDocument();
    });
  });
});