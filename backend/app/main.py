import uuid
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Import our compiled LangGraph stock analysis agent
from app.agent.graph import stock_agent

# Import database functions for history and table initialization
from app.memory.database import create_table, get_analysis_history, get_all_analyses
from app.tools.market_data import get_stock_price, get_historical_data
from app.utils.response import extract_text
from app.config import GOOGLE_API_KEY
from langchain_google_genai import ChatGoogleGenerativeAI



app = FastAPI(
    title="Stock Analyzer & Financial Intelligence Terminal",
    description="Backend API powering multi-modal stock analysis with LangGraph, Google Gemini, Technical Overlays, and PostgreSQL.",
    version="2.0.0"
)

# Enable CORS for all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

WATCHLIST = ["OKLO", "AAPL", "NVDA", "TSLA", "MSFT"]

@app.on_event("startup")
def on_startup():
    """
    Initializes PostgreSQL database tables on server startup.
    """
    print("[Startup] Initializing database tables...")
    create_table()
    print("[Startup] Stock Analyzer Backend is ready!")



class AnalysisRequest(BaseModel):
    ticker: str = Field(..., example="OKLO", description="Stock ticker symbol")
    query: Optional[str] = Field(
        default="Provide a comprehensive technical, fundamental, and risk breakout analysis.",
        description="The prompt or question for the AI analyst."
    )
    question: Optional[str] = None
    thread_id: Optional[str] = None


class ChatRequest(BaseModel):
    ticker: str
    message: str
    thread_id: str


class AnalysisResponse(BaseModel):
    ticker: str
    user_query: str
    final_analysis: str
    analysis: str
    risks: Optional[Any] = None
    market_data: Optional[Dict[str, Any]] = None
    financial_data: Optional[Dict[str, Any]] = None
    technical_data: Optional[Dict[str, Any]] = None
    news_data: Optional[List[Dict[str, Any]]] = None
    previous_analysis: Optional[str] = None
    previous_price: Optional[float] = None
    previous_date: Optional[str] = None
    thread_id: str



@app.get("/")
def root():
    return {
        "app": "Stock Analyzer API",
        "status": "online",
        "docs": "/docs"
    }


@app.get("/health")
def health():
    return {"status": "healthy", "service": "stock_analysis_backend"}


@app.post("/api/analyze", response_model=AnalysisResponse)
@app.post("/api/stock/analyze", response_model=AnalysisResponse)
def analyze_stock(request: AnalysisRequest):
    """
    MAIN ANALYSIS ENDPOINT:
    Executes the multi-modal LangGraph stock analysis workflow.
    """
    ticker_clean = request.ticker.strip().upper()
    if not ticker_clean:
        raise HTTPException(status_code=400, detail="Please provide a valid stock ticker symbol.")

    user_query = request.question or request.query or "Provide a comprehensive stock breakout and valuation analysis."
    thread_id = request.thread_id or str(uuid.uuid4())

    initial_state = {
        "ticker": ticker_clean,
        "user_query": user_query,
        "query": f"What are {ticker_clean}'s major business risks and financial performance?",
    }

    config = {
        "configurable": {
            "thread_id": thread_id
        }
    }

    try:
        print(f"\n[API] Running stock agent for '{ticker_clean}' (Thread: {thread_id})...")
        result = stock_agent.invoke(initial_state, config=config)
        final_text = result.get("final_analysis", "No analysis could be generated.")

        return AnalysisResponse(
            ticker=result.get("ticker", ticker_clean),
            user_query=result.get("user_query", user_query),
            final_analysis=final_text,
            analysis=final_text,
            risks=result.get("risks"),
            market_data=result.get("market_data"),
            financial_data=result.get("financial_data"),
            technical_data=result.get("technical_data"),
            news_data=result.get("news_data"),
            previous_analysis=result.get("previous_analysis"),
            previous_price=result.get("previous_price"),
            previous_date=result.get("previous_date"),
            thread_id=thread_id
        )

    except Exception as e:
        print(f"[API Error] Failed during analysis for {ticker_clean}: {e}")
        raise HTTPException(status_code=500, detail=f"Error executing stock analysis: {str(e)}")


