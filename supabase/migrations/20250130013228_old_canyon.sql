/*
  # Update leaderboard RLS policies

  1. Security Changes
    - Add policy for public insert access (since we're using anon key)
    - Existing policies remain unchanged
*/

-- Drop the authenticated-only insert policy if it exists
DROP POLICY IF EXISTS "Users can insert their scores" ON leaderboard;

-- Add new public insert policy
CREATE POLICY "Anyone can insert scores"
  ON leaderboard
  FOR INSERT
  TO public
  WITH CHECK (true);