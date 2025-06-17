# 🔐 Moodify Authentication System - File Structure Explanation

## Overview
This document explains each file in the Moodify authentication system and how they work together to implement Spotify OAuth 2.0 Authorization Code Flow.

---

## 📁 Core Authentication Files

### 1. `src/index.js` - Main Server Entry Point
**Purpose**: The heart of the application that sets up Express server and connects all components.

**Key Responsibilities**:
- Loads environment variables from `.env` file
- Configures Express middleware (JSON parsing, static files)
- Sets up session management with `express-session`
- Mounts authentication and music routes
- Handles errors and 404s

**Session Configuration**:
```javascript
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  name: 'moodify.sid',
  cookie: {
    secure: false,      // Set to true in production with HTTPS
    httpOnly: true,     // Prevents XSS attacks
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax'     // CSRF protection
  }
}));
```

**Why This Matters**: Sessions store user tokens securely on the server side, preventing client-side token exposure.

---

### 2. `routes/auth.js` - Authentication Routes Handler
**Purpose**: Implements the complete Spotify OAuth 2.0 flow with security best practices.

**Routes Provided**:
- `GET /login` - Initiates OAuth flow
- `GET /callback` - Handles Spotify's response
- `GET /logout` - Clears user session
- `GET /auth/status` - Checks authentication state

**OAuth Flow Implementation**:

#### Step 1: Login Route (`/login`)
```javascript
// Generates random state for CSRF protection
const state = generateRandomString(16);
req.session.state = state;

// Builds Spotify authorization URL
const authUrl = spotifyConfig.authUrl + '?' + querystring.stringify({
  response_type: 'code',
  client_id: spotifyConfig.clientId,
  scope: scope,
  redirect_uri: spotifyConfig.redirectUri,
  state: state
});
```

#### Step 2: Callback Route (`/callback`)
```javascript
// Validates state parameter (CSRF protection)
if (state !== storedState) {
  return res.redirect('/#error=state_mismatch');
}

// Exchanges authorization code for access token
const authOptions = {
  method: 'post',
  url: spotifyConfig.tokenUrl,
  data: querystring.stringify({
    code: code,
    redirect_uri: spotifyConfig.redirectUri,
    grant_type: 'authorization_code'
  }),
  headers: {
    'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
  }
};
```

**Security Features**:
- State parameter prevents CSRF attacks
- Secure token exchange using client credentials
- Server-side token storage in sessions
- Automatic user profile retrieval and storage

---

### 3. `routes/music.js` - Protected Music API Routes
**Purpose**: Handles music-related endpoints that require authentication.

**Authentication Middleware**:
```javascript
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
```

**Protected Routes**:
- `GET /recommendations` - Gets mood-based music recommendations
- `GET /test-spotify` - Tests Spotify API connectivity
- `GET /genres` - Lists available Spotify genres

**Token Usage**:
```javascript
const response = await axios.get(spotifyApiUrl, {
  headers: {
    'Authorization': `Bearer ${req.session.access_token}`
  }
});
```

**Error Handling**:
- 401 errors → Redirect to login
- 404 errors → Fallback to mock data
- Token expiration → Automatic detection

---

### 4. `config/spotify.js` - Spotify API Configuration
**Purpose**: Centralizes all Spotify-related configuration and credentials.

**Configuration Structure**:
```javascript
const spotifyConfig = {
  // App credentials from Spotify Developer Dashboard
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.REDIRECT_URI,
  
  // OAuth scopes (permissions requested)
  scopes: [
    'user-read-private',    // Access to user profile
    'user-read-email'       // Access to user email
  ],
  
  // Spotify API endpoints
  authUrl: 'https://accounts.spotify.com/authorize',
  tokenUrl: 'https://accounts.spotify.com/api/token',
  apiBaseUrl: 'https://api.spotify.com/v1'
};
```

**Why Separate Config File**:
- Centralizes all Spotify-related settings
- Makes it easy to update API endpoints
- Keeps credentials organized
- Enables easy testing with different configurations

---

### 5. `public/app.js` - Frontend Authentication Logic
**Purpose**: Handles client-side authentication state and user interface updates.

**Authentication State Management**:
```javascript
async checkAuthStatus() {
  try {
    const response = await fetch('/auth/status');
    const data = await response.json();
    
    if (data.authenticated) {
      this.showAuthenticatedState(data.user);
    } else {
      this.showUnauthenticatedState();
    }
  } catch (error) {
    console.error('Auth check failed:', error);
  }
}
```

**UI State Updates**:
- Shows/hides login/logout buttons
- Displays user information when logged in
- Handles authentication errors gracefully
- Manages mood selection interface

**API Request Handling**:
```javascript
async getRecommendations(mood) {
  try {
    const response = await fetch(`/recommendations?mood=${mood}&limit=10`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to get recommendations');
    }
    
    this.displayResults(data);
  } catch (error) {
    // Handle authentication errors
    if (error.message.includes('login')) {
      // Redirect to login
    }
  }
}
```

---

### 6. `.env` - Environment Variables (Secure Configuration)
**Purpose**: Stores sensitive configuration data securely outside of code.

**Required Variables**:
```env
# Spotify API Configuration
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
REDIRECT_URI=http://localhost:3555/callback

# Server Configuration
PORT=3555
SESSION_SECRET=your_random_session_secret_here

# Environment
NODE_ENV=development
```

**Security Best Practices**:
- Never commit `.env` to version control
- Use strong, random session secrets
- Different configurations for development/production
- Rotate secrets regularly

---

## 🔄 How Files Work Together

### Authentication Flow:
1. **User visits app** → `public/app.js` checks auth status via `routes/auth.js`
2. **User clicks login** → `routes/auth.js` redirects to Spotify using `config/spotify.js`
3. **Spotify redirects back** → `routes/auth.js` handles callback, stores tokens in session
4. **User requests music** → `routes/music.js` uses stored tokens to call Spotify API
5. **Session management** → `src/index.js` handles session lifecycle

### Security Layers:
- **Environment Variables** → Secure credential storage
- **Session Management** → Server-side token storage
- **CSRF Protection** → State parameter validation
- **Authentication Middleware** → Route protection
- **Token Expiration** → Automatic validation

### Error Handling:
- **Client Errors** → `public/app.js` shows user-friendly messages
- **Server Errors** → `routes/music.js` provides fallback data
- **Auth Errors** → Automatic redirect to login flow

---

## 🎯 Key Design Decisions

### Why Session-Based Auth?
- More secure than client-side token storage
- Automatic token management
- Better for web applications
- Easier to implement logout

### Why Separate Route Files?
- Clear separation of concerns
- Easier to maintain and test
- Modular architecture
- Better code organization

### Why Environment Variables?
- Security best practice
- Easy deployment configuration
- Prevents credential leaks
- Supports multiple environments

---

## 🧪 Testing the System

### Manual Testing Steps:
1. Start server: `npm run dev`
2. Visit: `http://localhost:3555`
3. Check initial state (should show login button)
4. Click "Login with Spotify"
5. Authorize on Spotify
6. Verify redirect back to app
7. Check authenticated state
8. Test music recommendations
9. Test logout functionality

### Debug Endpoints:
- `/auth/status` - Check current authentication state
- `/test-spotify` - Verify Spotify API connectivity
- `/genres` - Test API with simple request

This authentication system provides a secure, scalable foundation for the Moodify application while following OAuth 2.0 best practices.
