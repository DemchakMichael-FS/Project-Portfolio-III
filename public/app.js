/**
 * MOODIFY FRONTEND APPLICATION
 *
 * This JavaScript class handles all frontend functionality:
 * - Checking if user is logged in with Spotify
 * - Loading available moods from the backend
 * - Handling mood selection and API calls
 * - Displaying track recommendations
 * - Managing UI states (loading, errors, success)
 *
 * The app uses modern JavaScript features like:
 * - ES6 classes for organization
 * - Async/await for API calls
 * - Fetch API for HTTP requests
 * - DOM manipulation for dynamic content
 */

class MoodifyApp {
    constructor() {
        // Track application state
        this.currentMood = null;        // Currently selected mood
        this.isAuthenticated = false;   // Whether user is logged in
        this.init();                    // Start the application
    }

    /**
     * INITIALIZE THE APPLICATION
     *
     * This runs when the page loads and sets up everything:
     * 1. Check if user is already logged in
     * 2. Load available moods from backend
     * 3. Set up event listeners for user interactions
     */
    async init() {
        await this.checkAuthStatus();    // Check login status first
        await this.loadMoods();          // Load mood buttons
        this.setupEventListeners();     // Set up click handlers
    }

    /**
     * CHECK AUTHENTICATION STATUS
     *
     * Calls our backend to see if the user is currently logged in.
     * Updates the UI to show either login button or user info + mood buttons.
     */
    async checkAuthStatus() {
        try {
            // Call our backend API to check login status
            const response = await fetch('/auth/status');
            const data = await response.json();

            // Update our internal state
            this.isAuthenticated = data.authenticated;

            if (this.isAuthenticated) {
                // User is logged in - show the main app interface
                document.getElementById('loginSection').style.display = 'none';
                document.getElementById('userSection').style.display = 'block';
                document.getElementById('moodSection').style.display = 'block';
                document.getElementById('moodHistorySection').style.display = 'block';
                document.getElementById('userName').textContent = data.user?.display_name || 'Spotify User';
            } else {
                // User is not logged in - show login button
                document.getElementById('loginSection').style.display = 'block';
                document.getElementById('userSection').style.display = 'none';
                document.getElementById('moodSection').style.display = 'none';
                document.getElementById('moodHistorySection').style.display = 'none';
            }
        } catch (error) {
            console.error('Error checking auth status:', error);
        }
    }

    async loadMoods() {
        if (!this.isAuthenticated) return;

        try {
            const response = await fetch('/api/music/moods');
            const data = await response.json();
            
            const moodButtons = document.getElementById('moodButtons');
            moodButtons.innerHTML = '';

            data.moods.forEach(mood => {
                const button = document.createElement('button');
                button.className = 'mood-btn';
                button.textContent = this.capitalizeMood(mood);
                button.dataset.mood = mood;
                button.title = data.descriptions[mood] || '';
                
                button.addEventListener('click', () => this.selectMood(mood, button));
                moodButtons.appendChild(button);
            });
        } catch (error) {
            console.error('Error loading moods:', error);
        }
    }

    selectMood(mood, buttonElement) {
        // Remove active class from all buttons
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Add active class to selected button
        buttonElement.classList.add('active');
        
        this.currentMood = mood;
        this.getRecommendations(mood);
    }

    /**
     * GET RECOMMENDATIONS FROM BACKEND
     *
     * This is where the magic happens! We call our backend with the selected mood
     * and get personalized Spotify recommendations.
     *
     * Process:
     * 1. Show loading message
     * 2. Call /recommendations API with mood parameter
     * 3. Display results or show error message
     */
    async getRecommendations(mood) {
        const resultsDiv = document.getElementById('results');

        // Show loading state while we fetch recommendations
        resultsDiv.innerHTML = '<div class="loading">♪ Finding perfect tracks for your mood...</div>';

        try {
            // Call our backend API with the selected mood
            const response = await fetch(`/api/music/recommendations?mood=${mood}&limit=10`);
            const data = await response.json();

            // Check if the request was successful
            if (!response.ok) {
                throw new Error(data.error || 'Failed to get recommendations');
            }

            // Display the track recommendations
            this.displayResults(data);

            // Log the mood selection for tracking and analytics
            this.logMoodSelection(mood, data);
        } catch (error) {
            console.error('Error getting recommendations:', error);

            // Show user-friendly error message
            resultsDiv.innerHTML = `
                <div class="error">
                    <h3>Oops! Something went wrong</h3>
                    <p>${error.message}</p>
                    ${error.message.includes('login') ? '<a href="/login" class="btn">Login Again</a>' : ''}
                </div>
            `;
        }
    }

