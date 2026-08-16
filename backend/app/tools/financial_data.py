import yfinance as yf

def get_financial_metrics(ticker:str):
    stock= yf.Ticker(ticker)
    info= stock.info
    return {
        "company":info.get("longName"),
        "sector": info.get("sector"),
        "industry": info.get("industry"),

        "market_cap": info.get("marketCap"),
        "pe_ratio": info.get("trailingPE"),
        "forward_pe": info.get("forwardPE"),

        "price_to_book": info.get("priceToBook"),
        "profit_margin": info.get("profitMargins"),
        "operating_margin": info.get("operatingMargins"),

        "roe": info.get("returnOnEquity"),
        "revenue_growth": info.get("revenueGrowth"),

        "total_revenue": info.get("totalRevenue"),
        "free_cash_flow": info.get("freeCashflow"),

        "debt_to_equity": info.get("debtToEquity")
    }


    return yf.financials