from flask import Flask, render_template, request, jsonify, session
from flask_socketio import SocketIO, emit, join_room, leave_room
import os
import json
import uuid
import time
from datetime import datetime
import google.generativeai as genai
from dotenv import load_dotenv
import threading
import queue

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'livemuse-secret-key-2024')
app.config['STATIC_FOLDER'] = 'static'

# Configure Google Gemini AI
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

# Initialize SocketIO
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Global state
rooms = {}
audio_queues = {}
visual_queues = {}

# Global user stats (in a real app, this would be in a database)
user_stats = {}
user_achievements = {}

class MusicRoom:
    def __init__(self, room_id, name, creator):
        self.room_id = room_id
        self.name = name
        self.creator = creator
        self.participants = {creator: {'username': creator, 'instrument': 'piano', 'color': '#FF6B6B'}}
        self.music_history = []
        self.chat_messages = []  # Store chat messages with reactions
        self.current_track = {
            'bpm': 120,
            'key': 'C',
            'genre': 'electronic',
            'mood': 'energetic'
        }
        self.ai_suggestions = []
        self.ai_visualization = None  # Store AI-generated visualization
        self.created_at = datetime.now()
        self.is_active = True
        
        # Initialize user stats for this room
        self.user_stats = {}
        self.leaderboard = []
        
        # Voice call participants tracking
        self.voice_participants = {}  # username -> voice call data

    def add_participant(self, username, instrument='piano'):
        colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8']
        used_colors = [p['color'] for p in self.participants.values()]
        available_colors = [c for c in colors if c not in used_colors]
        color = available_colors[0] if available_colors else colors[0]
        
        self.participants[username] = {
            'username': username,
            'instrument': instrument,
            'color': color
        }
        
        # Initialize user stats
        if username not in self.user_stats:
            self.user_stats[username] = {
                'username': username,
                'notes_played': 0,
                'sessions_joined': 1,
                'total_time': 0,
                'join_time': time.time(),
                'achievements': []
            }
        
        self.update_leaderboard()

    def remove_participant(self, username):
        if username in self.participants:
            # Update total time before removing
            if username in self.user_stats:
                self.user_stats[username]['total_time'] += time.time() - self.user_stats[username]['join_time']
            
            del self.participants[username]
            self.update_leaderboard()

    def add_music_note(self, username, note_data):
        if username in self.participants:
            note = {
                'id': str(uuid.uuid4()),
                'username': username,
                'instrument': self.participants[username]['instrument'],
                'color': self.participants[username]['color'],
                'note': note_data['note'],
                'velocity': note_data.get('velocity', 0.8),
                'duration': note_data.get('duration', 0.5),
                'timestamp': time.time(),
                'position': note_data.get('position', {'x': 0, 'y': 0})
            }
            self.music_history.append(note)
            
            # Update user stats
            if username in self.user_stats:
                self.user_stats[username]['notes_played'] += 1
                self.check_achievements(username)
                self.update_leaderboard()
            
            return note
        return None

    def add_chat_message(self, username, message):
        chat_data = {
            'id': str(uuid.uuid4()),
            'username': username,
            'message': message,
            'timestamp': time.time(),
            'reactions': {}  # emoji -> [usernames]
        }
        self.chat_messages.append(chat_data)
        return chat_data

    def add_chat_reaction(self, message_id, username, emoji):
        for message in self.chat_messages:
            if message['id'] == message_id:
                if emoji not in message['reactions']:
                    message['reactions'][emoji] = []
                if username not in message['reactions'][emoji]:
                    message['reactions'][emoji].append(username)
                return message
        return None

    def check_achievements(self, username):
        """Check and award achievements based on user stats"""
        if username not in self.user_stats:
            return
        
        stats = self.user_stats[username]
        achievements = []
        
        # Note-based achievements
        if stats['notes_played'] >= 10 and 'first_notes' not in stats['achievements']:
            achievements.append('first_notes')
        if stats['notes_played'] >= 50 and 'melody_maker' not in stats['achievements']:
            achievements.append('melody_maker')
        if stats['notes_played'] >= 100 and 'virtuoso' not in stats['achievements']:
            achievements.append('virtuoso')
        
        # Session-based achievements
        if stats['sessions_joined'] >= 5 and 'jam_regular' not in stats['achievements']:
            achievements.append('jam_regular')
        if stats['sessions_joined'] >= 10 and 'music_legend' not in stats['achievements']:
            achievements.append('music_legend')
        
        # Time-based achievements
        if stats['total_time'] >= 3600 and 'dedicated_player' not in stats['achievements']:
            achievements.append('dedicated_player')
        
        # Add new achievements
        for achievement in achievements:
            if achievement not in stats['achievements']:
                stats['achievements'].append(achievement)

    def update_leaderboard(self):
        """Update the leaderboard based on current user stats"""
        self.leaderboard = sorted(
            self.user_stats.values(),
            key=lambda x: (x['notes_played'], x['sessions_joined']),
            reverse=True
        )[:10]  # Top 10

    def add_voice_participant(self, username):
        """Add a user to voice call participants"""
        if username in self.participants:
            self.voice_participants[username] = {
                'username': username,
                'joined_at': time.time(),
                'muted': False
            }
            return True
        return False

    def remove_voice_participant(self, username):
        """Remove a user from voice call participants"""
        if username in self.voice_participants:
            del self.voice_participants[username]
            return True
        return False

    def get_voice_participants(self):
        """Get list of voice call participants"""
        return list(self.voice_participants.values())

    def update_voice_mute_status(self, username, muted):
        """Update voice mute status for a user"""
        if username in self.voice_participants:
            self.voice_participants[username]['muted'] = muted
            return True
        return False

    def get_ai_visualization(self):
        """Generate AI visualization based on current music"""
        if not self.music_history:
            return {
                'type': 'waveform',
                'colors': ['#FF6B6B', '#4ECDC4', '#45B7D1']
            }
        
        # Analyze recent notes for visualization
        recent_notes = self.music_history[-10:] if len(self.music_history) >= 10 else self.music_history
        
        # Simple visualization based on note frequency
        note_freq = {}
        for note in recent_notes:
            note_name = note['note']
            note_freq[note_name] = note_freq.get(note_name, 0) + 1
        
        if len(note_freq) > 3:
            return {
                'type': 'particles',
                'colors': ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7']
            }
        elif len(note_freq) > 1:
            return {
                'type': 'geometric',
                'colors': ['#FF6B6B', '#4ECDC4', '#45B7D1']
            }
        else:
            return {
                'type': 'waveform',
                'colors': ['#FF6B6B', '#4ECDC4']
            }

    def get_ai_suggestion(self):
        """Generate AI suggestion based on current music"""
        if not self.music_history:
            return {
                'type': 'general',
                'suggestion': 'Try playing some notes to get started!',
                'reasoning': 'No music has been played yet.'
            }
        
        recent_notes = self.music_history[-5:] if len(self.music_history) >= 5 else self.music_history
        
        # Simple suggestion logic
        note_names = [note['note'] for note in recent_notes]
        unique_notes = len(set(note_names))
        
        if unique_notes == 1:
            return {
                'type': 'melody',
                'suggestion': 'Try adding some variety to your melody!',
                'reasoning': 'You\'ve been playing the same note repeatedly.'
            }
        elif unique_notes < 3:
            return {
                'type': 'harmony',
                'suggestion': 'Consider adding some harmony notes!',
                'reasoning': 'You have a simple melody, try adding chords.'
            }
        else:
            return {
                'type': 'rhythm',
                'suggestion': 'Great melody! Try varying the rhythm.',
                'reasoning': 'You have good note variety, now work on timing.'
            }

