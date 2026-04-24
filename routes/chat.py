from flask import Blueprint, request, jsonify
import os
import requests

chat_bp = Blueprint('chat', __name__)

GROQ_API_KEY = os.getenv('GROQ_API_KEY', '')
GROQ_URL     = 'https://api.groq.com/openai/v1/chat/completions'

SYSTEM_PROMPT = """You are MindEase, a compassionate AI mental wellness companion designed specifically for college students in India, particularly those studying at engineering colleges like GLA University.

Your role:
- Provide emotional support, empathy, and a non-judgmental space for students to share their feelings
- Help students dealing with exam stress, placement anxiety, academic pressure, hostel life, family expectations, and peer pressure
- Suggest practical coping strategies like breathing exercises, journaling, Pomodoro technique, sleep hygiene
- Encourage students to seek professional help when needed (college counsellor, iCall: 9152987821, Vandrevala Foundation: 1860-2662-345)

Your personality:
- Warm, friendly, and empathetic — like a caring senior who gets it
- Use simple, clear English (students are comfortable with Indian English style)
- Occasionally use gentle humor to lighten the mood, but never minimize their feelings
- Never diagnose mental health conditions
- Always validate feelings before giving advice
- Keep responses concise (2-5 sentences max per message) unless they ask for more detail

Boundaries:
- If a student expresses thoughts of self-harm or suicide, immediately and gently direct them to call iCall (9152987821)
- You are NOT a replacement for professional therapy
- Always end with something warm and encouraging"""


@chat_bp.route('/chat/message', methods=['POST'])
def chat_message():
    if not GROQ_API_KEY:
        return jsonify({"error": "Chat not configured. GROQ_API_KEY missing on server."}), 503

    data = request.get_json()
    if not data or 'messages' not in data:
        return jsonify({"error": "Invalid request. 'messages' field required."}), 400

    user_messages = data['messages'][-20:]  # cap history to last 20

    try:
        resp = requests.post(
            GROQ_URL,
            headers={
                'Authorization': f'Bearer {GROQ_API_KEY}',
                'Content-Type':  'application/json'
            },
            json={
                'model':      'llama-3.1-8b-instant',
                'max_tokens': 512,
                'messages':   [{'role': 'system', 'content': SYSTEM_PROMPT}] + user_messages
            },
            timeout=30
        )
        resp.raise_for_status()
        reply = resp.json()['choices'][0]['message']['content']
        return jsonify({"reply": reply})

    except requests.exceptions.Timeout:
        return jsonify({"error": "Request timed out. Please try again."}), 504
    except requests.exceptions.HTTPError as e:
        return jsonify({"error": f"Groq API error: {str(e)}"}), 502
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@chat_bp.route('/chat/status', methods=['GET'])
def chat_status():
    configured = bool(GROQ_API_KEY)
    return jsonify({
        "status":     "server_side",
        "configured": configured,
        "message":    "Chat proxy ready." if configured else "GROQ_API_KEY not set."
    })
