/*
  # Add Export Permissions

  1. New Tables
    - `authorized_exporters`
      - `wallet_address` (text, primary key)
      - `created_at` (timestamp)
      - `created_by` (text)

  2. Security
    - Enable RLS on `authorized_exporters` table
    - Add policy for public to read authorized exporters
    - Add initial authorized wallet
*/

CREATE TABLE IF NOT EXISTS authorized_exporters (
  wallet_address text PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  created_by text
);

ALTER TABLE authorized_exporters ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read authorized exporters
CREATE POLICY "Anyone can read authorized exporters"
  ON authorized_exporters
  FOR SELECT
  TO public
  USING (true);

-- Insert initial authorized wallet
INSERT INTO authorized_exporters (wallet_address, created_by)
VALUES ('0xC512a2dF09b4b22ED44C1Bb3fAd60643BA9e2643', 'system')
ON CONFLICT (wallet_address) DO NOTHING;