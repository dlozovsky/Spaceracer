/**
 * Update Supabase Config
 * 
 * This script will update your supabase-config.js file with the correct credentials.
 * 
 * HOW TO USE:
 * 1. Replace the URL and KEY values below with your actual Supabase credentials
 * 2. Run this script in your browser console or in Node.js
 * 3. It will generate the correct supabase-config.js content
 */

// ======= REPLACE THESE VALUES =======
const SUPABASE_URL = "https://your-actual-project-id.supabase.co";
const SUPABASE_KEY = "your-actual-anon-key";
// ===================================

// Generate the config file content
const configContent = `/**
 * Supabase Configuration
 * 
 * This file contains your Supabase project credentials.
 */

const SUPABASE_CONFIG = {
  url: '${SUPABASE_URL}',
  key: '${SUPABASE_KEY}'
};

// Don't modify below this line
(function() {
  // Make the config available globally
  window.SUPABASE_CONFIG = SUPABASE_CONFIG;
})();`;

// In a browser environment, copy to clipboard
if (typeof navigator !== 'undefined' && navigator.clipboard) {
  navigator.clipboard.writeText(configContent)
    .then(() => console.log('Config copied to clipboard! Paste this into your supabase-config.js file.'))
    .catch(err => console.error('Failed to copy:', err));
}

// Output the content
console.log("=== SUPABASE CONFIG CONTENT ===");
console.log(configContent);
console.log("==============================");
console.log("Copy the above content and paste it into your supabase-config.js file"); 