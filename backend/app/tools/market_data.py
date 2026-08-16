import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime

def get_stock_price(ticker: str):
    stock = yf.Ticker(ticker)
    history = stock.history(period="1d")

    if history.empty:
        return {
            "error": f"No market data found for {ticker}"
        }
    latest = history.iloc[-1]
    
    # Extract company long name if available
    company_name = ticker.upper()
    try:
        info = stock.info
        company_name = info.get("longName") or info.get("shortName") or company_name
    except Exception:
        pass

    now_str = datetime.now().strftime("%Y-%m-%d %I:%M:%S %p ET")

    return {
        "ticker": ticker.upper(),
        "company": company_name,
        "price": float(round(latest["Close"], 2)),
        "open": float(round(latest["Open"], 2)),
        "high": float(round(latest["High"], 2)),
        "low": float(round(latest["Low"], 2)),
        "volume": int(latest["Volume"]),
        "timestamp": now_str
    }


def get_historical_data(ticker: str, period: str = "6mo"):
    """
    Fetches historical OHLCV data and computes technical overlays for chart rendering:
    - SMA 20 (Middle Bollinger)
    - SMA 50
    - Bollinger Bands (Upper and Lower bounds)
    - Support and Resistance baseline levels
    """
    stock = yf.Ticker(ticker)
    
    # Download 1 year history to ensure enough data points
    history = stock.history(period="1y")
    if history.empty:
        return {
            "error": f"No historical data found for {ticker}",
            "records": [],
            "stats": {}
        }

    # Extract company long name
    company_name = ticker.upper()
    try:
        info = stock.info
        company_name = info.get("longName") or info.get("shortName") or company_name
    except Exception:
        pass

    # Compute Moving Averages & Bollinger Bands
    history["SMA_20"] = history["Close"].rolling(window=20).mean()
    history["SMA_50"] = history["Close"].rolling(window=50).mean()
    std_20 = history["Close"].rolling(window=20).std()
    history["BB_Upper"] = history["SMA_20"] + (std_20 * 2)
    history["BB_Lower"] = history["SMA_20"] - (std_20 * 2)

    # Slice to requested display period
    slice_map = {
        "10d": 10,
        "10D": 10,
        "1m": 22,
        "1M": 22,
        "3m": 66,
        "3M": 66,
        "6m": 130,
        "6M": 130,
        "1y": 252,
        "1Y": 252
    }
    num_rows = slice_map.get(period, 130)
    display_df = history.tail(num_rows).copy()

    # Calculate Support and Resistance within the selected window
    resistance = float(round(display_df["High"].max(), 2))
    support = float(round(display_df["Low"].min(), 2))

    display_df["Support"] = support
    display_df["Resistance"] = resistance

    display_df = display_df.reset_index()
    # Format date strings cleanly as 'YYYY-MM-DD'
    display_df["DateStr"] = display_df["Date"].dt.strftime("%Y-%m-%d")

    records = []
    for _, row in display_df.iterrows():
        records.append({
            "date": row["DateStr"],
            "open": float(round(row["Open"], 2)),
            "high": float(round(row["High"], 2)),
            "low": float(round(row["Low"], 2)),
            "close": float(round(row["Close"], 2)),
            "volume": int(row["Volume"]),
            "sma20": float(round(row["SMA_20"], 2)) if pd.notna(row["SMA_20"]) else None,
            "sma50": float(round(row["SMA_50"], 2)) if pd.notna(row["SMA_50"]) else None,
            "bb_upper": float(round(row["BB_Upper"], 2)) if pd.notna(row["BB_Upper"]) else None,
            "bb_lower": float(round(row["BB_Lower"], 2)) if pd.notna(row["BB_Lower"]) else None,
            "support": support,
            "resistance": resistance
        })

    latest_row = records[-1] if records else {}
    now_str = datetime.now().strftime("%Y-%m-%d %I:%M:%S %p ET")

    return {
        "ticker": ticker.upper(),
        "period": period,
        "records": records,
        "stats": {
            "date": datetime.now().strftime("%Y-%m-%d"),
            "price": latest_row.get("close", 0),
            "sma50": latest_row.get("sma50"),
            "support": support,
            "resistance": resistance,
            "volume": latest_row.get("volume", 0),
            "company": company_name,
            "timestamp": now_str
        }
    }
