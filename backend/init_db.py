import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

print(f"Connecting to PostgreSQL using DATABASE_URL:\n{DATABASE_URL}\n")

try:
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()

    # 1. Create table 'analyses' if not exists
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS analyses (
            id SERIAL PRIMARY KEY,
            ticker VARCHAR(20) NOT NULL,
            user_query TEXT NOT NULL,
            analysis TEXT NOT NULL,
            current_price FLOAT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    conn.commit()
    print(" Table 'analyses' created successfully in database!")

    # 2. Check existing rows
    cursor.execute("SELECT COUNT(*) FROM analyses;")
    count = cursor.fetchone()[0]
    print(f" Current rows in 'analyses' table: {count}")

    # 3. If empty, insert sample baseline entries so pgAdmin immediately shows data
    if count == 0:
        sample_records = [
            (
                "OKLO",
                "Analyze Oklo Inc. for technical breakouts and clean energy risks.",
                "Oklo is breaking out near $80.88 with strong volume conviction and RSI at 61.7. Nuclear data center power demand provides secular momentum.",
                79.88
            ),
            (
                "AAPL",
                "Evaluate Apple valuation and oversold bounce potential.",
                "Apple is currently oversold with 14-day RSI near 26.09. Strong cash flow ($107B) and Services revenue growth provide a defensive buying opportunity above $290 support.",
                305.93
            ),
            (
                "NVDA",
                "Provide comprehensive AI accelerator demand and semiconductor risk analysis.",
                "NVIDIA maintains strong pricing power with 62% operating margins. Strong support at $165 with target resistance at $195.",
                182.40
            )
        ]

        for ticker, query, analysis, price in sample_records:
            cursor.execute("""
                INSERT INTO analyses (ticker, user_query, analysis, current_price)
                VALUES (%s, %s, %s, %s);
            """, (ticker, query, analysis, price))

        conn.commit()
        print(" Seeded sample analyses for OKLO, AAPL, and NVDA into PostgreSQL!")

    cursor.close()
    conn.close()
    print("\n PostgreSQL Database is fully initialized and ready!")

except Exception as e:
    print(f"\n[Error] Connection Error: {e}")
    print("\nPlease verify:")
    print("1. PostgreSQL service is running on your computer.")
    print("2. The database name in backend/.env exists in pgAdmin.")
