/**
 * SPOTIFY AUTHENTICATION ROUTES
 *
 * This file handles the complete OAuth 2.0 flow with Spotify:
 * 1. /login - Redirects user to Spotify for authorization
 * 2. /callback - Handles Spotify's response and exchanges code for tokens
 * 3. /logout - Clears user session
 * 4. /auth/status - Checks if user is currently logged in
 *
 * OAuth Flow Explanation:
 * 1. User clicks "Login with Spotify"
 * 2. We redirect them to Spotify with our app credentials
 * 3. User authorizes our app on Spotify's website
 * 4. Spotify redirects back to our /callback with an authorization code
 * 5. We exchange that code for an access token
 * 6. We store the token in the user's session
 * 7. Now we can make API calls on behalf of the user
 */

const express = require('express');
const querystring = require('querystring');  // For building URL parameters
const axios = require('axios');               // For making HTTP requests to Spotify
const spotifyConfig = require('../config/spotify');

const router = express.Router();

/**
 * SECURITY: Generate a random string for state parameter
 *
 * The "state" parameter prevents CSRF attacks by ensuring the callback
 * we receive is actually from the login request we initiated.
 */
function generateRandomString(length) {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

/**
 * LOGIN ROUTE: /login
 *
 * This starts the OAuth flow by redirecting the user to Spotify's authorization page.
 *
 * What happens here:
 * 1. Generate a random "state" parameter for security
 * 2. Store the state in the user's session
 * 3. Build the Spotify authorization URL with our app details
 * 4. Redirect the user to Spotify
 */
router.get('/login', (req, res) => {
  // Generate random state for CSRF protection
  const state = generateRandomString(16);
  req.session.state = state;  // Store in session to verify later

  // Convert our scopes array to a space-separated string
  const scope = spotifyConfig.scopes.join(' ');

  // Build the Spotify authorization URL
  const authUrl = spotifyConfig.authUrl + '?' + querystring.stringify({
    response_type: 'code',                    // We want an authorization code
    client_id: spotifyConfig.clientId,        // Our app's public ID
    scope: scope,                             // What permissions we're requesting
    redirect_uri: spotifyConfig.redirectUri,  // Where to send user after login
    state: state                              // Security parameter
  });

  // Send user to Spotify's login page
  res.redirect(authUrl);
});

/**
 * Callback route - handles Spotify OAuth callback
 */
router.get('/callback', async (req, res) => {
  const code = req.query.code || null;
  const state = req.query.state || null;
  const storedState = req.session.state || null;

  if (state == null || state !== storedState) {
    return res.redirect('/#' + querystring.stringify({
      error: 'state_mismatch'
    }));
  }

  req.session.state = null;

  if (code == null) {
    return res.redirect('/#' + querystring.stringify({
      error: 'access_denied'
    }));
  }

  try {
    const authOptions = {
      method: 'post',
      url: spotifyConfig.tokenUrl,
      data: querystring.stringify({
        code: code,
        redirect_uri: spotifyConfig.redirectUri,
        grant_type: 'authorization_code'
      }),
      headers: {
        'Authorization': 'Basic ' + Buffer.from(spotifyConfig.clientId + ':' + spotifyConfig.clientSecret).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    };

    const response = await axios(authOptions);
    const { access_token, refresh_token, expires_in } = response.data;

    // Store tokens in session
    req.session.access_token = access_token;
    req.session.refresh_token = refresh_token;
    req.session.token_expires_at = Date.now() + (expires_in * 1000);

    // Get user profile
    const userResponse = await axios.get(`${spotifyConfig.apiBaseUrl}/me`, {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    req.session.user = userResponse.data;

    res.redirect('/?authenticated=true');
  } catch (error) {
    console.error('Error during token exchange:', error.response?.data || error.message);
    res.redirect('/#' + querystring.stringify({
      error: 'invalid_token'
    }));
  }
});

/**
 * Logout route
 */
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    res.redirect('/');
  });
});

/**
 * Check authentication status
 */
router.get('/auth/status', (req, res) => {
  const isAuthenticated = !!(req.session.access_token && req.session.token_expires_at > Date.now());
  
  res.json({
    authenticated: isAuthenticated,
    user: isAuthenticated ? req.session.user : null
  });
});

module.exports = router;
