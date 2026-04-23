
const SYSTEM_PROMPT = `You are MindEase, a compassionate AI mental wellness companion designed specifically for college students in India, particularly those studying at engineering colleges like GLA University.

Your role:
- Provide emotional support, empathy, and a non-judgmental space for students to share their feelings
- Help students dealing with exam stress, placement anxiety, academic pressure, hostel life, family expectations, and peer pressure
- Suggest practical coping strategies like breathing exercises, journaling, Pomodoro technique, sleep hygiene
- Encourage students to seek professional help when needed (college counsellor, iCall: 9152987821, Vandrevala Foundation: 1860-2662-345)

Your personality:
- Warm, friendly, and empathetic — like a caring senior who "gets it"
- Use simple, clear English (students are comfortable with Indian English style)
- Occasionally use gentle humor to lighten the mood, but never minimize their feelings
- Never diagnose mental health conditions
- Always validate feelings before giving advice
- Keep responses concise (2-5 sentences max per message) unless they ask for more detail

Boundaries:
- If a student expresses thoughts of self-harm or suicide, immediately and gently direct them to call iCall (9152987821) and encourage them to talk to someone in person
- You are NOT a replacement for professional therapy
- Always end with something warm and encouraging`;

let conversationHistory = [];
let apiKey = '';
let isWaiting = false;

window.addEventListener('DOMContentLoaded', () => {
  apiKey = localStorage.getItem('mindease_groq_key') || '';
  if (apiKey) {
    document.getElementById('config-modal').style.display = 'none';
  }
});

function saveApiKey() {
  const input = document.getElementById('api-key-input').value.trim();
  if (!input.startsWith('gsk_')) {
    alert('Please enter a valid Groq API key (starts with gsk_...)');
    return;
  }
  apiKey = input;
  localStorage.setItem('mindease_groq_key', apiKey);
  document.getElementById('config-modal').style.display = 'none';
}

function getTime() {
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function appendMessage(role, text) {
  const messagesDiv = document.getElementById('chat-messages');

  const starters = document.getElementById('quick-starters');
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
  typing.id = 'typing';
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
  const text = input.value.trim();
  if (!text) return;

  if (!apiKey) {
    document.getElementById('config-modal').style.display = 'flex';
    return;
  }

  input.value = '';
  input.style.height = 'auto';
  appendMessage('user', text);

  conversationHistory.push({ role: 'user', content: text });

  isWaiting = true;
  document.getElementById('send-btn').disabled = true;
  showTyping();

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 512,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...conversationHistory
        ]
      })
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    const reply = data.choices[0].message.content;
    conversationHistory.push({ role: 'assistant', content: reply });

    removeTyping();
    appendMessage('bot', reply);

  } catch (err) {
    removeTyping();
    appendMessage('bot', `Hmm, something went wrong. Please check your API key or internet connection. Error: ${err.message}`);
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
      <div class="msg-bubble">
        Chat cleared! Fresh start 😊 I'm still here — what's on your mind?
      </div>
      <div class="msg-time">${getTime()}</div>
    </div>
  `;
}

function resetApiKey() {
  localStorage.removeItem('mindease_groq_key');
  location.reload();
}
