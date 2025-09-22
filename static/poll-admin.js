// Poll Admin JavaScript for Secure Quiz
document.addEventListener('DOMContentLoaded', function() {
    const socket = io();
    
    // DOM Elements
    const pollQuestionInput = document.getElementById('pollQuestionInput');
    const startPollBtn = document.getElementById('startPollBtn');
    const stopPollBtn = document.getElementById('stopPollBtn');
    const resetPollBtn = document.getElementById('resetPollBtn');
    const pollStatusText = document.getElementById('pollStatusText');
    const resultsDisplay = document.getElementById('resultsDisplay');
    const statsContainer = document.getElementById('statsContainer');
    const totalVotesSpan = document.getElementById('totalVotes');
    const leadingOptionSpan = document.getElementById('leadingOption');
    const voteRateSpan = document.getElementById('voteRate');
    
    // State variables
    let currentPoll = null;
    let voteHistory = [];
    let lastVoteTime = Date.now();
    
    // Load initial poll state
    loadPollState();
    
    // Socket.IO event listeners
    socket.on('poll_started', function(data) {
        currentPoll = data;
        updatePollStatus('active');
        updatePollButtons(true);
        showMessage('Poll started successfully!', 'success');
        loadPollState();
    });
    
    socket.on('poll_stopped', function() {
        updatePollStatus('inactive');
        updatePollButtons(false);
        showMessage('Poll stopped successfully!', 'info');
        loadPollState();
    });
    
    socket.on('poll_reset', function() {
        currentPoll = null;
        updatePollStatus('inactive');
        updatePollButtons(false);
        pollQuestionInput.value = '';
        voteHistory = [];
        showMessage('Poll reset successfully!', 'success');
        loadPollState();
    });
    
    socket.on('vote_received', function(data) {
        updateResults(data.votes);
        updateStatistics(data.votes);
        recordVote();
    });
    
    // Event listeners
    startPollBtn.addEventListener('click', startPoll);
    stopPollBtn.addEventListener('click', stopPoll);
    resetPollBtn.addEventListener('click', resetPoll);
    
    // Functions
    function loadPollState() {
        fetch('/api/poll')
            .then(response => response.json())
            .then(data => {
                currentPoll = data;
                updatePollDisplay(data);
                updatePollButtons(data.active);
                updatePollStatus(data.active ? 'active' : 'inactive');
            })
            .catch(error => {
                console.error('Error loading poll state:', error);
                showMessage('Error loading poll state', 'error');
            });
    }
    
    function updatePollDisplay(poll) {
        if (!poll || !poll.active) {
            resultsDisplay.innerHTML = `
                <div class="no-results">
                    <p>No active poll</p>
                    <p>Start a poll to see live results</p>
                </div>
            `;
            updateStatistics({});
            return;
        }
        
        if (poll.question) {
            pollQuestionInput.value = poll.question;
        }
        
        updateResults(poll.votes);
        updateStatistics(poll.votes);
    }
    
    function updatePollStatus(status) {
        pollStatusText.textContent = `Poll: ${status.charAt(0).toUpperCase() + status.slice(1)}`;
        pollStatusText.className = status === 'active' ? 'status-active' : 'status-inactive';
    }
    
    function updatePollButtons(active) {
        if (active) {
            startPollBtn.disabled = true;
            stopPollBtn.disabled = false;
            resetPollBtn.disabled = false;
            pollQuestionInput.disabled = true;
        } else {
            startPollBtn.disabled = false;
            stopPollBtn.disabled = true;
            resetPollBtn.disabled = false;
            pollQuestionInput.disabled = false;
        }
    }
    
    function startPoll() {
        const question = pollQuestionInput.value.trim() || 'Quick Poll';
        
        fetch('/api/poll', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ question })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showMessage('Poll started!', 'success');
            } else {
                showMessage('Error starting poll', 'error');
            }
        })
        .catch(error => {
            console.error('Error starting poll:', error);
            showMessage('Error starting poll', 'error');
        });
    }
    
    function stopPoll() {
        fetch('/api/poll/stop', { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showMessage('Poll stopped!', 'info');
                } else {
                    showMessage('Error stopping poll', 'error');
                }
            })
            .catch(error => {
                console.error('Error stopping poll:', error);
                showMessage('Error stopping poll', 'error');
            });
    }
    
    function resetPoll() {
        if (confirm('Are you sure you want to reset the poll? This will clear all votes and data.')) {
            fetch('/api/poll/reset', { method: 'POST' })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        showMessage('Poll reset!', 'success');
                    } else {
                        showMessage('Error resetting poll', 'error');
                    }
                })
                .catch(error => {
                    console.error('Error resetting poll:', error);
                    showMessage('Error resetting poll', 'error');
                });
        }
    }
    
    function updateResults(votes) {
        if (!votes) return;
        
        const totalVotes = Object.values(votes).reduce((sum, count) => sum + count, 0);
        
        if (totalVotes === 0) {
            resultsDisplay.innerHTML = `
                <div class="no-results">
                    <p>No votes yet</p>
                    <p>Waiting for audience to vote...</p>
                </div>
            `;
            return;
        }
        
        const resultsHtml = Object.keys(votes).map(option => {
            const count = votes[option];
            const percentage = Math.round((count / totalVotes) * 100);
            const isLeading = count === Math.max(...Object.values(votes));
            
            return `
                <div class="result-item ${isLeading ? 'leading' : ''}" data-option="${option}">
                    <div class="result-label">
                        <span class="option-letter">${option}</span>
                        <span class="vote-count">${count} vote${count !== 1 ? 's' : ''}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percentage}%"></div>
                    </div>
                    <span class="percentage">${percentage}%</span>
                </div>
            `;
        }).join('');
        
        resultsDisplay.innerHTML = resultsHtml;
    }
    
    function updateStatistics(votes) {
        if (!votes) return;
        
        const totalVotes = Object.values(votes).reduce((sum, count) => sum + count, 0);
        const leadingOption = totalVotes > 0 ? 
            Object.keys(votes).reduce((a, b) => votes[a] > votes[b] ? a : b) : '-';
        
        totalVotesSpan.textContent = totalVotes;
        leadingOptionSpan.textContent = leadingOption;
        
        // Calculate vote rate (votes per minute)
        const now = Date.now();
        const timeDiff = (now - lastVoteTime) / 1000 / 60; // minutes
        const recentVotes = voteHistory.filter(time => now - time < 60000).length; // last minute
        const voteRate = timeDiff > 0 ? Math.round(recentVotes / timeDiff) : 0;
        
        voteRateSpan.textContent = `${voteRate}/min`;
    }
    
    function recordVote() {
        const now = Date.now();
        voteHistory.push(now);
        
        // Keep only votes from last 5 minutes
        voteHistory = voteHistory.filter(time => now - time < 300000);
        
        lastVoteTime = now;
    }
    
    function showMessage(message, type) {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.message');
        existingMessages.forEach(msg => msg.remove());
        
        // Create new message
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        
        // Insert at the top of the container
        const container = document.querySelector('.container');
        container.insertBefore(messageDiv, container.firstChild);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }
    
    // Auto-refresh poll state every 2 seconds
    setInterval(loadPollState, 2000);
    
    // Add CSS for enhanced visual effects
    const style = document.createElement('style');
    style.textContent = `
        .result-item.leading {
            border: 2px solid #f39c12;
            box-shadow: 0 0 20px rgba(243, 156, 18, 0.3);
            animation: pulse 0.5s ease-in-out;
        }
        
        .status-active {
            color: #27ae60 !important;
        }
        
        .status-inactive {
            color: #95a5a6 !important;
        }
        
        .stat-item {
            transition: all 0.3s ease;
        }
        
        .stat-item:hover {
            transform: translateX(5px);
            background: rgba(52, 152, 219, 0.2);
        }
        
        .results-display {
            position: relative;
            overflow: hidden;
        }
        
        .results-display::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(52, 152, 219, 0.1), transparent);
            transition: left 0.8s;
        }
        
        .results-display:hover::before {
            left: 100%;
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.02); }
            100% { transform: scale(1); }
        }
        
        .no-results {
            text-align: center;
            padding: 40px;
            color: #7f8c8d;
            font-style: italic;
        }
        
        .no-results p {
            margin-bottom: 10px;
        }
    `;
    document.head.appendChild(style);
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', function(event) {
        if (event.ctrlKey || event.metaKey) {
            switch(event.key) {
                case 's':
                    event.preventDefault();
                    if (!startPollBtn.disabled) {
                        startPoll();
                    }
                    break;
                case 't':
                    event.preventDefault();
                    if (!stopPollBtn.disabled) {
                        stopPoll();
                    }
                    break;
                case 'r':
                    event.preventDefault();
                    if (!resetPollBtn.disabled) {
                        resetPoll();
                    }
                    break;
            }
        }
    });
    
    // Add visual feedback for button interactions
    [startPollBtn, stopPollBtn, resetPollBtn].forEach(btn => {
        btn.addEventListener('mousedown', function() {
            this.style.transform = 'scale(0.95)';
        });
        
        btn.addEventListener('mouseup', function() {
            this.style.transform = 'scale(1)';
        });
        
        btn.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });
});
