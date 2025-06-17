/**
 * MUSIC RECOMMENDATION ROUTES
 *
 * This file handles all music-related API endpoints:
 * - /recommendations - Get mood-based track recommendations from Spotify
 * - /moods - Get list of available moods and their descriptions
 *
 * The main magic happens in /recommendations where we:
 * 1. Take a mood parameter from the user
 * 2. Convert it to Spotify audio features using our mood mapper
 * 3. Call Spotify's recommendations API with those features
 * 4. Return formatted track data to the frontend
 */

const express = require('express');
const axios = require('axios');                                    // For HTTP requests to Spotify API
const querystring = require('querystring');                       // For building URL parameters
const spotifyConfig = require('../config/spotify');               // Spotify API configuration
const { getMoodFeatures, getSupportedMoods } = require('../config/moodMapper');  // Our mood logic

const router = express.Router();

/**
 * AUTHENTICATION MIDDLEWARE
 *
 * This function runs before protected routes to ensure the user is logged in.
 * It checks if they have a valid Spotify access token that hasn't expired.
 */
function requireAuth(req, res, next) {
  // Check if user has a token and it hasn't expired
  if (!req.session.access_token || req.session.token_expires_at <= Date.now()) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please login with Spotify first',
      loginUrl: '/login'
    });
  }
  // User is authenticated, continue to the route
  next();
}

/**
 * RECOMMENDATIONS ENDPOINT: /recommendations?mood=happy&limit=10
 *
 * This is the core feature! It takes a mood and returns Spotify tracks that match.
 *
 * Process:
 * 1. Validate user is logged in (requireAuth middleware)
 * 2. Get mood parameter from URL
 * 3. Convert mood to Spotify audio features
 * 4. Call Spotify's recommendations API
 * 5. Format and return track data
 */
