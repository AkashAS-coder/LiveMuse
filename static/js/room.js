// Global variables
let socket;
let currentInstrument = 'piano';
let currentBPM = 120;
let currentKey = 'C';
let currentGenre = 'pop';
let isRecording = false;
let recordedNotes = [];
let isPlaying = false;
let currentVolume = 0.7;
let synth;
let isMuted = false;
let isInVoiceCall = false;
let voiceParticipants = [];
let peerConnections = {};
let localStream = null;
let followMode = false;
let followedUser = null;
let metronomeInterval = null;
let isMetronomeOn = false;
let performanceStats = {
    notesPlayed: 0,
    accuracy: 0,
    timing: 0,
    complexity: 0
};
let playlist = [];
let currentSong = null;
let backgroundType = 'default';
let recordings = [];
let isRecordingInstrument = false;
let currentRecording = null;

// AI Chord Suggestions and Popular Songs
let currentMelody = [];
let chordSuggestions = [];
let popularSongs = {
    twinkle: {
        name: "Twinkle Twinkle Little Star",
        key: "C",
        notes: ["C4", "C4", "G4", "G4", "A4", "A4", "G4", "F4", "F4", "E4", "E4", "D4", "D4", "C4"],
        chords: ["C", "C", "G", "G", "Am", "Am", "G", "F", "F", "Em", "Em", "Dm", "Dm", "C"]
    },
    ode: {
        name: "Ode to Joy",
        key: "D",
        notes: ["D4", "D4", "E4", "F4", "F4", "E4", "D4", "C4", "C4", "B3", "B3", "A3", "A3", "D4"],
        chords: ["D", "D", "Em", "F#m", "F#m", "Em", "D", "C", "C", "Bm", "Bm", "Am", "Am", "D"]
    },
    amazing: {
        name: "Amazing Grace",
        key: "G",
        notes: ["G4", "B4", "D5", "G5", "D5", "B4", "G4", "D4", "G4", "B4", "D5", "G5"],
        chords: ["G", "G", "D", "G", "D", "G", "G", "D", "G", "G", "D", "G"]
    },
    birthday: {
        name: "Happy Birthday",
        key: "C",
        notes: ["C4", "C4", "D4", "C4", "F4", "E4", "C4", "C4", "D4", "C4", "G4", "F4"],
        chords: ["C", "C", "F", "C", "F", "C", "C", "C", "F", "C", "G", "C"]
    },
    fur_elise: {
        name: "Für Elise",
        key: "Am",
        notes: ["E5", "D#5", "E5", "D#5", "E5", "B4", "D5", "C5", "A4", "C4", "E4", "A4", "B4", "E4", "G#4", "B4", "C5"],
        chords: ["Am", "Am", "Am", "Am", "Am", "E", "E", "Am", "Am", "Am", "Am", "Am", "E", "E", "E", "E", "Am"]
    },
    greensleeves: {
        name: "Greensleeves",
        key: "Am",
        notes: ["A4", "C5", "D5", "E5", "D5", "C5", "A4", "G4", "A4", "C5", "D5", "E5", "D5", "C5", "A4"],
        chords: ["Am", "Am", "Dm", "Dm", "G", "G", "C", "C", "F", "F", "Am", "Am", "Dm", "Dm", "G"]
    },
    moonlight: {
        name: "Moonlight Sonata",
        key: "C#m",
        notes: ["C#5", "G#4", "C#5", "G#4", "C#5", "G#4", "C#5", "G#4", "C#5", "G#4", "C#5", "G#4"],
        chords: ["C#m", "C#m", "C#m", "C#m", "C#m", "C#m", "C#m", "C#m", "C#m", "C#m", "C#m", "C#m"]
    },
    canon: {
        name: "Canon in D",
        key: "D",
        notes: ["D4", "F#4", "A4", "D5", "A4", "F#4", "D4", "F#4", "A4", "D5", "A4", "F#4"],
        chords: ["D", "D", "D", "D", "D", "D", "D", "D", "D", "D", "D", "D"]
    },
    air: {
        name: "Air on G String",
        key: "D",
        notes: ["D4", "F#4", "A4", "D5", "A4", "F#4", "D4", "F#4", "A4", "D5", "A4", "F#4"],
        chords: ["D", "D", "D", "D", "D", "D", "D", "D", "D", "D", "D", "D"]
    },
    minuet: {
        name: "Minuet in G",
        key: "G",
        notes: ["G4", "B4", "D5", "G5", "D5", "B4", "G4", "D4", "G4", "B4", "D5", "G5"],
        chords: ["G", "G", "G", "G", "G", "G", "G", "G", "G", "G", "G", "G"]
    },
    prelude: {
        name: "Prelude in C",
        key: "C",
        notes: ["C4", "E4", "G4", "C5", "G4", "E4", "C4", "E4", "G4", "C5", "G4", "E4"],
        chords: ["C", "C", "C", "C", "C", "C", "C", "C", "C", "C", "C", "C"]
    }
};

// Chord progressions for different keys
const chordProgressions = {
    'C': {
        major: ['C', 'F', 'G', 'Am'],
        pop: ['C', 'Am', 'F', 'G'],
        jazz: ['Cmaj7', 'Dm7', 'Em7', 'Fmaj7', 'G7', 'Am7', 'Bm7b5'],
        blues: ['C7', 'F7', 'G7']
    },
    'G': {
        major: ['G', 'C', 'D', 'Em'],
        pop: ['G', 'Em', 'C', 'D'],
        jazz: ['Gmaj7', 'Am7', 'Bm7', 'Cmaj7', 'D7', 'Em7', 'F#m7b5'],
        blues: ['G7', 'C7', 'D7']
    },
    'D': {
        major: ['D', 'G', 'A', 'Bm'],
        pop: ['D', 'Bm', 'G', 'A'],
        jazz: ['Dmaj7', 'Em7', 'F#m7', 'Gmaj7', 'A7', 'Bm7', 'C#m7b5'],
        blues: ['D7', 'G7', 'A7']
    },
    'Am': {
        minor: ['Am', 'Dm', 'E', 'Am'],
        pop: ['Am', 'F', 'C', 'G'],
        jazz: ['Am7', 'Bm7b5', 'Cmaj7', 'Dm7', 'E7', 'Fmaj7', 'G7'],
        blues: ['Am7', 'Dm7', 'E7']
    }
};

// --- Add global variable for room ID ---
let currentRoomId = null;

// --- Add global variable for username ---
let currentUsername = null;

// WebSocket message handlers - moved to top to avoid reference errors
function handleNotePlayed(data) {
    // Handle note played by other users
    const key = document.querySelector(`[data-note="${data.note}"]`);
    if (key) {
        key.classList.add('active');
        setTimeout(() => {
            key.classList.remove('active');
        }, 200);
    }
    
    addNoteToHistory(data.note);
}

function handleUserJoined(data) {
    showNotification(`${data.username} joined the room`, 'info');
    // Update participants list if needed
}

function handleUserLeft(data) {
    showNotification(`${data.username} left the room`, 'info');
    // Update participants list if needed
}

function handleChatMessage(data) {
    console.log('Received chat message:', data);
    addChatMessage(data.username, data.message, data.id, data.reactions || {});
}

function handleAISuggestion(data) {
    addAISuggestion(data.suggestion);
}

function handleInstrumentChange(data) {
    // Handle instrument change from other users
    showNotification(`${data.username} switched to ${data.instrument}`, 'info');
}

function updateLeaderboard(leaderboard) {
    const leaderboardContainer = document.querySelector('.leaderboard');
    if (!leaderboardContainer) return;
    
    if (leaderboard.length === 0) {
        leaderboardContainer.innerHTML = `
            <div class="empty-leaderboard">
                <i class="fas fa-trophy"></i>
                <p>No players yet</p>
            </div>
        `;
        return;
    }
    
    leaderboardContainer.innerHTML = leaderboard.map((player, index) => `
        <div class="leaderboard-item ${index < 3 ? 'top-three' : ''}">
            <div class="rank">#${index + 1}</div>
            <div class="user-info">
                <div class="username">${player.username}</div>
                <div class="achievements">
                    ${player.achievements.map(achievement => `
                        <span class="achievement-badge">${achievement}</span>
                    `).join('')}
                </div>
            </div>
            <div class="stats">
                <div class="stat">${player.notesPlayed} notes</div>
                <div class="stat">${player.accuracy}% accuracy</div>
            </div>
        </div>
    `).join('');
}

// IMMEDIATELY make critical functions globally available
window.showRightTab = function(tab) {
    console.log('showRightTab called with tab:', tab);
    
    // Remove active from all buttons and contents
    document.querySelectorAll('.right-tab-btn').forEach(btn => {
        btn.classList.remove('active');
        console.log('Removed active from button:', btn.id);
    });
    
    document.querySelectorAll('.right-tab-content').forEach(content => {
        content.style.display = 'none';
        console.log('Hidden content:', content.id);
    });
    
    // Add active to selected
    const btn = document.getElementById('tab-' + tab);
    const content = document.getElementById('right-tab-' + tab);
    
    console.log('Looking for button with id: tab-' + tab, 'Found:', btn);
    console.log('Looking for content with id: right-tab-' + tab, 'Found:', content);
    
    if (btn) {
        btn.classList.add('active');
        console.log('Added active to button:', btn.id);
    } else {
        console.error('Button not found for tab:', tab);
    }
    
    if (content) {
        content.style.display = 'block';
        console.log('Showed content:', content.id);
    } else {
        console.error('Content not found for tab:', tab);
    }
    
    // Remove notification - just log to console
    console.log(`Switched to ${tab} tab`);
    
    // Also log all available tabs for debugging
    console.log('Available tab buttons:', Array.from(document.querySelectorAll('.right-tab-btn')).map(b => b.id));
    console.log('Available tab contents:', Array.from(document.querySelectorAll('.right-tab-content')).map(c => c.id));
};

// Real emoji picker function - define it immediately
function showChatEmojiPicker() {
    console.log('Showing chat emoji picker...');
    
    // Remove any existing emoji picker
    const existingPicker = document.querySelector('.chat-emoji-picker');
    if (existingPicker) {
        console.log('Removing existing emoji picker');
        existingPicker.remove();
        return;
    }
    
    const chatInput = document.querySelector('.chat-input');
    console.log('Looking for .chat-input, found:', chatInput);
    if (!chatInput) {
        console.error('Chat input container not found!');
        console.log('Available elements with chat-input class:', document.querySelectorAll('.chat-input'));
        return;
    }
    
    console.log('Chat input container found, creating emoji picker...');
    
    // Create emoji picker
    const picker = document.createElement('div');
    picker.className = 'chat-emoji-picker';
    picker.style.cssText = `
        position: absolute;
        bottom: 100%;
        left: 0;
        background: rgba(0, 0, 0, 0.9);
        border: 1px solid #444;
        border-radius: 8px;
        padding: 8px;
        display: grid;
        grid-template-columns: repeat(8, 1fr);
        gap: 4px;
        z-index: 1000;
        max-width: 300px;
    `;
    
    // Music and general emojis
    const emojis = [
        '🎵', '🎶', '🎹', '🎸', '🎻', '🥁', '🎤', '🎧',
        '👏', '❤️', '🔥', '✨', '🌟', '💫', '🎉', '🎊',
        '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
        '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
        '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜',
        '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏',
        '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
        '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠'
    ];
    
    picker.innerHTML = emojis.map(emoji => `
        <button class="emoji-btn" onclick="insertEmoji('${emoji}')" style="
            background: none;
            border: none;
            font-size: 1.2rem;
            padding: 4px;
            cursor: pointer;
            border-radius: 4px;
            transition: background-color 0.2s;
        " onmouseover="this.style.backgroundColor='rgba(255,255,255,0.1)'" 
           onmouseout="this.style.backgroundColor='transparent'">
            ${emoji}
        </button>
    `).join('');
    
    // Position the picker
    chatInput.style.position = 'relative';
    chatInput.appendChild(picker);
    
    // Close picker when clicking outside
    document.addEventListener('click', function handler(ev) {
        if (!picker.contains(ev.target) && ev.target !== document.getElementById('emojiPickerBtn')) {
            picker.remove();
            document.removeEventListener('click', handler);
        }
    });
}

// Assign the real function to window immediately
window.showChatEmojiPicker = showChatEmojiPicker;

// Insert emoji function - define it immediately
function insertEmoji(emoji) {
    const chatInput = document.querySelector('.chat-input input');
    if (chatInput) {
        const cursorPos = chatInput.selectionStart;
        const textBefore = chatInput.value.substring(0, cursorPos);
        const textAfter = chatInput.value.substring(cursorPos);
        
        chatInput.value = textBefore + emoji + textAfter;
        chatInput.focus();
        
        // Set cursor position after the emoji
        const newPos = cursorPos + emoji.length;
        chatInput.setSelectionRange(newPos, newPos);
    }
    
    // Close the emoji picker
    const picker = document.querySelector('.chat-emoji-picker');
    if (picker) {
        picker.remove();
    }
}

// Assign insertEmoji to window immediately
window.insertEmoji = insertEmoji;



// Add other critical functions that might be called from HTML
// Remove placeholder - will use the real function defined later

// Remove placeholder - will use the real function defined later

// Remove placeholders - will use the real functions defined later

// --- Key transposition logic ---
const NOTE_ORDER = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
function transposeNote(note, key) {
    // note: e.g. 'C4', key: e.g. 'D'
    const noteName = note.slice(0, -1);
    const octave = parseInt(note.slice(-1));
    const noteIdx = NOTE_ORDER.indexOf(noteName);
    const keyIdx = NOTE_ORDER.indexOf(key);
    if (noteIdx === -1 || keyIdx === -1) return note;
    let newIdx = (noteIdx + keyIdx - NOTE_ORDER.indexOf('C')) % 12;
    if (newIdx < 0) newIdx += 12;
    let newOctave = octave;
    if (newIdx < noteIdx) newOctave += 1;
    return NOTE_ORDER[newIdx] + newOctave;
}

// Piano key definitions
const WHITE_KEYS = [
    { note: 'C4', label: 'C' },
    { note: 'D4', label: 'D' },
    { note: 'E4', label: 'E' },
    { note: 'F4', label: 'F' },
    { note: 'G4', label: 'G' },
    { note: 'A4', label: 'A' },
    { note: 'B4', label: 'B' },
    { note: 'C5', label: 'C' },
    { note: 'D5', label: 'D' },
    { note: 'E5', label: 'E' },
    { note: 'F5', label: 'F' },
    { note: 'G5', label: 'G' },
    { note: 'A5', label: 'A' },
    { note: 'B5', label: 'B' }
];

const BLACK_KEYS = [
    { note: 'C#4', between: 0 },
    { note: 'D#4', between: 1 },
    { note: 'F#4', between: 3 },
    { note: 'G#4', between: 4 },
    { note: 'A#4', between: 5 },
    { note: 'C#5', between: 7 },
    { note: 'D#5', between: 8 },
    { note: 'F#5', between: 10 },
    { note: 'G#5', between: 11 },
    { note: 'A#5', between: 12 }
];

