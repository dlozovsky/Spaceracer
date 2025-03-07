/**
 * Supabase Configuration Template
 * 
 * HOW TO USE THIS FILE:
 * 1. Copy this file and rename it to "supabase-config.js"
 * 2. Replace the placeholder values below with your actual Supabase credentials
 * 3. Save the file
 * 
 * WHERE TO FIND YOUR CREDENTIALS:
 * 1. Go to your Supabase project dashboard (https://app.supabase.io)
 * 2. Click on "Settings" (gear icon) in the left sidebar
 * 3. Click on "API" in the settings menu
 * 4. Copy your "Project URL" and "anon/public" key
 */

const SUPABASE_CONFIG = {
  // Replace with your actual Supabase URL (e.g., 'https://abcdefghijklm.supabase.co')
  url: 'YOUR_SUPABASE_URL',
  
  // Replace with your actual Supabase anon key (starts with 'eyJ...')
  key: 'YOUR_SUPABASE_ANON_KEY'
};

// Don't modify below this line
(function() {
  // Make the config available globally
  window.SUPABASE_CONFIG = SUPABASE_CONFIG;
})(); 