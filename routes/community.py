from flask import Blueprint, request, jsonify
from datetime import datetime

community_bp = Blueprint('community', __name__)

# NOTE: In-memory storage — will be replaced with MongoDB in database step
posts = []
post_counter = [1]

VALID_CATEGORIES = {'stress', 'placement', 'overwhelmed', 'sleep', 'motivation', 'win', 'general'}

@community_bp.route('/community/posts', methods=['GET'])
def get_posts():
    category = request.args.get('category', 'all')
    if category == 'all':
        return jsonify({"posts": posts[:50]})
    filtered = [p for p in posts if p['category'] == category]
    return jsonify({"posts": filtered[:50]})

@community_bp.route('/community/post', methods=['POST'])
def create_post():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid JSON body"}), 400

        content  = data.get('content', '').strip()
        category = data.get('category', 'general')

        if not content:
            return jsonify({"error": "Content is required"}), 400
        if len(content) > 500:
            return jsonify({"error": "Post too long (max 500 chars)"}), 400

        # Fix: validate category against allowed values
        if category not in VALID_CATEGORIES:
            category = 'general'

        post = {
            "id":         post_counter[0],
            "category":   category,
            "content":    content,
            "likes":      0,
            "replies":    0,
            "time":       "Just now",
            "created_at": datetime.utcnow().isoformat()
        }
        post_counter[0] += 1
        posts.insert(0, post)

        return jsonify({"success": True, "id": post["id"]}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@community_bp.route('/community/like/<int:post_id>', methods=['POST'])
def like_post(post_id):
    post = next((p for p in posts if p['id'] == post_id), None)
    if not post:
        return jsonify({"error": "Post not found"}), 404
    post['likes'] += 1
    return jsonify({"likes": post['likes']})

@community_bp.route('/community/reply', methods=['POST'])
def reply_post():
    try:
        data    = request.get_json()
        if not data:
            return jsonify({"error": "Invalid JSON body"}), 400

        post_id = data.get('post_id')
        content = data.get('content', '').strip()

        if not content:
            return jsonify({"error": "Reply content is required"}), 400

        post = next((p for p in posts if p['id'] == post_id), None)
        if post:
            post['replies'] += 1

        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
