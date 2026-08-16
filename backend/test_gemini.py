import os
from dotenv import load_dotenv

load_dotenv()

from app.tools.news import get_stock_news

print(
    "News API key found:",
    bool(os.getenv("NEWS_API_KEY"))
)

news = get_stock_news("AAPL")

print(news)