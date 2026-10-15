import uuid
import asyncio
import json
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

# Import our compiled LangGraph stock analysis agent
from app.agent.graph import stock_agent

from app.memory.database import create_table, get_analysis_history, get_all_analyses
from app.tools.market_data import get_stock_price, get_historical_data, search_symbols
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

WATCHLIST = ["AAPL", "NVDA"]

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
    verdict: Optional[str] = None
    verdict_desc: Optional[str] = None
    short_term_strategy: Optional[str] = None
    long_term_strategy: Optional[str] = None
    future_outlook: Optional[str] = None
    bull_case: Optional[str] = None
    bear_case: Optional[str] = None


def extract_structured_sections(ticker: str, text: str, market_data: dict, tech_data: dict, fin_data: dict):
    """
    Extracts or dynamically synthesizes institutional analysis sections:
    Executive Recommendation, Short-Term Strategy, Long-Term Strategy,
    Future Outlook, Bull Case, and Bear Case.
    Guarantees no orphaned loading placeholders or contradictory claims.
    """
    m_data = market_data or {}
    t_data = tech_data or {}
    f_data = fin_data or {}
    
    price = m_data.get("price") or 0.0
    curr_sym = m_data.get("currency_symbol") or "$"
    support = t_data.get("support") or round(price * 0.94, 2)
    resistance = t_data.get("resistance") or round(price * 1.06, 2)
    s20 = t_data.get("sma20")
    s50 = t_data.get("sma50")
    rsi = t_data.get("rsi")

    # Determine objective quantitative verdict
    if s20 is not None and s50 is not None:
        if s20 > s50 and (rsi is not None and rsi >= 50 and rsi < 70):
            def_verdict = "BULLISH ACCUMULATION"
        elif s20 < s50:
            def_verdict = "CAUTIOUS / PULLBACK WATCH"
        elif rsi is not None and rsi <= 30:
            def_verdict = "OVERSOLD REBOUND WATCH"
        elif rsi is not None and rsi >= 70:
            def_verdict = "OVERBOUGHT CONSOLIDATION"
        else:
            def_verdict = "TECHNICAL CONSOLIDATION"
    elif price >= support:
        def_verdict = "HOLD / CONSOLIDATE"
    else:
        def_verdict = "SPECULATIVE / HIGH RISK"

    comp_name = f_data.get("company") or m_data.get("company") or ticker
    sector = f_data.get("sector") or "equity"
    pe = f_data.get("pe_ratio")
    pe_str = f"P/E valuation of {pe:.1f}x" if pe else "current valuation"

    def_short_strat = (
        f"Maintain disciplined risk stops near support floor at {curr_sym}{support}. "
        f"Target upside breakout resistance ceiling at {curr_sym}{resistance} on expanding volume for {comp_name}."
    )
    def_long_strat = (
        f"Audit capital structure leverage, operating cash generation, and gross margins across quarterly reports for {comp_name}. "
        f"Scale core position on sustained closes above the 50-day moving average ({curr_sym}{s50 if s50 else 'baseline'})."
    )
    def_future_outlook = (
        f"Monitor upcoming corporate earnings disclosures in the {sector} space, volume follow-through, and global liquidity trends for catalytic breakout momentum."
    )
    def_bull_case = (
        f"{comp_name}'s position in the {sector} space provides secular expansion upside. Support holding firmly near {curr_sym}{support} provides an asymmetric risk-reward entry toward upper channel resistance at {curr_sym}{resistance}."
    )
    def_bear_case = (
        f"Downside risk for {comp_name} centers on {pe_str} and sector macro pressures. A confirmed breakdown below support ({curr_sym}{support}) could trigger multiple contraction."
    )

    clean_text = text or ""
    import re
    sections = re.split(r'\n(?=[0-9]+\.\s+[A-Za-z]+|\b[A-Z\s]{4,}:)', clean_text)
    
    verdict = def_verdict
    verdict_desc = clean_text[:320].strip() if clean_text else f"Real-time technical tracking active for {ticker} at {curr_sym}{price}."
    short_term_strategy = def_short_strat
    long_term_strategy = def_long_strat
    future_outlook = def_future_outlook
    bull_case = def_bull_case
    bear_case = def_bear_case

    for sec in sections:
        sec_lower = sec.lower()
        if "executive summary" in sec_lower:
            lines = [l.strip() for l in sec.split('\n') if l.strip() and not l.strip().startswith(('1.', '#'))]
            if lines:
                verdict_desc = " ".join(lines)[:350]
        elif "technical trends" in sec_lower or "breakout levels" in sec_lower:
            lines = [l.strip() for l in sec.split('\n') if l.strip() and not l.strip().startswith(('4.', '#'))]
            if lines:
                short_term_strategy = " ".join(lines)[:350]
        elif "valuation assessment" in sec_lower or "financial health" in sec_lower:
            lines = [l.strip() for l in sec.split('\n') if l.strip() and not l.strip().startswith(('2.', '3.', '#'))]
            if lines:
                long_term_strategy = " ".join(lines)[:350]
        elif "key strengths" in sec_lower or "bull" in sec_lower:
            lines = [l.strip() for l in sec.split('\n') if l.strip() and not l.strip().startswith(('5.', '#'))]
            if lines:
                bull_case = " ".join(lines)[:350]
        elif "downside risks" in sec_lower or "bear" in sec_lower:
            lines = [l.strip() for l in sec.split('\n') if l.strip() and not l.strip().startswith(('6.', '#'))]
            if lines:
                bear_case = " ".join(lines)[:350]
        elif "recommendation" in sec_lower or "final strategy" in sec_lower:
            lines = [l.strip() for l in sec.split('\n') if l.strip() and not l.strip().startswith(('8.', '#'))]
            if lines:
                rec_text = " ".join(lines)
                if any(k in rec_text.lower() for k in ["strong buy", "aggressive buy"]):
                    verdict = "STRONG BUY"
                elif any(k in rec_text.lower() for k in ["buy", "accumulate", "outperform"]):
                    verdict = "BUY / ACCUMULATE"
                elif any(k in rec_text.lower() for k in ["sell", "reduce", "underperform"]):
                    verdict = "REDUCE / TAKE PROFIT"
                elif any(k in rec_text.lower() for k in ["hold", "neutral", "cautious"]):
                    verdict = "HOLD / CAUTIOUS"
                future_outlook = rec_text[:350]

    return {
        "verdict": verdict,
        "verdict_desc": verdict_desc,
        "short_term_strategy": short_term_strategy,
        "long_term_strategy": long_term_strategy,
        "future_outlook": future_outlook,
        "bull_case": bull_case,
        "bear_case": bear_case
    }


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