# Room management
def create_room(name, creator):
    room_id = str(uuid.uuid4())
    room = MusicRoom(room_id, name, creator)
    rooms[room_id] = room
    return room

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/room/<room_id>')
def room(room_id):
    if room_id in rooms:
        room = rooms[room_id]
        return render_template('room.html', room=room)
    else:
        return "Room not found", 404

# API Routes
@app.route('/api/rooms', methods=['GET'])
def get_rooms():
    room_list = []
    for room_id, room in rooms.items():
        if room.is_active:
            room_list.append({
                'id': room_id,
                'name': room.name,
                'creator': room.creator,
                'participant_count': len(room.participants),
                'created_at': room.created_at.isoformat()
            })
    return jsonify(room_list)

@app.route('/api/rooms', methods=['POST'])
def create_room_api():
    data = request.get_json()
    name = data.get('name')
    creator = data.get('creator')
    
    if not name or not creator:
        return jsonify({'error': 'Name and creator are required'}), 400
    
    room = create_room(name, creator)
    return jsonify({
        'room_id': room.room_id,
        'name': room.name,
        'creator': room.creator
    })

@app.route('/api/rooms/<room_id>')
def get_room_info(room_id):
    if room_id in rooms:
        room = rooms[room_id]
        return jsonify({
            'id': room_id,
            'name': room.name,
            'creator': room.creator,
            'participants': room.participants,
            'current_track': room.current_track
        })
    else:
        return jsonify({'error': 'Room not found'}), 404

