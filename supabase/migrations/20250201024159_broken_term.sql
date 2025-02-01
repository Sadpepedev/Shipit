/*
  # Add wallet address to leaderboard table

  1. Changes
    - Add wallet_address column to leaderboard table
    - Make wallet_address optional to maintain compatibility with existing records
    - Add index on wallet_address for faster lookups

  2. Security
    - Maintain existing RLS policies
*/

-- Add wallet_address column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leaderboard' AND column_name = 'wallet_address'
  ) THEN
    ALTER TABLE leaderboard 
    ADD COLUMN wallet_address text;

    -- Add index for wallet_address lookups
    CREATE INDEX IF NOT EXISTS idx_leaderboard_wallet_address 
    ON leaderboard(wallet_address);
  END IF;
END $$;