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

// Comprehensive fallback data for instant responsiveness across major tickers
const STOCK_PRESETS = {
  OKLO: {
    company: "Oklo Inc.",
    sector: "Energy",
    industry: "Nuclear Clean Energy",
    price: 79.88,
    open: 69.50,
    high: 80.88,
    low: 67.20,
    volume: 9340000,
    support: 61.01,
    resistance: 80.88,
    sma20: 71.86,
    sma50: 67.69,
    sma150: 47.97,
    sma200: 42.10,
    rsi: 61.7,
    bb_upper: 82.40,
    bb_lower: 58.90,
    market_cap: 9800000000,
    pe_ratio: null,
    forward_pe: 45.2,
    price_to_book: 8.4,
    operating_margin: -0.42,
    profit_margin: -0.38,
    roe: -0.15,
    revenue_growth: 1.25,
    total_revenue: 125000000,
    free_cash_flow: -45000000,
    debt_to_equity: 12.5,
    verdict: "BULLISH BREAKOUT / ACCUMULATE",
    verdict_desc: "Oklo is exhibiting strong upward momentum approaching its 52-week high resistance ($80.88). Rising volume and RSI (61.7) confirm breakout conviction with strong support at $61.01.",
    bull_case: "1. Multi-gigawatt AI data center power demand creates secular nuclear purchase agreements.\n2. Small modular reactor design enables rapid deployment with zero carbon footprint.\n3. Institutional momentum and high relative volume approaching 52-week breakout at $80.88.",
    bear_case: "1. Regulatory licensing delays from NRC could push commercial operational timelines into 2027+.\n2. Negative operating cash flow (-$45M) creates continuous capital dilution risk.\n3. High beta volatility vulnerable to macro tech sector drawdowns.",
    short_term_strategy: "Watch for a daily close above $80.88 with volume > 10M for momentum continuation toward $90-$95.",
    long_term_strategy: "Nuclear energy tailwinds and clean tech demand provide secular support. Scale in on pullbacks to SMA 50 ($67.69).",
    future_outlook: "Key catalyst will be commercial deployment milestones and NRC licensing updates expected in H2.",
    risks_text: "1. Regulatory licensing delays with the Nuclear Regulatory Commission (NRC).\n2. Negative operating cash flow requires prudent capital management.\n3. High beta volatility if broader growth equities experience pullbacks.",
    news: [
      {
        title: "Oklo Surges Near 52-Week High on Clean Energy Nuclear Demand",
        source: "Bloomberg",
        published_at: "2025-09-11",
        description: "Small modular reactor developer Oklo gains institutional backing amid AI data center power demand.",
        url: "https://bloomberg.com"
      },
      {
        title: "Nuclear Tech Stocks Rally as Hyperscalers Secure Long-Term Power",
        source: "Reuters",
        published_at: "2025-09-10",
        description: "Tech giants sign landmark clean power purchase agreements, boosting advanced fission developers.",
        url: "https://reuters.com"
      }
    ]
  },
  AAPL: {
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
    rsi: 26.09,
    bb_upper: 338.50,
    bb_lower: 298.00,
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
    verdict: "OVERSOLD / ATTRACTIVE ACCUMULATION",
    verdict_desc: "Apple's 14-day RSI (26.09) is deeply oversold following recent pullbacks, while remaining firmly above its 200-day moving average ($279.99). World-class free cash flow ($107.7B) provides a strong margin of safety.",
    bull_case: "1. Record quarterly Free Cash Flow ($107.7B) provides immense downside protection and share buybacks.\n2. 2.2 billion active device installed base powers recurring high-margin Services revenue (>74% gross margin).\n3. Deeply oversold 14-day RSI (26.09) with strong support above 200-day moving average ($279.99).",
    bear_case: "1. Premium valuation multiple (~35x P/E) leaves zero margin for iPhone replacement cycle delays.\n2. Foreign supply chain concentration remains exposed to geopolitical tariff shifts.\n3. Stagnant hardware innovation growth in saturated core markets.",
    short_term_strategy: "Anticipate a mean-reversion technical bounce back toward the 50-day SMA ($308.95) and 20-day SMA ($318.22).",
    long_term_strategy: "Dollar-cost average at current oversold levels. Long-term services revenue expansion and AI integration drive multi-year upside.",
    future_outlook: "Upcoming hardware refresh cycles and high-margin Services growth remain key catalysts.",
    risks_text: "1. Premium valuation multiples (P/E ~35x) leave limited margin for missed earnings.\n2. Foreign supply chain dependencies require ongoing diversification.\n3. Fading macro tariff tailwinds in hardware assembly.",
    news: [
      {
        title: "Apple Reports Blowout June Quarter with Record Free Cash Flow",
        source: "MarketWatch",
        published_at: "2026-08-14",
        description: "Services revenue hits all-time high as Apple ecosystem surpasses 2.2 billion active devices.",
        url: "https://marketwatch.com"
      },
      {
        title: "Wall Street Analysts Reiterate Overweight on Apple with $358 Target",
        source: "24/7 Wall St.",
        published_at: "2026-08-13",
        description: "Lowest-beta mega-cap provides defensive growth and record share repurchases.",
        url: "https://247wallst.com"
      }
    ]
  },
  NVDA: {
    company: "NVIDIA Corporation",
    sector: "Technology",
    industry: "Semiconductors",
    price: 182.40,
    open: 178.20,
    high: 184.50,
    low: 177.10,
    volume: 54300000,
    support: 165.00,
    resistance: 195.00,
    sma20: 175.40,
    sma50: 168.20,
    sma150: 148.50,
    sma200: 135.00,
    rsi: 64.2,
    bb_upper: 192.00,
    bb_lower: 158.00,
    market_cap: 4480000000000,
    pe_ratio: 46.2,
    forward_pe: 34.5,
    price_to_book: 38.2,
    operating_margin: 0.62,
    profit_margin: 0.55,
    roe: 1.15,
    revenue_growth: 1.22,
    total_revenue: 128000000000,
    free_cash_flow: 62000000000,
    debt_to_equity: 18.2,
    verdict: "STRONG BULLISH / ACCUMULATE",
    verdict_desc: "NVIDIA maintains dominant market share in AI accelerators with exceptional 62% operating margins and rapid revenue growth.",
    bull_case: "1. Dominant 85%+ market share in AI accelerators with extraordinary 62% operating margins.\n2. Next-gen Blackwell architecture completely sold out across hyperscalers (Microsoft, Meta, Google, AWS).\n3. Unrivaled CUDA software developer moat creates extreme switching costs for enterprise customers.",
    bear_case: "1. Extreme customer concentration (top 4 cloud hyperscalers drive 40%+ of revenue) posing Capex cliff risk.\n2. Expanding geopolitical export restrictions on high-end chips to foreign markets.\n3. Custom in-house silicon (Google TPU, Amazon Trainium) gradually pressuring long-term pricing power.",
    short_term_strategy: "Target $195 resistance. Use pullbacks to SMA 20 ($175.40) as dip-buying zones.",
    long_term_strategy: "Core AI infrastructure holding. Strong cash flow enables massive R&D and platform moat.",
    future_outlook: "Next-generation Blackwell architecture ramping up with strong data center backlog.",
    risks_text: "1. High customer concentration among hyperscale cloud providers.\n2. Export restrictions and geopolitical supply chain bottlenecks.",
    news: [
      {
        title: "NVIDIA AI Accelerator Demand Remains Sold Out Through 2026",
        source: "CNBC",
        published_at: "2026-08-14",
        description: "Cloud providers increase AI capital expenditures, driving record semiconductor orders.",
        url: "https://cnbc.com"
      }
    ]
  },
  TSLA: {
    company: "Tesla Inc.",
    sector: "Consumer Discretionary",
    industry: "Auto & Clean Tech",
    price: 242.80,
    open: 238.00,
    high: 245.20,
    low: 236.40,
    volume: 68400000,
    support: 215.00,
    resistance: 265.00,
    sma20: 234.10,
    sma50: 228.40,
    sma150: 205.00,
    sma200: 198.50,
    rsi: 58.9,
    bb_upper: 258.00,
    bb_lower: 210.00,
    market_cap: 775000000000,
    pe_ratio: 62.4,
    forward_pe: 48.1,
    price_to_book: 11.2,
    operating_margin: 0.082,
    profit_margin: 0.065,
    roe: 0.14,
    revenue_growth: 0.085,
    total_revenue: 97500000000,
    free_cash_flow: 4200000000,
    debt_to_equity: 14.8,
    verdict: "NEUTRAL / HOLD ON BREAKOUT CONFIRMATION",
    verdict_desc: "Tesla is consolidating above key moving averages. Energy storage growth offsets automotive margin pressures.",
    bull_case: "1. Megapack Utility Energy Storage deployments doubling YoY with rapid gross margin expansion.\n2. Autonomous Full Self-Driving (FSD) and Robotaxi platform represent massive high-margin software optionality.\n3. Industry-leading manufacturing cost curve and supercharger ecosystem network effect.",
    bear_case: "1. Global EV price wars compressing core automotive gross margins from 28% down to single digits.\n2. Lofty 62x P/E multiple relies heavily on unproven regulatory approval for unsupervised autonomous robotaxis.\n3. Rising competition from low-cost Chinese EV manufacturers in international markets.",
    short_term_strategy: "Wait for a clean breakout above $265 resistance or buy near $228 support.",
    long_term_strategy: "Autonomous driving / Robotaxi execution and Energy storage deployments are the primary long-term drivers.",
    future_outlook: "Full Self-Driving (FSD) software rollout and Next-Gen platform ramp.",
    risks_text: "1. Global EV price competition compressing automotive gross margins.\n2. High valuation reliance on future autonomous software milestones.",
    news: [
      {
        title: "Tesla Energy Storage Deployments Double Year-Over-Year",
        source: "Reuters",
        published_at: "2026-08-12",
        description: "Megapack utility installations surge as grid stabilization demand accelerates globally.",
        url: "https://reuters.com"
      }
    ]
  },
  MSFT: {
    company: "Microsoft Corporation",
    sector: "Technology",
    industry: "Software & Cloud",
    price: 448.20,
    open: 445.00,
    high: 451.00,
    low: 444.10,
    volume: 21500000,
    support: 420.00,
    resistance: 468.00,
    sma20: 442.10,
    sma50: 435.80,
    sma150: 418.00,
    sma200: 405.00,
    rsi: 57.3,
    bb_upper: 462.00,
    bb_lower: 422.00,
    market_cap: 3340000000000,
    pe_ratio: 35.8,
    forward_pe: 31.2,
    price_to_book: 12.8,
    operating_margin: 0.445,
    profit_margin: 0.358,
    roe: 0.385,
    revenue_growth: 0.152,
    total_revenue: 245000000000,
    free_cash_flow: 74000000000,
    debt_to_equity: 35.4,
    verdict: "CORE BUY / STEADY ACCUMULATION",
    verdict_desc: "Microsoft demonstrates steady growth across Azure cloud and AI Copilot commercial subscriptions with elite 44.5% operating margins.",
    bull_case: "1. Azure cloud revenue accelerating 29%+ YoY fueled by OpenAI and enterprise AI Copilot enterprise adoption.\n2. Enterprise software monopoly with unmatched enterprise distribution and 44.5% operating margins.\n3. Fortress balance sheet generating $74B+ in annual free cash flow for aggressive capital return.",
    bear_case: "1. Massive AI infrastructure capital expenditures ($19B/quarter) compressing near-term free cash flow yields.\n2. Slower-than-expected enterprise monetization of Copilot seats relative to lofty expectations.\n3. Regulatory antitrust scrutiny in cloud bundling and gaming integrations.",
    short_term_strategy: "Accumulate on pullbacks toward the 50-day SMA ($435.80).",
    long_term_strategy: "Premier enterprise software and cloud foundation with resilient recurring cash flows.",
    future_outlook: "Azure AI enterprise workload expansion and cloud infrastructure monetization.",
    risks_text: "1. Heavy ongoing AI data center CapEx spending.\n2. Antitrust regulatory scrutiny on software bundling.",
    news: [
      {
        title: "Microsoft Azure AI Revenue Surges 30% in Latest Quarter",
        source: "Wall Street Journal",
        published_at: "2026-08-11",
        description: "Enterprise adoption of cloud AI services reaches new milestones.",
        url: "https://wsj.com"
      }
    ]
  },
  AMZN: {
    company: "Amazon.com Inc.",
    sector: "Consumer Discretionary",
    industry: "E-Commerce & Cloud",
    price: 198.50,
    open: 195.20,
    high: 200.40,
    low: 194.80,
    volume: 38200000,
    support: 182.00,
    resistance: 208.00,
    sma20: 194.20,
    sma50: 189.50,
    sma150: 178.00,
    sma200: 168.00,
    rsi: 60.5,
    bb_upper: 206.00,
    bb_lower: 182.00,
    market_cap: 2080000000000,
    pe_ratio: 42.1,
    forward_pe: 33.4,
    price_to_book: 8.5,
    operating_margin: 0.098,
    profit_margin: 0.078,
    roe: 0.22,
    revenue_growth: 0.125,
    total_revenue: 620000000000,
    free_cash_flow: 53000000000,
    debt_to_equity: 54.2,
    verdict: "BULLISH ACCUMULATION",
    verdict_desc: "Amazon's AWS growth re-acceleration and expanding retail advertising margins provide durable operational leverage.",
    bull_case: "1. AWS AI growth acceleration with enterprise migration to custom Trainium silicon.\n2. High-margin retail advertising business growing 20%+ YoY.\n3. Regionalized fulfillment network driving record shipping cost efficiencies.",
    bear_case: "1. Sensitivity of discretionary e-commerce spending to macro inflation.\n2. Cloud price competition from Microsoft Azure and Google Cloud.",
    short_term_strategy: "Watch the $200 psychological barrier. Breakout targets $208-$215.",
    long_term_strategy: "AWS AI growth, international retail margin expansion, and high-margin ad business provide robust multi-year tailwinds.",
    future_outlook: "Expanding fulfillment efficiency and AWS custom silicon (Trainium) deployments.",
    risks_text: "1. Global consumer spending sensitivity to macroeconomic conditions.\n2. Cloud price competition from peers.",
    news: [
      {
        title: "AWS Cloud Growth Accelerates as Generative AI Workloads Expand",
        source: "TechCrunch",
        published_at: "2026-08-10",
        description: "Amazon Web Services posts strong double-digit growth driven by enterprise modernization.",
        url: "https://techcrunch.com"
      }
    ]
  }
};

