/**
 * SPOTIFY API CONFIGURATION
 *
 * This file centralizes all Spotify API settings and credentials.
 * It defines what permissions we need and which endpoints to use.
 *
 * Security Note: All sensitive data comes from environment variables,
 * never hardcoded values that could be exposed in version control.
 */

const spotifyConfig = {
  // App credentials from Spotify Developer Dashboard
  clientId: process.env.SPOTIFY_CLIENT_ID,         // Public identifier for my app
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET, // Secret key (never expose this!)
  redirectUri: process.env.REDIRECT_URI,           // Where Spotify sends users after login

  /**
   * OAUTH SCOPES - What permissions we request from users
   *
   * These determine what data we can access from their Spotify account
   * Note: Recommendations API doesn't require special scopes, just a valid token
   */
  scopes: [
    'user-read-private',          // Access to user's profile info
    'user-read-email',            // Access to user's email address
    'user-top-read',              // Access to user's top tracks and artists
    'user-read-playback-state'    // Access to audio features (required for mood analysis)
  ],

  // Spotify OAuth endpoints
  authUrl: 'https://accounts.spotify.com/authorize',    // Where we send users to login
  tokenUrl: 'https://accounts.spotify.com/api/token',   // Where we exchange code for tokens
  apiBaseUrl: 'https://api.spotify.com/v1'              // Base URL for all Spotify API calls
};

module.exports = spotifyConfig;
