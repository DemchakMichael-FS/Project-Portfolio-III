# 🚀 GitHub Project Setup Guide

This guide will help you set up the GitHub Projects and Issues for the Moodify project to complete the Agile project planning requirements.

## 📋 Step 1: Create GitHub Project

1. Go to your repository: https://github.com/DemchakMichael-FS/Project-Portfolio-III
2. Click on the "Projects" tab
3. Click "New project"
4. Choose "Board" template
5. Name it "Moodify Development"

## 🎯 Step 2: Create Milestones

Go to Issues → Milestones → New milestone and create these 3 milestones:

### Milestone 1: Project Setup
- **Title**: 🏗️ Project Setup
- **Description**: Initialize Node.js project with proper structure, dependencies, and configuration
- **Due date**: Week 1

### Milestone 2: Spotify OAuth
- **Title**: 🔐 Spotify OAuth Integration  
- **Description**: Implement secure Spotify authentication using OAuth 2.0 Authorization Code Flow
- **Due date**: Week 1

### Milestone 3: Mood Logic
- **Title**: 🎭 Mood Logic & Recommendations
- **Description**: Create mood mapping system and integrate with Spotify recommendations API
- **Due date**: Week 2

## 📝 Step 3: Create Issues for Milestone 1 (Project Setup)

Copy and paste these issues into GitHub Issues, assigning them to "Project Setup" milestone:

### Issue 1: Initialize Node.js Project Structure
```
**Title**: Initialize Node.js project with proper folder structure

**Description**: 
Set up the basic Node.js project structure with organized folders for maintainable code.

**Tasks**:
- [ ] Create src/ folder for main application code
- [ ] Create routes/ folder for Express route handlers  
- [ ] Create controllers/ folder for business logic
- [ ] Create config/ folder for configuration files
- [ ] Create public/ folder for static assets
- [ ] Initialize package.json with project metadata

**Acceptance Criteria**:
- Folder structure follows Node.js best practices
- All folders are created and properly organized
- package.json contains correct project information

**Labels**: enhancement, milestone-1
**Milestone**: Project Setup
```

### Issue 2: Set Up Express Server and Middleware
```
**Title**: Configure Express.js server with essential middleware

**Description**:
Create the main Express server with necessary middleware for handling requests, sessions, and static files.

**Tasks**:
- [ ] Install Express.js and create main server file
- [ ] Configure express-session for user sessions
- [ ] Set up static file serving for public assets
- [ ] Add JSON and URL-encoded body parsing
- [ ] Implement error handling middleware
- [ ] Configure server to run on configurable port

**Acceptance Criteria**:
- Server starts successfully on specified port
- All middleware is properly configured
- Error handling works correctly
- Static files are served from public folder

**Labels**: enhancement, milestone-1
**Milestone**: Project Setup
```

### Issue 3: Environment Variables and Security Setup
```
**Title**: Configure environment variables and security settings

**Description**:
Set up secure environment variable management and create necessary configuration files.

**Tasks**:
- [ ] Install and configure dotenv package
- [ ] Create .env.example template file
- [ ] Set up environment variables for Spotify API
- [ ] Configure session secret and security settings
- [ ] Create comprehensive .gitignore file
- [ ] Ensure .env is not tracked by Git

**Acceptance Criteria**:
- .env.example contains all required variables
- .env file is properly ignored by Git
- Environment variables are loaded correctly
- Security settings are properly configured

**Labels**: security, milestone-1
**Milestone**: Project Setup
```

## 📝 Step 4: Create Issues for Milestone 2 (Spotify OAuth)

### Issue 4: Implement Spotify OAuth Login Flow
```
**Title**: Create Spotify OAuth authorization flow

**Description**:
Implement the initial OAuth flow to redirect users to Spotify for authentication.

**Tasks**:
- [ ] Create Spotify app configuration module
- [ ] Implement /login route with proper scopes
- [ ] Generate and validate state parameter for security
- [ ] Redirect users to Spotify authorization URL
- [ ] Handle OAuth scope permissions properly

**Acceptance Criteria**:
- /login route redirects to Spotify correctly
- State parameter is generated and stored
- Required scopes are requested
- Security best practices are followed

**Labels**: feature, oauth, milestone-2
**Milestone**: Spotify OAuth
```

