-- Create a function to get weekly leaderboards
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

-- Add comment to the function
COMMENT ON FUNCTION get_weekly_leaderboard IS 'Returns the leaderboard for a specific week'; 