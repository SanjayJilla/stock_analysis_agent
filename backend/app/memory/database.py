import os
import psycopg2 
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def get_connection():
    return psycopg2.connect(DATABASE_URL, connect_timeout=2)


def create_table():
    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS analyses (
                id SERIAL PRIMARY KEY,
                ticker VARCHAR(20) NOT NULL,
                user_query TEXT NOT NULL,
                analysis TEXT NOT NULL,
                current_price FLOAT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"[Database Memory Warning] Could not ensure table 'analyses' exists: {e}")


def save_analysis(
    ticker,
    user_query,
    analysis,
    current_price=None
):
    """
    Saves a completed stock analysis into PostgreSQL for future comparison.
    """
    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO analyses
            (ticker, user_query, analysis, current_price)
            VALUES (%s, %s, %s, %s)
        """, (
            ticker,
            user_query,
            analysis,
            current_price
        ))

        conn.commit()
        cursor.close()
        conn.close()
        print(f"[Database Memory] Successfully saved analysis for {ticker} into PostgreSQL.")
    except Exception as e:
        print(f"[Database Memory Warning] Could not save analysis for {ticker}: {e}")


def get_previous_analysis(ticker):
    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                ticker,
                user_query,
                analysis,
                current_price,
                created_at
            FROM analyses
            WHERE ticker = %s
            ORDER BY created_at DESC
            LIMIT 1
        """, (ticker,))

        result = cursor.fetchone()
        cursor.close()
        conn.close()

        if not result:
            return None

        return {
            "ticker": result[0],
            "user_query": result[1],
            "analysis": result[2],
            "current_price": result[3],
            "created_at": result[4]
        }
    except Exception as e:
        print(f"[Database Memory Warning] Could not fetch previous analysis for {ticker}: {e}")
        return None


def get_analysis_history(ticker, limit=10):
    """
    Fetches the past N analyses for a specific ticker, ordered by most recent first.
    """
    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                id,
                ticker,
                user_query,
                analysis,
                current_price,
                created_at
            FROM analyses
            WHERE ticker = %s
            ORDER BY created_at DESC
            LIMIT %s
        """, (ticker, limit))

        rows = cursor.fetchall()
        cursor.close()
        conn.close()

        history = []
        for row in rows:
            history.append({
                "id": row[0],
                "ticker": row[1],
                "user_query": row[2],
                "analysis": row[3],
                "current_price": row[4],
                "created_at": str(row[5])
            })
        return history
    except Exception as e:
        print(f"[Database Memory Warning] Could not fetch analysis history for {ticker}: {e}")
        return []


def get_all_analyses(limit=50):
    """
    Fetches all historical analyses saved in PostgreSQL across all stocks.
    """
    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                id,
                ticker,
                user_query,
                analysis,
                current_price,
                created_at
            FROM analyses
            ORDER BY created_at DESC
            LIMIT %s
        """, (limit,))

        rows = cursor.fetchall()
        cursor.close()
        conn.close()

        history = []
        for row in rows:
            history.append({
                "id": row[0],
                "ticker": row[1],
                "user_query": row[2],
                "analysis": row[3],
                "current_price": row[4],
                "created_at": str(row[5])
            })
        return history
    except Exception as e:
        print(f"[Database Memory Warning] Could not fetch all analyses: {e}")
        return []