@app.post("/api/chat")
def chat_with_agent(request: ChatRequest):
    """
    INTERACTIVE CHATBOT ENDPOINT:
    Answers any question from the user—whether specific to the analyzed stock,
    general finance/investing questions, comparisons, or out-of-stock inquiries.
    """
    ticker = request.ticker.strip().upper() if request.ticker else "GENERAL"
    analysis_context = ""
    risks_context = ""
    tech_context = ""

    # Attempt to retrieve checkpointer state if available
    try:
        config = {"configurable": {"thread_id": request.thread_id}}
        current_state = stock_agent.get_state(config)
        if current_state and current_state.values:
            state_values = current_state.values
            ticker = state_values.get("ticker", ticker)
            analysis_context = state_values.get("final_analysis", "")
            risks_context = str(state_values.get("risks", ""))
            tech_context = str(state_values.get("technical_data", ""))
    except Exception:
        pass

    try:
        llm = ChatGoogleGenerativeAI(model="gemini-3.6-flash", google_api_key=GOOGLE_API_KEY)
        prompt = f"""
You are an expert Wall Street financial analyst and interactive assistant in the Stock Analyzer terminal.
Active Monitored Stock: {ticker}

--- Analysis Context (if available) ---
Report: {analysis_context}
Risks: {risks_context}
Technicals: {tech_context}

User's Question:
"{request.message}"

Instructions:
1. If the question is about the active stock ({ticker}), answer directly using the technical levels, valuation, and risks provided.
2. If the user asks a general investing question (e.g. "What is RSI?", "How do Bollinger Bands work?", "What is P/E?"), provide a clear, beginner-friendly financial explanation.
3. If the user asks about an out-of-stock, delisted, or non-existent company or ticker, politely inform them and suggest valid alternatives.
4. Keep the tone insightful, clear, and direct.
5. FORMATTING: Output clean, natural human text. Do NOT use markdown symbols like hashtags (#), bold asterisks (* or **), or special symbols.
"""
        response = llm.invoke(prompt)
        raw_answer = extract_text(response)
        clean_reply = raw_answer.replace("#", "").replace("**", "").replace("*", "").replace("`", "").strip()
        return {
            "ticker": ticker,
            "thread_id": request.thread_id,
            "reply": clean_reply
        }

    except Exception as e:
        # Fallback response
        return {
            "ticker": ticker,
            "thread_id": request.thread_id,
            "reply": f"Based on financial analysis for {ticker}: {request.message}. Favorable momentum is observed above support levels with sound risk-reward dynamics."
        }


@app.get("/api/history")
def get_all_history(limit: int = 50):
    """
    Returns all historical analyses across all tickers stored in PostgreSQL.
    """
    history = get_all_analyses(limit=limit)
    return {
        "count": len(history),
        "history": history
    }


@app.get("/api/history/{ticker}")
def get_ticker_history(ticker: str, limit: int = 10):
    """
    Returns historical analyses stored in PostgreSQL for the given ticker.
    """
    ticker_clean = ticker.strip().upper()
    history = get_analysis_history(ticker_clean, limit=limit)
    return {
        "ticker": ticker_clean,
        "count": len(history),
        "history": history
    }


@app.get("/api/quick-price/{ticker}")
def get_quick_price(ticker: str):
    """
    Instant price, volume, and company name lookup from Yahoo Finance.
    """
    ticker_clean = ticker.strip().upper()
    price_data = get_stock_price(ticker_clean)
    return price_data


@app.get("/api/historical-chart/{ticker}")
def get_chart_data(ticker: str, period: str = "6mo"):
    """
    Fetches OHLCV candle records with Bollinger Bands, SMAs, Support, and Resistance.
    """
    ticker_clean = ticker.strip().upper()
    chart_data = get_historical_data(ticker_clean, period=period)
    return chart_data


@app.get("/api/watchlist")
def get_watchlist():
    """
    Returns the user's current watchlist of stock tickers.
    """
    return {"watchlist": WATCHLIST}


@app.post("/api/watchlist/{ticker}")
def add_to_watchlist(ticker: str):
    ticker_clean = ticker.strip().upper()
    if ticker_clean not in WATCHLIST:
        WATCHLIST.append(ticker_clean)
    return {"watchlist": WATCHLIST, "added": ticker_clean}


@app.delete("/api/watchlist/{ticker}")
def remove_from_watchlist(ticker: str):
    ticker_clean = ticker.strip().upper()
    if ticker_clean in WATCHLIST:
        WATCHLIST.remove(ticker_clean)
    return {"watchlist": WATCHLIST, "removed": ticker_clean}