### Issue 5: Handle OAuth Callback and Token Exchange
```
**Title**: Process OAuth callback and exchange code for tokens

**Description**:
Handle the callback from Spotify and exchange the authorization code for access tokens.

**Tasks**:
- [ ] Create /callback route handler
- [ ] Validate state parameter for security
- [ ] Exchange authorization code for access token
- [ ] Store tokens securely in user session
- [ ] Handle OAuth errors gracefully
- [ ] Fetch user profile information

**Acceptance Criteria**:
- Callback properly validates state parameter
- Tokens are successfully exchanged and stored
- User profile data is retrieved and stored
- Error cases are handled appropriately

**Labels**: feature, oauth, milestone-2
**Milestone**: Spotify OAuth
```

### Issue 6: Authentication Middleware and Session Management
```
**Title**: Create authentication middleware and session handling

**Description**:
Implement middleware to protect routes and manage user authentication state.

**Tasks**:
- [ ] Create authentication middleware function
- [ ] Implement token expiration checking
- [ ] Add logout functionality
- [ ] Create auth status endpoint
- [ ] Handle token refresh if needed
- [ ] Secure session configuration

**Acceptance Criteria**:
- Protected routes require valid authentication
- Token expiration is properly handled
- Logout clears session data
- Auth status endpoint works correctly

**Labels**: feature, security, milestone-2
**Milestone**: Spotify OAuth
```

## 📝 Step 5: Create Issues for Milestone 3 (Mood Logic)

### Issue 7: Design Mood Mapping System
```
**Title**: Create mood to audio features mapping system

**Description**:
Design and implement the core mood mapping logic that translates user moods into Spotify audio feature parameters.

**Tasks**:
- [ ] Research Spotify audio features (valence, energy, tempo, etc.)
- [ ] Design mood categories (happy, sad, energetic, relaxed, etc.)
- [ ] Create getMoodFeatures() function
- [ ] Map each mood to specific audio feature ranges
- [ ] Add input validation and error handling
- [ ] Create comprehensive mood documentation

**Acceptance Criteria**:
- At least 4 distinct mood categories implemented
- Each mood maps to appropriate audio features
- Function handles invalid inputs gracefully
- Mood mappings are well-documented

**Labels**: feature, core-logic, milestone-3
**Milestone**: Mood Logic
```

### Issue 8: Integrate Spotify Recommendations API
```
**Title**: Connect to Spotify Web API for music recommendations

**Description**:
Implement the connection to Spotify's recommendations endpoint using the mood-based audio features.

**Tasks**:
- [ ] Create recommendations API route
- [ ] Integrate with Spotify /v1/recommendations endpoint
- [ ] Apply mood features as query parameters
- [ ] Add genre seeding based on mood
- [ ] Format and return track data
- [ ] Implement proper error handling

**Acceptance Criteria**:
- /recommendations endpoint accepts mood parameter
- Spotify API integration works correctly
- Track data is properly formatted
- Error responses are informative

**Labels**: feature, api-integration, milestone-3
**Milestone**: Mood Logic
```

### Issue 9: Create Frontend User Interface
```
**Title**: Build responsive web interface for mood selection

**Description**:
Create an intuitive web interface that allows users to select moods and view recommendations.

**Tasks**:
- [ ] Design responsive HTML layout
- [ ] Create mood selection buttons
- [ ] Implement JavaScript for API communication
- [ ] Display track recommendations in organized list
- [ ] Add loading states and error handling
- [ ] Style with CSS for professional appearance

**Acceptance Criteria**:
- Interface is responsive and mobile-friendly
- Mood buttons trigger API requests correctly
- Track recommendations display properly
- Loading and error states are handled
- Design is visually appealing

**Labels**: frontend, ui/ux, milestone-3
**Milestone**: Mood Logic
```

## ✅ Step 6: Mark Completed Issues

Since the project is already complete, mark all issues as "Closed" and move them to the "Done" column in your project board.

## 🎯 Final Checklist

After setting up the GitHub project:

- [ ] Repository is public and all code is pushed
- [ ] .gitignore includes .env and node_modules
- [ ] .env.example is included with all required variables
- [ ] README.md is comprehensive with setup instructions
- [ ] 3 Milestones created (Project Setup, Spotify OAuth, Mood Logic)
- [ ] 9+ Issues created with clear descriptions
- [ ] All Week 1 milestone issues marked as Closed
- [ ] Project board shows completed work

This setup demonstrates proper Agile project management and GitHub workflow practices!
