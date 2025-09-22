# Secure Quiz - Audience Polling System

A real-time web-based polling system designed for audience engagement and secure voting. This application provides a comprehensive polling system with real-time results and professional administration tools.

## Features

### 📊 Secure Polling System

* **Real-time voting** with A, B, C, D options
* **Device-based voting** (one vote per device)
* **Live results display** with vote counts and percentages
* **Professional poll management** with start/stop/reset controls
* **Real-time statistics** including vote rates and leading options
* **Secure voting** with device tracking to prevent duplicate votes

### 🎮 Professional Interface

* **Poll Admin Panel** for comprehensive poll management
* **Live Voting Page** for audience participation
* **Real-time Display Screen** for live results
* **Modern responsive design** with beautiful UI
* **Real-time updates** with instant polling
* **Fullscreen support** for all pages

## Technology Stack

* **Backend**: Python Flask
* **Real-time Communication**: Flask-SocketIO
* **Frontend**: HTML5, CSS3, JavaScript
* **Data Storage**: JSON file-based storage
* **WebSocket**: Socket.IO for real-time updates
* **Production Server**: Gunicorn with Eventlet

## Quick Start

### Local Development

1. **Install dependencies**  
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the application**  
   ```bash
   python app.py
   ```

3. **Access the application**  
   * Poll Admin Panel: `http://localhost:5000/poll-admin`  
   * Display Screen: `http://localhost:5000/display`  
   * Audience Poll: `http://localhost:5000/poll`  
   * Main Admin: `http://localhost:5000/admin`

### Production Deployment

#### Deploy to Render.com

1. **Fork this repository** to your GitHub account

2. **Connect to Render**:
   - Go to [Render.com](https://render.com)
   - Sign up/login with your GitHub account
   - Click "New +" → "Web Service"
   - Connect your repository

3. **Configure deployment**:
   - **Name**: `secure-quiz` (or your preferred name)
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn --worker-class eventlet -w 1 --bind 0.0.0.0:$PORT wsgi:app`

4. **Environment Variables** (optional):
   - `SECRET_KEY`: Your production secret key
   - `FLASK_ENV`: `production`

5. **Deploy**: Click "Create Web Service"

#### Deploy to Heroku

1. **Install Heroku CLI** and login

2. **Create Heroku app**:
   ```bash
   heroku create your-app-name
   ```

3. **Set environment variables**:
   ```bash
   heroku config:set SECRET_KEY=your-production-secret-key
   heroku config:set FLASK_ENV=production
   ```

4. **Deploy**:
   ```bash
   git add .
   git commit -m "Deploy to production"
   git push heroku main
   ```

#### Deploy to Railway

1. **Connect GitHub repository** to Railway
2. **Railway will auto-detect** Python and install dependencies
3. **Set environment variables** in Railway dashboard
4. **Deploy automatically** on git push

## Usage Guide

### For Administrators

1. **Access Admin Panel** (`/admin`)  
   * Configure team names (up to 6 teams)  
   * Start/stop/reset Fast Finger games  
   * Manage audience polls  
   * View game logs and statistics

2. **Team Management**  
   * Enter custom team names in the Team Management section  
   * Click "Save Teams" to update team names  
   * Teams will be reflected across all interfaces

3. **Game Control**  
   * **Start Game**: Activates the buzzer system  
   * **Stop Game**: Deactivates the buzzer system  
   * **Reset Round**: Clears current round and prepares for next

4. **Poll Management**  
   * **Start Poll**: Creates a new audience poll with A, B, C, D options  
   * **Stop Poll**: Ends the current poll  
   * **Reset Poll**: Clears poll data and prepares for new poll

### For Teams

1. **Access Buzz-In Page** (`/buzz`)  
   * Select your team from the available options  
   * Click your team button when ready to buzz in  
   * First team to buzz wins the round

### For Audience

1. **View Display Screen** (`/display`)  
   * Watch live game updates  
   * See current game state and team standings  
   * View poll results in real-time

2. **Participate in Polls** (`/poll`)  
   * Select from A, B, C, D options  
   * Vote on current poll question  
   * View live results

## File Structure

```
secure-quiz/
├── app.py                 # Main Flask application
├── wsgi.py               # Production WSGI entry point
├── data.json             # Poll data storage
├── requirements.txt      # Python dependencies
├── render.yaml          # Render.com deployment config
├── .gitignore           # Git ignore rules
├── README.md            # This file
├── static/              # Static assets
│   ├── admin.js         # Admin panel JavaScript
│   ├── display.js       # Display screen JavaScript
│   ├── poll.js          # Poll page JavaScript
│   ├── poll-admin.js    # Poll admin JavaScript
│   ├── fullscreen.js    # Fullscreen functionality
│   ├── style.css        # Main stylesheet
│   ├── secure-logo.png  # Company logo
│   └── favicon.svg      # Website icon
└── templates/           # HTML templates
    ├── admin.html       # Admin panel
    ├── display.html     # Display screen
    ├── index.html       # Home page
    ├── poll.html        # Audience poll page
    └── poll-admin.html  # Poll administration
```

## API Endpoints

### Poll Management

* `GET /api/poll` - Get current poll state
* `POST /api/poll` - Create new poll
* `POST /api/poll/vote` - Submit vote
* `POST /api/poll/stop` - Stop poll
* `POST /api/poll/reset` - Reset poll

### WebSocket Events

* `poll_started` - Emitted when a poll is created
* `vote_received` - Emitted when a vote is submitted
* `poll_stopped` - Emitted when a poll is stopped
* `poll_reset` - Emitted when a poll is reset

## Configuration

### Environment Variables

* `SECRET_KEY` - Flask secret key for sessions (required in production)
* `FLASK_ENV` - Set to `production` for production deployment
* `PORT` - Port number (automatically set by hosting platform)

### Default Settings

* **Port**: 5000 (development) / $PORT (production)
* **Host**: 0.0.0.0 (accessible from any IP)
* **Debug Mode**: Enabled in development, disabled in production
* **Poll Options**: A, B, C, D
* **Async Mode**: Eventlet (for production WebSocket support)

## Browser Compatibility

* Chrome (recommended)
* Firefox
* Safari
* Edge
* Mobile browsers (responsive design)

## License

This project is developed for Secure Meters Ltd. All rights reserved.

---

**Developed by**: Secure Meters Ltd  
**Version**: 1.0  
**Last Updated**: 2025
