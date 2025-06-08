class MoodifyApp {
    constructor() {
        this.currentMood = null;
        this.isAuthenticated = false;
        this.init();
    }

    async init() {
        await this.checkAuthStatus();
        await this.loadMoods();
        this.setupEventListeners();
    }

    async checkAuthStatus() {
        try {
            const response = await fetch('/auth/status');
            const data = await response.json();
            
            this.isAuthenticated = data.authenticated;
            
            if (this.isAuthenticated) {
                document.getElementById('loginSection').style.display = 'none';
                document.getElementById('userSection').style.display = 'block';
                document.getElementById('moodSection').style.display = 'block';
                document.getElementById('userName').textContent = data.user?.display_name || 'Spotify User';
            } else {
                document.getElementById('loginSection').style.display = 'block';
                document.getElementById('userSection').style.display = 'none';
                document.getElementById('moodSection').style.display = 'none';
            }
        } catch (error) {
            console.error('Error checking auth status:', error);
        }
    }

    async loadMoods() {
        if (!this.isAuthenticated) return;

        try {
            const response = await fetch('/moods');
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

    async getRecommendations(mood) {
        const resultsDiv = document.getElementById('results');
        resultsDiv.innerHTML = '<div class="loading">🎵 Finding perfect tracks for your mood...</div>';

        try {
            const response = await fetch(`/recommendations?mood=${mood}&limit=10`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to get recommendations');
            }

            this.displayResults(data);
        } catch (error) {
            console.error('Error getting recommendations:', error);
            resultsDiv.innerHTML = `
                <div class="error">
                    <h3>Oops! Something went wrong</h3>
                    <p>${error.message}</p>
                    ${error.message.includes('login') ? '<a href="/login" class="btn">Login Again</a>' : ''}
                </div>
            `;
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
            <h3>🎵 ${this.capitalizeMood(data.mood)} vibes (${data.tracks.length} tracks)</h3>
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
