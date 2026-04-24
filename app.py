from flask import Flask, render_template, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from dotenv import load_dotenv
from routes.predict   import predict_bp
from routes.chat      import chat_bp
from routes.community import community_bp
from routes.analytics import analytics_bp
import os

load_dotenv()


def check_env():
    warnings = []
    if not os.getenv('MONGO_URI'):
        warnings.append('MONGO_URI  → data will NOT persist across restarts')
    if not os.getenv('GROQ_API_KEY'):
        warnings.append('GROQ_API_KEY  → AI chat will be disabled')
    if warnings:
        print("\n⚠️  Missing environment variables:")
        for w in warnings:
            print(f"   • {w}")
        print("   Add them to .env or Render dashboard.\n")


check_env()

app = Flask(__name__)
CORS(app)

limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per day", "60 per hour"],
    storage_uri="memory://"
)

limiter.limit("30 per hour")(predict_bp)
limiter.limit("20 per hour")(community_bp)
limiter.limit("30 per hour")(chat_bp)

app.register_blueprint(predict_bp)
app.register_blueprint(chat_bp)
app.register_blueprint(community_bp)
app.register_blueprint(analytics_bp)


# ── HTML Pages ──────────────────────────────────────────────────────────
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/mood')
def mood():
    return render_template('mood.html')

@app.route('/resources')
def resources():
    return render_template('resources.html')

@app.route('/community')
def community():
    return render_template('community.html')

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/breathing')
def breathing():
    return render_template('breathing.html')

@app.route('/analytics')
def analytics():
    return render_template('analytics.html')

@app.route('/chat')
def chat():
    return render_template('chat.html')


# ── API Status ──────────────────────────────────────────────────────────
@app.route('/api/status')
def status():
    from db import is_connected
    return jsonify({
        "status":   "running",
        "project":  "MindEase",
        "version":  "1.0",
        "database": "mongodb" if is_connected() else "in-memory",
        "chat":     "enabled" if os.getenv('GROQ_API_KEY') else "disabled",
    })


# ── Error Handlers ──────────────────────────────────────────────────────
@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Route not found"}), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Internal server error"}), 500

@app.errorhandler(429)
def rate_limit_exceeded(e):
    return jsonify({"error": "Too many requests. Please wait a moment."}), 429


if __name__ == '__main__':
    print("\n🧘 MindEase is running!")
    print("👉 Open: http://localhost:5000\n")
    app.run(debug=True, port=5000)
