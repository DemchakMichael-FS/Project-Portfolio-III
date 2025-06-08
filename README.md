# Moodify - Spotify Mood-Based Music Picker

A Node.js application that recommends Spotify tracks based on your current mood using Spotify's Web API and audio features.

## Features

- Spotify OAuth integration
- Mood-based music recommendations
- Audio feature mapping (valence, energy, tempo)
- Simple web interface

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and fill in your Spotify app credentials
4. Run the server: `npm start`

## Environment Variables

- `SPOTIFY_CLIENT_ID`: Your Spotify app client ID
- `SPOTIFY_CLIENT_SECRET`: Your Spotify app client secret
- `REDIRECT_URI`: OAuth redirect URI (e.g., http://localhost:3000/callback)
- `SESSION_SECRET`: Secret for session management

## API Endpoints

- `GET /login`: Initiate Spotify OAuth flow
- `GET /callback`: Handle OAuth callback
- `GET /recommendations?mood=<mood>`: Get mood-based recommendations
- `GET /`: Simple web interface

## Supported Moods

- `happy`: High valence, high energy tracks
- `sad`: Low valence, low energy tracks
- `energetic`: High energy, mid valence tracks
- `relaxed`: Low tempo, mid valence tracks