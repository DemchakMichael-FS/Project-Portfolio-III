/**
 * MOODIFY - Main Server File
 *
 * This is the heart of our application. It sets up the Express server,
 * configures middleware, handles sessions, and connects all our routes.
 *
 * Key responsibilities:
 * - Load environment variables securely
 * - Configure Express server with middleware
 * - Set up session management for OAuth tokens
 * - Connect authentication and music routes
 * - Serve static files (HTML, CSS, JS)
 * - Handle errors gracefully
 */

// Load environment variables from .env file (keeps secrets secure)
require('dotenv').config();

// Import required packages
const express = require('express');           // Web framework for Node.js
const session = require('express-session');   // Session management for storing user tokens
const path = require('path');                 // File path utilities

// Import our custom route handlers
const authRoutes = require('../routes/auth');     // Spotify OAuth login/logout
const musicRoutes = require('../routes/music');   // Music recommendations API

// Create Express application instance
const app = express();

// Set server port (uses environment variable or defaults to 3555)
const PORT = process.env.PORT || 3555;

/**
 * MIDDLEWARE CONFIGURATION
 *
 * Middleware functions run on every request and handle common tasks
 * like parsing request data, serving files, and managing sessions.
 */

// Parse JSON request bodies (for API calls)
app.use(express.json());

// Parse URL-encoded form data (for form submissions)
app.use(express.urlencoded({ extended: true }));

// Serve static files (HTML, CSS, JS, images) from the public folder
app.use(express.static(path.join(__dirname, '../public')));

/**
 * SESSION CONFIGURATION
 *
 * Sessions store user data (like Spotify tokens) across requests.
 * This is crucial for maintaining login state after OAuth.
 */
app.use(session({
  secret: process.env.SESSION_SECRET || 'moodify-secret-key',  // Encryption key for sessions
  resave: false,              // Don't save session if unmodified
  saveUninitialized: false,   // Don't create session until something stored
  name: 'moodify.sid',        // Custom session name
  cookie: {
    secure: false,            // Set to true in production with HTTPS
    httpOnly: true,           // Prevent XSS attacks
    maxAge: 24 * 60 * 60 * 1000, // Session expires after 24 hours
    sameSite: 'lax'           // CSRF protection
  }
}));

/**
 * ROUTE CONFIGURATION
 *
 * Connect our route handlers to the Express app.
 * Routes define what happens when users visit different URLs.
 */

// Authentication routes: /login, /callback, /logout, /auth/status
app.use('/', authRoutes);

// Music routes: /api/music/recommendations, /api/music/moods
app.use('/api/music', musicRoutes);

/**
 * HOME PAGE ROUTE
 *
 * Serves the main HTML page when users visit the root URL
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

/**
 * ERROR HANDLING MIDDLEWARE
 *
 * These run when something goes wrong and provide user-friendly error messages
 */

// Handle server errors (500 status)
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Handle page not found (404 status)
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

/**
 * START THE SERVER
 *
 * Begin listening for incoming requests on the specified port
 */
app.listen(PORT, () => {
  console.log(`🎵 Moodify server running on http://localhost:${PORT}`);
  console.log(`🔐 Visit http://localhost:${PORT}/login to authenticate with Spotify`);
});

// Export the app for testing purposes
module.exports = app;
