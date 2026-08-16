#from langchain_google_genai import ChatGoogleGenerativeAI
import os
from urllib import response

from app.utils.response import extract_text
from app.config import GOOGLE_API_KEY
from langchain_google_genai import ChatGoogleGenerativeAI

llm = ChatGoogleGenerativeAI(
    model="gemini-3.6-flash",
    google_api_key=GOOGLE_API_KEY
)

def risk_node(state):
    # ADDED: Extract historical analysis from previous runs (loaded from PostgreSQL)
    prev_analysis = state.get("previous_analysis", "")
    prev_price = state.get("previous_price")
    prev_date = state.get("previous_date", "")

    history_context = ""
    if prev_analysis:
        history_context = f"""
    --- Previous Analysis on {prev_date} (Historical Price: ${prev_price}) ---
    {prev_analysis}
    ------------------------------------------------------------------------
    Note: Compare current metrics with the previous analysis above. Identify if any previous risks have materialized, escalated, or resolved.
    """

    prompt=f"""You are a senior financial risk auditor.
Analyze {state["ticker"]}.
Financial Data: {state["financial_data"]}.
Technical Data: {state["technical_data"]}
Recent News: {state["news_data"]}
Financial Documents: {state["rag_context"]}
{history_context}

Identify:
1. Financial & Valuation risks
2. Market & Macro risks
3. Competitive & Technology risks
4. Regulatory & Supply Chain risks
5. Major negative signals & warnings
6. Risk evolution (Compare against previous analysis if provided)

IMPORTANT FORMATTING RULES:
- Write in clean, professional plain text.
- Do NOT use markdown symbols like hashtags (#), bold asterisks (* or **), or robotic formatting.
- Format points cleanly with numbers (1., 2., 3.).
"""

    response = llm.invoke(prompt)
    answer = extract_text(response)
    clean_answer = answer.replace("#", "").replace("**", "").replace("*", "").replace("`", "").strip()

    return {
        "risks": clean_answer
    }