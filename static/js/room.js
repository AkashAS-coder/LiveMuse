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
    initializeRoom();
    setupEventListeners();
    connectWebSocket();
    initializeAudio();
    initializeVisualization();
    addNewUIElements();
    renderPiano();
    updateUserInterface();

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
});

// Instrument management
function setInstrument(instrument) {
    if (INSTRUMENTS[instrument]) {
        currentInstrument = instrument;
        updateInstrumentUI();
        updateInstrument();
        
        // Send instrument change to server
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: 'instrument_change',
                instrument: instrument
            }));
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
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardInput);
    
    // Piano key events
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
}

// WebSocket connection
function connectWebSocket() {
    const roomId = new URLSearchParams(window.location.search).get('room');
    // Use secure WebSocket for HTTPS (production) and regular WebSocket for HTTP (development)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/${roomId}`;
    
    socket = new WebSocket(wsUrl);
    
    socket.onopen = function(event) {
        console.log('WebSocket connected');
        showNotification('Connected to room', 'success');
    };
    
    socket.onmessage = function(event) {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
    };
    
    socket.onclose = function(event) {
        console.log('WebSocket disconnected');
        showNotification('Disconnected from room', 'error');
    };
    
    socket.onerror = function(error) {
        console.error('WebSocket error:', error);
        showNotification('Connection error', 'error');
    };
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
        case 'ice_candidate':
            handleIceCandidate(data);
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
        case 'voice_participant_joined':
            addVoiceParticipant(data.username);
            break;
        case 'voice_participant_left':
            removeVoiceParticipant(data.username);
            break;
        case 'voice_mute_status':
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
    if (typeof Tone !== 'undefined') {
        synth = new Tone.Synth().toDestination();
        synth.set({ volume: currentVolume });
        updateInstrument();
        
        // Enable audio context on first user interaction
        document.addEventListener('click', function initAudio() {
            if (Tone.context.state !== 'running') {
                Tone.start();
            }
            document.removeEventListener('click', initAudio);
        });
    }
}

// Piano functions
function playNote(note, key) {
    if (synth && !isMuted) {
        synth.triggerAttack(note);
        
        // Visual feedback
        if (key) {
            key.classList.add('active');
        }
        
        // Send to server
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: 'note_played',
                note: note,
                instrument: currentInstrument,
                timestamp: Date.now()
            }));
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
    const pianoKeys = document.querySelector('.piano-keys');
    if (!pianoKeys) return;
    pianoKeys.innerHTML = '';
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
}

function playPianoNote(note, key) {
    if (synth && !isMuted) {
        synth.triggerAttack(note);
        
        // Visual feedback
        if (key) {
            key.classList.add('active');
        }
        
        // Send to server
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: 'note_played',
                note: note,
                instrument: currentInstrument,
                timestamp: Date.now()
            }));
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
        synth.triggerAttack(note);
        
        // Visual feedback
        const key = document.querySelector(`[data-note="${note}"]`);
        if (key) {
            key.classList.add('active');
        }
        
        // Send to server
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: 'note_played',
                note: note,
                instrument: currentInstrument,
                timestamp: Date.now()
            }));
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
    const participantsList = document.querySelector('.participants-list');
    if (!participantsList) return;
    participantsList.innerHTML = participants.map(participant => {
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
        <div class="message-reactions">
            ${Object.entries(reactions).map(([emoji, count]) => `
                <button class="reaction-btn reacted" onclick="addReaction('${messageId}', '${emoji}')">
                    ${emoji} ${count}
                </button>
            `).join('')}
            <button class="add-reaction-btn" onclick="showReactionPicker('${messageId}')">
                <i class="fas fa-plus"></i>
            </button>
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
    
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'chat_message',
            message: message
        }));
    }
}

// AI suggestion request
function requestAISuggestion() {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'request_ai_suggestion'
        }));
    }
}

// Track settings
function updateBPM() {
    const bpmSlider = document.getElementById('bpmSlider');
    const bpmValue = document.getElementById('bpmValue');
    
    if (bpmSlider && bpmValue) {
        currentBPM = parseInt(bpmSlider.value);
        bpmValue.textContent = currentBPM;
        
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: 'bpm_change',
                bpm: currentBPM
            }));
        }
    }
}

function updateKey() {
    const keySelect = document.getElementById('keySelect');
    if (keySelect) {
        currentKey = keySelect.value;
        
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: 'key_change',
                key: currentKey
            }));
        }
    }
}

function updateGenre() {
    const genreSelect = document.getElementById('genreSelect');
    if (genreSelect) {
        currentGenre = genreSelect.value;
        
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: 'genre_change',
                genre: currentGenre
            }));
        }
    }
}

function updateTrackSettings(settings) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'track_settings',
            settings: settings
        }));
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
    if (isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
}

function startRecording() {
    isRecording = true;
    recordedNotes = [];
    
    const recordBtn = document.querySelector('.recording-controls .btn-primary');
    if (recordBtn) {
        recordBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Recording';
        recordBtn.classList.remove('btn-primary');
        recordBtn.classList.add('btn-danger');
    }
    
    showNotification('Recording started', 'success');
}

