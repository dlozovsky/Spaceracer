-- Create an index on the score column for faster sorting and retrieval
CREATE INDEX idx_leaderboard_score ON leaderboard (score DESC);

-- Create an index on player_name for potential future queries
CREATE INDEX idx_leaderboard_player_name ON leaderboard (player_name);

-- Create a composite index on score and created_at for time-based leaderboards
CREATE INDEX idx_leaderboard_score_date ON leaderboard (score DESC, created_at DESC); 