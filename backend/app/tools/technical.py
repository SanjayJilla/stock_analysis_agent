import yfinance as yf
import pandas as pd
import numpy as np

def technical_analysis(ticker: str):
    """
    Computes comprehensive technical indicators matching the Stock Analyzer dashboard:
    - Moving Averages (SMA 20, SMA 50, SMA 150, SMA 200)
    - 14-Day RSI (Relative Strength Index)
    - Bollinger Bands (20-day SMA +/- 2 Standard Deviations)
    - MACD Line & 9-Day Signal Line
    - Dynamic Support and Resistance price levels
    """
    stock = yf.Ticker(ticker)
    df = stock.history(period="1y")
    if df.empty:
        return {
            "error": f"No historical data found for {ticker}"
        }

    # 1. Simple Moving Averages (SMAs)
    df["SMA_20"] = df["Close"].rolling(window=20).mean()
    df["SMA_50"] = df["Close"].rolling(window=50).mean()
    df["SMA_150"] = df["Close"].rolling(window=150).mean()
    df["SMA_200"] = df["Close"].rolling(window=200).mean()

    # 2. Bollinger Bands (20 periods, 2 standard deviations)
    rolling_std = df["Close"].rolling(window=20).std()
    df["BB_Upper"] = df["SMA_20"] + (rolling_std * 2)
    df["BB_Lower"] = df["SMA_20"] - (rolling_std * 2)

    # 3. 14-Day Relative Strength Index (RSI)
    delta = df["Close"].diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    avg_gain = gain.rolling(14).mean()
    avg_loss = loss.rolling(14).mean()
    rs = avg_gain / avg_loss.replace(0, np.nan)
    df["RSI"] = 100 - (100 / (1 + rs))

    # 4. MACD & Signal Line
    ema_12 = df["Close"].ewm(span=12, adjust=False).mean()
    ema_26 = df["Close"].ewm(span=26, adjust=False).mean()
    df["MACD"] = ema_12 - ema_26
    df["MACD_Signal"] = df["MACD"].ewm(span=9, adjust=False).mean()

    # 5. Support & Resistance (Pivot / Local Extremes over past 60 trading days)
    recent_window = min(len(df), 60)
    recent_df = df.tail(recent_window)
    resistance_level = float(recent_df["High"].max())
    support_level = float(recent_df["Low"].min())

    latest = df.iloc[-1]

    # Helper function to convert numpy/pandas types safely to Python floats
    def safe_float(val, fallback=None):
        if pd.isna(val):
            return fallback
        return float(round(val, 2))

    return {
        "price": safe_float(latest["Close"]),
        "sma20": safe_float(latest["SMA_20"]),
        "sma50": safe_float(latest["SMA_50"]),
        "sma150": safe_float(latest["SMA_150"]),
        "sma200": safe_float(latest["SMA_200"]),
        "rsi": safe_float(latest["RSI"]),
        "bb_upper": safe_float(latest["BB_Upper"]),
        "bb_middle": safe_float(latest["SMA_20"]),
        "bb_lower": safe_float(latest["BB_Lower"]),
        "macd": safe_float(latest["MACD"]),
        "macd_signal": safe_float(latest["MACD_Signal"]),
        "support": safe_float(support_level),
        "resistance": safe_float(resistance_level),
        "volume": int(latest["Volume"]) if not pd.isna(latest["Volume"]) else 0
    }
