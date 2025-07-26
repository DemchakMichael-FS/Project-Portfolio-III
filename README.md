# 🎵 Moodify - Spotify Mood-Based Music Picker

A Node.js application that recommends Spotify tracks based on your current mood using Spotify's Web API and audio features. Built with Express.js and featuring a beautiful, responsive web interface.



## 🚀 Features

- **Spotify OAuth Integration**: Secure authentication using Authorization Code Flow
- **Mood-Based Recommendations**: 6 different moods with custom audio feature mapping
- **Audio Feature Analysis**: Uses Spotify's valence, energy, tempo, and other audio features
- **Responsive Web Interface**: Beautiful UI with mood buttons and track display
- **Real-time Recommendations**: Instant track suggestions based on selected mood
- **Session Management**: Secure token storage and automatic refresh
- **📊 Mood History + Smart Tracker**: NEW! Track your mood selections over time
- **🎯 Personalized Analytics**: Get insights about your listening patterns and preferences
- **📈 Interactive Timeline**: View your mood history with filtering and search options
- **🧠 Smart Insights**: AI-powered analysis of your music discovery habits

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Authentication**: Spotify Web API OAuth 2.0
- **Session Management**: express-session
- **HTTP Client**: Axios
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Environment**: dotenv for configuration

## 📁 Project Structure

```
moodify/
├── src/
│   └── index.js              # Main server file
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── music.js             # Music recommendation routes
│   └── mood.js              # NEW: Mood tracking and analytics routes
├── models/
│   └── MoodLog.js           # NEW: MongoDB mood tracking model
├── config/
│   ├── spotify.js           # Spotify API configuration
│   ├── moodMapper.js        # Mood to audio features mapping
│   └── database.js          # NEW: MongoDB connection configuration
├── public/
│   ├── index.html           # Frontend UI (enhanced with mood history)
│   └── app.js               # Frontend JavaScript (with tracking features)
├── .env.example             # Environment variables template
├── .gitignore              # Git ignore rules
├── package.json            # Dependencies and scripts
├── README.md               # Project documentation
└── MOOD_TRACKING_IMPLEMENTATION.md  # NEW: Mood tracking feature docs
```

## 🔧 Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Spotify Developer Account

### 1. Clone the Repository
```bash
git clone https://github.com/DemchakMichael-FS/Project-Portfolio-III.git
cd Project-Portfolio-III
```

### 2. Install Dependencies
```bash
npm install
# If mongoose is not installed automatically:
npm install mongoose
```

### 3. Set Up Spotify App
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Note your Client ID and Client Secret
4. Add `http://127.0.0.1:3555/callback` to Redirect URIs

### 4. Configure Environment Variables
```bash
cp .env.example .env
```

Edit `.env` with your Spotify credentials and MongoDB connection:
```env
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
REDIRECT_URI=http://127.0.0.1:3555/callback
PORT=3555
SESSION_SECRET=your_random_session_secret_here
NODE_ENV=development

# NEW: MongoDB Configuration for Mood Tracking
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/moodify?retryWrites=true&w=majority
```

### 5. Run the Application
```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

### 6. Access the Application
Open your browser and navigate to: `http://localhost:3555`

## 🔐 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SPOTIFY_CLIENT_ID` | Your Spotify app client ID | `abc123def456` |
| `SPOTIFY_CLIENT_SECRET` | Your Spotify app client secret | `xyz789uvw012` |
| `REDIRECT_URI` | OAuth callback URL | `http://127.0.0.1:3555/callback` |
| `PORT` | Server port number | `3555` |
| `SESSION_SECRET` | Secret for session encryption | `your-secret-key-here` |
| `NODE_ENV` | Environment mode | `development` or `production` |

## 🎭 Supported Moods

| Mood | Description | Audio Features |
|------|-------------|----------------|
| **Happy** | High energy, positive vibes | High valence (0.8), High energy (0.8) |
| **Sad** | Low energy, melancholic tracks | Low valence (0.2), Low energy (0.3) |
| **Energetic** | High energy, danceable music | Very high energy (0.9), Mid valence (0.6) |
| **Relaxed** | Calm, low tempo tracks | Low tempo (80 BPM), Mid valence (0.5) |
| **Focused** | Instrumental, concentration music | High instrumentalness (0.7), Low speechiness |
| **Romantic** | Love songs and romantic ballads | Mid valence (0.6), Low energy (0.4) |

## 🌐 API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/` | Main web interface | No |
| `GET` | `/login` | Initiate Spotify OAuth flow | No |
| `GET` | `/callback` | Handle OAuth callback | No |
| `GET` | `/logout` | Logout and clear session | No |
| `GET` | `/auth/status` | Check authentication status | No |
| `GET` | `/moods` | Get available moods | No |
| `GET` | `/recommendations?mood=<mood>` | Get mood-based recommendations | Yes |

