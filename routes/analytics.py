from flask import Blueprint, jsonify
from datetime import datetime, timedelta
from collections import Counter

analytics_bp = Blueprint('analytics', __name__)

# In-memory fallback
mood_logs = []

COMMUNITY_LABELS = {
    'stress':      '😰 Exam Stress',
    'placement':   '💼 Placement',
    'overwhelmed': '😤 Overwhelmed',
    'win':         '🎉 Small Wins',
    'motivation':  '🔥 Motivation',
    'sleep':       '😴 Sleep Issues',
    'general':     '💭 General'
}


def _get_col():
    from db import get_db
    db = get_db()
    return db['mood_logs'] if db is not None else None


def _get_logs():
    col = _get_col()
    if col is not None:
        return list(col.find({}, {'_id': 0}).sort('timestamp', -1).limit(500))
    return mood_logs


def log_mood(entry: dict):
    """Called by predict.py to save a mood check-in."""
    col = _get_col()
    if col is not None:
        try:
            col.insert_one(entry)
        except Exception as e:
            print(f"⚠️  Failed to log mood: {e}")
    else:
        mood_logs.append(entry)


# ── Helpers ──────────────────────────────────────────────────────────────

def get_distribution(logs):
    c = Counter(l['stress_level'] for l in logs)
    return {"low": c.get('low', 0), "medium": c.get('medium', 0), "high": c.get('high', 0)}


def get_trend(logs, days=7):
    result = []
    for i in range(days - 1, -1, -1):
        day     = datetime.utcnow() - timedelta(days=i)
        label   = day.strftime('%a')
        day_str = day.strftime('%Y-%m-%d')
        d_logs  = [l for l in logs if l.get('timestamp', '').startswith(day_str)]
        c = Counter(l['stress_level'] for l in d_logs)
        result.append({"date": label, "high": c.get('high', 0),
                        "medium": c.get('medium', 0), "low": c.get('low', 0)})
    return result


def get_situations(logs):
    all_tags = []
    for l in logs:
        all_tags.extend(l.get('situation_tags', []))
    c = Counter(all_tags)
    return [{"label": tag, "count": cnt} for tag, cnt in c.most_common(7)]


def get_avg_scores(logs):
    if not logs:
        return {"mood": 0, "anxiety": 0, "social": 0, "sleep": 0, "study": 0}
    n = len(logs)
    return {
        "mood":    round(sum(l.get('mood_rating',   0) for l in logs) / n, 1),
        "anxiety": round(sum(l.get('anxiety_level', 0) for l in logs) / n, 1),
        "social":  round(sum(l.get('social_score',  0) for l in logs) / n, 1),
        "sleep":   round(sum(l.get('sleep_hours',   0) for l in logs) / n, 1),
        "study":   round(sum(l.get('study_hours',   0) for l in logs) / n, 1),
    }


def get_by_hour(logs):
    labels = ['12am','2am','4am','6am','8am','10am','12pm','2pm','4pm','6pm','8pm','10pm']
    bins   = [0] * 12
    for l in logs:
        ts = l.get('timestamp', '')
        try:
            hour = int(ts[11:13]) if len(ts) > 13 else 0
            bins[hour // 2] += 1
        except Exception:
            pass
    return [{"hour": labels[i], "count": bins[i]} for i in range(12)]


# ── Route ────────────────────────────────────────────────────────────────

@analytics_bp.route('/api/analytics')
def analytics():
    try:
        from routes.community import get_all_posts_for_analytics
        logs = _get_logs()

        community_cats = []
        try:
            community_posts = get_all_posts_for_analytics()
            if community_posts:
                c = Counter(p['category'] for p in community_posts)
                community_cats = [
                    {"label": COMMUNITY_LABELS.get(cat, cat), "count": cnt}
                    for cat, cnt in c.most_common()
                ]
        except Exception:
            pass

        return jsonify({
            "total_checks":         len(logs),
            "distribution":         get_distribution(logs),
            "trend":                get_trend(logs),
            "situations":           get_situations(logs),
            "avg_scores":           get_avg_scores(logs),
            "by_hour":              get_by_hour(logs),
            "community_categories": community_cats,
            "generated_at":         datetime.utcnow().isoformat()
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500
