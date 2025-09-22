// Admin Panel JavaScript for Secure Quiz
document.addEventListener('DOMContentLoaded', function() {
    const socket = io();
    
    // DOM Elements
    const pollQuestionInput = document.getElementById('pollQuestion');
    const startPollBtn = document.getElementById('startPoll');
    const stopPollBtn = document.getElementById('stopPoll');
    const resetPollBtn = document.getElementById('resetPoll');
    const pollStatusSpan = document.getElementById('pollStatus');
    
    // Load initial data
    loadPollState();
    
    socket.on('poll_started', function(data) {
        updatePollStatus('active');
        showMessage('Poll started successfully!', 'success');
        loadPollState();
    });
    
    socket.on('poll_stopped', function() {
        updatePollStatus('inactive');
        showMessage('Poll stopped successfully!', 'info');
        loadPollState();
    });
    
    socket.on('poll_reset', function() {
        updatePollStatus('inactive');
        pollQuestionInput.value = '';
        showMessage('Poll reset successfully!', 'success');
        loadPollState();
    });
    
    socket.on('vote_received', function(data) {
        loadPollState();
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
                updatePollStatus(data.active ? 'active' : 'inactive');
                updatePollButtons(data.active);
                if (data.active && data.question) {
                    pollQuestionInput.value = data.question;
                }
            })
            .catch(error => {
                console.error('Error loading poll state:', error);
            });
    }
    
    function updatePollStatus(status) {
        pollStatusSpan.textContent = `Poll: ${status.charAt(0).toUpperCase() + status.slice(1)}`;
        pollStatusSpan.className = status === 'active' ? 'status-active' : 'status-inactive';
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
});
