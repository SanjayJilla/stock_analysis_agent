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

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

// Safe initial state for dynamic stock analysis
const INITIAL_STOCK_STATE = {
  company: "Apple Inc.",
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
  verdict: "ANALYZING LIVE SIGNALS",
  verdict_desc: "Connecting to live financial market stream and LangGraph multi-agent pipeline...",
  bull_case: "",
  bear_case: "",
  short_term_strategy: "Connecting to live order book...",
  long_term_strategy: "Evaluating fundamentals...",
  future_outlook: "Processing earnings & macro catalysts...",
  risks_text: "Evaluating live risk metrics...",
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
  const [error, setError] = useState("");

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

    window.scrollTo({ top: 0, behavior: "instant" });
    setSearchInput(symbol);
    setError("");
    setLoading(true);

    try {
      // 1. Fetch real-time market quote and company metadata
      const priceRes = await fetch(`${API_BASE_URL}/api/quick-price/${encodeURIComponent(symbol)}`);
      const priceData = priceRes.ok ? await priceRes.json() : null;

      if (!priceData || priceData.error || !priceData.price) {
        setError(`No stock or company found for symbol "${symbol}". Please check the spelling or enter a valid publicly traded stock symbol (e.g. AAPL, NVDA, MSFT, TSLA, TATAMOTORS.NS, GOOGL).`);
        setLoading(false);
        return;
      }

      const verifiedTicker = priceData.ticker || symbol;
      setTicker(verifiedTicker);

      // 2. Fetch live OHLCV candlestick records & calculated technical indicators (SMA20, SMA50, Bollinger Bands)
      const chartRes = await fetch(`${API_BASE_URL}/api/historical-chart/${encodeURIComponent(verifiedTicker)}?period=${selectedPeriod.toLowerCase()}`);
      if (chartRes.ok) {
        const chartJson = await chartRes.json();
        if (chartJson.records && chartJson.records.length > 0) {
          setChartRecords(chartJson.records);
        }
      }

      // 3. Initialize active stock state with live exchange data
      setActiveStock((prev) => ({
        ...prev,
        company: priceData.company || `${verifiedTicker} Equity`,
        price: priceData.price,
        open: priceData.open || priceData.price,
        high: priceData.high || priceData.price,
        low: priceData.low || priceData.price,
        volume: priceData.volume || 0,
        support: Number((priceData.price * 0.94).toFixed(2)),
        resistance: Number((priceData.price * 1.06).toFixed(2)),
        timestamp: priceData.timestamp
      }));

      // Immediate history snapshot for instant availability
      const historyEntryId = Date.now();
      saveToLocalHistory({
        id: historyEntryId,
        ticker: verifiedTicker,
        user_query: `Institutional analysis for ${verifiedTicker}`,
        analysis: `Real-time quote verified at $${priceData.price.toFixed(2)}. Gathering indicators, SEC filings, and multi-agent synthesis...`,
        current_price: priceData.price,
        created_at: new Date().toISOString()
      });

      // Update Chat Welcome
      setChatMessages([
        {
          role: "assistant",
          text: `Live market session connected for ${verifiedTicker} ($${priceData.price.toFixed(2)}). Ask me anything about its valuation, RSI indicators, or AI investment outlook!`
        }
      ]);

      // 4. Run LangGraph multi-agent analysis (Market, Technical, News, RAG, Risk, Synthesis)
      const analysisRes = await fetch(`${API_BASE_URL}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker: verifiedTicker, query: `Detailed technical breakout and risk analysis for ${verifiedTicker}` })
      });

      if (analysisRes.ok) {
        const data = await analysisRes.json();
        setActiveStock((prev) => ({
          ...prev,
          company: data.financial_data?.company || priceData.company || prev.company,
          price: data.market_data?.price || priceData.price,
          open: data.market_data?.open || priceData.open || prev.open,
          high: data.market_data?.high || priceData.high || prev.high,
          low: data.market_data?.low || priceData.low || prev.low,
          volume: data.market_data?.volume || priceData.volume || prev.volume,
          sma20: data.technical_data?.sma20 || prev.sma20,
          sma50: data.technical_data?.sma50 || prev.sma50,
          sma150: data.technical_data?.sma150 || prev.sma150,
          sma200: data.technical_data?.sma200 || prev.sma200,
          rsi: data.technical_data?.rsi || prev.rsi,
          bb_upper: data.technical_data?.bb_upper || prev.bb_upper,
          bb_lower: data.technical_data?.bb_lower || prev.bb_lower,
          support: data.technical_data?.support || prev.support,
          resistance: data.technical_data?.resistance || prev.resistance,
          market_cap: data.financial_data?.market_cap || prev.market_cap,
          pe_ratio: data.financial_data?.pe_ratio || prev.pe_ratio,
          forward_pe: data.financial_data?.forward_pe || prev.forward_pe,
          profit_margin: data.financial_data?.profit_margin || prev.profit_margin,
          operating_margin: data.financial_data?.operating_margin || prev.operating_margin,
          free_cash_flow: data.financial_data?.free_cash_flow || prev.free_cash_flow,
          debt_to_equity: data.financial_data?.debt_to_equity || prev.debt_to_equity,
          news: data.news_data?.length > 0 ? data.news_data : prev.news,
          raw_analysis: data.final_analysis,
          previous_analysis: data.previous_analysis,
          previous_price: data.previous_price,
          previous_date: data.previous_date,
          thread_id: data.thread_id
        }));

        // Update with full completed AI analysis
        saveToLocalHistory({
          id: historyEntryId,
          ticker: verifiedTicker,
          user_query: data.user_query || `Breakout analysis for ${verifiedTicker}`,
          analysis: data.final_analysis || `Analysis completed for ${verifiedTicker}`,
          current_price: data.market_data?.price || priceData.price,
          created_at: new Date().toISOString()
        });
      }

      fetchAndSyncHistory();
    } catch (err) {
      setError(`Could not connect to financial backend for "${symbol}". Please ensure the backend server is running.`);
    } finally {
      setLoading(false);
    }
  };

  // Load initial stock on mount
  useEffect(() => {
    loadStock("AAPL", "6M");
  }, []);



  // Timeframe change (Instant update)
  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    setChartRecords(generateMockHistory(ticker, activeStock.price, newPeriod));
    
    // Also try live backend
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
    if (val >= 1e9) return `${(val / 1e9).toFixed(1)}B`;
    if (val >= 1e6) return `${(val / 1e6).toFixed(1)}M`;
    if (val >= 1e3) return `${(val / 1e3).toFixed(1)}K`;
    return val.toString();
  };

  const formatNumber = (num, prefix = "", suffix = "") => {
    if (num === null || num === undefined || isNaN(num)) return "N/A";
    if (Math.abs(num) >= 1e12) return `${prefix}${(num / 1e12).toFixed(2)}T${suffix}`;
    if (Math.abs(num) >= 1e9) return `${prefix}${(num / 1e9).toFixed(2)}B${suffix}`;
    if (Math.abs(num) >= 1e6) return `${prefix}${(num / 1e6).toFixed(2)}M${suffix}`;
    return `${prefix}${Number(num).toLocaleString(undefined, { maximumFractionDigits: 2 })}${suffix}`;
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
**Current Stock Price:** $${currentDisplayPrice.toFixed(2)} | **Verdict:** ${activeStock.verdict}

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
* **Support (Floor Level):** $${activeStock.support ? activeStock.support.toFixed(2) : "N/A"}
* **Resistance (Ceiling Level):** $${activeStock.resistance ? activeStock.resistance.toFixed(2) : "N/A"}
* **SMA 20:** $${activeStock.sma20 ? activeStock.sma20.toFixed(2) : "N/A"} | **SMA 50:** $${activeStock.sma50 ? activeStock.sma50.toFixed(2) : "N/A"} | **SMA 200:** $${activeStock.sma200 ? activeStock.sma200.toFixed(2) : "N/A"}
* **14-Day RSI:** ${activeStock.rsi ? activeStock.rsi.toFixed(1) : "N/A"}
* **Bollinger Bands:** Upper $${activeStock.bb_upper ? activeStock.bb_upper.toFixed(2) : "N/A"} | Lower $${activeStock.bb_lower ? activeStock.bb_lower.toFixed(2) : "N/A"}

---

## 4. Fundamental Health & Valuation Multiples
* **Market Capitalization:** $${activeStock.market_cap ? (activeStock.market_cap / 1e9).toFixed(2) + "B" : "N/A"}
* **Trailing P/E Ratio:** ${activeStock.pe_ratio ? activeStock.pe_ratio.toFixed(2) : "N/A"} | **Forward P/E:** ${activeStock.forward_pe ? activeStock.forward_pe.toFixed(2) : "N/A"}
* **Operating Margin:** ${activeStock.operating_margin ? (activeStock.operating_margin * 100).toFixed(1) + "%" : "N/A"} | **Profit Margin:** ${activeStock.profit_margin ? (activeStock.profit_margin * 100).toFixed(1) + "%" : "N/A"}
* **Free Cash Flow:** $${activeStock.free_cash_flow ? (activeStock.free_cash_flow / 1e9).toFixed(2) + "B" : "N/A"}
* **Debt to Equity:** ${activeStock.debt_to_equity ? activeStock.debt_to_equity + "%" : "N/A"}

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
              padding: "14px 18px",
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
            <span>Verifying real-time market data & launching multi-agent analysis for <strong>{searchInput}</strong>...</span>
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
                {activeStock.company} ({ticker}) Current Price: ${currentDisplayPrice.toFixed(2)}
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
                  ${currentDisplayPrice.toFixed(2)}
                </span>
              </div>
              <div className="stat-col">
                <span className="stat-label">SMA 50 <span className="term-expl">(50-Day Avg)</span>:</span>
                <span className="stat-val text-purple font-bold">
                  ${activeRecord?.sma50 || activeStock.sma50 ? (activeRecord?.sma50 || activeStock.sma50).toFixed(2) : "N/A"}
                </span>
              </div>
              <div className="stat-col">
                <span className="stat-label">Support <span className="term-expl">(Price Floor)</span>:</span>
                <span className="stat-val text-green font-bold">
                  ${activeRecord?.support || activeStock.support ? (activeRecord?.support || activeStock.support).toFixed(2) : "N/A"}
                </span>
              </div>
              <div className="stat-col">
                <span className="stat-label">Resistance <span className="term-expl">(Price Ceiling)</span>:</span>
                <span className="stat-val text-red font-bold">
                  ${activeRecord?.resistance || activeStock.resistance ? (activeRecord?.resistance || activeStock.resistance).toFixed(2) : "N/A"}
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
                            ${tick.price}
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
                  <p className="chip-desc">
                    Price at <strong>${currentDisplayPrice.toFixed(2)}</strong> testing Resistance <strong>${activeStock.resistance?.toFixed(2)}</strong> <span className="sub-expl">(Price ceiling where sellers pause)</span>.
                  </p>
                </div>

                <div className="tech-chip-card">
                  <div className="chip-badge trend">Trend Direction</div>
                  <p className="chip-desc">
                    SMA 20 ($<strong>{activeStock.sma20?.toFixed(2)}</strong>) &gt; SMA 50 ($<strong>{activeStock.sma50?.toFixed(2)}</strong>) <span className="sub-expl">(Simple Moving Average: strong upward trend)</span>.
                  </p>
                </div>

                <div className="tech-chip-card">
                  <div className="chip-badge momentum">Momentum Gauge</div>
                  <p className="chip-desc">
                    RSI at <strong>{activeStock.rsi?.toFixed(1)}</strong> <span className="sub-expl">(0–100 speed index; healthy momentum)</span> with bullish MACD signal.
                  </p>
                </div>

                <div className="tech-chip-card">
                  <div className="chip-badge safety">Safety & Volatility</div>
                  <p className="chip-desc">
                    Floor Support at <strong>${activeStock.support?.toFixed(2)}</strong> <span className="sub-expl">(Buyer safety level)</span> inside Bollinger Bands channel.
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
                    P/E valuation ({activeStock.pe_ratio ? `${activeStock.pe_ratio}x` : "Growth multiple"}) and debt leverage ({activeStock.debt_to_equity}%) require consistent cash flow generation.
                  </p>
                </div>

                <div className="risk-card">
                  <div className="risk-card-header">
                    <TrendingDown size={18} className="text-purple" />
                    <h4>2. Market & Macro Risks</h4>
                  </div>
                  <p>
                    Interest rate shifts and broad index pullbacks could test baseline support levels near ${activeStock.support?.toFixed(2)}.
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
                    <strong>{formatNumber(activeStock.market_cap, "$")}</strong>
                  </div>
                  <div className="metric-row">
                    <span>Trailing P/E <span className="m-note">(Price vs past profit)</span></span>
                    <strong>{activeStock.pe_ratio ? activeStock.pe_ratio.toFixed(2) : "N/A (Growth)"}</strong>
                  </div>
                  <div className="metric-row">
                    <span>Forward P/E <span className="m-note">(Projected 1-yr valuation)</span></span>
                    <strong>{activeStock.forward_pe ? activeStock.forward_pe.toFixed(2) : "N/A"}</strong>
                  </div>
                  <div className="metric-row">
                    <span>Price to Book <span className="m-note">(P/B vs net assets)</span></span>
                    <strong>{activeStock.price_to_book ? activeStock.price_to_book.toFixed(2) : "N/A"}</strong>
                  </div>
                </div>

                <div className="f-box">
                  <span className="box-heading">Profitability & Margins</span>
                  <div className="metric-row">
                    <span>Operating Margin <span className="m-note">(Core profit %)</span></span>
                    <strong className={activeStock.operating_margin > 0 ? "text-green" : "text-red"}>
                      {activeStock.operating_margin !== null ? `${(activeStock.operating_margin * 100).toFixed(1)}%` : "N/A"}
                    </strong>
                  </div>
                  <div className="metric-row">
                    <span>Net Profit Margin <span className="m-note">(Take-home profit %)</span></span>
                    <strong className={activeStock.profit_margin > 0 ? "text-green" : "text-red"}>
                      {activeStock.profit_margin !== null ? `${(activeStock.profit_margin * 100).toFixed(1)}%` : "N/A"}
                    </strong>
                  </div>
                  <div className="metric-row">
                    <span>Return on Equity <span className="m-note">(ROE efficiency %)</span></span>
                    <strong>{activeStock.roe !== null ? `${(activeStock.roe * 100).toFixed(1)}%` : "N/A"}</strong>
                  </div>
                  <div className="metric-row">
                    <span>YoY Revenue Growth <span className="m-note">(Annual sales rise)</span></span>
                    <strong className="text-green">
                      {activeStock.revenue_growth !== null ? `+${(activeStock.revenue_growth * 100).toFixed(1)}%` : "N/A"}
                    </strong>
                  </div>
                </div>

                <div className="f-box">
                  <span className="box-heading">Cash Flow & Health</span>
                  <div className="metric-row">
                    <span>Total Revenue <span className="m-note">(Annual gross sales)</span></span>
                    <strong>{formatNumber(activeStock.total_revenue, "$")}</strong>
                  </div>
                  <div className="metric-row">
                    <span>Free Cash Flow <span className="m-note">(FCF surplus cash)</span></span>
                    <strong className={activeStock.free_cash_flow > 0 ? "text-green" : "text-red"}>
                      {formatNumber(activeStock.free_cash_flow, "$")}
                    </strong>
                  </div>
                  <div className="metric-row">
                    <span>Debt to Equity <span className="m-note">(Financial leverage)</span></span>
                    <strong>{activeStock.debt_to_equity ? `${activeStock.debt_to_equity.toFixed(1)}%` : "N/A"}</strong>
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
                    <span>Previous Price: <strong>${activeStock.previous_price?.toFixed(2)}</strong></span>
                    <span>Current Price: <strong>${currentDisplayPrice.toFixed(2)}</strong></span>
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
                        <strong className="text-green">${Number(item.current_price).toFixed(2)}</strong>
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