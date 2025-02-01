/*
  # Fix reset_leaderboard function DELETE clause

  1. Changes
    - Add proper WHERE clause for DELETE operation
    - Remove admin_logs dependency since it's not created
    - Simplify error handling
*/

-- Drop the existing function
DROP FUNCTION IF EXISTS reset_leaderboard(text);

-- Create the reset function with proper DELETE clause
CREATE OR REPLACE FUNCTION reset_leaderboard(admin_wallet text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify the admin wallet is authorized
  IF NOT EXISTS (
    SELECT 1 
    FROM authorized_exporters 
    WHERE wallet_address = admin_wallet
  ) THEN
    RAISE EXCEPTION 'Unauthorized wallet address: %', admin_wallet;
  END IF;

  -- Delete all records from the leaderboard with a WHERE clause
  DELETE FROM leaderboard
  WHERE id IS NOT NULL;
  
  RETURN;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to reset leaderboard: %', SQLERRM;
END;
$$;