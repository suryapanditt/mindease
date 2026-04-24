"""
db.py — Central MongoDB connection for MindEase
"""
import os

MONGO_URI = os.getenv('MONGO_URI', '')
_db = None


def get_db():
    global _db
    if _db is not None:
        return _db
    if not MONGO_URI:
        return None
    try:
        from pymongo import MongoClient
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        client.admin.command('ping')
        _db = client['mindease']
        print("✅ MongoDB connected successfully.")
        return _db
    except Exception as e:
        print(f"⚠️  MongoDB connection failed: {e}")
        print("   Running with in-memory storage.")
        return None


def is_connected():
    return get_db() is not None
