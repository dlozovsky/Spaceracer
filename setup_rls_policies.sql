-- Enable Row Level Security on the leaderboard table
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read the leaderboard data
CREATE POLICY "Allow public read access" 
ON leaderboard 
FOR SELECT 
USING (true);

-- Create policy to allow anyone to insert new scores
CREATE POLICY "Allow public insert access" 
ON leaderboard 
FOR INSERT 
WITH CHECK (true);

-- Create policy to prevent updates to existing scores (optional)
CREATE POLICY "Prevent score updates" 
ON leaderboard 
FOR UPDATE 
USING (false);

-- Create policy to prevent deletion of scores (optional)
CREATE POLICY "Prevent score deletion" 
ON leaderboard 
FOR DELETE 
USING (false); 