// Instrument settings
const INSTRUMENTS = {
    piano: { name: 'Piano', icon: '<i class="fas fa-music"></i>', color: '#FFD700' },
    guitar: { name: 'Guitar', icon: '<i class="fas fa-guitar"></i>', color: '#FF6B6B' },
    violin: { name: 'Violin', icon: '<i class="fas fa-violin"></i>', color: '#4ECDC4' },
    flute: { name: 'Flute', icon: '<i class="fas fa-music"></i>', color: '#45B7D1' },
    drums: { name: 'Drums', icon: '<i class="fas fa-drum"></i>', color: '#96CEB4' },
    bass: { name: 'Bass', icon: '<i class="fas fa-guitar"></i>', color: '#FFEAA7' },
    synth: { name: 'Synth', icon: '<i class="fas fa-keyboard"></i>', color: '#DDA0DD' }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing app...');
    try {
        initializeRoom();
        setupEventListeners();
        connectWebSocket();
        initializeAudio();
        initializeVisualization();
        addNewUIElements();
        renderPiano();
        updateUserInterface();
        console.log('App initialized successfully');
    } catch (error) {
        console.error('Error initializing app:', error);
    }
    
    // Fallback initialization if elements are not ready
    setTimeout(() => {
        const pianoKeys = document.querySelector('.piano-keys');
        if (pianoKeys && pianoKeys.children.length === 0) {
            console.log('Piano not rendered, retrying...');
            renderPiano();
        }
    }, 1000);

    // --- Instrument select in settings modal ---
    const instrumentSelect = document.getElementById('instrumentSelect');
    if (instrumentSelect) {
        instrumentSelect.value = currentInstrument;
        instrumentSelect.addEventListener('change', function() {
            setInstrument(this.value);
        });
    }
    // Key select
    const keySelect = document.getElementById('keySelect');
    if (keySelect) {
        keySelect.value = currentKey;
        keySelect.addEventListener('change', function() {
            updateKey();
            renderPiano(); // re-render piano for new key
        });
    }
    // BPM slider
    const bpmSlider = document.getElementById('bpmSlider');
    if (bpmSlider) {
        bpmSlider.value = currentBPM;
        bpmSlider.addEventListener('input', function() {
            updateBPM();
        });
    }
    // Genre select
    const genreSelect = document.getElementById('genreSelect');
    if (genreSelect) {
        genreSelect.value = currentGenre;
        genreSelect.addEventListener('change', function() {
            updateGenre();
            document.body.setAttribute('data-genre', genreSelect.value);
        });
    }

    // --- Set currentRoomId from URL on DOMContentLoaded ---
    currentRoomId = new URLSearchParams(window.location.search).get('room');
    if (!currentRoomId) {
        const pathParts = window.location.pathname.split('/');
        const pathRoomId = pathParts[pathParts.length - 1];
        if (pathRoomId && pathRoomId !== 'room') {
            currentRoomId = pathRoomId;
        }
    }

    // Try to get username from window.roomData or prompt
    if (window.roomData && window.roomData.username) {
        currentUsername = window.roomData.username;
    } else {
        // Fallback: prompt user for name if not set
        currentUsername = localStorage.getItem('username') || prompt('Enter your name:');
        localStorage.setItem('username', currentUsername);
    }
});

// Instrument management
function setInstrument(instrument) {
    if (INSTRUMENTS[instrument]) {
        currentInstrument = instrument;
        updateInstrumentUI();
        updateInstrument();
        
        // Send instrument change to server
        if (socket && socket.connected) {
            socket.emit('change_instrument', {
                room_id: currentRoomId,
                username: currentUsername,
                instrument: instrument
            });
        }
    }
}

function updateInstrumentUI() {
    const instrumentLabel = document.querySelector('.instrument-label');
    if (instrumentLabel) {
        const instrument = INSTRUMENTS[currentInstrument];
        instrumentLabel.innerHTML = `
            ${instrument.icon}
            <span>${instrument.name}</span>
        `;
        instrumentLabel.style.color = instrument.color;
    }
}

function updateInstrument() {
    if (synth) {
        const instrument = INSTRUMENTS[currentInstrument];
        synth.set({ volume: currentVolume });
        
        // Update synth settings based on instrument
        switch (currentInstrument) {
            case 'piano':
                synth.set({ oscillator: { type: 'triangle' } });
                break;
            case 'guitar':
                synth.set({ oscillator: { type: 'sawtooth' } });
                break;
            case 'violin':
                synth.set({ oscillator: { type: 'sine' } });
                break;
            case 'flute':
                synth.set({ oscillator: { type: 'sine' } });
                break;
            case 'drums':
                synth.set({ oscillator: { type: 'square' } });
                break;
            case 'bass':
                synth.set({ oscillator: { type: 'sawtooth' } });
                break;
            case 'synth':
                synth.set({ oscillator: { type: 'sine' } });
                break;
        }
    }
}

function updateInstrumentLabel() {
    const instrumentLabel = document.querySelector('.instrument-label');
    if (instrumentLabel) {
        const instrument = INSTRUMENTS[currentInstrument];
        instrumentLabel.innerHTML = `
            <i>${instrument.icon}</i>
            <span>${instrument.name}</span>
        `;
        instrumentLabel.style.color = instrument.color;
    }
}

// UI Elements
function addNewUIElements() {
    // UI elements are already present in the HTML template. No action needed.
    // This function is kept for compatibility.
}

// Room initialization
function initializeRoom() {
    const roomId = new URLSearchParams(window.location.search).get('room');
    if (roomId) {
        document.title = `Dream App - Room ${roomId}`;
        const roomInfo = document.querySelector('.room-info h1');
        if (roomInfo) {
            roomInfo.textContent = `Room ${roomId}`;
        }
    }
    
    updateInstrumentUI();
    updateParticipantsList(window.roomData && window.roomData.participants ? Object.values(window.roomData.participants) : []);
    updateMusicHistory();
    updateAISuggestions();
}

// Event listeners
function setupEventListeners() {
    // Piano key events (mouse/touch only, no keyboard)
    document.addEventListener('mousedown', function(e) {
        if (e.target.classList.contains('piano-key')) {
            const note = e.target.dataset.note;
            playNote(note, e.target);
        }
    });
    
    document.addEventListener('mouseup', function(e) {
        if (e.target.classList.contains('piano-key')) {
            const note = e.target.dataset.note;
            stopNote(note, e.target);
        }
    });
    
    // Touch events for mobile
    document.addEventListener('touchstart', function(e) {
        if (e.target.classList.contains('piano-key')) {
            e.preventDefault();
            const note = e.target.dataset.note;
            playNote(note, e.target);
        }
    });
    
    document.addEventListener('touchend', function(e) {
        if (e.target.classList.contains('piano-key')) {
            e.preventDefault();
            const note = e.target.dataset.note;
            stopNote(note, e.target);
        }
    });
    
    // Chat input event listeners
    const chatInput = document.querySelector('.chat-input input');
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendChatMessage();
            }
        });
    }
    
    // Track settings event listeners
    const bpmSlider = document.getElementById('bpmSlider');
    if (bpmSlider) {
        bpmSlider.addEventListener('input', updateBPM);
    }
    
    const keySelect = document.getElementById('keySelect');
    if (keySelect) {
        keySelect.addEventListener('change', updateKey);
    }
    
    const genreSelect = document.getElementById('genreSelect');
    if (genreSelect) {
        genreSelect.addEventListener('change', updateGenre);
    }
    
    const instrumentSelect = document.getElementById('instrumentSelect');
    if (instrumentSelect) {
        instrumentSelect.addEventListener('change', function() {
            setInstrument(this.value);
        });
    }
    
    const volumeSlider = document.getElementById('volumeSlider');
    if (volumeSlider) {
        volumeSlider.addEventListener('input', updateVolume);
    }
    
    // Emoji picker for chat input
    const emojiPickerBtn = document.getElementById('emojiPickerBtn');
    console.log('Emoji picker button found:', emojiPickerBtn);
    if (emojiPickerBtn) {
        emojiPickerBtn.addEventListener('click', function() {
            console.log('Emoji picker button clicked!');
            if (typeof showChatEmojiPicker === 'function') {
                console.log('showChatEmojiPicker function exists, calling it...');
                showChatEmojiPicker();
            } else {
                console.error('showChatEmojiPicker function not defined');
            }
        });
    } else {
        console.error('Emoji picker button not found!');
    }
}

// Socket.IO connection
function connectWebSocket() {
    let roomId = new URLSearchParams(window.location.search).get('room');
    
    // If no room ID, try to get it from the URL path
    if (!roomId) {
        const pathParts = window.location.pathname.split('/');
        const pathRoomId = pathParts[pathParts.length - 1];
        if (pathRoomId && pathRoomId !== 'room') {
            roomId = pathRoomId;
        }
    }
    
    // If still no room ID, create a default one
    if (!roomId) {
        roomId = 'default-room';
        console.log('No room ID found, using default room');
    }
    
    console.log('Connecting to Socket.IO with room ID:', roomId);
    
    // Initialize Socket.IO
    socket = io();
    
    socket.on('connect', function() {
        console.log('Socket.IO connected');
        showNotification('Connected to room', 'success');
        
        // Join the room
        socket.emit('join_room', {
            room_id: roomId,
            username: currentUsername,
            instrument: currentInstrument
        });
    });
    
    socket.on('disconnect', function() {
        console.log('Socket.IO disconnected');
        showNotification('Disconnected from room', 'error');
    });
    
    socket.on('connect_error', function(error) {
        console.error('Socket.IO connection error:', error);
        showNotification('Connection error', 'error');
    });
    
    // Handle incoming messages
    socket.on('note_played', handleNotePlayed);
    socket.on('user_joined', handleUserJoined);
    socket.on('user_left', handleUserLeft);
    socket.on('chat_message', handleChatMessage);
    socket.on('ai_suggestion', handleAISuggestion);
    socket.on('leaderboard_update', updateLeaderboard);
    socket.on('ai_visualization', updateAIVisualization);
    socket.on('room_state', updateRoomState);
    socket.on('instrument_change', handleInstrumentChange);
    socket.on('voice_participant_joined', addVoiceParticipant);
    socket.on('voice_participant_left', removeVoiceParticipant);
    socket.on('voice_mute_status', updateVoiceMuteStatus);
    socket.on('participant_instrument', updateParticipantInstrument);
    
    // Voice call WebRTC event handlers
    socket.on('voice_offer', handleVoiceOffer);
    socket.on('voice_answer', handleVoiceAnswer);
    socket.on('voice_ice_candidate', handleVoiceIceCandidate);
    socket.on('voice_user_joined', (data) => {
        console.log('Received voice_user_joined event:', data);
        addVoiceParticipant(data.username);
        showNotification(`${data.username} joined voice call`, 'info');
    });
    socket.on('voice_user_left', (data) => {
        removeVoiceParticipant(data.username);
        showNotification(`${data.username} left voice call`, 'info');
    });
    socket.on('voice_participants_list', (data) => {
        console.log('Received voice_participants_list:', data);
        if (data.participants) {
            voiceParticipants.length = 0; // Clear array
            data.participants.forEach(participant => {
                if (typeof participant === 'object' && participant.username) {
                    addVoiceParticipant(participant.username);
                } else if (typeof participant === 'string') {
                    addVoiceParticipant(participant);
                }
            });
        }
    });
}

function handleWebSocketMessage(data) {
    switch (data.type) {
        case 'note_played':
            handleNotePlayed(data);
            break;
        case 'user_joined':
            handleUserJoined(data);
            break;
        case 'user_left':
            handleUserLeft(data);
            break;
        case 'chat_message':
            handleChatMessage(data);
            break;
        case 'ai_suggestion':
            handleAISuggestion(data);
            break;
        case 'voice_offer':
            handleVoiceOffer(data);
            break;
        case 'voice_answer':
            handleVoiceAnswer(data);
            break;
        case 'voice_ice_candidate':
            handleVoiceIceCandidate(data);
            break;
        case 'leaderboard_update':
            updateLeaderboard(data.leaderboard);
            break;
        case 'ai_visualization':
            updateAIVisualization(data.visualization);
            break;
        case 'room_state':
            updateRoomState(data.state);
            break;
        case 'instrument_change':
            handleInstrumentChange(data);
            break;
        case 'voice_user_joined':
            console.log('Voice user joined:', data);
            addVoiceParticipant(data.username);
            break;
        case 'voice_user_left':
            console.log('Voice user left:', data);
            removeVoiceParticipant(data.username);
            break;
        case 'voice_participants_list':
            console.log('Voice participants list received:', data);
            // Update voice participants from server
            if (data.participants) {
                voiceParticipants.length = 0; // Clear array
                data.participants.forEach(participant => {
                    if (typeof participant === 'object' && participant.username) {
                        addVoiceParticipant(participant.username);
                    } else if (typeof participant === 'string') {
                        addVoiceParticipant(participant);
                    }
                });
            }
            break;
        case 'voice_mute_status':
            console.log('Voice mute status:', data);
            updateVoiceMuteStatus(data.username, data.muted);
            break;
        case 'participant_instrument':
            updateParticipantInstrument(data.username, data.instrument);
            break;

    }
}

// Audio initialization
function initializeAudio() {
    // Initialize Tone.js
    // Note: Tone.js uses ScriptProcessorNode internally which is deprecated
    // This is a known issue and can be safely ignored for now
    if (typeof Tone !== 'undefined') {
        // Delay synth creation until user interaction to avoid AudioContext warnings
        let audioStarted = false;
        
        const startAudio = async () => {
            if (!audioStarted) {
                try {
                    // Start the audio context first
                    await Tone.start();
                    console.log('Tone.js audio context started');
                    
                    // Create synth after context is started
                    synth = new Tone.Synth().toDestination();
                    synth.set({ volume: currentVolume });
                    updateInstrument();
                    audioStarted = true;
                    console.log('Audio context started successfully');
                    
                    // Show notification that audio is ready
                    showNotification('🎵 Audio is now ready! Click piano keys to play', 'success');
                } catch (error) {
                    console.error('Error starting audio context:', error);
                    showNotification('❌ Audio failed to start. Try clicking the page first.', 'error');
                }
            }
        };
        
        // Start audio on first user interaction
        document.addEventListener('click', startAudio, { once: true });
        document.addEventListener('keydown', startAudio, { once: true });
        document.addEventListener('touchstart', startAudio, { once: true });
        
        // Also start on voice call join
        const originalJoinVoiceCall = window.joinVoiceCall;
        window.joinVoiceCall = async function() {
            await startAudio();
            return originalJoinVoiceCall.apply(this, arguments);
        };
        
        // Add a visible audio start button
        addAudioStartButton();
    }
}

