const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

// Send message on button click
sendButton.addEventListener('click', sendMessage);

// Send message on Enter (Shift+Enter for new line)
userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

async function sendMessage() {
    const message = userInput.value.trim();

    if (!message) return;

    // Disable input while processing
    userInput.disabled = true;
    sendButton.disabled = true;

    // Add user message to chat
    addMessage(message, 'user');
    userInput.value = '';

    // Show loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message bot-message';
    loadingDiv.innerHTML = '<div class="message-content loading">Thinking</div>';
    chatMessages.appendChild(loadingDiv);
    scrollToBottom();

    try {
        // Send request to backend
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message }),
        });

        const data = await response.json();

        // Remove loading indicator
        loadingDiv.remove();

        if (response.ok) {
            // Add bot response to chat
            addMessage(data.response, 'bot');
        } else {
            addMessage(`Error: ${data.error}`, 'bot');
        }
    } catch (error) {
        loadingDiv.remove();
        addMessage('Failed to connect to server. Please try again.', 'bot');
        console.error('Error:', error);
    }

    // Re-enable input
    userInput.disabled = false;
    sendButton.disabled = false;
    userInput.focus();
}

function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    if (sender === 'bot') {
        contentDiv.innerHTML = `<strong>Gemini:</strong> ${text}`;
    } else {
        contentDiv.innerHTML = `<strong>You:</strong> ${text}`;
    }

    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}
