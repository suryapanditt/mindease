from flask import Blueprint, request, jsonify
import random
import os
import pickle
import numpy as np

predict_bp = Blueprint('predict', __name__)

# Fix #10: robust path resolution regardless of working directory
BASE        = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
MODEL_PATH  = os.path.join(BASE, 'ml', 'model.pkl')
SCALER_PATH = os.path.join(BASE, 'ml', 'scaler.pkl')

TIPS = {
    "low": [
        "You're doing well! Keep your sleep schedule consistent and take short breaks.",
        "Great job managing stress. Try gratitude journaling to maintain this positive state.",
        "Keep it up! Stay hydrated and maintain your social connections."
    ],
    "medium": [
        "Try the Pomodoro technique: 25 min study, 5 min break. It prevents mental fatigue.",
        "Take a 10-minute walk. Physical movement directly reduces cortisol levels.",
        "Practice box breathing: Inhale 4s → Hold 4s → Exhale 4s → Hold 4s. Repeat 4 times.",
        "Make a priority list — focus on the top 3 tasks only today."
    ],
    "high": [
        "Take a break RIGHT NOW. Close your books for 30 minutes. Overworking increases mistakes.",
        "Talk to someone you trust — a friend, family member, or our AI chat.",
        "Your sleep is likely suffering. Even a 20-minute nap can restore focus.",
        "Try progressive muscle relaxation: tense each muscle group for 5s, then release.",
        "Consider talking to your college counsellor. Asking for help is strength, not weakness."
    ]
}

def rule_based_predict(sleep, study, mood, anxiety, social):
    score = 0
    if sleep < 4:    score += 30
    elif sleep < 6:  score += 20
    elif sleep < 7:  score += 10
    elif sleep > 9:  score += 5
    if study > 12:   score += 20
    elif study > 10: score += 12
    elif study > 8:  score += 8
    score += (10 - mood) * 3
    score += (anxiety - 1) * 3
    score += (10 - social) * 1.5
    score = min(round(score), 100)
    if score < 35:   return score, "low"
    elif score < 65: return score, "medium"
    else:            return score, "high"

def ml_predict(sleep, study, mood, anxiety, social):
    with open(MODEL_PATH, 'rb') as f:
        model = pickle.load(f)
    with open(SCALER_PATH, 'rb') as f:
        scaler = pickle.load(f)

    features = np.array([[sleep, study, mood, anxiety, social]])

    # Fix #2: scaler.transform() was missing — added now
    scaled_features = scaler.transform(features)

    prediction = model.predict(scaled_features)[0]
    proba      = model.predict_proba(scaled_features)[0]
    confidence = int(max(proba) * 100)

    label_map = {0: "low", 1: "medium", 2: "high"}
    return confidence, label_map.get(int(prediction), "medium")


@predict_bp.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid JSON body"}), 400

        required = ['sleep_hours', 'study_hours', 'mood_rating', 'anxiety_level', 'social_score']
        for field in required:
            if field not in data:
                return jsonify({"error": f"Missing field: {field}"}), 400

        sleep   = float(data['sleep_hours'])
        study   = float(data['study_hours'])
        mood    = int(data['mood_rating'])
        anxiety = int(data['anxiety_level'])
        social  = int(data['social_score'])

        if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
            score, level = ml_predict(sleep, study, mood, anxiety, social)
            model_used = "random_forest"
        else:
            score, level = rule_based_predict(sleep, study, mood, anxiety, social)
            model_used = "rule_based"

        tip = random.choice(TIPS[level])

        # Log anonymously for analytics (no personal data)
        try:
            from routes.analytics import mood_logs
            mood_logs.append({
                "sleep_hours":   sleep,
                "study_hours":   study,
                "mood_rating":   mood,
                "anxiety_level": anxiety,
                "social_score":  social,
                "stress_level":  level,
                "stress_score":  score,
                "situation_tags": data.get('situation_tags', []),
                "timestamp":     __import__('datetime').datetime.utcnow().isoformat()
            })
        except Exception:
            pass   # Analytics failure should never break prediction

        return jsonify({
            "stress_score": score,
            "stress_level": level,
            "tip": tip,
            "model_used": model_used
        })

    except ValueError as e:
        return jsonify({"error": f"Invalid input value: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500
