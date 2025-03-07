/**
 * Supabase Queries for Space Racer Game
 * 
 * This file contains all the Supabase queries used in the Space Racer game.
 * Import or copy these functions into your game.js file as needed.
 */

// Initialize Supabase client using the external config
function initSupabase() {
  try {
    // Check if the config is available
    if (window.SUPABASE_CONFIG) {
      const supabase = window.supabase.createClient(
        window.SUPABASE_CONFIG.url, 
        window.SUPABASE_CONFIG.key
      );
      console.log("Supabase initialized successfully");
      return supabase;
    } else {
      console.error("Supabase config not found. Make sure supabase-config.js is loaded before this file.");
      return null;
    }
  } catch (error) {
    console.error("Failed to initialize Supabase:", error);
    return null;
  }
}

// Fetch leaderboard data (top 10 scores)
async function fetchLeaderboard(supabase) {
  if (!supabase) {
    return { 
      data: null, 
      error: new Error('Supabase not initialized') 
    };
  }
  
  try {
    const { data, error } = await supabase
      .from('leaderboard_public')
      .select('*')
      .order('score', { ascending: false })
      .limit(10);
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return { 
      data: null, 
      error: new Error('Failed to load leaderboard. Please try again.') 
    };
  }
}

// Submit a new score
async function submitScore(supabase, playerName, email, score, waveReached) {
  if (!supabase) {
    return { 
      success: false, 
      error: new Error('Supabase not initialized') 
    };
  }
  
  if (!playerName || !email) {
    return { 
      success: false, 
      error: new Error('Please enter both name and email.') 
    };
  }
  
  // Simple email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { 
      success: false, 
      error: new Error('Please enter a valid email address.') 
    };
  }
  
  try {
    const { error } = await supabase
      .from('leaderboard')
      .insert([{ 
        player_name: playerName, 
        email: email, 
        score: score,
        wave_reached: waveReached
      }]);
    
    if (error) throw error;
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error submitting score:', error);
    return { 
      success: false, 
      error: new Error('Failed to submit score. Please try again.') 
    };
  }
}

// Fetch weekly leaderboard (requires the optional weekly leaderboard function)
async function fetchWeeklyLeaderboard(supabase) {
  if (!supabase) {
    return { 
      data: null, 
      error: new Error('Supabase not initialized') 
    };
  }
  
  try {
    const { data, error } = await supabase
      .rpc('get_weekly_leaderboard')
      .limit(10);
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching weekly leaderboard:', error);
    return { 
      data: null, 
      error: new Error('Failed to load weekly leaderboard. Please try again.') 
    };
  }
}

// Fetch a player's personal best scores
async function fetchPlayerBestScores(supabase, playerName) {
  if (!supabase || !playerName) {
    return { 
      data: null, 
      error: new Error('Supabase not initialized or player name not provided') 
    };
  }
  
  try {
    const { data, error } = await supabase
      .from('leaderboard_public')
      .select('*')
      .eq('player_name', playerName)
      .order('score', { ascending: false })
      .limit(5);
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching player scores:', error);
    return { 
      data: null, 
      error: new Error('Failed to load player scores. Please try again.') 
    };
  }
}

// Check if Supabase is properly configured
async function testSupabaseConnection(supabase) {
  if (!supabase) {
    return { 
      connected: false, 
      error: new Error('Supabase not initialized') 
    };
  }
  
  try {
    // Try to fetch a single row from the public view
    const { data, error } = await supabase
      .from('leaderboard_public')
      .select('id')
      .limit(1);
    
    if (error) throw error;
    
    return { connected: true, error: null };
  } catch (error) {
    console.error('Supabase connection test failed:', error);
    return { 
      connected: false, 
      error: new Error('Failed to connect to Supabase. Please check your credentials.') 
    };
  }
} 