function stopRecording() {
    isRecording = false;
    
    const recordBtn = document.querySelector('.recording-controls .btn-primary');
    const downloadBtn = document.querySelector('.recording-controls .btn-secondary');
    
    if (recordBtn) {
        recordBtn.innerHTML = '<i class="fas fa-circle"></i> Start Recording';
        recordBtn.classList.remove('btn-danger');
        recordBtn.classList.add('btn-primary');
    }
    
    if (downloadBtn) {
        downloadBtn.disabled = false;
    }
    
    showNotification('Recording stopped', 'info');
}

// MIDI roll visualization
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

// Session replay
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
            // Adjust delay based on BPM
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

// Room sharing
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

// Emoji reactions
function showEmojiPicker(input) {
    const emojis = ['🎵', '🎶', '🎹', '🎸', '🎻', '🥁', '👏', '❤️', '🔥', '✨'];
    const picker = document.createElement('div');
    picker.className = 'emoji-picker';
    picker.innerHTML = emojis.map(emoji => `
        <button class="emoji-btn" onclick="addReaction('${input.dataset.messageId}', '${emoji}')">
            ${emoji}
        </button>
    `).join('');
    
    input.parentNode.appendChild(picker);
    
    // Close picker when clicking outside
    document.addEventListener('click', function handler(ev) {
        if (!picker.contains(ev.target) && ev.target !== input) {
            picker.remove();
            document.removeEventListener('click', handler);
        }
    });
}

function addReaction(messageId, emoji) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'add_reaction',
            messageId: messageId,
            emoji: emoji
        }));
    }
}

function updateMessageReactions(messageId, reactions) {
    const message = document.querySelector(`[data-message-id="${messageId}"]`);
    if (!message) return;
    
    const reactionsContainer = message.querySelector('.message-reactions');
    if (reactionsContainer) {
        reactionsContainer.innerHTML = `
            ${Object.entries(reactions).map(([emoji, count]) => `
                <button class="reaction-btn reacted" onclick="addReaction('${messageId}', '${emoji}')">
                    ${emoji} ${count}
                </button>
            `).join('')}
            <button class="add-reaction-btn" onclick="showReactionPicker('${messageId}')">
                <i class="fas fa-plus"></i>
            </button>
        `;
    }
}

function showReactionPicker(messageId) {
    const emojis = ['🎵', '🎶', '🎹', '🎸', '🎻', '🥁', '👏', '❤️', '🔥', '✨'];
    const message = document.querySelector(`[data-message-id="${messageId}"]`);
    if (!message) return;
    
    const picker = document.createElement('div');
    picker.className = 'emoji-picker';
    picker.innerHTML = emojis.map(emoji => `
        <button class="emoji-btn" onclick="addReaction('${messageId}', '${emoji}')">
            ${emoji}
        </button>
    `).join('');
    
    message.appendChild(picker);
    
    // Close picker when clicking outside
    document.addEventListener('click', function handler(ev) {
        if (!picker.contains(ev.target) && !ev.target.classList.contains('add-reaction-btn')) {
            picker.remove();
            document.removeEventListener('click', handler);
        }
    });
}

// Leaderboard
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

function requestLeaderboard() {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'request_leaderboard'
        }));
    }
}

// AI Visualization
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

// Missing utility functions
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

// WebSocket message handlers
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
    addChatMessage(data.username, data.message, data.messageId, data.reactions || {});
}

function handleAISuggestion(data) {
    addAISuggestion(data.suggestion);
}

function handleInstrumentChange(data) {
    // Handle instrument change from other users
    showNotification(`${data.username} switched to ${data.instrument}`, 'info');
}

// Voice call functions (stubs)
function joinVoiceCall() {
    showNotification('Voice call feature not implemented yet', 'info');
}

function leaveVoiceCall() {
    showNotification('Voice call feature not implemented yet', 'info');
}

function toggleMute() {
    isMuted = !isMuted;
    showNotification(isMuted ? 'Muted' : 'Unmuted', 'info');
}

function addVoiceParticipant(username) {
    // Add voice participant to UI
}

function removeVoiceParticipant(username) {
    // Remove voice participant from UI
}

function updateVoiceMuteStatus(username, muted) {
    // Update voice mute status in UI
}

function updateParticipantInstrument(username, instrument) {
    // Update participant instrument in UI
}

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
function showRightTab(tab) {
    // Remove active from all buttons and contents
    document.querySelectorAll('.right-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.right-tab-content').forEach(content => content.style.display = 'none');
    // Add active to selected
    const btn = document.getElementById('tab-' + tab);
    const content = document.getElementById('right-tab-' + tab);
    if (btn) btn.classList.add('active');
    if (content) content.style.display = 'block';
}
// Set first tab active on load and hide others
window.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.right-tab-content').forEach((content, i) => {
        content.style.display = i === 0 ? 'block' : 'none';
    });
    showRightTab('chords');
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
    const modal = document.getElementById('backgroundModal');
    if (modal) {
        modal.style.display = 'block';
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

