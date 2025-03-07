-- Create a public view of the leaderboard that excludes email addresses
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

-- Add comment to the view
COMMENT ON VIEW leaderboard_public IS 'Public view of the leaderboard without sensitive information'; 