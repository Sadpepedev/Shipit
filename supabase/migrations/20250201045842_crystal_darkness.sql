-- Create wallet_names table if it doesn't exist
CREATE TABLE IF NOT EXISTS wallet_names (
  wallet_address text PRIMARY KEY,
  player_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE wallet_names ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read wallet names
CREATE POLICY "Anyone can read wallet names"
  ON wallet_names
  FOR SELECT
  TO public
  USING (true);

-- Allow public to insert/update their own wallet names
CREATE POLICY "Users can manage their own wallet names"
  ON wallet_names
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_wallet_names_updated_at
  BEFORE UPDATE ON wallet_names
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();