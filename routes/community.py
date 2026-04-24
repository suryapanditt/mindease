from flask import Blueprint, request, jsonify
from datetime import datetime

community_bp = Blueprint('community', __name__)

VALID_CATEGORIES = {'stress', 'placement', 'overwhelmed', 'sleep', 'motivation', 'win', 'general'}

# In-memory fallback
_posts_fallback   = []
_counter_fallback = [1]


def _get_col():
    from db import get_db
    db = get_db()
    return db['community_posts'] if db is not None else None


# ── GET posts ────────────────────────────────────────────────────────────
@community_bp.route('/community/posts', methods=['GET'])
def get_posts():
    category = request.args.get('category', 'all')
    col = _get_col()

    if col is not None:
        query  = {} if category == 'all' else {'category': category}
        posts  = list(col.find(query, {'_id': 0}).sort('created_at', -1).limit(50))
    else:
        posts = _posts_fallback if category == 'all' else [
            p for p in _posts_fallback if p['category'] == category
        ]
        posts = posts[:50]

    return jsonify({"posts": posts})


# ── CREATE post ──────────────────────────────────────────────────────────
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
        if category not in VALID_CATEGORIES:
            category = 'general'

        col = _get_col()

        if col is not None:
            post = {
                "category":   category,
                "content":    content,
                "likes":      0,
                "replies":    0,
                "time":       "Just now",
                "created_at": datetime.utcnow().isoformat()
            }
            result  = col.insert_one(post)
            post_id = str(result.inserted_id)
        else:
            post_id = _counter_fallback[0]
            post = {
                "id":         post_id,
                "category":   category,
                "content":    content,
                "likes":      0,
                "replies":    0,
                "time":       "Just now",
                "created_at": datetime.utcnow().isoformat()
            }
            _counter_fallback[0] += 1
            _posts_fallback.insert(0, post)

        return jsonify({"success": True, "id": str(post_id)}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── LIKE post ────────────────────────────────────────────────────────────
@community_bp.route('/community/like/<post_id>', methods=['POST'])
def like_post(post_id):
    col = _get_col()

    if col is not None:
        from bson import ObjectId
        try:
            result = col.find_one_and_update(
                {'_id': ObjectId(post_id)},
                {'$inc': {'likes': 1}},
                return_document=True,
                projection={'_id': 0, 'likes': 1}
            )
            if not result:
                return jsonify({"error": "Post not found"}), 404
            return jsonify({"likes": result['likes']})
        except Exception:
            return jsonify({"error": "Invalid post id"}), 400
    else:
        try:
            pid  = int(post_id)
            post = next((p for p in _posts_fallback if p['id'] == pid), None)
            if not post:
                return jsonify({"error": "Post not found"}), 404
            post['likes'] += 1
            return jsonify({"likes": post['likes']})
        except ValueError:
            return jsonify({"error": "Invalid post id"}), 400


# ── REPLY ────────────────────────────────────────────────────────────────
@community_bp.route('/community/reply', methods=['POST'])
def reply_post():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid JSON body"}), 400

        post_id = data.get('post_id')
        content = data.get('content', '').strip()

        if not content:
            return jsonify({"error": "Reply content is required"}), 400

        col = _get_col()
        if col is not None:
            from bson import ObjectId
            try:
                col.update_one({'_id': ObjectId(str(post_id))}, {'$inc': {'replies': 1}})
            except Exception:
                pass
        else:
            try:
                pid  = int(post_id)
                post = next((p for p in _posts_fallback if p['id'] == pid), None)
                if post:
                    post['replies'] += 1
            except (ValueError, TypeError):
                pass

        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Helper for analytics ─────────────────────────────────────────────────
def get_all_posts_for_analytics():
    col = _get_col()
    if col is not None:
        return list(col.find({}, {'_id': 0, 'category': 1}).limit(500))
    return _posts_fallback
