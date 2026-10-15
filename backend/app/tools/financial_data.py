import math
import yfinance as yf

def sanitize_ratio(val, min_val=None, max_val=None):
    """
    Cleans raw financial ratios, bounds-checks extreme outliers,
    and returns None for invalid, infinite, or distorted values.
    """
    if val is None:
        return None
    try:
        f = float(val)
        if math.isnan(f) or math.isinf(f):
            return None
        if min_val is not None and f < min_val:
            return None
        if max_val is not None and f > max_val:
            return None
        return round(f, 4)
    except (TypeError, ValueError):
        return None

def get_financial_metrics(ticker: str):
    stock = yf.Ticker(ticker)
    info = {}
    try:
        info = stock.info or {}
    except Exception:
        pass

    market_cap = info.get("marketCap")
    if not market_cap:
        try:
            market_cap = getattr(stock.fast_info, "market_cap", None)
        except Exception:
            pass

    return {
        "company": info.get("longName") or info.get("shortName") or ticker,
        "sector": info.get("sector"),
        "industry": info.get("industry"),
        "currency": info.get("currency") or getattr(getattr(stock, "fast_info", None), "currency", None),

        "market_cap": float(market_cap) if market_cap else None,
        # Bounds check P/E: negative P/E is undefined for unprofitable turnaround stocks
        "pe_ratio": sanitize_ratio(info.get("trailingPE"), min_val=0.01, max_val=2500),
        "forward_pe": sanitize_ratio(info.get("forwardPE"), min_val=0.01, max_val=2500),

        # Price to book: negative indicates negative net worth / deficit
        "price_to_book": sanitize_ratio(info.get("priceToBook"), min_val=0.01, max_val=500),
        "profit_margin": sanitize_ratio(info.get("profitMargins"), min_val=-10.0, max_val=10.0),
        "operating_margin": sanitize_ratio(info.get("operatingMargins"), min_val=-10.0, max_val=10.0),

        "roe": sanitize_ratio(info.get("returnOnEquity"), min_val=-10.0, max_val=10.0),
        "revenue_growth": sanitize_ratio(info.get("revenueGrowth"), min_val=-2.0, max_val=50.0),

        "total_revenue": info.get("totalRevenue"),
        "free_cash_flow": info.get("freeCashflow"),

        # Debt to equity: negative indicates negative net worth
        "debt_to_equity": sanitize_ratio(info.get("debtToEquity"), min_val=0.0, max_val=10000)
    }