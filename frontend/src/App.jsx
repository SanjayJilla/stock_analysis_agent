import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  TrendingUp,
  History,
  Bookmark,
  Search,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  ShieldAlert,
  BarChart3,
  Newspaper,
  Layers,
  Send,
  ExternalLink,
  Info,
  DollarSign,
  TrendingDown,
  ChevronRight,
  CheckCircle2,
  Sliders,
  MessageSquare,
  Activity,
  Download,
  Scale
} from "lucide-react";
import "./App.css";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");

// Global currency mapping for multi-exchange stocks
export const CURRENCY_SYMBOLS = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CAD: "CA$",
  AUD: "A$",
  CNY: "¥",
  HKD: "HK$",
  SGD: "S$",
  CHF: "CHF",
  KRW: "₩",
  BRL: "R$",
  ZAR: "R",
  SEK: "kr",
  NOK: "kr",
  DKK: "kr",
  RUB: "₽",
  TWD: "NT$",
  NZD: "NZ$",
};

export const detectCurrency = (ticker = "") => {
  const sym = (ticker || "").toUpperCase().trim();
  if (sym.endsWith(".NS") || sym.endsWith(".BO")) return { code: "INR", symbol: "₹" };
  if (sym.endsWith(".L")) return { code: "GBP", symbol: "£" };
  if (sym.endsWith(".DE") || sym.endsWith(".PA") || sym.endsWith(".AS") || sym.endsWith(".MI") || sym.endsWith(".MC") || sym.endsWith(".BR")) return { code: "EUR", symbol: "€" };
  if (sym.endsWith(".TO") || sym.endsWith(".V")) return { code: "CAD", symbol: "CA$" };
  if (sym.endsWith(".AX")) return { code: "AUD", symbol: "A$" };
  if (sym.endsWith(".T")) return { code: "JPY", symbol: "¥" };
  if (sym.endsWith(".HK")) return { code: "HKD", symbol: "HK$" };
  if (sym.endsWith(".SS") || sym.endsWith(".SZ")) return { code: "CNY", symbol: "¥" };
  return { code: "USD", symbol: "$" };
};

// Helper to extract or synthesize complete structured sections
export const synthesizeSectionsFromData = (data, priceData, currSymbol = "$") => {
  const p = data?.market_data?.price || priceData?.price || 0;
  const t = data?.technical_data || {};
  const s = t.support || Number((p * 0.94).toFixed(2));
  const r = t.resistance || Number((p * 1.06).toFixed(2));
  const s20 = t.sma20;
  const s50 = t.sma50;
  const rsi = t.rsi;

  let verdict = data?.verdict;
  let verdict_desc = data?.verdict_desc;
  let short_term_strategy = data?.short_term_strategy;
  let long_term_strategy = data?.long_term_strategy;
  let future_outlook = data?.future_outlook;
  let bull_case = data?.bull_case;
  let bear_case = data?.bear_case;

  if (!verdict || verdict === "ANALYZING LIVE SIGNALS" || verdict === "EVALUATING LIVE SIGNALS") {
    if (s20 !== undefined && s50 !== undefined && s20 !== null && s50 !== null) {
      if (s20 > s50 && (rsi >= 50 && rsi < 70)) verdict = "BULLISH ACCUMULATION";
      else if (s20 < s50) verdict = "CAUTIOUS / PULLBACK WATCH";
      else if (rsi <= 30) verdict = "OVERSOLD REBOUND WATCH";
      else if (rsi >= 70) verdict = "OVERBOUGHT CONSOLIDATION";
      else verdict = "TECHNICAL CONSOLIDATION";
    } else if (p >= s) {
      verdict = "HOLD / CONSOLIDATE";
    } else {
      verdict = "SPECULATIVE / HIGH RISK";
    }
  }

  if (!verdict_desc || verdict_desc.includes("Connecting to live") || verdict_desc.includes("ANALYZING LIVE")) {
    verdict_desc = data?.final_analysis
      ? data.final_analysis.slice(0, 320).replace(/^[0-9.]+\s*/, "").trim()
      : `Real-time quote active at ${currSymbol}${p.toFixed(2)}. Technical channels defined between Support (${currSymbol}${s.toFixed(2)}) and Resistance (${currSymbol}${r.toFixed(2)}).`;
  }

  if (!short_term_strategy || short_term_strategy.includes("Evaluating order book")) {
    short_term_strategy = `Establish risk stops near support floor at ${currSymbol}${s.toFixed(2)}. Look for confirmation towards upper resistance band at ${currSymbol}${r.toFixed(2)} on expanding volume.`;
  }

  if (!long_term_strategy || long_term_strategy.includes("Auditing balance sheet")) {
    const s50Str = (s50 !== undefined && s50 !== null) ? `${currSymbol}${s50.toFixed(2)}` : "50-day average";
    long_term_strategy = `Audit balance sheet cash reserves, operational margins, and debt leverage across fiscal quarters. Build core positions on sustained closes above ${s50Str}.`;
  }

  if (!future_outlook || future_outlook.includes("Synthesizing macro catalysts")) {
    future_outlook = `Key catalysts include upcoming quarterly earnings releases, sector capital rotation, and institutional volume follow-through.`;
  }

  const compName = data?.financial_data?.company || priceData?.company || "The company";
  const sector = data?.financial_data?.sector || "equity";

  if (!bull_case) {
    bull_case = `${compName}'s market positioning in ${sector} provides secular expansion upside. Support floor holding firmly at ${currSymbol}${s.toFixed(2)} defines an asymmetric risk-reward entry targeting breakout resistance near ${currSymbol}${r.toFixed(2)}.`;
  }

  if (!bear_case) {
    bear_case = `Downside risk for ${compName} centers on sector volatility and multiple compression. A confirmed breakdown below support floor (${currSymbol}${s.toFixed(2)}) exposes downside re-testing risk.`;
  }

  return {
    verdict,
    verdict_desc,
    short_term_strategy,
    long_term_strategy,
    future_outlook,
    bull_case,
    bear_case
  };
};

// Safe initial state for dynamic stock analysis
const INITIAL_STOCK_STATE = {
  company: "Apple Inc.",
  currency: "USD",
  currency_symbol: "$",
  sector: "Technology",
  industry: "Consumer Electronics",
  price: 305.93,
  open: 306.00,
  high: 307.49,
  low: 304.30,
  volume: 28186700,
  support: 290.50,
  resistance: 334.00,
  sma20: 318.22,
  sma50: 308.95,
  sma150: 294.10,
  sma200: 279.99,
  rsi: 58.5,
  bb_upper: 332.10,
  bb_lower: 294.50,
  market_cap: 4464797000000,
  pe_ratio: 34.96,
  forward_pe: 32.18,
  price_to_book: 41.57,
  operating_margin: 0.326,
  profit_margin: 0.276,
  roe: 1.487,
  revenue_growth: 0.164,
  total_revenue: 466822000000,
  free_cash_flow: 107721000000,
  debt_to_equity: 78.45,
  verdict: "MODERATE BUY / ACCUMULATE",
  verdict_desc: "Apple demonstrates exceptional free cash flow generation and resilient ecosystem expansion. Technical momentum remains supported above the 50-day moving average corridor.",
  bull_case: "Installed device ecosystem exceeding 2.2 billion active devices drives recurring, high-margin Services revenue with durable pricing power.",
  bear_case: "Hardware upgrade cycle deceleration in competitive international markets and premium valuation multiples relative to historical 10-year medians.",
  short_term_strategy: "Look for consolidation entries near support floor ($290.50). Next breakout target aligns with upper resistance band near $334.00.",
  long_term_strategy: "Hold core position anchored by Apple Silicon upgrades, expanding high-margin Services revenue, and continuous share repurchase programs.",
  future_outlook: "Key catalysts include AI integration across the iOS ecosystem, next-generation device cycles, and expanding recurring services gross margins.",
  risks_text: "1. Valuation Multiples: Elevated P/E (34.96x) requires sustained high-single-digit EPS expansion. 2. Hardware Replacement Cycles: Lengthening smartphone replacement cycles in mature markets.",
  news: []
};

