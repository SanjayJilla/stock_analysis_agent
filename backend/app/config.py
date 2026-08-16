import os
from dotenv import load_dotenv

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
NEWS_API_KEY = os.getenv("NEWS_API_KEY")