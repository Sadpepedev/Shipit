/*
  # Create leaderboard table for Flappy Penguin

  1. New Tables
    - `leaderboard`
      - `id` (uuid, primary key)
      - `player_name` (text)
      - `score` (integer)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `leaderboard` table
    - Add policies for:
      - Anyone can read leaderboard entries
      - Authenticated users can insert their own scores
*/

CREATE TABLE IF NOT EXISTS leaderboard (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name text NOT NULL,
  score integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read leaderboard entries
CREATE POLICY "Anyone can read leaderboard"
  ON leaderboard
  FOR SELECT
  TO public
  USING (true);

-- Allow authenticated users to insert scores
CREATE POLICY "Users can insert their scores"
  ON leaderboard
  FOR INSERT
  TO authenticated
  WITH CHECK (true);