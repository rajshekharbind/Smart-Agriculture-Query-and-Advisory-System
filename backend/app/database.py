import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timedelta

from backend.app.config import APP_DB_PATH


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(APP_DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


@contextmanager
def db_session():
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db():
    with db_session() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                phone TEXT DEFAULT '',
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'farmer',
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS farmer_profiles (
                user_id INTEGER PRIMARY KEY,
                state TEXT DEFAULT 'Kerala',
                district TEXT DEFAULT 'Thrissur',
                village TEXT DEFAULT '',
                farm_size_acres REAL DEFAULT 2.0,
                soil_type TEXT DEFAULT 'Loamy',
                primary_crops TEXT DEFAULT 'Rice, Coconut, Pepper',
                preferred_language TEXT DEFAULT 'Hindi',
                ui_mode TEXT DEFAULT 'easy',
                updated_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS crop_calendars (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                crop_name TEXT NOT NULL,
                sowing_date TEXT NOT NULL,
                area_acres REAL DEFAULT 1.0,
                soil_type TEXT DEFAULT 'Loamy',
                milestones_json TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS farm_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                crop_name TEXT NOT NULL,
                area_acres REAL NOT NULL,
                total_cost REAL NOT NULL,
                revenue REAL NOT NULL,
                profit REAL NOT NULL,
                details_json TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                category TEXT NOT NULL DEFAULT 'general',
                due_date TEXT DEFAULT '',
                is_read INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS community_posts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                author_name TEXT NOT NULL,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                crop_tag TEXT DEFAULT 'General',
                image_data TEXT DEFAULT '',
                likes INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS community_comments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                post_id INTEGER NOT NULL,
                user_id INTEGER,
                author_name TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE
            );
            """
        )

        # Seed starter notifications & community posts if empty
        post_count = conn.execute("SELECT COUNT(*) FROM community_posts").fetchone()[0]
        if post_count == 0:
            now = datetime.utcnow().isoformat()
            conn.execute(
                """
                INSERT INTO community_posts (user_id, author_name, title, content, crop_tag, likes, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    None,
                    "Ramesh Patel (Kisan Mitra)",
                    "Drip irrigation reduced my paddy & vegetable water cost by 35%",
                    "Switched to morning-only drip cycles with mulching before summer heat. Soil moisture stayed steady and weed growth dropped significantly.",
                    "Irrigation",
                    14,
                    now,
                ),
            )
            conn.execute(
                """
                INSERT INTO community_posts (user_id, author_name, title, content, crop_tag, likes, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    None,
                    "Sunita Devi",
                    "Neem oil + Trichoderma helped control early leaf spot",
                    "Sprayed 3ml neem oil per liter in the evening after spotting yellow halos on lower leaves, and applied Trichoderma-enriched compost near roots.",
                    "Organic",
                    21,
                    now,
                ),
            )

        notif_count = conn.execute("SELECT COUNT(*) FROM notifications").fetchone()[0]
        if notif_count == 0:
            now = datetime.utcnow()
            sample_notifs = [
                (
                    None,
                    "Soil Testing Reminder",
                    "Collect topsoil samples (15 cm depth) before pre-monsoon sowing and check NPK + pH in Soil Health Assistant.",
                    "soil",
                    (now + timedelta(days=2)).strftime("%Y-%m-%d"),
                    0,
                    now.isoformat(),
                ),
                (
                    None,
                    "Morning Irrigation Best Practice",
                    "Irrigate between 6:00 AM - 8:30 AM to minimize evaporation loss and prevent fungal leaf wetness overnight.",
                    "irrigation",
                    now.strftime("%Y-%m-%d"),
                    0,
                    now.isoformat(),
                ),
                (
                    None,
                    "PMFBY Crop Insurance Window",
                    "Verify seasonal crop insurance enrollment deadlines with your nearest CSC / Krishi Bhavan.",
                    "insurance",
                    (now + timedelta(days=5)).strftime("%Y-%m-%d"),
                    0,
                    now.isoformat(),
                ),
            ]
            conn.executemany(
                """
                INSERT INTO notifications (user_id, title, message, category, due_date, is_read, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                sample_notifs,
            )


init_db()