    /**
     * LOG MOOD SELECTION
     *
     * Automatically logs when a user selects a mood and gets recommendations.
     * This data is used for mood history and analytics features.
     */
    async logMoodSelection(mood, recommendationData) {
        try {
            // Prepare the data to log
            const logData = {
                mood: mood,
                playlistUsed: recommendationData.playlistUsed || null,
                recommendedTracks: recommendationData.tracks?.map(track => ({
                    trackId: track.id,
                    trackName: track.name,
                    artistName: Array.isArray(track.artists) ? track.artists.join(', ') : track.artists,
                    spotifyUrl: track.external_urls?.spotify
                })) || [],
                sessionData: {
                    trackCount: recommendationData.tracks?.length || 0,
                    tracksClicked: 0, // Will be updated when user clicks tracks
                    timestamp: new Date().toISOString()
                }
            };

            // Send the log data to the backend
            const response = await fetch('/api/mood/log', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(logData)
            });

            if (response.ok) {
                console.log(`📊 Mood "${mood}" logged successfully`);
            } else {
                const errorData = await response.json();
                console.warn('⚠️ Failed to log mood:', errorData.message);
            }

        } catch (error) {
            // Don't show errors to user for logging failures
            console.warn('⚠️ Mood logging failed:', error.message);
        }
    }

    displayResults(data) {
        const resultsDiv = document.getElementById('results');
        
        if (!data.tracks || data.tracks.length === 0) {
            resultsDiv.innerHTML = `
                <div class="error">
                    <h3>No tracks found</h3>
                    <p>Try a different mood or check your Spotify connection.</p>
                </div>
            `;
            return;
        }

        let html = `
            <h3>♪ ${this.capitalizeMood(data.mood)} vibes (${data.tracks.length} tracks)</h3>
            <div class="tracks">
        `;

        data.tracks.forEach(track => {
            const artists = Array.isArray(track.artists) ? track.artists.join(', ') : track.artists;
            const spotifyUrl = track.external_urls?.spotify || '#';
            
            html += `
                <div class="track">
                    <div class="track-info">
                        <h3>${this.escapeHtml(track.name)}</h3>
                        <p>by ${this.escapeHtml(artists)} • ${this.escapeHtml(track.album)}</p>
                    </div>
                    <div class="track-actions">
                        <a href="${spotifyUrl}" target="_blank" class="track-link">
                            Open in Spotify
                        </a>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        resultsDiv.innerHTML = html;

        // Add click tracking to Spotify links
        this.setupTrackClickTracking();
    }

    /**
     * SETUP TRACK CLICK TRACKING
     *
     * Adds event listeners to track when users click on Spotify links
     * This helps measure engagement with recommendations
     */
    setupTrackClickTracking() {
        const trackLinks = document.querySelectorAll('.track-link');
        trackLinks.forEach(link => {
            link.addEventListener('click', () => {
                console.log('🎵 User clicked on Spotify track');
                // Could send analytics event here if needed
            });
        });
    }

    setupEventListeners() {
        // Check for authentication success in URL
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('authenticated') === 'true') {
            // Remove the parameter from URL
            window.history.replaceState({}, document.title, window.location.pathname);
            // Refresh auth status
            this.checkAuthStatus();
        }

        // Setup mood history event listeners
        this.setupMoodHistoryListeners();
    }

    /**
     * SETUP MOOD HISTORY EVENT LISTENERS
     *
     * Sets up all the event listeners for the mood history functionality
     */
    setupMoodHistoryListeners() {
        const toggleHistoryBtn = document.getElementById('toggleHistoryBtn');
        const toggleStatsBtn = document.getElementById('toggleStatsBtn');
        const moodFilter = document.getElementById('moodFilter');
        const daysFilter = document.getElementById('daysFilter');

        // Toggle between history and stats view
        if (toggleHistoryBtn) {
            toggleHistoryBtn.addEventListener('click', () => this.showMoodHistory());
        }

        if (toggleStatsBtn) {
            toggleStatsBtn.addEventListener('click', () => this.showMoodStats());
        }

        // Filter change listeners
        if (moodFilter) {
            moodFilter.addEventListener('change', () => this.filterMoodHistory());
        }

        if (daysFilter) {
            daysFilter.addEventListener('change', () => this.filterMoodHistory());
        }
    }

    /**
     * SHOW MOOD HISTORY
     *
     * Displays the user's mood history timeline
     */
    async showMoodHistory() {
        if (!this.isAuthenticated) {
            console.log('User not authenticated, cannot show mood history');
            return;
        }

        const historySection = document.getElementById('moodHistorySection');
        const historyContent = document.getElementById('historyContent');
        const statsContent = document.getElementById('statsContent');
        const toggleHistoryBtn = document.getElementById('toggleHistoryBtn');
        const toggleStatsBtn = document.getElementById('toggleStatsBtn');

        // Show the history section and content
        historySection.style.display = 'block';
        historyContent.style.display = 'block';
        statsContent.style.display = 'none';

        // Update button visibility
        toggleHistoryBtn.style.display = 'none';
        toggleStatsBtn.style.display = 'inline-flex';

        // Load and display mood history
        await this.loadMoodHistory();
    }

    /**
     * SHOW MOOD STATS
     *
     * Displays the user's mood statistics and insights
     */
    async showMoodStats() {
        if (!this.isAuthenticated) {
            console.log('User not authenticated, cannot show mood stats');
            return;
        }

        const historyContent = document.getElementById('historyContent');
        const statsContent = document.getElementById('statsContent');
        const toggleHistoryBtn = document.getElementById('toggleHistoryBtn');
        const toggleStatsBtn = document.getElementById('toggleStatsBtn');

        // Show stats content, hide history
        historyContent.style.display = 'none';
        statsContent.style.display = 'block';

        // Update button visibility
        toggleHistoryBtn.style.display = 'inline-flex';
        toggleStatsBtn.style.display = 'none';

        // Load and display mood statistics
        await this.loadMoodStats();
    }

    /**
     * LOAD MOOD HISTORY
     *
     * Fetches and displays the user's mood history from the backend
     */
    async loadMoodHistory() {
        const timeline = document.getElementById('historyTimeline');
        const moodFilter = document.getElementById('moodFilter').value;
        const daysFilter = document.getElementById('daysFilter').value;

        try {
            timeline.innerHTML = '<div class="loading">📊 Loading your mood history...</div>';

            // Get user ID from session
            const authResponse = await fetch('/auth/status');
            const authData = await authResponse.json();

            if (!authData.authenticated || !authData.user) {
                throw new Error('User not authenticated');
            }

            const userId = authData.user.id;

            // Build query parameters
            const params = new URLSearchParams({
                limit: '20',
                days: daysFilter
            });

            if (moodFilter) {
                params.append('mood', moodFilter);
            }

            // Fetch mood history
            const response = await fetch(`/api/mood/history/${userId}?${params}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to load mood history');
            }

            this.displayMoodHistory(data.data.history);

        } catch (error) {
            console.error('Error loading mood history:', error);
            timeline.innerHTML = `
                <div class="error">
                    <h3>Unable to load mood history</h3>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }

    /**
     * DISPLAY MOOD HISTORY
     *
     * Renders the mood history timeline
     */
    displayMoodHistory(history) {
        const timeline = document.getElementById('historyTimeline');

        if (!history || history.length === 0) {
            timeline.innerHTML = `
                <div class="empty-state">
                    <h3>No mood history yet</h3>
                    <p>Start selecting moods to see your listening patterns!</p>
                </div>
            `;
            return;
        }

        let html = '';
        history.forEach(entry => {
            const date = new Date(entry.timestamp);
            const formattedDate = date.toLocaleDateString();
            const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const trackCount = entry.sessionData?.trackCount || 0;

            html += `
                <div class="history-item">
                    <div class="history-item-header">
                        <span class="mood-badge">${this.capitalizeMood(entry.mood)}</span>
                        <span class="history-timestamp">${formattedDate} at ${formattedTime}</span>
                    </div>
                    <div class="history-tracks">
                        🎵 ${trackCount} tracks recommended
                        ${entry.playlistUsed ? `• Playlist: ${entry.playlistUsed}` : ''}
                    </div>
                </div>
            `;
        });

        timeline.innerHTML = html;
    }

    /**
     * FILTER MOOD HISTORY
     *
     * Reloads mood history with current filter settings
     */
    async filterMoodHistory() {
        await this.loadMoodHistory();
    }

    /**
     * LOAD MOOD STATS
     *
     * Fetches and displays mood statistics and insights
     */
    async loadMoodStats() {
        try {
            // Get user ID from session
            const authResponse = await fetch('/auth/status');
            const authData = await authResponse.json();

            if (!authData.authenticated || !authData.user) {
                throw new Error('User not authenticated');
            }

            const userId = authData.user.id;

            // Fetch mood statistics
            const response = await fetch(`/api/mood/stats/${userId}?days=30`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to load mood statistics');
            }

            this.displayMoodStats(data.data);

        } catch (error) {
            console.error('Error loading mood stats:', error);
            document.getElementById('insightsList').innerHTML = `
                <div class="error">
                    <h3>Unable to load statistics</h3>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }

    /**
     * DISPLAY MOOD STATS
     *
     * Renders mood statistics and insights
     */
    displayMoodStats(stats) {
        // Update stat cards
        document.getElementById('topMoodStat').textContent =
            stats.moodCounts[0]?._id ? this.capitalizeMood(stats.moodCounts[0]._id) : 'None';

        document.getElementById('totalSessionsStat').textContent = stats.summary.totalMoodLogs;
        document.getElementById('moodVarietyStat').textContent = `${stats.summary.moodVariety}/6`;

        // Display insights
        const insightsList = document.getElementById('insightsList');
        if (stats.insights && stats.insights.length > 0) {
            let html = '';
            stats.insights.forEach(insight => {
                html += `
                    <div class="insight-item">
                        <div class="insight-title">
                            <span class="insight-icon">${insight.icon}</span>
                            ${insight.title}
                        </div>
                        <div class="insight-message">${insight.message}</div>
                    </div>
                `;
            });
            insightsList.innerHTML = html;
        } else {
            insightsList.innerHTML = `
                <div class="empty-state">
                    <p>Keep using Moodify to unlock personalized insights!</p>
                </div>
            `;
        }
    }

    capitalizeMood(mood) {
        return mood.charAt(0).toUpperCase() + mood.slice(1);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new MoodifyApp();
});
