from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit
import json
import os
from datetime import datetime

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-here')
socketio = SocketIO(app, cors_allowed_origins="*")

# Data file path
DATA_FILE = 'data.json'

def load_data():
    """Load data from JSON file"""
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r') as f:
            data = json.load(f)
            # Ensure voted_devices is a set
            if 'poll' in data and 'voted_devices' in data['poll']:
                if isinstance(data['poll']['voted_devices'], list):
                    data['poll']['voted_devices'] = set(data['poll']['voted_devices'])
            return data
    return {
        'poll': {
            'active': False,
            'question': '',
            'options': ['A', 'B', 'C', 'D'],
            'votes': {'A': 0, 'B': 0, 'C': 0, 'D': 0},
            'voted_devices': set()
        }
    }

def save_data(data):
    """Save data to JSON file"""
    # Convert set to list for JSON serialization
    if 'poll' in data and 'voted_devices' in data['poll']:
        if isinstance(data['poll']['voted_devices'], set):
            data['poll']['voted_devices'] = list(data['poll']['voted_devices'])
    
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=2)


# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/admin')
def admin():
    return render_template('admin.html')

@app.route('/display')
def display():
    return render_template('display.html')

@app.route('/poll')
def poll():
    return render_template('poll.html')

@app.route('/poll-admin')
def poll_admin():
    return render_template('poll-admin.html')

# API Routes

# Poll API Routes
@app.route('/api/poll', methods=['GET'])
def get_poll():
    data = load_data()
    poll_data = data['poll'].copy()
    poll_data['voted_devices'] = list(poll_data['voted_devices'])
    return jsonify(poll_data)

@app.route('/api/poll', methods=['POST'])
def create_poll():
    data = load_data()
    question = request.json.get('question', 'Quick Poll')
    data['poll'] = {
        'active': True,
        'question': question,
        'options': ['A', 'B', 'C', 'D'],
        'votes': {'A': 0, 'B': 0, 'C': 0, 'D': 0},
        'voted_devices': set()
    }
    save_data(data)
    socketio.emit('poll_started', {'question': question})
    return jsonify({'success': True})

@app.route('/api/poll/vote', methods=['POST'])
def vote_poll():
    data = load_data()
    if not data['poll']['active']:
        return jsonify({'error': 'No active poll'}), 400
    
    device_id = request.json.get('device_id')
    option = request.json.get('option')
    
    if not device_id or not option:
        return jsonify({'error': 'Missing device_id or option'}), 400
    
    if device_id in data['poll']['voted_devices']:
        return jsonify({'error': 'Already voted'}), 400
    
    if option not in data['poll']['options']:
        return jsonify({'error': 'Invalid option'}), 400
    
    data['poll']['votes'][option] += 1
    # Ensure voted_devices is a set for proper handling
    if isinstance(data['poll']['voted_devices'], list):
        data['poll']['voted_devices'] = set(data['poll']['voted_devices'])
    data['poll']['voted_devices'].add(device_id)
    save_data(data)
    
    socketio.emit('vote_received', {
        'option': option,
        'votes': data['poll']['votes']
    })
    
    return jsonify({'success': True})

@app.route('/api/poll/stop', methods=['POST'])
def stop_poll():
    data = load_data()
    data['poll']['active'] = False
    save_data(data)
    socketio.emit('poll_stopped')
    return jsonify({'success': True})

@app.route('/api/poll/reset', methods=['POST'])
def reset_poll():
    data = load_data()
    data['poll'] = {
        'active': False,
        'question': '',
        'options': ['A', 'B', 'C', 'D'],
        'votes': {'A': 0, 'B': 0, 'C': 0, 'D': 0},
        'voted_devices': set()
    }
    save_data(data)
    socketio.emit('poll_reset')
    return jsonify({'success': True})

# SocketIO Events
@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

if __name__ == '__main__':
    import os
    debug_mode = os.environ.get('FLASK_ENV') != 'production'
    port = int(os.environ.get('PORT', 5000))
    socketio.run(app, debug=debug_mode, host='0.0.0.0', port=port, allow_unsafe_werkzeug=True)