### Example API Usage

```javascript
// Get recommendations for happy mood
fetch('/recommendations?mood=happy&limit=10')
  .then(response => response.json())
  .then(data => console.log(data.tracks));

// NEW: Get user's mood history
fetch('/api/mood/history/USER_ID?days=30')
  .then(response => response.json())
  .then(data => console.log(data.data.history));

// NEW: Get mood statistics and insights
fetch('/api/mood/stats/USER_ID')
  .then(response => response.json())
  .then(data => console.log(data.data.insights));
```

## 📊 Mood History + Smart Tracker (NEW!)

### What It Does
The mood tracking system automatically logs every time you select a mood and get music recommendations. Over time, it builds a comprehensive picture of your music discovery habits and provides personalized insights.

### Key Features
- **🔄 Automatic Logging**: Every mood selection is automatically saved to your personal history
- **📈 Interactive Timeline**: View your mood selections over time with beautiful visualizations
- **🎯 Smart Filtering**: Filter your history by specific moods or date ranges
- **🧠 Personalized Insights**: Get AI-powered insights about your listening patterns:
  - Your most common moods
  - Peak music discovery times
  - Favorite days for music exploration
  - Mood diversity analysis
  - Activity level feedback

### How to Use
1. **Select Moods**: Use Moodify normally - every mood selection is automatically tracked
2. **View History**: Click "View History" to see your mood timeline
3. **Check Stats**: Click "View Stats" to see analytics and insights
4. **Filter Data**: Use the dropdown filters to focus on specific moods or time periods

### Privacy & Data
- All mood data is stored securely in your personal MongoDB database
- Only you can access your mood history and statistics
- Data is used solely to provide personalized insights and improve your experience

## 📋 Project Milestones

This project was developed using Agile methodology with the following milestones:

### 🏗️ Milestone 1: Project Setup
**Status: ✅ Completed**

- [x] Initialize Node.js project with proper folder structure
- [x] Set up Express.js server with middleware
- [x] Configure environment variables and security
- [x] Create package.json with dependencies
- [x] Set up Git repository with proper .gitignore
- [x] Create comprehensive README.md

### 🔐 Milestone 2: Spotify OAuth Integration
**Status: ✅ Completed**

- [x] Implement Spotify OAuth Authorization Code Flow
- [x] Create login route with state parameter for security
- [x] Handle OAuth callback and token exchange
- [x] Set up session management for token storage
- [x] Implement authentication middleware
- [x] Add logout functionality
- [x] Create auth status endpoint

### 🎭 Milestone 3: Mood Logic & Recommendations
**Status: ✅ Completed**

- [x] Design mood mapping system with audio features
- [x] Implement getMoodFeatures() function
- [x] Create recommendations API endpoint
- [x] Integrate with Spotify Web API recommendations
- [x] Add error handling and validation
- [x] Implement mood-based genre seeding
- [x] Create frontend UI with mood buttons
- [x] Add responsive design and user experience

### 🎨 Bonus Features Implemented

- [x] Beautiful, responsive web interface
- [x] Real-time track recommendations
- [x] 6 different mood categories
- [x] Comprehensive error handling
- [x] Session-based authentication
- [x] Mobile-friendly design

## 🧪 Testing

To test the mood mapping functionality:

```bash
# Test mood features (create a test file)
node -e "
const { getMoodFeatures, getSupportedMoods } = require('./config/moodMapper');
console.log('Supported moods:', getSupportedMoods());
console.log('Happy mood features:', getMoodFeatures('happy'));
"
```

## 🚀 Deployment

### Local Development
```bash
npm run dev  # Uses nodemon for auto-restart
```

### Production
```bash
npm start    # Standard Node.js start
```

### Environment Setup for Production
- Set `NODE_ENV=production`
- Use HTTPS for `REDIRECT_URI`
- Set secure session cookies
- Use a strong `SESSION_SECRET`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


## 🙏 Acknowledgments

- [Spotify Web API](https://developer.spotify.com/documentation/web-api/) for music data
- [Express.js](https://expressjs.com/) for the web framework
- [Spotify Audio Features](https://developer.spotify.com/documentation/web-api/reference/get-audio-features) for mood mapping

## 📞 Support

If you have any questions or issues, please:
1. Check the [Issues](https://github.com/DemchakMichael-FS/Project-Portfolio-III/issues) page
2. Create a new issue with detailed information
3. Contact the developer: [Michael Demchak](https://github.com/DemchakMichael-FS)

---

**Made with ❤️ and 🎵 by Michael Demchak**