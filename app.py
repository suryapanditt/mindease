from flask import Flask, render_template, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from dotenv import load_dotenv
from routes.predict import predict_bp
from routes.chat import chat_bp
from routes.community import community_bp
from routes.analytics import analytics_bp
import os

load_dotenv()

# Fix #11: warn on startup if expected env vars are missing
def check_env():
    warnings = []
    # Add any required env vars here as the project grows
    # e.g. if not os.getenv('MONGO_URI'): warnings.append('MONGO_URI')
    if warnings:
        print(f"⚠️  Missing env vars: {', '.join(warnings)}")
        print("   Add them to your .env file.\n")

check_env()

app = Flask(__name__)
CORS(app)

# Fix #13: basic rate limiting to prevent abuse
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per day", "60 per hour"],
    storage_uri="memory://"
)

# Apply stricter limits on sensitive POST routes
limiter.limit("30 per hour")(predict_bp)
limiter.limit("20 per hour")(community_bp)

# Register API routes
app.register_blueprint(predict_bp)
app.register_blueprint(chat_bp)
app.register_blueprint(community_bp)
app.register_blueprint(analytics_bp)

# ── Serve HTML Pages ──────────────────────────────────
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

# ── API Status ────────────────────────────────────────
@app.route('/api/status')
def status():
    return jsonify({
        "status": "running",
        "project": "MindEase",
        "version": "1.0",
        "routes": {
            "GET  /":                  "Home page",
            "GET  /mood":              "Mood check page",
            "GET  /resources":         "Resources page",
            "GET  /community":         "Community page",
            "GET  /about":             "About page",
            "POST /predict":           "ML stress prediction",
            "GET  /community/posts":   "Get community posts",
            "POST /community/post":    "Create anonymous post",
        }
    })

# Fix #9: Global error handlers
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
