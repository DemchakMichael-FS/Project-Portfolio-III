const express = require('express');
const querystring = require('querystring');
const axios = require('axios');
const spotifyConfig = require('../config/spotify');

const router = express.Router();

/**
 * Generate a random string for state parameter
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
 * Login route - redirects to Spotify authorization
 */
router.get('/login', (req, res) => {
  const state = generateRandomString(16);
  req.session.state = state;

  const scope = spotifyConfig.scopes.join(' ');
  
  const authUrl = spotifyConfig.authUrl + '?' + querystring.stringify({
    response_type: 'code',
    client_id: spotifyConfig.clientId,
    scope: scope,
    redirect_uri: spotifyConfig.redirectUri,
    state: state
  });

  res.redirect(authUrl);
});

/**
 * Callback route - handles Spotify OAuth callback
 */
router.get('/callback', async (req, res) => {
  const code = req.query.code || null;
  const state = req.query.state || null;
  const storedState = req.session.state || null;

  if (state === null || state !== storedState) {
    return res.redirect('/#' + querystring.stringify({
      error: 'state_mismatch'
    }));
  }

  req.session.state = null;

  if (code === null) {
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
