-- Create the main leaderboard table
CREATE TABLE leaderboard (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    player_name TEXT NOT NULL,
    email TEXT NOT NULL,
    score INTEGER NOT NULL,
    wave_reached INTEGER NOT NULL
);

-- Add comment to the table
COMMENT ON TABLE leaderboard IS 'Stores player scores and information for the Space Racer game';

-- Add comments to columns
COMMENT ON COLUMN leaderboard.id IS 'Unique identifier for each score entry';
COMMENT ON COLUMN leaderboard.created_at IS 'Timestamp when the score was submitted';
COMMENT ON COLUMN leaderboard.player_name IS 'Player display name';
COMMENT ON COLUMN leaderboard.email IS 'Player email address (private)';
COMMENT ON COLUMN leaderboard.score IS 'Player score achieved in the game';
COMMENT ON COLUMN leaderboard.wave_reached IS 'Highest wave number reached by the player'; 