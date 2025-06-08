require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');

// Import routes
const authRoutes = require('../routes/auth');
const musicRoutes = require('../routes/music');

const app = express();
const PORT = process.env.PORT || 3555;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'moodify-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Routes
app.use('/', authRoutes);
app.use('/', musicRoutes);

// Basic home route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🎵 Moodify server running on http://localhost:${PORT}`);
  console.log(`🔐 Visit http://localhost:${PORT}/login to authenticate with Spotify`);
});

module.exports = app;
