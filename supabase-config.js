/**
 * Supabase Configuration
 * 
 * This file contains your Supabase project credentials.
 * Keep this file secure and don't commit it to public repositories.
 * 
 * ⚠️ IMPORTANT: You must replace the placeholder values below with your actual
 * Supabase URL and anon key from your Supabase project dashboard.
 * The game will not connect to Supabase until you do this!
 */

const SUPABASE_CONFIG = {
  url: 'https://pmzqpebsacxtaltqsxbh.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtenFwZWJzYWN4dGFsdHFzeGJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExOTc3MTcsImV4cCI6MjA1Njc3MzcxN30.bZvjRti-TuRZe6wzB7kVOJ2eZPBirofXdityjvJRjXA'
};

// Don't modify below this line
(function() {
  // Make the config available globally
  window.SUPABASE_CONFIG = SUPABASE_CONFIG;
})(); 