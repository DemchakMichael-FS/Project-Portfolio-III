/**
 * MOOD MAPPING SYSTEM
 *
 * This is the core intelligence of Moodify! It translates human emotions
 * into Spotify's audio feature parameters to find matching music.
 *
 * Spotify analyzes every song for features like:
 * - Valence: How positive/happy the song sounds (0.0 = sad, 1.0 = happy)
 * - Energy: How intense/energetic the song is (0.0 = calm, 1.0 = energetic)
 * - Danceability: How suitable for dancing (0.0 = not danceable, 1.0 = very danceable)
 * - Tempo: Beats per minute (speed of the song)
 * - Acousticness: How acoustic vs electronic (0.0 = electronic, 1.0 = acoustic)
 * - Instrumentalness: How much vocals vs instrumental (0.0 = vocals, 1.0 = instrumental)
 */

/**
 * Maps mood strings to Spotify audio feature parameters
 * @param {string} mood - The mood to map (happy, sad, energetic, etc.)
 * @returns {object} Spotify audio features for the given mood
 */
function getMoodFeatures(mood) {
  /**
   * MOOD MAPPING DICTIONARY
   *
   * Each mood is carefully mapped to audio features that create the right vibe.
   * Values are based on music psychology research and testing.
   */
  const moodMap = {
    // HAPPY: Upbeat, positive, feel-good music
    happy: {
      target_valence: 0.8,      // Very positive/happy sounding
      target_energy: 0.8,       // High energy level
      target_danceability: 0.7, // Pretty danceable
      min_valence: 0.6,         // At least somewhat positive
      min_energy: 0.6,          // At least somewhat energetic
      max_valence: 1.0,         // Can be maximally happy
      max_energy: 1.0           // Can be maximally energetic
    },
    // SAD: Melancholic, low-energy, emotional music
    sad: {
      target_valence: 0.2,      // Low positivity (sad/melancholic)
      target_energy: 0.3,       // Low energy (calm, not intense)
      target_danceability: 0.3, // Not very danceable
      min_valence: 0.0,         // Can be very sad
      min_energy: 0.0,          // Can be very low energy
      max_valence: 0.4,         // Not too positive
      max_energy: 0.5           // Not too energetic
    },

    // ENERGETIC: High-energy, pump-up, workout music
    energetic: {
      target_energy: 0.9,       // Very high energy
      target_valence: 0.6,      // Moderately positive
      target_danceability: 0.8, // Very danceable
      target_tempo: 120,        // Fast tempo (120+ BPM)
      min_energy: 0.7,          // Must be quite energetic
      min_tempo: 100,           // Must be reasonably fast
      max_energy: 1.0           // Can be maximum energy
    },

    // RELAXED: Calm, chill, background music
    relaxed: {
      target_valence: 0.5,      // Neutral mood (not sad, not overly happy)
      target_energy: 0.3,       // Low energy (calm, peaceful)
      target_tempo: 80,         // Slow tempo (80 BPM or less)
      target_acousticness: 0.6, // More acoustic instruments
      min_energy: 0.0,          // Can be very calm
      max_energy: 0.5,          // Not too energetic
      max_tempo: 100            // Not too fast
    },

    // FOCUSED: Concentration music, often instrumental
    focused: {
      target_valence: 0.4,      // Slightly neutral to positive
      target_energy: 0.5,       // Medium energy (not distracting)
      target_instrumentalness: 0.7, // Mostly instrumental (fewer lyrics)
      target_acousticness: 0.4, // Some acoustic elements
      min_speechiness: 0.0,     // Minimal spoken word
      max_speechiness: 0.1      // Very few vocals/speech
    },

    // ROMANTIC: Love songs, intimate, emotional music
    romantic: {
      target_valence: 0.6,      // Positive but not overly happy
      target_energy: 0.4,       // Lower energy (intimate, not intense)
      target_acousticness: 0.5, // Mix of acoustic and produced
      target_danceability: 0.5, // Moderately danceable
      min_valence: 0.4,         // At least somewhat positive
      max_energy: 0.6           // Not too high energy
    }
  };

  // Normalize the input (lowercase, remove spaces)
  const normalizedMood = mood.toLowerCase().trim();

  // Validate that the mood exists in our mapping
  if (!moodMap[normalizedMood]) {
    throw new Error(`Unsupported mood: ${mood}. Supported moods: ${Object.keys(moodMap).join(', ')}`);
  }

  // Return the audio features for this mood
  return moodMap[normalizedMood];
}

/**
 * Get all supported moods
 * @returns {array} Array of supported mood strings
 */
function getSupportedMoods() {
  return ['happy', 'sad', 'energetic', 'relaxed', 'focused', 'romantic'];
}

// Export functions for use in other files
module.exports = {
  getMoodFeatures,
  getSupportedMoods
};
