/*
  # Fix reset_leaderboard function

  1. Changes
    - Add proper error handling
    - Add transaction support
    - Add proper return type
    - Add proper security checks
    - Add proper logging
*/

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS reset_leaderboard(text);

-- Create the reset function with proper error handling and transaction support
CREATE OR REPLACE FUNCTION reset_leaderboard(admin_wallet text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
BEGIN
  -- Verify the admin wallet is authorized
  IF NOT EXISTS (
    SELECT 1 
    FROM authorized_exporters 
    WHERE wallet_address = admin_wallet
  ) THEN
    RAISE EXCEPTION 'Unauthorized wallet address: %', admin_wallet;
  END IF;

  -- Start transaction
  BEGIN
    -- Delete all records from the leaderboard
    DELETE FROM leaderboard;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    
    -- Log the reset
    INSERT INTO admin_logs (action, admin_wallet, details)
    VALUES ('reset_leaderboard', admin_wallet, format('Deleted %s records', v_count));
    
    -- Commit transaction
    RETURN;
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error and re-raise
      RAISE EXCEPTION 'Failed to reset leaderboard: %', SQLERRM;
  END;
END;
$$;