import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "underwriting.db")


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS submissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            underwriter_name TEXT NOT NULL,
            prioritized_ids TEXT NOT NULL,
            discarded_ids TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS process_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            submission_id INTEGER REFERENCES submissions(id),
            property_id INTEGER NOT NULL,
            ai_risk TEXT,
            quote_propensity REAL,
            total_risk_score REAL,
            shap_values TEXT,
            vulnerability_data TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    """)

    conn.commit()

    # Idempotent migration: add score column if it doesn't exist
    try:
        cursor.execute("ALTER TABLE submissions ADD COLUMN score REAL DEFAULT NULL")
        conn.commit()
    except Exception:
        pass  # column already exists

    conn.close()