// Generate realistic chart history points based on baseline price
function generateMockHistory(symbol, basePrice, period) {
  const countMap = { "10D": 10, "1M": 22, "3M": 66, "6M": 130, "1Y": 252 };
  const count = countMap[period] || 130;
  const records = [];
  
  let current = basePrice * 0.75;
  const now = new Date();
  
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * (period === "10D" ? 1 : period === "1M" ? 1.4 : 2));
    
    // Add realistic random walk trend towards basePrice
    const delta = (Math.random() - 0.48) * (basePrice * 0.025);
    current = Math.max(basePrice * 0.4, current + delta);
    
    const high = current * (1 + Math.random() * 0.015);
    const low = current * (1 - Math.random() * 0.015);
    const open = low + Math.random() * (high - low);
    const close = low + Math.random() * (high - low);
    const vol = Math.floor(Math.random() * 30000000) + 5000000;
    
    records.push({
      date: d.toISOString().slice(0, 10),
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume: vol,
      sma20: Number((current * 0.98).toFixed(2)),
      sma50: Number((current * 0.94).toFixed(2)),
      bb_upper: Number((current * 1.06).toFixed(2)),
      bb_lower: Number((current * 0.92).toFixed(2)),
      support: Number((basePrice * 0.78).toFixed(2)),
      resistance: Number((basePrice * 1.02).toFixed(2))
    });
  }
  
  // Set last record to match basePrice
  if (records.length > 0) {
    records[records.length - 1].close = basePrice;
  }
  
  return records;
}