router.get('/recommendations', requireAuth, async (req, res) => {
  try {
    // Extract parameters from the URL query string
    const { mood, limit = 20 } = req.query;

    // Validate that mood parameter was provided
    if (!mood) {
      return res.status(400).json({
        error: 'Mood parameter is required',
        supportedMoods: getSupportedMoods()
      });
    }

    // Convert the mood to Spotify audio features
    let moodFeatures;
    try {
      moodFeatures = getMoodFeatures(mood);  // This is where the magic happens!
    } catch (error) {
      // Handle invalid mood (not in our supported list)
      return res.status(400).json({
        error: error.message,
        supportedMoods: getSupportedMoods()
      });
    }

    // Use absolute minimal parameters - just what Spotify requires
    // Spotify requires at least one seed parameter (genres, artists, or tracks)
    const params = {
      limit: Math.min(parseInt(limit) || 10, 50),  // Spotify max is 50
      seed_genres: 'pop'  // Use single reliable genre first
    };

    // Add mood features to the parameters
    Object.assign(params, moodFeatures);

    const recommendationsUrl = `${spotifyConfig.apiBaseUrl}/recommendations?${querystring.stringify(params)}`;

    console.log('🎵 Requesting recommendations:', recommendationsUrl);
    console.log('🎭 Params used:', params);
    console.log('🔑 Token length:', req.session.access_token ? req.session.access_token.length : 'NO TOKEN');
    console.log('🔑 Token starts with:', req.session.access_token ? req.session.access_token.substring(0, 20) + '...' : 'NO TOKEN');

    // First, let's test if the user profile API works (this should always work if token is valid)
    try {
      const profileTest = await axios.get(`${spotifyConfig.apiBaseUrl}/me`, {
        headers: {
          'Authorization': `Bearer ${req.session.access_token}`
        }
      });
      console.log('✅ Profile API test passed for user:', profileTest.data.display_name);
    } catch (profileError) {
      console.log('❌ Profile API test failed:', profileError.response?.status, profileError.response?.data);
      throw new Error('Token validation failed');
    }

    const response = await axios.get(recommendationsUrl, {
      headers: {
        'Authorization': `Bearer ${req.session.access_token}`
      }
    });

    const tracks = response.data.tracks.map(track => ({
      id: track.id,
      name: track.name,
      artists: track.artists.map(artist => artist.name),
      album: track.album.name,
      preview_url: track.preview_url,
      external_urls: track.external_urls,
      duration_ms: track.duration_ms,
      popularity: track.popularity
    }));

    res.json({
      mood,
      moodFeatures,
      tracks,
      total: tracks.length
    });

  } catch (error) {
    console.error('❌ Error fetching recommendations:', error.response?.data || error.message);
    console.error('🔍 Request URL was:', `${spotifyConfig.apiBaseUrl}/recommendations`);
    console.error('🔍 Status:', error.response?.status);
    console.error('🔍 Spotify Error Details:', JSON.stringify(error.response?.data, null, 2));

    if (error.response?.status == 401) {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Please login again',
        loginUrl: '/login'
      });
    }

    // For now, fall back to mock data when Spotify API fails
    console.log('🎭 Falling back to mock recommendations for mood:', mood);

    const mockTracks = {
      happy: [
        { id: '1', name: 'Happy Song', artists: ['Happy Artist'], album: 'Joy Album', external_urls: { spotify: '#' }, preview_url: null, duration_ms: 180000, popularity: 85 },
        { id: '2', name: 'Sunshine Day', artists: ['Bright Band'], album: 'Sunny Times', external_urls: { spotify: '#' }, preview_url: null, duration_ms: 200000, popularity: 78 },
        { id: '3', name: 'Good Vibes', artists: ['Positive People'], album: 'Feel Good', external_urls: { spotify: '#' }, preview_url: null, duration_ms: 195000, popularity: 82 }
      ],
      sad: [
        { id: '4', name: 'Melancholy Blues', artists: ['Sad Singer'], album: 'Tears', external_urls: { spotify: '#' }, preview_url: null, duration_ms: 240000, popularity: 70 },
        { id: '5', name: 'Rainy Day', artists: ['Moody Musicians'], album: 'Gray Skies', external_urls: { spotify: '#' }, preview_url: null, duration_ms: 220000, popularity: 65 },
        { id: '6', name: 'Empty Heart', artists: ['Lonely Lyrics'], album: 'Solitude', external_urls: { spotify: '#' }, preview_url: null, duration_ms: 210000, popularity: 68 }
      ],
      energetic: [
        { id: '7', name: 'Power Workout', artists: ['Energy Band'], album: 'Pump It Up', external_urls: { spotify: '#' }, preview_url: null, duration_ms: 180000, popularity: 90 },
        { id: '8', name: 'High Intensity', artists: ['Adrenaline Rush'], album: 'Maximum Energy', external_urls: { spotify: '#' }, preview_url: null, duration_ms: 175000, popularity: 88 },
        { id: '9', name: 'Beast Mode', artists: ['Workout Warriors'], album: 'Gym Hits', external_urls: { spotify: '#' }, preview_url: null, duration_ms: 190000, popularity: 85 }
      ],
      relaxed: [
        { id: '10', name: 'Peaceful Mind', artists: ['Calm Collective'], album: 'Serenity', external_urls: { spotify: '#' }, preview_url: null, duration_ms: 300000, popularity: 75 },
        { id: '11', name: 'Gentle Breeze', artists: ['Tranquil Tunes'], album: 'Meditation', external_urls: { spotify: '#' }, preview_url: null, duration_ms: 280000, popularity: 72 },
        { id: '12', name: 'Soft Whispers', artists: ['Quiet Quartet'], album: 'Stillness', external_urls: { spotify: '#' }, preview_url: null, duration_ms: 320000, popularity: 70 }
      ],
      focused: [
        { id: '13', name: 'Deep Concentration', artists: ['Focus Flow'], album: 'Productivity', external_urls: { spotify: '#' }, preview_url: null, duration_ms: 360000, popularity: 68 },
        { id: '14', name: 'Study Session', artists: ['Brain Beats'], album: 'Mental Clarity', external_urls: { spotify: '#' }, preview_url: null, duration_ms: 400000, popularity: 65 },
        { id: '15', name: 'Work Zone', artists: ['Concentration Crew'], album: 'Flow State', external_urls: { spotify: '#' }, preview_url: null, duration_ms: 380000, popularity: 70 }
      ],
      romantic: [
        { id: '16', name: 'Love Ballad', artists: ['Romance Records'], album: 'Heart Songs', external_urls: { spotify: '#' }, preview_url: null, duration_ms: 250000, popularity: 80 },
        { id: '17', name: 'Sweet Serenade', artists: ['Cupid\'s Choir'], album: 'Valentine Vibes', external_urls: { spotify: '#' }, preview_url: null, duration_ms: 230000, popularity: 77 },
        { id: '18', name: 'Tender Moments', artists: ['Loving Lyrics'], album: 'Intimate', external_urls: { spotify: '#' }, preview_url: null, duration_ms: 270000, popularity: 75 }
      ]
    };

    const tracks = mockTracks[mood.toLowerCase()] || mockTracks.happy;

    res.json({
      mood,
      moodFeatures,
      tracks,
      total: tracks.length,
      message: 'Using demo data - Spotify API temporarily unavailable'
    });
  }
});

/**
 * Get available moods
 */
