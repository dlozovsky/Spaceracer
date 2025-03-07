-- Complete Supabase Setup Script for Space Racer Game
-- Run this script in the Supabase SQL Editor to set up all required database objects

-- 1. Create the main leaderboard table
CREATE TABLE leaderboard (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    player_name TEXT NOT NULL,
    email TEXT NOT NULL,
    score INTEGER NOT NULL,
    wave_reached INTEGER NOT NULL
);

COMMENT ON TABLE leaderboard IS 'Stores player scores and information for the Space Racer game';
COMMENT ON COLUMN leaderboard.id IS 'Unique identifier for each score entry';
COMMENT ON COLUMN leaderboard.created_at IS 'Timestamp when the score was submitted';
COMMENT ON COLUMN leaderboard.player_name IS 'Player display name';
COMMENT ON COLUMN leaderboard.email IS 'Player email address (private)';
COMMENT ON COLUMN leaderboard.score IS 'Player score achieved in the game';
COMMENT ON COLUMN leaderboard.wave_reached IS 'Highest wave number reached by the player';

-- 2. Create indexes for better performance
CREATE INDEX idx_leaderboard_score ON leaderboard (score DESC);
CREATE INDEX idx_leaderboard_player_name ON leaderboard (player_name);
CREATE INDEX idx_leaderboard_score_date ON leaderboard (score DESC, created_at DESC);

-- 3. Create a public view of the leaderboard that excludes email addresses
CREATE VIEW leaderboard_public AS
SELECT 
    id,
    created_at,
    player_name,
    score,
    wave_reached
FROM 
    leaderboard
ORDER BY 
    score DESC;

COMMENT ON VIEW leaderboard_public IS 'Public view of the leaderboard without sensitive information';

-- 4. Enable Row Level Security on the leaderboard table
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies
-- Allow anyone to read the leaderboard data
CREATE POLICY "Allow public read access" 
ON leaderboard 
FOR SELECT 
USING (true);

-- Allow anyone to insert new scores
CREATE POLICY "Allow public insert access" 
ON leaderboard 
FOR INSERT 
WITH CHECK (true);

-- Prevent updates to existing scores
CREATE POLICY "Prevent score updates" 
ON leaderboard 
FOR UPDATE 
USING (false);

-- Prevent deletion of scores
CREATE POLICY "Prevent score deletion" 
ON leaderboard 
FOR DELETE 
USING (false);

-- 6. Create a function for weekly leaderboards (optional)
CREATE OR REPLACE FUNCTION get_weekly_leaderboard(week_start DATE DEFAULT date_trunc('week', CURRENT_DATE)::DATE)
RETURNS TABLE (
    id UUID,
    player_name TEXT,
    score INTEGER,
    wave_reached INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    rank BIGINT
) 
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT 
        id,
        player_name,
        score,
        wave_reached,
        created_at,
        ROW_NUMBER() OVER (ORDER BY score DESC) as rank
    FROM 
        leaderboard
    WHERE 
        created_at >= week_start AND 
        created_at < (week_start + INTERVAL '7 days')
    ORDER BY 
        score DESC
    LIMIT 100;
$$;

-- Create a view for the current week's leaderboard
CREATE OR REPLACE VIEW weekly_leaderboard AS
SELECT * FROM get_weekly_leaderboard();

COMMENT ON FUNCTION get_weekly_leaderboard IS 'Returns the leaderboard for a specific week';

-- 7. Insert some sample data (optional)
INSERT INTO leaderboard (player_name, email, score, wave_reached)
VALUES 
    ('SpaceMaster', 'sample1@example.com', 5000, 10),
    ('StarRacer', 'sample2@example.com', 4500, 9),
    ('CosmicPilot', 'sample3@example.com', 4200, 8),
    ('GalaxyHero', 'sample4@example.com', 3800, 7),
    ('AsteroidDodger', 'sample5@example.com', 3500, 7);

-- Done! Your Supabase database is now set up for the Space Racer game. 