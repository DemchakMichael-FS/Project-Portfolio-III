#!/usr/bin/env node

/**
 * 🔐 MOODIFY AUTHENTICATION ARCHITECTURE EXPLAINER
 * 
 * This script explains the authentication system and folder structure
 * for the Moodify Spotify OAuth integration.
 * 
 * Run with: node scripts/explain-auth.js
 */

const fs = require('fs');
const path = require('path');

console.log('🎵 MOODIFY AUTHENTICATION SYSTEM OVERVIEW');
console.log('=' .repeat(60));
console.log();

// Function to check if file exists
function fileExists(filePath) {
    try {
        return fs.existsSync(filePath);
    } catch (error) {
        return false;
    }
}

// Function to get file size
function getFileSize(filePath) {
    try {
        const stats = fs.statSync(filePath);
        return `${(stats.size / 1024).toFixed(1)}KB`;
    } catch (error) {
        return 'N/A';
    }
}

// Function to count lines in file
function countLines(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return content.split('\n').length;
    } catch (error) {
        return 'N/A';
    }
}

console.log('📁 PROJECT STRUCTURE & AUTH COMPONENTS');
console.log('-'.repeat(40));

const authComponents = [
    {
        path: 'src/index.js',
        role: 'Main Server',
        description: 'Express server setup with session middleware and route mounting'
    },
    {
        path: 'routes/auth.js',
        role: 'Auth Routes',
        description: 'Spotify OAuth flow: /login, /callback, /logout, /auth/status'
    },
    {
        path: 'routes/music.js',
        role: 'Protected Routes',
        description: 'Music API endpoints with authentication middleware'
    },
    {
        path: 'config/spotify.js',
        role: 'Spotify Config',
        description: 'Spotify API credentials and OAuth configuration'
    },
    {
        path: 'public/app.js',
        role: 'Frontend Auth',
        description: 'Client-side authentication state management'
    },
    {
        path: '.env',
        role: 'Environment',
        description: 'Secure storage of API keys and secrets'
    }
];

authComponents.forEach(component => {
    const exists = fileExists(component.path);
    const size = exists ? getFileSize(component.path) : 'Missing';
    const lines = exists ? countLines(component.path) : 'N/A';
    
    console.log(`📄 ${component.role}`);
    console.log(`   Path: ${component.path}`);
    console.log(`   Status: ${exists ? '✅ Exists' : '❌ Missing'}`);
    console.log(`   Size: ${size} (${lines} lines)`);
    console.log(`   Role: ${component.description}`);
    console.log();
});

console.log('🔄 OAUTH FLOW EXPLANATION');
console.log('-'.repeat(40));

const oauthSteps = [
    {
        step: 1,
        endpoint: '/login',
        description: 'User clicks "Login with Spotify"',
        action: 'Redirects to Spotify authorization page',
        file: 'routes/auth.js'
    },
    {
        step: 2,
        endpoint: 'Spotify Auth',
        description: 'User authorizes app on Spotify',
        action: 'Spotify redirects back with authorization code',
        file: 'External'
    },
    {
        step: 3,
        endpoint: '/callback',
        description: 'Handle Spotify callback',
        action: 'Exchange code for access token, store in session',
        file: 'routes/auth.js'
    },
    {
        step: 4,
        endpoint: '/recommendations',
        description: 'User requests music',
        action: 'Use stored token to call Spotify API',
        file: 'routes/music.js'
    },
    {
        step: 5,
        endpoint: '/logout',
        description: 'User logs out',
        action: 'Destroy session and clear tokens',
        file: 'routes/auth.js'
    }
];

oauthSteps.forEach(step => {
    console.log(`${step.step}. ${step.description}`);
    console.log(`   Endpoint: ${step.endpoint}`);
    console.log(`   Action: ${step.action}`);
    console.log(`   Handled by: ${step.file}`);
    console.log();
});

console.log('🔒 SECURITY FEATURES');
console.log('-'.repeat(40));

const securityFeatures = [
    'State parameter prevents CSRF attacks',
    'Session-based token storage (server-side)',
    'HTTP-only cookies prevent XSS',
    'Environment variables for sensitive data',
    'Token expiration checking',
    'Authentication middleware for protected routes'
];

securityFeatures.forEach((feature, index) => {
    console.log(`${index + 1}. ${feature}`);
});

console.log();
console.log('📊 SESSION MANAGEMENT');
console.log('-'.repeat(40));

console.log('Session stores:');
console.log('• access_token - Spotify API access token');
console.log('• refresh_token - Token for refreshing access');
console.log('• token_expires_at - Expiration timestamp');
console.log('• user - Spotify user profile data');
console.log('• state - CSRF protection parameter');

console.log();
console.log('🧪 TESTING THE AUTH SYSTEM');
console.log('-'.repeat(40));

console.log('1. Start server: npm run dev');
console.log('2. Visit: http://localhost:3555');
console.log('3. Click "Login with Spotify"');
console.log('4. Check auth status: http://localhost:3555/auth/status');
console.log('5. Test protected route: http://localhost:3555/test-spotify');
console.log('6. Logout: http://localhost:3555/logout');

console.log();
console.log('🔧 DEBUGGING ENDPOINTS');
console.log('-'.repeat(40));

const debugEndpoints = [
    { url: '/auth/status', purpose: 'Check if user is authenticated' },
    { url: '/test-spotify', purpose: 'Test Spotify API connectivity' },
    { url: '/genres', purpose: 'List available Spotify genres' },
    { url: '/mock-recommendations', purpose: 'Test UI with mock data' }
];

debugEndpoints.forEach(endpoint => {
    console.log(`• ${endpoint.url} - ${endpoint.purpose}`);
});

console.log();
console.log('⚠️  CURRENT KNOWN ISSUES');
console.log('-'.repeat(40));

console.log('• Spotify Recommendations API returning 404 errors');
console.log('• Fallback to mock data implemented');
console.log('• Session persistence needs browser testing');
console.log('• Need to verify Spotify app configuration');

console.log();
console.log('🎯 NEXT STEPS');
console.log('-'.repeat(40));

console.log('1. Test login flow in browser');
console.log('2. Debug Spotify API 404 issue');
console.log('3. Verify all auth endpoints work');
console.log('4. Add comprehensive error handling');
console.log('5. Create auth flow documentation');

console.log();
console.log('✅ Server is running at: http://localhost:3555');
console.log('🔐 Login URL: http://localhost:3555/login');
console.log();