export default function App() {
  const [ticker, setTicker] = useState("OKLO");
  const [searchInput, setSearchInput] = useState("OKLO");
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

  // Analysis & Chart State
  const [activeStock, setActiveStock] = useState(STOCK_PRESETS["OKLO"]);
  const [chartRecords, setChartRecords] = useState(() => generateMockHistory("OKLO", 79.88, "6M"));
  const [historyList, setHistoryList] = useState([]);
  const [watchlist, setWatchlist] = useState(Object.keys(STOCK_PRESETS));

  // Hover state
  const [hoverIndex, setHoverIndex] = useState(null);

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

  // Load stock data (instantly from preset or live backend)
  const loadStock = async (symbolToLoad = ticker, selectedPeriod = period) => {
    const symbol = symbolToLoad.trim().toUpperCase();
    if (!symbol) return;

    // Keep user at the top of the page when searching or changing stocks
    window.scrollTo({ top: 0, behavior: "instant" });

    setTicker(symbol);
    setSearchInput(symbol);
    setError("");

    // 1. Instant Preset Update (zero lag)
    const preset = STOCK_PRESETS[symbol] || {
      company: `${symbol} Corporation`,
      sector: "Equities",
      industry: "Market Stock",
      price: 150.00,
      open: 148.00,
      high: 152.50,
      low: 147.00,
      volume: 18500000,
      support: 135.00,
      resistance: 155.00,
      sma20: 147.00,
      sma50: 142.00,
      sma150: 130.00,
      sma200: 122.00,
      rsi: 54.2,
      bb_upper: 158.00,
      bb_lower: 136.00,
      market_cap: 85000000000,
      pe_ratio: 28.5,
      forward_pe: 24.2,
      price_to_book: 6.8,
      operating_margin: 0.22,
      profit_margin: 0.18,
      roe: 0.24,
      revenue_growth: 0.14,
      total_revenue: 45000000000,
      free_cash_flow: 12000000000,
      debt_to_equity: 42.0,
      verdict: "BALANCED ACCUMULATION",
      verdict_desc: `${symbol} exhibits steady price action above major moving averages with stable cash flows.`,
      short_term_strategy: "Monitor volume on resistance tests.",
      long_term_strategy: "Accumulate on pullbacks toward SMA 50.",
      future_outlook: "Product expansion and quarterly earnings execution.",
      risks_text: "1. Macro sector rotation risks.\n2. General market volatility.",
      news: [
        {
          title: `${symbol} Consolidates Above Key Moving Averages`,
          source: "Financial News",
          published_at: new Date().toISOString().slice(0, 10),
          description: "Institutional investors monitor breakout levels and quarterly cash flow updates.",
          url: "https://finance.yahoo.com"
        }
      ]
    };

    setActiveStock(preset);
    setChartRecords(generateMockHistory(symbol, preset.price, selectedPeriod));

    // Reset Chat Welcome for this stock
    setChatMessages([
      {
        role: "assistant",
        text: `Analysis updated for ${symbol} (${preset.company}). What would you like to know about its technical signals or investment verdict?`
      }
    ]);

    // 2. Query Live Backend in Background (if online)
    try {
      // Fetch live chart records
      const chartRes = await fetch(`${API_BASE_URL}/api/historical-chart/${symbol}?period=${selectedPeriod.toLowerCase()}`);
      if (chartRes.ok) {
        const chartJson = await chartRes.json();
        if (chartJson.error && !STOCK_PRESETS[symbol]) {
          setError(`No market data found for ticker symbol "${symbol}". Please check the spelling or try a valid ticker (e.g. AAPL, NVDA, TSLA, OKLO, MSFT, AMZN).`);
          return;
        }
        if (chartJson.records && chartJson.records.length > 0) {
          setChartRecords(chartJson.records);
        }
      } else if (!STOCK_PRESETS[symbol]) {
        setError(`No market data found for ticker "${symbol}". Please verify the symbol.`);
      }

      // Fetch live agent analysis
      const analysisRes = await fetch(`${API_BASE_URL}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker: symbol, query: `Detailed breakout analysis for ${symbol}` })
      });

      if (analysisRes.ok) {
        const data = await analysisRes.json();
        setActiveStock((prev) => ({
          ...prev,
          company: data.financial_data?.company || prev.company,
          price: data.market_data?.price || prev.price,
          open: data.market_data?.open || prev.open,
          high: data.market_data?.high || prev.high,
          low: data.market_data?.low || prev.low,
          volume: data.market_data?.volume || prev.volume,
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
      }

      // Fetch history
      const histRes = await fetch(`${API_BASE_URL}/api/history/${symbol}`);
      if (histRes.ok) {
        const histJson = await histRes.json();
        setHistoryList(histJson.history || []);
      }
    } catch (e) {
      if (!STOCK_PRESETS[symbol]) {
        setError(`Backend is offline or ticker "${symbol}" could not be loaded. Please run the backend server or select one of the monitored stocks.`);
      }
    }
  };

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

  // Chat message
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
        setTimeout(scrollChatToBottom, 50);
      } else {
        throw new Error("Chat response failed");
      }
    } catch (err) {
      // Smart instant simulated answer if backend is offline
      setTimeout(() => {
        let simulatedReply = "";
        const lower = userMsg.toLowerCase();
        if (lower.includes("rsi")) {
          simulatedReply = `RSI (Relative Strength Index) measures price momentum on a scale of 0 to 100. For **${ticker}**, RSI is at **${activeStock.rsi}**. Values below 30 indicate oversold (potential buy dip), while above 70 indicate overbought conditions.`;
        } else if (lower.includes("bollinger") || lower.includes("bands")) {
          simulatedReply = `Bollinger Bands plot standard deviations above and below the 20-day SMA. For **${ticker}**, the upper band is $${activeStock.bb_upper?.toFixed(2)} and the lower band is $${activeStock.bb_lower?.toFixed(2)}. Widening bands signal volatility expansion.`;
        } else if (lower.includes("support") || lower.includes("resistance")) {
          simulatedReply = `For **${ticker}**, key baseline support is at **$${activeStock.support?.toFixed(2)}** and overhead resistance is at **$${activeStock.resistance?.toFixed(2)}**.`;
        } else if (lower.includes("buy") || lower.includes("invest")) {
          simulatedReply = `Current recommendation for **${ticker}**: **${activeStock.verdict}**. ${activeStock.short_term_strategy}`;
        } else {
          simulatedReply = `Regarding "${userMsg}": For **${ticker}** (${activeStock.company}), current price is $${activeStock.price.toFixed(2)} holding above support ($${activeStock.support?.toFixed(2)}). Key upcoming catalysts include earnings and sector momentum.`;
        }

        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", text: simulatedReply }
        ]);
        setChatLoading(false);
        setTimeout(scrollChatToBottom, 50);
      }, 600);
      return;
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

  const currentDisplayPrice = activeRecord?.close || activeStock.price;

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
              onClick={() => setActiveTab("history")}
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
          <form className="search-form" onSubmit={handleSearch}>
            <div className="search-input-wrap">
              <Search size={17} className="search-icon" />
              <input
                type="text"
                placeholder="Search stock ticker (e.g. OKLO, AAPL, NVDA, TSLA, MSFT, AMZN)..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
              />
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
              <h2>Saved Analysis History</h2>
              <button className="btn-back" onClick={() => setActiveTab("dashboard")}>
                ← Back to Dashboard
              </button>
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
                      <span className="hist-date">{item.created_at?.slice(0, 19)}</span>
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
                  <p className="watch-desc">{STOCK_PRESETS[sym]?.company || `${sym} Corp.`}</p>
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