function sendMessage() {
    const input = document.getElementById('userInput');
    const message = input.value.trim();
    if (!message) return;

    const messages = document.getElementById('messages');
    const typingIndicator = document.getElementById('typing-indicator');

    const userMessage = `<div class="user-message"><b>You:</b> ${message}</div>`;
    messages.innerHTML += userMessage;
    input.value = '';

    typingIndicator.style.display = 'block';
    scrollToBottom();

    fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
    })
    .then(res => res.json())
    .then(data => {
        typingIndicator.style.display = 'none';
        const botMessage = `<div class="bot-message"><b>Bot:</b> ${data.reply}</div>`;
        messages.innerHTML += botMessage;
        scrollToBottom();
    });
}

window.onload = () => {
    const messages = document.getElementById('messages');
    const themeToggle = document.getElementById('toggle-dark');
    
    // Load chat history
    fetch('/history')
    .then(res => res.json())
    .then(chats => {
        messages.innerHTML = '';
        chats.reverse().forEach(chat => {
            const userMessage = `<div class="user-message"><b>You:</b> ${chat.userMessage}</div>`;
            const botMessage = `<div class="bot-message"><b>Bot:</b> ${chat.botResponse}</div>`;
            messages.innerHTML += userMessage + botMessage;
        });
        scrollToBottom();
    });

    // Apply saved theme
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('dark-mode');
    }

    // Theme toggle
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            localStorage.setItem('darkMode', document.body.classList.contains('dark-mode') ? 'enabled' : 'disabled');
        });
    }
};

function viewHistory() {
    fetch('/history')
    .then(res => res.json())
    .then(data => {
        const historyWindow = window.open('', 'Chat History', 'width=600,height=400');
        historyWindow.document.write('<html><head><title>Chat History</title></head><body>');
        historyWindow.document.write('<h2>Chat History</h2>');

        if (data.length === 0) {
            historyWindow.document.write('<p>No chat history available.</p>');
        } else {
            data.forEach(chat => {
                historyWindow.document.write(`<div><b>You:</b> ${chat.userMessage}</div>`);
                historyWindow.document.write(`<div><b>Bot:</b> ${chat.botResponse}</div><hr>`);
            });
        }

        historyWindow.document.write('</body></html>');
        historyWindow.document.close();
    })
    .catch(error => {
        console.error('Error fetching chat history:', error);
        alert('Error fetching chat history.');
    });
}

function deleteChatHistory() {
    if (confirm('Are you sure you want to delete all chat history?')) {
        fetch('/delete-history', {
            method: 'DELETE',
        })
        .then(res => res.json())
        .then(() => {
            alert('Chat history deleted successfully!');
            document.getElementById('messages').innerHTML = '';
        })
        .catch(error => {
            console.error('Error deleting chat history:', error);
            alert('Error deleting chat history.');
        });
    }
}

// ✅ Scroll to bottom smoothly
function scrollToBottom() {
    const messages = document.getElementById('messages');
    messages.scrollTo({ top: messages.scrollHeight, behavior: 'smooth' });
}
