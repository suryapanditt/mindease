from flask import Blueprint, request, jsonify

chat_bp = Blueprint('chat', __name__)

# NOTE: AI Chat is handled client-side in static/js/chat.js
# The browser calls Groq API directly using the user's own API key.
# This backend route is intentionally a placeholder.
# To add server-side chat (hides API key from browser), implement proxy here.

@chat_bp.route('/chat/status', methods=['GET'])
def chat_status():
    return jsonify({
        "status": "client_side",
        "message": "Chat is handled client-side via Groq API. See static/js/chat.js"
    })
