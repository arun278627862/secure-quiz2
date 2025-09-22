// Poll Page JavaScript for Secure Quiz
document.addEventListener('DOMContentLoaded', function() {
    const socket = io();
    
    // Prevent scrolling on touch events for the entire page
    document.addEventListener('touchstart', function(e) {
        if (e.target.closest('.poll-option')) {
            e.preventDefault();
        }
    }, { passive: false });
    
    document.addEventListener('touchmove', function(e) {
        if (e.target.closest('.poll-option')) {
            e.preventDefault();
        }
    }, { passive: false });
    
    // DOM Elements
    const pollQuestionDiv = document.getElementById('pollQuestion');
    const pollOptionsDiv = document.getElementById('pollOptions');
    const pollResultsDiv = document.getElementById('pollResults');
    const voteStatusDiv = document.getElementById('voteStatus');
    const pollOptionButtons = document.querySelectorAll('.poll-option');
    
    // Device ID for tracking votes
    let deviceId = generateDeviceId();
    let hasVoted = false;
    let currentPoll = null;
    
    // Load initial poll state
    loadPollState();
    
    // Socket.IO event listeners
    socket.on('poll_started', function(data) {
        currentPoll = data;
        updatePollDisplay(data);
        showMessage('New poll started!', 'info');
    });
    
    socket.on('poll_stopped', function() {
        currentPoll = null;
        updatePollDisplay(null);
        showMessage('Poll ended', 'info');
    });
    
    socket.on('poll_reset', function() {
        currentPoll = null;
        hasVoted = false;
        updatePollDisplay(null);
        showMessage('Poll reset', 'info');
    });
    
    socket.on('vote_received', function(data) {
        updateResults(data.votes);
    });
    
    // Event listeners for poll options
    pollOptionButtons.forEach(button => {
        // Click event for desktop
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (!hasVoted && currentPoll && currentPoll.active) {
                const option = this.dataset.option;
                submitVote(option);
            }
        });
        
        // Touch event for mobile
        button.addEventListener('touchend', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (!hasVoted && currentPoll && currentPoll.active) {
                const option = this.dataset.option;
                submitVote(option);
            }
        });
        
        // Prevent scroll on touch start
        button.addEventListener('touchstart', function(e) {
            e.preventDefault();
            e.stopPropagation();
        });
    });
    
    // Functions
    function generateDeviceId() {
        // Generate a unique device ID based on browser fingerprint
        let deviceId = localStorage.getItem('secureQuizDeviceId');
        if (!deviceId) {
            deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('secureQuizDeviceId', deviceId);
        }
        return deviceId;
    }
    
    function loadPollState() {
        fetch('/api/poll')
            .then(response => response.json())
            .then(data => {
                currentPoll = data;
                updatePollDisplay(data);
            })
            .catch(error => {
                console.error('Error loading poll state:', error);
                showMessage('Error loading poll', 'error');
            });
    }
    
    function updatePollDisplay(poll) {
        if (!poll || !poll.active) {
            // No active poll
            pollQuestionDiv.innerHTML = `
                <h2>No active poll</h2>
                <p>Waiting for administrator to start a poll...</p>
            `;
            pollOptionsDiv.style.display = 'none';
            pollResultsDiv.style.display = 'none';
            voteStatusDiv.innerHTML = '<p>Ready to vote</p>';
            hasVoted = false;
            resetPollButtons();
            return;
        }
        
        // Active poll
        pollQuestionDiv.innerHTML = `
            <h2>${poll.question}</h2>
            <p>Select your answer below:</p>
        `;
        
        // Check if this device has already voted
        if (poll.voted_devices && poll.voted_devices.includes(deviceId)) {
            hasVoted = true;
            pollOptionsDiv.style.display = 'none';
            pollResultsDiv.style.display = 'block';
            voteStatusDiv.innerHTML = '<p>✅ You have already voted!</p>';
            updateResults(poll.votes);
        } else {
            hasVoted = false;
            pollOptionsDiv.style.display = 'grid';
            pollResultsDiv.style.display = 'block';
            voteStatusDiv.innerHTML = '<p>Ready to vote</p>';
            updateResults(poll.votes);
            resetPollButtons();
        }
    }
    
    function resetPollButtons() {
        pollOptionButtons.forEach(button => {
            button.classList.remove('voted', 'disabled');
            button.disabled = false;
        });
    }
    
    function submitVote(option) {
        if (hasVoted) {
            showMessage('You have already voted!', 'error');
            return;
        }
        
        // Disable all buttons immediately
        pollOptionButtons.forEach(button => {
            button.disabled = true;
            button.classList.add('disabled');
        });
        
        // Mark the selected option
        const selectedButton = document.querySelector(`[data-option="${option}"]`);
        selectedButton.classList.add('voted');
        
        // Submit vote
        fetch('/api/poll/vote', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                device_id: deviceId,
                option: option
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                hasVoted = true;
                voteStatusDiv.innerHTML = '<p>✅ Vote submitted successfully!</p>';
                showMessage('Vote submitted!', 'success');
            } else {
                showMessage(data.error || 'Error submitting vote', 'error');
                // Re-enable buttons on error
                pollOptionButtons.forEach(button => {
                    button.disabled = false;
                    button.classList.remove('disabled');
                });
                selectedButton.classList.remove('voted');
            }
        })
        .catch(error => {
            console.error('Error submitting vote:', error);
            showMessage('Error submitting vote', 'error');
            // Re-enable buttons on error
            pollOptionButtons.forEach(button => {
                button.disabled = false;
                button.classList.remove('disabled');
            });
            selectedButton.classList.remove('voted');
        });
    }
    
    function updateResults(votes) {
        if (!votes) return;
        
        const totalVotes = Object.values(votes).reduce((sum, count) => sum + count, 0);
        
        // Update each option
        Object.keys(votes).forEach(option => {
            const count = votes[option];
            const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
            
            // Update result item
            const resultItem = document.querySelector(`.result-item[data-option="${option}"]`);
            if (resultItem) {
                const voteCountSpan = resultItem.querySelector('.vote-count');
                const progressFill = resultItem.querySelector('.progress-fill');
                const percentageSpan = resultItem.querySelector('.percentage');
                
                voteCountSpan.textContent = `${count} vote${count !== 1 ? 's' : ''}`;
                progressFill.style.width = `${percentage}%`;
                percentageSpan.textContent = `${percentage}%`;
            }
            
            // Update result card (for display page)
            const resultCard = document.querySelector(`.result-card[data-option="${option}"]`);
            if (resultCard) {
                const voteCountSpan = resultCard.querySelector('.vote-count');
                const progressFill = resultCard.querySelector('.progress-fill');
                const percentageSpan = resultCard.querySelector('.percentage');
                
                voteCountSpan.textContent = `${count} vote${count !== 1 ? 's' : ''}`;
                progressFill.style.width = `${percentage}%`;
                percentageSpan.textContent = `${percentage}%`;
            }
        });
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
    
    // Add visual feedback for button clicks
    pollOptionButtons.forEach(button => {
        button.addEventListener('mousedown', function() {
            this.style.transform = 'scale(0.95)';
        });
        
        button.addEventListener('mouseup', function() {
            this.style.transform = 'scale(1)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });
    
    // Add keyboard support
    document.addEventListener('keydown', function(event) {
        if (!hasVoted && currentPoll && currentPoll.active) {
            const key = event.key.toUpperCase();
            if (['A', 'B', 'C', 'D'].includes(key)) {
                const button = document.querySelector(`[data-option="${key}"]`);
                if (button && !button.disabled) {
                    button.click();
                }
            }
        }
    });
    
    // Add visual feedback for mobile touch
    pollOptionButtons.forEach(button => {
        button.addEventListener('touchstart', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.style.transform = 'scale(0.95)';
        });
        
        button.addEventListener('touchend', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.style.transform = 'scale(1)';
        });
        
        button.addEventListener('touchcancel', function(e) {
            e.preventDefault();
            e.stopPropagation();
            this.style.transform = 'scale(1)';
        });
    });
});