function addAudioStartButton() {
    // Remove existing button if any
    const existingBtn = document.getElementById('startAudioBtn');
    if (existingBtn) {
        existingBtn.remove();
    }
    
    // Create audio start button
    const startBtn = document.createElement('button');
    startBtn.id = 'startAudioBtn';
    startBtn.innerHTML = '🎵 Click to Enable Audio';
    startBtn.className = 'btn btn-primary';
    startBtn.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        background: #FFD700;
        color: #000;
        border: none;
        padding: 10px 20px;
        border-radius: 8px;
        font-weight: bold;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        cursor: pointer;
        transition: all 0.3s ease;
    `;
    
    startBtn.addEventListener('click', async () => {
        try {
            await Tone.start();
            synth = new Tone.Synth().toDestination();
            synth.set({ volume: currentVolume });
            updateInstrument();
            startBtn.innerHTML = '✅ Audio Ready!';
            startBtn.style.background = '#4CAF50';
            showNotification('🎵 Audio is now ready! Click piano keys to play', 'success');
            
            // Remove button after 3 seconds
            setTimeout(() => {
                startBtn.remove();
            }, 3000);
        } catch (error) {
            console.error('Error starting audio:', error);
            showNotification('❌ Audio failed to start. Try refreshing the page.', 'error');
        }
    });
    
    document.body.appendChild(startBtn);
}

// Piano functions
function playNote(note, key) {
    if (synth && !isMuted) {
        // Ensure audio context is started
        if (Tone.context && Tone.context.state !== 'running') {
            Tone.start();
        }
        
        synth.triggerAttack(note);
        
        // Visual feedback
        if (key) {
            key.classList.add('active');
        }
        
        // Send to server
        if (socket && socket.connected) {
            socket.emit('play_note', {
                room_id: currentRoomId,
                username: currentUsername,
                note: note,
                instrument: currentInstrument,
                timestamp: Date.now()
            });
        }
        
        // Record if recording
        if (isRecording) {
            recordedNotes.push({
                note: note,
                timestamp: Date.now(),
                instrument: currentInstrument
            });
        }
        
        // Update performance stats
        performanceStats.notesPlayed++;
        updatePerformanceStats();
        
        // Track current melody for AI analysis
        currentMelody.push(note);
        if (currentMelody.length > 20) {
            currentMelody.shift();
        }
    }
}

function stopNote(note, key) {
    if (synth) {
        synth.triggerRelease();
        
        // Remove visual feedback
        if (key) {
            key.classList.remove('active');
        }
    }
}

// Piano rendering
const BASE_KEY = 'C';
function renderPiano() {
    console.log('Rendering piano...');
    const pianoKeys = document.querySelector('.piano-keys');
    if (!pianoKeys) {
        console.error('Piano keys container not found!');
        return;
    }
    
    console.log('Piano keys container found, clearing and rendering...');
    pianoKeys.innerHTML = '';
    
    try {
        // Render white keys
        WHITE_KEYS.forEach((key, i) => {
            const transposed = transposeNote(key.note, currentKey);
            const whiteKey = document.createElement('div');
            whiteKey.className = 'piano-key white';
            whiteKey.dataset.note = transposed;
            whiteKey.innerHTML = `<span class="piano-label">${key.label}</span>`;
            whiteKey.addEventListener('mousedown', () => playPianoNote(transposed, whiteKey));
            whiteKey.addEventListener('mouseup', () => stopPianoNote(transposed, whiteKey));
            whiteKey.addEventListener('mouseleave', () => stopPianoNote(transposed, whiteKey));
            whiteKey.addEventListener('touchstart', (e) => { e.preventDefault(); playPianoNote(transposed, whiteKey); });
            whiteKey.addEventListener('touchend', (e) => { e.preventDefault(); stopPianoNote(transposed, whiteKey); });
            pianoKeys.appendChild(whiteKey);
        });
        
        // Render black keys
        BLACK_KEYS.forEach((key) => {
            const transposed = transposeNote(key.note, currentKey);
            const left = 48 * (key.between + 1) - 14;
            const blackKey = document.createElement('div');
            blackKey.className = 'piano-key black';
            blackKey.dataset.note = transposed;
            blackKey.style.left = `${left}px`;
            blackKey.innerHTML = `<span class="piano-label">${key.note}</span>`;
            blackKey.addEventListener('mousedown', () => playPianoNote(transposed, blackKey));
            blackKey.addEventListener('mouseup', () => stopPianoNote(transposed, blackKey));
            blackKey.addEventListener('mouseleave', () => stopPianoNote(transposed, blackKey));
            blackKey.addEventListener('touchstart', (e) => { e.preventDefault(); playPianoNote(transposed, blackKey); });
            blackKey.addEventListener('touchend', (e) => { e.preventDefault(); stopPianoNote(transposed, blackKey); });
            pianoKeys.appendChild(blackKey);
        });
        
        console.log('Piano rendered successfully!');
    } catch (error) {
        console.error('Error rendering piano:', error);
    }
}

function playPianoNote(note, key) {
    console.log('Playing piano note:', note);
    
    // Check if audio is ready
    if (!synth) {
        console.log('Synth not ready, trying to start audio...');
        if (typeof Tone !== 'undefined') {
            Tone.start().then(() => {
                synth = new Tone.Synth().toDestination();
                synth.set({ volume: currentVolume });
                updateInstrument();
                console.log('Synth created, now playing note');
                playPianoNote(note, key); // Retry playing the note
            }).catch(error => {
                console.error('Failed to start audio context:', error);
                showNotification('Click the "Enable Audio" button to play music', 'warning');
            });
        }
        return;
    }
    
    if (!isMuted) {
        try {
            // Ensure audio context is started
            if (Tone.context && Tone.context.state !== 'running') {
                Tone.start().then(() => {
                    // Retry playing the note after audio context starts
                    playPianoNote(note, key);
                }).catch(error => {
                    console.error('Failed to start audio context:', error);
                    showNotification('Click the "Enable Audio" button to play music', 'warning');
                });
                return;
            }
            
            // Trigger attack immediately without setTimeout to avoid timing conflicts
            synth.triggerAttack(note);
            console.log('Note played successfully:', note);
            
            // Visual feedback
            if (key) {
                key.classList.add('active');
            }
            
            // Send to server
            if (socket && socket.connected) {
                socket.emit('play_note', {
                    room_id: currentRoomId,
                    username: currentUsername,
                    note: note,
                    instrument: currentInstrument,
                    timestamp: Date.now()
                });
            }
            
            // Record if recording
            if (isRecording) {
                recordedNotes.push({
                    note: note,
                    timestamp: Date.now(),
                    instrument: currentInstrument
                });
            }
            
            // Update performance stats
            performanceStats.notesPlayed++;
            updatePerformanceStats();
            
            // Track current melody for AI analysis
            currentMelody.push(note);
            if (currentMelody.length > 20) {
                currentMelody.shift();
            }
            
            // Animate visualization
            animateVisualization(note);
            
            // Add to music history
            addNoteToHistory(note);
        } catch (error) {
            console.error('Error playing note:', error);
            showNotification('Audio error. Try clicking the "Enable Audio" button.', 'error');
        }
    }
}

function stopPianoNote(note, key) {
    if (synth) {
        synth.triggerRelease();
        
        // Remove visual feedback
        if (key) {
            key.classList.remove('active');
        }
    }
}

// Keyboard input handling
function handleKeyboardInput(e) {
    const keyMap = {
        'a': 'C4', 's': 'D4', 'd': 'E4', 'f': 'F4', 'g': 'G4', 'h': 'A4', 'j': 'B4',
        'k': 'C5', 'l': 'D5', ';': 'E5', "'": 'F5',
        'w': 'C#4', 'e': 'D#4', 't': 'F#4', 'y': 'G#4', 'u': 'A#4',
        'o': 'C#5', 'p': 'D#5', '[': 'F#5', ']': 'G#5'
    };
    
    const note = keyMap[e.key.toLowerCase()];
    if (note) {
        e.preventDefault();
        if (e.type === 'keydown') {
            playNote(note);
        } else if (e.type === 'keyup') {
            stopNote(note);
        }
    }
}

// Note playing
function playNote(note) {
    if (synth && !isMuted) {
        // Ensure audio context is started
        if (Tone.context && Tone.context.state !== 'running') {
            Tone.start();
        }
        
        // Add a small delay to prevent timing conflicts
        setTimeout(() => {
            synth.triggerAttack(note);
        }, 10);
        
        // Visual feedback
        const key = document.querySelector(`[data-note="${note}"]`);
        if (key) {
            key.classList.add('active');
        }
        
        // Send to server
        if (socket && socket.connected) {
            socket.emit('play_note', {
                room_id: currentRoomId,
                username: currentUsername,
                note: note,
                instrument: currentInstrument,
                timestamp: Date.now()
            });
        }
        
        // Record if recording
        if (isRecording) {
            recordedNotes.push({
                note: note,
                timestamp: Date.now(),
                instrument: currentInstrument
            });
        }
        
        // Update performance stats
        performanceStats.notesPlayed++;
        updatePerformanceStats();
        
        // Animate visualization
        animateVisualization(note);
        
        // Add to music history
        addNoteToHistory(note);
    }
}

// Visualization
function initializeVisualization() {
    const canvas = document.getElementById('musicCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    function resizeCanvas() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawMusicWaves(ctx, canvas);
        requestAnimationFrame(animate);
    }
    
    animate();
}

function drawMusicWaves(ctx, canvas) {
    const time = Date.now() * 0.001;
    const centerY = canvas.height / 2;
    
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    for (let x = 0; x < canvas.width; x++) {
        const y = centerY + Math.sin(x * 0.02 + time) * 20 + 
                  Math.sin(x * 0.01 + time * 0.5) * 10;
        if (x === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    
    ctx.stroke();
}

function animateVisualization(note) {
    const canvas = document.getElementById('musicCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    function animateParticle() {
        const radius = Math.random() * 50 + 20;
        const angle = Math.random() * Math.PI * 2;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        ctx.fillStyle = `hsl(${Math.random() * 360}, 70%, 60%)`;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
        
        setTimeout(() => {
            ctx.clearRect(x - 5, y - 5, 10, 10);
        }, 1000);
    }
    
    for (let i = 0; i < 5; i++) {
        setTimeout(animateParticle, i * 50);
    }
}

// User interface updates
function updateUserInterface() {
    updateInstrumentUI();
    updateParticipantsList(window.roomData && window.roomData.participants ? Object.values(window.roomData.participants) : []);
    updateMusicHistory();
    updateAISuggestions();
    updateNoteCount();
    updateVolume();
    updateRecordingsPreview();
}

function showAvatarPreview() {
    const avatarInput = document.getElementById('avatarInput');
    const avatarPreview = document.getElementById('avatarPreview');
    
    if (avatarInput && avatarPreview) {
        const file = avatarInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                avatarPreview.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }
}

function getParticipantColor(username) {
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#FFD93D',
        '#A3A1FF', '#FFB86B', '#FF6BBF', '#6BFFB8', '#B8FF6B', '#6B8BFF', '#FF8B6B'
    ];
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % colors.length;
    return colors[idx];
}

function updateParticipantsList(participants) {
    if (!participants) {
        if (window.roomData && window.roomData.participants) {
            participants = Object.values(window.roomData.participants);
        } else {
            participants = [];
        }
    }
    // Fix: handle both array and object
    const list = Array.isArray(participants) ? participants : Object.values(participants);
    const participantsList = document.querySelector('.participants-list');
    if (!participantsList) return;
    participantsList.innerHTML = list.map(participant => {
        const color = getParticipantColor(participant.username);
        return `
        <div class="participant">
            <div class="participant-avatar" style="border-color: ${color};">
                <img src="${participant.avatar ? participant.avatar : '/static/images/default-avatar.png'}" alt="${participant.username} avatar" onerror="this.onerror=null;this.src='/static/images/default-avatar.png';">
                <div class="status-indicator ${participant.active ? 'active' : ''}"></div>
            </div>
            <div class="participant-info">
                <div class="participant-name">${participant.username}</div>
                <div class="participant-instrument">${participant.instrument || 'Piano'}</div>
            </div>
        </div>
        `;
    }).join('');
}

// Music history
function addNoteToHistory(note) {
    const history = JSON.parse(localStorage.getItem('musicHistory') || '[]');
    const noteEntry = {
        note: note,
        timestamp: Date.now(),
        player: 'You',
        color: getNoteColor('You')
    };
    
    history.unshift(noteEntry);
    if (history.length > 50) {
        history.pop();
    }
    
    localStorage.setItem('musicHistory', JSON.stringify(history));
    updateMusicHistory();
}

function updateMusicHistory() {
    const historyContainer = document.querySelector('.music-history');
    if (!historyContainer) return;
    
    const history = JSON.parse(localStorage.getItem('musicHistory') || '[]');
    
    if (history.length === 0) {
        historyContainer.innerHTML = `
            <div class="empty-history">
                <i class="fas fa-music"></i>
                <p>No notes played yet</p>
            </div>
        `;
        return;
    }
    
    historyContainer.innerHTML = history.map(entry => `
        <div class="note-item">
            <div class="note-color" style="background-color: ${entry.color}"></div>
            <div class="note-info">
                <div class="note-name">${entry.note}</div>
                <div class="note-player">${entry.player}</div>
            </div>
            <div class="note-time">${formatTime(entry.timestamp)}</div>
        </div>
    `).join('');
}

// AI suggestions
function addAISuggestion(suggestion) {
    const suggestions = JSON.parse(localStorage.getItem('aiSuggestions') || '[]');
    suggestions.unshift(suggestion);
    if (suggestions.length > 10) {
        suggestions.pop();
    }
    localStorage.setItem('aiSuggestions', JSON.stringify(suggestions));
    updateAISuggestions();
}

function updateAISuggestions() {
    const suggestionsContainer = document.querySelector('.ai-suggestions');
    if (!suggestionsContainer) return;
    
    const suggestions = JSON.parse(localStorage.getItem('aiSuggestions') || '[]');
    
    if (suggestions.length === 0) {
        suggestionsContainer.innerHTML = `
            <div class="ai-message">
                <i class="fas fa-robot"></i>
                <p>Click "Get AI Suggestion" to receive musical advice!</p>
            </div>
        `;
        return;
    }
    
    suggestionsContainer.innerHTML = suggestions.map(suggestion => `
        <div class="ai-suggestion">
            <div class="type">${suggestion.type}</div>
            <div class="suggestion">${suggestion.suggestion}</div>
            <div class="reasoning">${suggestion.reasoning}</div>
        </div>
    `).join('');
}

// Chat functionality
function addChatMessage(username, message, messageId = null, reactions = {}) {
    const chatMessages = document.querySelector('.chat-messages');
    if (!chatMessages) return;

    messageId = messageId || Date.now().toString();
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message';
    messageElement.dataset.messageId = messageId;
    
    messageElement.innerHTML = `
        <div class="message-content">
            <span class="username">${username}:</span>
            <span class="message">${message}</span>
        </div>
    `;
    
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function sendChatMessage() {
    const input = document.querySelector('.chat-input input');
    if (!input || !input.value.trim()) return;
    
    const message = input.value.trim();
    input.value = '';
    
    if (socket && socket.connected) {
        socket.emit('chat_message', {
            room_id: currentRoomId,
            username: currentUsername,
            message: message
        });
    }
}

// AI suggestion request
function requestAISuggestion() {
    if (socket && socket.connected) {
        socket.emit('request_ai_suggestion', {
            room_id: currentRoomId,
            username: currentUsername
        });
    }
}

// Track settings
function updateBPM() {
    const bpmSlider = document.getElementById('bpmSlider');
    const bpmValue = document.getElementById('bpmValue');
    
    if (bpmSlider && bpmValue) {
        currentBPM = parseInt(bpmSlider.value);
        bpmValue.textContent = currentBPM;
        
        if (socket && socket.connected) {
            socket.emit('bpm_change', {
                room_id: currentRoomId,
                username: currentUsername,
                bpm: currentBPM
            });
        }
    }
}

function updateKey() {
    const keySelect = document.getElementById('keySelect');
    if (keySelect) {
        currentKey = keySelect.value;
        
        if (socket && socket.connected) {
            socket.emit('key_change', {
                room_id: currentRoomId,
                username: currentUsername,
                key: currentKey
            });
        }
    }
}

function updateGenre() {
    const genreSelect = document.getElementById('genreSelect');
    if (genreSelect) {
        currentGenre = genreSelect.value;
        
        if (socket && socket.connected) {
            socket.emit('genre_change', {
                room_id: currentRoomId,
                username: currentUsername,
                genre: currentGenre
            });
        }
    }
}

function updateTrackSettings(settings) {
    if (socket && socket.connected) {
        socket.emit('track_settings', {
            room_id: currentRoomId,
            username: currentUsername,
            settings: settings
        });
    }
}

// Room state updates
function updateRoomState(state) {
    if (state.bpm) currentBPM = state.bpm;
    if (state.key) currentKey = state.key;
    if (state.genre) currentGenre = state.genre;
    if (state.participants) updateParticipantsList(state.participants);
    
    updateUserInterface();
}

// Utility functions
function updateNoteCount() {
    const noteCount = document.getElementById('noteCount');
    if (noteCount) {
        noteCount.textContent = performanceStats.notesPlayed;
    }
}

function toggleSettings() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeSettings() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function updateVolume() {
    const volumeSlider = document.getElementById('volumeSlider');
    if (volumeSlider) {
        currentVolume = parseFloat(volumeSlider.value);
        if (synth) {
            synth.set({ volume: currentVolume });
        }
    }
}

function leaveRoom() {
    if (socket) {
        socket.close();
    }
    
    if (isInVoiceCall) {
        leaveVoiceCall();
    }
    
    window.location.href = '/';
}

// Time formatting
function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
}

// Notifications
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// MIDI download
function downloadMIDI() {
    if (recordedNotes.length === 0) {
        showNotification('No notes recorded', 'error');
        return;
    }
    
    const midiData = generateMIDI(recordedNotes);
    const blob = new Blob([midiData], { type: 'audio/midi' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `dream-app-session-${Date.now()}.mid`;
    a.click();
    
    URL.revokeObjectURL(url);
}

function generateMIDI(notes) {
    // Simple MIDI generation
    const header = new Uint8Array([
        0x4D, 0x54, 0x68, 0x64, // MThd
        0x00, 0x00, 0x00, 0x06, // Header length
        0x00, 0x01, // Format 1
        0x00, 0x01, // 1 track
        0x01, 0xE0  // 480 ticks per quarter note
    ]);
    
    const trackHeader = new Uint8Array([
        0x4D, 0x54, 0x72, 0x6B, // MTrk
        0x00, 0x00, 0x00, 0x00  // Track length (placeholder)
    ]);
    
    let trackData = [];
    
    // Add tempo event
    trackData.push(0x00, 0xFF, 0x51, 0x03, 0x07, 0xA1, 0x20); // 120 BPM
    
    // Add notes
    notes.forEach((note, index) => {
        const deltaTime = index === 0 ? 0 : Math.floor((note.timestamp - notes[index - 1].timestamp) / 10);
        const midiNote = noteNameToMidi(note.note);
        
        // Note on
        trackData.push(...encodeVarLen(deltaTime), 0x90, midiNote, 0x64);
        // Note off
        trackData.push(...encodeVarLen(480), 0x80, midiNote, 0x00);
    });
    
    // End of track
    trackData.push(0x00, 0xFF, 0x2F, 0x00);
    
    const trackLength = trackData.length;
    const trackLengthBytes = toBytes(trackLength, 4);
    
    const midiData = new Uint8Array(header.length + trackHeader.length + trackData.length);
    midiData.set(header, 0);
    midiData.set(trackHeader, header.length);
    midiData.set(trackLengthBytes, header.length + 4);
    midiData.set(trackData, header.length + trackHeader.length);
    
    return midiData;
}

function noteNameToMidi(name) {
    const noteMap = {
        'C': 60, 'C#': 61, 'D': 62, 'D#': 63, 'E': 64, 'F': 65, 'F#': 66,
        'G': 67, 'G#': 68, 'A': 69, 'A#': 70, 'B': 71
    };
    
    const note = name.slice(0, -1);
    const octave = parseInt(name.slice(-1));
    return noteMap[note] + (octave - 4) * 12;
}

function encodeVarLen(value) {
    const bytes = [];
    let v = value;
    
    do {
        let b = v & 0x7F;
        v >>= 7;
        if (v > 0) b |= 0x80;
        bytes.push(b);
    } while (v > 0);
    
    return bytes;
}

function toBytes(num, len) {
    const bytes = new Array(len);
    for (let i = 0; i < len; i++) {
        bytes[len - 1 - i] = (num >> (8 * i)) & 0xFF;
    }
    return bytes;
}

// Recording functionality
function toggleRecording() {
    console.log('toggleRecording called');
    try {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    } catch (error) {
        console.error('Error in toggleRecording:', error);
        showNotification('Recording error: ' + error.message, 'error');
    }
}

function startRecording() {
    isRecording = true;
    recordedNotes = [];
    
    const recordBtn = document.getElementById('recordBtn');
    if (recordBtn) {
        recordBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Recording';
        recordBtn.classList.remove('btn-primary');
        recordBtn.classList.add('btn-danger');
    }
    
    showNotification('Recording started', 'success');
}

function stopRecording() {
    isRecording = false;
    
    const recordBtn = document.getElementById('recordBtn');
    const downloadBtn = document.querySelector('.recording-controls .btn-secondary');
    const saveBtn = document.getElementById('saveRecordingBtn');
    
    if (recordBtn) {
        recordBtn.innerHTML = '<i class="fas fa-circle"></i> Start Recording';
        recordBtn.classList.remove('btn-danger');
        recordBtn.classList.add('btn-primary');
    }
    
    if (downloadBtn) {
        downloadBtn.disabled = false;
    }
    
    if (saveBtn && recordedNotes.length > 0) {
        saveBtn.style.display = 'inline-block';
    }
    
    showNotification('Recording stopped', 'info');
}

function saveRecording() {
    if (recordedNotes.length === 0) {
        showNotification('No recording to save', 'error');
        return;
    }
    
    const recording = {
        id: Date.now().toString(),
        name: `Recording ${new Date().toLocaleString()}`,
        notes: recordedNotes,
        duration: recordedNotes.length > 0 ? 
            recordedNotes[recordedNotes.length - 1].timestamp - recordedNotes[0].timestamp : 0,
        createdAt: Date.now()
    };
    
    // Save to localStorage
    const recordings = JSON.parse(localStorage.getItem('recordings') || '[]');
    recordings.unshift(recording);
    localStorage.setItem('recordings', JSON.stringify(recordings));
    
    // Hide save button
    const saveBtn = document.getElementById('saveRecordingBtn');
    if (saveBtn) {
        saveBtn.style.display = 'none';
    }
    
    showNotification('Recording saved!', 'success');
    updateRecordingsPreview();
}

function showRecordingsModal() {
    console.log('showRecordingsModal called');
    try {
        const modal = document.getElementById('recordingsModal');
        if (modal) {
            modal.style.display = 'block';
            updateRecordingsList();
        } else {
            console.error('Recordings modal not found');
        }
    } catch (error) {
        console.error('Error in showRecordingsModal:', error);
        showNotification('Modal error: ' + error.message, 'error');
    }
}

function closeRecordingsModal() {
    const modal = document.getElementById('recordingsModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function updateRecordingsList() {
    const recordingsList = document.getElementById('recordingsList');
    if (!recordingsList) return;
    
    const recordings = JSON.parse(localStorage.getItem('recordings') || '[]');
    
    if (recordings.length === 0) {
        recordingsList.innerHTML = `
            <p style="text-align: center; color: rgba(255,255,255,0.7); font-style: italic;">
                <i class="fas fa-microphone-slash"></i><br>
                No recordings yet<br>
                <small>Start recording your instrument to see them here</small>
            </p>
        `;
        return;
    }
    
    recordingsList.innerHTML = recordings.map(recording => `
        <div class="recording-item" style="margin-bottom: 15px; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h4 style="margin: 0; color: #FFD700;">${recording.name}</h4>
                <div style="font-size: 0.9rem; color: rgba(255,255,255,0.7);">
                    ${new Date(recording.createdAt).toLocaleString()}
                </div>
            </div>
            <div style="margin-bottom: 10px; font-size: 0.9rem; color: rgba(255,255,255,0.8);">
                <span><i class="fas fa-music"></i> ${recording.notes.length} notes</span>
                <span style="margin-left: 15px;"><i class="fas fa-clock"></i> ${Math.round(recording.duration / 1000)}s</span>
            </div>
            <div style="display: flex; gap: 10px;">
                <button class="btn btn-sm btn-primary" onclick="playRecording('${recording.id}')">
                    <i class="fas fa-play"></i> Play
                </button>
                <button class="btn btn-sm btn-info" onclick="downloadRecording('${recording.id}')">
                    <i class="fas fa-download"></i> Download
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteRecording('${recording.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

function updateRecordingsPreview() {
    const recordingsPreview = document.getElementById('recordingsPreview');
    if (!recordingsPreview) return;
    
    const recordings = JSON.parse(localStorage.getItem('recordings') || '[]');
    
    if (recordings.length === 0) {
        recordingsPreview.innerHTML = `
            <p style="text-align: center; color: rgba(255,255,255,0.7); font-style: italic;">
                <i class="fas fa-microphone-slash"></i><br>
                No recordings yet<br>
                <small>Start recording your instrument to see them here</small>
            </p>
        `;
        return;
    }
    
    // Show latest 3 recordings
    const latestRecordings = recordings.slice(0, 3);
    recordingsPreview.innerHTML = latestRecordings.map(recording => `
        <div class="recording-preview" style="margin-bottom: 10px; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 6px;">
            <div style="font-size: 0.9rem; color: #FFD700; margin-bottom: 5px;">${recording.name}</div>
            <div style="font-size: 0.8rem; color: rgba(255,255,255,0.7);">
                ${recording.notes.length} notes • ${Math.round(recording.duration / 1000)}s
            </div>
        </div>
    `).join('');
}

function playRecording(recordingId) {
    const recordings = JSON.parse(localStorage.getItem('recordings') || '[]');
    const recording = recordings.find(r => r.id === recordingId);
    
    if (!recording) {
        showNotification('Recording not found', 'error');
        return;
    }
    
    if (recording.notes.length === 0) {
        showNotification('No notes in recording', 'error');
        return;
    }
    
    isPlaying = true;
    let currentIndex = 0;
    
    function playNext() {
        if (currentIndex >= recording.notes.length || !isPlaying) {
            isPlaying = false;
            return;
        }
        
        const note = recording.notes[currentIndex];
        playPianoNote(note.note);
        
        currentIndex++;
        const nextNote = recording.notes[currentIndex];
        if (nextNote) {
            const delay = nextNote.timestamp - note.timestamp;
            setTimeout(playNext, delay);
        } else {
            isPlaying = false;
        }
    }
    
    playNext();
    showNotification('Playing recording...', 'info');
}

function downloadRecording(recordingId) {
    const recordings = JSON.parse(localStorage.getItem('recordings') || '[]');
    const recording = recordings.find(r => r.id === recordingId);
    
    if (!recording) {
        showNotification('Recording not found', 'error');
        return;
    }
    
    const midiData = generateMIDI(recording.notes);
    const blob = new Blob([midiData], { type: 'audio/midi' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${recording.name}.mid`;
    a.click();
    
    URL.revokeObjectURL(url);
    showNotification('Recording downloaded!', 'success');
}

function deleteRecording(recordingId) {
    if (!confirm('Are you sure you want to delete this recording?')) {
        return;
    }
    
    const recordings = JSON.parse(localStorage.getItem('recordings') || '[]');
    const filteredRecordings = recordings.filter(r => r.id !== recordingId);
    localStorage.setItem('recordings', JSON.stringify(filteredRecordings));
    
    updateRecordingsList();
    updateRecordingsPreview();
    showNotification('Recording deleted', 'info');
}

function exportAllRecordings() {
    const recordings = JSON.parse(localStorage.getItem('recordings') || '[]');
    if (!recordings.length) {
        showNotification('No recordings to export', 'error');
        return;
    }
    if (typeof JSZip === 'undefined') {
        showNotification('JSZip library not loaded!', 'error');
        return;
    }
    const zip = new JSZip();
    recordings.forEach((rec, i) => {
        const midiData = generateMIDI(rec.notes);
        zip.file(`${rec.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'recording_'+i}.mid`, midiData);
    });
    zip.generateAsync({type: 'blob'}).then(function(content) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(content);
        a.download = 'all_recordings.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showNotification('All recordings exported!', 'success');
    });
}

function clearAllRecordings() {
    if (!confirm('Are you sure you want to delete ALL recordings? This cannot be undone.')) {
        return;
    }
    
    localStorage.removeItem('recordings');
    updateRecordingsList();
    updateRecordingsPreview();
    showNotification('All recordings cleared', 'info');
}

// Popular Songs and AI Chord Functions
function loadFamousSong() {
    const songPicker = document.getElementById('famousSongPicker');
    const selectedSong = songPicker.value;
    console.log('loadFamousSong called with selectedSong:', selectedSong);
    
    if (selectedSong && popularSongs[selectedSong]) {
        const song = popularSongs[selectedSong];
        console.log('Loading song:', song);
        currentSong = song;
        currentKey = song.key;
        
        // Update the key selector
        const keySelect = document.getElementById('keySelect');
        if (keySelect) {
            keySelect.value = song.key;
        }
        
        // Update current song display
        updateCurrentSongDisplay();
        
        // Generate chord suggestions for this song
        generateChordSuggestionsForSong(song);
        
        showNotification(`Loaded ${song.name} in key ${song.key}`, 'success');
        console.log('currentSong after loading:', currentSong);
        
        // Auto-play the song if it has notes
        if (song.notes && song.notes.length > 0) {
            setTimeout(() => playCurrentSong(), 500);
        }
    } else {
        console.log('No song selected or song not found');
    }
}

function loadSongByKey(songKey) {
    if (popularSongs[songKey]) {
        const songPicker = document.getElementById('famousSongPicker');
        songPicker.value = songKey;
        loadFamousSong();
    }
}

function playCurrentSong() {
    if (!currentSong || !currentSong.notes || currentSong.notes.length === 0) {
        showNotification('No song loaded or song has no notes to play!', 'error');
        return;
    }
    
    console.log('Playing current song:', currentSong.name);
    console.log('Notes to play:', currentSong.notes);
    
    // Clear any existing recorded notes
    recordedNotes = [];
    
    // Play each note with timing
    currentSong.notes.forEach((noteData, index) => {
        const delay = index * 1000; // 1 second between notes
        
        setTimeout(() => {
            const note = typeof noteData === 'string' ? noteData : noteData.note;
            console.log(`Playing note ${index + 1}/${currentSong.notes.length}: ${note}`);
            
            // Play the note
            playNote(note, currentSong.key);
            
            // Add to recorded notes for visualization
            recordedNotes.push({
                note: note,
                timestamp: Date.now(),
                username: 'System'
            });
            
            // Update visualization
            updateMidiRoll({ note: note, username: 'System' });
            
            // Show progress
            if (index === currentSong.notes.length - 1) {
                showNotification(`Finished playing ${currentSong.name}!`, 'success');
            }
        }, delay);
    });
    
    showNotification(`Playing ${currentSong.name}...`, 'info');
}

function updateCurrentSongDisplay() {
    const display = document.getElementById('currentSongDisplay');
    if (!display) return;
    
    if (currentSong) {
        // Check if chords exist, if not generate them
        if (!currentSong.chords) {
            currentSong.chords = generateChordsFromMelody(currentSong.notes, currentSong.key);
        }
        
        display.innerHTML = `
            <div style="background: rgba(255,255,255,0.1); padding: 12px; border-radius: 8px; margin-bottom: 8px;">
                <h5 style="margin: 0 0 8px 0; color: #FFD700;">${currentSong.name}</h5>
                <p style="margin: 0 0 4px 0; font-size: 0.9rem;">Key: <strong>${currentSong.key}</strong></p>
                <p style="margin: 0 0 8px 0; font-size: 0.8rem;">Notes: ${currentSong.notes.length}</p>
                <div style="margin-bottom: 8px;">
                    <button class="btn btn-sm btn-success" onclick="playCurrentSong()" style="width: 100%;">
                        <i class="fas fa-play"></i> Play Song
                    </button>
                </div>
                <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                    ${currentSong.chords.slice(0, 8).map(chord => 
                        `<span class="btn btn-xs btn-primary">${chord}</span>`
                    ).join('')}
                    ${currentSong.chords.length > 8 ? `<span class="btn btn-xs btn-secondary">+${currentSong.chords.length - 8}</span>` : ''}
                </div>
            </div>
        `;
    } else {
        display.innerHTML = `
            <p style="text-align: center; color: rgba(255,255,255,0.7); font-style: italic;">
                <i class="fas fa-music"></i><br>
                No song loaded<br>
                <small>Load a song or play notes to see progress</small>
            </p>
        `;
    }
}

function generateChordSuggestionsForSong(song) {
    const suggestions = [];
    
    // Add the song's original chords
    suggestions.push({
        type: 'Original',
        chords: song.chords,
        description: `Original chords for ${song.name}`
    });
    
    // Add common progressions in the same key
    const key = song.key;
    if (chordProgressions[key]) {
        suggestions.push({
            type: 'Pop Progression',
            chords: chordProgressions[key].pop,
            description: 'Common pop progression'
        });
        
        suggestions.push({
            type: 'Major Progression',
            chords: chordProgressions[key].major,
            description: 'Classic major progression'
        });
    }
    
    // Add jazz progression if available
    if (chordProgressions[key] && chordProgressions[key].jazz) {
        suggestions.push({
            type: 'Jazz Progression',
            chords: chordProgressions[key].jazz,
            description: 'Jazz chord progression'
        });
    }
    
    updateChordSuggestions(suggestions);
}

function generateChordProgression() {
    const key = currentKey;
    const suggestions = [];
    
    if (chordProgressions[key]) {
        // Generate different types of progressions
        Object.entries(chordProgressions[key]).forEach(([type, chords]) => {
            suggestions.push({
                type: type.charAt(0).toUpperCase() + type.slice(1),
                chords: chords,
                description: `${type} progression in ${key}`
            });
        });
    }
    
    // Add some creative variations
    suggestions.push({
        type: 'Creative',
        chords: generateCreativeProgression(key),
        description: 'Creative chord progression'
    });
    
    updateChordSuggestions(suggestions);
}

function generateCreativeProgression(key) {
    const baseChords = chordProgressions[key]?.major || ['C', 'F', 'G', 'Am'];
    const creative = [...baseChords];
    
    // Add some variations
    if (Math.random() > 0.5) {
        creative.push(creative[0]); // Repeat first chord
    }
    if (Math.random() > 0.5) {
        creative.splice(2, 0, creative[1]); // Insert second chord
    }
    
    return creative;
}

function suggestChordsForKey() {
    const key = currentKey;
    const suggestions = [];
    
    // Get all available progressions for the current key
    if (chordProgressions[key]) {
        Object.entries(chordProgressions[key]).forEach(([type, chords]) => {
            suggestions.push({
                type: type.charAt(0).toUpperCase() + type.slice(1),
                chords: chords,
                description: `${type} progression in ${key}`
            });
        });
    }
    
    // Add some common chord substitutions
    suggestions.push({
        type: 'Substitutions',
        chords: generateChordSubstitutions(key),
        description: 'Common chord substitutions'
    });
    
    updateChordSuggestions(suggestions);
}

function generateChordSubstitutions(key) {
    const substitutions = {
        'C': ['Am', 'F', 'G', 'Em'],
        'G': ['Em', 'C', 'D', 'Bm'],
        'D': ['Bm', 'G', 'A', 'F#m'],
        'Am': ['F', 'C', 'G', 'Dm']
    };
    
    return substitutions[key] || ['Am', 'F', 'C', 'G'];
}

function analyzeCurrentMelody() {
    if (currentMelody.length === 0) {
        showNotification('Play some notes first to analyze the melody!', 'info');
        return;
    }
    
    // Analyze the melody and suggest chords
    const suggestions = analyzeMelodyForChords(currentMelody);
    updateChordSuggestions(suggestions);
    
    showNotification('Melody analyzed! Check chord suggestions.', 'success');
}

function analyzeMelodyForChords(melody) {
    const suggestions = [];
    
    // Extract unique notes from melody
    const uniqueNotes = [...new Set(melody.map(note => note.replace(/\d/g, '')))];
    
    // Find the key based on the most common notes
    const key = detectKeyFromNotes(uniqueNotes);
    
    // Generate chord suggestions based on the detected key
    if (chordProgressions[key]) {
        suggestions.push({
            type: 'Detected Key',
            chords: chordProgressions[key].major,
            description: `Detected key: ${key}`
        });
        
        suggestions.push({
            type: 'Melody-Based',
            chords: generateChordsFromMelody(melody, key),
            description: 'Chords based on melody analysis'
        });
    }
    
    return suggestions;
}

function detectKeyFromNotes(notes) {
    // Simple key detection based on common patterns
    const keyPatterns = {
        'C': ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
        'G': ['G', 'A', 'B', 'C', 'D', 'E', 'F#'],
        'D': ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'],
        'Am': ['A', 'B', 'C', 'D', 'E', 'F', 'G']
    };
    
    let bestMatch = 'C';
    let bestScore = 0;
    
    Object.entries(keyPatterns).forEach(([key, scale]) => {
        const score = notes.filter(note => scale.includes(note)).length;
        if (score > bestScore) {
            bestScore = score;
            bestMatch = key;
        }
    });
    
    return bestMatch;
}

function generateChordsFromMelody(melody, key) {
    // Generate chords based on the melody notes
    const chords = [];
    const chordMap = {
        'C': ['C', 'Am', 'F', 'G'],
        'G': ['G', 'Em', 'C', 'D'],
        'D': ['D', 'Bm', 'G', 'A'],
        'Am': ['Am', 'F', 'C', 'G']
    };
    
    const availableChords = chordMap[key] || ['C', 'Am', 'F', 'G'];
    
    // Create a progression based on melody length
    for (let i = 0; i < Math.min(melody.length, 8); i++) {
        chords.push(availableChords[i % availableChords.length]);
    }
    
    return chords;
}

function updateChordSuggestions(suggestions) {
    chordSuggestions = suggestions; // Store for playback
    const container = document.getElementById('chordSuggestions');
    if (!container) return;
    
    if (suggestions.length === 0) {
        container.innerHTML = `
            <div class="chord-suggestion-empty">
                <i class="fas fa-magic"></i>
                <p>No chord suggestions available</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = suggestions.map((suggestion, index) => `
        <div class="chord-suggestion" style="background: rgba(255,255,255,0.1); padding: 12px; border-radius: 8px; margin-bottom: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <h6 style="margin: 0; color: #FFD700;">${suggestion.type}</h6>
                <button class="btn btn-xs btn-primary" onclick="playChordProgression(${index})">
                    <i class="fas fa-play"></i>
                </button>
            </div>
            <p style="margin: 0 0 8px 0; font-size: 0.8rem; color: rgba(255,255,255,0.8);">${suggestion.description}</p>
            <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                ${suggestion.chords.map(chord => 
                    `<span class="btn btn-xs btn-secondary">${chord}</span>`
                ).join('')}
            </div>
        </div>
    `).join('');
}

function playChordProgression(index) {
    if (!chordSuggestions[index]) return;
    
    const chords = chordSuggestions[index].chords;
    const chordNotes = {
        'C': ['C4', 'E4', 'G4'],
        'F': ['F4', 'A4', 'C5'],
        'G': ['G4', 'B4', 'D5'],
        'Am': ['A4', 'C5', 'E5'],
        'Em': ['E4', 'G4', 'B4'],
        'Dm': ['D4', 'F4', 'A4'],
        'G7': ['G4', 'B4', 'D5', 'F5'],
        'Cmaj7': ['C4', 'E4', 'G4', 'B4'],
        'Dm7': ['D4', 'F4', 'A4', 'C5'],
        'Em7': ['E4', 'G4', 'B4', 'D5'],
        'Fmaj7': ['F4', 'A4', 'C5', 'E5'],
        'A7': ['A4', 'C#5', 'E5', 'G5'],
        'Bm': ['B4', 'D5', 'F#5'],
        'E': ['E4', 'G#4', 'B4'],
        'A': ['A4', 'C#5', 'E5'],
        'Bm7b5': ['B4', 'D5', 'F5', 'A5'],
        'C#m7b5': ['C#5', 'E5', 'G5', 'B5'],
        'F#m': ['F#4', 'A4', 'C#5'],
        'C#m': ['C#4', 'E4', 'G#4']
    };
    
    chords.forEach((chord, i) => {
        setTimeout(() => {
            const notes = chordNotes[chord] || chordNotes['C'];
            notes.forEach(note => {
                if (synth) {
                    synth.triggerAttackRelease(note, '2n');
                }
            });
        }, i * 1000); // Play each chord with 1 second delay
    });
    
    showNotification(`Playing ${chordSuggestions[index].type} progression`, 'info');
}

function addSampleSongsToPlaylist() {
    // Get actual songs from popularSongs that have notes
    const sampleSongKeys = [
        'twinkle',
        'ode', 
        'amazing',
        'birthday',
        'fur_elise',
        'moonlight',
        'canon',
        'air'
    ];
    
    const sampleSongs = [];
    
    sampleSongKeys.forEach(songKey => {
        if (popularSongs[songKey]) {
            const song = popularSongs[songKey];
            sampleSongs.push({
                name: song.name,
                key: song.key,
                composer: song.composer,
                notes: song.notes || [],
                addedAt: Date.now()
            });
        }
    });
    
    // Add to playlist, avoiding duplicates
    sampleSongs.forEach(song => {
        const exists = playlist.find(existing => existing.name === song.name);
        if (!exists) {
            playlist.push(song);
        }
    });
    
    updatePlaylistDisplay();
    showNotification(`${sampleSongs.length} sample songs added to playlist!`, 'success');
}

function clearPlaylist() {
    playlist = [];
    updatePlaylistDisplay();
    showNotification('Playlist cleared!', 'success');
}

function addCurrentSongToPlaylist() {
    console.log('addCurrentSongToPlaylist called');
    console.log('currentSong:', currentSong);
    
    if (!currentSong) {
        showNotification('No song currently loaded! Load a song from the Popular Songs section first.', 'error');
        return;
    }
    
    const songToAdd = {
        name: currentSong.name,
        key: currentSong.key,
        composer: currentSong.composer || 'Current Session',
        notes: currentSong.notes || [],
        addedAt: Date.now()
    };
    
    console.log('songToAdd:', songToAdd);
    
    // Check if song already exists
    const exists = playlist.find(song => song.name === currentSong.name);
    if (exists) {
        showNotification('Song already in playlist!', 'info');
        return;
    }
    
    playlist.push(songToAdd);
    console.log('Updated playlist:', playlist);
    updatePlaylistDisplay();
    showNotification(`${currentSong.name} added to playlist!`, 'success');
}

function updatePlaylistDisplay() {
    console.log('updatePlaylistDisplay called');
    const container = document.getElementById('playlistContainer');
    console.log('playlistContainer:', container);
    if (!container) {
        console.log('playlistContainer not found!');
        return;
    }
    
    console.log('playlist length:', playlist.length);
    console.log('playlist:', playlist);
    
    if (playlist.length === 0) {
        container.innerHTML = `
            <p style="text-align: center; color: rgba(255,255,255,0.7); font-style: italic;">
                <i class="fas fa-music"></i><br>
                No songs in playlist yet<br>
                <small>Load a famous song and click "Add Current Song"</small>
            </p>
        `;
        return;
    }
    
    container.innerHTML = playlist.map((song, index) => `
        <div class="playlist-item" style="margin-bottom: 10px; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 6px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-weight: 600; color: #FFD700;">${song.name}</div>
                    <div style="font-size: 0.8rem; color: rgba(255,255,255,0.7);">
                        Key: ${song.key} • ${song.composer}
                    </div>
                </div>
                <div style="display: flex; gap: 4px;">
                    <button class="btn btn-xs btn-primary" onclick="loadSongFromPlaylist(${index})">
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="btn btn-xs btn-danger" onclick="removeFromPlaylist(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    console.log('Playlist display updated');
}

function loadSongFromPlaylist(index) {
    console.log('loadSongFromPlaylist called with index:', index);
    console.log('playlist length:', playlist.length);
    console.log('playlist:', playlist);
    
    if (index >= 0 && index < playlist.length) {
        const song = playlist[index];
        console.log('Loading song:', song);
        
        // Try to find the full song data from popularSongs
        const songKey = Object.keys(popularSongs).find(key => 
            popularSongs[key].name === song.name
        );
        
        let fullSongData;
        if (songKey && popularSongs[songKey]) {
            // Use the full song data from popularSongs
            fullSongData = popularSongs[songKey];
            console.log('Found full song data:', fullSongData);
        } else {
            // Use the playlist song data
            fullSongData = song;
            console.log('Using playlist song data:', fullSongData);
        }
        
        // Set current song
        currentSong = {
            name: fullSongData.name,
            key: fullSongData.key,
            composer: fullSongData.composer,
            notes: fullSongData.notes || []
        };
        console.log('Set currentSong to:', currentSong);
        
        // Update the song picker if it exists
        const songPicker = document.getElementById('famousSongPicker');
        if (songPicker && songKey) {
            songPicker.value = songKey;
            console.log('Updated song picker to:', songKey);
        }
        
        // Update display
        updateCurrentSongDisplay();
        showNotification(`Loaded ${song.name} from playlist!`, 'success');
        console.log('Song loaded successfully from playlist');
        
        // Auto-play the song if it has notes
        if (currentSong.notes && currentSong.notes.length > 0) {
            setTimeout(() => playCurrentSong(), 500);
        } else {
            showNotification(`${song.name} has no notes to play. Try loading it from the Popular Songs section first.`, 'warning');
        }
    } else {
        console.error('Invalid index for playlist:', index);
    }
}

function removeFromPlaylist(index) {
    if (index >= 0 && index < playlist.length) {
        const songName = playlist[index].name;
        playlist.splice(index, 1);
        updatePlaylistDisplay();
        showNotification(`${songName} removed from playlist!`, 'info');
    }
}

function exportPlaylist() {
    if (playlist.length === 0) {
        showNotification('No songs in playlist to export!', 'error');
        return;
    }
    
    const playlistData = playlist.map(song => ({
        name: song.name,
        key: song.key,
        composer: song.composer,
        addedAt: song.addedAt ? new Date(song.addedAt).toLocaleString() : 'Unknown'
    }));
    
    const dataStr = JSON.stringify(playlistData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `playlist-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
    showNotification('Playlist exported!', 'success');
}

// Multi-track functionality




// Sheet Music functionality
function generateSheetMusic() {
    console.log('=== GENERATE SHEET MUSIC ===');
    console.log('recordedNotes:', recordedNotes);
    console.log('currentSong:', currentSong);
    console.log('currentMelody:', currentMelody);
    
    // Get music history from localStorage
    const musicHistory = JSON.parse(localStorage.getItem('musicHistory') || '[]');
    console.log('musicHistory from localStorage:', musicHistory);
    
    // Check multiple sources for notes
    let notes = [];
    
    if (recordedNotes.length > 0) {
        notes = recordedNotes;
        console.log('Using recorded notes');
    } else if (currentSong && currentSong.notes && currentSong.notes.length > 0) {
        notes = currentSong.notes;
        console.log('Using current song notes');
    } else if (currentMelody.length > 0) {
        // Convert currentMelody to note objects
        notes = currentMelody.map((note, index) => ({
            note: note,
            timestamp: Date.now() - (currentMelody.length - index) * 1000,
            instrument: currentInstrument
        }));
        console.log('Using current melody notes');
    } else if (musicHistory && musicHistory.length > 0) {
        // Use recent music history
        const recentNotes = musicHistory.slice(-20); // Last 20 notes
        notes = recentNotes.map((note, index) => ({
            note: note.note || note,
            timestamp: Date.now() - (recentNotes.length - index) * 1000,
            instrument: currentInstrument
        }));
        console.log('Using music history notes');
    }
    
    if (notes.length === 0) {
        console.log('No notes available for sheet music generation');
        showNotification('No notes to generate sheet music from! Play some notes or load a song first.', 'error');
        return;
    }
    
    console.log('Using notes for sheet music:', notes);
    
    const sheetMusic = generateSheetMusicFromNotes(notes);
    console.log('Generated sheet music:', sheetMusic);
    
    const container = document.getElementById('sheetMusicContainer');
    if (container) {
        container.innerHTML = `
            <div class="sheet-music-content">
                <h5>Generated Sheet Music</h5>
                <div style="font-family: 'Courier New', monospace; font-size: 0.9rem; line-height: 1.5; color: white; white-space: pre-wrap; overflow-x: auto; max-height: 300px; overflow-y: auto;">
${sheetMusic}
                </div>
                <div style="margin-top: 10px;">
                    <button class="btn btn-sm btn-primary" onclick="downloadSheetMusic()">
                        <i class="fas fa-download"></i> Download Sheet
                    </button>
                </div>
            </div>
        `;
        console.log('Sheet music container updated');
    } else {
        console.error('Sheet music container not found');
    }
    
    showNotification('Sheet music generated!', 'success');
}

function generateSheetMusicFromNotes(notes) {
    console.log('generateSheetMusicFromNotes called with:', notes);
    
    if (!notes || notes.length === 0) {
        console.log('No notes provided to generateSheetMusicFromNotes');
        return 'No notes available';
    }
    
    const noteNames = notes.map(note => {
        const noteStr = typeof note === 'string' ? note : note.note;
        console.log('Processing note:', note, '-> noteStr:', noteStr);
        return noteStr.replace(/\d/g, ''); // Remove octave numbers
    });
    
    console.log('Note names after processing:', noteNames);
    
    const uniqueNotes = [...new Set(noteNames)];
    console.log('Unique notes:', uniqueNotes);
    
    const key = detectKeyFromNotes(uniqueNotes);
    console.log('Detected key:', key);
    
    let sheetMusic = `🎵 SHEET MUSIC 🎵\n`;
    sheetMusic += `═══════════════════════════════════════\n\n`;
    sheetMusic += `📋 SONG INFORMATION\n`;
    sheetMusic += `───────────────────────────────────────\n`;
    sheetMusic += `Key: ${key}\n`;
    sheetMusic += `Time Signature: 4/4\n`;
    sheetMusic += `Tempo: ${currentBPM} BPM\n`;
    sheetMusic += `Instrument: ${currentInstrument}\n`;
    sheetMusic += `Total Notes: ${notes.length}\n`;
    
    if (notes.length > 1) {
        const duration = Math.round((notes[notes.length - 1].timestamp - notes[0].timestamp) / 1000);
        sheetMusic += `Duration: ${duration} seconds\n`;
    }
    sheetMusic += `\n`;
    
    // Simple staff representation
    sheetMusic += `🎼 MUSICAL STAFF\n`;
    sheetMusic += `───────────────────────────────────────\n`;
    sheetMusic += `G ──●─────────────────────────────────────\n`;
    sheetMusic += `F ────────────────────────────────────────\n`;
    sheetMusic += `E ────────────────────────────────────────\n`;
    sheetMusic += `D ────────────────────────────────────────\n`;
    sheetMusic += `C ────────────────────────────────────────\n\n`;
    
    // Note sequence with timing
    sheetMusic += `🎶 NOTE SEQUENCE\n`;
    sheetMusic += `───────────────────────────────────────\n`;
    const noteGroups = [];
    for (let i = 0; i < noteNames.length; i += 8) {
        noteGroups.push(noteNames.slice(i, i + 8));
    }
    
    noteGroups.forEach((group, index) => {
        sheetMusic += `Bar ${index + 1}: ${group.join(' ')}\n`;
    });
    sheetMusic += `\n`;
    
    // Chord analysis
    const chords = generateChordsFromMelody(noteNames, key);
    sheetMusic += `🎸 CHORD ANALYSIS\n`;
    sheetMusic += `───────────────────────────────────────\n`;
    sheetMusic += `Suggested Chords: ${chords.join(' ')}\n`;
    sheetMusic += `\n`;
    
    // Scale information
    const scaleNotes = getScaleNotes(key);
    sheetMusic += `🎯 SCALE INFORMATION\n`;
    sheetMusic += `───────────────────────────────────────\n`;
    sheetMusic += `Scale: ${scaleNotes.join(' ')}\n`;
    sheetMusic += `\n`;
    
    // Performance notes
    sheetMusic += `📝 PERFORMANCE NOTES\n`;
    sheetMusic += `───────────────────────────────────────\n`;
    sheetMusic += `• Play with feeling and expression\n`;
    sheetMusic += `• Maintain consistent tempo at ${currentBPM} BPM\n`;
    sheetMusic += `• Use proper fingerings for smooth transitions\n`;
    sheetMusic += `• Practice slowly at first, then increase speed\n`;
    sheetMusic += `• Pay attention to dynamics and articulation\n`;
    sheetMusic += `\n`;
    
    // Practice suggestions
    sheetMusic += `💡 PRACTICE SUGGESTIONS\n`;
    sheetMusic += `───────────────────────────────────────\n`;
    sheetMusic += `• Practice hands separately first\n`;
    sheetMusic += `• Focus on difficult passages\n`;
    sheetMusic += `• Record yourself and listen back\n`;
    sheetMusic += `• Experiment with different tempos\n`;
    sheetMusic += `• Try different articulations\n`;
    
    return sheetMusic;
}

function getScaleNotes(key) {
    const scales = {
        'C': ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
        'G': ['G', 'A', 'B', 'C', 'D', 'E', 'F#'],
        'D': ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'],
        'Am': ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
        'F': ['F', 'G', 'A', 'Bb', 'C', 'D', 'E'],
        'Bb': ['Bb', 'C', 'D', 'Eb', 'F', 'G', 'A']
    };
    
    return scales[key] || scales['C'];
}

function downloadSheetMusic() {
    const container = document.getElementById('sheetMusicContainer');
    if (!container) return;
    
    const sheetContent = container.querySelector('.sheet-music-content div');
    if (!sheetContent) return;
    
    const text = sheetContent.textContent;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `sheet_music_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
    showNotification('Sheet music downloaded!', 'success');
}



// Add missing reaction functions


// Voice call WebRTC implementation
let isVoiceMuted = false;

// Voice call functions
async function joinVoiceCall() {
    console.log('=== JOIN VOICE CALL ===');
    console.log('joinVoiceCall function called');
    console.log('currentRoomId:', currentRoomId);
    console.log('currentUsername:', currentUsername);
    console.log('socket connected:', socket?.connected);
    
    try {
        console.log('Checking for getUserMedia support...');
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.error('getUserMedia not supported');
            showNotification('getUserMedia is not supported in this browser or context.', 'error');
            return;
        }
        console.log('getUserMedia is supported, requesting microphone access...');
        
        // Request microphone access
        localStream = await navigator.mediaDevices.getUserMedia({ 
            audio: true, 
            video: false 
        });
        console.log('Microphone access granted:', localStream);
        
        // Ensure audio context is started for both Tone.js and WebRTC
        if (Tone.context && Tone.context.state !== 'running') {
            await Tone.start();
            console.log('Tone.js audio context started for voice call');
        }
        
        isInVoiceCall = true;
        
        // Update UI - Voice call buttons removed, only Test Audio button remains
        console.log('Voice call UI simplified - only Test Audio button available');
        
        // Join voice call on server
        if (socket && socket.connected) {
            console.log('Emitting join_voice_call to server...');
            socket.emit('join_voice_call', {
                room_id: currentRoomId,
                username: currentUsername
            });
        } else {
            console.error('Socket not connected');
            showNotification('WebSocket connection not available', 'error');
            return;
        }
        
        showNotification('Joined voice call', 'success');
        
        // Request current voice participants
        if (socket && socket.connected) {
            console.log('Requesting current voice participants...');
            socket.emit('request_voice_participants', {
                room_id: currentRoomId
            });
        }
        
        const joinVoiceBtn = document.getElementById('joinVoiceBtn');
        const leaveVoiceBtn = document.getElementById('leaveVoiceBtn');
        if (joinVoiceBtn) joinVoiceBtn.style.display = 'none';
        if (leaveVoiceBtn) leaveVoiceBtn.style.display = 'inline-block';
        
    } catch (error) {
        console.error('Error joining voice call:', error);
        showNotification('Failed to join voice call: ' + error.message, 'error');
    }
}

function leaveVoiceCall() {
    // Stop local stream
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    
    // Close all peer connections
    Object.values(peerConnections).forEach(pc => {
        pc.close();
    });
    peerConnections = {};
    
    isInVoiceCall = false;
    isVoiceMuted = false;
    voiceParticipants = [];
    
    // Update UI - Voice call buttons removed, only Test Audio button remains
    console.log('Voice call UI simplified - only Test Audio button available');
    
    // Leave voice call on server
    if (socket && socket.connected) {
        socket.emit('leave_voice_call', {
            room_id: currentRoomId,
            username: currentUsername
        });
    }
    
    showNotification('Left voice call', 'info');
    
    const joinVoiceBtn = document.getElementById('joinVoiceBtn');
    const leaveVoiceBtn = document.getElementById('leaveVoiceBtn');
    if (joinVoiceBtn) joinVoiceBtn.style.display = 'inline-block';
    if (leaveVoiceBtn) leaveVoiceBtn.style.display = 'none';
}

function toggleMute() {
    if (!localStream) return;
    
    isVoiceMuted = !isVoiceMuted;
    localStream.getAudioTracks().forEach(track => {
        track.enabled = !isVoiceMuted;
    });
    
    // Update UI - Voice call buttons removed, only Test Audio button remains
    console.log('Voice call UI simplified - only Test Audio button available');
    
    // Send mute status to server
    if (socket && socket.connected) {
        socket.emit('voice_mute_status', {
            room_id: currentRoomId,
            username: currentUsername,
            muted: isVoiceMuted
        });
    }
    
    showNotification(isVoiceMuted ? 'Muted' : 'Unmuted', 'info');
}

function testVoiceCall() {
    if (isInVoiceCall) {
        console.log('=== Voice Call Debug Info ===');
        console.log('Local stream:', localStream);
        console.log('Voice participants:', voiceParticipants);
        console.log('Peer connections:', Object.keys(peerConnections));
        
        // Check if testing in same browser
        const uniqueParticipants = [...new Set(voiceParticipants)];
        const isSameBrowser = uniqueParticipants.length === 1 && uniqueParticipants[0] === currentUsername;
        
        if (isSameBrowser) {
            console.log('⚠️ DETECTED: Testing in same browser - echo will not work!');
            console.log('💡 Solution: Use different browsers, devices, or incognito windows');
        } else {
            console.log('✅ Testing across different browsers/devices - echo should work');
        }
        
        // Check audio elements
        voiceParticipants.forEach(username => {
            const audioElement = document.getElementById(`audio-${username}`);
            console.log(`Audio element for ${username}:`, {
                exists: !!audioElement,
                paused: audioElement?.paused,
                srcObject: !!audioElement?.srcObject,
                readyState: audioElement?.readyState,
                currentTime: audioElement?.currentTime
            });
        });
        
        Object.entries(peerConnections).forEach(([username, pc]) => {
            console.log(`Connection with ${username}:`, {
                connectionState: pc.connectionState,
                iceConnectionState: pc.iceConnectionState,
                signalingState: pc.signalingState,
                hasLocalDescription: !!pc.localDescription,
                hasRemoteDescription: !!pc.remoteDescription
            });
        });
        
        // Test audio playback
        voiceParticipants.forEach(username => {
            if (username !== currentUsername) {
                const audioElement = document.getElementById(`audio-${username}`);
                if (audioElement && audioElement.srcObject) {
                    console.log(`Testing audio playback for ${username}...`);
                    audioElement.play().then(() => {
                        console.log(`✅ Audio test successful for ${username}`);
                    }).catch(error => {
                        console.error(`❌ Audio test failed for ${username}:`, error);
                    });
                }
            }
        });
        
        if (isSameBrowser) {
            showNotification('Same browser detected - use different browsers for echo testing', 'warning');
        } else {
            showNotification('Voice call debug info logged to console', 'success');
        }
    } else {
        showNotification('Join voice call first', 'info');
    }
}

function testAudioPlayback() {
    console.log('=== Testing Audio Playback ===');
    
    // Test Tone.js audio
    if (synth) {
        console.log('Testing Tone.js synth...');
        try {
            synth.triggerAttack('C4');
            setTimeout(() => {
                synth.triggerRelease();
                console.log('✅ Tone.js audio test successful');
                showNotification('✅ Audio test successful! Piano should work now.', 'success');
            }, 500);
        } catch (error) {
            console.error('❌ Tone.js audio test failed:', error);
            showNotification('❌ Audio test failed. Try clicking the page first.', 'error');
        }
    } else {
        console.log('❌ No Tone.js synth available');
        showNotification('❌ Audio system not ready. Try refreshing the page.', 'error');
    }
    
    // Test browser audio context
    if (Tone.context) {
        console.log('Audio context state:', Tone.context.state);
        if (Tone.context.state !== 'running') {
            console.log('⚠️ Audio context not running - user interaction required');
            showNotification('⚠️ Audio context needs user interaction. Click piano keys to activate.', 'warning');
        }
    }
    
    showNotification('Audio playback test completed - check console for details', 'info');
}

function playTestTone() {
    console.log('=== Playing Test Tone ===');
    
    if (!isInVoiceCall) {
        showNotification('Join voice call first', 'warning');
        return;
    }
    
    // Create a simple test tone using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4 note
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime); // Low volume
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 2);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 2);
    
    console.log('🔊 Playing 2-second test tone (A4, 440Hz)');
    showNotification('Playing test tone - other participants should hear it', 'success');
    
    // Clean up
    setTimeout(() => {
        audioContext.close();
    }, 3000);
}

function showVoiceCallTestingInfo() {
    const info = `
🎵 Voice Call Testing Guide:

✅ For proper echo testing:
• Use different browsers (Chrome + Firefox)
• Use different devices (phone + computer)
• Use incognito/private windows
• Use different user accounts

❌ Same browser tabs won't work because:
• Shared audio context prevents echo
• Browser blocks self-audio loopback
• Microphone stream conflicts

🔧 Testing steps:
1. Join voice call on both devices/browsers
2. Click "Test Tone" to play a test sound
3. Speak into microphone
4. Check console for connection status

💡 The voice call IS working if you see:
• "✅ Audio playing for [username]"
• Connection state: "connected"
• ICE connection state: "connected"
    `;
    
    console.log(info);
            showNotification('Voice call testing guide logged to console', 'info');
}

function debugApp() {
    console.log('=== APP DEBUG INFO ===');
    console.log('Current key:', currentKey);
    console.log('Current instrument:', currentInstrument);
    console.log('Current username:', currentUsername);
    console.log('Current room ID:', currentRoomId);
    console.log('Socket connected:', socket?.connected);
    console.log('Synth available:', !!synth);
    console.log('Voice call active:', isInVoiceCall);
    
    // Check DOM elements
    const pianoKeys = document.querySelector('.piano-keys');
    console.log('Piano keys container:', pianoKeys);
    
    const chatInput = document.querySelector('.chat-input');
    console.log('Chat input container:', chatInput);
    
    const emojiBtn = document.getElementById('emojiPickerBtn');
    console.log('Emoji picker button:', emojiBtn);
    
    // Test piano rendering
    console.log('Testing piano rendering...');
    renderPiano();
    
    // Test emoji picker
    console.log('Testing emoji picker...');
    showChatEmojiPicker();
    
    showNotification('Debug info logged to console', 'info');
}

// Emoji picker function - already defined at the top of the file
// insertEmoji function - already defined at the top of the file

// WebRTC peer connection functions
async function createPeerConnection(targetUsername) {
    try {
        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        });
        
        // Add local stream
        if (localStream) {
            localStream.getTracks().forEach(track => {
                pc.addTrack(track, localStream);
            });
        }
        
        // Handle incoming tracks
        pc.ontrack = (event) => {
            console.log(`Received track from ${targetUsername}:`, event.streams[0]);
            let audioElement = document.getElementById(`audio-${targetUsername}`);
            
            // Create audio element if it doesn't exist
            if (!audioElement) {
                audioElement = document.createElement('audio');
                audioElement.id = `audio-${targetUsername}`;
                audioElement.autoplay = true;
                audioElement.controls = false;
                audioElement.style.display = 'none';
                document.body.appendChild(audioElement);
                console.log(`Created audio element for ${targetUsername}`);
            }
            
                    // Set the stream and play
        audioElement.srcObject = event.streams[0];
        
        // Try to play immediately
        audioElement.play().then(() => {
            console.log(`✅ Audio playing for ${targetUsername}`);
        }).catch(error => {
            console.error('Error playing audio:', error);
            
            // Try to play again after user interaction
            const playAfterInteraction = () => {
                audioElement.play().then(() => {
                    console.log(`✅ Audio started after user interaction for ${targetUsername}`);
                }).catch(e => {
                    console.error('Still cannot play audio after interaction:', e);
                });
            };
            
            // Listen for any user interaction
            document.addEventListener('click', playAfterInteraction, { once: true });
            document.addEventListener('keydown', playAfterInteraction, { once: true });
            document.addEventListener('touchstart', playAfterInteraction, { once: true });
            
            // Also try when the page becomes visible
            document.addEventListener('visibilitychange', () => {
                if (!document.hidden) {
                    playAfterInteraction();
                }
            }, { once: true });
        });
        };
        
        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('voice_ice_candidate', {
                    room_id: currentRoomId,
                    target_username: targetUsername,
                    candidate: event.candidate
                });
            }
        };
        
        // Handle connection state changes
        pc.onconnectionstatechange = () => {
            console.log(`Connection state with ${targetUsername}:`, pc.connectionState);
            if (pc.connectionState === 'connected') {
                console.log(`✅ Successfully connected to ${targetUsername}`);
            } else if (pc.connectionState === 'failed') {
                console.error(`❌ Connection failed with ${targetUsername}`);
            }
        };
        
        // Handle ICE connection state changes
        pc.oniceconnectionstatechange = () => {
            console.log(`ICE connection state with ${targetUsername}:`, pc.iceConnectionState);
            if (pc.iceConnectionState === 'connected') {
                console.log(`✅ ICE connected to ${targetUsername}`);
            } else if (pc.iceConnectionState === 'failed') {
                console.error(`❌ ICE connection failed with ${targetUsername}`);
            }
        };
        
        return pc;
    } catch (error) {
        console.error('Error creating peer connection:', error);
        throw error;
    }
}

async function handleVoiceOffer(data) {
    const { from_username, offer } = data;
    
    console.log(`Received voice offer from ${from_username}:`, offer);
    
    if (from_username === currentUsername) {
        console.log('Ignoring offer from self');
        return;
    }
    
    try {
        // Check if we already have a connection with this user
        let pc = peerConnections[from_username];
        if (!pc || pc.connectionState === 'closed') {
            console.log(`Creating new peer connection for ${from_username}`);
            pc = await createPeerConnection(from_username);
            peerConnections[from_username] = pc;
        }
        
        console.log(`Peer connection state for ${from_username}:`, pc.signalingState);
        
        // Handle different signaling states
        if (pc.signalingState === 'stable') {
            // Normal case - set remote description and create answer
            console.log(`Setting remote description for ${from_username}`);
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            console.log(`Created answer for ${from_username}:`, answer);
            await pc.setLocalDescription(answer);
            
            console.log(`Sending voice answer to ${from_username}`);
            socket.emit('voice_answer', {
                room_id: currentRoomId,
                target_username: from_username,
                answer: answer
            });
        } else if (pc.signalingState === 'have-local-offer') {
            // We already sent an offer, so we need to rollback and handle this offer
            console.log(`Rolling back local offer and handling remote offer for ${from_username}`);
            await pc.setLocalDescription({ type: 'rollback' });
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            
            socket.emit('voice_answer', {
                room_id: currentRoomId,
                target_username: from_username,
                answer: answer
            });
        } else {
            console.log(`Cannot handle offer in current signaling state: ${pc.signalingState}`);
        }
    } catch (error) {
        console.error('Error handling voice offer:', error);
    }
}

async function handleVoiceAnswer(data) {
    const { from_username, answer } = data;
    
    console.log(`Received voice answer from ${from_username}:`, answer);
    
    if (from_username === currentUsername) {
        console.log('Ignoring answer from self');
        return;
    }
    
    try {
        const pc = peerConnections[from_username];
        if (pc && pc.signalingState !== 'stable') {
            console.log(`Setting remote description for answer from ${from_username}`);
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
            console.log(`Successfully set remote description for ${from_username}`);
            
            // Process any pending ICE candidates
            if (pc.pendingCandidates && pc.pendingCandidates.length > 0) {
                console.log(`Processing ${pc.pendingCandidates.length} pending ICE candidates for ${from_username}`);
                for (const candidate of pc.pendingCandidates) {
                    try {
                        await pc.addIceCandidate(new RTCIceCandidate(candidate));
                        console.log(`Successfully added pending ICE candidate for ${from_username}`);
                    } catch (error) {
                        console.error('Error adding pending ICE candidate:', error);
                    }
                }
                pc.pendingCandidates = [];
            }
        } else {
            // This is normal - duplicate answers can be received
            console.log(`Answer received but connection already stable for ${from_username}`);
        }
    } catch (error) {
        // This error is usually harmless - duplicate answers
        console.log(`Voice answer handling completed for ${from_username}`);
    }
}

function handleVoiceIceCandidate(data) {
    const { from_username, candidate } = data;
    
    console.log(`Received ICE candidate from ${from_username}:`, candidate);
    
    if (from_username === currentUsername) {
        console.log('Ignoring ICE candidate from self');
        return;
    }
    
    try {
        const pc = peerConnections[from_username];
        if (pc) {
            // Store ICE candidates if remote description isn't set yet
            if (!pc.remoteDescription) {
                if (!pc.pendingCandidates) {
                    pc.pendingCandidates = [];
                }
                pc.pendingCandidates.push(candidate);
                console.log(`Stored ICE candidate for ${from_username} (remote description not set yet)`);
            } else {
                console.log(`Adding ICE candidate for ${from_username}`);
                pc.addIceCandidate(new RTCIceCandidate(candidate)).then(() => {
                    console.log(`Successfully added ICE candidate for ${from_username}`);
                }).catch(error => {
                    console.error('Error adding ICE candidate:', error);
                });
            }
        } else {
            console.log(`Cannot add ICE candidate, no peer connection for ${from_username}`);
        }
    } catch (error) {
        console.error('Error handling ICE candidate:', error);
    }
}

// Voice participant management
function addVoiceParticipant(username) {
    console.log(`Adding voice participant: ${username}`);
    console.log(`Current voice participants:`, voiceParticipants);
    console.log(`Is in voice call:`, isInVoiceCall);
    console.log(`Current username:`, currentUsername);
    console.log(`Existing peer connections:`, Object.keys(peerConnections));
    
    if (!voiceParticipants.includes(username)) {
        voiceParticipants.push(username);
        updateVoiceParticipantsUI();
        
        // Create audio element for this participant
        const audioElement = document.createElement('audio');
        audioElement.id = `audio-${username}`;
        audioElement.autoplay = true;
        audioElement.style.display = 'none';
        document.body.appendChild(audioElement);
        
        // Create peer connection if we're in voice call and don't already have one
        if (isInVoiceCall && username !== currentUsername && !peerConnections[username]) {
            console.log(`Creating peer connection for ${username}`);
            createPeerConnection(username).then(pc => {
                peerConnections[username] = pc;
                console.log(`Peer connection created for ${username}:`, pc);
                
                // Create and send offer
                pc.createOffer().then(offer => {
                    console.log(`Created offer for ${username}:`, offer);
                    pc.setLocalDescription(offer);
                    socket.emit('voice_offer', {
                        room_id: currentRoomId,
                        target_username: username,
                        offer: offer
                    });
                }).catch(error => {
                    console.error('Error creating offer:', error);
                });
            }).catch(error => {
                console.error('Error creating peer connection:', error);
            });
        } else {
            console.log(`Skipping peer connection creation for ${username} because:`, {
                isInVoiceCall,
                isNotSelf: username !== currentUsername,
                alreadyExists: !!peerConnections[username]
            });
        }
    } else {
        console.log(`Voice participant ${username} already exists`);
    }
}

function removeVoiceParticipant(username) {
    const index = voiceParticipants.indexOf(username);
    if (index > -1) {
        voiceParticipants.splice(index, 1);
        updateVoiceParticipantsUI();
        
        // Remove audio element
        const audioElement = document.getElementById(`audio-${username}`);
        if (audioElement) {
            audioElement.pause();
            audioElement.srcObject = null;
            audioElement.remove();
            console.log(`Removed audio element for ${username}`);
        }
        
        // Close peer connection
        const pc = peerConnections[username];
        if (pc) {
            pc.close();
            delete peerConnections[username];
            console.log(`Closed peer connection for ${username}`);
        }
    }
}

function updateVoiceParticipantsUI() {
    const voiceParticipantsContainer = document.querySelector('.voice-participants');
    if (!voiceParticipantsContainer) return;
    
    if (voiceParticipants.length === 0) {
        voiceParticipantsContainer.innerHTML = `
            <div class="voice-participant">
                <i class="fas fa-user"></i>
                <span>No one in voice call</span>
            </div>
        `;
        return;
    }
    
    voiceParticipantsContainer.innerHTML = voiceParticipants.map(username => `
        <div class="voice-participant" data-username="${username}">
            <div class="participant-avatar">
                <img src="/static/images/default-avatar.png" alt="${username}">
                <div class="voice-indicator"></div>
            </div>
            <div class="participant-name">${username}</div>
            ${username === currentUsername ? '<span class="you-badge">You</span>' : ''}
        </div>
    `).join('');
}

function updateVoiceMuteStatus(username, muted) {
    // If username is an object, extract the username string
    if (typeof username === 'object' && username.username) {
        username = username.username;
    }
    // Use data-username attribute for matching
    const participantElement = document.querySelector(`.voice-participant[data-username="${username}"]`);
    if (participantElement) {
        const indicator = participantElement.querySelector('.voice-indicator');
        if (indicator) {
            indicator.classList.toggle('muted', muted);
        }
    }
}

function updateParticipantInstrument(username, instrument) {
    // Update participant instrument in UI
    const participantElement = document.querySelector(`.participant:has(.participant-name:contains('${username}'))`);
    if (participantElement) {
        const instrumentElement = participantElement.querySelector('.participant-instrument');
        if (instrumentElement) {
            instrumentElement.textContent = instrument;
        }
    }
}

// --- Genre badge/label ---
function updateGenreBadge() {
    let badge = document.getElementById('genreBadge');
    if (!badge) {
        const pianoSection = document.querySelector('.piano-section');
        badge = document.createElement('div');
        badge.id = 'genreBadge';
        badge.className = 'genre-badge';
        pianoSection.insertBefore(badge, pianoSection.children[1]);
    }
    badge.textContent = currentGenre.charAt(0).toUpperCase() + currentGenre.slice(1);
}

// --- Genre sound/effect ---
function updateGenreSound() {
    if (!synth) return;
    if (synth.reverb) synth.disconnect(synth.reverb);
    if (synth.distortion) synth.disconnect(synth.distortion);
    if (synth.chorus) synth.disconnect(synth.chorus);
    // Remove old effects
    synth.disconnect();
    synth.toDestination();
    switch (currentGenre) {
        case 'ambient':
            synth.reverb = new Tone.Reverb({ decay: 4, wet: 0.7 }).toDestination();
            synth.connect(synth.reverb);
            break;
        case 'rock':
            synth.distortion = new Tone.Distortion(0.4).toDestination();
            synth.connect(synth.distortion);
            break;
        case 'jazz':
            synth.chorus = new Tone.Chorus(4, 2.5, 0.5).toDestination();
            synth.connect(synth.chorus);
            break;
        case 'classical':
            // No effect, clean sound
            synth.toDestination();
            break;
        case 'electronic':
            synth.reverb = new Tone.Reverb({ decay: 2, wet: 0.3 }).toDestination();
            synth.connect(synth.reverb);
            break;
        default:
            synth.toDestination();
    }
}

// --- Genre theme visual ---
function updateGenreTheme() {
    updateGenreOverlay();
    updateGenreBadge();
}

// Patch genre select event
const genreSelect = document.getElementById('genreSelect');
if (genreSelect) {
    genreSelect.addEventListener('change', function() {
        updateGenre();
        updateGenreTheme();
        updateGenreSound();
    });
}

// Patch updateRoomState to update genre theme and sound
const oldUpdateRoomState = updateRoomState;
updateRoomState = function(state) {
    if (state.bpm) currentBPM = state.bpm;
    if (state.key) currentKey = state.key;
    if (state.genre) currentGenre = state.genre;
    if (state.participants) updateParticipantsList(state.participants);
    updateUserInterface();
    updateGenreTheme();
    updateGenreSound();
};

// Call on load
updateGenreTheme();
updateGenreSound();

// --- Right panel tab switching ---

// Set first tab active on load and hide others
window.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded - initializing right tabs');
    document.querySelectorAll('.right-tab-content').forEach((content, i) => {
        content.style.display = i === 0 ? 'block' : 'none';
        console.log('Set content display:', content.id, content.style.display);
    });
    // Set the first tab button as active
    const firstTabBtn = document.querySelector('.right-tab-btn');
    if (firstTabBtn) {
        firstTabBtn.classList.add('active');
        console.log('Set first tab button active:', firstTabBtn.id);
    }
    
    // Test the showRightTab function
    console.log('Testing showRightTab function...');
    console.log('window.showRightTab exists:', typeof window.showRightTab);
    console.log('showRightTab function exists:', typeof showRightTab);
    
    // Initialize with chords tab
    setTimeout(() => {
        showRightTab('chords');
    }, 100);
});
// Add spacing to right tab content
const style = document.createElement('style');
style.innerHTML = `.right-tab-content > * { margin-bottom: 16px; } .right-tab-content > *:last-child { margin-bottom: 0; }`;
document.head.appendChild(style);

// --- Genre overlay for background ---
function ensureGenreOverlay() {
    let overlay = document.getElementById('genreOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'genreOverlay';
        overlay.className = 'genre-overlay';
        document.body.appendChild(overlay);
    }
    return overlay;
}

function updateGenreOverlay() {
    const overlay = ensureGenreOverlay();
    const genreColors = {
        ambient:   'rgba(70, 130, 180, 0.25)', // blue tint
        rock:      'rgba(180, 50, 50, 0.25)',  // red tint
        jazz:      'rgba(60, 120, 60, 0.25)',  // green tint
        classical: 'rgba(255, 255, 255, 0.15)', // white tint
        electronic:'rgba(120, 60, 180, 0.25)', // purple tint
        pop:       'rgba(255, 215, 0, 0.20)',  // gold tint
    };
    const genreFilters = {
        ambient:    'brightness(0.98) hue-rotate(15deg) saturate(1.1)',
        rock:       'brightness(0.92) contrast(1.05) hue-rotate(-5deg)',
        jazz:       'brightness(0.95) hue-rotate(25deg) saturate(1.15)',
        classical:  'brightness(1.02) grayscale(0.1) contrast(1.05)',
        electronic: 'brightness(0.97) saturate(1.3) hue-rotate(45deg)',
        pop:        'brightness(1.03) saturate(1.2) hue-rotate(5deg)',
    };
    overlay.style.background = genreColors[currentGenre] || 'rgba(0,0,0,0.1)';
    overlay.style.backdropFilter = genreFilters[currentGenre] || 'none';
    overlay.style.webkitBackdropFilter = overlay.style.backdropFilter;
}

// Ensure overlay is always present and updated on load
window.addEventListener('DOMContentLoaded', function() {
    ensureGenreOverlay();
    updateGenreOverlay();
});

function setBackground(bg) {
    document.body.setAttribute('data-background', bg);
    // Optionally persist in localStorage
    localStorage.setItem('selectedBackground', bg);
}

function toggleBackgroundSelector() {
    console.log('toggleBackgroundSelector called');
    try {
        const modal = document.getElementById('backgroundModal');
        if (modal) {
            modal.style.display = 'block';
        } else {
            console.error('Background modal not found');
        }
    } catch (error) {
        console.error('Error in toggleBackgroundSelector:', error);
        showNotification('Background selector error: ' + error.message, 'error');
    }
}

function closeBackgroundSelector() {
    const modal = document.getElementById('backgroundModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function selectBackground(bg) {
    setBackground(bg);
    // Close modal if needed
    const modal = document.getElementById('backgroundModal');
    if (modal) modal.style.display = 'none';
    updateGenreOverlay();
}

// On page load, set background from localStorage or default
window.addEventListener('DOMContentLoaded', function() {
    const savedBg = localStorage.getItem('selectedBackground') || 'default';
    setBackground(savedBg);
    updateGenreOverlay();
});

// Add missing shareRoomLink function
function shareRoomLink() {
    const roomId = new URLSearchParams(window.location.search).get('room');
    const roomLink = `${window.location.origin}/room?room=${roomId}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Join my music room!',
            text: 'Come play music with me in Dream App!',
            url: roomLink
        });
    } else {
        navigator.clipboard.writeText(roomLink).then(() => {
            showNotification('Room link copied to clipboard!', 'success');
        });
    }
}



// Add missing utility functions
function updatePerformanceStats() {
    // Update performance stats display
    const statsElement = document.getElementById('performanceStats');
    if (statsElement) {
        statsElement.innerHTML = `
            <div>Notes: ${performanceStats.notesPlayed}</div>
            <div>Accuracy: ${performanceStats.accuracy}%</div>
            <div>Timing: ${performanceStats.timing}%</div>
        `;
    }
}

function getNoteColor(username) {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#FFD93D'];
    const index = username.length % colors.length;
    return colors[index];
}

function requestLeaderboard() {
    if (socket && socket.connected) {
        socket.emit('request_leaderboard', {
            room_id: currentRoomId,
            username: currentUsername
        });
    }
}

// Add missing AI visualization functions
function updateAIVisualization(visualization) {
    const canvas = document.getElementById('aiVisualCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const time = Date.now() * 0.001;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    switch (visualization.type) {
        case 'waveform':
            drawAIWaveform(ctx, canvas.width, canvas.height, visualization.colors, time);
            break;
        case 'particles':
            drawAIParticles(ctx, canvas.width, canvas.height, visualization.colors, time);
            break;
        case 'geometric':
            drawAIGeometric(ctx, canvas.width, canvas.height, visualization.colors, time);
            break;
        case 'organic':
            drawAIOrganic(ctx, canvas.width, canvas.height, visualization.colors, time);
            break;
    }
}

function drawAIWaveform(ctx, width, height, colors, time) {
    const centerY = height / 2;
    
    colors.forEach((color, index) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        for (let x = 0; x < width; x++) {
            const y = centerY + Math.sin(x * 0.02 + time + index) * 30;
            if (x === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.stroke();
    });
}

function drawAIParticles(ctx, width, height, colors, time) {
    for (let i = 0; i < 50; i++) {
        const x = (Math.sin(time + i) * width / 2) + width / 2;
        const y = (Math.cos(time + i * 0.5) * height / 2) + height / 2;
        const color = colors[i % colors.length];
        
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawAIGeometric(ctx, width, height, colors, time) {
    const centerX = width / 2;
    const centerY = height / 2;
    
    colors.forEach((color, index) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const sides = 3 + index;
        const radius = 30 + index * 10;
        
        for (let i = 0; i < sides; i++) {
            const angle = (i / sides) * Math.PI * 2 + time;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.closePath();
        ctx.stroke();
    });
}

function drawAIOrganic(ctx, width, height, colors, time) {
    const centerX = width / 2;
    const centerY = height / 2;
    
    colors.forEach((color, index) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        
        for (let i = 0; i < 100; i++) {
            const angle = (i / 100) * Math.PI * 2;
            const radius = 20 + Math.sin(angle * 3 + time + index) * 10;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.closePath();
        ctx.stroke();
    });
}

// Add missing MIDI roll functions
function updateMidiRoll(note) {
    const canvas = document.getElementById('midiRollCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const time = Date.now();
    
    // Add note to roll
    const noteData = {
        note: note,
        time: time,
        duration: 500
    };
    
    drawMidiRoll();
}

function drawMidiRoll() {
    const canvas = document.getElementById('midiRollCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    for (let i = 0; i < canvas.width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
    }
    
    for (let i = 0; i < canvas.height; i += 20) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
    }
}



// Add missing replaySession function
function replaySession() {
    if (recordedNotes.length === 0) {
        showNotification('No session to replay', 'error');
        return;
    }
    
    isPlaying = true;
    let currentIndex = 0;
    
    function playNext() {
        if (currentIndex >= recordedNotes.length || !isPlaying) {
            isPlaying = false;
            return;
        }
        
        const note = recordedNotes[currentIndex];
        playPianoNote(note.note);
        
        currentIndex++;
        const nextNote = recordedNotes[currentIndex];
        if (nextNote) {
            const baseDelay = nextNote.timestamp - note.timestamp;
            const bpmFactor = 120 / currentBPM;
            const delay = baseDelay * bpmFactor;
            setTimeout(playNext, delay);
        } else {
            isPlaying = false;
        }
    }
    
    playNext();
}

// Additional global assignments for other functions
window.toggleRecording = toggleRecording;
window.showRecordingsModal = showRecordingsModal;
window.closeRecordingsModal = closeRecordingsModal;
window.toggleBackgroundSelector = toggleBackgroundSelector;
window.closeBackgroundSelector = closeBackgroundSelector;
window.showNotification = showNotification;
window.loadFamousSong = loadFamousSong;
window.loadSongByKey = loadSongByKey;
window.loadSongFromPlaylist = loadSongFromPlaylist;
window.playCurrentSong = playCurrentSong;
window.removeFromPlaylist = removeFromPlaylist;
window.addCurrentSongToPlaylist = addCurrentSongToPlaylist;
window.addSampleSongsToPlaylist = addSampleSongsToPlaylist;
window.clearPlaylist = clearPlaylist;
window.exportPlaylist = exportPlaylist;
window.generateChordProgression = generateChordProgression;
window.suggestChordsForKey = suggestChordsForKey;
window.analyzeCurrentMelody = analyzeCurrentMelody;
window.playChordProgression = playChordProgression;
window.addSampleSongsToPlaylist = addSampleSongsToPlaylist;
window.clearPlaylist = clearPlaylist;
window.addCurrentSongToPlaylist = addCurrentSongToPlaylist;
window.loadSongFromPlaylist = loadSongFromPlaylist;
window.removeFromPlaylist = removeFromPlaylist;
window.exportPlaylist = exportPlaylist;
window.generateSheetMusic = generateSheetMusic;
window.downloadSheetMusic = downloadSheetMusic;
window.exportAllRecordings = exportAllRecordings;
window.clearAllRecordings = clearAllRecordings;
window.downloadRecording = downloadRecording;
window.deleteRecording = deleteRecording;
window.sendChatMessage = sendChatMessage;
window.toggleSettings = toggleSettings;
window.closeSettings = closeSettings;
window.leaveRoom = leaveRoom;
window.requestAISuggestion = requestAISuggestion;
window.shareRoomLink = shareRoomLink;
window.downloadMIDI = downloadMIDI;
window.replaySession = replaySession;
window.updatePerformanceStats = updatePerformanceStats;
window.getNoteColor = getNoteColor;

window.joinVoiceCall = joinVoiceCall;
window.leaveVoiceCall = leaveVoiceCall;
window.toggleMute = toggleMute;
window.testVoiceCall = testVoiceCall;
window.testAudioPlayback = testAudioPlayback;
window.selectBackground = selectBackground;
window.handleNotePlayed = handleNotePlayed;
window.handleUserJoined = handleUserJoined;
window.handleUserLeft = handleUserLeft;
window.handleChatMessage = handleChatMessage;
window.handleAISuggestion = handleAISuggestion;
window.handleInstrumentChange = handleInstrumentChange;
window.showChatEmojiPicker = showChatEmojiPicker;
// insertEmoji already assigned at the top of the file
window.updateLeaderboard = updateLeaderboard;

console.log('All global function assignments completed');
