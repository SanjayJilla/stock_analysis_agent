import os
import re
import html
import requests
import xml.etree.ElementTree as ET
from dotenv import load_dotenv

load_dotenv()

def get_company_query(ticker: str):
    """
    Extracts a clean company search query and detects if the exchange is Indian.
    Ensures active search ticker and company name are explicitly passed to news APIs.
    """
    clean_sym = ticker.split(".")[0].upper().strip()
    is_indian = ticker.endswith(".NS") or ticker.endswith(".BO")

    comp_name = clean_sym
    try:
        import yfinance as yf
        t = yf.Ticker(ticker)
        info = t.info or {}
        comp_name = info.get("shortName") or info.get("longName") or clean_sym
    except Exception:
        pass

    # Clean generic corporate legal designations to avoid noisy queries
    clean_name = re.sub(
        r"\b(Limited|Ltd|Inc|Corp|Corporation|PLC|Technologies|Holdings|Group)\b\.?",
        "",
        comp_name,
        flags=re.IGNORECASE
    ).strip()
    
    if not clean_name:
        clean_name = clean_sym

    return clean_name, is_indian, clean_sym


def fetch_rss_news(clean_name: str, clean_sym: str, is_indian: bool) -> list:
    """
    Fetches real-time market news from Google News RSS using the active ticker query.
    Requires no paid API keys and works globally for Indian (NSE/BSE), US, and international stocks.
    """
    query = f'("{clean_name}" OR "{clean_sym}") stock' if clean_name.upper() != clean_sym else f'"{clean_sym}" stock'
    hl = "en-IN" if is_indian else "en-US"
    gl = "IN" if is_indian else "US"
    ceid = "IN:en" if is_indian else "US:en"

    rss_url = "https://news.google.com/rss/search"
    params = {
        "q": query,
        "hl": hl,
        "gl": gl,
        "ceid": ceid
    }

    articles = []
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        resp = requests.get(rss_url, params=params, headers=headers, timeout=8)
        if resp.status_code == 200:
            root = ET.fromstring(resp.content)
            for item in root.findall(".//item")[:10]:
                raw_title = item.find("title").text if item.find("title") is not None else ""
                link = item.find("link").text if item.find("link") is not None else ""
                pub_date = item.find("pubDate").text if item.find("pubDate") is not None else ""
                source_elem = item.find("source")
                source_name = source_elem.text if source_elem is not None else "Market News"

                # Unescape HTML characters and strip duplicated source at end of title
                clean_title = html.unescape(raw_title)
                clean_title = re.sub(r"\s+-\s+[^-]+$", "", clean_title).strip()

                if clean_title:
                    articles.append({
                        "title": clean_title,
                        "description": clean_title,
                        "source": source_name,
                        "published_at": pub_date,
                        "url": link
                    })
    except Exception as e:
        print(f"[News RSS] Error fetching news for {clean_sym}: {e}")

    return articles


def get_stock_news(ticker: str):
    """
    Retrieves live breaking market news specifically targeted to the active ticker.
    Guarantees that active search ticker is passed as query parameter,
    preventing generic package updates or cross-stock leakage.
    Always returns a list of article dicts (never a dict error).
    """
    if not ticker:
        return []

    clean_name, is_indian, clean_sym = get_company_query(ticker)

    # 1. Primary: Google News RSS with the active ticker & company name passed directly
    articles = fetch_rss_news(clean_name, clean_sym, is_indian)

    # 2. Secondary: NewsAPI if API key is provided
    api_key = os.getenv("NEWS_API_KEY")
    if api_key and len(articles) < 5:
        try:
            url = "https://newsapi.org/v2/everything"
            query_param = f"{clean_name} stock" if clean_name else clean_sym
            params = {
                "q": query_param,
                "apiKey": api_key,
                "language": "en",
                "sortBy": "publishedAt",
                "pageSize": 10
            }
            resp = requests.get(url, params=params, timeout=8)
            if resp.status_code == 200:
                data = resp.json()
                for art in data.get("articles", []):
                    title = art.get("title") or ""
                    if title and not any(a["title"] == title for a in articles):
                        articles.append({
                            "title": title,
                            "description": art.get("description") or title,
                            "source": art.get("source", {}).get("name") or "NewsAPI",
                            "published_at": art.get("publishedAt") or "",
                            "url": art.get("url") or ""
                        })
        except Exception as e:
            print(f"[NewsAPI] Error fetching for {ticker}: {e}")

    # 3. Tertiary: yfinance news fallback
    if len(articles) < 3:
        try:
            import yfinance as yf
            t = yf.Ticker(ticker)
            yf_news = getattr(t, "news", None) or []
            for yn in yf_news[:5]:
                content = yn.get("content") or yn
                title = content.get("title")
                if title and not any(a["title"] == title for a in articles):
                    articles.append({
                        "title": title,
                        "description": content.get("summary") or title,
                        "source": content.get("provider", {}).get("displayName") if isinstance(content.get("provider"), dict) else "Yahoo Finance",
                        "published_at": content.get("pubDate") or "",
                        "url": content.get("canonicalUrl", {}).get("url") if isinstance(content.get("canonicalUrl"), dict) else content.get("url", "")
                    })
        except Exception as e:
            print(f"[yfinance News] Error fetching for {ticker}: {e}")

    return articles