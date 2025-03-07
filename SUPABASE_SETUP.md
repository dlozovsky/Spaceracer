# Supabase Setup for Space Racer Game

This document provides instructions for setting up Supabase as the backend for your Space Racer game.

## Prerequisites

1. A Supabase account (sign up at [supabase.com](https://supabase.com) if you don't have one)
2. A new Supabase project created

## Setup Instructions

### Option 1: Complete Setup (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor (in the left sidebar)
3. Create a new query
4. Copy and paste the entire contents of `complete_setup.sql` into the editor
5. Click "Run" to execute the script
6. All necessary database objects will be created in one go

### Option 2: Step-by-Step Setup

If you prefer to set up your database step by step, you can run each script separately in this order:

1. `create_leaderboard_table.sql` - Creates the main leaderboard table
2. `create_indexes.sql` - Adds indexes for better performance
3. `create_leaderboard_view.sql` - Creates the public view without sensitive data
4. `setup_rls_policies.sql` - Sets up Row Level Security policies
5. `create_weekly_leaderboard.sql` (Optional) - Adds weekly leaderboard functionality

## Updating Your Game Code

After setting up Supabase, you need to update your Supabase credentials:

### Option 1: Using the External Configuration File (Recommended)

The game now uses an external configuration file to store your Supabase credentials, which is more secure and easier to manage:

1. Go to your Supabase project dashboard
2. Click on "Settings" (gear icon) in the left sidebar
3. Click on "API" in the settings menu
4. Copy your "Project URL" and "anon/public" key
5. Open the `supabase-config.js` file
6. Replace the placeholder values with your actual credentials:

```javascript
const SUPABASE_CONFIG = {
  url: 'YOUR_SUPABASE_URL', // Replace with your actual Supabase URL
  key: 'YOUR_SUPABASE_ANON_KEY' // Replace with your actual Supabase anon key
};
```

### Option 2: Using the Test Tool

You can also use the included test tool to update your configuration:

1. Open the `supabase-test.html` file in your browser
2. Go to the "Configuration" tab
3. Enter your Supabase URL and anon key
4. Click "Update Config File"
5. The configuration will be updated in memory (in a real production environment, you would set up a server endpoint to update the file)

## Testing Your Setup

To test if your Supabase setup is working correctly:

1. Open the `supabase-test.html` file in your browser
2. Enter your Supabase URL and anon key
3. Click "Test Connection"
4. If successful, you should see the sample leaderboard data
5. Try submitting a test score to verify that inserts are working

## Supabase Queries Used in the Game

### Fetching the Leaderboard
```javascript
const { data, error } = await supabase
  .from('leaderboard_public')
  .select('*')
  .order('score', { ascending: false })
  .limit(10);
```

### Submitting a Score
```javascript
const { error } = await supabase
  .from('leaderboard')
  .insert([{ 
    player_name: playerNameInput, 
    email: playerEmailInput, 
    score: score,
    wave_reached: wave
  }]);
```

### Fetching Weekly Leaderboard (Optional)
```javascript
const { data, error } = await supabase
  .rpc('get_weekly_leaderboard')
  .limit(10);
```

## Troubleshooting

If you encounter any issues:

1. Check the browser console for error messages
2. Verify that your Supabase URL and anon key are correct
3. Make sure all the SQL scripts executed successfully
4. Check that RLS policies are properly configured

## Security Considerations

- The setup includes Row Level Security (RLS) policies that allow anyone to read and insert data, but prevent updates and deletions
- Email addresses are stored in the database but are not exposed through the public view
- For production use, consider implementing additional security measures like rate limiting or user authentication

## Next Steps

Once your basic leaderboard is working, consider these enhancements:

1. Add user authentication to track players across sessions
2. Implement real-time leaderboard updates using Supabase's real-time subscriptions
3. Create player profiles with statistics and achievements
4. Add game state saving for registered users 