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

// Simple test route to verify mounting
router.get('/test', (req, res) => {
  res.json({ message: 'Music routes are working!', timestamp: new Date().toISOString() });
});

/**
 * MOOD SEARCH QUERIES
 *
 * Generate search terms to find playlists that match specific moods
 */
function getMoodSearchQueries(mood) {
  const searchQueries = {
    happy: [
      'happy music',
      'feel good songs',
      'upbeat playlist',
      'positive vibes',
      'good mood music'
    ],
    sad: [
      'sad songs',
      'melancholy music',
      'heartbreak playlist',
      'emotional ballads',
      'crying songs'
    ],
    energetic: [
      'workout music',
      'high energy songs',
      'pump up playlist',
      'gym music',
      'energetic beats'
    ],
    relaxed: [
      'chill music',
      'relaxing songs',
      'calm playlist',
      'peaceful music',
      'ambient chill'
    ],
    focused: [
      'study music',
      'focus playlist',
      'concentration music',
      'instrumental focus',
      'work music'
    ],
    romantic: [
      'love songs',
      'romantic music',
      'date night playlist',
      'romantic ballads',
      'love playlist'
    ]
  };

  return searchQueries[mood.toLowerCase()] || ['music playlist'];
}





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
router.get('/recommendations', async (req, res) => {
  console.log('🎯 Recommendations route hit!');

  // Check if user is authenticated
  if (!req.session.access_token) {
    console.log('❌ No access token found');
    return res.status(401).json({
      error: 'Not authenticated',
      message: 'Please login first',
      loginUrl: '/login'
    });
  }
  // Extract parameters from the URL query string (outside try block so accessible in catch)
  const { mood, limit = 20 } = req.query;

  // Validate that mood parameter was provided
  if (!mood) {
    return res.status(400).json({
      error: 'Mood parameter is required',
      supportedMoods: getSupportedMoods()
    });
  }

  // Convert the mood to Spotify audio features (outside try block so accessible in catch)
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

  try {

    // Use absolute minimal parameters - just what Spotify requires
    // Spotify requires at least one seed parameter (genres, artists, or tracks)
    const params = {
      limit: Math.min(parseInt(limit) || 10, 50),  // Spotify max is 50
      seed_genres: 'pop'  // Use single reliable genre first
    };

    // For now, let's try without any audio features to see if basic API works
    // We'll add mood features back once we confirm the endpoint works
    console.log('🧪 Testing basic recommendations without mood features first...');

    const recommendationsUrl = `${spotifyConfig.apiBaseUrl}/recommendations?${querystring.stringify(params)}`;

    console.log('🎵 Requesting recommendations:', recommendationsUrl);
    console.log('🎭 Params used:', JSON.stringify(params, null, 2));
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

    // Test if we can get available genres (this should work if recommendations API is available)
    try {
      const genresTest = await axios.get(`${spotifyConfig.apiBaseUrl}/recommendations/available-genre-seeds`, {
        headers: {
          'Authorization': `Bearer ${req.session.access_token}`
        }
      });
      console.log('✅ Genres API test passed, available genres:', genresTest.data.genres.length);
    } catch (genresError) {
      console.log('❌ Genres API test failed:', genresError.response?.status, genresError.response?.data);
      console.log('🔍 This suggests the recommendations API might not be available');
    }

    // Search for public playlists that match the mood
    console.log(`🔍 Searching for ${mood} playlists on Spotify...`);

    // Create search queries for the mood
    const moodSearchQueries = getMoodSearchQueries(mood);
    console.log(`🎭 Search queries for ${mood}:`, moodSearchQueries);

    // Search for playlists matching the mood
    const playlistSearchResponse = await axios.get(`${spotifyConfig.apiBaseUrl}/search`, {
      headers: {
        'Authorization': `Bearer ${req.session.access_token}`
      },
      params: {
        q: moodSearchQueries[0], // Use the first search query
        type: 'playlist',
        limit: 10,
        market: 'US'
      }
    });

    console.log(`✅ Found ${playlistSearchResponse.data.playlists.items.length} playlists for mood: ${mood}`);

    // Get tracks from the first few playlists
    let allPlaylistTracks = [];
    const validPlaylists = playlistSearchResponse.data.playlists.items.filter(playlist =>
      playlist && playlist.id && playlist.name && playlist.owner
    );
    const playlistsToCheck = validPlaylists.slice(0, 3); // Check first 3 valid playlists

    console.log(`🎵 Found ${validPlaylists.length} valid playlists, checking first ${playlistsToCheck.length}`);

    if (playlistsToCheck.length === 0) {
      return res.status(404).json({
        error: 'No playlists found',
        message: `Could not find any playlists for mood: ${mood}`,
        mood
      });
    }

    for (const playlist of playlistsToCheck) {
      try {
        console.log(`🎵 Getting tracks from playlist: "${playlist.name}" by ${playlist.owner.display_name}`);

        const playlistTracksResponse = await axios.get(`${spotifyConfig.apiBaseUrl}/playlists/${playlist.id}/tracks`, {
          headers: {
            'Authorization': `Bearer ${req.session.access_token}`
          },
          params: {
            limit: 20, // Get 20 tracks from each playlist
            fields: 'items(track(id,name,artists,album,preview_url,external_urls,duration_ms,popularity))'
          }
        });

        // Extract and format tracks
        const playlistTracks = playlistTracksResponse.data.items
          .filter(item => item.track && item.track.id) // Filter out null tracks
          .map(item => ({
            id: item.track.id,
            name: item.track.name,
            artists: item.track.artists.map(artist => artist.name),
            album: item.track.album.name,
            preview_url: item.track.preview_url,
            external_urls: item.track.external_urls,
            duration_ms: item.track.duration_ms,
            popularity: item.track.popularity,
            source_playlist: playlist.name
          }));

        allPlaylistTracks = [...allPlaylistTracks, ...playlistTracks];
        console.log(`✅ Added ${playlistTracks.length} tracks from "${playlist.name}"`);

      } catch (playlistError) {
        console.log(`⚠️ Could not get tracks from playlist "${playlist.name}":`, playlistError.response?.status);
      }
    }

    // Remove duplicates based on track ID
    const uniqueTracks = allPlaylistTracks.filter((track, index, self) =>
      index === self.findIndex(t => t.id === track.id)
    );

    console.log(`🎭 Total unique tracks found: ${uniqueTracks.length} for mood: ${mood}`);

    if (uniqueTracks.length === 0) {
      return res.status(404).json({
        error: 'No tracks found',
        message: `Could not find any tracks in playlists for mood: ${mood}`,
        mood
      });
    }

    // Shuffle and limit the results
    const shuffledTracks = uniqueTracks.sort(() => Math.random() - 0.5);
    const tracks = shuffledTracks.slice(0, params.limit).map(track => ({
      id: track.id,
      name: track.name,
      artists: track.artists,
      album: track.album,
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

    // Return the actual error instead of mock data
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch recommendations from Spotify',
      message: error.message,
      details: error.response?.data,
      mood,
      moodFeatures
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