export default function App() {
  const [ticker, setTicker] = useState("AAPL");
  const [searchInput, setSearchInput] = useState("AAPL");
  const [activeTab, setActiveTab] = useState("dashboard"); // 'dashboard' | 'history' | 'watchlist'
  
  const [period, setPeriod] = useState("6M");
  const [showBollinger, setShowBollinger] = useState(true);
  const [showSMA50, setShowSMA50] = useState(true);
  const [showLevels, setShowLevels] = useState(true);

  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState("");
  const [aiNotice, setAiNotice] = useState("");

  // Live 1-second real-time market clock
  const [liveTime, setLiveTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Analysis & Chart State - 100% Dynamic from Backend
  const [activeStock, setActiveStock] = useState(INITIAL_STOCK_STATE);
  const [chartRecords, setChartRecords] = useState([]);
  const [hoverIndex, setHoverIndex] = useState(null);

  // Dynamic currency symbol & code for active stock
  const detectedCurrency = detectCurrency(ticker);
  const currSymbol = activeStock?.currency_symbol || (activeStock?.currency ? (CURRENCY_SYMBOLS[activeStock.currency.toUpperCase()] || activeStock.currency) : detectedCurrency.symbol) || "$";
  const currCode = activeStock?.currency || detectedCurrency.code || "USD";
  
  // Initialize history from localStorage immediately so history is never lost
  const [historyList, setHistoryList] = useState(() => {
    try {
      const cached = localStorage.getItem("stock_terminal_history_v2");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [watchlist, setWatchlist] = useState(["AAPL", "NVDA"]);

  // Sync history with backend PostgreSQL on mount
  const fetchAndSyncHistory = async (targetTicker = null) => {
    try {
      const url = targetTicker 
        ? `${API_BASE_URL}/api/history/${targetTicker}` 
        : `${API_BASE_URL}/api/history`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const serverHistory = data.history || [];
        if (serverHistory.length > 0) {
          setHistoryList((prev) => {
            // Merge server and local history uniquely by ID or timestamp+ticker
            const combined = [...serverHistory];
            prev.forEach((localItem) => {
              const exists = combined.some(
                (s) => s.id === localItem.id || (s.ticker === localItem.ticker && s.created_at === localItem.created_at)
              );
              if (!exists) combined.push(localItem);
            });
            // Sort newest first
            combined.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
            try {
              localStorage.setItem("stock_terminal_history_v2", JSON.stringify(combined.slice(0, 50)));
            } catch {}
            return combined;
          });
        }
      }
    } catch (e) {
      // Offline fallback: historyList is already loaded from localStorage
    }
  };

  useEffect(() => {
    fetchAndSyncHistory();
  }, []);

  // Helper to record history locally & state
  const saveToLocalHistory = (entry) => {
    if (!entry || !entry.ticker) return;
    setHistoryList((prev) => {
      // Remove identical duplicate IDs or same-minute duplicates
      const filtered = prev.filter(
        (item) => item.id !== entry.id && !(item.ticker === entry.ticker && item.user_query === entry.user_query && item.created_at === entry.created_at)
      );
      const updated = [entry, ...filtered].slice(0, 50);
      try {
        localStorage.setItem("stock_terminal_history_v2", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const clearAllHistory = () => {
    setHistoryList([]);
    try {
      localStorage.removeItem("stock_terminal_history_v2");
    } catch {}
  };

  // Live Autocomplete Suggestions
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchWrapRef = useRef(null);

  // Race-condition guards: each loadStock() gets a unique ID;
  // any async callback that fires after a newer load started is discarded.
  const currentLoadIdRef = useRef(0);
  const aiEventSourceRef = useRef(null);

  // SSE streaming state
  const [streamingText, setStreamingText] = useState("");
  const [aiProgress, setAiProgress] = useState(null); // { step, pct, message }

  // Debounced global ticker and company name search
  useEffect(() => {
    const trimmed = searchInput.trim();
    if (!trimmed || trimmed.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/search-symbols?q=${encodeURIComponent(trimmed)}&limit=6`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.results || []);
        }
      } catch {}
    }, 200);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  // Chat State
  const [chatMessages, setChatMessages] = useState([
    {
      role: "assistant",
      text: "Hello! I am your AI stock analyst. Ask me anything about valuation, breakouts, risks, or whether to invest in OKLO !"
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatLogRef = useRef(null);

  // Auto-scroll ONLY inside the chat box container when user actively chats
  const scrollChatToBottom = () => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  };

  // Load live stock data directly from FastAPI backend and LangGraph multi-agent
  const loadStock = async (symbolToLoad = ticker, selectedPeriod = period) => {
    const symbol = symbolToLoad.trim().toUpperCase();
    if (!symbol) return;

    // Cancel any in-flight AI SSE stream from a previous loadStock call
    if (aiEventSourceRef.current) {
      aiEventSourceRef.current.close();
      aiEventSourceRef.current = null;
    }

    // Stamp this load so stale async callbacks can self-discard
    const thisLoadId = ++currentLoadIdRef.current;

    setStreamingText("");
    setAiProgress(null);

    window.scrollTo({ top: 0, behavior: "instant" });
    setSearchInput(symbol);
    setError("");
    setAiNotice("");
    setLoading(true);

    try {
      // SOLUTION 1: Fetch real-time market quote, historical chart, news, AND fundamentals IN PARALLEL
      const [priceRes, chartRes, newsRes, fundRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/quick-price/${encodeURIComponent(symbol)}`),
        fetch(`${API_BASE_URL}/api/historical-chart/${encodeURIComponent(symbol)}?period=${selectedPeriod.toLowerCase()}`),
        fetch(`${API_BASE_URL}/api/news/${encodeURIComponent(symbol)}`).catch(() => null),
        fetch(`${API_BASE_URL}/api/fundamentals/${encodeURIComponent(symbol)}`).catch(() => null)
      ]);

      const priceData = priceRes.ok ? await priceRes.json() : null;

      if (!priceData || priceData.error || !priceData.price) {
        setError(`No stock or company found for symbol "${symbol}". Please check the spelling or enter a valid publicly traded stock symbol (e.g. AAPL, NVDA, MSFT, TSLA, TATAMOTORS.NS, GOOGL).`);
        setLoading(false);
        return;
      }

      const verifiedTicker = priceData.ticker || symbol;
      setTicker(verifiedTicker);

      // Extract latest SMA values from chart data so they render immediately (not after AI)
      let chartSma20 = null;
      let chartSma50 = null;
      let chartSma150 = null;
      let chartSma200 = null;
      if (chartRes.ok) {
        const chartJson = await chartRes.json();
        if (chartJson.records && chartJson.records.length > 0) {
          setChartRecords(chartJson.records);
          // Use last record's SMA values — these are live computed from yfinance history
          const lastRecord = chartJson.records[chartJson.records.length - 1];
          chartSma20 = lastRecord?.sma20 ?? null;
          chartSma50 = lastRecord?.sma50 ?? null;
        }
      }

      // Parse pre-fetched fundamentals (PE, ROE, margins, etc.)
      let prefetchedFundamentals = {};
      if (fundRes && fundRes.ok) {
        try {
          const fundJson = await fundRes.json();
          if (fundJson.data && typeof fundJson.data === "object") {
            prefetchedFundamentals = fundJson.data;
            // Override chart SMAs with technical_analysis values if available (more precise)
            if (prefetchedFundamentals.sma20 != null) chartSma20 = prefetchedFundamentals.sma20;
            if (prefetchedFundamentals.sma50 != null) chartSma50 = prefetchedFundamentals.sma50;
            if (prefetchedFundamentals.sma150 != null) chartSma150 = prefetchedFundamentals.sma150;
            if (prefetchedFundamentals.sma200 != null) chartSma200 = prefetchedFundamentals.sma200;
          }
        } catch {}
      }

      let instantNews = [];
      if (newsRes && newsRes.ok) {
        try {
          const newsJson = await newsRes.json();
          if (Array.isArray(newsJson.news)) {
            instantNews = newsJson.news;
          }
        } catch {}
      }

      const detectedCurr = detectCurrency(verifiedTicker);
      const pCurrCode = priceData.currency || detectedCurr.code;
      const pCurrSymbol = priceData.currency_symbol || CURRENCY_SYMBOLS[pCurrCode] || detectedCurr.symbol;

      // Helper function to synthesize quantitative fallback if AI pipeline is rate-limited, times out, or fails
      const applyQuantitativeFallback = (noticeText = "") => {
        const price = priceData.price || 0;
        const prefSupport = prefetchedFundamentals.support;
        const prefResistance = prefetchedFundamentals.resistance;
        const support = prefSupport ?? Number((price * 0.94).toFixed(2));
        const resistance = prefResistance ?? Number((price * 1.06).toFixed(2));
        const parsed = synthesizeSectionsFromData(
          { technical_data: prefetchedFundamentals, financial_data: prefetchedFundamentals },
          priceData,
          pCurrSymbol
        );
        setActiveStock((prev) => ({
          ...prev,
          // Apply all pre-fetched fundamentals so metrics never show N/A in fallback
          pe_ratio: prefetchedFundamentals.pe_ratio ?? prev.pe_ratio,
          forward_pe: prefetchedFundamentals.forward_pe ?? prev.forward_pe,
          price_to_book: prefetchedFundamentals.price_to_book ?? prev.price_to_book,
          operating_margin: prefetchedFundamentals.operating_margin ?? prev.operating_margin,
          profit_margin: prefetchedFundamentals.profit_margin ?? prev.profit_margin,
          roe: prefetchedFundamentals.roe ?? prev.roe,
          revenue_growth: prefetchedFundamentals.revenue_growth ?? prev.revenue_growth,
          debt_to_equity: prefetchedFundamentals.debt_to_equity ?? prev.debt_to_equity,
          total_revenue: prefetchedFundamentals.total_revenue ?? prev.total_revenue,
          free_cash_flow: prefetchedFundamentals.free_cash_flow ?? prev.free_cash_flow,
          market_cap: prefetchedFundamentals.market_cap ?? priceData.market_cap ?? prev.market_cap,
          sma20: chartSma20 ?? prev.sma20,
          sma50: chartSma50 ?? prev.sma50,
          sma150: chartSma150 ?? prev.sma150,
          sma200: chartSma200 ?? prev.sma200,
          rsi: prefetchedFundamentals.rsi ?? prev.rsi,
          bb_upper: prefetchedFundamentals.bb_upper ?? prev.bb_upper,
          bb_lower: prefetchedFundamentals.bb_lower ?? prev.bb_lower,
          macd: prefetchedFundamentals.macd ?? prev.macd,
          macd_signal: prefetchedFundamentals.macd_signal ?? prev.macd_signal,
          support,
          resistance,
          news: instantNews,
          verdict: parsed.verdict,
          verdict_desc: parsed.verdict_desc,
          short_term_strategy: parsed.short_term_strategy,
          long_term_strategy: parsed.long_term_strategy,
          future_outlook: parsed.future_outlook,
          bull_case: parsed.bull_case,
          bear_case: parsed.bear_case,
          risks_text: `1. Volatility Risk: Price fluctuations near support floor (${pCurrSymbol}${support.toFixed(2)}). 2. Financial Multiples: Review debt sustainability and equity ratios for distressed stocks. 3. System Note: Quantitative technical engine active.`
        }));
        if (noticeText) {
          setAiNotice(noticeText);
        }
      };

      // Use pre-fetched support/resistance from technical analysis if available, otherwise estimate
      const instantSupport = prefetchedFundamentals.support ?? Number((priceData.price * 0.94).toFixed(2));
      const instantResistance = prefetchedFundamentals.resistance ?? Number((priceData.price * 1.06).toFixed(2));

      // SOLUTION 2: Instant UI Preview - populate price, chart, SMAs, AND fundamentals RIGHT NOW
      setActiveStock((prev) => ({
        ...prev,
        company: priceData.company || prefetchedFundamentals.company || `${verifiedTicker} Equity`,
        currency: pCurrCode,
        currency_symbol: pCurrSymbol,
        price: priceData.price,
        open: priceData.open || priceData.price,
        high: priceData.high || priceData.price,
        low: priceData.low || priceData.price,
        volume: priceData.volume || 0,
        support: instantSupport,
        resistance: instantResistance,
        timestamp: priceData.timestamp,
        // Immediately populate SMAs from chart/technical data — no waiting for AI
        sma20: chartSma20 ?? null,
        sma50: chartSma50 ?? null,
        sma150: chartSma150 ?? null,
        sma200: chartSma200 ?? null,
        rsi: prefetchedFundamentals.rsi ?? null,
        bb_upper: prefetchedFundamentals.bb_upper ?? null,
        bb_lower: prefetchedFundamentals.bb_lower ?? null,
        macd: prefetchedFundamentals.macd ?? null,
        macd_signal: prefetchedFundamentals.macd_signal ?? null,
        // Immediately populate fundamental metrics — no waiting for AI
        news: instantNews,
        market_cap: prefetchedFundamentals.market_cap ?? priceData.market_cap ?? null,
        total_revenue: prefetchedFundamentals.total_revenue ?? null,
        free_cash_flow: prefetchedFundamentals.free_cash_flow ?? null,
        pe_ratio: prefetchedFundamentals.pe_ratio ?? null,
        forward_pe: prefetchedFundamentals.forward_pe ?? null,
        price_to_book: prefetchedFundamentals.price_to_book ?? null,
        operating_margin: prefetchedFundamentals.operating_margin ?? null,
        profit_margin: prefetchedFundamentals.profit_margin ?? null,
        roe: prefetchedFundamentals.roe ?? null,
        revenue_growth: prefetchedFundamentals.revenue_growth ?? null,
        debt_to_equity: prefetchedFundamentals.debt_to_equity ?? null,
        verdict: "EVALUATING LIVE SIGNALS",
        verdict_desc: `Real-time quote active at ${pCurrSymbol}${priceData.price.toFixed(2)}. Processing live multi-agent indicators for ${verifiedTicker}...`,
        short_term_strategy: `Support floor at ${pCurrSymbol}${instantSupport.toFixed(2)}. Target resistance ceiling at ${pCurrSymbol}${instantResistance.toFixed(2)}.`,
        long_term_strategy: `Evaluating cash flow generation, debt covenants, and quarterly earnings disclosures...`,
        future_outlook: `Monitoring upcoming earnings announcements, sector rotation, and macro catalysts...`,
        bull_case: `Support holding at ${pCurrSymbol}${instantSupport.toFixed(2)} defines an asymmetric risk-reward entry towards ${pCurrSymbol}${instantResistance.toFixed(2)}.`,
        bear_case: `Sustained break below support (${pCurrSymbol}${instantSupport.toFixed(2)}) indicates risk of downside re-testing.`,
        risks_text: `Analyzing risk exposure and balance sheet solvency for ${verifiedTicker}...`
      }));

      // Stale-load guard: if the user already switched to another stock, abort
      if (currentLoadIdRef.current !== thisLoadId) {
        setLoading(false);
        return;
      }

      // Immediate history snapshot for instant availability
      const historyEntryId = Date.now();
      saveToLocalHistory({
        id: historyEntryId,
        ticker: verifiedTicker,
        currency: pCurrCode,
        currency_symbol: pCurrSymbol,
        user_query: `Institutional analysis for ${verifiedTicker}`,
        analysis: `Real-time quote verified at ${pCurrSymbol}${priceData.price.toFixed(2)}. Gathering indicators, SEC filings, and multi-agent synthesis...`,
        current_price: priceData.price,
        created_at: new Date().toISOString()
      });

      // Update Chat Welcome
      setChatMessages([
        {
          role: "assistant",
          text: `Live market session connected for ${verifiedTicker} (${pCurrSymbol}${priceData.price.toFixed(2)}). Ask me anything about its valuation, RSI indicators, or AI investment outlook!`
        }
      ]);

      // Release main loading state - Chart & Price are now immediately interactive!
      setLoading(false);

      // ── SSE STREAMING AI PIPELINE ─────────────────────────────────────────────
      // Uses Server-Sent Events so each phase (technical, news, LLM) streams to
      // the UI as it completes. No more 25-second timeouts.
      setAiLoading(true);
      setAiProgress({ step: "market", pct: 5, message: `Launching multi-agent pipeline for ${verifiedTicker}...` });

      const evtSource = new EventSource(`${API_BASE_URL}/api/analyze/stream/${encodeURIComponent(verifiedTicker)}`);
      aiEventSourceRef.current = evtSource;

      evtSource.onmessage = (event) => {
        // Stale-load guard: user switched stocks while stream was open
        if (currentLoadIdRef.current !== thisLoadId) {
          evtSource.close();
          aiEventSourceRef.current = null;
          setAiLoading(false);
          setAiProgress(null);
          return;
        }

        if (event.data === "[DONE]") {
          evtSource.close();
          aiEventSourceRef.current = null;
          setAiLoading(false);
          setAiProgress(null);
          setStreamingText("");
          return;
        }

        try {
          const msg = JSON.parse(event.data);

          if (msg.type === "progress") {
            setAiProgress({ step: msg.step, pct: msg.pct, message: msg.message });

          } else if (msg.type === "technical_data" && msg.data) {
            const td = msg.data;
            setActiveStock((prev) => ({
              ...prev,
              sma20:       td.sma20       ?? chartSma20,
              sma50:       td.sma50       ?? chartSma50,
              sma150:      td.sma150      ?? chartSma150,
              sma200:      td.sma200      ?? chartSma200,
              rsi:         td.rsi         ?? prefetchedFundamentals.rsi ?? null,
              bb_upper:    td.bb_upper    ?? prefetchedFundamentals.bb_upper ?? null,
              bb_lower:    td.bb_lower    ?? prefetchedFundamentals.bb_lower ?? null,
              support:     td.support     ?? prefetchedFundamentals.support ?? null,
              resistance:  td.resistance  ?? prefetchedFundamentals.resistance ?? null,
              macd:        td.macd        ?? null,
              macd_signal: td.macd_signal ?? null,
            }));

          } else if (msg.type === "financial_data" && msg.data) {
            const fd = msg.data;
            setActiveStock((prev) => ({
              ...prev,
              pe_ratio:         fd.pe_ratio         ?? prev.pe_ratio,
              forward_pe:       fd.forward_pe        ?? prev.forward_pe,
              price_to_book:    fd.price_to_book     ?? prev.price_to_book,
              operating_margin: fd.operating_margin  ?? prev.operating_margin,
              profit_margin:    fd.profit_margin     ?? prev.profit_margin,
              roe:              fd.roe               ?? prev.roe,
              revenue_growth:   fd.revenue_growth    ?? prev.revenue_growth,
              debt_to_equity:   fd.debt_to_equity    ?? prev.debt_to_equity,
              total_revenue:    fd.total_revenue     ?? prev.total_revenue,
              free_cash_flow:   fd.free_cash_flow    ?? prev.free_cash_flow,
              market_cap:       fd.market_cap        ?? prev.market_cap,
              company:          fd.company           || prev.company,
            }));

          } else if (msg.type === "news_data" && Array.isArray(msg.data) && msg.data.length > 0) {
            setActiveStock((prev) => ({ ...prev, news: msg.data }));

          } else if (msg.type === "text_chunk" && msg.text) {
            setStreamingText((prev) => prev + msg.text);

          } else if (msg.type === "sections" && msg.data) {
            const s = msg.data;
            setActiveStock((prev) => ({
              ...prev,
              verdict:             s.verdict            || prev.verdict,
              verdict_desc:        s.verdict_desc       || prev.verdict_desc,
              short_term_strategy: s.short_term_strategy|| prev.short_term_strategy,
              long_term_strategy:  s.long_term_strategy || prev.long_term_strategy,
              future_outlook:      s.future_outlook     || prev.future_outlook,
              bull_case:           s.bull_case          || prev.bull_case,
              bear_case:           s.bear_case          || prev.bear_case,
            }));

          } else if (msg.type === "complete") {
            setActiveStock((prev) => ({ ...prev, thread_id: msg.thread_id }));
            saveToLocalHistory({
              id: historyEntryId,
              ticker: verifiedTicker,
              currency: pCurrCode,
              currency_symbol: pCurrSymbol,
              user_query: `Institutional analysis for ${verifiedTicker}`,
              analysis: msg.final_analysis || `Analysis completed for ${verifiedTicker}`,
              current_price: priceData.price,
              created_at: new Date().toISOString()
            });
            fetchAndSyncHistory();

          } else if (msg.type === "error") {
            setAiNotice(`AI pipeline: ${msg.message}. Quantitative engine active.`);
            applyQuantitativeFallback("");
            evtSource.close();
            aiEventSourceRef.current = null;
            setAiLoading(false);
            setAiProgress(null);
          }
        } catch {}
      };

      evtSource.onerror = () => {
        if (currentLoadIdRef.current !== thisLoadId) return;
        evtSource.close();
        aiEventSourceRef.current = null;
        setAiLoading(false);
        setAiProgress(null);
        setStreamingText("");
        setAiNotice("AI stream closed. Quantitative technical analysis is active.");
      };

    } catch (err) {
      setError(`Could not connect to financial backend for "${symbol}". Please ensure the backend server is running.`);
      setLoading(false);
      setAiLoading(false);
    }
  };

  // Load initial stock on mount
  useEffect(() => {
    loadStock("AAPL", "6M");
  }, []);



  // Timeframe change (Instant update)
  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    fetch(`${API_BASE_URL}/api/historical-chart/${ticker}?period=${newPeriod.toLowerCase()}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.records?.length > 0) setChartRecords(d.records);
      })
      .catch(() => {});
  };

  // Search
  const handleSearch = (e) => {
    e?.preventDefault();
    if (searchInput.trim()) {
      loadStock(searchInput.trim(), period);
    }
  };

  // Chat message - 100% processed by FastAPI & Gemini backend
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setChatLoading(true);
    setTimeout(scrollChatToBottom, 50);

    try {
      const res = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker: ticker,
          message: userMsg,
          thread_id: activeStock.thread_id || "demo_session"
        })
      });

      if (res.ok) {
        const data = await res.json();
        setChatMessages((prev) => [...prev, { role: "assistant", text: data.reply }]);
      } else {
        const errData = await res.json().catch(() => ({}));
        const errorMsg = errData.detail || "Unable to reach AI Analyst backend. Please verify your backend server connection.";
        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", text: `⚠️ Error: ${errorMsg}` }
        ]);
      }
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", text: `⚠️ Connection Error: Failed to communicate with the financial AI backend at ${API_BASE_URL}. Please ensure your FastAPI backend is running.` }
      ]);
    } finally {
      setChatLoading(false);
      setTimeout(scrollChatToBottom, 50);
    }
  };

  const toggleWatchlist = (sym) => {
    if (watchlist.includes(sym)) {
      setWatchlist((prev) => prev.filter((s) => s !== sym));
    } else {
      setWatchlist((prev) => [...prev, sym]);
    }
  };

  const activeRecord = useMemo(() => {
    if (chartRecords.length === 0) return null;
    if (hoverIndex !== null && chartRecords[hoverIndex]) {
      return chartRecords[hoverIndex];
    }
    return chartRecords[chartRecords.length - 1];
  }, [chartRecords, hoverIndex]);

  const formatVol = (val) => {
    if (!val) return "0";
    const v = Number(val);
    if (currCode === "INR") {
      if (v >= 1e7) return `${(v / 1e7).toLocaleString("en-IN", { maximumFractionDigits: 2 })} Cr`;
      if (v >= 1e5) return `${(v / 1e5).toLocaleString("en-IN", { maximumFractionDigits: 2 })} L`;
    }
    if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
    if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
    if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
    return v.toString();
  };

  const formatNumber = (num, prefix = "", suffix = "", currencyCode = currCode) => {
    if (num === null || num === undefined || isNaN(num) || num === "") return "N/A";
    const val = Number(num);
    const absVal = Math.abs(val);

    // If INR currency, provide standard Indian numbering (Crore / Lakh)
    if (currencyCode === "INR") {
      if (absVal >= 1e7) {
        return `${prefix}${(val / 1e7).toLocaleString("en-IN", { maximumFractionDigits: 2 })} Cr${suffix}`;
      }
      if (absVal >= 1e5) {
        return `${prefix}${(val / 1e5).toLocaleString("en-IN", { maximumFractionDigits: 2 })} L${suffix}`;
      }
      return `${prefix}${val.toLocaleString("en-IN", { maximumFractionDigits: 2 })}${suffix}`;
    }

    // Standard International Scale for US and global equities (Mega, Mid, Small, Micro, Nano caps)
    if (absVal >= 1e12) return `${prefix}${(val / 1e12).toFixed(2)}T${suffix}`;
    if (absVal >= 1e9) return `${prefix}${(val / 1e9).toFixed(2)}B${suffix}`;
    if (absVal >= 1e6) return `${prefix}${(val / 1e6).toFixed(2)}M${suffix}`;
    if (absVal >= 1e3) return `${prefix}${(val / 1e3).toFixed(2)}K${suffix}`;
    return `${prefix}${val.toLocaleString(undefined, { maximumFractionDigits: 2 })}${suffix}`;
  };

  // Bounds-checked formatting for Trailing and Forward P/E (handles unprofitable turnaround stocks)
  const formatPE = (pe, isForward = false) => {
    if (pe === null || pe === undefined || isNaN(pe) || pe === "") {
      return isForward ? "N/A" : "N/A (Unprofitable)";
    }
    const val = Number(pe);
    if (!isFinite(val)) return "N/A";
    if (val <= 0) return "N/A (Net Loss)";
    if (val > 1000) return "> 1,000x (Extreme Multiple)";
    return `${val.toFixed(2)}x`;
  };

  // Bounds-checked formatting for Price-to-Book (handles negative equity / turnaround distress)
  const formatPB = (pb) => {
    if (pb === null || pb === undefined || isNaN(pb) || pb === "") return "N/A";
    const val = Number(pb);
    if (!isFinite(val)) return "N/A";
    if (val <= 0) return "Negative Equity (Deficit)";
    if (val > 250) return "> 250x (Asset-Light)";
    return `${val.toFixed(2)}x`;
  };

  // Bounds-checked formatting for Debt-to-Equity (handles negative net worth and leverage extremes)
  const formatDebtEquity = (dte) => {
    if (dte === null || dte === undefined || isNaN(dte) || dte === "") return "N/A";
    const val = Number(dte);
    if (!isFinite(val)) return "N/A";
    if (val < 0) return "Negative Equity (Distressed)";
    if (val > 2000) return "> 2,000% (High Leverage)";
    return `${val.toFixed(1)}%`;
  };

  // Bounds-checked formatting for Margins, ROE, and Growth percentages
  const formatPercent = (val, isGrowth = false) => {
    if (val === null || val === undefined || isNaN(val) || val === "") return "N/A";
    const num = Number(val);
    if (!isFinite(num)) return "N/A";
    if (num < -5.0) return "< -500% (High Deficit)";
    if (num > 10.0) return "> +1,000% (Distorted Base)";
    const pct = (num * 100).toFixed(1);
    if (isGrowth) {
      return num > 0 ? `+${pct}%` : `${pct}%`;
    }
    return `${pct}%`;
  };

  // Comprehensive plain text converter: Strips all AI markdown artifacts (#, ##, **, *, _, `, ---, ~, >) into clean, natural human text
  const renderCleanText = (text) => {
    if (!text) return "";
    if (typeof text !== "string") return String(text);

    // 1. Remove markdown headers (###, ##, #)
    let cleaned = text.replace(/^#{1,6}\s*/gm, "");
    
    // 2. Remove horizontal rules (--- or ***)
    cleaned = cleaned.replace(/^(?:---|___|\*\*\*)\s*$/gm, "");
    
    // 3. Remove bold / italics formatting markers (**text**, *text*, __text__, _text_)
    cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, "$1");
    cleaned = cleaned.replace(/\*([^*]+)\*/g, "$1");
    cleaned = cleaned.replace(/__([^_]+)__/g, "$1");
    cleaned = cleaned.replace(/_([^_]+)_/g, "$1");
    cleaned = cleaned.replace(/`([^`]+)`/g, "$1");
    
    // 4. Remove stray markdown symbols
    cleaned = cleaned.replace(/[*#~`]/g, "");

    // 5. Clean up leading bullet markers into clean readable list bullets
    cleaned = cleaned.replace(/^\s*[-*•]\s+/gm, "• ");

    // 6. Clean excess blank lines
    cleaned = cleaned.replace(/\n{3,}/g, "\n\n").trim();

    return cleaned;
  };


  const exportReport = () => {
    const reportDate = liveTime.toISOString().slice(0, 10);
    const filename = `${ticker}_Equity_Research_Report_${reportDate}.md`;
    
    const content = `# INSTITUTIONAL EQUITY RESEARCH REPORT: ${activeStock.company} (${ticker})
**Report Generated:** ${reportDate} | **Market Status:** Verified Live
**Current Stock Price:** ${currSymbol}${currentDisplayPrice.toFixed(2)} (${currCode}) | **Verdict:** ${activeStock.verdict}

---

## 1. Executive Summary & Verdict
* **Recommendation:** ${activeStock.verdict}
* **Thesis Summary:** ${activeStock.verdict_desc}
* **Short-Term Strategy:** ${activeStock.short_term_strategy}
* **Long-Term Strategy:** ${activeStock.long_term_strategy}
* **Future Outlook & Catalysts:** ${activeStock.future_outlook}

---

## 2. Dual-Agent Adversarial Debate: Bull vs. Bear Case
### 🟢 The Bull Case (Growth Analyst)
${activeStock.bull_case || "Strong secular tailwinds, margin expansion, and multi-year demand support price upside toward key resistance targets."}

### 🔴 The Bear Case (Short-Seller / Risk Auditor)
${activeStock.bear_case || "Valuation multiple expansion leaves limited room for macro execution hiccups; monitor key support floor."}

---

## 3. Quantitative & Technical Overlays
* **Support (Floor Level):** ${currSymbol}${activeStock.support ? activeStock.support.toFixed(2) : "N/A"}
* **Resistance (Ceiling Level):** ${currSymbol}${activeStock.resistance ? activeStock.resistance.toFixed(2) : "N/A"}
* **SMA 20:** ${currSymbol}${activeStock.sma20 ? activeStock.sma20.toFixed(2) : "N/A"} | **SMA 50:** ${currSymbol}${activeStock.sma50 ? activeStock.sma50.toFixed(2) : "N/A"} | **SMA 200:** ${currSymbol}${activeStock.sma200 ? activeStock.sma200.toFixed(2) : "N/A"}
* **14-Day RSI:** ${activeStock.rsi ? activeStock.rsi.toFixed(1) : "N/A"}
* **Bollinger Bands:** Upper ${currSymbol}${activeStock.bb_upper ? activeStock.bb_upper.toFixed(2) : "N/A"} | Lower ${currSymbol}${activeStock.bb_lower ? activeStock.bb_lower.toFixed(2) : "N/A"}

---

## 4. Fundamental Health & Valuation Multiples
* **Market Capitalization:** ${formatNumber(activeStock.market_cap, currSymbol)}
* **Trailing P/E Ratio:** ${formatPE(activeStock.pe_ratio)} | **Forward P/E:** ${formatPE(activeStock.forward_pe, true)}
* **Price to Book:** ${formatPB(activeStock.price_to_book)}
* **Operating Margin:** ${formatPercent(activeStock.operating_margin)} | **Profit Margin:** ${formatPercent(activeStock.profit_margin)}
* **Free Cash Flow:** ${formatNumber(activeStock.free_cash_flow, currSymbol)}
* **Debt to Equity:** ${formatDebtEquity(activeStock.debt_to_equity)}

---

## 5. Critical Risk Matrix & Negative Signals
${activeStock.risks_text}

---
*Disclaimer: Generated by Autonomous Stock Analysis AI Agent for institutional research evaluation.*
`;

    const blob = new Blob([content], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // SVG Chart Coordinates
  const chartCoords = useMemo(() => {
    const records = chartRecords || [];
    if (records.length < 2) return null;

    const width = 880;
    const height = 260;
    const padding = { top: 20, right: 30, bottom: 25, left: 60 };

    const graphWidth = width - padding.left - padding.right;
    const graphHeight = height - padding.top - padding.bottom;

    const allPrices = [];
    records.forEach((r) => {
      if (r.close) allPrices.push(r.close);
      if (r.high) allPrices.push(r.high);
      if (r.low) allPrices.push(r.low);
      if (showBollinger) {
        if (r.bb_upper) allPrices.push(r.bb_upper);
        if (r.bb_lower) allPrices.push(r.bb_lower);
      }
      if (showSMA50 && r.sma50) allPrices.push(r.sma50);
      if (showLevels) {
        if (r.resistance) allPrices.push(r.resistance);
        if (r.support) allPrices.push(r.support);
      }
    });

    const minPrice = Math.min(...allPrices) * 0.95;
    const maxPrice = Math.max(...allPrices) * 1.05;
    const priceRange = maxPrice - minPrice || 1;

    const getX = (index) => padding.left + (index / (records.length - 1)) * graphWidth;
    const getY = (val) => padding.top + graphHeight - ((val - minPrice) / priceRange) * graphHeight;

    const pricePoints = records.map((r, i) => `${getX(i)},${getY(r.close)}`).join(" ");

    const sma50Points = records
      .map((r, i) => (r.sma50 ? `${getX(i)},${getY(r.sma50)}` : null))
      .filter(Boolean)
      .join(" ");

    const bbUpperPoints = records
      .map((r, i) => (r.bb_upper ? `${getX(i)},${getY(r.bb_upper)}` : null))
      .filter(Boolean)
      .join(" ");

    const bbLowerPoints = records
      .map((r, i) => (r.bb_lower ? `${getX(i)},${getY(r.bb_lower)}` : null))
      .filter(Boolean)
      .join(" ");

    const yTicks = [];
    for (let i = 0; i <= 6; i++) {
      const p = minPrice + (priceRange * i) / 6;
      yTicks.push({
        price: p.toFixed(2),
        y: getY(p)
      });
    }

    const step = Math.max(1, Math.floor(records.length / 8));
    const xTicks = [];
    for (let i = 0; i < records.length; i += step) {
      xTicks.push({
        date: records[i].date ? records[i].date.slice(5) : "",
        x: getX(i)
      });
    }

    const volHeight = 70;
    const maxVol = Math.max(...records.map((r) => r.volume || 1));
    const volBars = records.map((r, i) => {
      const barH = ((r.volume || 0) / maxVol) * (volHeight - 15);
      return {
        x: getX(i) - 2,
        y: volHeight - barH,
        height: barH,
        volume: r.volume
      };
    });

    const volTicks = [
      { label: formatVol(maxVol), y: 15 },
      { label: formatVol(maxVol * 0.66), y: 35 },
      { label: formatVol(maxVol * 0.33), y: 55 },
      { label: "0", y: volHeight }
    ];

    return {
      width,
      height,
      padding,
      minPrice,
      maxPrice,
      getX,
      getY,
      pricePoints,
      sma50Points,
      bbUpperPoints,
      bbLowerPoints,
      yTicks,
      xTicks,
      resistanceY: records[0]?.resistance ? getY(records[0].resistance) : null,
      supportY: records[0]?.support ? getY(records[0].support) : null,
      volHeight,
      volBars,
      volTicks
    };
  }, [chartRecords, showBollinger, showSMA50, showLevels]);

  const currentDisplayPrice = Number(activeRecord?.close ?? activeStock.price) || 0;

  return (
    <div className="app-layout">
      {/* 1. TOP NAVBAR */}
      <header className="top-navbar">
        <div className="nav-container">
          <div className="nav-left">
            <div className="nav-logo-icon">
              <TrendingUp size={20} />
            </div>
            <span className="nav-brand-title">Stock Analyzer</span>
          </div>

          <div className="nav-middle">
            <button
              className={`nav-pill-btn ${activeTab === "dashboard" ? "active" : ""}`}
              onClick={() => setActiveTab("dashboard")}
            >
              Dashboard
            </button>
            <button
              className={`nav-pill-btn ${activeTab === "history" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("history");
                fetchAndSyncHistory();
              }}
            >
              <History size={15} />
              <span>History ({historyList.length})</span>
            </button>
            <button
              className={`nav-pill-btn ${activeTab === "watchlist" ? "active" : ""}`}
              onClick={() => setActiveTab("watchlist")}
            >
              <Bookmark size={15} />
              <span>Watch List ({watchlist.length})</span>
            </button>
          </div>
        </div>
      </header>

      
      <main className="content-container">
        {/* Search Bar & Quick Ticker Selector */}
        <section className="search-bar-row">
          <form className="search-form" onSubmit={handleSearch} style={{ position: "relative" }}>
            <div className="search-input-wrap" ref={searchWrapRef} style={{ position: "relative", width: "100%" }}>
              <Search size={17} className="search-icon" />
              <input
                type="text"
                placeholder="Search stock or company (e.g. TATA, GOOGLE, RELIANCE, AAPL, NVDA, TSLA)..."
                value={searchInput}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => {
                  setSearchInput(e.target.value.toUpperCase());
                  setShowSuggestions(true);
                }}
              />

              {/* Floating Autocomplete Suggestion Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div
                  className="autocomplete-dropdown"
                  style={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    left: 0,
                    right: 0,
                    zIndex: 9999,
                    background: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "12px",
                    boxShadow: "0 16px 36px rgba(0, 0, 0, 0.6)",
                    overflow: "hidden"
                  }}
                >
                  <div style={{ padding: "8px 14px", fontSize: "11px", color: "#64748b", borderBottom: "1px solid #1e293b", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    Matching Global Companies
                  </div>
                  {suggestions.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setShowSuggestions(false);
                        loadStock(item.symbol, period);
                      }}
                      style={{
                        padding: "10px 14px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        cursor: "pointer",
                        borderBottom: idx < suggestions.length - 1 ? "1px solid rgba(51, 65, 85, 0.4)" : "none",
                        transition: "background 0.15s ease"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#1e293b"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontWeight: "700", color: "#38bdf8", fontSize: "14px" }}>{item.symbol}</span>
                          <span style={{ fontSize: "11px", color: "#94a3b8", background: "#1e293b", padding: "1px 6px", borderRadius: "4px" }}>
                            {item.exchange}
                          </span>
                        </div>
                        <span style={{ fontSize: "12.5px", color: "#cbd5e1" }}>{item.name}</span>
                      </div>
                      {item.sector && (
                        <span style={{ fontSize: "11.5px", color: "#64748b" }}>{item.sector}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button type="submit" className="btn-search">
              Search
            </button>
          </form>

          <div className="quick-chip-list">
            {watchlist.map((sym) => (
              <button
                key={sym}
                className={`quick-sym-chip ${ticker === sym ? "active" : ""}`}
                onClick={() => loadStock(sym, period)}
              >
                {sym}
              </button>
            ))}
          </div>
        </section>

        {/* Dynamic Error Banner for Invalid Tickers */}
        {error && (
          <div
            className="error-alert-box"
            style={{
              background: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.35)",
              borderRadius: "12px",
              padding: "16px 20px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "flex-start",
              gap: "14px"
            }}
          >
            <AlertTriangle size={22} color="#ef4444" style={{ marginTop: "2px", flexShrink: 0 }} />
            <div>
              <h4 style={{ margin: "0 0 4px 0", color: "#ef4444", fontSize: "15px", fontWeight: "700" }}>
                Unrecognized or Non-Existent Stock Symbol
              </h4>
              <p style={{ margin: 0, color: "#cbd5e1", fontSize: "13.5px", lineHeight: "1.5" }}>
                {error}
              </p>
              <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "12px", color: "#94a3b8" }}>Try popular stocks:</span>
                {["AAPL", "NVDA", "TSLA", "MSFT", "OKLO", "AMZN"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => loadStock(s, period)}
                    style={{
                      background: "rgba(59, 130, 246, 0.15)",
                      border: "1px solid rgba(59, 130, 246, 0.4)",
                      color: "#60a5fa",
                      padding: "3px 10px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "600",
                      cursor: "pointer"
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Active Market Verification Loading State */}
        {loading && (
          <div
            style={{
              padding: "12px 18px",
              marginBottom: "16px",
              borderRadius: "10px",
              background: "rgba(59, 130, 246, 0.08)",
              border: "1px solid rgba(59, 130, 246, 0.25)",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              color: "#60a5fa",
              fontSize: "14px"
            }}
          >
            <RefreshCw size={16} className="spin-icon" />
            <span>Connecting to live exchange for <strong>{searchInput}</strong>...</span>
          </div>
        )}

        {/* ─── SSE Multi-Phase Progress & Streaming Text Panel ─── */}
        {aiLoading && !loading && (
          <div style={{
            marginBottom: "16px",
            borderRadius: "12px",
            background: "rgba(109, 40, 217, 0.07)",
            border: "1px solid rgba(139, 92, 246, 0.3)",
            overflow: "hidden"
          }}>
            {/* Header row */}
            <div style={{
              padding: "10px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "10px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "9px", color: "#a78bfa", fontSize: "13px" }}>
                <Sparkles size={15} className="spin-icon" />
                <span>{aiProgress?.message || `Launching AI pipeline for ${ticker}...`}</span>
              </div>
              <span style={{ fontSize: "12px", color: "#7c3aed", fontWeight: "700", fontVariantNumeric: "tabular-nums" }}>
                {aiProgress?.pct ?? 5}%
              </span>
            </div>

            {/* Animated progress bar */}
            <div style={{ height: "3px", background: "rgba(109, 40, 217, 0.15)", position: "relative" }}>
              <div style={{
                position: "absolute", left: 0, top: 0, bottom: 0,
                width: `${aiProgress?.pct ?? 5}%`,
                background: "linear-gradient(90deg, #7c3aed, #a78bfa)",
                borderRadius: "0 2px 2px 0",
                transition: "width 0.6s ease"
              }} />
            </div>

            {/* Phase breadcrumb */}
            <div style={{ padding: "7px 16px 8px", display: "flex", gap: "6px", alignItems: "center" }}>
              {[
                { id: "market",    label: "Market" },
                { id: "technical", label: "Technicals" },
                { id: "news",      label: "News" },
                { id: "ai",        label: "AI Synthesis" },
                { id: "sections",  label: "Structuring" }
              ].map((ph, i, arr) => {
                const pct = aiProgress?.pct ?? 0;
                const thresholds = [8, 28, 48, 60, 92];
                const done = pct > thresholds[i];
                const active = aiProgress?.step === ph.id;
                return (
                  <React.Fragment key={ph.id}>
                    <span style={{
                      fontSize: "11px", fontWeight: active ? "700" : "500",
                      color: done ? "#34d399" : active ? "#a78bfa" : "#475569",
                      transition: "color 0.3s"
                    }}>
                      {done ? "✓ " : ""}{ph.label}
                    </span>
                    {i < arr.length - 1 && (
                      <span style={{ color: "#334155", fontSize: "10px" }}>›</span>
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Live streaming text (typewriter output) */}
            {streamingText && (
              <div style={{
                margin: "0 12px 12px",
                padding: "12px 14px",
                background: "rgba(15, 23, 42, 0.6)",
                borderRadius: "8px",
                border: "1px solid rgba(139, 92, 246, 0.15)",
                fontFamily: "monospace",
                fontSize: "12.5px",
                color: "#cbd5e1",
                lineHeight: "1.65",
                maxHeight: "180px",
                overflowY: "auto",
                whiteSpace: "pre-wrap"
              }}>
                {streamingText}
                <span style={{
                  display: "inline-block",
                  width: "2px", height: "13px",
                  background: "#a78bfa",
                  marginLeft: "2px",
                  verticalAlign: "middle",
                  animation: "blink 1s step-end infinite"
                }} />
              </div>
            )}
          </div>
        )}

        {/* Clean Resilient Notice for AI Rate Limits or Timeouts */}
        {aiNotice && (
          <div
            style={{
              padding: "10px 16px",
              marginBottom: "16px",
              borderRadius: "10px",
              background: "rgba(245, 158, 11, 0.08)",
              border: "1px solid rgba(245, 158, 11, 0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "10px",
              color: "#fbbf24",
              fontSize: "13px"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <AlertTriangle size={15} />
              <span>{aiNotice}</span>
            </div>
            <button
              onClick={() => setAiNotice("")}
              style={{
                background: "transparent",
                border: "none",
                color: "#fbbf24",
                cursor: "pointer",
                fontSize: "14px",
                padding: "2px 6px"
              }}
              title="Dismiss notification"
            >
              ✕
            </button>
          </div>
        )}

        {/* ================= DASHBOARD VIEW ================= */}
        {activeTab === "dashboard" && (
          <div className="dashboard-view">
            {/* 💡 Stock Insights Header with Action Controls */}
            <div className="section-heading-row">
              <div className="heading-left">
                <span className="lightbulb-emoji">💡</span>
                <h2>Stock Insights</h2>
              </div>
              
              <div className="header-action-group">
                <button
                  className="btn-export-report"
                  onClick={exportReport}
                  title="Download institutional equity research briefing in Markdown/Doc format"
                >
                  <Download size={14} />
                  <span>Export Report</span>
                </button>
                <button
                  className={`btn-watchlist-toggle ${watchlist.includes(ticker) ? "active" : ""}`}
                  onClick={() => toggleWatchlist(ticker)}
                >
                  <Bookmark size={14} />
                  <span>{watchlist.includes(ticker) ? "In Watchlist" : "+ Add to Watchlist"}</span>
                </button>
              </div>
            </div>

            {/* Soft Blue Price Callout Box */}
            <section className="price-callout-banner">
              <h1 className="callout-title">
                {activeStock.company} ({ticker}) Current Price: {currSymbol}{currentDisplayPrice.toFixed(2)}
              </h1>
              <p className="callout-subtitle">
                Price Time: {activeStock.timestamp || `${liveTime.toISOString().slice(0, 10)} ${liveTime.toLocaleTimeString("en-US", { hour12: true })} ET`} <span className="live-badge">● REAL-TIME</span>
              </p>
            </section>

            {/* Controls Bar: Timeframe & Indicators */}
            <section className="controls-bar">
              <div className="period-btn-group">
                {["10D", "1M", "3M", "6M", "1Y"].map((p) => (
                  <button
                    key={p}
                    className={`time-btn ${period === p ? "active" : ""}`}
                    onClick={() => handlePeriodChange(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <div className="overlay-btn-group">
                <button
                  className={`indicator-pill-btn bollinger ${showBollinger ? "active" : ""}`}
                  onClick={() => setShowBollinger(!showBollinger)}
                  title="Bollinger Bands show the price volatility envelope"
                >
                  Bollinger Bands <span className="btn-hint">(Volatility Range)</span>
                </button>
                <button
                  className={`indicator-pill-btn sma ${showSMA50 ? "active" : ""}`}
                  onClick={() => setShowSMA50(!showSMA50)}
                  title="SMA 50 is the 50-day average price trend line"
                >
                  SMA 50 <span className="btn-hint">(50-Day Trend Avg)</span>
                </button>
                <button
                  className={`indicator-pill-btn levels ${showLevels ? "active" : ""}`}
                  onClick={() => setShowLevels(!showLevels)}
                  title="Support is the price floor; Resistance is the price ceiling"
                >
                  Support / Resistance <span className="btn-hint">(Floor & Ceiling)</span>
                </button>
              </div>
            </section>

            {/* Stats Summary Bar */}
            <section className="stats-summary-card">
              <div className="stat-col">
                <span className="stat-label">Date:</span>
                <span className="stat-val font-bold">{activeRecord?.date || liveTime.toISOString().slice(0, 10)}</span>
              </div>
              <div className="stat-col">
                <span className="stat-label">Stock Price <span className="term-expl">(Live)</span>:</span>
                <span className="stat-val text-blue font-bold">
                  {currSymbol}{currentDisplayPrice.toFixed(2)}
                </span>
              </div>
              <div className="stat-col">
                <span className="stat-label">SMA 50 <span className="term-expl">(50-Day Avg)</span>:</span>
                <span className="stat-val text-purple font-bold">
                  {currSymbol}{activeRecord?.sma50 || activeStock.sma50 ? (activeRecord?.sma50 || activeStock.sma50).toFixed(2) : "N/A"}
                </span>
              </div>
              <div className="stat-col">
                <span className="stat-label">Support <span className="term-expl">(Price Floor)</span>:</span>
                <span className="stat-val text-green font-bold">
                  {currSymbol}{activeRecord?.support || activeStock.support ? (activeRecord?.support || activeStock.support).toFixed(2) : "N/A"}
                </span>
              </div>
              <div className="stat-col">
                <span className="stat-label">Resistance <span className="term-expl">(Price Ceiling)</span>:</span>
                <span className="stat-val text-red font-bold">
                  {currSymbol}{activeRecord?.resistance || activeStock.resistance ? (activeRecord?.resistance || activeStock.resistance).toFixed(2) : "N/A"}
                </span>
              </div>
              <div className="stat-col">
                <span className="stat-label">Volume <span className="term-expl">(Shares Traded)</span>:</span>
                <span className="stat-val text-navy font-bold">
                  {formatVol(activeRecord?.volume || activeStock.volume)}
                </span>
              </div>
            </section>

            <section className="chart-card-wrapper">
              {chartCoords ? (
                <div className="single-chart-container">
                  <div className="main-price-chart">
                    <svg
                      viewBox={`0 0 ${chartCoords.width} ${chartCoords.height}`}
                      className="svg-price-chart"
                      onMouseLeave={() => setHoverIndex(null)}
                    >
                      {chartCoords.yTicks.map((tick, i) => (
                        <g key={i}>
                          <line
                            x1={chartCoords.padding.left}
                            y1={tick.y}
                            x2={chartCoords.width - chartCoords.padding.right}
                            y2={tick.y}
                            stroke="#f1f5f9"
                            strokeWidth="1"
                          />
                          <text
                            x={chartCoords.padding.left - 8}
                            y={tick.y + 4}
                            textAnchor="end"
                            fontSize="11"
                            fill="#64748b"
                            fontFamily="monospace"
                          >
                            {currSymbol}{tick.price}
                          </text>
                        </g>
                      ))}

                      {chartCoords.xTicks.map((tick, i) => (
                        <text
                          key={i}
                          x={tick.x}
                          y={chartCoords.height - 4}
                          textAnchor="middle"
                          fontSize="11"
                          fill="#64748b"
                        >
                          {tick.date}
                        </text>
                      ))}

                      {/* Resistance Line */}
                      {showLevels && chartCoords.resistanceY && (
                        <line
                          x1={chartCoords.padding.left}
                          y1={chartCoords.resistanceY}
                          x2={chartCoords.width - chartCoords.padding.right}
                          y2={chartCoords.resistanceY}
                          stroke="#f43f5e"
                          strokeWidth="1.5"
                          strokeDasharray="4 4"
                        />
                      )}

                      {/* Support Line */}
                      {showLevels && chartCoords.supportY && (
                        <line
                          x1={chartCoords.padding.left}
                          y1={chartCoords.supportY}
                          x2={chartCoords.width - chartCoords.padding.right}
                          y2={chartCoords.supportY}
                          stroke="#10b981"
                          strokeWidth="1.5"
                          strokeDasharray="4 4"
                        />
                      )}

                      {/* Bollinger Upper & Lower (Gold) */}
                      {showBollinger && (
                        <>
                          <polyline
                            fill="none"
                            stroke="#eab308"
                            strokeWidth="1.8"
                            points={chartCoords.bbUpperPoints}
                          />
                          <polyline
                            fill="none"
                            stroke="#eab308"
                            strokeWidth="1.8"
                            points={chartCoords.bbLowerPoints}
                          />
                        </>
                      )}

                      {/* SMA 50 Line (Purple) */}
                      {showSMA50 && (
                        <polyline
                          fill="none"
                          stroke="#a855f7"
                          strokeWidth="2"
                          points={chartCoords.sma50Points}
                        />
                      )}

                      {/* Stock Price Line (Blue) */}
                      <polyline
                        fill="none"
                        stroke="#2563eb"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={chartCoords.pricePoints}
                      />

                      {/* Interactive Hover Guides */}
                      {chartRecords.map((_, i) => {
                        const x = chartCoords.getX(i);
                        const stepW = chartCoords.width / chartRecords.length;
                        return (
                          <rect
                            key={i}
                            x={x - stepW / 2}
                            y={chartCoords.padding.top}
                            width={stepW}
                            height={chartCoords.height - chartCoords.padding.top - chartCoords.padding.bottom}
                            fill="transparent"
                            onMouseEnter={() => setHoverIndex(i)}
                          />
                        );
                      })}

                      {hoverIndex !== null && (
                        <line
                          x1={chartCoords.getX(hoverIndex)}
                          y1={chartCoords.padding.top}
                          x2={chartCoords.getX(hoverIndex)}
                          y2={chartCoords.height - chartCoords.padding.bottom}
                          stroke="#94a3b8"
                          strokeWidth="1.5"
                          strokeDasharray="3 3"
                        />
                      )}
                    </svg>
                  </div>
                </div>
              ) : (
                <div className="chart-empty-box">No chart records found.</div>
              )}
            </section>

            <section className="technical-analysis-card">
              <div className="section-header-banner">
                <Activity className="text-blue" size={20} />
                <h2>Technical Analysis Summary ({ticker})</h2>
              </div>
              
              <div className="tech-compact-grid">
                <div className="tech-chip-card">
                  <div className="chip-badge breakout">Breakout & Levels</div>
                  {(() => {
                    const p = currentDisplayPrice;
                    const r = activeStock.resistance;
                    const s = activeStock.support;
                    let desc = "";
                    if (r && p >= r * 0.99) {
                      desc = `Price at ${currSymbol}${p.toFixed(2)} testing Resistance Ceiling at ${currSymbol}${r.toFixed(2)} (potential breakout or seller pause zone).`;
                    } else if (s && p <= s * 1.01) {
                      desc = `Price at ${currSymbol}${p.toFixed(2)} testing Support Floor at ${currSymbol}${s.toFixed(2)} (critical buyer safety level).`;
                    } else if (s && r) {
                      desc = `Price at ${currSymbol}${p.toFixed(2)} consolidating within range between Support (${currSymbol}${s.toFixed(2)}) and Resistance (${currSymbol}${r.toFixed(2)}).`;
                    } else {
                      desc = `Price at ${currSymbol}${p.toFixed(2)} maintaining dynamic price envelope.`;
                    }
                    return <p className="chip-desc">{desc}</p>;
                  })()}
                </div>

                <div className="tech-chip-card">
                  {(() => {
                    const s20 = activeStock.sma20;
                    const s50 = activeStock.sma50;
                    if (s20 === null || s20 === undefined || s50 === null || s50 === undefined) {
                      return (
                        <>
                          <div className="chip-badge trend-neutral">Trend Direction</div>
                          <p className="chip-desc">
                            SMA 20 ({currSymbol}<strong>{s20?.toFixed(2) ?? "N/A"}</strong>) and SMA 50 ({currSymbol}<strong>{s50?.toFixed(2) ?? "N/A"}</strong>) <span className="sub-expl">(Calculating moving average alignment...)</span>.
                          </p>
                        </>
                      );
                    }
                    const diffPct = (s20 - s50) / s50;
                    const isFlat = Math.abs(diffPct) < 0.002;
                    const isUp = s20 > s50;
                    const operator = isFlat ? "≈" : isUp ? ">" : "<";
                    const badgeClass = isFlat ? "chip-badge trend-neutral" : isUp ? "chip-badge trend" : "chip-badge trend-down";
                    const trendExpl = isFlat
                      ? "converging moving averages: sideways consolidation"
                      : isUp
                      ? "SMA 20 > SMA 50: short-term trend outperforming medium-term baseline; bullish momentum"
                      : "SMA 20 < SMA 50: short-term trend lagging medium-term baseline; downward pressure";
                    return (
                      <>
                        <div className={badgeClass}>{isFlat ? "Neutral Drift" : isUp ? "Upward Momentum" : "Downward Pressure"}</div>
                        <p className="chip-desc">
                          SMA 20 ({currSymbol}<strong>{s20.toFixed(2)}</strong>) {operator} SMA 50 ({currSymbol}<strong>{s50.toFixed(2)}</strong>){" "}
                          <span className="sub-expl">({trendExpl})</span>.
                        </p>
                      </>
                    );
                  })()}
                </div>

                <div className="tech-chip-card">
                  <div className="chip-badge momentum">Momentum Gauge</div>
                  {(() => {
                    const rsi = activeStock.rsi;
                    const macd = activeStock.macd;
                    const macdSig = activeStock.macd_signal;
                    let rsiDesc = "healthy momentum corridor";
                    if (rsi !== null && rsi !== undefined) {
                      if (rsi >= 70) rsiDesc = "overbought zone (watch for consolidation)";
                      else if (rsi <= 30) rsiDesc = "oversold zone (potential accumulation)";
                      else if (rsi >= 50) rsiDesc = "positive momentum corridor";
                      else rsiDesc = "subdued momentum corridor";
                    }
                    const macdDesc = (macd !== undefined && macdSig !== undefined)
                      ? (macd >= macdSig ? "bullish MACD momentum" : "bearish MACD crossover")
                      : "monitoring MACD trend";
                    return (
                      <p className="chip-desc">
                        RSI at <strong>{rsi ? rsi.toFixed(1) : "N/A"}</strong> <span className="sub-expl">(0–100 index: {rsiDesc})</span> with {macdDesc}.
                      </p>
                    );
                  })()}
                </div>

                <div className="tech-chip-card">
                  <div className="chip-badge safety">Safety & Volatility</div>
                  <p className="chip-desc">
                    Floor Support at <strong>{currSymbol}{activeStock.support?.toFixed(2)}</strong> <span className="sub-expl">(Buyer safety level)</span> inside Bollinger Bands channel.
                  </p>
                </div>
              </div>
            </section>

            <section className="decision-section-card">
              <div className="section-header-banner">
                <Sparkles className="text-blue" size={22} />
                <h2>AI Investment Verdict: Whether to Invest or Not</h2>
              </div>

              <div className="decision-body">
                <div className="decision-callout">
                  <div className="callout-verdict">
                    <span className="verdict-label">Executive Recommendation</span>
                    <span className="verdict-badge">{activeStock.verdict}</span>
                  </div>
                  <p className="verdict-explanation">{renderCleanText(activeStock.verdict_desc)}</p>
                </div>

                <div className="decision-grid">
                  <div className="decision-box">
                    <h4>🎯 Short-Term Trading Strategy</h4>
                    <p>{renderCleanText(activeStock.short_term_strategy)}</p>
                  </div>
                  <div className="decision-box">
                    <h4>🏦 Long-Term Investment Strategy</h4>
                    <p>{renderCleanText(activeStock.long_term_strategy)}</p>
                  </div>
                  <div className="decision-box">
                    <h4>🔮 Future Outlook & Catalysts</h4>
                    <p>{renderCleanText(activeStock.future_outlook)}</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="debate-section-card">
              <div className="section-header-banner">
                <Scale className="text-blue" size={22} />
                <h2>Dual-Agent Adversarial Debate: Bull vs. Bear Case</h2>
              </div>

              <div className="debate-grid">
                {/* Bull Agent Card */}
                <div className="debate-box bull-card">
                  <div className="debate-box-header">
                    <div className="agent-avatar bull-avatar">🟢</div>
                    <div>
                      <h4>The Bull Case (Growth Analyst)</h4>
                      <span className="agent-role">Thesis: Long Conviction & Expansion Catalysts</span>
                    </div>
                  </div>
                  <div className="debate-text">{renderCleanText(activeStock.bull_case || "Strong secular tailwinds and high-margin product adoption drive long-term price appreciation.")}</div>
                </div>

                {/* Bear Agent Card */}
                <div className="debate-box bear-card">
                  <div className="debate-box-header">
                    <div className="agent-avatar bear-avatar">🔴</div>
                    <div>
                      <h4>The Bear Case (Short-Seller & Risk Auditor)</h4>
                      <span className="agent-role">Thesis: Downside Risks & Valuation Vulnerabilities</span>
                    </div>
                  </div>
                  <div className="debate-text">{renderCleanText(activeStock.bear_case || "Elevated valuation multiples and macro headwinds present key downside risks to monitor.")}</div>
                </div>
              </div>
            </section>

            <section className="risk-matrix-section">
              <div className="section-header-banner">
                <ShieldAlert className="text-red" size={22} />
                <h2>Comprehensive Risk Matrix & Negative Signals</h2>
              </div>

              <div className="risk-grid">
                <div className="risk-card">
                  <div className="risk-card-header">
                    <DollarSign size={18} className="text-blue" />
                    <h4>1. Financial & Valuation Risks</h4>
                  </div>
                  <p>
                    P/E valuation ({formatPE(activeStock.pe_ratio)}) and debt leverage ({formatDebtEquity(activeStock.debt_to_equity)}) require consistent cash flow generation.
                  </p>
                </div>

                <div className="risk-card">
                  <div className="risk-card-header">
                    <TrendingDown size={18} className="text-purple" />
                    <h4>2. Market & Macro Risks</h4>
                  </div>
                  <p>
                    Interest rate shifts and broad index pullbacks could test baseline support levels near {currSymbol}{activeStock.support?.toFixed(2)}.
                  </p>
                </div>

                <div className="risk-card">
                  <div className="risk-card-header">
                    <Layers size={18} className="text-green" />
                    <h4>3. Competitive & Technology Risks</h4>
                  </div>
                  <p>
                    Sector peers and capital expenditure demands require continuous R&D execution.
                  </p>
                </div>

                <div className="risk-card">
                  <div className="risk-card-header">
                    <AlertTriangle size={18} className="text-red" />
                    <h4>4. Regulatory & Supply Chain Risks</h4>
                  </div>
                  <p>
                    Government compliance, commercial licensing, and international trade policy exposure.
                  </p>
                </div>
              </div>

              <div className="detailed-risk-text-box">
                <div className="box-title">Risk Synthesis & Critical Warnings:</div>
                <div className="text-content">{renderCleanText(activeStock.risks_text)}</div>
              </div>
            </section>

            <section className="fundamentals-section">
              <div className="section-header-banner">
                <BarChart3 className="text-purple" size={22} />
                <h2>Company Fundamentals & Financial Health</h2>
              </div>

              <div className="metrics-tri-grid">
                <div className="f-box">
                  <span className="box-heading">Valuation Multiples</span>
                  <div className="metric-row">
                    <span>Market Cap <span className="m-note">(Total company value)</span></span>
                    <strong>{formatNumber(activeStock.market_cap, currSymbol)}</strong>
                  </div>
                  <div className="metric-row">
                    <span>Trailing P/E <span className="m-note">(Price vs past profit)</span></span>
                    <strong>{formatPE(activeStock.pe_ratio)}</strong>
                  </div>
                  <div className="metric-row">
                    <span>Forward P/E <span className="m-note">(Projected 1-yr valuation)</span></span>
                    <strong>{formatPE(activeStock.forward_pe, true)}</strong>
                  </div>
                  <div className="metric-row">
                    <span>Price to Book <span className="m-note">(P/B vs net assets)</span></span>
                    <strong>{formatPB(activeStock.price_to_book)}</strong>
                  </div>
                </div>

                <div className="f-box">
                  <span className="box-heading">Profitability & Margins</span>
                  <div className="metric-row">
                    <span>Operating Margin <span className="m-note">(Core profit %)</span></span>
                    <strong className={activeStock.operating_margin > 0 ? "text-green" : "text-red"}>
                      {formatPercent(activeStock.operating_margin)}
                    </strong>
                  </div>
                  <div className="metric-row">
                    <span>Net Profit Margin <span className="m-note">(Take-home profit %)</span></span>
                    <strong className={activeStock.profit_margin > 0 ? "text-green" : "text-red"}>
                      {formatPercent(activeStock.profit_margin)}
                    </strong>
                  </div>
                  <div className="metric-row">
                    <span>Return on Equity <span className="m-note">(ROE efficiency %)</span></span>
                    <strong className={activeStock.roe > 0 ? "text-green" : "text-red"}>
                      {formatPercent(activeStock.roe)}
                    </strong>
                  </div>
                  <div className="metric-row">
                    <span>YoY Revenue Growth <span className="m-note">(Annual sales rise)</span></span>
                    <strong className={activeStock.revenue_growth >= 0 ? "text-green" : "text-red"}>
                      {formatPercent(activeStock.revenue_growth, true)}
                    </strong>
                  </div>
                </div>

                <div className="f-box">
                  <span className="box-heading">Cash Flow & Health</span>
                  <div className="metric-row">
                    <span>Total Revenue <span className="m-note">(Annual gross sales)</span></span>
                    <strong>{formatNumber(activeStock.total_revenue, currSymbol)}</strong>
                  </div>
                  <div className="metric-row">
                    <span>Free Cash Flow <span className="m-note">(FCF surplus cash)</span></span>
                    <strong className={activeStock.free_cash_flow > 0 ? "text-green" : "text-red"}>
                      {formatNumber(activeStock.free_cash_flow, currSymbol)}
                    </strong>
                  </div>
                  <div className="metric-row">
                    <span>Debt to Equity <span className="m-note">(Financial leverage)</span></span>
                    <strong>{formatDebtEquity(activeStock.debt_to_equity)}</strong>
                  </div>
                  <div className="metric-row">
                    <span>Trading Volume <span className="m-note">(Liquidity activity)</span></span>
                    <strong>{formatVol(activeRecord?.volume || activeStock.volume)}</strong>
                  </div>
                </div>
              </div>
            </section>

            <section className="news-section">
              <div className="section-header-banner">
                <Newspaper className="text-blue" size={22} />
                <h2>Breaking Market News & Catalysts for {ticker}</h2>
              </div>

              <div className="news-grid">
                {activeStock.news && activeStock.news.length > 0 ? (
                  activeStock.news.map((item, idx) => (
                    <a
                      key={idx}
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="news-item-card"
                    >
                      <div className="news-top">
                        <span className="news-src">{item.source || "Market News"}</span>
                        <span className="news-time">{item.published_at?.slice(0, 10)}</span>
                      </div>
                      <h4 className="news-headline">{renderCleanText(item.title)}</h4>
                      {item.description && <p className="news-snippet">{renderCleanText(item.description)}</p>}
                      <div className="news-read-more">
                        <span>Read full coverage</span>
                        <ExternalLink size={13} />
                      </div>
                    </a>
                  ))
                ) : (
                  <p className="empty-news-text">No breaking articles found for {ticker}.</p>
                )}
              </div>
            </section>

            <section className="history-comparison-section">
              <div className="section-header-banner">
                <History className="text-blue" size={22} />
                <h2>Historical Shift & Thesis Evolution</h2>
              </div>

              {activeStock.previous_analysis ? (
                <div className="comparison-box">
                  <div className="comp-stats-row">
                    <span>Previous Date: <strong>{activeStock.previous_date?.slice(0, 10)}</strong></span>
                    <span>Previous Price: <strong>{currSymbol}{activeStock.previous_price?.toFixed(2)}</strong></span>
                    <span>Current Price: <strong>{currSymbol}{currentDisplayPrice.toFixed(2)}</strong></span>
                    {activeStock.previous_price && (
                      <span className={currentDisplayPrice >= activeStock.previous_price ? "text-green font-bold" : "text-red font-bold"}>
                        Price Shift: {((currentDisplayPrice - activeStock.previous_price) / activeStock.previous_price * 100).toFixed(2)}%
                      </span>
                    )}
                  </div>
                  <div className="prev-report-snippet">
                    <strong>Prior Evaluation & Outlook:</strong>
                    <p>{renderCleanText(activeStock.previous_analysis)}</p>
                  </div>
                </div>
              ) : (
                <div className="comparison-empty">
                  <Info size={18} className="text-blue" />
                  <span>Initial baseline established for <strong>{ticker}</strong>. Future visits to this stock will automatically display how price targets and risk profiles evolve over time.</span>
                </div>
              )}
            </section>

            <section className="embedded-chat-section">
              <div className="section-header-banner">
                <MessageSquare className="text-blue" size={22} />
                <h2>Ask Follow-Up Questions About {ticker}</h2>
              </div>

              <div className="embedded-chat-container">
                <div className="chat-log" ref={chatLogRef}>
                  {chatMessages.map((m, i) => (
                    <div key={i} className={`chat-row ${m.role}`}>
                      <div className="chat-bubble">
                        <p>{renderCleanText(m.text)}</p>
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="chat-row assistant">
                      <div className="chat-bubble loading">
                        <RefreshCw className="spin-icon" size={14} />
                        <span>Analyst is evaluating...</span>
                      </div>
                    </div>
                  )}
                </div>

                <form className="chat-bar" onSubmit={handleSendMessage}>
                  <input
                    type="text"
                    placeholder={`Ask anything about ${ticker} (e.g. "Should I buy at current price?", "Explain the resistance level")...`}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={chatLoading}
                  />
                  <button type="submit" disabled={chatLoading || !chatInput.trim()}>
                    <Send size={15} />
                    <span>Send</span>
                  </button>
                </form>
              </div>
            </section>
          </div>
        )}

        {activeTab === "history" && (
          <div className="history-view-page">
            <div className="section-heading-row">
              <div className="heading-left">
                <History className="text-blue" size={24} />
                <h2>Saved Analysis History ({historyList.length})</h2>
              </div>
              <div className="header-action-group">
                <button
                  className="btn-export-report"
                  onClick={() => fetchAndSyncHistory()}
                  title="Refresh latest saved analyses from database"
                >
                  <RefreshCw size={14} />
                  <span>Sync DB</span>
                </button>
                {historyList.length > 0 && (
                  <button
                    className="btn-export-report"
                    onClick={clearAllHistory}
                    title="Clear session history"
                    style={{ borderColor: "#f43f5e", color: "#f43f5e" }}
                  >
                    <span>Clear History</span>
                  </button>
                )}
                <button className="btn-back" onClick={() => setActiveTab("dashboard")}>
                  ← Back to Dashboard
                </button>
              </div>
            </div>

            <p className="history-subtitle">
              Review previous AI stock evaluations, price snapshots, and thesis shifts over time.
            </p>

            {historyList.length > 0 ? (
              <div className="history-list-grid">
                {historyList.map((item, idx) => (
                  <div key={idx} className="hist-card">
                    <div className="hist-top">
                      <div className="hist-ticker-badge">{item.ticker || ticker}</div>
                      <span className="hist-date">{item.created_at?.slice(0, 19).replace("T", " ")}</span>
                    </div>
                    {item.current_price && (
                      <div className="hist-price-row">
                        <span>Price at Analysis:</span>
                        <strong className="text-green">
                          {(item.currency_symbol || (item.ticker ? detectCurrency(item.ticker).symbol : "$"))}{Number(item.current_price).toFixed(2)}
                        </strong>
                      </div>
                    )}
                    <h4 className="hist-query">"{item.user_query}"</h4>
                    <p className="hist-text">{renderCleanText(item.analysis?.slice(0, 480))}...</p>
                    <button
                      className="btn-view-hist-stock"
                      onClick={() => {
                        loadStock(item.ticker || ticker, period);
                        setActiveTab("dashboard");
                      }}
                    >
                      Open Live Dashboard for {item.ticker || ticker} →
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-box">
                <History size={36} className="text-muted" />
                <p>No saved analyses found in history yet.</p>
                <span className="text-muted" style={{ fontSize: "12.5px" }}>
                  Whenever you search and evaluate a stock, your research history will be automatically saved here.
                </span>
              </div>
            )}
          </div>
        )}

        {activeTab === "watchlist" && (
          <div className="watchlist-view-page">
            <div className="section-heading-row">
              <h2>Stock Watch List</h2>
              <button className="btn-back" onClick={() => setActiveTab("dashboard")}>
                ← Back to Dashboard
              </button>
            </div>

            <div className="watch-grid">
              {watchlist.map((sym) => (
                <div key={sym} className="watch-card">
                  <div className="watch-top">
                    <span className="watch-sym">{sym}</span>
                    <button
                      className="btn-del"
                      onClick={() => toggleWatchlist(sym)}
                      title="Remove from Watchlist"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="watch-desc">{sym === ticker ? activeStock.company : `${sym} Monitored Equity`}</p>
                  <button
                    className="btn-analyze-sym"
                    onClick={() => {
                      loadStock(sym, period);
                      setActiveTab("dashboard");
                    }}
                  >
                    View Analysis →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}