// Display Screen JavaScript for Secure Quiz
document.addEventListener('DOMContentLoaded', function() {
    const socket = io();
    
    // DOM Elements
    const pollStatusDisplay = document.getElementById('pollStatusDisplay');
    const pollQuestionDisplay = document.getElementById('pollQuestionDisplay');
    const pollResultsDisplay = document.getElementById('pollResultsDisplay');
    
    // State variables
    let currentPoll = null;
    
    // Load initial data
    loadPollState();
    
    socket.on('poll_started', function(data) {
        updatePollStatus('active');
        loadPollState();
    });
    
    socket.on('poll_stopped', function() {
        updatePollStatus('inactive');
        loadPollState();
    });
    
    socket.on('poll_reset', function() {
        updatePollStatus('inactive');
        loadPollState();
    });
    
    socket.on('vote_received', function(data) {
        updatePollResults(data.votes);
    });
    
    // Functions
    
    function loadPollState() {
        fetch('/api/poll')
            .then(response => response.json())
            .then(data => {
                currentPoll = data;
                updatePollDisplay(data);
            })
            .catch(error => {
                console.error('Error loading poll state:', error);
            });
    }
    
    
    
    function updatePollStatus(status) {
        pollStatusDisplay.textContent = `Poll: ${status.charAt(0).toUpperCase() + status.slice(1)}`;
        pollStatusDisplay.className = status === 'active' ? 'status-active' : 'status-inactive';
    }
    
    
    function updatePollDisplay(poll) {
        if (!poll || !poll.active) {
            updatePollStatus('inactive');
            pollQuestionDisplay.innerHTML = `
                <h3>No active poll</h3>
                <p>Waiting for administrator to start a poll...</p>
            `;
            pollResultsDisplay.style.display = 'none';
            return;
        }
        
        updatePollStatus('active');
        pollQuestionDisplay.innerHTML = `
            <h3>${poll.question}</h3>
            <p>Live voting in progress...</p>
        `;
        pollResultsDisplay.style.display = 'block';
        updatePollResults(poll.votes);
    }
    
    function updatePollResults(votes) {
        if (!votes) return;
        
        const totalVotes = Object.values(votes).reduce((sum, count) => sum + count, 0);
        
        Object.keys(votes).forEach(option => {
            const count = votes[option];
            const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
            
            const resultCard = document.querySelector(`.result-card[data-option="${option}"]`);
            if (resultCard) {
                const voteCountSpan = resultCard.querySelector('.vote-count');
                const progressFill = resultCard.querySelector('.progress-fill');
                const percentageSpan = resultCard.querySelector('.percentage');
                
                voteCountSpan.textContent = `${count} vote${count !== 1 ? 's' : ''}`;
                progressFill.style.width = `${percentage}%`;
                percentageSpan.textContent = `${percentage}%`;
                
                // Add animation for leading option
                if (totalVotes > 0) {
                    const isLeading = count === Math.max(...Object.values(votes));
                    resultCard.classList.toggle('leading', isLeading);
                }
            }
        });
    }
    
    
    // Auto-refresh functions
    setInterval(loadPollState, 2000);
    
    // Add visual effects for updates
    function addUpdateEffect(element) {
        element.style.animation = 'pulse 0.5s ease-in-out';
        setTimeout(() => {
            element.style.animation = '';
        }, 500);
    }
    
    // Enhanced visual feedback for real-time updates
    socket.on('buzz_received', function(data) {
        addUpdateEffect(currentWinnerDiv);
        // Add confetti effect for winner
        if (typeof confetti !== 'undefined') {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
    });
    
    socket.on('vote_received', function(data) {
        addUpdateEffect(pollResultsDisplay);
    });
    
    // Add CSS for leading option
    const style = document.createElement('style');
    style.textContent = `
        .result-card.leading {
            border: 2px solid #f39c12;
            box-shadow: 0 0 20px rgba(243, 156, 18, 0.3);
        }
        
        .team-card.winner {
            animation: bounce 1s ease-in-out;
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        
        .status-active {
            color: #27ae60 !important;
        }
        
        .status-stopped {
            color: #e74c3c !important;
        }
        
        .status-inactive {
            color: #95a5a6 !important;
        }
    `;
    document.head.appendChild(style);
    
    // Add fullscreen toggle
    document.addEventListener('keydown', function(event) {
        if (event.key === 'F11') {
            event.preventDefault();
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        }
    });
    
    // Add click to fullscreen
    document.addEventListener('click', function(event) {
        if (event.target === document.body || event.target.classList.contains('container')) {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
            }
        }
    });
    
    // Add auto-refresh indicator
    const refreshIndicator = document.createElement('div');
    refreshIndicator.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 5px 10px;
        border-radius: 5px;
        font-size: 12px;
        z-index: 1000;
    `;
    refreshIndicator.textContent = 'Live';
    document.body.appendChild(refreshIndicator);
    
    // Update refresh indicator
    setInterval(() => {
        refreshIndicator.style.opacity = '0.5';
        setTimeout(() => {
            refreshIndicator.style.opacity = '1';
        }, 100);
    }, 2000);
});
