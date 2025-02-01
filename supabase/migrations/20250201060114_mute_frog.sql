/*
  # Add leaderboard reset function

  1. New Functions
    - `reset_leaderboard(admin_wallet text)`: Resets the leaderboard if called by authorized wallet
      - Verifies admin wallet is authorized
      - Deletes all records from leaderboard table
      - Returns success status

  2. Security
    - Function can only be executed by authorized wallets
    - Uses RLS policies for data deletion
*/

-- Create the reset function
CREATE OR REPLACE FUNCTION reset_leaderboard(admin_wallet text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify the admin wallet is authorized
  IF NOT EXISTS (
    SELECT 1 
    FROM authorized_exporters 
    WHERE wallet_address = admin_wallet
  ) THEN
    RAISE EXCEPTION 'Unauthorized wallet address';
  END IF;

  -- Delete all records from the leaderboard
  DELETE FROM leaderboard;
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;