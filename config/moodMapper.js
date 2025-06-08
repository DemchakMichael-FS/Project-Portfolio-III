/**
 * Maps mood strings to Spotify audio feature parameters
 * @param {string} mood - The mood to map
 * @returns {object} Spotify audio features for the given mood
 */
function getMoodFeatures(mood) {
  const moodMap = {
    happy: {
      target_valence: 0.8,      // High positivity
      target_energy: 0.8,       // High energy
      target_danceability: 0.7, // Danceable
      min_valence: 0.6,
      min_energy: 0.6,
      max_valence: 1.0,
      max_energy: 1.0
    },
    sad: {
      target_valence: 0.2,      // Low positivity
      target_energy: 0.3,       // Low energy
      target_danceability: 0.3, // Less danceable
      min_valence: 0.0,
      min_energy: 0.0,
      max_valence: 0.4,
      max_energy: 0.5
    },
    energetic: {
      target_energy: 0.9,       // Very high energy
      target_valence: 0.6,      // Mid-high positivity
      target_danceability: 0.8, // Very danceable
      target_tempo: 120,        // Higher tempo
      min_energy: 0.7,
      min_tempo: 100,
      max_energy: 1.0
    },
    relaxed: {
      target_valence: 0.5,      // Neutral positivity
      target_energy: 0.3,       // Low energy
      target_tempo: 80,         // Slower tempo
      target_acousticness: 0.6, // More acoustic
      min_energy: 0.0,
      max_energy: 0.5,
      max_tempo: 100
    },
    focused: {
      target_valence: 0.4,      // Slightly low positivity
      target_energy: 0.5,       // Medium energy
      target_instrumentalness: 0.7, // More instrumental
      target_acousticness: 0.4,
      min_speechiness: 0.0,
      max_speechiness: 0.1      // Less vocal
    },
    romantic: {
      target_valence: 0.6,      // Positive but not too high
      target_energy: 0.4,       // Lower energy
      target_acousticness: 0.5, // Some acoustic elements
      target_danceability: 0.5,
      min_valence: 0.4,
      max_energy: 0.6
    }
  };

  const normalizedMood = mood.toLowerCase().trim();
  
  if (!moodMap[normalizedMood]) {
    throw new Error(`Unsupported mood: ${mood}. Supported moods: ${Object.keys(moodMap).join(', ')}`);
  }

  return moodMap[normalizedMood];
}

/**
 * Get all supported moods
 * @returns {array} Array of supported mood strings
 */
function getSupportedMoods() {
  return ['happy', 'sad', 'energetic', 'relaxed', 'focused', 'romantic'];
}

module.exports = {
  getMoodFeatures,
  getSupportedMoods
};
