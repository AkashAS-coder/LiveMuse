// LiveMuse Landing Page JavaScript

// Global variables
let currentUser = null;
let rooms = [];

// DOM Elements
const createRoomModal = document.getElementById('createRoomModal');
const joinRoomModal = document.getElementById('joinRoomModal');
const createRoomForm = document.getElementById('createRoomForm');
const joinRoomForm = document.getElementById('joinRoomForm');
const roomsGrid = document.getElementById('roomsGrid');

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    loadRooms();
    setupEventListeners();
    animateHero();
});

// Setup event listeners
function setupEventListeners() {
    // Create room form
    createRoomForm.addEventListener('submit', handleCreateRoom);
    
    // Join room form
    joinRoomForm.addEventListener('submit', handleJoinRoom);
    
    // Modal close events
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
}

// Modal functions
function openCreateRoomModal() {
    createRoomModal.classList.add('active');
    document.getElementById('roomName').focus();
}

function closeCreateRoomModal() {
    createRoomModal.classList.remove('active');
    createRoomForm.reset();
}

function openJoinRoomModal(roomId) {
    joinRoomModal.classList.add('active');
    joinRoomForm.dataset.roomId = roomId;
    document.getElementById('joinUsername').focus();
}

function closeJoinRoomModal() {
    joinRoomModal.classList.remove('active');
    joinRoomForm.reset();
    delete joinRoomForm.dataset.roomId;
}

function closeAllModals() {
    closeCreateRoomModal();
    closeJoinRoomModal();
}

// Handle create room form submission
async function handleCreateRoom(e) {
    e.preventDefault();
    
    const formData = new FormData(createRoomForm);
    const roomData = {
        name: formData.get('roomName'),
        creator: formData.get('creatorName')
    };
    
    try {
        const response = await fetch('/api/rooms', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(roomData)
        });
        
        if (response.ok) {
            const result = await response.json();
            closeCreateRoomModal();
            
            // Store user info for joining
            currentUser = {
                username: formData.get('creatorName'),
                instrument: formData.get('instrument')
            };
            
            // Redirect to the room
            window.location.href = `/room/${result.room_id}`;
        } else {
            throw new Error('Failed to create room');
        }
    } catch (error) {
        console.error('Error creating room:', error);
        showNotification('Failed to create room. Please try again.', 'error');
    }
}

// Handle join room form submission
async function handleJoinRoom(e) {
    e.preventDefault();
    
    const formData = new FormData(joinRoomForm);
    const roomId = joinRoomForm.dataset.roomId;
    
    if (!roomId) {
        showNotification('No room selected', 'error');
        return;
    }
    
    // Store user info for joining
    currentUser = {
        username: formData.get('joinUsername'),
        instrument: formData.get('joinInstrument')
    };
    
    // Redirect to the room
    window.location.href = `/room/${roomId}`;
}

// Load and display rooms
async function loadRooms() {
    try {
        showLoading();
        
        const response = await fetch('/api/rooms');
        if (response.ok) {
            rooms = await response.json();
            displayRooms();
        } else {
            throw new Error('Failed to load rooms');
        }
    } catch (error) {
        console.error('Error loading rooms:', error);
        showError('Failed to load rooms. Please refresh the page.');
    }
}

// Display rooms in the grid
function displayRooms() {
    if (rooms.length === 0) {
        roomsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-music"></i>
                <h3>No active jam sessions</h3>
                <p>Be the first to create a room and start jamming!</p>
                <button class="btn btn-primary" onclick="openCreateRoomModal()">
                    <i class="fas fa-plus"></i>
                    Create First Room
                </button>
            </div>
        `;
        return;
    }
    
    roomsGrid.innerHTML = rooms.map(room => `
        <div class="room-card fade-in" onclick="openJoinRoomModal('${room.id}')">
            <h3>${escapeHtml(room.name)}</h3>
            <div class="room-stats">
                <div class="room-stat">
                    <i class="fas fa-users"></i>
                    <span>${room.participant_count} participants</span>
                </div>
                <div class="room-stat">
                    <i class="fas fa-clock"></i>
                    <span>${formatTimeAgo(room.created_at)}</span>
                </div>
            </div>
            <div class="room-info">
                <p>Created by <strong>${escapeHtml(room.creator)}</strong></p>
            </div>
            <div class="room-actions">
                <button class="btn btn-primary" onclick="event.stopPropagation(); openJoinRoomModal('${room.id}')">
                    <i class="fas fa-sign-in-alt"></i>
                    Join Jam
                </button>
            </div>
        </div>
    `).join('');
}

// Refresh rooms
function refreshRooms() {
    loadRooms();
}

// Show loading state
function showLoading() {
    roomsGrid.innerHTML = `
        <div class="loading">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading active jam sessions...</p>
        </div>
    `;
}

// Show error state
function showError(message) {
    roomsGrid.innerHTML = `
        <div class="error-state">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Oops! Something went wrong</h3>
            <p>${message}</p>
            <button class="btn btn-primary" onclick="refreshRooms()">
                <i class="fas fa-sync-alt"></i>
                Try Again
            </button>
        </div>
    `;
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatTimeAgo(timestamp) {
    const now = new Date();
    const created = new Date(timestamp);
    const diffInMinutes = Math.floor((now - created) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Hero animation
function animateHero() {
    const waves = document.querySelectorAll('.wave');
    waves.forEach((wave, index) => {
        wave.style.animationDelay = `${index * 0.1}s`;
    });
}

// Add CSS for notifications
const notificationStyles = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        color: #333;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        max-width: 400px;
    }
    
    .notification-error {
        border-left: 4px solid #FF6B6B;
    }
    
    .notification-info {
        border-left: 4px solid #4ECDC4;
    }
    
    .notification button {
        background: none;
        border: none;
        cursor: pointer;
        color: #666;
        padding: 0;
        margin-left: auto;
    }
    
    .notification button:hover {
        color: #333;
    }
    
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .empty-state {
        text-align: center;
        color: rgba(255, 255, 255, 0.8);
        padding: 60px 20px;
        grid-column: 1 / -1;
    }
    
    .empty-state i {
        font-size: 3rem;
        color: #FFD700;
        margin-bottom: 20px;
        display: block;
    }
    
    .empty-state h3 {
        font-size: 1.5rem;
        margin-bottom: 10px;
        color: white;
    }
    
    .empty-state p {
        margin-bottom: 30px;
        font-size: 1.1rem;
    }
    
    .error-state {
        text-align: center;
        color: rgba(255, 255, 255, 0.8);
        padding: 60px 20px;
        grid-column: 1 / -1;
    }
    
    .error-state i {
        font-size: 3rem;
        color: #FF6B6B;
        margin-bottom: 20px;
        display: block;
    }
    
    .error-state h3 {
        font-size: 1.5rem;
        margin-bottom: 10px;
        color: white;
    }
    
    .error-state p {
        margin-bottom: 30px;
        font-size: 1.1rem;
    }
`;

// Inject notification styles
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);

// Auto-refresh rooms every 30 seconds
setInterval(refreshRooms, 30000); 