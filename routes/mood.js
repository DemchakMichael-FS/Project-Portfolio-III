/**
 * MOOD TRACKING ROUTES
 *
 * This file handles all mood tracking and history API endpoints:
 * - POST /api/mood/log - Log a new mood selection
 * - GET /api/mood/history/:userId - Get user's mood history
 * - GET /api/mood/stats/:userId - Get user's mood statistics and insights
 *
 * Features:
 * - Automatic mood logging when users select moods
 * - Historical mood data retrieval
 * - Analytics and insights generation
 * - Data validation and error handling
 */

const express = require('express');
const MoodLog = require('../models/MoodLog');

const router = express.Router();

/**
 * AUTHENTICATION MIDDLEWARE
 *
 * Ensures user is logged in before accessing mood tracking features
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
 * LOG MOOD SELECTION
 * POST /api/mood/log
 *
 * Records when a user selects a mood and gets music recommendations.
 * This is called automatically from the frontend when mood buttons are clicked.
 */
router.post('/log', requireAuth, async (req, res) => {
  try {
    const { mood, playlistUsed, recommendedTracks, sessionData } = req.body;
    const userId = req.session.user?.id;

    // Validate required fields
    if (!mood) {
      return res.status(400).json({
        error: 'Missing required field',
        message: 'Mood is required'
      });
    }

    if (!userId) {
      return res.status(400).json({
        error: 'User not found',
        message: 'User ID not available in session'
      });
    }

    // Create new mood log entry
    const moodLog = new MoodLog({
      userId,
      mood: mood.toLowerCase().trim(),
      playlistUsed,
      recommendedTracks: recommendedTracks || [],
      sessionData: {
        trackCount: recommendedTracks?.length || 0,
        tracksClicked: sessionData?.tracksClicked || 0,
        userAgent: req.get('User-Agent'),
        ...sessionData
      }
    });

    // Save to database
    await moodLog.save();

    console.log(`📊 Mood logged: ${userId} selected "${mood}" at ${new Date().toISOString()}`);

    res.status(201).json({
      success: true,
      message: 'Mood logged successfully',
      data: {
        id: moodLog._id,
        mood: moodLog.mood,
        timestamp: moodLog.timestamp,
        description: moodLog.getDescription()
      }
    });

  } catch (error) {
    console.error('❌ Error logging mood:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation error',
        message: error.message,
        details: error.errors
      });
    }

    res.status(500).json({
      error: 'Failed to log mood',
      message: 'Internal server error'
    });
  }
});

/**
 * GET MOOD HISTORY
 * GET /api/mood/history/:userId
 *
 * Retrieves a user's mood selection history, sorted by most recent first.
 * Supports pagination and filtering options.
 */