# Socket.IO Events
@socketio.on('connect')
def handle_connect():
    print(f"Client connected: {request.sid}")

@socketio.on('disconnect')
def handle_disconnect():
    print(f"Client disconnected: {request.sid}")

@socketio.on('join_room')
def handle_join_room(data):
    room_id = data['room_id']
    username = data['username']
    instrument = data.get('instrument', 'piano')
    
    if room_id in rooms:
        room = rooms[room_id]
        room.add_participant(username, instrument)
        join_room(room_id)
        
        # Send room state to the new user
        emit('room_state', {
            'bpm': room.current_track['bpm'],
            'key': room.current_track['key'],
            'genre': room.current_track['genre'],
            'participants': room.participants
        })
        
        # Notify all users about the new participant
        emit('user_joined', {
            'username': username,
            'instrument': instrument
        }, room=room_id)
    else:
        emit('error', {'message': 'Room not found'})

@socketio.on('leave_room')
def handle_leave_room(data):
    room_id = data['room_id']
    username = data['username']
    
    if room_id in rooms:
        room = rooms[room_id]
        room.remove_participant(username)
        leave_room(room_id)
        
        # Notify all users about the participant leaving
        emit('user_left', {
            'username': username
        }, room=room_id)
        
        # If room is empty, mark it as inactive
        if len(room.participants) == 0:
            room.is_active = False

@socketio.on('play_note')
def handle_play_note(data):
    room_id = data['room_id']
    username = data['username']
    note_data = {
        'note': data['note'],
        'velocity': data.get('velocity', 0.8),
        'duration': data.get('duration', 0.5)
    }
    
    if room_id in rooms:
        room = rooms[room_id]
        note = room.add_music_note(username, note_data)
        
        if note:
            emit('note_played', note, room=room_id)
            
            # Generate AI suggestion every 5 notes
            if len(room.music_history) % 5 == 0:
                suggestion = room.get_ai_suggestion()
                emit('ai_suggestion', suggestion, room=room_id)

@socketio.on('change_track_settings')
def handle_change_track_settings(data):
    room_id = data['room_id']
    settings = data['settings']
    
    if room_id in rooms:
        room = rooms[room_id]
        room.current_track.update(settings)
        
        emit('track_settings_changed', room.current_track, room=room_id)

@socketio.on('request_ai_suggestion')
def handle_request_ai_suggestion(data):
    room_id = data['room_id']
    
    if room_id in rooms:
        room = rooms[room_id]
        suggestion = room.get_ai_suggestion()
        emit('ai_suggestion', suggestion, room=room_id)

@socketio.on('chat_message')
def handle_chat_message(data):
    room_id = data['room_id']
    username = data['username']
    message = data['message']
    
    if room_id in rooms:
        room = rooms[room_id]
        chat_data = room.add_chat_message(username, message)
        
        emit('chat_message', chat_data, room=room_id)

@socketio.on('chat_reaction')
def handle_chat_reaction(data):
    room_id = data['room_id']
    message_id = data['message_id']
    username = data['username']
    emoji = data['emoji']
    
    if room_id in rooms:
        room = rooms[room_id]
        updated_message = room.add_chat_reaction(message_id, username, emoji)
        
        if updated_message:
            emit('chat_reaction', {
                'message_id': message_id,
                'reactions': updated_message['reactions']
            }, room=room_id)