router.get('/moods', (req, res) => {
  res.json({
    moods: getSupportedMoods(),
    descriptions: {
      happy: 'High energy, positive vibes',
      sad: 'Low energy, melancholic tracks',
      energetic: 'High energy, danceable music',
      relaxed: 'Calm, low tempo tracks',
      focused: 'Instrumental, concentration music',
      romantic: 'Love songs and romantic ballads'
    }
  });
});

/**
 * Mock recommendations for demo purposes
 * This always works and shows the UI functioning
 */
router.get('/mock-recommendations', (req, res) => {
  const { mood = 'happy' } = req.query;

  const mockTracks = {
    happy: [
      { id: '1', name: 'Happy Song', artists: ['Upbeat Artist'], album: 'Feel Good Album', external_urls: { spotify: '#' } },
      { id: '2', name: 'Sunshine Vibes', artists: ['Positive Band'], album: 'Good Mood Music', external_urls: { spotify: '#' } },
      { id: '3', name: 'Joy & Energy', artists: ['Happy Collective'], album: 'Smile Songs', external_urls: { spotify: '#' } }
    ],
    sad: [
      { id: '4', name: 'Melancholy Blues', artists: ['Sad Singer'], album: 'Emotional Journey', external_urls: { spotify: '#' } },
      { id: '5', name: 'Rainy Day', artists: ['Moody Artist'], album: 'Tears & Rain', external_urls: { spotify: '#' } },
      { id: '6', name: 'Lonely Nights', artists: ['Heartbreak Band'], album: 'Sad Songs', external_urls: { spotify: '#' } }
    ],
    energetic: [
      { id: '7', name: 'Power Workout', artists: ['Energy Band'], album: 'Pump It Up', external_urls: { spotify: '#' } },
      { id: '8', name: 'High Intensity', artists: ['Adrenaline Rush'], album: 'Maximum Energy', external_urls: { spotify: '#' } },
      { id: '9', name: 'Beast Mode', artists: ['Workout Warriors'], album: 'Gym Hits', external_urls: { spotify: '#' } }
    ]
  };

  const tracks = mockTracks[mood.toLowerCase()] || mockTracks.happy;

  res.json({
    mood,
    tracks,
    total: tracks.length,
    message: 'Mock data for demonstration'
  });
});

/**
 * Get available genres from Spotify
 */
router.get('/genres', requireAuth, async (req, res) => {
  try {
    const genresResponse = await axios.get(`${spotifyConfig.apiBaseUrl}/recommendations/available-genre-seeds`, {
      headers: {
        'Authorization': `Bearer ${req.session.access_token}`
      }
    });

    res.json({
      genres: genresResponse.data.genres,
      total: genresResponse.data.genres.length
    });
  } catch (error) {
    console.error('❌ Error fetching genres:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to fetch genres',
      message: error.message
    });
  }
});

/**
 * Test endpoint to verify Spotify API access
 */
router.get('/test-spotify', requireAuth, async (req, res) => {
  try {
    console.log('🧪 Testing Spotify API access...');
    console.log('🔑 Token:', req.session.access_token ? 'EXISTS' : 'MISSING');

    // Test 1: Get user profile (this should always work)
    const profileUrl = `${spotifyConfig.apiBaseUrl}/me`;
    console.log('🔗 Testing profile URL:', profileUrl);

    const profileResponse = await axios.get(profileUrl, {
      headers: {
        'Authorization': `Bearer ${req.session.access_token}`
      }
    });

    console.log('✅ Profile API works!');

    // Test 2: Get available genres first
    const genresResponse = await axios.get(`${spotifyConfig.apiBaseUrl}/recommendations/available-genre-seeds`, {
      headers: {
        'Authorization': `Bearer ${req.session.access_token}`
      }
    });

    console.log('✅ Genres API works! Available genres:', genresResponse.data.genres.slice(0, 5));

    // Test 3: Try recommendations with a single valid genre
    const recsUrl = `${spotifyConfig.apiBaseUrl}/recommendations?limit=1&seed_genres=pop`;
    console.log('🔗 Testing recommendations URL:', recsUrl);

    const recsResponse = await axios.get(recsUrl, {
      headers: {
        'Authorization': `Bearer ${req.session.access_token}`
      }
    });

    console.log('✅ Recommendations API works!');

    res.json({
      success: true,
      message: 'All APIs working!',
      profile: profileResponse.data.display_name,
      availableGenres: genresResponse.data.genres.length,
      trackCount: recsResponse.data.tracks.length,
      firstTrack: recsResponse.data.tracks[0]?.name || 'No tracks'
    });

  } catch (error) {
    console.error('🧪 Test failed:', error.response?.status, error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      status: error.response?.status,
      details: error.response?.data
    });
  }
});

module.exports = router;
