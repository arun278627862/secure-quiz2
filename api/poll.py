from flask import Flask, request, jsonify
import json
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-here')

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
    return app.send_static_file('templates/index.html')

@app.route('/admin')
def admin():
    return app.send_static_file('templates/admin.html')

@app.route('/display')
def display():
    return app.send_static_file('templates/display.html')

@app.route('/poll')
def poll():
    return app.send_static_file('templates/poll.html')

@app.route('/poll-admin')
def poll_admin():
    return app.send_static_file('templates/poll-admin.html')

# API Routes
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
    
    return jsonify({'success': True})

@app.route('/api/poll/stop', methods=['POST'])
def stop_poll():
    data = load_data()
    data['poll']['active'] = False
    save_data(data)
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
    return jsonify({'success': True})

if __name__ == '__main__':
    app.run(debug=True)