@socketio.on('request_leaderboard')
def handle_request_leaderboard(data):
    room_id = data['room_id']
    
    if room_id in rooms:
        room = rooms[room_id]
        emit('leaderboard_update', room.leaderboard, room=room_id)

@socketio.on('request_ai_visualization')
def handle_request_ai_visualization(data):
    room_id = data['room_id']
    
    if room_id in rooms:
        room = rooms[room_id]
        visualization = room.get_ai_visualization()
        emit('ai_visualization', visualization, room=room_id)

# Voice Call Events
@socketio.on('join_voice_call')
def handle_join_voice_call(data):
    room_id = data['room_id']
    username = data['username']
    
    if room_id in rooms:
        room = rooms[room_id]
        if room.add_voice_participant(username):
            # Send current voice participants to the new user
            emit('voice_participants_list', {
                'participants': room.get_voice_participants()
            })
            
            # Notify all users about the new voice participant
            emit('voice_user_joined', {
                'username': username,
                'participants': room.get_voice_participants()
            }, room=room_id)

@socketio.on('leave_voice_call')
def handle_leave_voice_call(data):
    room_id = data['room_id']
    username = data['username']
    
    if room_id in rooms:
        room = rooms[room_id]
        if room.remove_voice_participant(username):
            # Notify all users about the voice participant leaving
            emit('voice_user_left', {
                'username': username,
                'participants': room.get_voice_participants()
            }, room=room_id)

@socketio.on('voice_offer')
def handle_voice_offer(data):
    room_id = data['room_id']
    target_username = data['target_username']
    
    if room_id in rooms:
        emit('voice_offer', {
            'from_username': target_username,
            'offer': data['offer']
        }, room=room_id)

@socketio.on('voice_answer')
def handle_voice_answer(data):
    room_id = data['room_id']
    target_username = data['target_username']
    
    if room_id in rooms:
        emit('voice_answer', {
            'from_username': target_username,
            'answer': data['answer']
        }, room=room_id)

@socketio.on('voice_ice_candidate')
def handle_voice_ice_candidate(data):
    room_id = data['room_id']
    target_username = data['target_username']
    
    if room_id in rooms:
        emit('voice_ice_candidate', {
            'from_username': target_username,
            'candidate': data['candidate']
        }, room=room_id)

@socketio.on('voice_mute_status')
def handle_voice_mute_status(data):
    room_id = data['room_id']
    username = data['username']
    muted = data['muted']
    
    if room_id in rooms:
        room = rooms[room_id]
        if room.update_voice_mute_status(username, muted):
            emit('voice_mute_status', {
                'username': username,
                'muted': muted
            }, room=room_id)

@socketio.on('change_instrument')
def handle_change_instrument(data):
    room_id = data['room_id']
    username = data['username']
    instrument = data['instrument']
    
    if room_id in rooms:
        room = rooms[room_id]
        if username in room.participants:
            room.participants[username]['instrument'] = instrument
            
            # Notify all participants about the instrument change
            emit('instrument_changed', {
                'username': username,
                'instrument': instrument
            }, room=room_id)

@socketio.on('request_voice_participants')
def handle_request_voice_participants(data):
    room_id = data['room_id']
    
    if room_id in rooms:
        room = rooms[room_id]
        emit('voice_participants_list', {
            'participants': room.get_voice_participants()
        })

if __name__ == '__main__':
    print("🎵 LiveMuse - Real-time AI Music Collaboration")
    print("Starting server...")
    
    # Check for required environment variables
    if not os.getenv('GEMINI_API_KEY'):
        print("⚠️  WARNING: GEMINI_API_KEY not set. AI features will be disabled.")
    
    # Production vs Development
    if os.getenv('FLASK_ENV') == 'production':
        print("🚀 Running in PRODUCTION mode")
        socketio.run(app, host='0.0.0.0', port=int(os.getenv('PORT', 5000)))
    else:
        print("🔧 Running in DEVELOPMENT mode")
        socketio.run(app, debug=True, host='0.0.0.0', port=5000) 