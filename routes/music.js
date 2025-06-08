const express = require('express');
const axios = require('axios');
const querystring = require('querystring');
const spotifyConfig = require('../config/spotify');
const { getMoodFeatures, getSupportedMoods } = require('../config/moodMapper');

const router = express.Router();

/**
 * Middleware to check if user is authenticated
 */
function requireAuth(req, res, next) {
  if (!req.session.access_token || req.session.token_expires_at <= Date.now()) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'Please login with Spotify first',
      loginUrl: '/login'
    });
  }
  next();
}

/**
 * Get mood-based recommendations
 */
router.get('/recommendations', requireAuth, async (req, res) => {
  try {
    const { mood, limit = 20 } = req.query;

    if (!mood) {
      return res.status(400).json({
        error: 'Mood parameter is required',
        supportedMoods: getSupportedMoods()
      });
    }

    let moodFeatures;
    try {
      moodFeatures = getMoodFeatures(mood);
    } catch (error) {
      return res.status(400).json({
        error: error.message,
        supportedMoods: getSupportedMoods()
      });
    }

    // Build Spotify recommendations query
    const params = {
      limit: Math.min(parseInt(limit), 50), // Spotify max is 50
      market: 'US',
      ...moodFeatures
    };

    // Add some seed genres based on mood
    const genreSeeds = {
      happy: ['pop', 'dance', 'funk'],
      sad: ['indie', 'alternative', 'singer-songwriter'],
      energetic: ['electronic', 'rock', 'hip-hop'],
      relaxed: ['ambient', 'chill', 'acoustic'],
      focused: ['classical', 'ambient', 'instrumental'],
      romantic: ['r-n-b', 'soul', 'jazz']
    };

    const seeds = genreSeeds[mood.toLowerCase()] || ['pop'];
    params.seed_genres = seeds.slice(0, 5).join(','); // Max 5 seeds

    const recommendationsUrl = `${spotifyConfig.apiBaseUrl}/recommendations?${querystring.stringify(params)}`;

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
    console.error('Error fetching recommendations:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Please login again',
        loginUrl: '/login'
      });
    }

    res.status(500).json({
      error: 'Failed to fetch recommendations',
      message: error.message
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

module.exports = router;
