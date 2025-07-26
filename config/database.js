/**
 * DATABASE CONFIGURATION
 *
 * This file handles MongoDB connection using Mongoose.
 * It connects to MongoDB Atlas for cloud database storage.
 *
 * Features:
 * - Automatic connection retry
 * - Connection event logging
 * - Graceful shutdown handling
 * - Environment-based configuration
 */

const mongoose = require('mongoose');

/**
 * Connect to MongoDB Atlas
 * Uses connection string from environment variables
 */
async function connectToDatabase() {
  try {
    // MongoDB connection string from environment
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/moodify';
    
    console.log('🔗 Connecting to MongoDB...');
    
    // Connect with recommended options
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB successfully');
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    
    // Retry connection after 5 seconds
    console.log('🔄 Retrying connection in 5 seconds...');
    setTimeout(connectToDatabase, 5000);
  }
}

/**
 * Set up connection event listeners
 */
function setupConnectionEvents() {
  // Connection successful
  mongoose.connection.on('connected', () => {
    console.log('🎯 Mongoose connected to MongoDB');
  });
  
  // Connection error
  mongoose.connection.on('error', (err) => {
    console.error('❌ Mongoose connection error:', err);
  });
  
  // Connection disconnected
  mongoose.connection.on('disconnected', () => {
    console.log('⚠️ Mongoose disconnected from MongoDB');
  });
  
  // Handle app termination
  process.on('SIGINT', async () => {
    try {
      await mongoose.connection.close();
      console.log('🔒 MongoDB connection closed through app termination');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error closing MongoDB connection:', error);
      process.exit(1);
    }
  });
}

/**
 * Initialize database connection
 */
async function initializeDatabase() {
  setupConnectionEvents();
  await connectToDatabase();
}

module.exports = {
  connectToDatabase,
  initializeDatabase,
  mongoose
};
