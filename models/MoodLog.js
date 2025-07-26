/**
 * MOOD LOG MODEL
 *
 * This Mongoose model defines the structure for storing user mood selections
 * and music listening history in MongoDB.
 *
 * Features:
 * - Tracks user mood selections over time
 * - Links to Spotify user IDs for personalization
 * - Stores playlist/track information for context
 * - Automatic timestamps for analytics
 * - Validation for data integrity
 */

const mongoose = require('mongoose');

/**
 * MoodLog Schema Definition
 *
 * This schema captures all the essential information about a user's
 * mood selection and the resulting music recommendation session.
 */
const moodLogSchema = new mongoose.Schema({
  // Spotify User ID (from OAuth profile)
  userId: {
    type: String,
    required: true,
    index: true,  // Index for fast queries by user
    trim: true
  },
  
  // Selected mood (happy, sad, energetic, etc.)
  mood: {
    type: String,
    required: true,
    enum: ['happy', 'sad', 'energetic', 'relaxed', 'focused', 'romantic'],
    lowercase: true,
    trim: true
  },
  
  // Optional: Name of the playlist or search query used
  playlistUsed: {
    type: String,
    trim: true,
    default: null
  },
  
  // Optional: Array of track IDs that were recommended
  recommendedTracks: [{
    trackId: String,
    trackName: String,
    artistName: String,
    spotifyUrl: String
  }],
  
  // Session metadata
  sessionData: {
    // Number of tracks recommended in this session
    trackCount: {
      type: Number,
      default: 0
    },
    
    // Whether the user clicked on any tracks
    tracksClicked: {
      type: Number,
      default: 0
    },
    
    // User's device/browser info (optional)
    userAgent: String,
    
    // IP address for analytics (optional, anonymized)
    ipAddress: String
  },
  
  // Automatic timestamp when mood was selected
  timestamp: {
    type: Date,
    default: Date.now,
    index: true  // Index for time-based queries
  },
  
  // Day of week for analytics (0 = Sunday, 6 = Saturday)
  dayOfWeek: {
    type: Number,
    min: 0,
    max: 6
  },
  
  // Hour of day for analytics (0-23)
  hourOfDay: {
    type: Number,
    min: 0,
    max: 23
  }
}, {
  // Add automatic createdAt and updatedAt timestamps
  timestamps: true,
  
  // Optimize for queries
  collection: 'moodlogs'
});

/**
 * PRE-SAVE MIDDLEWARE
 *
 * Automatically calculate day of week and hour before saving
 */
moodLogSchema.pre('save', function(next) {
  if (this.isNew) {
    const date = this.timestamp || new Date();
    this.dayOfWeek = date.getDay();
    this.hourOfDay = date.getHours();
  }
  next();
});

/**
 * INSTANCE METHODS
 */

// Get a human-readable description of this mood log
moodLogSchema.methods.getDescription = function() {
  const date = this.timestamp.toLocaleDateString();
  const time = this.timestamp.toLocaleTimeString();
  return `${this.mood} mood on ${date} at ${time}`;
};

// Check if this log is from today
moodLogSchema.methods.isToday = function() {
  const today = new Date();
  const logDate = this.timestamp;
  return today.toDateString() === logDate.toDateString();
};

/**
 * STATIC METHODS
 */

// Get mood history for a specific user
moodLogSchema.statics.getUserHistory = function(userId, limit = 50) {
  return this.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
};

// Get mood statistics for a user
moodLogSchema.statics.getUserStats = function(userId) {
  return this.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: '$mood',
        count: { $sum: 1 },
        lastUsed: { $max: '$timestamp' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

// Get mood trends over time for a user
moodLogSchema.statics.getUserTrends = function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    { 
      $match: { 
        userId,
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          mood: '$mood'
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.date': 1 } }
  ]);
};

/**
 * INDEXES
 *
 * Create compound indexes for common query patterns
 */
moodLogSchema.index({ userId: 1, timestamp: -1 });
moodLogSchema.index({ userId: 1, mood: 1 });
moodLogSchema.index({ timestamp: -1 });

// Create and export the model
const MoodLog = mongoose.model('MoodLog', moodLogSchema);

module.exports = MoodLog;
