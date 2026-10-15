import os
from app.config import GOOGLE_API_KEY
from langchain_google_genai import ChatGoogleGenerativeAI
from app.utils.response import extract_text

llm = ChatGoogleGenerativeAI(
    model="gemini-3.6-flash",
    google_api_key=GOOGLE_API_KEY,
    max_output_tokens=800
)


def final_analysis_node(state):
    # Historical analysis from PostgreSQL memory
    previous = state.get("previous_analysis", "")
    previous_price = state.get("previous_price")
    previous_date = state.get("previous_date", "")

    market_data = state.get("market_data") or {}
    currency_symbol = market_data.get("currency_symbol")
    currency_code = market_data.get("currency")
    if not currency_symbol:
        ticker = state.get("ticker", "").upper()
        if ticker.endswith(".NS") or ticker.endswith(".BO"):
            currency_symbol = "₹"
            currency_code = "INR"
        elif ticker.endswith(".L"):
            currency_symbol = "£"
            currency_code = "GBP"
        elif any(ticker.endswith(e) for e in [".DE", ".PA", ".AS", ".MI"]):
            currency_symbol = "€"
            currency_code = "EUR"
        else:
            currency_symbol = "$"
            currency_code = "USD"

    history_section = ""
    if previous:
        history_section = f"""
Previous Analysis from {previous_date} (Historical Price was {currency_symbol}{previous_price}):
{previous}
"""

    prompt=f"""
You are a senior Wall Street equity research analyst. Analyze the following stock.
User Question: {state["user_query"]}
Ticker: {state["ticker"]}
Reporting Currency: {currency_code} (Symbol: {currency_symbol})
Market Data: {state["market_data"]}
Financial Data: {state["financial_data"]}
Technical Data: {state["technical_data"]}
News Data: {state["news_data"]}
RAG Context: {state["rag_context"]}
Risk Analysis: {state["risks"]}
{history_section}

Provide a structured, institutional analysis report with:
1. Executive Summary & Overview
2. Financial Health & Balance Sheet Multiples
3. Valuation Assessment
4. Technical Trends & Breakout Levels
5. Bull Case (Growth Thesis & Expansion Catalysts)
6. Bear Case (Downside Risks & Valuation Vulnerabilities)
7. Historical Thesis Drift & Comparison (Now vs. Before)
8. Investment Recommendation & Final Strategy

IMPORTANT FORMATTING & ACCURACY RULES:
- Write in clean, professional executive English.
- CURRENCY ACCURACY: Always denominate prices, support/resistance levels, target ranges, and balance sheet metrics in the stock's correct native currency: {currency_symbol} ({currency_code}). Never use $ for Indian (NSE/BSE) or non-US stocks.
- Do NOT use markdown symbols like hashtags (#, ##, ###), bold asterisks (* or **), or special formatting marks.
- Use clear paragraph headers and clean bullet numbers (1., 2., 3.).
- Clearly distinguish facts from interpretation.
"""
    response=llm.invoke(prompt)
    raw_text = extract_text(response)
    
    # Strip any accidental markdown formatting symbols
    clean_text = raw_text.replace("#", "").replace("**", "").replace("*", "").replace("`", "").strip()
    
    return {
        "final_analysis": clean_text
    }


    