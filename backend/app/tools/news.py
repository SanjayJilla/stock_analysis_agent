import os
import requests
from dotenv import load_dotenv

load_dotenv()

def get_stock_news(ticker: str):

    api_key = os.getenv("NEWS_API_KEY")

    if not api_key:
        return {
            "error": "NEWS_API_KEY is not configured"
        }

    url = "https://newsapi.org/v2/everything"

    params = {
        "q": ticker,
        "apiKey": api_key,
        "language": "en",
        "sortBy": "publishedAt",
        "pageSize": 10
    }

    try:

        response = requests.get(
            url,
            params=params,
            timeout=10
        )

        print("News API status:", response.status_code)
        # FIX: Avoid printing the raw response.text directly to prevent UnicodeEncodeError on Windows console.
        # We print a safe snippet and length instead.
        print("News API response fetched successfully. Length of response:", len(response.text))

        response.raise_for_status()

        data = response.json()

        articles = []

        for article in data.get("articles", []):

            articles.append({
                "title": article.get("title"),
                "description": article.get("description"),
                "source": article.get("source", {}).get("name"),
                "published_at": article.get("publishedAt"),
                "url": article.get("url")
            })

        return articles

    except Exception as e:

        print("News API error:", e)

        return {
            "error": str(e)
        }