@app.get("/api/fundamentals/{ticker}")
def get_fundamentals(ticker: str):
    """
    Fast dedicated endpoint for company fundamental metrics + key technical indicators.
    Called in parallel with price/chart fetch so fundamentals never show N/A
    even when the full AI multi-agent pipeline times out or is rate-limited.
    """
    ticker_clean = ticker.strip().upper()
    result = {}

    try:
        from app.tools.financial_data import get_financial_metrics
        fin = get_financial_metrics(ticker_clean)
        result.update(fin)
    except Exception as e:
        print(f"[Fundamentals] financial_data error for {ticker_clean}: {e}")

    try:
        from app.tools.technical import technical_analysis
        tech = technical_analysis(ticker_clean)
        if tech:
            result["sma20"] = tech.get("sma20")
            result["sma50"] = tech.get("sma50")
            result["sma150"] = tech.get("sma150")
            result["sma200"] = tech.get("sma200")
            result["rsi"] = tech.get("rsi")
            result["bb_upper"] = tech.get("bb_upper")
            result["bb_lower"] = tech.get("bb_lower")
            result["macd"] = tech.get("macd")
            result["macd_signal"] = tech.get("macd_signal")
            result["support"] = tech.get("support")
            result["resistance"] = tech.get("resistance")
    except Exception as e:
        print(f"[Fundamentals] technical_analysis error for {ticker_clean}: {e}")

    return {"ticker": ticker_clean, "data": result}


