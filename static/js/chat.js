// ✅ Server-side chat — Groq API key is on the server, NOT in the browser

let conversationHistory = [];
let isWaiting = false;

window.addEventListener('DOMContentLoaded', () => {
  // Remove old client-side key if any user had it stored
  localStorage.removeItem('mindease_groq_key');

  fetch('/chat/status')
    .then(r => r.json())
    .then(data => {
      if (!data.configured) {
        showSystemMessage("⚠️ AI Chat is not configured yet. Please check back later.");
      }
    })
    .catch(() => {});
});

function getTime() {
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function showSystemMessage(text) {
  const messagesDiv = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'msg bot';
  div.innerHTML = `<div class="msg-bubble" style="opacity:0.65;font-size:0.85rem;">${text}</div>`;
  messagesDiv.appendChild(div);
}

function appendMessage(role, text) {
  const messagesDiv = document.getElementById('chat-messages');
  const starters    = document.getElementById('quick-starters');
  if (starters && role === 'user') starters.remove();

  const msgDiv = document.createElement('div');
  msgDiv.className = `msg ${role === 'user' ? 'user' : 'bot'}`;
  msgDiv.innerHTML = `
    <div class="msg-bubble">${text.replace(/\n/g, '<br>')}</div>
    <div class="msg-time">${getTime()}</div>
  `;
  messagesDiv.appendChild(msgDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function showTyping() {
  const messagesDiv = document.getElementById('chat-messages');
  const typing = document.createElement('div');
  typing.className = 'msg bot typing-indicator';
  typing.id        = 'typing';
  typing.innerHTML = `<div class="msg-bubble"><span></span><span></span><span></span></div>`;
  messagesDiv.appendChild(typing);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function removeTyping() {
  const t = document.getElementById('typing');
  if (t) t.remove();
}

async function sendMessage() {
  if (isWaiting) return;
  const input = document.getElementById('chat-input');
  const text  = input.value.trim();
  if (!text) return;

  input.value = '';
  input.style.height = 'auto';
  appendMessage('user', text);
  conversationHistory.push({ role: 'user', content: text });

  isWaiting = true;
  document.getElementById('send-btn').disabled = true;
  showTyping();

  try {
    // ✅ Calls our Flask backend — not Groq directly
    const response = await fetch('/chat/message', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ messages: conversationHistory })
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      throw new Error(data.error || `Server error ${response.status}`);
    }

    conversationHistory.push({ role: 'assistant', content: data.reply });
    removeTyping();
    appendMessage('bot', data.reply);

  } catch (err) {
    removeTyping();
    appendMessage('bot', `Hmm, something went wrong. Please try again. (${err.message})`);
    conversationHistory.pop(); // remove failed user message from history
  }

  isWaiting = false;
  document.getElementById('send-btn').disabled = false;
  input.focus();
}

function quickSend(el, message) {
  document.getElementById('chat-input').value = message;
  sendMessage();
}

function handleKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

function autoResize(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, 140) + 'px';
}

function clearChat() {
  if (!confirm('Clear chat history?')) return;
  conversationHistory = [];
  const msgs = document.getElementById('chat-messages');
  msgs.innerHTML = `
    <div class="msg bot">
      <div class="msg-bubble">Chat cleared! Fresh start 😊 What's on your mind?</div>
      <div class="msg-time">${getTime()}</div>
    </div>
  `;
}