router.get('/history/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, page = 1, mood, days } = req.query;

    // Verify user can only access their own data
    if (userId !== req.session.user?.id) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only access your own mood history'
      });
    }

    // Build query filters
    const query = { userId };
    
    // Filter by specific mood if requested
    if (mood) {
      query.mood = mood.toLowerCase().trim();
    }
    
    // Filter by date range if requested
    if (days) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));
      query.timestamp = { $gte: startDate };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get mood history with pagination
    const [moodHistory, totalCount] = await Promise.all([
      MoodLog.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      MoodLog.countDocuments(query)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.json({
      success: true,
      data: {
        history: moodHistory,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          hasNextPage,
          hasPrevPage,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching mood history:', error);
    res.status(500).json({
      error: 'Failed to fetch mood history',
      message: 'Internal server error'
    });
  }
});

/**
 * GET MOOD STATISTICS
 * GET /api/mood/stats/:userId
 *
 * Provides analytics and insights about a user's mood patterns:
 * - Most common moods
 * - Mood trends over time
 * - Listening patterns by day/time
 * - Personalized insights
 */
router.get('/stats/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query;

    // Verify user can only access their own data
    if (userId !== req.session.user?.id) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only access your own mood statistics'
      });
    }

    // Get various statistics in parallel
    const [
      moodCounts,
      recentTrends,
      dayOfWeekStats,
      hourOfDayStats,
      totalLogs
    ] = await Promise.all([
      // Most common moods
      MoodLog.getUserStats(userId),
      
      // Mood trends over time
      MoodLog.getUserTrends(userId, parseInt(days)),
      
      // Day of week patterns
      MoodLog.aggregate([
        { $match: { userId } },
        { $group: { _id: '$dayOfWeek', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      
      // Hour of day patterns
      MoodLog.aggregate([
        { $match: { userId } },
        { $group: { _id: '$hourOfDay', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      
      // Total mood logs count
      MoodLog.countDocuments({ userId })
    ]);

    // Generate insights
    const insights = generateInsights(moodCounts, dayOfWeekStats, hourOfDayStats);

    res.json({
      success: true,
      data: {
        summary: {
          totalMoodLogs: totalLogs,
          daysTracked: parseInt(days),
          mostCommonMood: moodCounts[0]?._id || null,
          moodVariety: moodCounts.length
        },
        moodCounts,
        trends: recentTrends,
        patterns: {
          dayOfWeek: dayOfWeekStats,
          hourOfDay: hourOfDayStats
        },
        insights
      }
    });

  } catch (error) {
    console.error('❌ Error fetching mood stats:', error);
    res.status(500).json({
      error: 'Failed to fetch mood statistics',
      message: 'Internal server error'
    });
  }
});

/**
 * GENERATE PERSONALIZED INSIGHTS
 *
 * Analyzes user data to provide meaningful insights about their mood patterns
 */
function generateInsights(moodCounts, dayOfWeekStats, hourOfDayStats) {
  const insights = [];

  // Most common mood insight
  if (moodCounts.length > 0) {
    const topMood = moodCounts[0];
    const moodEmojis = {
      happy: '😊',
      sad: '😢',
      energetic: '⚡',
      relaxed: '😌',
      focused: '🎯',
      romantic: '💕'
    };

    insights.push({
      type: 'most_common_mood',
      title: 'Your Go-To Mood',
      message: `You listen to ${topMood._id} music most often (${topMood.count} times)`,
      icon: moodEmojis[topMood._id] || '🎵'
    });
  }

  // Mood diversity insight
  if (moodCounts.length > 1) {
    const diversityPercentage = Math.round((moodCounts.length / 6) * 100);
    insights.push({
      type: 'mood_diversity',
      title: 'Musical Variety',
      message: `You explore ${moodCounts.length} different moods - that's ${diversityPercentage}% of all available moods!`,
      icon: '🌈'
    });
  }

  // Day of week insight
  if (dayOfWeekStats.length > 0) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const topDay = dayOfWeekStats.reduce((max, day) => day.count > max.count ? day : max);
    const isWeekend = topDay._id === 0 || topDay._id === 6;

    insights.push({
      type: 'favorite_day',
      title: isWeekend ? 'Weekend Vibes' : 'Weekday Rhythm',
      message: `You discover new music most on ${dayNames[topDay._id]}s`,
      icon: isWeekend ? '🎉' : '📅'
    });
  }

  // Time of day insight
  if (hourOfDayStats.length > 0) {
    const topHour = hourOfDayStats.reduce((max, hour) => hour.count > max.count ? hour : max);
    const timeOfDay = getTimeOfDayLabel(topHour._id);
    const timeEmojis = {
      morning: '🌅',
      afternoon: '☀️',
      evening: '🌆',
      night: '🌙'
    };

    insights.push({
      type: 'peak_time',
      title: 'Your Peak Music Time',
      message: `You're most active finding music in the ${timeOfDay} (around ${formatHour(topHour._id)})`,
      icon: timeEmojis[timeOfDay] || '⏰'
    });
  }

  // Mood pattern insights
  if (moodCounts.length >= 2) {
    const topTwoMoods = moodCounts.slice(0, 2);
    const ratio = Math.round((topTwoMoods[0].count / topTwoMoods[1].count) * 100) / 100;

    if (ratio > 3) {
      insights.push({
        type: 'mood_consistency',
        title: 'Consistent Taste',
        message: `You have a strong preference for ${topTwoMoods[0]._id} music - ${ratio}x more than your second choice`,
        icon: '🎯'
      });
    } else if (ratio < 1.5) {
      insights.push({
        type: 'mood_balance',
        title: 'Balanced Listener',
        message: `You have a nice balance between ${topTwoMoods[0]._id} and ${topTwoMoods[1]._id} music`,
        icon: '⚖️'
      });
    }
  }

  // Activity level insight
  const totalSessions = moodCounts.reduce((sum, mood) => sum + mood.count, 0);
  if (totalSessions >= 10) {
    insights.push({
      type: 'activity_level',
      title: 'Music Explorer',
      message: `You've discovered music ${totalSessions} times! You're building great listening habits`,
      icon: '🚀'
    });
  } else if (totalSessions >= 5) {
    insights.push({
      type: 'getting_started',
      title: 'Getting Started',
      message: `You're off to a great start with ${totalSessions} music discovery sessions`,
      icon: '🌱'
    });
  }

  return insights;
}

/**
 * Helper function to convert hour to time of day label
 */
function getTimeOfDayLabel(hour) {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

/**
 * Helper function to format hour in 12-hour format
 */
function formatHour(hour) {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

module.exports = router;