@app.get("/api/analyze/stream/{ticker}")
async def analyze_stock_stream(ticker: str):
    """
    SSE Streaming Analysis Endpoint.
    Progressively emits events as each agent phase completes:
      market_data → technical_data + financial_data → news_data → AI text chunks → sections → [DONE]
    Eliminates the 25-second timeout entirely — each phase appears on screen as it's ready.
    """
    ticker_clean = ticker.strip().upper()

    async def event_stream():
        thread_id = str(uuid.uuid4())
        try:
            # ── Phase 1: Validate ticker & live price ──────────────────────────────
            yield f"data: {json.dumps({'type': 'progress', 'step': 'market', 'pct': 8, 'message': f'Connecting to live exchange for {ticker_clean}...'})}"
            yield "\n\n"

            price_data = await asyncio.to_thread(get_stock_price, ticker_clean)
            if "error" in price_data:
                yield f"data: {json.dumps({'type': 'error', 'message': f'Ticker not found: {ticker_clean}'})}"
                yield "\n\n"
                return
            yield f"data: {json.dumps({'type': 'market_data', 'data': price_data})}"
            yield "\n\n"

            # ── Phase 2: Technical + Fundamentals in parallel ──────────────────────
            yield f"data: {json.dumps({'type': 'progress', 'step': 'technical', 'pct': 28, 'message': 'Computing technical indicators & financial metrics...'})}"
            yield "\n\n"

            from app.tools.technical import technical_analysis
            from app.tools.financial_data import get_financial_metrics

            tech_data, fin_data = await asyncio.gather(
                asyncio.to_thread(technical_analysis, ticker_clean),
                asyncio.to_thread(get_financial_metrics, ticker_clean)
            )

            yield f"data: {json.dumps({'type': 'technical_data', 'data': tech_data})}"
            yield "\n\n"
            yield f"data: {json.dumps({'type': 'financial_data', 'data': fin_data})}"
            yield "\n\n"

            # ── Phase 3: News ──────────────────────────────────────────────────────
            yield f"data: {json.dumps({'type': 'progress', 'step': 'news', 'pct': 48, 'message': 'Fetching breaking market news...'})}"
            yield "\n\n"

            from app.tools.news import get_stock_news
            news_data = await asyncio.to_thread(get_stock_news, ticker_clean)
            yield f"data: {json.dumps({'type': 'news_data', 'data': news_data or []})}"
            yield "\n\n"

            # ── Phase 4: LLM streaming synthesis ──────────────────────────────────
            yield f"data: {json.dumps({'type': 'progress', 'step': 'ai', 'pct': 60, 'message': 'AI analyst synthesizing investment thesis...'})}"
            yield "\n\n"

            curr_sym = price_data.get("currency_symbol", "$")
            price    = price_data.get("price", 0)
            company  = (fin_data or {}).get("company") or ticker_clean
            sector   = (fin_data or {}).get("sector") or "Equity"
            sma20    = (tech_data or {}).get("sma20")
            sma50    = (tech_data or {}).get("sma50")
            rsi_val  = (tech_data or {}).get("rsi")
            support  = (tech_data or {}).get("support") or round(price * 0.94, 2)
            resist   = (tech_data or {}).get("resistance") or round(price * 1.06, 2)
            pe       = (fin_data or {}).get("pe_ratio")
            margin   = (fin_data or {}).get("profit_margin")
            roe_val  = (fin_data or {}).get("roe")

            pe_str     = f"P/E {pe:.1f}x" if pe else "P/E: N/A"
            margin_str = f"Profit Margin {margin*100:.1f}%" if margin else "Profit Margin: N/A"
            roe_str    = f"ROE {roe_val*100:.1f}%" if roe_val else "ROE: N/A"
            sma_str    = (f"SMA 20: {curr_sym}{sma20} vs SMA 50: {curr_sym}{sma50}" if sma20 and sma50
                          else "Moving averages: data loading")

            prompt = f"""You are an elite institutional equity analyst. Write a concise investment briefing for {ticker_clean} ({company}), a {sector} company.

LIVE DATA:
- Price: {curr_sym}{price} | {sma_str} | RSI: {rsi_val or 'N/A'}
- Support: {curr_sym}{support} | Resistance: {curr_sym}{resist}
- {pe_str} | {margin_str} | {roe_str}

Write exactly these 8 numbered sections (plain text, no markdown or bullet symbols):
1. EXECUTIVE SUMMARY: 2-sentence current positioning verdict.
2. TECHNICAL TRENDS: Interpret the SMA relationship and RSI signal.
3. VALUATION ASSESSMENT: Comment on ratios relative to the sector.
4. KEY STRENGTHS (BULL CASE): 2 specific upside reasons.
5. DOWNSIDE RISKS (BEAR CASE): 2 specific risks to monitor.
6. SHORT-TERM STRATEGY: Actionable guidance with {curr_sym} price targets.
7. LONG-TERM THESIS: 1-sentence conviction statement.
8. FINAL RECOMMENDATION: Exactly one of: STRONG BUY / BUY / ACCUMULATE / HOLD / REDUCE / SELL

CRITICAL: Always use {curr_sym} for every price. Keep total output under 380 words."""

            llm = ChatGoogleGenerativeAI(
                model="gemini-2.0-flash",
                google_api_key=GOOGLE_API_KEY,
                max_output_tokens=700,
                streaming=True
            )

            full_text = ""
            try:
                async for chunk in llm.astream(prompt):
                    # LangChain streaming chunks have .content attribute
                    chunk_text = chunk.content if hasattr(chunk, "content") else str(chunk)
                    if chunk_text:
                        full_text += chunk_text
                        yield f"data: {json.dumps({'type': 'text_chunk', 'text': chunk_text})}"
                        yield "\n\n"
            except Exception as llm_err:
                print(f"[SSE-LLM] {ticker_clean}: {llm_err}")
                yield f"data: {json.dumps({'type': 'progress', 'step': 'fallback', 'pct': 85, 'message': 'AI quota reached — generating quantitative analysis...'})}"
                yield "\n\n"

            # ── Phase 5: Structure sections from full text ─────────────────────────
            yield f"data: {json.dumps({'type': 'progress', 'step': 'sections', 'pct': 92, 'message': 'Structuring final analysis sections...'})}"
            yield "\n\n"

            sections = extract_structured_sections(
                ticker_clean, full_text, price_data,
                tech_data if isinstance(tech_data, dict) else None,
                fin_data  if isinstance(fin_data,  dict) else None
            )

            yield f"data: {json.dumps({'type': 'sections', 'data': sections})}"
            yield "\n\n"
            yield f"data: {json.dumps({'type': 'complete', 'thread_id': thread_id, 'pct': 100, 'final_analysis': full_text})}"
            yield "\n\n"
            yield "data: [DONE]\n\n"

        except Exception as e:
            print(f"[SSE Error] {ticker_clean}: {e}")
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}"
            yield "\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*"
        }
    )


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

    # Fast preliminary ticker verification via market data
    price_check = get_stock_price(ticker_clean)
    if "error" in price_check:
        raise HTTPException(
            status_code=404, 
            detail=f"Stock ticker '{ticker_clean}' was not found on global financial exchanges or is currently delisted. Please verify the symbol."
        )

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

        market_res = result.get("market_data", price_check)
        tech_res = result.get("technical_data")
        fin_res = result.get("financial_data")
        sections = extract_structured_sections(ticker_clean, final_text, market_res, tech_res, fin_res)

        return AnalysisResponse(
            ticker=result.get("ticker", ticker_clean),
            user_query=result.get("user_query", user_query),
            final_analysis=final_text,
            analysis=final_text,
            risks=result.get("risks"),
            market_data=market_res,
            financial_data=fin_res,
            technical_data=tech_res,
            news_data=result.get("news_data"),
            previous_analysis=result.get("previous_analysis"),
            previous_price=result.get("previous_price"),
            previous_date=result.get("previous_date"),
            thread_id=thread_id,
            verdict=sections["verdict"],
            verdict_desc=sections["verdict_desc"],
            short_term_strategy=sections["short_term_strategy"],
            long_term_strategy=sections["long_term_strategy"],
            future_outlook=sections["future_outlook"],
            bull_case=sections["bull_case"],
            bear_case=sections["bear_case"]
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"[API Error] AI agent invocation failed for {ticker_clean}: {e}. Generating resilient quantitative analysis fallback.")
        currency_symbol = price_check.get("currency_symbol", "$")
        current_price = price_check.get("price", 0)
        
        try:
            from app.tools.technical import technical_analysis
            tech_data = technical_analysis(ticker_clean)
        except Exception:
            tech_data = None
            
        try:
            from app.tools.financial_data import get_financial_metrics
            fin_data = get_financial_metrics(ticker_clean)
        except Exception:
            fin_data = None

        support = tech_data.get("support") if tech_data else round(current_price * 0.94, 2)
        resistance = tech_data.get("resistance") if tech_data else round(current_price * 1.06, 2)
        rsi = tech_data.get("rsi") if tech_data else "N/A"
        sma50 = tech_data.get("sma50") if tech_data else "N/A"

        fallback_report = f"""Executive Summary & Overview
Real-time market quote verified for {ticker_clean} at {currency_symbol}{current_price:.2f}. While the multi-agent generative language model pipeline encountered an API throughput, rate-limit, or timeout condition, live quantitative indicators and exchange data are fully active.

Technical Trends & Breakout Levels
Price is trading within an active technical envelope with support floor at {currency_symbol}{support} and resistance ceiling at {currency_symbol}{resistance}. 14-day RSI stands at {rsi}, and SMA 50 is at {currency_symbol}{sma50}.

Quantitative Recommendation & Risk Strategy
Maintain disciplined risk stops near the support level ({currency_symbol}{support}). Upward momentum favors consolidation towards resistance at {currency_symbol}{resistance}. For turnaround or distressed equities, monitor cash flow generation and debt leverage before committing long-term capital."""

        fallback_risks = f"""1. Volatility Risk: Price fluctuations near baseline support floor ({currency_symbol}{support}).
2. Financial Health: For distressed turnaround stocks, evaluate debt sustainability and negative equity covenants.
3. System Fallback: Multi-agent synthesis operated on quantitative mode due to API throughput / rate limits."""

        sections = extract_structured_sections(ticker_clean, fallback_report, price_check, tech_data, fin_data)

        try:
            from app.tools.news import get_stock_news
            live_news = get_stock_news(ticker_clean)
        except Exception:
            live_news = []

        return AnalysisResponse(
            ticker=ticker_clean,
            user_query=user_query,
            final_analysis=fallback_report,
            analysis=fallback_report,
            risks=fallback_risks,
            market_data=price_check,
            financial_data=fin_data,
            technical_data=tech_data,
            news_data=live_news,
            previous_analysis=None,
            previous_price=None,
            previous_date=None,
            thread_id=thread_id,
            verdict=sections["verdict"],
            verdict_desc=sections["verdict_desc"],
            short_term_strategy=sections["short_term_strategy"],
            long_term_strategy=sections["long_term_strategy"],
            future_outlook=sections["future_outlook"],
            bull_case=sections["bull_case"],
            bear_case=sections["bear_case"]
        )


@app.get("/api/news/{ticker}")
def get_news_endpoint(ticker: str):
    """
    Dedicated endpoint to retrieve live breaking market news specifically targeted to the requested stock ticker.
    Guarantees active query parameters without generic packages or cross-stock leaks.
    """
    ticker_clean = ticker.strip().upper()
    try:
        from app.tools.news import get_stock_news
        articles = get_stock_news(ticker_clean)
        return {
            "ticker": ticker_clean,
            "news": articles or []
        }
    except Exception as e:
        print(f"[News Endpoint Error] {e}")
        return {
            "ticker": ticker_clean,
            "news": []
        }


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

    currency_symbol = "₹" if ticker.endswith(".NS") or ticker.endswith(".BO") else ("£" if ticker.endswith(".L") else ("€" if any(ticker.endswith(e) for e in [".DE", ".PA", ".AS", ".MI"]) else "$"))

    try:
        llm = ChatGoogleGenerativeAI(
            model="gemini-3.6-flash",
            google_api_key=GOOGLE_API_KEY,
            max_output_tokens=600
        )
        prompt = f"""
You are an expert Wall Street financial analyst and interactive assistant in the Stock Analyzer terminal.
Active Monitored Stock: {ticker}
Native Currency Symbol: {currency_symbol}

--- Analysis Context (if available) ---
Report: {analysis_context}
Risks: {risks_context}
Technicals: {tech_context}

User's Question:
"{request.message}"

Instructions:
1. If the question is about the active stock ({ticker}), answer directly using the technical levels, valuation, and risks provided.
2. CURRENCY ACCURACY: Always use the native currency symbol ({currency_symbol}) for {ticker}. For instance, Indian stocks (NSE/BSE like RPOWER.NS, TATAMOTORS.NS) trade in Indian Rupees (₹) and must NEVER be quoted in USD ($).
3. If the user asks a general investing question (e.g. "What is RSI?", "How do Bollinger Bands work?", "What is P/E?"), provide a clear, beginner-friendly financial explanation.
4. If the user asks about an out-of-stock, delisted, or non-existent company or ticker, politely inform them and suggest valid alternatives.
5. Keep the tone insightful, clear, and direct.
6. FORMATTING: Output clean, natural human text. Do NOT use markdown symbols like hashtags (#), bold asterisks (* or **), or special symbols.
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
        print(f"[Chat Error] {e}")
        raise HTTPException(status_code=500, detail=f"Error generating analyst response: {str(e)}")



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


@app.get("/api/search-symbols")
def search_stock_symbols(q: str = "", limit: int = 8):
    """
    Real-time stock symbol and company name autocomplete search across global exchanges.
    """
    if not q.strip():
        return {"query": q, "results": []}
    results = search_symbols(q.strip(), limit=limit)
    return {
        "query": q,
        "count": len(results),
        "results": results
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
