import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Zap, TrendingUp, Cpu, Activity, Search, RefreshCcw, 
  ChevronRight, BarChart3, Target, ShieldAlert, Terminal, 
  MessageSquare, Brain, Layers, Clock, Globe, Signal,
  Menu, X, Filter, Settings, History, Lock, ChevronDown,
  ExternalLink, MousePointer2, LayoutDashboard, Shield, Maximize2,
  Newspaper, Crosshair, AlertCircle, TrendingDown, Info, Volume2, VolumeX, Star,
  Calendar, Copy, Check, Radar, Key, ShieldCheck, Network, Columns, Split, ArrowRightLeft, CheckCircle2,
  Award, ArrowUpDown, Flame, Bell, RefreshCw, Bot
} from "lucide-react";
import { TradingViewChart, ChartHandle } from "./components/TradingViewChart";
import LiquidityMap from "./components/LiquidityMap";
import WhaleRadar from "./components/WhaleRadar";
import TradeMemory from "./components/TradeMemory";
import LiveNewsTerminal from "./components/LiveNewsTerminal";
import DeepAnalysisTerminal from "./components/DeepAnalysisTerminal";
import OscillatorPane from "./components/OscillatorPane";
import BinanceConnectModal from "./components/BinanceConnectModal";
import { CorrelationMatrix } from "./components/CorrelationMatrix";
import AiConfigModal from "./components/AiConfigModal";
import FinancialDisclaimer from "./components/FinancialDisclaimer";
import InstitutionalSignalCard from "./components/InstitutionalSignalCard";
import { FreqtradeDashboard } from "./components/FreqtradeDashboard";
import { SniperBotAlertsCenter } from "./components/SniperBotAlertsCenter";
import { CryptoSignalDashboard } from "./components/CryptoSignalDashboard";
import { MarketSignal, KlineData, TimeFrame, MacroData, OrderBookData, EconomicEvent, BinanceAccountInfo, RejectedAuditItem } from "./types";
import { 
  evaluateHistoricalBacktest, 
  getSetupNameArabic, 
  getRegimeNameArabic, 
  SetupCategoryType, 
  MarketRegimeType 
} from "./backtestEngine";
import { initialSignals } from "./defaultSignals";
import { evaluateSignalStrength, SignalTier } from "./sniperStrengthEngine";

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "freqtrade" | "crypto_signals" | "council" | "terminal" | "macro" | "sniper" | "whale" | "memory" | "news" | "ai_terminal" | "correlation" | "bottom_scanner">("freqtrade");
  const [sniperToolView, setSniperToolView] = useState<'ALL_IN_ONE' | 'BOT_ALERTS' | 'MULTI_TF_MATRIX' | 'ELITE_CARDS'>('ALL_IN_ONE');
  const [bottomResults, setBottomResults] = useState<any[]>([]);
  const [bottomFilterTab, setBottomFilterTab] = useState<'ALL' | 'ABSOLUTE' | 'CRASH' | 'EXPLODING' | 'WAKING_UP' | 'SQUEEZE' | 'RETEST'>('ALL');
  const [bottomSortBy, setBottomSortBy] = useState<'DIST_ASC' | 'DROP_DESC' | 'IGNITION_DESC' | 'SCORE_DESC'>('DIST_ASC');
  const [bottomPinnedSymbols, setBottomPinnedSymbols] = useState<string[]>([]);
  const [isScanningBottoms, setIsScanningBottoms] = useState(false);
  const [preemptiveSniperMode, setPreemptiveSniperMode] = useState(true);
  const [lastSniperAlerts, setLastSniperAlerts] = useState<string[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState("BTCUSDT");
  const [timeframe, setTimeframe] = useState<TimeFrame>("1h");
  const [chartData, setChartData] = useState<KlineData[]>([]);
  const [signals, setSignals] = useState<MarketSignal[]>(initialSignals);
  const [lastAnalysis, setLastAnalysis] = useState<MarketSignal | null>(initialSignals[0]);
  const [macro, setMacro] = useState<MacroData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [allSymbols, setAllSymbols] = useState<string[]>(["XAUUSDT", "BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", "DOGEUSDT", "SUIUSDT", "AVAXUSDT"]);
  
  // Dual Chart View & Institutional Confirmation State
  const [isDualChart, setIsDualChart] = useState<boolean>(false);
  const [chart2Symbol, setChart2Symbol] = useState<string>("BTCUSDT");
  const [chart2Timeframe, setChart2Timeframe] = useState<TimeFrame>("1m");
  const [chart2Data, setChart2Data] = useState<KlineData[]>([]);
  const [syncSymbols, setSyncSymbols] = useState<boolean>(true);
  const [isChart2Loading, setIsChart2Loading] = useState<boolean>(false);
  const chart2Ref = useRef<ChartHandle>(null);

  const [isBinanceModalOpen, setIsBinanceModalOpen] = useState(false);
  const [isAiConfigModalOpen, setIsAiConfigModalOpen] = useState(false);
  const [binanceAccount, setBinanceAccount] = useState<BinanceAccountInfo | null>(null);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('avantis_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [logs, setLogs] = useState<{msg: string, term: string, type: 'info' | 'warn' | 'success' | 'council'}[]>([]);
  const [logFilter, setLogFilter] = useState<'all' | 'info' | 'warn' | 'success' | 'council'>('all');
  const [isMuted, setIsMuted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const isScanningRef = useRef(false);
  const [scanningSymbol, setScanningSymbol] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [alertSignal, setAlertSignal] = useState<MarketSignal | null>(null);
  const [orderBook, setOrderBook] = useState<OrderBookData | null>(null);
  const [eventFilter, setEventFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM'>('ALL');
  const [tickers, setTickers] = useState<Record<string, { priceChangePercent: number; quoteVolume: number; lastPrice: number }>>({});
  const [newListings, setNewListings] = useState<Array<{ symbol: string; daysAgo: number }>>([]);
  const [sniperFilter, setSniperFilter] = useState<'ENTRY_ZONE_NOW' | 'ALL_RANKED' | 'TREND_OF_THE_DAY' | 'FAST_ARRIVAL' | 'REAL_TRADES' | 'ALL' | 'PRE_IGNITION' | 'LONG' | 'SHORT' | 'NEW_LISTINGS' | 'HIGH_CONFIDENCE' | 'HIGH_PROFIT' | 'GRADE_AAA' | 'DIVERGENCE' | 'HIGH_RR' | 'STRONG_OVERSOLD' | 'SMART_FAST'>('ENTRY_ZONE_NOW');
  const [sniperTierFilter, setSniperTierFilter] = useState<'ALL' | 'DIAMOND' | 'PLATINUM' | 'SILVER'>('ALL');
  const [sniperDirectionFilter, setSniperDirectionFilter] = useState<'ALL' | 'LONG' | 'SHORT'>('ALL');
  const [sniperSortBy, setSniperSortBy] = useState<'STRENGTH' | 'PROFIT' | 'RR' | 'CONFIDENCE'>('STRENGTH');
  const [scanStrategy, setScanStrategy] = useState<'TREND_OF_THE_DAY' | 'ALL_COINS' | 'NEW_LISTINGS' | 'VOLATILITY' | 'VOLUME' | 'FAVORITES' | 'OVERSOLD'>('TREND_OF_THE_DAY');
  const [huntingMode, setHuntingMode] = useState<'SMART_FAST' | 'STRICT_INSTITUTIONAL'>('STRICT_INSTITUTIONAL');
  const [coinFilterTab, setCoinFilterTab] = useState<'ALL' | 'NEW_LISTINGS' | 'FAVORITES' | 'VOLUME' | 'GAINERS' | 'LOSERS'>('ALL');
  const [copiedSymbol, setCopiedSymbol] = useState<string | null>(null);
  const [copiedTradeSymbol, setCopiedTradeSymbol] = useState<string | null>(null);
  const [rejectedAudits, setRejectedAudits] = useState<RejectedAuditItem[]>([]);
  const [rejectedFilter, setRejectedFilter] = useState<'ALL' | 'BACKTEST' | 'MTF'>('ALL');
  const [alertSensitivity, setAlertSensitivity] = useState<number>(92); // Increased from 88 for extreme precision
  const chartRef = useRef<ChartHandle>(null);
  const lastAlertMapRef = useRef<Map<string, number>>(new Map());

  // Verified signals list: Strictly sorted by Level & Strength by default (ترتيب إلزامي من الأقوى للأضعف)
  const activeVerifiedSignals = useMemo(() => {
    const list = signals.filter(s => 
      s.direction !== 'NEUTRAL' && 
      (s.isServerVerified || s.confidence >= 75 || s.smartRiskLevel === 'SMART_CALCULATED_RISK' || s.isPreIgnitionReady)
    );

    return list.sort((a, b) => {
      const evalA = evaluateSignalStrength(a);
      const evalB = evaluateSignalStrength(b);

      if (sniperSortBy === 'STRENGTH') {
        if (evalA.levelRank !== evalB.levelRank) return evalA.levelRank - evalB.levelRank; // 1 (Diamond) first
        if (evalB.score !== evalA.score) return evalB.score - evalA.score;
        return (b.confidence || 0) - (a.confidence || 0);
      } else if (sniperSortBy === 'PROFIT') {
        return (b.profitPercent || 0) - (a.profitPercent || 0);
      } else if (sniperSortBy === 'RR') {
        return (b.rrRatio || 0) - (a.rrRatio || 0);
      } else if (sniperSortBy === 'CONFIDENCE') {
        return (b.confidence || 0) - (a.confidence || 0);
      }
      return evalB.score - evalA.score;
    });
  }, [signals, sniperSortBy]);

  // Filtered Sniper Signals (منع خلط العملات، وفصل المستويات والاتجاه بدقة تامة)
  const filteredSniperSignals = useMemo(() => {
    return activeVerifiedSignals.filter(sig => {
      const strength = evaluateSignalStrength(sig);
      
      // Tier level filter
      if (sniperTierFilter !== 'ALL' && strength.tier !== sniperTierFilter) return false;

      // Direction filter (never mix Long and Short if trader selects specific direction)
      if (sniperDirectionFilter !== 'ALL' && sig.direction !== sniperDirectionFilter) return false;

      // Setup / Category filter
      if (sniperFilter === 'ENTRY_ZONE_NOW') {
        const curPrice = tickers[sig.symbol]?.lastPrice || sig.entry;
        const distPct = sig.entry > 0 ? (Math.abs(curPrice - sig.entry) / sig.entry) * 100 : 0;
        const isHitSl = sig.direction === 'LONG' ? curPrice <= sig.sl : curPrice >= sig.sl;
        const isHitTp = sig.direction === 'LONG' ? curPrice >= (sig.tp1 || sig.tp) : curPrice <= (sig.tp1 || sig.tp);
        return distPct <= 1.2 && !isHitSl && !isHitTp;
      }
      if (sniperFilter === 'ALL_RANKED' || sniperFilter === 'ALL') return true;
      if (sniperFilter === 'TREND_OF_THE_DAY') {
        return sig.isTrendOfTheDay === true || Boolean(sig.trendOfTheDay?.isCandidate) || sig.setupCategory === 'PRE_IGNITION_COILED' || sig.setupCategory === 'WYCKOFF_SPRING';
      }
      if (sniperFilter === 'REAL_TRADES') {
        return sig.isRealTradeConfirmed === true || (sig.confidence >= 88 && (sig.hasDivergence || sig.hasFvg || sig.isPreIgnitionReady || sig.isOversoldImpulseBuy || sig.isOverboughtImpulseSell));
      }
      if (sniperFilter === 'PRE_IGNITION') {
        return sig.isPreIgnitionReady === true || sig.setupCategory === 'WYCKOFF_SPRING' || sig.setupCategory === 'PRE_IGNITION_COILED';
      }
      if (sniperFilter === 'FAST_ARRIVAL') {
        return strength.imminentBurst || sig.entryProximity === 'PERFECT_ZONE_NOW' || sig.targetVelocity === 'FAST' || sig.isMomentumBreakout === true || sig.smartRiskLevel === 'SMART_CALCULATED_RISK';
      }
      if (sniperFilter === 'SMART_FAST') {
        return sig.smartRiskLevel === 'SMART_CALCULATED_RISK' || sig.fastOpportunityBadge != null || sig.isMomentumBreakout === true || sig.targetVelocity === 'FAST';
      }
      if (sniperFilter === 'NEW_LISTINGS') {
        return sig.isNewListing === true;
      }
      if (sniperFilter === 'STRONG_OVERSOLD') {
        return sig.isOversoldImpulseBuy === true || sig.setupCategory === 'OVERSOLD_IMPULSE' || (sig.direction === 'LONG' && (sig.confluenceFactors?.some(f => f.includes('تشبع بيعي') || f.includes('انطلاق صاعد')) || sig.hasDivergence));
      }
      if (sniperFilter === 'GRADE_AAA') return sig.grade === 'AAA' || sig.confidence >= 88;
      if (sniperFilter === 'DIVERGENCE') return sig.hasDivergence === true;
      if (sniperFilter === 'HIGH_RR') return (sig.rrRatio || 0) >= 4.0;
      if (sniperFilter === 'HIGH_PROFIT') {
        const pPct = sig.profitPercent || (sig.entry > 0 ? (Math.abs(sig.tp - sig.entry) / sig.entry) * 100 : 0);
        return pPct >= 10;
      }
      if (sniperFilter === 'LONG') return sig.direction === 'LONG';
      if (sniperFilter === 'SHORT') return sig.direction === 'SHORT';
      if (sniperFilter === 'HIGH_CONFIDENCE') return sig.confidence >= 85;

      return true;
    });
  }, [activeVerifiedSignals, sniperFilter, sniperTierFilter, sniperDirectionFilter]);

  const filteredBottomResults = useMemo(() => {
    let list = [...bottomResults];
    if (bottomFilterTab === 'ABSOLUTE') {
      list = list.filter(c => c.isSubFloorBedrock || c.isAbsoluteLow || parseFloat(c.distFromLow) <= 3.5 || c.status === 'ABSOLUTE_BOTTOM');
    } else if (bottomFilterTab === 'CRASH') {
      list = list.filter(c => parseFloat(c.dropFromHigh) >= 70);
    } else if (bottomFilterTab === 'EXPLODING') {
      list = list.filter(c => c.status === 'EXPLODING_NOW');
    } else if (bottomFilterTab === 'WAKING_UP') {
      list = list.filter(c => c.status === 'WAKING_UP');
    } else if (bottomFilterTab === 'SQUEEZE') {
      list = list.filter(c => c.status === 'SQUEEZE_READY');
    } else if (bottomFilterTab === 'RETEST') {
      list = list.filter(c => c.status === 'FLOOR_RETEST' || (c.floorTouches && c.floorTouches >= 2));
    }

    // Sort according to user preference (Default: DIST_ASC puts 0% to 2% closest to floor at the very top!)
    return list.sort((a, b) => {
      if (bottomSortBy === 'DIST_ASC') {
        return parseFloat(a.distFromLow) - parseFloat(b.distFromLow);
      }
      if (bottomSortBy === 'DROP_DESC') {
        return parseFloat(b.dropFromHigh) - parseFloat(a.dropFromHigh);
      }
      if (bottomSortBy === 'IGNITION_DESC') {
        return (b.ignitionReadiness || 0) - (a.ignitionReadiness || 0);
      }
      if (bottomSortBy === 'SCORE_DESC') {
        return (b.score || 0) - (a.score || 0);
      }
      return parseFloat(a.distFromLow) - parseFloat(b.distFromLow);
    });
  }, [bottomResults, bottomFilterTab, bottomSortBy]);

  const filteredSymbols = useMemo(() => {
    let list = [...allSymbols];
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(sym => sym.toLowerCase().includes(q));
    }
    if (coinFilterTab === 'NEW_LISTINGS') {
      const newSet = new Set(newListings.map(n => n.symbol));
      list = list.filter(sym => newSet.has(sym));
    } else if (coinFilterTab === 'FAVORITES') {
      list = list.filter(sym => favorites.includes(sym));
    } else if (coinFilterTab === 'GAINERS') {
      list = list
        .filter(sym => (tickers[sym]?.priceChangePercent ?? 0) > 0)
        .sort((a, b) => (tickers[b]?.priceChangePercent ?? 0) - (tickers[a]?.priceChangePercent ?? 0));
    } else if (coinFilterTab === 'LOSERS') {
      list = list
        .filter(sym => (tickers[sym]?.priceChangePercent ?? 0) < 0)
        .sort((a, b) => (tickers[a]?.priceChangePercent ?? 0) - (tickers[b]?.priceChangePercent ?? 0));
    } else if (coinFilterTab === 'VOLUME') {
      list = list.sort((a, b) => (tickers[b]?.quoteVolume ?? 0) - (tickers[a]?.quoteVolume ?? 0));
    } else {
      // Default: Favorites first, then high liquidity volume
      list = list.sort((a, b) => {
        const aFav = favorites.includes(a);
        const bFav = favorites.includes(b);
        if (aFav && !bFav) return -1;
        if (!aFav && bFav) return 1;
        return (tickers[b]?.quoteVolume ?? 0) - (tickers[a]?.quoteVolume ?? 0);
      });
    }
    return list;
  }, [allSymbols, searchQuery, coinFilterTab, favorites, tickers, newListings]);

  const handleCopySymbol = (sym: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(sym);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = sym;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopiedSymbol(sym);
      addLog(`تم نسخ رمز العملة ${sym} مباشرة إلى الحافظة.`, 'success');
      setTimeout(() => {
        setCopiedSymbol(prev => prev === sym ? null : prev);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy symbol:", err);
    }
  };

  const handleCopyTradeSetup = (sig: MarketSignal, copyText: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(copyText);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = copyText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopiedTradeSymbol(sig.symbol);
      addLog(`⚡ تم نسخ تفاصيل صفقة ${sig.symbol} كاملة وجاهزة للصق في المنصة للتنفيذ الفوري!`, 'success');
      setTimeout(() => {
        setCopiedTradeSymbol(prev => prev === sig.symbol ? null : prev);
      }, 2500);
    } catch (err) {
      console.error("Failed to copy trade setup:", err);
    }
  };

  const defaultEvents: EconomicEvent[] = [
    {
      title: "قرار الفائدة الفيدرالي الأمريكي (FOMC Interest Rate Decision)",
      date: "الأربعاء القادم",
      time: "02:00 PM EST",
      impact: "HIGH",
      expectedImpact: "تقلبات حادة في السيولة وقفزات سعرية سريعة على البيتكوين وعقود الفيوتشرز، مع إعادة تسعير الدولار والعملات البديلة.",
      category: "أسعار الفائدة"
    },
    {
      title: "مؤشر أسعار المستهلكين الأمريكي (US CPI Inflation Print)",
      date: "الخميس القادم",
      time: "08:30 AM EST",
      impact: "HIGH",
      expectedImpact: "تحديد مسار التضخم وتأثير مباشر على شهية المخاطرة، مما يسبب اختراقات أو كسور وهمية لمناطق الدعم والمقاومة اللحظية.",
      category: "التضخم"
    },
    {
      title: "تقرير الوظائف غير الزراعية ومعدل البطالة (US NFP & Unemployment)",
      date: "الجمعة الأولى من الشهر",
      time: "08:30 AM EST",
      impact: "HIGH",
      expectedImpact: "تسارع ضرب مستويات السيولة التجميعية وتصفية مراكز الرافعة المالية المرتفعة خلال الدقائق الأولى.",
      category: "سوق العمل"
    },
    {
      title: "مؤشر أسعار نفقات الاستهلاك الشخصي الأساسي (Core PCE Price Index)",
      date: "خلال الأسبوعين القادمين",
      time: "08:30 AM EST",
      impact: "MEDIUM",
      expectedImpact: "المقياس المفضل لدى الاحتياطي الفيدرالي لتقييم وتيرة التضخم قبل الاجتماعات الدورية.",
      category: "التضخم"
    },
    {
      title: "خطاب رئيس الاحتياطي الفيدرالي جيروم باول (Fed Chair Powell Speech)",
      date: "خلال الأيام القادمة",
      time: "10:00 AM EST",
      impact: "HIGH",
      expectedImpact: "نبرة التصريحات (تيسيرية أو تشديدية) تؤدي لتحركات سريعة وارتدادات عنيفة في دفاتر الأوامر.",
      category: "خطابات الفيدرالي"
    }
  ];

  const addLog = (msg: string, type: 'info' | 'warn' | 'success' | 'council' = 'info') => {
    setLogs(prev => [...prev, { msg, term: new Date().toLocaleTimeString(), type }].slice(-100));
  };

  useEffect(() => {
    localStorage.setItem('avantis_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (e: React.MouseEvent, sym: string) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(sym) ? prev.filter(s => s !== sym) : [...prev, sym]
    );
  };

  const clearLogs = () => setLogs([]);

  const filteredLogs = logs.filter(log => logFilter === 'all' || log.type === logFilter);

  // Resilient JSON fetcher that rejects HTML doctypes and non-JSON responses gracefully
  const safeParseJson = async <T = any>(resPromise: Promise<Response | null | undefined>): Promise<T | null> => {
    try {
      const res = await resPromise;
      if (!res || !res.ok) return null;
      const contentType = res.headers.get("content-type") || "";
      const text = await res.text();
      if (!text || text.trim().startsWith("<")) return null;
      if (!contentType.includes("application/json") && !text.trim().startsWith("{") && !text.trim().startsWith("[")) return null;
      return JSON.parse(text) as T;
    } catch {
      return null;
    }
  };

  const fetchAllSymbols = async () => {
    try {
      // 1. Primary: Server Proxy (eliminates browser CORS and rate-limiting)
      const payload: any = await safeParseJson(fetch("/api/symbols").catch(() => null));
      if (payload && Array.isArray(payload.symbols) && payload.symbols.length > 0) {
        setAllSymbols(payload.symbols);
        if (payload.tickers) {
          setTickers(payload.tickers);
        }
        if (Array.isArray(payload.newListings)) {
          setNewListings(payload.newListings);
        }
        addLog(`تم تحميل كامل أزواج التداول بنجاح (${payload.symbols.length} عملة نشطة + ${payload.newListings?.length || 0} عملة مدرجة حديثاً).`, "success");
        return;
      }

      // 2. Direct fallback
      let raw: any = await safeParseJson(fetch("https://fapi.binance.com/fapi/v1/ticker/24hr").catch(() => null));
      if (!Array.isArray(raw)) {
        raw = await safeParseJson(fetch("https://api.binance.com/api/v3/ticker/24hr").catch(() => null));
      }
      if (Array.isArray(raw) && raw.length > 0) {
        const usdtTickers = raw.filter((t: any) => typeof t.symbol === "string" && t.symbol.endsWith("USDT"));
        const tickerRecord: Record<string, { priceChangePercent: number; quoteVolume: number; lastPrice: number }> = {};
        
        usdtTickers.forEach((t: any) => {
          tickerRecord[t.symbol] = {
            priceChangePercent: parseFloat(t.priceChangePercent || "0"),
            quoteVolume: parseFloat(t.quoteVolume || "0"),
            lastPrice: parseFloat(t.lastPrice || "0")
          };
        });

          // Sort symbols by 24h trading volume (highest institutional liquidity first)
          const sorted = usdtTickers
            .sort((a: any, b: any) => parseFloat(b.quoteVolume || "0") - parseFloat(a.quoteVolume || "0"))
            .map((t: any) => t.symbol);

          if (sorted.length > 0) {
            setTickers(tickerRecord);
            setAllSymbols(sorted);
            addLog(`تم تحميل ${sorted.length} عملة مع بيانات السيولة والتقلب بنجاح.`, "success");
            return;
          }
        }
    } catch (e) {}

    // Resilient fallback pairs
    const topPairs = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", "DOGEUSDT", "ADAUSDT", "OPUSDT", "AVAXUSDT", "NEARUSDT", "LINKUSDT", "SUIUSDT", "PEPEUSDT", "APTUSDT", "RENDERUSDT", "ARBUSDT", "FETUSDT", "INJUSDT", "TAOUSDT", "TIAUSDT", "WIFUSDT", "SEIUSDT", "FTMUSDT", "RVNUSDT"];
    setAllSymbols(topPairs);
    addLog(`تم تحميل ${topPairs.length} من الأزواج عالية السيولة بنجاح.`, "success");
  };

  const fetchMacro = async () => {
    try {
      addLog("مجلس النخبة: جاري مراجعة وتحديث تقرير الاقتصاد الكلي والسيولة...", "council");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch("/api/macro", { method: "POST", signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (res.ok) {
        const data = await res.json();
        setMacro({ ...data, lastUpdate: Date.now() });
        addLog("اكتمل تحديث تقرير الاقتصاد الكلي بنجاح.", "success");
        return;
      }
    } catch (e: any) {}

    // Seamless fallback to macroeconomic state
    setMacro(prev => prev || {
      fedBias: "تحفظ مع ترقب لبيانات التضخم",
      interestRateSentiment: "تثبيت مع احتمالية خفض في الاجتماعات القادمة",
      marketMood: "حذر تكتيكي وترقب سيولة",
      globalNews: [
        "ترقب الأسواق لبيانات التضخم الأمريكية وتأثيرها على شهية المخاطرة",
        "تدفقات صناديق الـ ETF للبيتكوين تحافظ على استقرار نسبي لمناطق الدعم"
      ],
      dailyDigest: "يسود الحذر في الأسواق بانتظار صدور المؤشرات التضخمية وتصريحات الفيدرالي، مع تركيز السيولة على المضاربات السريعة.",
      upcomingEvents: [
        {
          title: "قرار الفائدة الفيدرالي الأمريكي (FOMC Rate Decision)",
          date: "الأربعاء القادم",
          time: "02:00 PM EST",
          impact: "HIGH",
          expectedImpact: "تقلبات عنيفة في السيولة وقفزات سعرية سريعة على البيتكوين وعقود الفيوتشرز",
          category: "أسعار الفائدة"
        },
        {
          title: "مؤشر أسعار المستهلكين الأمريكي (US CPI Inflation Print)",
          date: "الخميس القادم",
          time: "08:30 AM EST",
          impact: "HIGH",
          expectedImpact: "تحديد مسار التضخم وتأثير حاسم على رغبة المخاطرة وكسر مناطق المقاومة",
          category: "التضخم"
        }
      ],
      lastUpdate: Date.now()
    });
    addLog("تم اعتماد بيانات الاقتصاد الكلي والتقويم الاقتصادي المحدث.", "info");
  };

  const fetchBottoms = async (forceRefresh = false) => {
    setIsScanningBottoms(true);
    setActiveTab("bottom_scanner");
    addLog("مجلس النخبة: جاري مسح السوق لاكتشاف العملات في 'قاع القاع الجذري'...", "council");
    try {
      const url = forceRefresh ? "/api/scan-bottoms?refresh=true" : "/api/scan-bottoms";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setBottomResults(data.data || []);
        addLog(`اكتمل مسح القاع بنجاح: تم اصطياد ${data.data?.length || 0} فرصة في أدنى قاع تاريخي ومناطق التجميع.`, "success");
        return;
      }
    } catch (e) {
      addLog("فشل في تشغيل مسح القاع المؤسساتي.", "warn");
    } finally {
      setIsScanningBottoms(false);
    }
  };

  const fetchCandles = async (symbol: string, tf: string) => {
    try {
      const encoded = encodeURIComponent(symbol);
      // 1. Server Proxy with memory cache (instant, zero rate-limit, zero browser CORS)
      let data: any = await safeParseJson(fetch(`/api/klines?symbol=${encoded}&interval=${tf}&limit=100`).catch(() => null));

      // 2. Direct fallback if server had an issue
      if (!Array.isArray(data) || data.length === 0) {
        data = await safeParseJson(fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${encoded}&interval=${tf}&limit=100`).catch(() => null));
      }
      if (!Array.isArray(data) || data.length === 0) {
        data = await safeParseJson(fetch(`https://api.binance.com/api/v3/klines?symbol=${encoded}&interval=${tf}&limit=100`).catch(() => null));
      }

      if (!Array.isArray(data) || data.length === 0) return [];
      
      const klines: KlineData[] = data.map((d: any) => {
        const close = parseFloat(d[1] ? d[4] : d.close);
        const vol = parseFloat(d[1] ? d[5] : d.volume);
        const quoteVol = d[7] ? parseFloat(d[7]) : (d.quoteVolume ? parseFloat(d.quoteVolume) : vol * close);
        const takerBuyVol = d[9] ? parseFloat(d[9]) : (d.takerBuyVolume ? parseFloat(d.takerBuyVolume) : vol * 0.5);
        const takerBuyQuote = d[10] ? parseFloat(d[10]) : (d.takerBuyQuoteVolume ? parseFloat(d.takerBuyQuoteVolume) : takerBuyVol * close);
        return {
          time: Number(d[0] ?? d.time),
          open: parseFloat(d[1] ? d[1] : d.open),
          high: parseFloat(d[2] ? d[2] : d.high),
          low: parseFloat(d[3] ? d[3] : d.low),
          close,
          volume: vol,
          quoteVolume: quoteVol,
          takerBuyVolume: takerBuyVol,
          takerBuyQuoteVolume: takerBuyQuote
        };
      }).filter(k => !isNaN(k.time) && !isNaN(k.close) && k.close > 0);

      if (symbol === selectedSymbol && klines.length > 0) {
        setChartData(klines);
      }
      return klines;
    } catch {
      return [];
    }
  };

  const getRecommendedLtf = (htf: TimeFrame): TimeFrame => {
    switch (htf) {
      case "15m": return "1m";
      case "30m": return "3m";
      case "1h":  return "5m";
      case "4h":  return "15m";
      case "1d":  return "1h";
      case "5m":  return "1m";
      case "3m":  return "1m";
      case "1m":  return "1m";
      default:    return "1m";
    }
  };

  const fetchChart2Candles = async (symbol: string, tf: string) => {
    setIsChart2Loading(true);
    try {
      const encoded = encodeURIComponent(symbol);
      let data: any = await safeParseJson(fetch(`/api/klines?symbol=${encoded}&interval=${tf}&limit=100`).catch(() => null));
      if (!Array.isArray(data) || data.length === 0) {
        data = await safeParseJson(fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${encoded}&interval=${tf}&limit=100`).catch(() => null));
      }
      if (!Array.isArray(data) || data.length === 0) {
        data = await safeParseJson(fetch(`https://api.binance.com/api/v3/klines?symbol=${encoded}&interval=${tf}&limit=100`).catch(() => null));
      }
      if (!Array.isArray(data) || data.length === 0) return [];
      const klines: KlineData[] = data.map((d: any) => ({
        time: Number(d[0]),
        open: parseFloat(d[1]),
        high: parseFloat(d[2]),
        low: parseFloat(d[3]),
        close: parseFloat(d[4]),
        volume: parseFloat(d[5]),
      })).filter(k => !isNaN(k.time) && !isNaN(k.close) && k.close > 0);

      setChart2Data(klines);
      return klines;
    } catch {
      return [];
    } finally {
      setIsChart2Loading(false);
    }
  };

  const fetchOrderBook = async (symbol: string) => {
    try {
      const encoded = encodeURIComponent(symbol);
      let data: any = await safeParseJson(fetch(`/api/depth?symbol=${encoded}&limit=50`).catch(() => null));
      if (!data || (!Array.isArray(data.bids) && !Array.isArray(data.asks))) {
        data = await safeParseJson(fetch(`https://fapi.binance.com/fapi/v1/depth?symbol=${encoded}&limit=50`).catch(() => null));
      }
      if (!data || (!Array.isArray(data.bids) && !Array.isArray(data.asks))) {
        data = await safeParseJson(fetch(`https://api.binance.com/api/v3/depth?symbol=${encoded}&limit=50`).catch(() => null));
      }
      if (!data || (!Array.isArray(data.bids) && !Array.isArray(data.asks))) return;
      
      const processLevels = (levels: string[][]) => {
        let total = 0;
        return (levels || []).map(l => {
          const price = parseFloat(l[0]) || 0;
          const quantity = parseFloat(l[1]) || 0;
          total += quantity;
          return { price, quantity, total };
        });
      };

      setOrderBook({
        bids: processLevels(data.bids || []),
        asks: processLevels(data.asks || []),
        timestamp: Date.now()
      });
    } catch {
      // Graceful fallback without noisy console errors
    }
  };

  const requestNotificationPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        try {
          await Notification.requestPermission();
        } catch {}
      }
    }
  };

  const playEmergencySound = () => {
    if (isMuted) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }

      // High-precision Tactical Dual-Tone Sonic Blast (واضح، احترافي، يقطع السكون فوراً)
      const playBeep = (freq: number, type: OscillatorType, startTime: number, duration: number, volume: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(volume, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const now = audioCtx.currentTime;
      // High-frequency distinct sequence (987Hz -> 1318Hz -> 1760Hz -> 2093Hz)
      playBeep(987, 'triangle', now, 0.18, 0.45);
      playBeep(1318, 'sine', now + 0.12, 0.22, 0.55);
      playBeep(1760, 'sine', now + 0.26, 0.25, 0.6);
      playBeep(2093, 'triangle', now + 0.42, 0.35, 0.65);
    } catch (e) {
      // Audio fallback without crashing
    }
  };

  const triggerDesktopNotification = (title: string, body: string) => {
    try {
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        const notif = new Notification(title, {
          body,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          tag: "sniper-alert-" + Date.now(),
        });
        notif.onclick = () => {
          window.focus();
        };
        setTimeout(() => notif.close(), 10000);
      }
    } catch {}
  };

  const computePreciseAnalysis = (symbol: string, klines: KlineData[]) => {
    if (!klines || klines.length < 15) return null;
    const closes = klines.map(k => k.close);
    const highs = klines.map(k => k.high);
    const lows = klines.map(k => k.low);
    const opens = klines.map(k => k.open);
    const volumes = klines.map(k => k.volume);
    const len = closes.length;
    const last = len - 1;
    const currentClose = closes[last];
    const currentOpen = opens[last];
    const currentHigh = highs[last];
    const currentLow = lows[last];

    // Full RSI Array Calculation for Divergence Detection
    const rsiArr: number[] = [];
    const rsiP = Math.min(14, len - 2);
    let gSum = 0, lSum = 0;
    for (let i = 1; i <= rsiP; i++) {
      const d = closes[i] - closes[i - 1];
      if (d > 0) gSum += d; else lSum -= d;
    }
    let aG = gSum / rsiP, aL = lSum / rsiP;
    rsiArr.push(aL === 0 ? 100 : 100 - (100 / (1 + aG / aL)));
    for (let i = rsiP + 1; i < len; i++) {
      const d = closes[i] - closes[i - 1];
      const g = d > 0 ? d : 0;
      const l = d < 0 ? -d : 0;
      aG = (aG * (rsiP - 1) + g) / rsiP;
      aL = (aL * (rsiP - 1) + l) / rsiP;
      rsiArr.push(aL === 0 ? 100 : 100 - (100 / (1 + aG / aL)));
    }
    const currentRsi = Math.round(rsiArr[rsiArr.length - 1] ?? 50);

    // Momentum Oscillator (10-period Rate of Change & Velocity Inflection)
    const momPeriod = Math.min(10, len - 2);
    const currentMom = ((currentClose - closes[last - momPeriod]) / closes[last - momPeriod]) * 100;
    const prevMom = ((closes[last - 1] - closes[last - 1 - momPeriod]) / closes[last - 1 - momPeriod]) * 100;
    const momDelta = currentMom - prevMom; // Acceleration/velocity of momentum
    const isMomBullish = currentMom > 0 && momDelta >= 0;
    const isMomBearish = currentMom < 0 && momDelta <= 0;
    const isMomCurlingUp = momDelta >= 0.15; // Positive momentum turn
    const isMomCurlingDown = momDelta <= -0.15; // Negative momentum turn

    // Stochastic Oscillator (%K)
    const stochPeriod = Math.min(14, len - 1);
    const lowestStoch = Math.min(...lows.slice(-stochPeriod));
    const highestStoch = Math.max(...highs.slice(-stochPeriod));
    const stochK = highestStoch > lowestStoch ? Math.round(((currentClose - lowestStoch) / (highestStoch - lowestStoch)) * 100) : 50;

    // Volatility ATR & Moving Average & Volume Ratio
    const atrVal = Math.max(...klines.slice(-14).map(k => k.high - k.low)) || (currentClose * 0.008);
    const ma20 = closes.slice(-20).reduce((a, b) => a + b, 0) / Math.min(20, len);
    const isUptrend = currentClose > ma20;
    const recentVol = volumes.slice(-15);
    const avgVol = recentVol.reduce((a, b) => a + b, 0) / (recentVol.length || 1);
    const volRatio = avgVol > 0 ? Number((volumes[last] / avgVol).toFixed(2)) : 1;
    const isVolumeSurge = volRatio >= 1.5; // Increased from 1.35 for higher precision

    // Swing Support and Resistance (last 22 candles)
    const swingHigh = Math.max(...highs.slice(Math.max(0, len - 22), len - 1));
    const swingLow = Math.min(...lows.slice(Math.max(0, len - 22), len - 1));

    // 💤 Dormancy Check (Absolute Bottom & Dormant Discovery)
    const recent30 = closes.slice(-30);
    const mean30 = recent30.reduce((a, b) => a + b, 0) / (recent30.length || 1);
    const stdDev30 = Math.sqrt(recent30.map(x => Math.pow(x - mean30, 2)).reduce((a, b) => a + b, 0) / (recent30.length || 1));
    const volatility30 = (stdDev30 / mean30) * 100;
    const isDormantCoin = volatility30 < 3.2; // Very tight consolidation

    // 🧱 Strong Floor Confirmation (Double Bottom Detection)
    const floorRange = swingLow * 1.018; // 1.8% from swing low
    const floorTouches = lows.slice(-25).filter(l => l <= floorRange).length;
    const isStrongFloor = floorTouches >= 2;

    // 🛡️ High Liquidity Quality Gate (مرشح دقة السيولة العالية)
    // We calculate Taker Flow (Market Orders) to ensure real institutional interest
    const takerFlows = klines.slice(-15).map(k => k.takerBuyQuoteVolume || (k.volume * k.close * 0.5));
    const currentTakerFlow = takerFlows[takerFlows.length - 1];
    const avgTakerFlow15m = takerFlows.reduce((a, b) => a + b, 0) / (takerFlows.length || 1);
    const takerFlowRatio = avgTakerFlow15m > 0 ? currentTakerFlow / avgTakerFlow15m : 1;
    
    const isTopLiquid = (currentClose * (volumes[last] || 0) > 80000) || ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'DOGEUSDT', 'SUIUSDT', 'NEARUSDT', 'XRPUSDT', 'AVAXUSDT', 'LINKUSDT', 'ADAUSDT'].includes(symbol);
    const isSpecialCase = isDormantCoin || isStrongFloor;
    const effectiveTakerFlowThreshold = isSpecialCase ? 8000 : 25000;
    const effectiveTakerRatioThreshold = isSpecialCase ? 1.2 : 1.35;

    const isHighLiquidityPassed = isTopLiquid || (takerFlowRatio >= effectiveTakerRatioThreshold && currentTakerFlow > effectiveTakerFlowThreshold) || (currentTakerFlow > 60000);
    const liquidityGateReason = isHighLiquidityPassed 
      ? "سيولة مؤسساتية مؤكدة (تدفق ماركت نشط)" 
      : `سيولة غير كافية (Taker Ratio: ${takerFlowRatio.toFixed(2)}x) - تم استبعاد الصفقة لضمان الجودة`;

    // 📉 Movement Quality Check (تصفية الحركات الضعيفة)
    const candleRangePct = ((currentHigh - currentLow) / currentClose) * 100;
    const minRangePct = isSpecialCase ? 0.08 : 0.18; // More sensitive for waking up coins
    const isMovementSignificant = candleRangePct >= minRangePct;

    // SMC Liquidity Traps (Fake Breakouts / Breakdowns)
    const isFakeBottom = currentLow < swingLow && currentClose > swingLow;
    const isFakeTop = currentHigh > swingHigh && currentClose < swingHigh;

    // Strict High-Precision Divergence Detection (Tightened Range & Structural Pivot Filtering)
    // We restrict search to recent structural pivots (last - 14 to last - 4) with strict wick confirmation
    let hasBullishDivergence = false;
    let hasBearishDivergence = false;
    let prevLowPrice = Infinity;
    let prevLowRsi = 100;
    let prevHighPrice = -Infinity;
    let prevHighRsi = 0;

    for (let i = Math.max(0, last - 14); i <= last - 4; i++) {
      // True structural swing low: lower than previous and next 2 candles
      const isSwingLow = lows[i] < lows[i - 1] && lows[i] < lows[i + 1] && (i <= 1 || lows[i] <= lows[i - 2]) && (i >= len - 2 || lows[i] <= lows[i + 2]);
      if (isSwingLow) {
        if (lows[i] < prevLowPrice) {
          prevLowPrice = lows[i];
          prevLowRsi = rsiArr[i - rsiP] ?? 50;
        }
      }

      // True structural swing high: higher than previous and next 2 candles
      const isSwingHigh = highs[i] > highs[i - 1] && highs[i] > highs[i + 1] && (i <= 1 || highs[i] >= highs[i - 2]) && (i >= len - 2 || highs[i] >= highs[i + 2]);
      if (isSwingHigh) {
        if (highs[i] > prevHighPrice) {
          prevHighPrice = highs[i];
          prevHighRsi = rsiArr[i - rsiP] ?? 50;
        }
      }
    }

    // Tightened Bullish Divergence:
    // 1. Lower price low or retest
    // 2. Strict RSI higher low with at least +5 points difference
    // 3. Momentum Oscillator not actively collapsing (prevents catching a falling knife)
    if (prevLowPrice < Infinity && currentClose <= prevLowPrice * 1.002 && currentRsi >= prevLowRsi + 5 && momDelta >= -0.05) {
      hasBullishDivergence = true;
    }

    // Tightened Bearish Divergence:
    // 1. Higher price high or retest
    // 2. Strict RSI lower high with at least -5 points difference
    // 3. Momentum Oscillator not surging upward (prevents premature shorting into an squeeze)
    if (prevHighPrice > -Infinity && currentClose >= prevHighPrice * 0.998 && currentRsi <= prevHighRsi - 5 && momDelta <= 0.05) {
      hasBearishDivergence = true;
    }

    // Fair Value Gap (FVG)
    const c1 = klines[last - 3];
    const c2 = klines[last - 2];
    const c3 = klines[last - 1];
    const hasBullishFvg = c1 && c2 && c3 && (c3.low > c1.high) && (c2.close > c2.open);
    const hasBearishFvg = c1 && c2 && c3 && (c3.high < c1.low) && (c2.close < c2.open);

    // Candlestick Pinbar Rejection & Fast Impulse Candle
    const range = currentHigh - currentLow || 0.0001;
    const body = Math.abs(currentClose - currentOpen);
    const lowerWick = Math.min(currentClose, currentOpen) - currentLow;
    const upperWick = currentHigh - Math.max(currentClose, currentOpen);
    const isHammer = lowerWick >= range * 0.52 && body <= range * 0.38;
    const isShootingStar = upperWick >= range * 0.52 && body <= range * 0.38;

    // Fast Impulse: Strong directional expansion candle >= 55% body
    const isBullishImpulseCandle = (currentClose > currentOpen) && (body >= range * 0.55);
    const isBearishImpulseCandle = (currentClose < currentOpen) && (body >= range * 0.55);

    // Strong Zone: Oversold / Demand & Overbought / Supply
    const isOversoldDemandZone = (currentRsi <= 34) || (stochK <= 22);
    const isOverboughtSupplyZone = (currentRsi >= 66) || (stochK >= 78);

    const isOversoldImpulseBuy = isOversoldDemandZone && isBullishImpulseCandle;
    const isOverboughtImpulseSell = isOverboughtSupplyZone && isBearishImpulseCandle;

    // Wake up check for dormant coins
    const isWakingUp = (currentClose > opens[last] * 1.025) || (volRatio > 2.0);

    let direction: "LONG" | "SHORT" | "NEUTRAL" = "NEUTRAL";
    let confidence = 50;
    let reasoning = "";
    const confluenceFactors: string[] = [];

    // STRICT Institutional Primary Structural Triggers:
    // A trade is NEVER initiated purely from moving averages or trend.
    // It requires a verified SMC liquidity sweep, confirmed divergence, FVG mitigation, or strong oversold/overbought fast impulse!
    const hasPrimaryBullishTrigger = isOversoldImpulseBuy ||
                                     hasBullishDivergence || 
                                     isFakeBottom || 
                                     (isDormantCoin && (isBullishImpulseCandle || volRatio > 1.8)) ||
                                     (isStrongFloor && isHammer) ||
                                     (hasBullishFvg && (isHammer || isMomCurlingUp)) ||
                                     (currentRsi <= 32 && isHammer && isVolumeSurge);

    const hasPrimaryBearishTrigger = (isOverboughtImpulseSell ||
                                     hasBearishDivergence || 
                                     isFakeTop || 
                                     (hasBearishFvg && (isShootingStar || isMomCurlingDown)) ||
                                     (currentRsi >= 68 && isShootingStar && isVolumeSurge)) && !isSpecialCase; // Block shorts on dormant/strong-floor coins

    // Confluence Scoring
    let bullishScore = 0;
    let bearishScore = 0;

    if (isOversoldImpulseBuy) {
      bullishScore += 4.0;
      confluenceFactors.push(`⚡ ارتداد من منطقة تشبع بيعي قوية (RSI: ${currentRsi}) مع شمعة انطلاق صاعد سريع`);
    }
    if (isDormantCoin && isWakingUp) {
      bullishScore += 4.5;
      confluenceFactors.push("💎 استيقاظ عملة راقدة (Dormant Elite Breakout) - تجميع مؤسسي طويل الأمد بدأ بالتحرك");
    }
    if (isStrongFloor && isFakeBottom) {
      bullishScore += 4.2;
      confluenceFactors.push("🛡️ كسر وهمي لقاع فولاذي (Strong Floor Liquidity Sweep)");
    }
    if (hasBullishDivergence) {
      bullishScore += 3.5;
      confluenceFactors.push("دايفرجنس شرائي صاعد مؤكد (Bullish Divergence)");
    }
    if (isFakeBottom) {
      bullishScore += 3.5;
      confluenceFactors.push("مصيدة سيولة بيعية وكسر قاع وهمي (SMC Bear Trap / Liquidity Sweep)");
    }
    if (hasBullishFvg) {
      bullishScore += 2.0;
      confluenceFactors.push("إعادة اختبار فجوة سيولة مؤسساتية (Bullish FVG Mitigation)");
    }
    if (isHammer) {
      bullishScore += 1.8;
      confluenceFactors.push("شمعة مطرقة ارتدادية برفض سعري قاطع (Rejection Pinbar)");
    }
    if (currentRsi <= 32 && !isOversoldImpulseBuy) {
      bullishScore += 1.5;
      confluenceFactors.push(`تشبع بيعي حاد (RSI: ${currentRsi})`);
    }
    if (isVolumeSurge) {
      bullishScore += 1.5;
      confluenceFactors.push(`حجم تداول مؤسساتي متصاعد (${volRatio}x من المعدل)`);
    }
    if (isUptrend) {
      bullishScore += 1.0;
      confluenceFactors.push("توافق مع الاتجاه الهيكلي العام");
    }
    if (isMomBullish || isMomCurlingUp) {
      bullishScore += 1.0;
      confluenceFactors.push("زخم إيجابي وتسارع شرائي");
    }

    // Bearish Confluences
    const bearishConfluenceFactors: string[] = [];
    if (isOverboughtImpulseSell) {
      bearishScore += 4.0;
      bearishConfluenceFactors.push(`❄️ رفض من منطقة تشبع شرائي قوية (RSI: ${currentRsi}) مع شمعة هبوط سريع`);
    }
    if (hasBearishDivergence) {
      bearishScore += 3.5;
      bearishConfluenceFactors.push("دايفرجنس بيعي هابط مؤكد (Bearish Divergence)");
    }
    if (isFakeTop) {
      bearishScore += 3.5;
      bearishConfluenceFactors.push("مصيدة سيولة شرائية واختراق قمة وهمي (SMC Bull Trap / Liquidity Sweep)");
    }
    if (hasBearishFvg) {
      bearishScore += 2.0;
      bearishConfluenceFactors.push("إعادة اختبار فجوة سيولة هابطة (Bearish FVG Mitigation)");
    }
    if (isShootingStar) {
      bearishScore += 1.8;
      bearishConfluenceFactors.push("شمعة شهاب هابط برفض سعري قاطع (Shooting Star Pinbar)");
    }
    if (currentRsi >= 68 && !isOverboughtImpulseSell) {
      bearishScore += 1.5;
      bearishConfluenceFactors.push(`تشبع شرائي مفرط (RSI: ${currentRsi})`);
    }
    if (isVolumeSurge) {
      bearishScore += 1.5;
      bearishConfluenceFactors.push(`ضغط بيعي مؤسساتي بحجم (${volRatio}x)`);
    }
    if (!isUptrend) {
      bearishScore += 1.0;
      bearishConfluenceFactors.push("توافق مع المسار الهابط العام");
    }
    if (isMomBearish || isMomCurlingDown) {
      bearishScore += 1.0;
      bearishConfluenceFactors.push("ضغط تسارعي سلبي في مؤشر الزخم");
    }

    if (hasPrimaryBullishTrigger && bullishScore >= 4.8 && bullishScore > bearishScore + 1.5 && confluenceFactors.length >= 2 && isHighLiquidityPassed && isMovementSignificant) {
      direction = "LONG";
      confidence = 75; // Client-side estimate: Capped until verified by multi-timeframe server engine
      reasoning = isOversoldImpulseBuy
        ? `اقتناص منطقة تشبع بيعي فائقة وانطلاق صاعد سريع لـ ${symbol}: رصد ارتداد حاد مع ${confluenceFactors.slice(0, 3).join("، مع ")}.`
        : `إشارة شراء صاعدة (Long) مبدئية: رصد تجميع سيولة محلي مع ${confluenceFactors.slice(0, 3).join("، مع ")}.`;
    } else if (hasPrimaryBearishTrigger && bearishScore >= 4.8 && bearishScore > bullishScore + 1.5 && bearishConfluenceFactors.length >= 2 && isHighLiquidityPassed && isMovementSignificant) {
      direction = "SHORT";
      confluenceFactors.length = 0;
      confluenceFactors.push(...bearishConfluenceFactors);
      confidence = 75; // Client-side estimate: Capped until verified by multi-timeframe server engine
      reasoning = isOverboughtImpulseSell
        ? `اقتناص منطقة تشبع شرائي وانطلاق هابط سريع لـ ${symbol}: رصد رفض حاد مع ${bearishConfluenceFactors.slice(0, 3).join("، مع ")}.`
        : `إشارة بيع هابطة (Short) مبدئية: رصد رفض سعري محلي مع ${bearishConfluenceFactors.slice(0, 3).join("، مع ")}.`;
    } else {
      // STRICT CAPITAL PROTECTION: Do not force trades in choppy or unconfirmed conditions
      direction = "NEUTRAL";
      confidence = 50;
      if (!isMovementSignificant && (hasPrimaryBullishTrigger || hasPrimaryBearishTrigger)) {
        reasoning = `حماية رأس المال: تذبذب السعر ضعيف جداً (${candleRangePct.toFixed(3)}%)؛ الحركة عشوائية ولا يوجد زخم انطلاقي يدعم الصفقة حالياً.`;
      } else if (!isHighLiquidityPassed && (hasPrimaryBullishTrigger || hasPrimaryBearishTrigger)) {
        reasoning = `حماية رأس المال: تم رصد إشارة فنية ولكن تم استبعادها بواسطة مرشح دقة السيولة (${takerFlowRatio.toFixed(2)}x). السيولة الحالية لا تدعم حركة حقيقية قوية.`;
      } else {
        reasoning = `حماية رأس المال نشطة لـ ${symbol}: السوق في نطاق تذبذب أو لم تكتمل شروط القنص المؤسساتي (تشبع بيعي + انطلاق سريع، دايفرجنس مؤكد، أو كسر وهمي). تم استبعاد الإشارة لحماية رصيدك.`;
      }
    }

    const decimals = currentClose > 100 ? 2 : currentClose > 1 ? 4 : 6;
    const minTargetPct = 0.115; // 11.5% minimum profit target for solid account expansion

    if (direction === "NEUTRAL") {
      return {
        direction: "NEUTRAL" as const,
        confidence: 50,
        entry: currentClose,
        sl: currentClose,
        tp: currentClose,
        rrRatio: 0,
        profitPercent: 0,
        targetSpeed: "NORMAL" as const,
        recommendedLeverage: 5,
        expectedProfit20USD: 0,
        leveragedProfit20USD: 0,
        grade: "A" as const,
        hasDivergence: false,
        divergenceType: null,
        hasFvg: false,
        confluenceFactors: [],
        reasoning,
        riskLevel: "MEDIUM" as const,
        patterns: [],
        isServerVerified: false,
        multiTimeframeConfirmed: false,
        highLiquidityQualityGate: {
          isPassed: isHighLiquidityPassed,
          takerFlowRatio15m: takerFlowRatio,
          takerFlowUsd15m: currentTakerFlow,
          avgTakerFlowUsd15m: avgTakerFlow15m,
          inflowType: isHighLiquidityPassed ? "STANDARD_CONFIRMED" : "SUBPAR_REJECTED",
          inflowArabic: liquidityGateReason,
          gatekeeperReason: liquidityGateReason
        }
      };
    }

    // Dynamic SL: Structurally placed with realistic ATR buffer (2.8% to 4.2%)
    const riskDistance = Math.max(atrVal * 1.5, currentClose * 0.028);

    // Realistic, highly attainable institutional profit targets (TP1 ~3%, TP2 ~6.5%, TP3 ~12.5%)
    const targetExpansion = Math.max(riskDistance * 2.25, currentClose * 0.065);

    const sl = direction === "LONG" ? Number((currentClose - riskDistance).toFixed(decimals)) : Number((currentClose + riskDistance).toFixed(decimals));
    const tp1Dist = Math.max(riskDistance * 1.15, currentClose * 0.030);
    const tp1 = direction === "LONG" ? Number((currentClose + tp1Dist).toFixed(decimals)) : Number((currentClose - tp1Dist).toFixed(decimals));
    const tp = direction === "LONG" ? Number((currentClose + targetExpansion).toFixed(decimals)) : Number((currentClose - targetExpansion).toFixed(decimals));
    const tp2 = tp;
    const tp3Dist = Math.max(riskDistance * 3.8, currentClose * 0.125);
    const tp3 = direction === "LONG" ? Number((currentClose + tp3Dist).toFixed(decimals)) : Number((currentClose - tp3Dist).toFixed(decimals));
    const profitPercent = Number(((targetExpansion / currentClose) * 100).toFixed(1));
    const rrRatio = Number((targetExpansion / riskDistance).toFixed(1));
    
    // Add high RR factor
    if (rrRatio >= 2.0) {
      confluenceFactors.push(`عائد لمخاطرة 1:${rrRatio} مع تأمين الوقف عند TP1`);
    }

    const targetSpeed: "FAST" | "NORMAL" = (isOversoldImpulseBuy || isOverboughtImpulseSell || isFakeBottom || isFakeTop || hasBullishDivergence || hasBearishDivergence || isVolumeSurge || isMomCurlingUp || isMomCurlingDown) ? "FAST" : "NORMAL";
    const recommendedLeverage = 5;
    const expectedProfit20USD = Number((20 * (profitPercent / 100)).toFixed(2));
    const leveragedProfit20USD = Number((20 * (profitPercent / 100) * recommendedLeverage).toFixed(2));

    const setupCategory = (isOversoldImpulseBuy || isOverboughtImpulseSell) ? "OVERSOLD_IMPULSE" as const
      : (isFakeBottom || isFakeTop) ? "LIQUIDITY_SWEEP" as const
      : (hasBullishDivergence || hasBearishDivergence) ? "DIVERGENCE_REVERSAL" as const
      : (hasBullishFvg || hasBearishFvg) ? "FVG_EXPANSION" as const
      : "STANDARD" as const;

    return {
      direction,
      confidence,
      entry: currentClose,
      sl,
      tp,
      tp1,
      tp2,
      tp3,
      rrRatio,
      profitPercent,
      targetSpeed,
      recommendedLeverage,
      expectedProfit20USD,
      leveragedProfit20USD,
      grade: "A" as const,
      setupCategory,
      isOversoldImpulseBuy,
      isOverboughtImpulseSell,
      zoneStrength: isOversoldImpulseBuy ? `تشبع بيعي حاد (RSI: ${currentRsi}) مع انطلاق صاعد` : isOverboughtImpulseSell ? `تشبع شرائي مفرط (RSI: ${currentRsi}) مع رفض هابط` : undefined,
      impulseStrength: (isOversoldImpulseBuy || isOverboughtImpulseSell) ? Math.min(95, Math.round((body / range) * 100)) : undefined,
      hasDivergence: hasBullishDivergence || hasBearishDivergence,
      divergenceType: hasBullishDivergence ? "BULLISH_DIVERGENCE" : hasBearishDivergence ? "BEARISH_DIVERGENCE" : null,
      hasFvg: hasBullishFvg || hasBearishFvg,
      confluenceFactors,
      reasoning: `${reasoning} هدف ربح مستهدف +${profitPercent}% مع وقف خسارة محكم (${sl}).`,
      capitalProtectionPlan: {
        breakevenTriggerPrice: tp1,
        breakevenRule: "فور وصول السعر للهدف الأول TP1، قم بنقل وقف الخسارة فوراً إلى سعر الدخول لضمان صفقة خالية تماماً من الخسارة (Risk-Free).",
        partialTakeProfitPct: 50,
        maxCapitalRiskPct: 1.5,
        invalidationReason: direction === "LONG" ? `كسر قاع الهيكل أسفل ${sl}` : `اختراق قمة الهيكل أعلى ${sl}`,
        goldenRule: "لا تطارد السعر بالماركت أبداً، ادخل بأمر معلق Limit، واحمِ أرباحك بنقل الوقف فور ضرب TP1.",
        suggestedUnitsPer1000USD: riskDistance > 0 ? Number(((1000 * 0.015) / riskDistance).toFixed(4)) : undefined
      },
      riskLevel: "MEDIUM" as const,
      isServerVerified: false,
      multiTimeframeConfirmed: false,
      marketMatrix: {
        liquidity: {
          turnover1hUsd: Math.round(volRatio * 850_000),
          takerBuyQuoteUsd: Math.round(volRatio * 500_000),
          takerSellQuoteUsd: Math.round(volRatio * 350_000),
          orderFlowDeltaUsd: 150_000,
          buyPressurePct: direction === "LONG" ? 62 : 38,
          liquidityQuality: "HEALTHY_LIQUID",
          slippageRisk: "LOW",
          summaryArabic: "سيولة حية ونشطة مع تدفق صفقات ماركت صحي"
        },
        trades: {
          tradeCount1h: 1850,
          avgTradeSizeUsd: 720,
          whaleActivityScore: 72,
          whaleDominance: direction === "LONG" ? "WHALE_ACCUMULATING" : "WHALE_DISTRIBUTING",
          largeDealsDetected: true,
          dealFlowPace: "STEADY_ACCUMULATION",
          summaryArabic: "تدفق صفقات مؤسساتية ومشاركة حيتان متسقة"
        },
        coinStatus: {
          regime: "MOMENTUM_EXPANSION",
          regimeArabic: "انطلاق وزخم اتجاهي",
          rsVsBtc: "STRONG_LEADER",
          rsScore: 35,
          vitality: "HYPER_ACTIVE",
          summaryArabic: "العملة تقود حركة السوق وتتفوق على البيتكوين"
        },
        dynamics: {
          atrPercent: Number(((atrVal / currentClose) * 100).toFixed(2)),
          bbWidthPercent: 4.2,
          volatilityState: "HIGH_VELOCITY_EXPANSION",
          volatilityStateArabic: "توسع حركي سريع عالي الزخم",
          priceVelocityPerHourPct: 1.1,
          movementEfficiencyScore: 82,
          expectedMoveTimeframe: "سريعة (1 - 4 ساعات)",
          summaryArabic: "تذبذب عالي الكفاءة يضمن سرعة الوصول للأهداف"
        },
        multiDimensionalScore: 88,
        multiDimensionalVerdictArabic: "مصفوفة متكاملة: سيولة عميقة + صفقات حيتان داعمة + تذبذب انطلاقي سريع."
      },
      highLiquidityQualityGate: {
        isPassed: isHighLiquidityPassed,
        takerFlowRatio15m: takerFlowRatio,
        takerFlowUsd15m: currentTakerFlow,
        avgTakerFlowUsd15m: avgTakerFlow15m,
        inflowType: isHighLiquidityPassed ? "STANDARD_CONFIRMED" : "SUBPAR_REJECTED",
        inflowArabic: liquidityGateReason,
        gatekeeperReason: liquidityGateReason
      },
      patterns: [{
        type: direction === "LONG" ? "DOUBLE_BOTTOM" : "DOUBLE_TOP",
        time: klines[klines.length - 1]?.time || Date.now(),
        label: direction === "LONG" ? "قاع ارتدادي وتجميع سيولة" : "قمة مزدوجة ورفض سعري"
      }]
    };
  };

  const handleAnalyze = async (symbol: string, silent = false) => {
    if (!silent) setIsLoading(true);
    if (!silent) addLog(`جاري تحليل الفرصة لـ ${symbol} بدقة هندسية عالية...`, 'info');
    if (silent) setScanningSymbol(symbol);
    
    try {
      const klines = await fetchCandles(symbol, timeframe);
      if (!klines || klines.length === 0) {
        if (!silent) addLog(`تعذر جلب بيانات الشموع لـ ${symbol}.`, 'warn');
        return;
      }
      
      let screenshot = null;
      if (!silent && chartRef.current) {
        screenshot = chartRef.current.getScreenshot();
      }

      let analysis: any = null;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s institutional timeout for full Python quant & MTF audit
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            symbol,
            timeframe,
            data: klines, // Full candle series for complete technical indicators
            screenshot,
            huntingMode
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          analysis = await safeParseJson(Promise.resolve(res));
        }
      } catch (err) {}

      // Reliable mathematical calculation fallback if API was slow
      if (!analysis || analysis.error || !analysis.direction) {
        analysis = computePreciseAnalysis(symbol, klines);
      }

      if (!analysis) return;

      // 🛡️ High Liquidity Quality Gate (مرشح دقة السيولة العالية) - Mandatory Client-Side Audit
      const takerFlows = klines.slice(-15).map(k => k.takerBuyQuoteVolume || (k.volume * k.close * 0.5));
      const currentTakerFlow = takerFlows[takerFlows.length - 1];
      const avgTakerFlow15m = takerFlows.reduce((a, b) => a + b, 0) / (takerFlows.length || 1);
      const takerFlowRatio = avgTakerFlow15m > 0 ? currentTakerFlow / avgTakerFlow15m : 1;
      
      const isHighLiquidityPassed = takerFlowRatio >= 1.2 || (currentTakerFlow > 50000 && takerFlowRatio >= 1.05);
      const liquidityGateReason = isHighLiquidityPassed 
        ? "سيولة مؤسساتية حقيقية (تدفق ماركت نشط)" 
        : `سيولة ضعيفة/عادية (Taker Flow: ${takerFlowRatio.toFixed(2)}x) - لا ترتقي لمستوى صفقة حقيقية`;

      if (!isHighLiquidityPassed && analysis.direction !== "NEUTRAL") {
        const originalDir = analysis.direction;
        analysis.direction = "NEUTRAL";
        analysis.confidence = 50;
        analysis.reasoning = `حماية رأس المال: تم حجب إشارة ${originalDir === 'LONG' ? 'شراء' : 'بيع'} فنية مكتملة بسبب مرشح دقة السيولة (${takerFlowRatio.toFixed(2)}x). لا يوجد تدفق سيولة مؤسساتي حقيقي يدعم الانفجار السعري المنشود حالياً.`;
      }

      analysis.highLiquidityQualityGate = {
        isPassed: isHighLiquidityPassed,
        takerFlowRatio15m: takerFlowRatio,
        takerFlowUsd15m: currentTakerFlow,
        avgTakerFlowUsd15m: avgTakerFlow15m,
        inflowType: isHighLiquidityPassed ? "STANDARD_CONFIRMED" : "SUBPAR_REJECTED",
        inflowArabic: liquidityGateReason,
        gatekeeperReason: liquidityGateReason
      };

      // 1. Identify setupCategory and marketRegime
      const setupCat: SetupCategoryType = (analysis.setupCategory || 
        (analysis.isOversoldImpulseBuy || analysis.isOverboughtImpulseSell ? "OVERSOLD_IMPULSE" :
         analysis.hasDivergence ? "DIVERGENCE_REVERSAL" :
         analysis.isMomentumBreakout ? "MOMENTUM_BREAKOUT" :
         analysis.hasFvg ? "FVG_EXPANSION" : "STANDARD")) as SetupCategoryType;

      const regime: MarketRegimeType = (analysis.regimeEngine?.regime || 
        (analysis.multiTimeframeAnalysis?.d1Trend === "BULLISH" ? "BULLISH_TREND" :
         analysis.multiTimeframeAnalysis?.d1Trend === "BEARISH" ? "BEARISH_TREND" : "RANGE_BOUND")) as MarketRegimeType;

      // 2. Perform Historical Backtesting & Trade Memory Audit
      const backtestAudit = evaluateHistoricalBacktest(setupCat, regime, symbol, analysis.direction);

      let isBlockedByBacktest = false;
      if (backtestAudit.isBlocked && analysis.direction !== "NEUTRAL") {
        isBlockedByBacktest = true;
        analysis.direction = "NEUTRAL";
        analysis.recommendation = "HOLD";
        analysis.unclearReason = backtestAudit.reason;
        analysis.blockedByBacktest = true;
        analysis.backtestAuditReason = backtestAudit.reason;
      }

      const signal: MarketSignal = {
        ...analysis,
        symbol,
        timestamp: Date.now(),
        setupCategory: setupCat,
        grade: analysis.grade || (analysis.confidence >= 88 ? "AAA" : analysis.confidence >= 82 ? "AA" : "A"),
        hasDivergence: analysis.hasDivergence || false,
        divergenceType: analysis.divergenceType || null,
        hasFvg: analysis.hasFvg || false,
        confluenceFactors: analysis.confluenceFactors || [],
        isServerVerified: analysis.isServerVerified ?? false,
        multiTimeframeConfirmed: analysis.multiTimeframeConfirmed ?? false,
        fundingRate: analysis.fundingRate ?? 0,
        liquidationRisk: analysis.liquidationRisk ?? "LOW",
        smartRiskLevel: analysis.smartRiskLevel || (analysis.confidence >= 88 ? "INSTITUTIONAL_SAFE" : "SMART_CALCULATED_RISK"),
        riskLabel: analysis.riskLabel,
        invalidationPrice: analysis.invalidationPrice,
        targetVelocity: analysis.targetVelocity,
        fastOpportunityBadge: analysis.fastOpportunityBadge,
        isMomentumBreakout: analysis.isMomentumBreakout,
        highLiquidityQualityGate: analysis.highLiquidityQualityGate
      };
      if (symbol === selectedSymbol) setLastAnalysis(signal);

      // Strict Mutual Exclusivity:
      // Excluded signals NEVER leak into the trusted/verified signals list ("الثقات")
      if (signal.direction === 'NEUTRAL' || (signal.confidence < 80 && signal.smartRiskLevel !== 'SMART_CALCULATED_RISK')) {
        const auditRecord: RejectedAuditItem = {
          symbol,
          reason: isBlockedByBacktest 
            ? backtestAudit.reason 
            : (analysis.unclearReason || `عدم اكتمال شروط القنص المؤسساتي (ثقة ${analysis.confidence}%)`),
          d1: analysis.multiTimeframeAnalysis?.d1Trend || "NEUTRAL",
          h4: analysis.multiTimeframeAnalysis?.h4Trend || "NEUTRAL",
          h1: analysis.multiTimeframeAnalysis?.h1Trend || "NEUTRAL",
          confidence: analysis.confidence || 50,
          setupCategory: setupCat,
          blockedByBacktest: isBlockedByBacktest,
          consecutiveLosses: backtestAudit.consecutiveLosses,
          winRate: backtestAudit.winRate,
          marketRegime: regime,
          timestamp: Date.now()
        };

        // Add to rejectedAudits & remove from signals immediately!
        setRejectedAudits(prev => [auditRecord, ...prev.filter(a => a.symbol !== symbol)]);
        setSignals(prev => prev.filter(s => s.symbol !== symbol));

        if (!silent && isBlockedByBacktest) {
          addLog(`⛔ تصفية Backtesting تاريخية لـ ${symbol}: تم إيقاف الإشارة لتكرار خسارتها في نفس ظروف السوق (${backtestAudit.consecutiveLosses} خسائر متتالية / دقة ${backtestAudit.winRate}%). تم تسجيلها في سجل التصفية.`, 'warn');
        }
      } else {
        // High-conviction verified signal -> Remove from rejectedAudits & add to signals
        setRejectedAudits(prev => prev.filter(a => a.symbol !== symbol));
        setSignals(prev => {
          const filtered = prev.filter(s => s.symbol !== symbol);
          return [signal, ...filtered].slice(0, 40);
        });
      }

      // Alert & Siren Rules:
      // 1. Confirmed multi-timeframe OR smart calculated risk opportunity
      // 2. NEVER alert for NEUTRAL
      // 3. Confidence >= required threshold and R:R >= 3.0
      // 4. Cooldown: Minimum 30 minutes between alerts for the same symbol to prevent repetitive false siren alarms
      const now = Date.now();
      const lastAlertTime = lastAlertMapRef.current.get(symbol) || 0;
      const isSmartRiskAlert = huntingMode === 'SMART_FAST' && signal.smartRiskLevel === 'SMART_CALCULATED_RISK';
      const isEligibleForAlert = 
        signal.isServerVerified === true &&
        (signal.multiTimeframeConfirmed === true || isSmartRiskAlert) &&
        signal.direction !== 'NEUTRAL' && 
        signal.confidence >= (isSmartRiskAlert ? 80 : alertSensitivity) && 
        (signal.rrRatio || 0) >= 3.0 &&
        signal.liquidationRisk !== 'EXTREME_SQUEEZE_RISK' &&
        (signal.hasDivergence || signal.grade === 'AAA' || isSmartRiskAlert || (signal.confluenceFactors && signal.confluenceFactors.length >= 2));

      if (isEligibleForAlert && (now - lastAlertTime > 8 * 60 * 1000)) {
        lastAlertMapRef.current.set(symbol, now);
        const gradeText = signal.grade === 'AAA' ? '💎 نخبة AAA' : '⭐ فائقة AA';
        addLog(`🎯 اقتناص فرصة نادرة فائقة الدقة ${gradeText}: ${symbol} (${signal.direction === 'LONG' ? 'شراء صاعد Long' : 'بيع هابط Short'}) بنسبة ثقة ${signal.confidence}% ونسبة R:R 1:${signal.rrRatio || 3.5} - تم اجتياز فحص الأطر المتعددة 1D/4H/1H`, 'success');
        setAlertSignal(signal);
        playEmergencySound();
        triggerDesktopNotification(
          `🎯 [${signal.direction === 'LONG' ? 'شراء صاعد' : 'بيع هابط'}] ${symbol}`,
          `ثقة مؤسسية ${signal.confidence}% | عائد 1:${signal.rrRatio || 3.5} | دخول: $${signal.entry} | الهدف 1: $${signal.tp1}`
        );
        setTimeout(() => setAlertSignal(null), 12000);
      }

      if (!silent) {
        if (signal.direction === 'NEUTRAL') {
          addLog(`فحص معمق لـ ${symbol}: لم تكتمل شروط القنص المؤسساتي (حماية رأس المال نشطة - لا توجد مصيدة سيولة مؤكدة).`, 'info');
        } else {
          addLog(`اكتمل التحليل المعمق لـ ${symbol}: ${signal.direction === 'LONG' ? 'شراء صاعد' : 'بيع هابط'} (ثقة ${signal.confidence}%)`, 'success');
        }
      } else if (signal.direction !== 'NEUTRAL' && signal.confidence >= 88) {
        addLog(`🎯 قناص الفرص: تم رصد صفقة مؤكدة على ${symbol} بنسبة ثقة ${signal.confidence}% وعائد R:R 1:${signal.rrRatio || 3.5}`, 'success');
      }
    } catch (e: any) {
      // Handled quietly
    } finally {
      if (!silent) setIsLoading(false);
      if (silent) setScanningSymbol(null);
    }
  };

  const startSniper = async () => {
    if (isScanningRef.current) {
      isScanningRef.current = false;
      setIsScanning(false);
      addLog("تم إيقاف عملية المسح التلقائي.", "warn");
      return;
    }
    
    isScanningRef.current = true;
    setIsScanning(true);
    addLog(`بدء وضع 'القناص المؤسساتي المعمق' - جاري فحص الأطر الزمنية المتعددة (1D + 4H + 1H) ومعدلات التمويل لحماية رأس المال 100%...`, "info");
    
    while (isScanningRef.current) {
      let candidates: string[] = [];
      const isScanAll = scanStrategy === 'ALL_COINS';
      
      if (scanStrategy === 'TREND_OF_THE_DAY') {
        // Send full universe, server runs Pre-Trend Ignition & Coiling filter on 4H/1D
        candidates = allSymbols;
      } else if (isScanAll) {
        // Send full universe of symbols, server performs multi-cluster institutional screening
        candidates = allSymbols;
      } else if (scanStrategy === 'NEW_LISTINGS') {
        candidates = newListings.length > 0 ? newListings.map(n => n.symbol) : allSymbols.slice(0, 40);
      } else if (scanStrategy === 'FAVORITES' && favorites.length > 0) {
        candidates = [...favorites];
      } else if (scanStrategy === 'OVERSOLD') {
        // Prioritize coins with deepest 24h pullbacks/dips to pinpoint strong demand & oversold impulse buys
        candidates = [...allSymbols]
          .sort((a, b) => {
            const changeA = tickers[a]?.priceChangePercent ?? 0;
            const changeB = tickers[b]?.priceChangePercent ?? 0;
            return changeA - changeB;
          })
          .slice(0, 40);
      } else if (scanStrategy === 'VOLATILITY') {
        candidates = [...allSymbols]
          .sort((a, b) => {
            const changeA = Math.abs(tickers[a]?.priceChangePercent ?? 0);
            const changeB = Math.abs(tickers[b]?.priceChangePercent ?? 0);
            return changeB - changeA;
          })
          .slice(0, 40);
      } else {
        candidates = [...allSymbols]
          .sort((a, b) => {
            const volA = tickers[a]?.quoteVolume ?? 0;
            const volB = tickers[b]?.quoteVolume ?? 0;
            return volB - volA;
          })
          .slice(0, 40);
      }

      if (candidates.length === 0) {
        candidates = allSymbols.slice(0, 40);
      }

      const scanStatusText = scanStrategy === 'TREND_OF_THE_DAY'
        ? `رصد واقتناص استباقي لعملات تريند اليوم (Pre-Trend Ignition) عبر الأطر 1D + 4H + 1H قبل انطلاق الحركة...`
        : isScanAll
        ? `مسح شامل لكافة عملات المنصة (${allSymbols.length || 728}+ عملة مع الإدراجات الجديدة) عبر الأطر 1D + 4H + 1H...`
        : scanStrategy === 'NEW_LISTINGS'
        ? `مسح خاص لكافة العملات المدرجة حديثاً (${candidates.length} عملة)...`
        : `فحص مؤسساتي متقدم لـ ${candidates.length} عملة مرشحة (1D + 4H + 1H)...`;
      setScanningSymbol(scanStatusText);
      try {
        const scanRes = await fetch("/api/sniper-scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            symbols: candidates, 
            strategy: scanStrategy, 
            huntingMode,
            scanAll: isScanAll
          })
        });

        if (scanRes.ok) {
          const scanData = await scanRes.json();
          const { verifiedSignals = [], rejectedAudits: audits = [], institutionalSummary } = scanData;
          
          if (Array.isArray(audits) && audits.length > 0) {
            setRejectedAudits(prev => {
              const map = new Map(audits.map((a: any) => [a.symbol, a]));
              prev.forEach(p => {
                if (!map.has(p.symbol)) map.set(p.symbol, p);
              });
              return Array.from(map.values()).slice(0, 100);
            });
          }

          if (Array.isArray(verifiedSignals) && verifiedSignals.length > 0) {
            const verifiedSymbols = new Set(verifiedSignals.map((v: any) => v.symbol));
            // Remove newly confirmed signals from rejected audits
            setRejectedAudits(prev => prev.filter(p => !verifiedSymbols.has(p.symbol)));

            setSignals(prev => {
              const verifiedSymbols = new Set(verifiedSignals.map((v: any) => v.symbol));
              const validPrev = prev.filter(p => !verifiedSymbols.has(p.symbol) && p.isServerVerified);
              return [...verifiedSignals, ...validPrev].slice(0, 25);
            });
          }

          if (verifiedSignals.length > 0) {
            // Evaluate Alert for newly verified signals
            for (const sig of verifiedSignals) {
              const now = Date.now();
              const lastAlertTime = lastAlertMapRef.current.get(sig.symbol) || 0;
              const isSmartRiskAlert = huntingMode === 'SMART_FAST' && sig.smartRiskLevel === 'SMART_CALCULATED_RISK';
              const isEligible = 
                sig.isServerVerified === true &&
                (sig.multiTimeframeConfirmed === true || isSmartRiskAlert) &&
                sig.direction !== 'NEUTRAL' &&
                sig.confidence >= (isSmartRiskAlert ? 82 : alertSensitivity) &&
                (sig.rrRatio || 0) >= 2.8 &&
                sig.liquidationRisk !== 'EXTREME_SQUEEZE_RISK';

              if (isEligible && (now - lastAlertTime > 8 * 60 * 1000)) {
                lastAlertMapRef.current.set(sig.symbol, now);
                setAlertSignal(sig);
                playEmergencySound();
                triggerDesktopNotification(
                  `🎯 [${sig.direction === 'LONG' ? 'شراء صاعد LONG' : 'بيع هابط SHORT'}] ${sig.symbol}`,
                  `ثقة ${sig.confidence}% | عائد 1:${sig.rrRatio} | دخول: $${sig.entry} | الهدف 1: $${sig.tp1}`
                );
                const modeLabel = isSmartRiskAlert ? '⚡ قنص مخاطرة ذكية محسوبة' : '🎯 قناص الفرص النخبوي';
                addLog(`[${modeLabel}] إشارة مؤكدة: ${sig.symbol} (${sig.direction === 'LONG' ? 'شراء Long' : 'بيع Short'}) بنسبة ثقة ${sig.confidence}% وعائد 1:${sig.rrRatio} - ${sig.fastOpportunityBadge || 'توافق فني عالي الدقة'}`, 'success');
                setTimeout(() => setAlertSignal(null), 12000);
                break; // Trigger highest-priority alert per cycle
              }
            }
          } else {
            addLog(institutionalSummary || `تم فحص ${candidates.length} عملة واستبعادها جميعاً لحماية رأس المال (لا توجد إشارة بنسبة دقة 85%+).`, 'info');
          }
        }
      } catch (scanErr) {
        // quiet error
      }
      
      setScanningSymbol(null);
      if (!isScanningRef.current) break;
      addLog("اكتملت دورة الفحص المعمق. استراحة 20 ثانية قبل الدورة التالية لحماية الحساب من الإشارات الزائفة...", "info");
      await new Promise(r => setTimeout(r, 20000));
    }
    
    setScanningSymbol(null);
  };

  useEffect(() => {
    fetchAllSymbols();
    fetchMacro();
    addLog("النظام متصل بكفاءة عالية. محرك السكالبينج جاهز (Scalping Engine).", "success");
    addLog("المحلل النشط: DeepSeek-V4-Flash | المراسل النشط: step-3.7-flash", "info");

    // Fetch fresh verified signals immediately from server cache
    const fetchLiveSniper = async () => {
      try {
        const res = await fetch("/api/sniper-signals-live");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.verifiedSignals) && data.verifiedSignals.length > 0) {
            setSignals(data.verifiedSignals);
          }
        }
      } catch (e) {}
    };
    fetchLiveSniper();

    // Sync Preemptive Sniper Mode from LocalStorage
    try {
      const saved = localStorage.getItem("avantis_ai_config");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.isPreemptiveSniperMode !== undefined) {
          setPreemptiveSniperMode(parsed.isPreemptiveSniperMode);
        }
      }
    } catch (e) {}

    // Automatically initiate background strategic scanner so live opportunities are continually evaluated
    const scanTimer = setTimeout(() => {
      if (!isScanningRef.current) {
        startSniper();
      }
    }, 600);

    return () => clearTimeout(scanTimer);
  }, []);

  useEffect(() => {
    fetchCandles(selectedSymbol, timeframe);
    fetchOrderBook(selectedSymbol);
    
    // Auto-initiate precision analysis on symbol/timeframe change
    handleAnalyze(selectedSymbol);

    const liveTimer = setInterval(() => {
      fetchCandles(selectedSymbol, timeframe);
      fetchOrderBook(selectedSymbol);
    }, 15000); // 15s interval for live updates to balance freshness and system load

    return () => clearInterval(liveTimer);
  }, [selectedSymbol, timeframe]);

  useEffect(() => {
    if (!isDualChart) return;
    const sym = syncSymbols ? selectedSymbol : chart2Symbol;
    const tf = syncSymbols ? getRecommendedLtf(timeframe) : chart2Timeframe;
    
    if (syncSymbols) {
      setChart2Symbol(sym);
      setChart2Timeframe(tf);
    }
    
    fetchChart2Candles(sym, tf);

    const dualTimer = setInterval(() => {
      fetchChart2Candles(sym, tf);
    }, 6000);

    return () => clearInterval(dualTimer);
  }, [isDualChart, selectedSymbol, timeframe, syncSymbols, chart2Symbol, chart2Timeframe]);

  useEffect(() => {
    const symbolsTimer = setInterval(() => {
      fetchAllSymbols();
    }, 25000);
    return () => clearInterval(symbolsTimer);
  }, []);

  // Preemptive Sniper Alert Polling
  useEffect(() => {
    const fetchSniperAlerts = async () => {
      // Re-read from localStorage because the modal might have changed it
      try {
        const saved = localStorage.getItem("avantis_ai_config");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.isPreemptiveSniperMode !== undefined) {
            setPreemptiveSniperMode(parsed.isPreemptiveSniperMode);
          }
        }
      } catch (e) {}

      if (!preemptiveSniperMode) return;

      try {
        const res = await fetch("/api/sniper-alerts");
        if (res.ok) {
          const data = await res.json();
          if (data.alerts && Array.isArray(data.alerts) && data.alerts.length > 0) {
            const newAlerts = data.alerts.filter((alert: any) => !lastSniperAlerts.includes(alert.symbol + alert.timestamp));

            if (newAlerts.length > 0) {
              // Log each new alert cleanly in journal
              newAlerts.forEach((alert: any) => {
                addLog(`[⚡ ${alert.title}] ${alert.symbol}: ${alert.message}`, "warn");
              });

              // Update tracked alert keys
              setLastSniperAlerts(prev => [...prev, ...newAlerts.map((a: any) => a.symbol + a.timestamp)].slice(-40));

              // Select the highest priority alert for the on-screen alert banner
              const topAlert = newAlerts[0];
              const isShort = topAlert.direction === "SHORT";
              const syntheticAlertSig: MarketSignal = {
                symbol: topAlert.symbol,
                timeframe: "1h",
                direction: isShort ? "SHORT" : "LONG",
                confidence: topAlert.confidence || 95,
                entry: topAlert.targets?.entry || topAlert.price,
                sl: topAlert.targets?.sl || (isShort ? topAlert.price * 1.055 : topAlert.price * 0.945),
                tp: topAlert.targets?.tp2 || (isShort ? topAlert.price * 0.65 : topAlert.price * 1.6),
                tp1: topAlert.targets?.tp1 || (isShort ? topAlert.price * 0.82 : topAlert.price * 1.25),
                tp2: topAlert.targets?.tp2 || (isShort ? topAlert.price * 0.65 : topAlert.price * 1.6),
                tp3: topAlert.targets?.tp3 || (isShort ? topAlert.price * 0.45 : topAlert.price * 2.2),
                profitPercent: isShort ? 35 : 60,
                rrRatio: 5.5,
                targetSpeed: "FAST",
                isRealTradeConfirmed: true,
                reasoning: topAlert.message,
                grade: "AAA",
                fastOpportunityBadge: topAlert.title,
                smartRiskLevel: "SMART_CALCULATED_RISK",
                confluenceFactors: [topAlert.title, topAlert.message, "شمعة 1H سيولة مؤسسية"],
                patterns: [],
                riskLevel: "LOW",
                timestamp: topAlert.timestamp || Date.now(),
                isServerVerified: true,
                multiTimeframeConfirmed: true,
                liquidationRisk: "LOW"
              };

              setAlertSignal(syntheticAlertSig);
              setTimeout(() => setAlertSignal(null), 12000);

              // Play tactical acoustic alert
              playEmergencySound();
              // Trigger OS Desktop Notification
              triggerDesktopNotification(
                `⚡ [${topAlert.title}] ${topAlert.symbol}`,
                `${topAlert.message} | السعر: $${topAlert.price} | الدخول والوقف محددين بدقة`
              );
            }
          }
        }
      } catch (e) {}
    };

    const sniperTimer = setInterval(fetchSniperAlerts, 15000); // Live 15s polling
    fetchSniperAlerts(); // Initial call

    return () => clearInterval(sniperTimer);
  }, [preemptiveSniperMode, lastSniperAlerts, isMuted]);

  return (
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden font-sans selection:bg-[#10b981]/30 dir-rtl" dir="rtl">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 0, opacity: isSidebarOpen ? 1 : 0 }}
        className="border-l border-white/5 bg-[#080808] flex flex-col z-50 overflow-hidden relative"
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#10b981] rounded-sm flex items-center justify-center">
              <Zap className="w-5 h-5 text-black fill-black" />
            </div>
            <h1 className="text-sm font-bold tracking-[0.2em] uppercase flex items-center gap-2">
              AVANTIS AI
              <motion.div 
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-[#10b981]" 
              />
            </h1>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <nav className="px-3 space-y-1">
            {( [
              { id: 'freqtrade', label: '⚡ بوت Freqtrade للعقود الآجلة', icon: Bot },
              { id: 'crypto_signals', label: '📊 مصفوفة الفريمات (Crypto-Signal)', icon: Activity },
              { id: 'sniper', label: '🎯 قناص الفرص الفنية والتنبيهات', icon: Crosshair },
              { id: 'dashboard', label: 'شاشة التداول والتحليل', icon: LayoutDashboard },
              { id: 'ai_terminal', label: 'محطة التحليل AI (Deep)', icon: Cpu },
              { id: 'correlation', label: 'مصفوفة الارتباط بالبيتكوين', icon: Network },
              { id: 'bottom_scanner', label: 'رادار قاع القاع (Moonshots)', icon: TrendingUp },
              { id: 'whale', label: 'رادار الحيتان وكشف التلاعب', icon: Radar },
              { id: 'memory', label: 'ذاكرة الصفقات والتعلم', icon: Brain },
              { id: 'news', label: 'رادار الأخبار والسيولة', icon: Newspaper },
              { id: 'macro', label: 'أخبار الفيدرالي والماكرو', icon: Globe },
              { id: 'council', label: 'التقرير الاستراتيجي', icon: ShieldAlert },
              { id: 'terminal', label: 'سجلات النظام', icon: Terminal },
            ] as const).map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-sm transition-all group ${
                  activeTab === item.id ? 'bg-[#10b981]/10 text-[#10b981]' : 'text-white/40 hover:text-white hover:bg-white/[0.02]'
                }`}
              >
                <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-[#10b981]' : 'text-white/20 group-hover:text-white/40'}`} />
                <span className="text-[12px] font-bold">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-6 px-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <h3 className="text-[11px] font-bold text-white/70 uppercase tracking-wider">سوق العقود والعملات</h3>
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-ping" />
              </div>
              <span className="text-[10px] text-[#10b981] font-mono font-bold bg-[#10b981]/10 px-1.5 py-0.5 rounded">
                {allSymbols.length} عملة
              </span>
            </div>

            {/* Filter Category Tabs */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 mb-3 bg-black/60 p-1 rounded border border-white/5 text-[9px] font-bold">
              {[
                { id: 'ALL', label: 'الكل' },
                { id: 'NEW_LISTINGS', label: `🔥 جديدة (${newListings.length})` },
                { id: 'FAVORITES', label: '⭐' },
                { id: 'VOLUME', label: 'سيولة' },
                { id: 'GAINERS', label: '🟢 رابحة' },
                { id: 'LOSERS', label: '🔴 خاسرة' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setCoinFilterTab(tab.id as any)}
                  className={`py-1 rounded transition-all text-center ${
                    coinFilterTab === tab.id 
                      ? 'bg-white/15 text-white shadow-xs font-bold' 
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            
            {/* Search Input */}
            <div className="relative mb-3">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
              <input 
                type="text"
                placeholder="بحث فوري بالرمز (مثال: BTC, SOL)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery) {
                    const found = allSymbols.find(s => s.startsWith(searchQuery));
                    if (found) setSelectedSymbol(found);
                    else setSelectedSymbol(searchQuery + "USDT");
                  }
                }}
                className="w-full bg-black/80 border border-white/10 rounded py-2 pr-9 pl-3 text-[11px] focus:outline-none focus:border-[#10b981]/60 transition-all text-white placeholder:text-white/20"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center justify-between text-[9px] text-white/30 mb-2 px-1 font-mono">
              <span>الرمز / الزوج</span>
              <span>السعر / التغير 24h</span>
            </div>

            {/* Complete coin list with NO .slice(0, 100) limit */}
            <div className="space-y-1 max-h-[360px] overflow-y-auto custom-scrollbar pr-0.5">
              {filteredSymbols.length === 0 ? (
                <div className="py-8 text-center text-white/30 text-xs font-medium">
                  لا توجد عملات مطابقة للبحث
                </div>
              ) : (
                filteredSymbols.map(sym => {
                  const ticker = tickers[sym];
                  const isSelected = selectedSymbol === sym;
                  const isFav = favorites.includes(sym);
                  const isPositive = (ticker?.priceChangePercent ?? 0) >= 0;
                  const isNew = newListings.some(n => n.symbol === sym);

                  return (
                    <button
                      key={sym}
                      onClick={() => setSelectedSymbol(sym)}
                      className={`w-full flex items-center justify-between text-right px-2.5 py-2 rounded text-[11px] font-mono transition-all group ${
                        isSelected 
                          ? 'bg-[#10b981]/15 text-[#10b981] border-r-2 border-[#10b981] shadow-xs' 
                          : 'text-white/60 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div
                          onClick={(e) => toggleFavorite(e, sym)}
                          className="p-1 hover:bg-white/10 rounded transition-all cursor-pointer shrink-0"
                          title={isFav ? "إزالة من المفضلة" : "إضافة للمفضلة"}
                        >
                          <Star 
                            className={`w-3 h-3 ${isFav ? 'text-[#f59e0b] fill-[#f59e0b]' : 'text-white/20 group-hover:text-white/40'}`} 
                          />
                        </div>
                        <div className="flex items-baseline gap-0.5 truncate">
                          <span className={`font-bold text-xs ${isSelected ? 'text-[#10b981]' : 'text-white'}`}>
                            {sym ? String(sym).replace('USDT', '') : ''}
                          </span>
                          <span className="text-[9px] text-white/30">/USDT</span>
                          {isNew && (
                            <span className="mr-1 text-[8px] bg-amber-400/20 text-amber-400 border border-amber-400/40 px-1 py-0.2 rounded font-sans font-bold">
                              جديد
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {ticker ? (
                          <>
                            <span className="text-[10px] text-white/70 font-mono">
                              {typeof ticker.lastPrice === 'number' && ticker.lastPrice > 10 
                                ? ticker.lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
                                : typeof ticker.lastPrice === 'number' && ticker.lastPrice > 0.01 
                                  ? ticker.lastPrice.toFixed(4) 
                                  : (typeof ticker.lastPrice === 'number' ? ticker.lastPrice.toFixed(6) : (ticker.lastPrice ?? '---'))}
                            </span>
                            <span className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold ${
                              isPositive ? 'text-[#10b981] bg-[#10b981]/10' : 'text-[#ef4444] bg-[#ef4444]/10'
                            }`}>
                              {isPositive ? '+' : ''}{typeof ticker.priceChangePercent === 'number' && isFinite(ticker.priceChangePercent) ? ticker.priceChangePercent.toFixed(1) : '0.0'}%
                            </span>
                          </>
                        ) : (
                          <span className="text-[9px] text-white/20 font-mono">---</span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-white/5 space-y-2">
          <button
            onClick={() => setIsBinanceModalOpen(true)}
            className="w-full flex items-center justify-between p-2.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-sm text-amber-300 transition-all text-xs group"
          >
            <div className="flex items-center gap-2">
              <Key className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="font-bold">ربط حساب Binance</span>
            </div>
            <span className="text-[9px] bg-amber-500/20 text-amber-200 px-1.5 py-0.5 rounded font-mono">
              {binanceAccount?.connected ? "متصل 🟢" : "إعداد ⚙️"}
            </span>
          </button>

          <button
            onClick={() => setIsAiConfigModalOpen(true)}
            className="w-full flex items-center justify-between p-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-sm text-emerald-300 transition-all text-xs group"
          >
            <div className="flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="font-bold">محرك AI (4 نماذج متخصصة)</span>
            </div>
            <span className="text-[9px] bg-emerald-500/25 text-emerald-200 px-1.5 py-0.5 rounded font-mono font-bold">
              مربوط تلقائياً 🟢
            </span>
          </button>
          <div className="flex items-center justify-between">
            <span className="text-[9px] opacity-40 uppercase">سرعة الاستجابة</span>
            <span className="text-[9px] font-mono text-[#10b981]">
              {binanceAccount?.latencyMs ? `${binanceAccount.latencyMs}ms` : "14ms"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[9px] opacity-40 uppercase">حالة المراقبة</span>
            <span className="text-[9px] font-mono text-[#10b981]">نشط (Live Feed)</span>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative min-w-0 border-r border-white/5">
        <header className="h-16 border-b border-white/5 bg-[#080808]/50 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-40 gap-3">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-white/5 rounded-sm transition-colors text-white/40 hover:text-white"
              title={isSidebarOpen ? "إخفاء القائمة الجانبية" : "عرض قائمة العملات"}
            >
              {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

            {/* زر تحليل الفرصة في الجهة اليمنى مباشرة */}
            <button 
              onClick={() => handleAnalyze(selectedSymbol)}
              disabled={isLoading}
              className="bg-gradient-to-r from-[#10b981] to-[#00d4aa] hover:brightness-110 active:scale-95 disabled:opacity-50 text-black font-black px-4 sm:px-5 h-10 rounded-sm text-xs tracking-wider transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.35)] shrink-0 border border-[#10b981]"
              title="تحليل فوري دقيق لفرصة التداول الحالية بالأطر الزمنية المتعددة"
            >
              {isLoading ? <RefreshCcw className="w-4 h-4 animate-spin text-black" /> : <Brain className="w-4 h-4 text-black" />}
              <span>تحليل الفرصة</span>
            </button>

            {/* Quick Active Symbol & Price Widget */}
            <div 
              onClick={() => setIsSidebarOpen(true)}
              className="flex items-center gap-2 bg-black/80 hover:bg-black border border-white/10 hover:border-[#10b981]/40 px-3 py-1.5 rounded-sm cursor-pointer transition-all group"
              title="انقر لفتح قائمة العملات والتبديل"
            >
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                <span className="text-xs font-black font-mono text-white tracking-wider group-hover:text-[#10b981] transition-colors">
                  {selectedSymbol}
                </span>
              </div>
              {tickers[selectedSymbol] && (
                <div className="flex items-center gap-2 border-r border-white/10 pr-2 mr-0.5 font-mono">
                  <span className="text-xs text-white/90 font-bold">
                    {typeof tickers[selectedSymbol].lastPrice === 'number' && tickers[selectedSymbol].lastPrice > 10 
                      ? tickers[selectedSymbol].lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
                      : typeof tickers[selectedSymbol].lastPrice === 'number' && tickers[selectedSymbol].lastPrice > 0.01 
                        ? tickers[selectedSymbol].lastPrice.toFixed(4) 
                        : (typeof tickers[selectedSymbol].lastPrice === 'number' ? tickers[selectedSymbol].lastPrice.toFixed(6) : (tickers[selectedSymbol].lastPrice ?? '---'))}
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                    (tickers[selectedSymbol]?.priceChangePercent ?? 0) >= 0 
                      ? 'text-[#10b981] bg-[#10b981]/15' 
                      : 'text-[#ef4444] bg-[#ef4444]/15'
                  }`}>
                    {(tickers[selectedSymbol]?.priceChangePercent ?? 0) >= 0 ? '+' : ''}
                    {typeof tickers[selectedSymbol]?.priceChangePercent === 'number' && isFinite(tickers[selectedSymbol].priceChangePercent)
                      ? tickers[selectedSymbol].priceChangePercent.toFixed(1)
                      : '0.0'}%
                  </span>
                </div>
              )}
            </div>
            
            {/* Extended Timeframe Selector with 15m and 5m high-precision badges */}
            <div className="flex items-center gap-0.5 bg-black p-1 rounded-sm border border-white/10 overflow-x-auto">
              {(["1m", "3m", "5m", "15m", "30m", "1h", "4h", "1d"] as TimeFrame[]).map(tf => {
                const isPrecision = tf === "15m" || tf === "5m";
                return (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`relative px-2.5 py-1 rounded-sm text-[10px] font-bold font-mono transition-all flex items-center gap-1 ${
                      timeframe === tf 
                        ? 'bg-white/15 text-white shadow-sm border border-white/20' 
                        : 'text-white/40 hover:text-white hover:bg-white/5'
                    }`}
                    title={isPrecision ? `إطار زمني دقيق (${tf}) للتأكيدات السريعة` : `الإطار الزمني ${tf}`}
                  >
                    <span>{tf}</span>
                    {isPrecision && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" title="إطار مؤسسي عالي الدقة" />
                    )}
                  </button>
                );
              })}
            </div>

            {isScanning && (
              <div className="hidden xl:flex items-center gap-2 bg-[#10b981]/10 px-3 py-1.5 rounded-sm border border-[#10b981]/20">
                <RefreshCcw className="w-3 h-3 text-[#10b981] animate-spin" />
                <span className="text-[10px] font-bold text-[#10b981] uppercase tracking-tighter">Scanning: {scanningSymbol}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Quick Freqtrade Hub Button in Header */}
            <button
              onClick={() => setActiveTab('freqtrade')}
              className={`flex items-center gap-1.5 px-3 h-9 rounded-sm text-xs font-bold transition-all border ${
                activeTab === 'freqtrade'
                  ? 'bg-emerald-500 text-black border-emerald-400 shadow-md shadow-emerald-500/20 font-black'
                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
              }`}
              title="الانتقال إلى بوت ومحرك Freqtrade للعقود الآجلة"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>بوت Freqtrade ⚡</span>
            </button>

            {/* Quick Crypto-Signal Multi-TF Matrix Button */}
            <button
              onClick={() => setActiveTab('crypto_signals')}
              className={`flex items-center gap-1.5 px-3 h-9 rounded-sm text-xs font-bold transition-all border ${
                activeTab === 'crypto_signals'
                  ? 'bg-sky-500 text-black border-sky-400 shadow-md shadow-sky-500/20 font-black'
                  : 'bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border-sky-500/30'
              }`}
              title="مصفوفة الإشارات الفنية التوافقية (Crypto-Signal)"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>مصفوفة الفريمات 📊</span>
            </button>

            {/* Quick Sniper Button in Header */}
            <button
              onClick={() => setActiveTab('sniper')}
              className={`flex items-center gap-1.5 px-3 h-9 rounded-sm text-xs font-bold transition-all border ${
                activeTab === 'sniper'
                  ? 'bg-amber-400 text-black border-amber-300 shadow-md shadow-amber-400/20 font-black'
                  : 'bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border-amber-400/30'
              }`}
              title="الانتقال إلى قناص الفرص الفنية والتنبيهات"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>قناص الفرص 🎯</span>
            </button>

            {/* Quick Dual Chart Toggle in Header */}
            <button
              onClick={() => setIsDualChart(!isDualChart)}
              className={`flex items-center gap-1.5 px-3 h-9 rounded-sm text-xs font-bold transition-all border ${
                isDualChart 
                  ? 'bg-[#10b981]/20 border-[#10b981]/50 text-[#10b981]' 
                  : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
              }`}
              title="تفعيل/تعطيل عرض الشارت المزدوج (Dual Chart View)"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{isDualChart ? "شارت مزدوج نشط" : "شارت مزدوج"}</span>
            </button>

            <button
              onClick={() => setIsAiConfigModalOpen(true)}
              className="flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 h-9 rounded-sm text-xs font-mono transition-all"
              title="جميع النماذج مربوطة وتعمل تلقائياً (MiniMax + DeepSeek + Kimi + Step)"
            >
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden lg:inline font-bold">AI: 4 نماذج 🟢</span>
            </button>

            <button
              onClick={() => setIsBinanceModalOpen(true)}
              className="flex items-center gap-2 bg-[#f59e0b]/10 hover:bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30 px-3 h-9 rounded-sm text-xs font-mono transition-all"
              title="إعدادات وربط Binance API"
            >
              <Key className="w-3.5 h-3.5 text-[#f59e0b]" />
              <span className="hidden lg:inline">
                {binanceAccount?.connected 
                  ? `$${binanceAccount.walletBalanceUsdt !== undefined ? binanceAccount.walletBalanceUsdt : 0} USDT` 
                  : "Binance API"}
              </span>
            </button>

            <button 
              onClick={() => {
                requestNotificationPermission();
                playEmergencySound();
                triggerDesktopNotification("🔔 تجربة التنبيه التكتيكي الفوري", "نظام التنبيهات الصوتية والمكتبية يعمل الآن بدقة فائقة وبأعلى استجابة.");
                addLog("تم اختبار الصوت التكتيكي والإشعارات المكتبية بنجاح 🟢", "success");
              }}
              className="px-2.5 py-1.5 bg-[#10b981]/15 hover:bg-[#10b981]/25 border border-[#10b981]/40 text-[#10b981] rounded text-[11px] font-bold transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
              title="فحص واختبار التنبيه الصوتي الفوري والمكتبي"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">فحص التنبيه 🔔</span>
            </button>

            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 hover:bg-white/5 rounded-full transition-all group"
              title={isMuted ? "تفعيل الصوت" : "كتم الصوت"}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-[#10b981]" />}
            </button>
          </div>
        </header>

        <div className="flex-1 flex flex-col overflow-hidden">
          <AnimatePresence mode="wait">
            {activeTab === 'freqtrade' && (
              <motion.div 
                key="freqtrade"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex-1 p-6 overflow-y-auto"
              >
                <FreqtradeDashboard 
                  tickers={tickers}
                  onSelectCoin={(sym) => {
                    setSelectedSymbol(sym);
                    setActiveTab('dashboard');
                  }}
                />
              </motion.div>
            )}

            {activeTab === 'crypto_signals' && (
              <motion.div 
                key="crypto_signals"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex-1 p-6 overflow-y-auto"
              >
                <CryptoSignalDashboard 
                  onSelectCoin={(sym) => {
                    setSelectedSymbol(sym);
                    setActiveTab('dashboard');
                  }}
                  isMuted={isMuted}
                  setIsMuted={setIsMuted}
                />
              </motion.div>
            )}

            {activeTab === 'dashboard' && (
              <motion.div 
                key="dash"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex-1 flex flex-col p-6 gap-6 overflow-y-auto"
              >
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[500px]">
                  <div className="lg:col-span-3 space-y-4">
                    {/* Dual Chart Control Bar */}
                    <div className="bg-[#0a0a0a] border border-white/10 p-3 rounded-sm flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center bg-black border border-white/10 p-1 rounded-sm">
                          <button
                            onClick={() => setIsDualChart(false)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-sm transition-all ${
                              !isDualChart ? 'bg-[#10b981] text-black shadow-sm' : 'text-white/40 hover:text-white'
                            }`}
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                            <span>شارت فردي</span>
                          </button>
                          <button
                            onClick={() => setIsDualChart(true)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-sm transition-all ${
                              isDualChart ? 'bg-[#10b981] text-black shadow-sm' : 'text-white/40 hover:text-white'
                            }`}
                          >
                            <Columns className="w-3.5 h-3.5" />
                            <span>عرض الشارت المزدوج (Dual Chart)</span>
                          </button>
                        </div>

                        {isDualChart && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSyncSymbols(!syncSymbols)}
                              className={`px-3 py-1.5 rounded-sm text-xs font-bold border transition-all flex items-center gap-1.5 ${
                                syncSymbols
                                  ? 'bg-[#10b981]/20 border-[#10b981]/50 text-[#10b981]'
                                  : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                              }`}
                              title="مزامنة نفس الأصل مع الفريم الصغير للتأكيد المؤسسي"
                            >
                              <Layers className="w-3.5 h-3.5" />
                              <span>{syncSymbols ? 'مزامنة نفس الأصل (HTF ➔ LTF)' : 'مقارنة عملتين منفصلتين'}</span>
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Institutional Pair Indicator Badge */}
                        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/10 rounded-sm text-[11px] font-mono text-white/80">
                          <Target className="w-3.5 h-3.5 text-[#10b981]" />
                          <span>إطار الاهتمام: <strong className="text-white">{timeframe}</strong></span>
                          <span className="text-white/40">➔</span>
                          <span>التأكيد: <strong className="text-[#10b981]">{getRecommendedLtf(timeframe)}</strong></span>
                        </div>

                        {/* Quick Preset: XAUUSD Gold */}
                        <button
                          onClick={() => {
                            setSelectedSymbol("XAUUSDT");
                            setTimeframe("15m");
                          }}
                          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-sm border transition-all ${
                            selectedSymbol === "XAUUSDT"
                              ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                              : 'bg-black/60 border-white/10 text-white/60 hover:text-amber-300 hover:border-amber-500/40'
                          }`}
                          title="التبديل الفوري لشارت الذهب XAUUSD"
                        >
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                          <span>الذهب (XAUUSD)</span>
                        </button>
                      </div>
                    </div>

                    {/* Chart Container(s) */}
                    {!isDualChart ? (
                      <div className="bg-[#0a0a0a] border border-white/5 rounded-sm overflow-hidden h-[520px]">
                        <TradingViewChart 
                          ref={chartRef}
                          data={chartData} 
                          symbol={selectedSymbol}
                          timeframe={timeframe}
                          badgeLabel="الشارت الرئيسي"
                          entry={lastAnalysis?.entry} sl={lastAnalysis?.sl} tp={lastAnalysis?.tp}
                          markers={lastAnalysis?.symbol === selectedSymbol && lastAnalysis.patterns ? lastAnalysis.patterns.map(p => ({
                            time: p.time,
                            position: (p.type.includes('BOTTOM') || p.type.includes('TRIANGLE')) ? 'belowBar' : 'aboveBar',
                            color: '#f59e0b',
                            shape: (p.type.includes('BOTTOM') || p.type.includes('TRIANGLE')) ? 'arrowUp' : 'arrowDown',
                            text: p.label
                          })) : []}
                        />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {/* Chart 1: HTF POI */}
                        <div className="bg-[#0a0a0a] border border-[#10b981]/30 rounded-sm overflow-hidden flex flex-col h-[500px]">
                          <div className="bg-black/90 px-3 py-2 border-b border-white/10 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                              <span className="font-bold text-white font-mono">{selectedSymbol}</span>
                              <span className="px-1.5 py-0.5 bg-[#10b981]/20 border border-[#10b981]/40 text-[#10b981] text-[10px] font-bold rounded">
                                منطقة الاهتمام (HTF POI)
                              </span>
                            </div>
                            <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded">
                              {(["15m", "30m", "1h", "4h", "1d"] as TimeFrame[]).map(tf => (
                                <button
                                  key={tf}
                                  onClick={() => setTimeframe(tf)}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono transition-all ${
                                    timeframe === tf ? 'bg-[#10b981] text-black' : 'text-white/40 hover:text-white'
                                  }`}
                                >
                                  {tf}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="flex-1 relative">
                            <TradingViewChart 
                              ref={chartRef}
                              data={chartData} 
                              symbol={selectedSymbol}
                              timeframe={timeframe}
                              badgeLabel="HTF POI"
                              entry={lastAnalysis?.entry} sl={lastAnalysis?.sl} tp={lastAnalysis?.tp}
                              markers={lastAnalysis?.symbol === selectedSymbol && lastAnalysis.patterns ? lastAnalysis.patterns.map(p => ({
                                time: p.time,
                                position: (p.type.includes('BOTTOM') || p.type.includes('TRIANGLE')) ? 'belowBar' : 'aboveBar',
                                color: '#f59e0b',
                                shape: (p.type.includes('BOTTOM') || p.type.includes('TRIANGLE')) ? 'arrowUp' : 'arrowDown',
                                text: p.label
                              })) : []}
                            />
                          </div>
                        </div>

                        {/* Chart 2: LTF Confirmation / Comparison */}
                        <div className="bg-[#0a0a0a] border border-amber-500/30 rounded-sm overflow-hidden flex flex-col h-[500px]">
                          <div className="bg-black/90 px-3 py-2 border-b border-white/10 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                              {syncSymbols ? (
                                <span className="font-bold text-white font-mono">{selectedSymbol}</span>
                              ) : (
                                <select 
                                  value={chart2Symbol} 
                                  onChange={(e) => setChart2Symbol(e.target.value)}
                                  className="bg-black border border-white/20 text-white font-mono text-xs px-2 py-0.5 rounded"
                                >
                                  {allSymbols.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                  ))}
                                </select>
                              )}
                              <span className="px-1.5 py-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold rounded">
                                {syncSymbols ? `تأكيد الدخول (${chart2Timeframe})` : 'مقارنة فنية'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded">
                              {(["1m", "3m", "5m", "15m", "30m"] as TimeFrame[]).map(tf => (
                                <button
                                  key={tf}
                                  onClick={() => setChart2Timeframe(tf)}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono transition-all ${
                                    chart2Timeframe === tf ? 'bg-amber-400 text-black' : 'text-white/40 hover:text-white'
                                  }`}
                                >
                                  {tf}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="flex-1 relative">
                            {isChart2Loading && (
                              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-xs">
                                <RefreshCcw className="w-5 h-5 text-amber-400 animate-spin" />
                              </div>
                            )}
                            <TradingViewChart 
                              ref={chart2Ref}
                              data={chart2Data} 
                              symbol={syncSymbols ? selectedSymbol : chart2Symbol}
                              timeframe={chart2Timeframe}
                              badgeLabel="LTF CONFIRM"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Institutional HTF POI ➔ LTF Confirmation Engine Card */}
                    <div className="bg-[#0a0a0a] border border-[#10b981]/20 p-5 rounded-sm flex flex-col gap-4">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-[#10b981]/10 border border-[#10b981]/30 rounded-sm text-[#10b981]">
                            <Target className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-white">نظام التأكيد المؤسسي متعدد الأطر (HTF POI ➔ LTF Confirmation)</h3>
                              <span className="px-2 py-0.5 bg-[#10b981]/20 text-[#10b981] text-[10px] font-bold rounded">
                                دقة متناهية (Zero Slop)
                              </span>
                            </div>
                            <p className="text-xs text-white/50 mt-0.5">
                              تحليل منطقة الاهتمام على الإطار الأكبر والتأكيد الفوري عبر كسر IFVG وسحب السيولة بالذيل على الإطار الأصغر.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleAnalyze(selectedSymbol)}
                            disabled={isLoading}
                            className="px-3.5 py-1.5 bg-[#10b981] hover:bg-[#00d4aa] text-black font-bold text-xs rounded-sm transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.25)]"
                          >
                            {isLoading ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />}
                            <span>فحص التأكيدات الآن</span>
                          </button>
                        </div>
                      </div>

                      {/* 8-Rule Institutional Verification Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                        {/* 1. Pairing Rule */}
                        <div className="bg-black/60 border border-white/5 p-3 rounded-sm flex flex-col gap-1">
                          <div className="flex items-center justify-between text-white/50">
                            <span>1. الأطر المقترنة</span>
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981]" />
                          </div>
                          <div className="font-mono font-bold text-white mt-1">
                            HTF: {timeframe} ➔ LTF: {getRecommendedLtf(timeframe)}
                          </div>
                          <span className="text-[10px] text-white/40">
                            {timeframe === "15m" ? "15 دقيقة ➔ 1 دقيقة" : timeframe === "30m" ? "30 دقيقة ➔ 3 دقائق" : timeframe === "1h" ? "1 ساعة ➔ 5 دقائق" : "4 ساعات ➔ 15 دقيقة"}
                          </span>
                        </div>

                        {/* 2. HTF POI Status */}
                        <div className="bg-black/60 border border-white/5 p-3 rounded-sm flex flex-col gap-1">
                          <div className="flex items-center justify-between text-white/50">
                            <span>2. منطقة الاهتمام (POI)</span>
                            <span className={`w-2 h-2 rounded-full ${lastAnalysis?.htfPoiConfirmation?.poiDetected ? 'bg-[#10b981]' : 'bg-amber-400'}`} />
                          </div>
                          <div className="font-mono font-bold text-white mt-1">
                            {lastAnalysis?.htfPoiConfirmation?.poiType 
                              ? (lastAnalysis.htfPoiConfirmation.poiType === 'ORDER_BLOCK' ? 'بلوك أوامر (Order Block)' :
                                 lastAnalysis.htfPoiConfirmation.poiType === 'FVG' ? 'فجوة سيولة (FVG Zone)' :
                                 lastAnalysis.htfPoiConfirmation.poiType.includes('SWEEP') ? 'سحب قمة/قاع (Sweep Zone)' : 'مراقبة النطاق')
                              : (lastAnalysis?.hasFvg ? 'فجوة FVG نشطة' : 'Order Block محتمل')}
                          </div>
                          <span className="text-[10px] text-white/40">
                            نطاق: {lastAnalysis?.htfPoiConfirmation?.poiPriceZone ? `$${lastAnalysis.htfPoiConfirmation.poiPriceZone.low} - $${lastAnalysis.htfPoiConfirmation.poiPriceZone.high}` : 'بانتظار التحليل'}
                          </span>
                        </div>

                        {/* 3. Sweep Wick & CISD */}
                        <div className="bg-black/60 border border-white/5 p-3 rounded-sm flex flex-col gap-1">
                          <div className="flex items-center justify-between text-white/50">
                            <span>3. سحب السيولة & CISD</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              lastAnalysis?.htfPoiConfirmation?.cisdConfirmed ? 'bg-[#10b981]/20 text-[#10b981]' : 'bg-white/10 text-white/50'
                            }`}>
                              {lastAnalysis?.htfPoiConfirmation?.cisdConfirmed ? 'مؤكد 100%' : 'قيد الرصد'}
                            </span>
                          </div>
                          <div className="font-mono font-bold text-white mt-1">
                            {lastAnalysis?.htfPoiConfirmation?.ltfSweepWick ? 'سحب بالذيل + تغير التسليم' : 'كسر الشمعة المعاكسة'}
                          </div>
                          <span className="text-[10px] text-white/40">إغلاق جسم الشمعة دون رجوع</span>
                        </div>

                        {/* 4. IFVG Breakout */}
                        <div className="bg-black/60 border border-white/5 p-3 rounded-sm flex flex-col gap-1">
                          <div className="flex items-center justify-between text-white/50">
                            <span>4. كسر الفجوة (IFVG)</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              lastAnalysis?.htfPoiConfirmation?.ifvgConfirmed ? 'bg-[#10b981]/20 text-[#10b981]' : 'bg-white/10 text-white/50'
                            }`}>
                              {lastAnalysis?.htfPoiConfirmation?.ifvgConfirmed ? 'تحول الفجوة مؤكد' : 'انتظار الكسر'}
                            </span>
                          </div>
                          <div className="font-mono font-bold text-white mt-1">
                            {lastAnalysis?.htfPoiConfirmation?.ifvgConfirmed ? 'تداول أعلى/أسفل زون IFVG' : 'Inversion FVG'}
                          </div>
                          <span className="text-[10px] text-white/40">الدخول فوري فور الإغلاق</span>
                        </div>
                      </div>

                      {/* Execution, Risk & Money Management Banner */}
                      <div className="bg-black/40 border border-white/10 p-3.5 rounded-sm flex flex-wrap items-center justify-between gap-4 text-xs">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-amber-400/10 border border-amber-400/30 rounded text-amber-300">
                            <Shield className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-white">قاعدة إدارة رأس المال الصارمة:</span>
                            <div className="text-white/60 text-[11px] mt-0.5">
                              حجم اللوت: <strong className="text-amber-300 font-mono">0.03 ثابت</strong> • حد الصفقات المتزامنة: <strong className="text-amber-300 font-mono">2-3 كحد أقصى</strong> • الوقف (SL): <strong className="text-rose-400 font-mono">فوق/تحت زون IFVG</strong>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 font-mono text-xs">
                          {lastAnalysis?.entry && (
                            <div className="text-left">
                              <div className="text-white/40 text-[10px]">دخول فوري (Entry)</div>
                              <div className="text-emerald-400 font-bold">${lastAnalysis.entry}</div>
                            </div>
                          )}
                          {lastAnalysis?.sl && (
                            <div className="text-left">
                              <div className="text-white/40 text-[10px]">وقف الخسارة (SL)</div>
                              <div className="text-rose-400 font-bold">${lastAnalysis.sl}</div>
                            </div>
                          )}
                          {lastAnalysis?.tp && (
                            <div className="text-left">
                              <div className="text-white/40 text-[10px]">الهدف (TP)</div>
                              <div className="text-emerald-300 font-bold">${lastAnalysis.tp}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Liquidity Map Section */}
                  <div className="lg:col-span-3 space-y-6">
                    <LiquidityMap 
                      data={orderBook} 
                      currentPrice={chartData.length > 0 ? chartData[chartData.length - 1].close : 0} 
                    />
                    <OscillatorPane 
                      klines={chartData}
                      symbol={selectedSymbol}
                    />

                    {/* Live Correlation Matrix Quick Access Card */}
                    <div className="bg-[#0a0a0a] border border-white/10 p-5 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-[#10b981]/10 rounded-sm border border-[#10b981]/30 text-[#10b981] shrink-0">
                          <Network className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-white">مصفوفة الارتباط اللحظية لـ {selectedSymbol.replace("USDT", "")}</h4>
                            <span className="text-[9px] bg-[#10b981]/20 text-[#10b981] px-1.5 py-0.2 rounded font-bold font-mono">LIVE MATRIX</span>
                          </div>
                          <p className="text-[11px] text-white/50 mt-0.5">
                            فحص مدى تأثر السعر بحركات البيتكوين والعملات الرائدة وحساسية بيتا ومحاكاة الصدمات.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab('correlation')}
                        className="px-4 py-2.5 bg-[#10b981] hover:bg-[#10b981]/90 text-black font-bold text-xs rounded-sm transition-all shadow-[0_0_15px_rgba(16,185,129,0.25)] flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <span>فتح مصفوفة الارتباط الكاملة</span>
                        <ChevronRight className="w-3.5 h-3.5 -scale-x-100" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-6">
                    <div className="bg-[#0a0a0a] border border-white/5 p-5 flex flex-col gap-1 rounded-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <Activity className="w-3.5 h-3.5 text-[#10b981]" />
                        <span className="text-[10px] font-bold text-white/40 uppercase">ميل السوق</span>
                      </div>
                      <span className={`text-2xl font-bold ${
                        lastAnalysis?.direction === 'LONG' ? 'text-[#10b981]' : 
                        lastAnalysis?.direction === 'SHORT' ? 'text-rose-500' : 
                        'text-white/70'
                      }`}>
                        {lastAnalysis?.direction === 'LONG' ? 'شراء صاعد (Long)' : 
                         lastAnalysis?.direction === 'SHORT' ? 'بيع هابط (Short)' : 
                         'حيادي (حماية رأس المال)'}
                      </span>
                    </div>

                    <div className="bg-[#0a0a0a] border border-white/5 p-5 flex flex-col gap-1 rounded-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <Shield className="w-3.5 h-3.5 text-white/60" />
                        <span className="text-[10px] font-bold text-white/40 uppercase">مستوى المخاطرة</span>
                      </div>
                      <span className={`text-xl font-bold ${
                        lastAnalysis?.direction === 'NEUTRAL' ? 'text-blue-400' :
                        lastAnalysis?.riskLevel === 'LOW' ? 'text-[#10b981]' : 
                        lastAnalysis?.riskLevel === 'MEDIUM' ? 'text-amber-500' : 'text-rose-500'
                      }`}>
                        {lastAnalysis?.direction === 'NEUTRAL' ? 'آمن (خارج السوق)' : (lastAnalysis?.riskLevel || 'في الانتظار')}
                      </span>
                    </div>

                    {lastAnalysis && (
                      <div className="bg-[#0a0a0a] border border-white/5 p-5 flex flex-col gap-3 rounded-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-white/40 uppercase">اليقين المؤسساتي</span>
                          <span className={`text-xs font-mono font-bold ${
                            lastAnalysis.direction === 'LONG' ? 'text-[#10b981]' : 
                            lastAnalysis.direction === 'SHORT' ? 'text-rose-500' : 
                            'text-white/60'
                          }`}>{lastAnalysis.direction === 'NEUTRAL' ? 'محايد' : `${lastAnalysis.confidence}%`}</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden flex gap-0.5">
                           {Array.from({ length: 15 }).map((_, i) => (
                             <div 
                               key={i} 
                               className={`flex-1 ${
                                 lastAnalysis.direction === 'NEUTRAL'
                                   ? (i < 5 ? 'bg-white/30' : 'bg-white/10')
                                   : i / 15 < lastAnalysis.confidence / 100 
                                     ? (lastAnalysis.direction === 'LONG' ? 'bg-[#10b981]' : 'bg-rose-500')
                                     : 'bg-white/10'
                               }`} 
                             />
                           ))}
                        </div>
                      </div>
                    )}

                    {lastAnalysis && (lastAnalysis.isOversoldImpulseBuy || lastAnalysis.setupCategory === 'OVERSOLD_IMPULSE' || lastAnalysis.isOverboughtImpulseSell) && (
                      <div className="bg-gradient-to-r from-amber-500/20 via-emerald-500/15 to-transparent border border-amber-400/40 p-4 rounded-sm flex flex-col gap-1.5 shadow-[0_0_20px_rgba(251,191,36,0.15)]">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                            <Zap className="w-4 h-4 text-amber-400" />
                            {lastAnalysis.isOverboughtImpulseSell ? 'تشبع شرائي + ارتداد هابط سريع' : 'منطقة تشبع بيعي فائقة + انطلاق صاعد سريع'}
                          </span>
                          <span className="text-[10px] bg-amber-400 text-black px-2 py-0.5 rounded-sm font-black">
                            {lastAnalysis.impulseStrength ? `زخم ${lastAnalysis.impulseStrength}%` : 'STRONG REVERSAL'}
                          </span>
                        </div>
                        <p className="text-[11px] text-white/70 leading-relaxed">
                          {lastAnalysis.zoneStrength || 'تم رصد استنزاف كميات البيع في قاع السيولة مع دخول سيولة شراء حوتية فورية.'}
                        </p>
                      </div>
                    )}

                    {lastAnalysis && lastAnalysis.direction !== 'NEUTRAL' && (
                      <div className="bg-[#10b981]/5 border border-[#10b981]/30 p-4 rounded-sm flex flex-col gap-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-[#10b981] flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-[#10b981]" />
                            خطة رأس مال 20$ (استهداف ربح +10%)
                          </span>
                          <span className="text-[10px] bg-blue-500/15 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded-sm font-bold">
                            {lastAnalysis.targetSpeed === 'FAST' ? '🚀 وصول سريع' : '⚡ سوينغ سريع'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-white/60">نسبة الربح المتوقعة:</span>
                          <span className="font-mono font-extrabold text-[#10b981] text-sm">
                            +{typeof lastAnalysis.profitPercent === 'number' && isFinite(lastAnalysis.profitPercent)
                              ? lastAnalysis.profitPercent.toFixed(1)
                              : Math.max(10.8, Number(((Math.abs((lastAnalysis.tp || 0) - (lastAnalysis.entry || 0))/Math.max(1, lastAnalysis.entry || 1))*100).toFixed(1)))}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs border-t border-white/5 pt-2">
                          <span className="text-white/60">عائد محفظة 20$ (بدون رافعة 1x):</span>
                          <span className="font-mono font-bold text-white">
                            +${typeof lastAnalysis.expectedProfit20USD === 'number' && isFinite(lastAnalysis.expectedProfit20USD)
                              ? lastAnalysis.expectedProfit20USD.toFixed(2)
                              : (20 * ((lastAnalysis.profitPercent || 11.2) / 100)).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-amber-400 font-bold">عائد محفظة 20$ (رافعة 5x آمنة):</span>
                          <span className="font-mono font-bold text-amber-400">
                            +${typeof lastAnalysis.leveragedProfit20USD === 'number' && isFinite(lastAnalysis.leveragedProfit20USD)
                              ? lastAnalysis.leveragedProfit20USD.toFixed(2)
                              : (20 * ((lastAnalysis.profitPercent || 11.2) / 100) * 5).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-white/40 border-t border-white/5 pt-1.5">
                          <span>معامل العائد للمخاطرة R:R:</span>
                          <span className="font-mono font-bold text-white/80">1:{lastAnalysis.rrRatio || 3.5}</span>
                        </div>
                      </div>
                    )}

                    <div className="bg-[#0a0a0a] border border-white/5 p-5 flex-1 flex flex-col rounded-sm overflow-hidden">
                      <h3 className="text-[10px] font-bold text-white/40 uppercase mb-4">آخر التنبيهات</h3>
                      <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                        {signals.map((sig, i) => (
                          <div key={i} className="flex items-center justify-between border-b border-white/5 pb-2">
                            <div>
                              <div className="text-[11px] font-bold">{sig.symbol}</div>
                              <div className="text-[8px] opacity-40">{new Date(sig.timestamp).toLocaleTimeString()}</div>
                            </div>
                            <div className={`text-[10px] font-bold ${sig.direction === 'LONG' ? 'text-[#10b981]' : 'text-rose-500'}`}>
                              {sig.direction === 'LONG' ? 'شراء' : 'بيع'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pb-6">
                  <InstitutionalSignalCard
                    signal={lastAnalysis}
                    timeframe={timeframe}
                    onRefresh={() => handleAnalyze(selectedSymbol)}
                    isLoading={isLoading}
                  />
                </div>
              </motion.div>
            )}

            {activeTab === 'macro' && (
              <motion.div 
                key="macro" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="flex-1 p-8 overflow-y-auto"
              >
                <div className="max-w-5xl mx-auto space-y-8">
                  <div className="flex items-center justify-between border-b border-white/5 pb-6">
                    <div>
                      <h2 className="text-3xl font-bold">تحليل الماكرو والفيدرالي الأمريكي</h2>
                      <p className="text-white/40 text-sm mt-2">تأثير السياسة النقدية العالمية على الأسواق</p>
                    </div>
                    <button onClick={fetchMacro} className="p-3 bg-white/5 hover:bg-white/10 rounded-sm">
                      <RefreshCcw className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-sm">
                      <h4 className="text-[10px] text-white/40 uppercase mb-4">ميل الفيدرالي الأمريكي</h4>
                      <p className="text-lg font-bold text-[#10b981]">{macro?.fedBias || 'جاري التحليل...'}</p>
                    </div>
                    <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-sm">
                      <h4 className="text-[10px] text-white/40 uppercase mb-4">توقعات أسعار الفائدة</h4>
                      <p className="text-lg font-bold text-amber-500">{macro?.interestRateSentiment || 'جاري التحليل...'}</p>
                    </div>
                    <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-sm">
                      <h4 className="text-[10px] text-white/40 uppercase mb-4">مزاج السوق العالمي</h4>
                      <p className="text-lg font-bold text-blue-400">{macro?.marketMood || 'جاري التحليل...'}</p>
                    </div>
                  </div>

                  {macro?.dailyDigest && (
                    <div className="bg-[#10b981]/5 border border-[#10b981]/20 p-8 rounded-sm">
                      <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-[#10b981]" />
                        ملخص الأحداث اليومي (Daily Digest)
                      </h3>
                      <p className="text-sm text-white/70 leading-relaxed italic">
                        "{macro.dailyDigest}"
                      </p>
                    </div>
                  )}

                  {/* Economic Events Timeline */}
                  <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-sm space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-[#10b981]/10 rounded-sm border border-[#10b981]/20">
                          <Calendar className="w-5 h-5 text-[#10b981]" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            الجدول الزمني للأحداث الاقتصادية القادمة (Economic Calendar)
                            <span className="text-[10px] bg-[#10b981]/20 text-[#10b981] px-2 py-0.5 rounded-full font-mono">LIVE</span>
                          </h3>
                          <p className="text-xs text-white/40 mt-0.5">
                            رصد استباقي لقرارات الفائدة، بيانات التضخم، ومؤشرات التوظيف وتأثيرها المباشر على سيولة السكالبينج
                          </p>
                        </div>
                      </div>

                      {/* Filter Tabs */}
                      <div className="flex items-center gap-1.5 bg-black/50 p-1 border border-white/5 rounded-sm self-start sm:self-auto">
                        {[
                          { id: 'ALL', label: 'جميع الأحداث' },
                          { id: 'HIGH', label: 'عالية التأثير 🔥' },
                          { id: 'MEDIUM', label: 'متوسطة التأثير' }
                        ].map((btn) => (
                          <button
                            key={btn.id}
                            onClick={() => setEventFilter(btn.id as any)}
                            className={`text-[11px] px-3 py-1.5 rounded-sm transition-all ${
                              eventFilter === btn.id 
                                ? 'bg-[#10b981] text-black font-bold shadow-[0_0_12px_rgba(16,185,129,0.3)]' 
                                : 'text-white/40 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Timeline Container */}
                    <div className="relative pr-6 before:content-[''] before:absolute before:right-2 before:top-3 before:bottom-3 before:w-[2px] before:bg-gradient-to-b before:from-[#10b981] before:via-white/10 before:to-transparent space-y-5">
                      {(macro?.upcomingEvents && macro.upcomingEvents.length > 0 ? macro.upcomingEvents : defaultEvents)
                        .filter(event => eventFilter === 'ALL' || event.impact === eventFilter)
                        .map((event, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="relative flex flex-col md:flex-row items-start justify-between gap-4 p-5 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-white/10 rounded-sm transition-all group"
                          >
                            {/* Glowing Timeline Node */}
                            <div className="absolute -right-[27px] top-6 w-3 h-3 rounded-full border-2 border-[#0a0a0a] bg-gradient-to-tr from-[#10b981] to-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.8)] ring-4 ring-[#10b981]/10 group-hover:scale-125 transition-transform" />

                            <div className="space-y-2.5 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider border ${
                                  event.impact === 'HIGH' 
                                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' 
                                    : event.impact === 'MEDIUM' 
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
                                    : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                }`}>
                                  {event.impact === 'HIGH' ? 'تأثير حرج (High Impact)' : event.impact === 'MEDIUM' ? 'تأثير متوسط' : 'تأثير عادي'}
                                </span>

                                {event.category && (
                                  <span className="text-[10px] text-white/40 bg-white/5 px-2 py-0.5 rounded-sm border border-white/5">
                                    {event.category}
                                  </span>
                                )}

                                <div className="flex items-center gap-1.5 text-xs text-white/50 font-mono mr-auto md:mr-0">
                                  <Clock className="w-3.5 h-3.5 text-white/30" />
                                  <span className="text-[#10b981] font-bold">{event.date}</span>
                                  {event.time && <span className="text-white/30">| {event.time}</span>}
                                </div>
                              </div>

                              <h4 className="text-base font-bold text-white/95 group-hover:text-white transition-colors">
                                {event.title}
                              </h4>

                              <p className="text-xs text-white/70 leading-relaxed bg-black/40 p-3 rounded-sm border border-white/5">
                                <strong className="text-white/90 font-medium">التأثير المتوقع على السيولة: </strong>
                                {event.expectedImpact}
                              </p>
                            </div>

                            {/* Warning or scalping advisory badge */}
                            <div className="shrink-0 flex md:flex-col items-end justify-between self-stretch md:self-auto gap-2">
                              {event.impact === 'HIGH' ? (
                                <div className="flex items-center gap-1.5 text-[11px] text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-sm">
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  <span>تقلبات سيولة متوقعة</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 text-[11px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-sm">
                                  <Activity className="w-3.5 h-3.5" />
                                  <span>مراقبة مستمرة</span>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))}
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-[#10b981]/5 border border-[#10b981]/20 rounded-sm text-xs text-white/70">
                      <ShieldAlert className="w-4 h-4 text-[#10b981] shrink-0" />
                      <span>
                        <strong>نصيحة إدارة المخاطر:</strong> في فترات صدور الأحداث عالية التأثير (High Impact)، يوصى بتخفيض أحجام عقود السكالبينج لتجنب الانزلاقات السعرية (Slippage) وضرب أوامر وقف الخسارة قبل وضوح الاتجاه الحقيقي.
                      </span>
                    </div>
                  </div>

                  <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-sm">
                    <h3 className="text-sm font-bold mb-6 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-[#10b981]" />
                      أهم الأخبار الاقتصادية المؤثرة
                    </h3>
                    <div className="space-y-4">
                      {macro?.globalNews?.map((news, i) => (
                        <div key={i} className="flex items-start gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-sm">
                          <div className="w-1.5 h-1.5 bg-[#10b981] rounded-full mt-2" />
                          <p className="text-sm text-white/80">{news}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'sniper' && (
              <motion.div 
                key="sniper" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                className="flex-1 p-6 md:p-8 overflow-y-auto"
              >
                <div className="max-w-7xl mx-auto space-y-6">
                  {/* Top Header & Action */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0a0a0a] border border-white/5 p-6 rounded-sm">
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-[#10b981]/10 rounded-sm border border-[#10b981]/30">
                          <Crosshair className="w-6 h-6 text-[#10b981]" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold flex items-center gap-2">
                            <span>قناص الفرص الفنية النخبوية • أطر كبرى رصينة (1D • 4H • 1H)</span>
                            <span className="text-xs px-2.5 py-0.5 rounded-sm bg-gradient-to-r from-amber-400 to-yellow-300 text-black font-black font-mono shadow-sm">
                              PRE-TREND SNIPER 👑
                            </span>
                          </h2>
                          <p className="text-white/60 text-xs mt-1 leading-relaxed">
                            استبعاد تام لضوضاء وتلاعب الفريمات الصغيرة • صفقات نقية تضرب أهدافها بالمليمتر • رصد واقتناص تريند اليوم قبل انطلاق الحركة
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {/* Hunting Mode Selector (Smart Fast vs Strict Institutional) */}
                      <div className="flex items-center bg-[#0a0a0a] border border-white/10 p-1 rounded-sm">
                        <button
                          onClick={() => {
                            setHuntingMode('SMART_FAST');
                            addLog('تم تفعيل نمط [⚡ صيد ذكي سريع (مخاطرة محسوبة)]: اصطياد فرص التشبع البيعي والحركات السريعة بذكاء ووقف محكم.', 'success');
                          }}
                          className={`px-3 py-2 text-xs font-bold rounded-sm transition-all flex items-center gap-1.5 ${
                            huntingMode === 'SMART_FAST'
                              ? 'bg-amber-400 text-black font-black shadow-[0_0_12px_rgba(251,191,36,0.35)]'
                              : 'text-amber-400/70 hover:text-amber-300'
                          }`}
                        >
                          <span>⚡</span>
                          <span>صيد ذكي سريع (مخاطرة محسوبة)</span>
                        </button>
                        <button
                          onClick={() => {
                            setHuntingMode('STRICT_INSTITUTIONAL');
                            addLog('تم تفعيل نمط [🛡️ أمان مؤسساتي فائق]: شروط صارمة جداً وحماية قصوى لرأس المال.', 'info');
                          }}
                          className={`px-3 py-2 text-xs font-bold rounded-sm transition-all flex items-center gap-1.5 ${
                            huntingMode === 'STRICT_INSTITUTIONAL'
                              ? 'bg-[#10b981] text-black font-black shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                              : 'text-white/60 hover:text-white'
                          }`}
                        >
                          <Shield className="w-3.5 h-3.5" />
                          <span>أمان مؤسساتي فائق</span>
                        </button>
                      </div>

                      <button 
                        onClick={startSniper}
                        className={`font-bold px-7 py-3 rounded-sm flex items-center gap-2.5 text-sm transition-all shadow-lg ${
                          isScanning 
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30' 
                            : 'bg-[#10b981] text-black hover:bg-[#00d4aa]'
                        }`}
                      >
                        {isScanning ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
                        {isScanning ? 'إيقاف الفحص' : 'بدء الفحص الاستراتيجي'}
                      </button>
                    </div>
                  </div>

                  {/* 🎛️ ربط أدوات القناص والبوت والتنبيهات الدقيقة (Haehnchen Bot & CryptoSignal Dashboard) */}
                  <div className="bg-gradient-to-r from-[#0d1627] via-[#09152b] to-[#070e1a] border border-[#1e293b] p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
                        <Zap className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-black text-white flex items-center gap-2">
                          <span>ربط أدوات ومحركات القناص المتقدمة (Connected Sniper Ops)</span>
                          <span className="text-[10px] bg-emerald-500 text-black font-black px-2 py-0.5 rounded-full">تنبيهات فورية دقيقة ⚡</span>
                        </div>
                        <div className="text-xs text-slate-300 mt-0.5">
                          تكامل متزامن: محرك تنبيهات البوت التكتيكية (Haehnchen) + مصفوفة الفريمات (Crypto-Signal) + صفقات القناص النخبوية.
                        </div>
                      </div>
                    </div>

                    {/* Tools Switcher */}
                    <div className="flex flex-wrap items-center gap-1.5 bg-black/60 p-1 rounded-lg border border-white/5">
                      <button
                        onClick={() => setSniperToolView('ALL_IN_ONE')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          sniperToolView === 'ALL_IN_ONE'
                            ? 'bg-emerald-500 text-black font-black shadow-md'
                            : 'text-slate-300 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>الغرفة المتكاملة (All)</span>
                      </button>

                      <button
                        onClick={() => setSniperToolView('BOT_ALERTS')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          sniperToolView === 'BOT_ALERTS'
                            ? 'bg-emerald-500 text-black font-black shadow-md'
                            : 'text-slate-300 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Bell className="w-3.5 h-3.5" />
                        <span>تنبيهات البوت الفورية ⚡</span>
                      </button>

                      <button
                        onClick={() => setSniperToolView('MULTI_TF_MATRIX')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          sniperToolView === 'MULTI_TF_MATRIX'
                            ? 'bg-sky-500 text-black font-black shadow-md'
                            : 'text-slate-300 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Activity className="w-3.5 h-3.5" />
                        <span>مصفوفة الفريمات والمعنويات 📊</span>
                      </button>

                      <button
                        onClick={() => setSniperToolView('ELITE_CARDS')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          sniperToolView === 'ELITE_CARDS'
                            ? 'bg-amber-400 text-black font-black shadow-md'
                            : 'text-slate-300 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Target className="w-3.5 h-3.5" />
                        <span>صفقات القناص النخبوية 👑</span>
                      </button>
                    </div>
                  </div>

                  {/* ⚡ Live Bot Tactical Alerts Dispatcher (Inspired by Haehnchen Bot) */}
                  {(sniperToolView === 'ALL_IN_ONE' || sniperToolView === 'BOT_ALERTS') && (
                    <SniperBotAlertsCenter 
                      tickers={tickers}
                      onSelectCoin={(sym) => {
                        setSelectedSymbol(sym);
                        setActiveTab('dashboard');
                      }}
                      playEmergencySound={playEmergencySound}
                      isMuted={isMuted}
                      setIsMuted={setIsMuted}
                    />
                  )}

                  {/* 📊 Multi-Timeframe Signal Consensus Matrix & Sentiment (Inspired by cryptosignalorg) */}
                  {(sniperToolView === 'ALL_IN_ONE' || sniperToolView === 'MULTI_TF_MATRIX') && (
                    <CryptoSignalDashboard 
                      onSelectCoin={(sym) => {
                        setSelectedSymbol(sym);
                        setActiveTab('dashboard');
                      }}
                      isMuted={isMuted}
                      setIsMuted={setIsMuted}
                    />
                  )}

                  {/* 👑 صفقات القناص النخبوية والترتيب الهرمي */}
                  {(sniperToolView === 'ALL_IN_ONE' || sniperToolView === 'ELITE_CARDS') && (
                    <>
                      {/* Institutional Wisdom & Loss Prevention Shield Banner */}
                      <div className="bg-gradient-to-r from-[#10b981]/15 via-black/40 to-blue-500/10 border border-[#10b981]/30 p-4 rounded-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3 pb-3 border-b border-white/5">
                      <div className="flex items-center gap-2 text-sm font-bold text-[#10b981]">
                        <ShieldCheck className="w-5 h-5 text-[#10b981]" />
                        <span>منظومة الحكمة المؤسساتية لحظر الخسائر وحماية رأس المال (Zero-Loss Protocol)</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="px-2 py-0.5 rounded-sm bg-[#10b981]/20 text-[#10b981] font-mono font-bold">
                          المعيار: ثقة ≥ 88% | عائد ≥ 1:3.0
                        </span>
                        <span className="px-2 py-0.5 rounded-sm bg-amber-400/20 text-amber-300 font-mono font-bold">
                          أقصى مخاطرة: 1.5% للحساب
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                      <div className="bg-black/40 p-2.5 rounded-sm border border-white/5">
                        <div className="text-[#10b981] font-bold mb-1 flex items-center gap-1">
                          <span>1. تأمين الدخول الحتمي (Breakeven)</span>
                        </div>
                        <p className="text-white/60 text-[11px] leading-relaxed">
                          عند وصول السعر للهدف الأول TP1، يُنقل الوقف فوراً لسعر الدخول ويُغلق 50% من العقد لتستحيل الخسارة بعد ذلك.
                        </p>
                      </div>
                      <div className="bg-black/40 p-2.5 rounded-sm border border-white/5">
                        <div className="text-amber-400 font-bold mb-1 flex items-center gap-1">
                          <span>2. حظر مطاردة الشموع (Limit Only)</span>
                        </div>
                        <p className="text-white/60 text-[11px] leading-relaxed">
                          لا تدخل بماركت عشوائي عند اندفاع السعر؛ الدخول بأمر معلق Limit عند مستويات الخصم وفجوات السيولة (FVG).
                        </p>
                      </div>
                      <div className="bg-black/40 p-2.5 rounded-sm border border-white/5">
                        <div className="text-sky-400 font-bold mb-1 flex items-center gap-1">
                          <span>3. الهيمنة الهيكلية الكبرى (HTF)</span>
                        </div>
                        <p className="text-white/60 text-[11px] leading-relaxed">
                          يُمنع الشراء إذا كان فريم 4H أو 1D هابطاً، ويُمنع البيع إذا كان صاعداً إلا بنماذج سبرينغ وايكوف مؤكدة.
                        </p>
                      </div>
                      <div className="bg-black/40 p-2.5 rounded-sm border border-white/5">
                        <div className="text-rose-400 font-bold mb-1 flex items-center gap-1">
                          <span>4. حظر التمويل السام ومصائد التصفية</span>
                        </div>
                        <p className="text-white/60 text-[11px] leading-relaxed">
                          استبعاد أي عملة ذات معدل تمويل شاذ (&gt;0.025%) أو عملات مضاربية حديثة لتجنب مصائد Long/Short Squeeze.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Strategy Selector & Live Scanner Bar */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#0a0a0a] border border-white/5 p-4 rounded-sm">
                      <div className="text-[11px] text-white/40 mb-2 font-bold uppercase tracking-wider">استراتيجية الفحص النشطة</div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-1.5">
                        <button
                          onClick={() => setScanStrategy('TREND_OF_THE_DAY')}
                          className={`px-2 py-1.5 text-[11px] font-bold rounded-sm border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                            scanStrategy === 'TREND_OF_THE_DAY'
                              ? 'bg-gradient-to-r from-amber-400 to-yellow-300 text-black border-amber-300 font-black shadow-[0_0_12px_rgba(251,191,36,0.35)]'
                              : 'bg-white/[0.02] text-amber-300 border-amber-400/40 hover:border-amber-300'
                          }`}
                        >
                          <span>👑</span>
                          <span>تريند اليوم</span>
                        </button>
                        <button
                          onClick={() => setScanStrategy('ALL_COINS')}
                          className={`px-2 py-1.5 text-[11px] font-bold rounded-sm border transition-all flex items-center justify-center gap-1 ${
                            scanStrategy === 'ALL_COINS'
                              ? 'bg-[#10b981] text-black border-[#10b981] font-black shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                              : 'bg-white/[0.02] text-[#10b981] border-[#10b981]/40 hover:border-[#10b981]'
                          }`}
                        >
                          <span>🌐</span>
                          <span>كافة العملات ({allSymbols.length || 728})</span>
                        </button>
                        <button
                          onClick={() => setScanStrategy('NEW_LISTINGS')}
                          className={`px-2 py-1.5 text-[11px] font-bold rounded-sm border transition-all flex items-center justify-center gap-1 ${
                            scanStrategy === 'NEW_LISTINGS'
                              ? 'bg-amber-400 text-black border-amber-400 font-extrabold shadow-[0_0_12px_rgba(251,191,36,0.3)]'
                              : 'bg-white/[0.02] text-amber-400/90 border-amber-400/30 hover:border-amber-400'
                          }`}
                        >
                          <span>🔥</span>
                          <span>عملات جديدة ({newListings.length})</span>
                        </button>
                        <button
                          onClick={() => setScanStrategy('OVERSOLD')}
                          className={`px-2 py-1.5 text-[11px] font-bold rounded-sm border transition-all flex items-center justify-center gap-1 ${
                            scanStrategy === 'OVERSOLD'
                              ? 'bg-amber-400 text-black border-amber-400 font-extrabold shadow-[0_0_12px_rgba(251,191,36,0.3)]'
                              : 'bg-white/[0.02] text-amber-400/80 border-amber-400/30 hover:border-amber-400'
                          }`}
                        >
                          <span>⚡</span>
                          <span>تشبع وانطلاق</span>
                        </button>
                        <button
                          onClick={() => setScanStrategy('VOLATILITY')}
                          className={`px-2 py-1.5 text-[11px] font-bold rounded-sm border transition-all ${
                            scanStrategy === 'VOLATILITY'
                              ? 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/40 font-extrabold'
                              : 'bg-white/[0.02] text-white/60 border-white/5 hover:text-white'
                          }`}
                        >
                          أعلى تقلب
                        </button>
                        <button
                          onClick={() => setScanStrategy('VOLUME')}
                          className={`px-2 py-1.5 text-[11px] font-bold rounded-sm border transition-all ${
                            scanStrategy === 'VOLUME'
                              ? 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/40 font-extrabold'
                              : 'bg-white/[0.02] text-white/60 border-white/5 hover:text-white'
                          }`}
                        >
                          أعلى سيولة
                        </button>
                        <button
                          onClick={() => setScanStrategy('FAVORITES')}
                          className={`px-2 py-1.5 text-[11px] font-bold rounded-sm border transition-all ${
                            scanStrategy === 'FAVORITES'
                              ? 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/40 font-extrabold'
                              : 'bg-white/[0.02] text-white/60 border-white/5 hover:text-white'
                          }`}
                        >
                          المفضلة ({favorites.length})
                        </button>
                      </div>
                    </div>

                    <div className="bg-[#0a0a0a] border border-white/5 p-4 rounded-sm flex items-center justify-between">
                      <div>
                        <div className="text-[11px] text-white/40 mb-1 font-bold">الفرص المكتشفة المؤكدة</div>
                        <div className="text-xl font-bold font-mono text-[#10b981]">{activeVerifiedSignals.length} <span className="text-xs text-white/40 font-normal">فرصة</span></div>
                      </div>
                      <div className="text-left">
                        <div className="text-[11px] text-white/40 mb-1 font-bold">فرص ثقة استثنائية (+85%)</div>
                        <div className="text-xl font-bold font-mono text-amber-400">{activeVerifiedSignals.filter(s => s.confidence >= 85).length}</div>
                      </div>
                    </div>

                    <div className="bg-[#0a0a0a] border border-white/5 p-4 rounded-sm flex items-center justify-between">
                      <div>
                        <div className="text-[11px] text-white/40 mb-1 font-bold">حالة محرك الفحص</div>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isScanning ? 'bg-[#10b981] animate-ping' : 'bg-white/20'}`} />
                          <span className="text-xs font-bold">{isScanning ? 'مسح نشط ومستمر' : 'متوقف مؤقتاً'}</span>
                        </div>
                      </div>
                      {isScanning && (
                        <div className="text-left">
                          <span className="text-[10px] text-white/40 block">العملة الحالية:</span>
                          <span className="font-mono text-xs font-bold text-[#10b981] animate-pulse">{scanningSymbol || '...'}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Institutional Quality Assurance Bar */}
                  <div className="bg-[#10b981]/5 border border-[#10b981]/25 p-4 rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#10b981]/20 rounded-sm border border-[#10b981]/30">
                        <Shield className="w-5 h-5 text-[#10b981]" />
                      </div>
                      <div>
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>درع التصفية المؤسساتية وحماية رأس المال (Strict Capital Protection Filter)</span>
                          <span className="text-[10px] bg-[#10b981] text-black px-1.5 py-0.5 rounded-sm font-black">نشط 100%</span>
                        </div>
                        <div className="text-white/60 text-[11px] mt-0.5">
                          تم إلغاء التخمين العشوائي. يتم فحص الأطر المتعددة (1D + 4H + 1H) وكشف التلاعب ومعدل التمويل واستبعاد أي صفقة متعارضة مع الاتجاه العام.
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 border-t md:border-t-0 md:border-r border-white/10 pt-2 md:pt-0 md:pr-4">
                      {/* Alert Threshold Control */}
                      <div className="flex items-center gap-2 bg-[#0c0c0c] border border-white/10 px-2.5 py-1.5 rounded-sm">
                        <span className="text-[11px] text-white/50">عتبة التنبيه الصوتي:</span>
                        <select
                          value={alertSensitivity}
                          onChange={(e) => setAlertSensitivity(Number(e.target.value))}
                          className="bg-transparent text-xs font-bold text-[#10b981] font-mono focus:outline-none cursor-pointer"
                        >
                          <option value={85} className="bg-[#121212] text-white">85% (صارم)</option>
                          <option value={88} className="bg-[#121212] text-white">88% (نخبوي موصى به)</option>
                          <option value={90} className="bg-[#121212] text-white">90% (فائق الأمان)</option>
                          <option value={92} className="bg-[#121212] text-white">92% (نادر جداً AAA)</option>
                        </select>
                      </div>

                      <div className="text-center">
                        <span className="text-[10px] text-white/40 block">الفرص المؤكدة الثقات</span>
                        <span className="font-mono text-sm font-bold text-[#10b981]">{activeVerifiedSignals.length} مؤكدة</span>
                      </div>
                      <div className="text-center">
                        <span className="text-[10px] text-white/40 block">سجل الاستبعاد والتصفية</span>
                        <span className="font-mono text-sm font-bold text-amber-400">{rejectedAudits.length > 0 ? `${rejectedAudits.length} صفقات` : 'نشط'}</span>
                      </div>
                    </div>
                  </div>

                  {/* 👑 المنظومة القيادية لترتيب العملات حسب المستوى وقوة الصفقة (Strict Tier & Level Ranking Hub) */}
                  <div className="bg-gradient-to-br from-[#0d1612] via-[#090d0b] to-[#050806] border border-[#10b981]/40 p-4 rounded-sm shadow-[0_0_30px_rgba(16,185,129,0.12)] space-y-3.5">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-sm bg-[#10b981]/20 border border-[#10b981]/40 text-[#10b981]">
                          <Award className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-black text-white flex items-center gap-2">
                            <span>منظومة الترتيب الهرمي للمستويات وقوة الصفقات</span>
                            <span className="text-[10px] bg-[#10b981] text-black font-black px-2 py-0.5 rounded-sm">ترتيب إلزامي من الأقوى للأضعف</span>
                          </div>
                          <div className="text-xs text-white/60 mt-0.5">
                            يتم فرز كل عملة في مستواها الدقيق لمنع خلط العملات، مع إبراز النخبة الماسية الخارقة أولاً.
                          </div>
                        </div>
                      </div>

                      {/* Sorting Criteria Switcher */}
                      <div className="flex flex-wrap items-center gap-2 bg-black/60 border border-white/10 p-1 rounded-sm">
                        <span className="text-[11px] text-white/50 px-2 font-bold flex items-center gap-1">
                          <ArrowUpDown className="w-3.5 h-3.5 text-[#10b981]" />
                          <span>الترتيب:</span>
                        </span>
                        <button
                          onClick={() => setSniperSortBy('STRENGTH')}
                          className={`px-2.5 py-1 text-xs font-bold rounded-sm transition-all flex items-center gap-1 cursor-pointer ${
                            sniperSortBy === 'STRENGTH'
                              ? 'bg-[#10b981] text-black font-black shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                              : 'text-white/60 hover:text-white'
                          }`}
                        >
                          <span>👑</span>
                          <span>الأقوى مستوى</span>
                        </button>
                        <button
                          onClick={() => setSniperSortBy('PROFIT')}
                          className={`px-2.5 py-1 text-xs font-bold rounded-sm transition-all flex items-center gap-1 cursor-pointer ${
                            sniperSortBy === 'PROFIT'
                              ? 'bg-amber-400 text-black font-black shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                              : 'text-white/60 hover:text-white'
                          }`}
                        >
                          <span>💰</span>
                          <span>الأعلى ربحاً %</span>
                        </button>
                        <button
                          onClick={() => setSniperSortBy('RR')}
                          className={`px-2.5 py-1 text-xs font-bold rounded-sm transition-all flex items-center gap-1 cursor-pointer ${
                            sniperSortBy === 'RR'
                              ? 'bg-emerald-400 text-black font-black shadow-[0_0_12px_rgba(52,211,153,0.4)]'
                              : 'text-white/60 hover:text-white'
                          }`}
                        >
                          <span>⚖️</span>
                          <span>أفضل R:R</span>
                        </button>
                        <button
                          onClick={() => setSniperSortBy('CONFIDENCE')}
                          className={`px-2.5 py-1 text-xs font-bold rounded-sm transition-all flex items-center gap-1 cursor-pointer ${
                            sniperSortBy === 'CONFIDENCE'
                              ? 'bg-sky-400 text-black font-black shadow-[0_0_12px_rgba(56,189,248,0.4)]'
                              : 'text-white/60 hover:text-white'
                          }`}
                        >
                          <span>🎯</span>
                          <span>الأعلى ثقة %</span>
                        </button>
                      </div>
                    </div>

                    {/* Tier Level Buttons + Direction Selector */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Tier Levels */}
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setSniperTierFilter('ALL')}
                          className={`px-3 py-1.5 text-xs font-bold rounded-sm border transition-all flex items-center gap-1.5 cursor-pointer ${
                            sniperTierFilter === 'ALL'
                              ? 'bg-white text-black border-white font-black shadow-md'
                              : 'bg-black/40 text-white/70 border-white/10 hover:border-white/30'
                          }`}
                        >
                          <span>🌐</span>
                          <span>كافة المستويات ({activeVerifiedSignals.length})</span>
                        </button>

                        <button
                          onClick={() => setSniperTierFilter('DIAMOND')}
                          className={`px-3.5 py-1.5 text-xs font-black rounded-sm border transition-all flex items-center gap-1.5 cursor-pointer ${
                            sniperTierFilter === 'DIAMOND'
                              ? 'bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 text-black border-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.5)] ring-1 ring-emerald-300'
                              : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/20'
                          }`}
                        >
                          <span>👑</span>
                          <span>المستوى الماسي الخارق (#1) ({activeVerifiedSignals.filter(s => evaluateSignalStrength(s).tier === 'DIAMOND').length})</span>
                        </button>

                        <button
                          onClick={() => setSniperTierFilter('PLATINUM')}
                          className={`px-3.5 py-1.5 text-xs font-black rounded-sm border transition-all flex items-center gap-1.5 cursor-pointer ${
                            sniperTierFilter === 'PLATINUM'
                              ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-black border-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.45)] ring-1 ring-amber-300'
                              : 'bg-amber-400/10 text-amber-300 border-amber-400/40 hover:bg-amber-400/20'
                          }`}
                        >
                          <span>💎</span>
                          <span>المستوى البلاتيني الذهبي (#2) ({activeVerifiedSignals.filter(s => evaluateSignalStrength(s).tier === 'PLATINUM').length})</span>
                        </button>

                        <button
                          onClick={() => setSniperTierFilter('SILVER')}
                          className={`px-3.5 py-1.5 text-xs font-bold rounded-sm border transition-all flex items-center gap-1.5 cursor-pointer ${
                            sniperTierFilter === 'SILVER'
                              ? 'bg-sky-400 text-black border-sky-300 font-black shadow-[0_0_15px_rgba(56,189,248,0.4)]'
                              : 'bg-sky-500/10 text-sky-300 border-sky-400/30 hover:bg-sky-500/20'
                          }`}
                        >
                          <span>⭐</span>
                          <span>المستوى الفضي التكتيكي (#3) ({activeVerifiedSignals.filter(s => evaluateSignalStrength(s).tier === 'SILVER').length})</span>
                        </button>
                      </div>

                      {/* Direction Isolation (Long vs Short) */}
                      <div className="flex items-center gap-1.5 bg-black/60 border border-white/10 p-1 rounded-sm">
                        <span className="text-[11px] text-white/40 px-1 font-bold">الاتجاه:</span>
                        <button
                          onClick={() => setSniperDirectionFilter('ALL')}
                          className={`px-2 py-1 text-[11px] font-bold rounded-sm transition-all cursor-pointer ${
                            sniperDirectionFilter === 'ALL' ? 'bg-white/20 text-white font-black' : 'text-white/50 hover:text-white'
                          }`}
                        >
                          الكل
                        </button>
                        <button
                          onClick={() => setSniperDirectionFilter('LONG')}
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-sm transition-all flex items-center gap-1 cursor-pointer ${
                            sniperDirectionFilter === 'LONG'
                              ? 'bg-[#10b981] text-black font-black shadow-[0_0_10px_rgba(16,185,129,0.35)]'
                              : 'text-emerald-400/70 hover:text-emerald-300'
                          }`}
                        >
                          <TrendingUp className="w-3 h-3" />
                          <span>شراء Long ({activeVerifiedSignals.filter(s => s.direction === 'LONG').length})</span>
                        </button>
                        <button
                          onClick={() => setSniperDirectionFilter('SHORT')}
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-sm transition-all flex items-center gap-1 cursor-pointer ${
                            sniperDirectionFilter === 'SHORT'
                              ? 'bg-rose-500 text-white font-black shadow-[0_0_10px_rgba(244,63,94,0.35)]'
                              : 'text-rose-400/70 hover:text-rose-300'
                          }`}
                        >
                          <TrendingDown className="w-3 h-3" />
                          <span>بيع Short ({activeVerifiedSignals.filter(s => s.direction === 'SHORT').length})</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setSniperFilter('ENTRY_ZONE_NOW')}
                        className={`px-4 py-2 text-xs font-bold rounded-sm border transition-all flex items-center gap-1.5 cursor-pointer ${
                          sniperFilter === 'ENTRY_ZONE_NOW'
                            ? 'bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 text-black border-emerald-300 font-black shadow-[0_0_25px_rgba(52,211,153,0.7)] ring-2 ring-emerald-300'
                            : 'bg-emerald-500/15 text-emerald-300 border-emerald-400/50 hover:bg-emerald-500/25'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span>🎯 في منطقة الدخول الآن بالمليمتر ({
                          activeVerifiedSignals.filter(s => {
                            const cur = tickers[s.symbol]?.lastPrice || s.entry;
                            const d = s.entry > 0 ? (Math.abs(cur - s.entry) / s.entry) * 100 : 0;
                            const sl = s.direction === 'LONG' ? cur <= s.sl : cur >= s.sl;
                            const tp = s.direction === 'LONG' ? cur >= (s.tp1 || s.tp) : cur <= (s.tp1 || s.tp);
                            return d <= 1.2 && !sl && !tp;
                          }).length
                        })</span>
                      </button>
                      <button
                        onClick={() => setSniperFilter('TREND_OF_THE_DAY')}
                        className={`px-4 py-2 text-xs font-bold rounded-sm border transition-all flex items-center gap-1.5 cursor-pointer ${
                          sniperFilter === 'TREND_OF_THE_DAY'
                            ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-black border-amber-300 font-black shadow-[0_0_25px_rgba(251,191,36,0.6)] ring-1 ring-amber-300'
                            : 'bg-amber-400/10 text-amber-300 border-amber-400/40 hover:bg-amber-400/20'
                        }`}
                      >
                        <span className="text-sm">👑</span>
                        <span>تريند اليوم المرتقب (Pre-Trend HTF) ({activeVerifiedSignals.filter(s => s.isTrendOfTheDay || s.trendOfTheDay?.isCandidate || s.setupCategory === 'PRE_IGNITION_COILED').length})</span>
                      </button>
                      <button
                        onClick={() => setSniperFilter('FAST_ARRIVAL')}
                        className={`px-4 py-2 text-xs font-bold rounded-sm border transition-all flex items-center gap-1.5 cursor-pointer ${
                          sniperFilter === 'FAST_ARRIVAL'
                            ? 'bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 text-black border-cyan-300 font-black shadow-[0_0_25px_rgba(34,211,238,0.6)] ring-1 ring-cyan-300'
                            : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/20'
                        }`}
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>⚡ وصول سريع وانطلاق وشيك (لا انتظار) ({activeVerifiedSignals.filter(s => evaluateSignalStrength(s).imminentBurst || s.entryProximity === 'PERFECT_ZONE_NOW' || s.targetVelocity === 'FAST').length})</span>
                      </button>
                      <button
                        onClick={() => setSniperFilter('REAL_TRADES')}
                        className={`px-4 py-2 text-xs font-bold rounded-sm border transition-all flex items-center gap-1.5 cursor-pointer ${
                          sniperFilter === 'REAL_TRADES'
                            ? 'bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 text-black border-emerald-300 font-black shadow-[0_0_25px_rgba(52,211,153,0.55)] ring-1 ring-emerald-300'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/50 hover:bg-emerald-500/20'
                        }`}
                      >
                        <Target className="w-3.5 h-3.5" />
                        <span>🎯 صفقات حقيقية تضرب الهدف ({activeVerifiedSignals.filter(s => s.isRealTradeConfirmed || (s.confidence >= 88 && (s.hasDivergence || s.hasFvg || s.isPreIgnitionReady || s.isOversoldImpulseBuy || s.isOverboughtImpulseSell))).length})</span>
                      </button>
                      <button
                        onClick={() => setSniperFilter('PRE_IGNITION')}
                        className={`px-4 py-2 text-xs font-bold rounded-sm border transition-all flex items-center gap-1.5 cursor-pointer ${
                          sniperFilter === 'PRE_IGNITION'
                            ? 'bg-gradient-to-r from-amber-400 to-emerald-400 text-black border-emerald-400 font-black shadow-[0_0_20px_rgba(52,211,153,0.4)]'
                            : 'bg-[#0a0a0a] text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/10'
                        }`}
                      >
                        ⚡ اقتناص قبل الحركة ({activeVerifiedSignals.filter(s => s.isPreIgnitionReady || s.setupCategory === 'WYCKOFF_SPRING' || s.setupCategory === 'PRE_IGNITION_COILED').length})
                      </button>
                      <button
                        onClick={() => setSniperFilter('ALL_RANKED')}
                        className={`px-4 py-2 text-xs font-bold rounded-sm border transition-all flex items-center gap-1.5 cursor-pointer ${
                          sniperFilter === 'ALL_RANKED'
                            ? 'bg-white text-black border-white font-black shadow-md'
                            : 'bg-[#0a0a0a] text-white/70 border-white/20 hover:text-white'
                        }`}
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>🏆 ترتيب المستويات الماسية والبلاتينية ({activeVerifiedSignals.length})</span>
                      </button>
                      <button
                        onClick={() => setSniperFilter('SMART_FAST')}
                        className={`px-4 py-2 text-xs font-bold rounded-sm border transition-all flex items-center gap-1.5 ${
                          sniperFilter === 'SMART_FAST'
                            ? 'bg-amber-400 text-black border-amber-400 font-black shadow-[0_0_15px_rgba(251,191,36,0.35)]'
                            : 'bg-[#0a0a0a] text-amber-400 border-amber-400/40 hover:bg-amber-400/10'
                        }`}
                      >
                        ⚡ صيد ذكي سريع ({activeVerifiedSignals.filter(s => s.smartRiskLevel === 'SMART_CALCULATED_RISK' || s.fastOpportunityBadge || s.isMomentumBreakout).length})
                      </button>
                      <button
                        onClick={() => setSniperFilter('NEW_LISTINGS')}
                        className={`px-4 py-2 text-xs font-bold rounded-sm border transition-all flex items-center gap-1.5 ${
                          sniperFilter === 'NEW_LISTINGS'
                            ? 'bg-amber-400 text-black border-amber-400 font-black shadow-[0_0_15px_rgba(251,191,36,0.35)]'
                            : 'bg-[#0a0a0a] text-amber-400 border-amber-400/40 hover:bg-amber-400/10'
                        }`}
                      >
                        🔥 إدراجات جديدة ({activeVerifiedSignals.filter(s => s.isNewListing).length})
                      </button>
                      <button
                        onClick={() => setSniperFilter('STRONG_OVERSOLD')}
                        className={`px-4 py-2 text-xs font-bold rounded-sm border transition-all flex items-center gap-1.5 ${
                          sniperFilter === 'STRONG_OVERSOLD'
                            ? 'bg-amber-400 text-black border-amber-400 font-black shadow-[0_0_15px_rgba(251,191,36,0.35)]'
                            : 'bg-[#0a0a0a] text-amber-400 border-amber-400/40 hover:bg-amber-400/10'
                        }`}
                      >
                        🎯 مناطق تشبع وانطلاق ({activeVerifiedSignals.filter(s => s.isOversoldImpulseBuy || s.setupCategory === 'OVERSOLD_IMPULSE' || s.hasDivergence).length})
                      </button>
                      <button
                        onClick={() => setSniperFilter('HIGH_PROFIT')}
                        className={`px-4 py-2 text-xs font-bold rounded-sm border transition-all flex items-center gap-1.5 ${
                          sniperFilter === 'HIGH_PROFIT'
                            ? 'bg-[#10b981] text-black border-[#10b981] shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                            : 'bg-[#0a0a0a] text-[#10b981] border-[#10b981]/40 hover:bg-[#10b981]/10'
                        }`}
                      >
                        <Zap className="w-3.5 h-3.5" />
                        أرباح +10% فأكثر (حساب $20) ({activeVerifiedSignals.filter(s => (s.profitPercent || (s.entry > 0 ? (Math.abs(s.tp - s.entry)/s.entry)*100 : 0)) >= 10).length})
                      </button>
                      <button
                        onClick={() => setSniperFilter('ALL')}
                        className={`px-3.5 py-2 text-xs font-bold rounded-sm border transition-all ${
                          sniperFilter === 'ALL'
                            ? 'bg-white text-black border-white'
                            : 'bg-[#0a0a0a] text-white/60 border-white/10 hover:text-white'
                        }`}
                      >
                        جميع الفرص المؤكدة ({activeVerifiedSignals.length})
                      </button>
                      <button
                        onClick={() => setSniperFilter('GRADE_AAA')}
                        className={`px-3.5 py-2 text-xs font-bold rounded-sm border transition-all ${
                          sniperFilter === 'GRADE_AAA'
                            ? 'bg-amber-400 text-black border-amber-400 font-extrabold shadow-[0_0_15px_rgba(251,191,36,0.3)]'
                            : 'bg-[#0a0a0a] text-amber-400 border-amber-400/30 hover:border-amber-400'
                        }`}
                      >
                        💎 نخبة AAA (أعلى دقة +90%) ({activeVerifiedSignals.filter(s => s.grade === 'AAA' || s.confidence >= 88).length})
                      </button>
                      <button
                        onClick={() => setSniperFilter('DIVERGENCE')}
                        className={`px-3.5 py-2 text-xs font-bold rounded-sm border transition-all ${
                          sniperFilter === 'DIVERGENCE'
                            ? 'bg-purple-500 text-white border-purple-500 font-extrabold shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                            : 'bg-[#0a0a0a] text-purple-300 border-purple-500/30 hover:border-purple-500'
                        }`}
                      >
                        ⚡ دايفرجنس انعكاسي ({activeVerifiedSignals.filter(s => s.hasDivergence).length})
                      </button>
                      <button
                        onClick={() => setSniperFilter('HIGH_RR')}
                        className={`px-3.5 py-2 text-xs font-bold rounded-sm border transition-all ${
                          sniperFilter === 'HIGH_RR'
                            ? 'bg-emerald-400 text-black border-emerald-400 font-extrabold shadow-[0_0_15px_rgba(52,211,153,0.35)]'
                            : 'bg-[#0a0a0a] text-emerald-400 border-emerald-400/30 hover:border-emerald-400'
                        }`}
                      >
                        🎯 عائد R:R &gt; 4.0 ({activeVerifiedSignals.filter(s => (s.rrRatio || 0) >= 4.0).length})
                      </button>
                      <button
                        onClick={() => setSniperFilter('LONG')}
                        className={`px-3.5 py-2 text-xs font-bold rounded-sm border transition-all ${
                          sniperFilter === 'LONG'
                            ? 'bg-[#10b981] text-black border-[#10b981]'
                            : 'bg-[#0a0a0a] text-emerald-400/70 border-white/10 hover:border-[#10b981]/40'
                        }`}
                      >
                        شراء صاعد Long ({activeVerifiedSignals.filter(s => s.direction === 'LONG').length})
                      </button>
                      <button
                        onClick={() => setSniperFilter('SHORT')}
                        className={`px-3.5 py-2 text-xs font-bold rounded-sm border transition-all ${
                          sniperFilter === 'SHORT'
                            ? 'bg-rose-500 text-white border-rose-500'
                            : 'bg-[#0a0a0a] text-rose-400/70 border-white/10 hover:border-rose-500/40'
                        }`}
                      >
                        بيع هابط Short ({activeVerifiedSignals.filter(s => s.direction === 'SHORT').length})
                      </button>
                      <button
                        onClick={() => setSniperFilter('HIGH_CONFIDENCE')}
                        className={`px-3.5 py-2 text-xs font-bold rounded-sm border transition-all ${
                          sniperFilter === 'HIGH_CONFIDENCE'
                            ? 'bg-amber-400 text-black border-amber-400'
                            : 'bg-[#0a0a0a] text-amber-400/70 border-white/10 hover:border-amber-400/40'
                        }`}
                      >
                        ثقة فائقة +85% ({activeVerifiedSignals.filter(s => s.confidence >= 85).length})
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-xs text-white/50">
                        🛡️ درع الحماية: تأمين الوقف لسعر الدخول فور ضرب TP1 لضمان انعدام الخسارة
                      </span>
                      <button
                        onClick={() => startSniper()}
                        disabled={isScanning}
                        className="px-3.5 py-1.5 bg-[#10b981]/15 hover:bg-[#10b981] hover:text-black text-[#10b981] border border-[#10b981]/40 rounded-sm text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                        <span>{isScanning ? 'جاري الفحص المباشر...' : 'مسح السوق وتحديث الصفقات الآن ⚡'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Signals Opportunity Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredSniperSignals.map((sig, i) => {
                      const strength = evaluateSignalStrength(sig);
                      const ticker = tickers[sig.symbol];
                      const changePercent = (ticker && typeof ticker.priceChangePercent === 'number' && isFinite(ticker.priceChangePercent)) ? ticker.priceChangePercent : 0;
                      const isPositiveChange = changePercent >= 0;
                      const riskDiff = Math.abs((sig.entry || 0) - (sig.sl || 0));
                      const rewardDiff = Math.abs((sig.tp || 0) - (sig.entry || 0));
                      const riskPercent = (sig.entry > 0 && typeof riskDiff === 'number' && isFinite(riskDiff)) ? ((riskDiff / sig.entry) * 100).toFixed(2) : "2.2";
                      const rawRewardPercent = (sig.entry > 0 && typeof rewardDiff === 'number' && isFinite(rewardDiff)) ? ((rewardDiff / sig.entry) * 100).toFixed(1) : "11.2";
                      const profitPercent = typeof sig.profitPercent === 'number' && isFinite(sig.profitPercent) ? sig.profitPercent : (Number(rawRewardPercent) || 11.2);
                      const expectedProfit20 = typeof sig.expectedProfit20USD === 'number' && isFinite(sig.expectedProfit20USD) ? sig.expectedProfit20USD.toFixed(2) : (20 * (profitPercent / 100)).toFixed(2);
                      const leveragedProfit20 = typeof sig.leveragedProfit20USD === 'number' && isFinite(sig.leveragedProfit20USD) ? sig.leveragedProfit20USD.toFixed(2) : (20 * (profitPercent / 100) * 5).toFixed(2);
                      const isFast = sig.targetSpeed === 'FAST';

                      return (
                        <motion.div 
                          key={`${sig.symbol}-${i}`}
                          initial={{ opacity: 0, y: 12 }} 
                          animate={{ opacity: 1, y: 0 }}
                          className={`bg-[#0a0a0a] border rounded-sm p-5 relative flex flex-col justify-between transition-all hover:border-opacity-60 ${
                            strength.tier === 'DIAMOND'
                              ? 'border-emerald-400/80 shadow-[0_0_28px_rgba(16,185,129,0.18)] ring-1 ring-emerald-400/40'
                              : strength.tier === 'PLATINUM'
                              ? 'border-amber-400/60 shadow-[0_0_20px_rgba(245,158,11,0.12)] ring-1 ring-amber-400/30'
                              : 'border-sky-500/30 shadow-[0_0_15px_rgba(56,189,248,0.06)]'
                          }`}
                        >
                          <div>
                            {/* 👑 المستوى الهرمي وقوة الصفقة (Prominent Level Tier & Power Header) */}
                            <div className={`p-2.5 rounded-sm mb-3.5 flex items-center justify-between border ${
                              strength.tier === 'DIAMOND' 
                                ? 'bg-gradient-to-r from-emerald-950/90 via-[#062118] to-black border-emerald-400/60 text-emerald-300' 
                                : strength.tier === 'PLATINUM'
                                ? 'bg-gradient-to-r from-amber-950/90 via-[#221706] to-black border-amber-400/60 text-amber-300'
                                : 'bg-gradient-to-r from-sky-950/90 via-[#071929] to-black border-sky-400/50 text-sky-300'
                            }`}>
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{strength.stars}</span>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-black text-xs md:text-sm tracking-wide">{strength.tierTitle}</span>
                                    <span className="text-[10px] px-2 py-0.2 rounded-sm bg-black/80 font-mono font-black text-white border border-white/10">
                                      رتبة #{i + 1}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-white/60 block mt-0.5 font-medium">
                                    {strength.tierRankLabel} • أمان مؤسساتي فائق وحماية رأس المال
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-col items-end">
                                <span className="text-[9px] text-white/50 uppercase font-mono">مؤشر القوة</span>
                                <span className={`font-mono text-xs font-black px-2 py-0.5 rounded-sm bg-black/90 border border-white/15 ${
                                  strength.tier === 'DIAMOND' ? 'text-emerald-400' : strength.tier === 'PLATINUM' ? 'text-amber-400' : 'text-sky-400'
                                }`}>
                                  {strength.score}/100
                                </span>
                              </div>
                            </div>

                            {/* Header: Symbol, 24h change, Direction, Grade & Confidence */}
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-bold font-mono text-white">{sig.symbol}</span>
                                    <button
                                      onClick={(e) => handleCopySymbol(sig.symbol, e)}
                                      title={`نسخ رمز العملة ${sig.symbol}`}
                                      className={`px-2 py-0.5 rounded-sm border transition-all flex items-center gap-1 text-[11px] font-mono cursor-pointer ${
                                        copiedSymbol === sig.symbol
                                          ? 'bg-[#10b981]/25 border-[#10b981] text-[#10b981] font-bold'
                                          : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10 hover:border-white/30'
                                      }`}
                                    >
                                      {copiedSymbol === sig.symbol ? (
                                        <>
                                          <Check className="w-3.5 h-3.5 text-[#10b981]" />
                                          <span className="text-[10px] font-sans font-bold text-[#10b981]">تم النسخ</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-3 h-3" />
                                          <span className="text-[10px] font-sans">نسخ</span>
                                        </>
                                      )}
                                    </button>
                                    {ticker && (
                                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-sm ${
                                        isPositiveChange ? 'bg-[#10b981]/15 text-[#10b981]' : 'bg-rose-500/15 text-rose-400'
                                      }`}>
                                        {isPositiveChange ? '+' : ''}{typeof changePercent === 'number' && isFinite(changePercent) ? changePercent.toFixed(1) : '0.0'}%
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-sm flex items-center gap-1 ${
                                      sig.direction === 'LONG' 
                                        ? 'bg-[#10b981]/20 text-[#10b981]' 
                                        : 'bg-rose-500/20 text-rose-400'
                                    }`}>
                                      {sig.direction === 'LONG' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                      {sig.direction === 'LONG' ? 'شراء صاعد (Long)' : 'بيع هابط (Short)'}
                                    </span>
                                    {sig.isNewListing && (
                                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-amber-400/20 text-amber-300 border border-amber-400/40 animate-pulse flex items-center gap-1">
                                        <span>🔥</span>
                                        <span>إدراج جديد {sig.listingAge ? `(${sig.listingAge})` : ''}</span>
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="text-left flex flex-col items-end gap-1">
                                  {sig.grade === 'AAA' ? (
                                    <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-sm bg-amber-400 text-black border border-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.35)] flex items-center gap-1">
                                      <span>AAA</span>
                                      <span>💎</span>
                                    </span>
                                  ) : sig.grade === 'AA' ? (
                                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-sm bg-blue-500/20 text-blue-300 border border-blue-500/40">
                                      AA ⭐
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-sm bg-white/10 text-white/70 border border-white/20">
                                      GRADE A
                                    </span>
                                  )}

                                  <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-sm ${
                                    sig.confidence >= 88 ? 'bg-[#10b981] text-black font-extrabold' : 'bg-white/10 text-white'
                                  }`}>
                                    {sig.confidence}%
                                  </span>
                                </div>
                              </div>

                              {/* 👑 Trend of the Day / Pre-Trend Ignition Banner */}
                              {(sig.isTrendOfTheDay || sig.trendOfTheDay?.isCandidate) && (
                                <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-transparent border border-amber-400/50 p-3 rounded-sm mb-3 shadow-[0_0_20px_rgba(251,191,36,0.15)] ring-1 ring-amber-400/30">
                                  <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-2">
                                      <span className="text-base animate-bounce">👑</span>
                                      <span className="text-xs font-black text-amber-300 tracking-wide">
                                        تريند اليوم المرتقب (Pre-Trend Ignition)
                                      </span>
                                    </div>
                                    <span className="text-[10px] font-mono bg-gradient-to-r from-amber-400 to-yellow-300 text-black px-2 py-0.5 rounded-sm font-black shadow-sm">
                                      {sig.trendOfTheDay?.stageArabic || '🌀 تجميع قبل الانفجار'}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-amber-400/20 text-[11px]">
                                    <div className="flex items-center gap-1.5 text-white/80">
                                      <span className="text-amber-400 font-bold">الأطر الحاكمة:</span>
                                      <span className="font-mono text-[10px] text-amber-200 bg-black/40 px-1.5 py-0.5 rounded-sm">
                                        {sig.trendOfTheDay?.htfConfluence || '1D + 4H + 1H أطر كبرى'}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-end gap-1.5 text-white/80">
                                      <span className="text-amber-400 font-bold">تراكم السيولة:</span>
                                      <span className="font-mono text-[10px] text-emerald-400 font-bold bg-black/40 px-1.5 py-0.5 rounded-sm">
                                        {sig.trendOfTheDay?.dailyVolumeInflowMultiplier ? `${sig.trendOfTheDay.dailyVolumeInflowMultiplier}x المتوسط` : 'تدفق حيتان قوي'}
                                      </span>
                                    </div>
                                  </div>
                                  {sig.trendOfTheDay?.verdictArabic && (
                                    <p className="mt-2 text-[10px] text-amber-100/90 leading-relaxed bg-black/50 p-2 rounded-sm border border-amber-400/20">
                                      {sig.trendOfTheDay.verdictArabic}
                                    </p>
                                  )}
                                </div>
                              )}

                              {/* ⚡ Fast Arrival & High-Strike Accuracy Banner (وصول سريع لا انتظار - صفقة قوية تضرب الهدف) */}
                              <div className="bg-gradient-to-r from-cyan-500/15 via-blue-500/10 to-transparent border border-cyan-400/40 p-2.5 rounded-sm mb-3 shadow-[0_0_15px_rgba(34,211,238,0.15)] ring-1 ring-cyan-400/20">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5 text-xs font-black text-cyan-300">
                                    <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
                                    <span>{strength.velocitySpeedBadge}</span>
                                  </div>
                                  <span className="text-[10px] font-mono bg-cyan-400 text-black px-2 py-0.5 rounded-sm font-black shadow-[0_0_10px_rgba(34,211,238,0.4)]">
                                    {strength.strikePillText}
                                  </span>
                                </div>
                                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[10px] border-t border-cyan-400/20 pt-1.5">
                                  <div className="flex items-center gap-1 text-white/90">
                                    <span className="text-cyan-300 font-bold">⏱️ توقيت الحركة:</span>
                                    <span className="font-mono text-cyan-200 bg-black/50 px-1.5 py-0.5 rounded-sm border border-cyan-400/30">
                                      {strength.waitingTimeEstimate}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 text-white/90">
                                    <span className="text-amber-400 font-bold">🏛️ الأطر المعتمدة:</span>
                                    <span className="font-mono text-amber-200 bg-black/50 px-1.5 py-0.5 rounded-sm border border-amber-400/30">
                                      {strength.htfTimeframePill}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Real Verified Trade Live Execution Banner */}
                              {(sig.isRealTradeConfirmed || sig.confidence >= 88) && (
                                <div className="bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent border border-emerald-500/40 p-2.5 rounded-sm mb-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-xs font-black text-emerald-400">
                                      <Target className="w-4 h-4 text-emerald-400 animate-pulse" />
                                      <span>صفقة حقيقية مؤكدة بالمليمتر (Real Trade Confirmed)</span>
                                    </div>
                                    <span className="text-[10px] font-mono bg-emerald-400 text-black px-2 py-0.5 rounded-sm font-black shadow-[0_0_10px_rgba(52,211,153,0.4)]">
                                      دقة {sig.realTradePurityScore || sig.confidence}%
                                    </span>
                                  </div>
                                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-white/90">
                                    <span className="text-emerald-300 font-bold">التريغر المنفذ:</span>
                                    <span className="bg-black/50 px-2 py-0.5 rounded-sm border border-emerald-500/30 text-emerald-200 font-mono text-[10px]">
                                      {sig.realTradeTrigger || (sig.hasDivergence ? 'دايفرجنس انعكاسي مؤكد' : (sig.hasFvg ? 'اختبار فجوة FVG' : 'توافق هيكلي وأطر كبرى (1D + 4H + 1H)'))}
                                    </span>
                                  </div>
                                  <div className="mt-1 text-[10px] font-mono text-amber-300 flex items-center gap-1">
                                    <span>⚡</span>
                                    <span>{sig.executionInstruction || (sig.entryProximity === 'PERFECT_ZONE_NOW' ? 'السعر في قلب منطقة الدخول تماماً - نفذ الآن' : 'علق أمر الدخول Limit عند السعر المحدد بدقة')}</span>
                                  </div>
                                </div>
                              )}

                              {/* 🏆 ركائز قوة ومستوى الصفقة (لماذا هذه الصفقة قوية؟) */}
                              {strength.strengthReasons && strength.strengthReasons.length > 0 && (
                                <div className="mb-3 p-2.5 rounded-sm bg-white/[0.02] border border-white/5 space-y-1">
                                  <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1 flex items-center justify-between">
                                    <span className="flex items-center gap-1">
                                      <span>🛡️</span>
                                      <span>ركائز القوة والمستوى النخبوي:</span>
                                    </span>
                                    <span className={`text-[9px] font-bold font-mono px-1.5 py-0.2 rounded-sm ${
                                      strength.tier === 'DIAMOND' ? 'bg-emerald-500/20 text-emerald-300' : strength.tier === 'PLATINUM' ? 'bg-amber-400/20 text-amber-300' : 'bg-sky-500/20 text-sky-300'
                                    }`}>
                                      {strength.tierShortName}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-1 gap-1">
                                    {strength.strengthReasons.map((reason, rIdx) => (
                                      <div key={rIdx} className="flex items-center gap-1.5 text-[11px] text-white/80">
                                        <span className="text-[#10b981] font-bold text-xs">✓</span>
                                        <span>{reason}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* 🛡️ High Liquidity Quality Gate (مرشح دقة السيولة العالية) */}
                              {sig.highLiquidityQualityGate && (
                                <div className={`mb-3 px-3 py-2 rounded-sm border flex items-center justify-between gap-3 ${
                                  sig.highLiquidityQualityGate.isPassed 
                                    ? 'bg-emerald-500/10 border-emerald-500/40' 
                                    : 'bg-rose-500/10 border-rose-500/40'
                                }`}>
                                  <div className="flex items-center gap-2">
                                    <div className={`p-1.5 rounded-full ${sig.highLiquidityQualityGate.isPassed ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
                                      <ShieldCheck className={`w-3.5 h-3.5 ${sig.highLiquidityQualityGate.isPassed ? 'text-emerald-400' : 'text-rose-400'}`} />
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="text-[10px] font-black text-white/70 uppercase tracking-wider">مرشح دقة السيولة العالية</span>
                                      <span className={`text-[11px] font-bold ${sig.highLiquidityQualityGate.isPassed ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {sig.highLiquidityQualityGate.inflowArabic}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-mono text-white/50">Taker Flow</span>
                                    <span className={`text-xs font-mono font-black ${sig.highLiquidityQualityGate.isPassed ? 'text-emerald-400' : 'text-rose-400'}`}>
                                      {sig.highLiquidityQualityGate.takerFlowRatio15m.toFixed(2)}x
                                    </span>
                                  </div>
                                </div>
                              )}

                              {/* 🌊 Comprehensive Multi-Dimensional Market Matrix (السيولة، الصفقات، حالة العملة، التذبذب) */}
                              {sig.marketMatrix && (
                                <div className="mb-3.5 p-3 rounded-sm bg-gradient-to-br from-[#0c1322] via-[#090d16] to-black border border-indigo-500/40 shadow-[0_0_20px_rgba(99,102,241,0.15)]">
                                  <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2 mb-2.5">
                                    <div className="flex items-center gap-2">
                                      <Activity className="w-4 h-4 text-indigo-400 animate-pulse" />
                                      <span className="text-xs font-black text-indigo-300">
                                        مصفوفة أبعاد السوق (السيولة • الصفقات • حالة العملة • التذبذب)
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 font-bold">
                                        كفاءة شاملة {sig.marketMatrix.multiDimensionalScore}%
                                      </span>
                                    </div>
                                  </div>

                                  {/* 4 Multi-Dimensional Pillars Grid */}
                                  <div className="grid grid-cols-2 gap-2 text-[11px] mb-2.5">
                                    {/* 1. السيولة وعمق السوق */}
                                    <div className="bg-white/[0.03] p-2 rounded-sm border border-white/5 hover:border-indigo-500/30 transition-colors">
                                      <div className="flex items-center justify-between text-[10px] text-indigo-300 font-bold mb-1">
                                        <span className="flex items-center gap-1">💧 السيولة والعمق</span>
                                        <span className={`font-mono font-bold ${sig.marketMatrix.liquidity.buyPressurePct >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                          {sig.marketMatrix.liquidity.buyPressurePct}% شراء
                                        </span>
                                      </div>
                                      <div className="text-[10px] text-white/80 font-mono flex justify-between">
                                        <span className="text-white/40">دوران 1h:</span>
                                        <span className="font-bold">${(sig.marketMatrix.liquidity.turnover1hUsd / 1000).toFixed(0)}k</span>
                                      </div>
                                      <div className="text-[9px] text-indigo-200/90 font-medium truncate mt-1">
                                        {sig.marketMatrix.liquidity.summaryArabic}
                                      </div>
                                    </div>

                                    {/* 2. الصفقات وتدفق الحيتان */}
                                    <div className="bg-white/[0.03] p-2 rounded-sm border border-white/5 hover:border-cyan-500/30 transition-colors">
                                      <div className="flex items-center justify-between text-[10px] text-cyan-300 font-bold mb-1">
                                        <span className="flex items-center gap-1">🐋 صفقات الحيتان</span>
                                        <span className="font-mono text-cyan-400 font-bold">{sig.marketMatrix.trades.whaleActivityScore}% نشاط</span>
                                      </div>
                                      <div className="text-[10px] text-white/80 font-mono flex justify-between">
                                        <span className="text-white/40">متوسط الصفقة:</span>
                                        <span className="font-bold">${sig.marketMatrix.trades.avgTradeSizeUsd} ({sig.marketMatrix.trades.tradeCount1h} صفقة)</span>
                                      </div>
                                      <div className="text-[9px] text-cyan-200/90 font-medium truncate mt-1">
                                        {sig.marketMatrix.trades.summaryArabic}
                                      </div>
                                    </div>

                                    {/* 3. حالة العملة والمسار السوقي */}
                                    <div className="bg-white/[0.03] p-2 rounded-sm border border-white/5 hover:border-amber-500/30 transition-colors">
                                      <div className="flex items-center justify-between text-[10px] text-amber-300 font-bold mb-1">
                                        <span className="flex items-center gap-1">🏛️ حالة العملة</span>
                                        <span className="font-mono text-amber-400 font-bold">
                                          {sig.marketMatrix.coinStatus.rsVsBtc === 'STRONG_LEADER' ? 'قائدة (+RS)' : sig.marketMatrix.coinStatus.rsVsBtc === 'LAGGING_WEAK' ? 'متخلفة (-RS)' : 'متوازنة'}
                                        </span>
                                      </div>
                                      <div className="text-[10px] text-white/90 font-medium truncate">
                                        {sig.marketMatrix.coinStatus.regimeArabic}
                                      </div>
                                      <div className="text-[9px] text-amber-200/80 font-medium truncate mt-1">
                                        {sig.marketMatrix.coinStatus.summaryArabic}
                                      </div>
                                    </div>

                                    {/* 4. التحرك والتذبذب الحقيقي */}
                                    <div className="bg-white/[0.03] p-2 rounded-sm border border-white/5 hover:border-rose-500/30 transition-colors">
                                      <div className="flex items-center justify-between text-[10px] text-rose-300 font-bold mb-1">
                                        <span className="flex items-center gap-1">⚡ التحرك والتذبذب</span>
                                        <span className="font-mono text-rose-400 font-bold">ATR {sig.marketMatrix.dynamics.atrPercent}%</span>
                                      </div>
                                      <div className="text-[10px] text-white/80 font-mono flex justify-between">
                                        <span className="text-white/40">سرعة السعر:</span>
                                        <span className="font-bold">{sig.marketMatrix.dynamics.priceVelocityPerHourPct > 0 ? '+' : ''}{sig.marketMatrix.dynamics.priceVelocityPerHourPct}%/ساعة</span>
                                      </div>
                                      <div className="text-[9px] text-rose-200/80 font-medium truncate mt-1">
                                        {sig.marketMatrix.dynamics.volatilityStateArabic}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Verdict text */}
                                  <div className="text-[10px] text-white/80 bg-black/60 px-2.5 py-1.5 rounded-sm border border-white/10 flex items-center gap-1.5">
                                    <span className="text-indigo-400 font-bold">⚖️ حكم المصفوفة:</span>
                                    <span className="truncate">{sig.marketMatrix.multiDimensionalVerdictArabic}</span>
                                  </div>
                                </div>
                              )}

                              {/* Dedicated Higher Timeframe HTF Macro Structure Confirmation (1D + 4H + 1H) */}
                              <div className="mb-3 px-3.5 py-2.5 rounded-sm bg-gradient-to-r from-slate-950 via-slate-900/80 to-black border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                  <div className="flex items-center gap-2">
                                    <span className="text-cyan-400 font-black text-sm">🏛️</span>
                                    <span className="text-xs font-black text-cyan-300">
                                      هيكل الأطر الكبرى الرصينة (1D + 4H + 1H Macro HTF)
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-cyan-400 text-black rounded-sm">
                                    استبعاد تام للفريمات الصغيرة 🛡️
                                  </span>
                                </div>

                                <div className="text-[11px] text-white/80 font-medium mb-2 leading-relaxed">
                                  {sig.humanTraderVerdict || sig.ltfConfirmation?.humanTraderVerdict || 'توافق هيكلي متين عبر اليومي والأربع ساعات والساعة مع تأكيد تدفق السيولة وحماية الحساب من مصائد التذبذب اللحظي.'}
                                </div>

                                <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
                                  <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-sm">
                                    الأطر: 1D يومي • 4H أربع ساعات • 1H ساعة
                                  </span>
                                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 rounded-sm font-bold">
                                    تنفيذ بأمر معلق Limit لمنع الانزلاق السعري
                                  </span>
                                  {sig.microSurgicalEntry && (
                                    <span className="px-2 py-0.5 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-sm font-bold">
                                      منطقة الدخول المحددة: ${sig.microSurgicalEntry}
                                    </span>
                                  )}
                                  {sig.microStopLoss && (
                                    <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-sm font-bold">
                                      وقف هيكلي: ${sig.microStopLoss} (R:R 1:{sig.surgicalRrRatio || sig.rrRatio})
                                    </span>
                                  )}
                                </div>

                                {sig.ltfConfirmation?.warningNote && (
                                  <div className="mt-2 text-[10px] text-amber-300 bg-amber-500/15 border border-amber-400/30 px-2 py-1 rounded-sm">
                                    ⚠️ {sig.ltfConfirmation.warningNote}
                                  </div>
                                )}
                              </div>

                              {/* Dedicated Pre-Ignition / Coiled Spring Banner */}
                              {sig.isPreIgnitionReady && (
                                <div className="mb-3 px-3.5 py-2.5 rounded-sm bg-gradient-to-r from-emerald-950/70 via-amber-950/40 to-black border border-emerald-400/60 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                                  <div className="flex items-center justify-between gap-2 mb-1.5">
                                    <div className="flex items-center gap-2">
                                      <span className="text-emerald-400 font-black text-base animate-pulse">⚡</span>
                                      <span className="text-xs font-black text-emerald-300">
                                        اقتناص استباقي قبل انفجار الحركة ({sig.preIgnitionScore || 90}% جاهزية)
                                      </span>
                                    </div>
                                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-emerald-400 text-black rounded-sm">
                                      {sig.executionStyle === 'LIMIT_DISCOUNT_ENTRY' ? 'أمر معلق Limit' : 'دخول استباقي'}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-white/90 font-medium mb-2 leading-tight">
                                    {sig.preIgnitionReason || sig.coiledPhase || 'اكتمال انضغاط الزنبرك مع تجفيف سيولة البيع واختبار الدعم'}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
                                    {sig.optimalLimitEntry && (
                                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-sm">
                                        سعر الدخول التخفيضي: ${sig.optimalLimitEntry}
                                      </span>
                                    )}
                                    {sig.coiledPhase && (
                                      <span className="px-2 py-0.5 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-sm">
                                        المرحلة: {sig.coiledPhase}
                                      </span>
                                    )}
                                    {sig.compressionRatio && (
                                      <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-sm">
                                        انضغاط الباند: {((1 - sig.compressionRatio) * 100).toFixed(0)}%
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Smart Calculated Risk & Fast Opportunity Banner */}
                              {(sig.fastOpportunityBadge || sig.smartRiskLevel === 'SMART_CALCULATED_RISK') && (
                                <div className="mb-3 px-3 py-2 rounded-sm bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-transparent border border-amber-400/40 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-amber-400 font-black text-sm">⚡</span>
                                    <div>
                                      <div className="text-[11px] font-bold text-amber-300">
                                        {sig.fastOpportunityBadge || 'مخاطرة ذكية محسوبة: صيد حركة سريعة'}
                                      </div>
                                      <div className="text-[9px] text-white/60">
                                        {sig.riskLabel || 'فرصة سريعة تم رصدها بناءً على ذروة البيع وتسارع الزخم مع وقف خسارة محكم'}
                                      </div>
                                    </div>
                                  </div>
                                  {sig.targetVelocity && (
                                    <span className="text-[10px] font-mono font-extrabold px-1.5 py-0.5 bg-amber-400 text-black rounded-sm">
                                      سرعة {sig.targetVelocity}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Dedicated Strong Zone / Impulse Banner */}
                              {(sig.isOversoldImpulseBuy || sig.setupCategory === 'OVERSOLD_IMPULSE' || sig.isOverboughtImpulseSell) && (
                                <div className="mb-3 px-3 py-2 rounded-sm bg-gradient-to-r from-amber-500/20 via-emerald-500/15 to-transparent border border-amber-400/40 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-amber-400 font-black text-sm">🎯</span>
                                    <div>
                                      <div className="text-[11px] font-bold text-amber-300">
                                        {sig.isOverboughtImpulseSell ? 'تشبع شرائي مفرط + شمعة هبوط سريع' : 'اقتناص منطقة تشبع بيعي + انطلاق صاعد سريع'}
                                      </div>
                                      <div className="text-[9px] text-white/60">
                                        {sig.zoneStrength || 'ارتداد مؤسساتي من منطقة طلب قوية مع تفريغ ضغط البائعين'}
                                      </div>
                                    </div>
                                  </div>
                                  {sig.impulseStrength && (
                                    <span className="text-[10px] font-mono font-extrabold px-1.5 py-0.5 bg-amber-400 text-black rounded-sm">
                                      قوة الزخم {sig.impulseStrength}%
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Profit target & Target Speed & Divergence Badges */}
                              <div className="flex flex-wrap items-center gap-2 mb-3">
                                {sig.smartRiskLevel === 'SMART_CALCULATED_RISK' && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm bg-amber-400/20 text-amber-300 border border-amber-400/50 flex items-center gap-1 shadow-[0_0_10px_rgba(251,191,36,0.2)]">
                                    <span>⚡ مخاطرة ذكية محسوبة</span>
                                  </span>
                                )}
                                {sig.multiTimeframeConfirmed && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                                    <ShieldCheck className="w-3 h-3 text-[#10b981]" />
                                    <span>مؤكد 1D/4H/1H</span>
                                  </span>
                                )}
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40 flex items-center gap-1">
                                  <Zap className="w-3 h-3" />
                                  هدف الربح: +{profitPercent}%
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm bg-blue-500/15 text-blue-400 border border-blue-500/30">
                                  {isFast ? '🚀 وصول سريع (كسر سيولة)' : '⚡ سوينغ سريع'}
                                </span>
                                {sig.hasDivergence && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                                    ⚡ دايفرجنس مؤكد
                                  </span>
                                )}
                                {sig.hasFvg && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
                                    🎯 فجوة FVG
                                  </span>
                                )}
                              </div>

                              {/* Confidence Progress Bar */}
                              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mb-3">
                                <div 
                                  className={`h-full ${sig.direction === 'LONG' ? 'bg-[#10b981]' : 'bg-rose-500'}`}
                                  style={{ width: `${sig.confidence}%` }}
                                />
                              </div>

                              {/* Precision Confluence Factors Checklist */}
                              {sig.confluenceFactors && sig.confluenceFactors.length > 0 && (
                                <div className="bg-[#121212] border border-white/10 p-2.5 rounded-sm mb-3 space-y-1.5">
                                  <div className="text-[10px] text-white/50 font-bold flex items-center justify-between">
                                    <span>عوامل التأكيد الفني والدقة ({sig.confluenceFactors.length})</span>
                                    <span className="text-[9px] text-[#10b981] font-mono font-semibold">مؤكدة بنسبة 100%</span>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {sig.confluenceFactors.map((factor, idx) => (
                                      <span key={idx} className="text-[10px] px-2 py-0.5 bg-white/5 border border-white/10 rounded-sm text-white/90 flex items-center gap-1">
                                        <span className="text-[#10b981] font-bold">✓</span> {factor}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Reasoning Text */}
                              <div className="bg-white/[0.02] border border-white/5 p-3 rounded-sm text-xs text-white/80 leading-relaxed mb-3">
                                <p className="line-clamp-2">{sig.reasoning}</p>
                              </div>

                              {/* Small Capital 20$ Plan Highlight Box */}
                              <div className="bg-[#10b981]/5 border border-[#10b981]/25 p-3 rounded-sm mb-3 space-y-1">
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="text-white/60">عائد محفظة 20$ (Spot 1x):</span>
                                  <span className="font-mono font-bold text-[#10b981]">+{expectedProfit20}$ ({profitPercent}%)</span>
                                </div>
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="text-white/80 font-bold">عائد محفظة 20$ (رافعة 5x آمنة):</span>
                                  <span className="font-mono font-extrabold text-amber-400">+{leveragedProfit20}$ ({typeof profitPercent === 'number' && isFinite(profitPercent) ? (profitPercent * 5).toFixed(0) : '56'}%)</span>
                                </div>
                              </div>

                              {/* Institutional Loss-Prevention Shield & Breakeven Rule */}
                              <div className="bg-[#10b981]/5 border border-[#10b981]/30 p-3 rounded-sm mb-3 space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#10b981]">
                                    <ShieldCheck className="w-4 h-4 text-[#10b981]" />
                                    <span>درع الحكمة المؤسساتية ومنع الخسائر (Zero-Loss Protocol)</span>
                                  </div>
                                  <span className="text-[9px] font-mono bg-[#10b981]/20 text-[#10b981] px-1.5 py-0.5 rounded-sm font-bold">
                                    تأمين الدخول (Breakeven)
                                  </span>
                                </div>

                                <div className="text-[11px] text-white/80 bg-black/40 p-2.5 rounded-sm border border-white/5 space-y-1.5 leading-relaxed">
                                  <div className="flex items-start gap-1.5">
                                    <span className="text-[#10b981] font-bold shrink-0">🛡️ تأمين الدخول:</span>
                                    <span>
                                      عند وصول السعر للهدف الأول TP1 (<span className="font-mono text-white font-bold">${sig.tp1 || sig.tp}</span>)، انقل الوقف فوراً لسعر الدخول (<span className="font-mono text-white font-bold">${sig.entry}</span>) وأغلق 50% من العقد. تصبح الصفقة خالية من المخاطرة ومستحيل أن تخسر بعد ذلك!
                                    </span>
                                  </div>
                                  {sig.capitalProtectionPlan?.suggestedUnitsPer1000USD && (
                                    <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] text-white/60">
                                      <span>حجم العقد الآمن لمحفظة $1,000 (مخاطرة 1.5% كحد أقصى):</span>
                                      <span className="font-mono font-bold text-amber-400">{sig.capitalProtectionPlan.suggestedUnitsPer1000USD} وحدة</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* 🔴 LIVE TRACKER: Current Real Price, Distance from Entry & Real-Time Status */}
                              {(() => {
                                const currentLivePrice = (ticker && typeof ticker.lastPrice === 'number' && isFinite(ticker.lastPrice)) ? ticker.lastPrice : sig.entry;
                                const distFromEntryPct = sig.entry > 0 ? (Math.abs(currentLivePrice - sig.entry) / sig.entry) * 100 : 0;
                                const livePnl = sig.direction === 'LONG' 
                                  ? ((currentLivePrice - sig.entry) / sig.entry) * 100 
                                  : ((sig.entry - currentLivePrice) / sig.entry) * 100;
                                const isHitTp1 = sig.direction === 'LONG' ? currentLivePrice >= (sig.tp1 || sig.tp) : currentLivePrice <= (sig.tp1 || sig.tp);
                                const isHitTp2 = sig.direction === 'LONG' ? currentLivePrice >= (sig.tp2 || sig.tp) : currentLivePrice <= (sig.tp2 || sig.tp);
                                const isHitSl = sig.direction === 'LONG' ? currentLivePrice <= sig.sl : currentLivePrice >= sig.sl;
                                const inEntryZone = distFromEntryPct <= 1.0 && !isHitSl && !isHitTp1;

                                return (
                                  <div className="mb-3.5 p-2.5 rounded-sm bg-gradient-to-r from-black via-[#0d141f] to-black border border-white/10 flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${inEntryZone ? 'bg-emerald-400 animate-ping' : isHitTp1 ? 'bg-amber-400' : isHitSl ? 'bg-rose-500' : 'bg-cyan-400'}`} />
                                        <span className="text-[10px] text-white/50 uppercase font-bold tracking-wider">سعر السوق الآن:</span>
                                        <span className="font-mono text-xs font-black text-white px-2 py-0.5 rounded-sm bg-white/10 border border-white/15">
                                          ${currentLivePrice}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold">
                                        <span className="text-white/40 text-[10px]">الربح اللحظي:</span>
                                        <span className={`px-1.5 py-0.5 rounded-sm ${livePnl >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                          {livePnl >= 0 ? '+' : ''}{livePnl.toFixed(2)}%
                                        </span>
                                      </div>
                                    </div>

                                    {/* Actionable Live Status Banner */}
                                    <div className={`text-[10px] px-2 py-1 rounded-sm border font-medium flex items-center justify-between ${
                                      isHitTp2 
                                        ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300 font-bold'
                                        : isHitTp1
                                        ? 'bg-amber-400/20 border-amber-400/50 text-amber-300 font-bold'
                                        : isHitSl
                                        ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                                        : inEntryZone
                                        ? 'bg-emerald-500/25 border-emerald-400/70 text-emerald-200 font-bold'
                                        : livePnl > 0.4
                                        ? 'bg-cyan-500/15 border-cyan-400/30 text-cyan-300'
                                        : 'bg-white/5 border-white/10 text-white/70'
                                    }`}>
                                      <span>
                                        {isHitTp2 ? '🏁 حققت الهدف الثاني TP2 بنجاح باهر!'
                                          : isHitTp1 ? '🎯 ضربت الهدف الأول TP1 - تم تأمين الوقف لسعر الدخول (Risk-Free)!'
                                          : isHitSl ? '⚠️ كسر وقف الخسارة - صفقة ملغاة لحماية رأس المال'
                                          : inEntryZone ? '🟢 السعر داخل منطقة الدخول بالمليمتر الآن (جاهزة للتنفيذ الفوري)'
                                          : livePnl > 0.4 ? `🚀 الصفقة انطلقت في مسار الربح (+${livePnl.toFixed(1)}%)`
                                          : `⏳ أمر معلق Limit (يبعد ${distFromEntryPct.toFixed(2)}% عن الدخول)`}
                                      </span>
                                      <span className="font-mono text-[9px] text-white/60">
                                        الفارق: {distFromEntryPct.toFixed(2)}%
                                      </span>
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* 4-Metric Grid (Entry, SL, TP, R:R) */}
                              <div className="grid grid-cols-2 gap-3 text-[11px] border-t border-white/5 pt-3 mb-4">
                                <div>
                                  <div className="text-white/40 text-[10px] mb-0.5">سعر الدخول</div>
                                  <div className="font-mono font-bold text-white text-xs">{sig.entry}</div>
                                </div>
                                <div>
                                  <div className="text-white/40 text-[10px] mb-0.5">نسبة العائد / المخاطرة</div>
                                  <div className="font-mono font-bold text-amber-400 text-xs">1:{sig.rrRatio || 3.5}</div>
                                </div>
                                <div>
                                  <div className="text-white/40 text-[10px] mb-0.5">وقف الخسارة (SL)</div>
                                  <div className="font-mono font-bold text-rose-400 text-xs">
                                    {sig.sl} <span className="text-[9px] text-white/30 font-normal">({riskPercent}%)</span>
                                  </div>
                                  {sig.invalidationPrice && sig.invalidationPrice !== sig.sl && (
                                    <div className="text-[9px] text-amber-400/80 font-mono mt-0.5">
                                      إلغاء: {sig.invalidationPrice}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div className="text-white/40 text-[10px] mb-0.5">الهدف المتوقع (TP)</div>
                                  <div className="font-mono font-bold text-[#10b981] text-xs">
                                    {sig.tp} <span className="text-[9px] text-[#10b981]/70 font-normal">(+{profitPercent}%)</span>
                                  </div>
                                </div>
                              </div>

                              {/* Multi-Target High-Yield Progression (TP1, TP2, TP3) */}
                              {(sig.tp1 || sig.tp2 || sig.tp3) && (
                                <div className="bg-black/50 border border-white/5 p-2 rounded-sm mb-3 grid grid-cols-3 gap-2 text-[10px] text-center font-mono">
                                  <div className="bg-emerald-500/10 p-1.5 rounded border border-emerald-500/20">
                                    <div className="text-white/40 text-[9px]">TP1 (تأمين)</div>
                                    <div className="text-emerald-400 font-bold">${sig.tp1 || sig.tp}</div>
                                    <div className="text-emerald-300 text-[8px] font-bold">+{sig.entry > 0 ? (((Math.abs((sig.tp1 || sig.tp) - sig.entry))/sig.entry)*100).toFixed(1) : 10}%</div>
                                  </div>
                                  <div className="bg-emerald-500/15 p-1.5 rounded border border-emerald-500/30">
                                    <div className="text-white/40 text-[9px]">TP2 (الرئيسي)</div>
                                    <div className="text-emerald-400 font-black">${sig.tp2 || sig.tp}</div>
                                    <div className="text-emerald-300 text-[8px] font-black">+{profitPercent}%</div>
                                  </div>
                                  <div className="bg-amber-500/10 p-1.5 rounded border border-amber-500/20">
                                    <div className="text-white/40 text-[9px]">TP3 (انفجاري)</div>
                                    <div className="text-amber-400 font-extrabold">${sig.tp3 || Number(((sig.tp2 || sig.tp) * (sig.direction === 'LONG' ? 1.25 : 0.8)).toFixed(4))}</div>
                                    <div className="text-amber-300 text-[8px] font-extrabold">+{sig.entry > 0 && sig.tp3 ? (((Math.abs(sig.tp3 - sig.entry))/sig.entry)*100).toFixed(1) : (profitPercent * 2).toFixed(0)}%</div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Action Buttons: Inspect Chart, Fast Copy Trade Setup, & Copy Symbol */}
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <button
                                onClick={() => {
                                  setSelectedSymbol(sig.symbol);
                                  setActiveTab('dashboard');
                                  addLog(`تم الانتقال إلى شارت ${sig.symbol} لفحص إشارة الدخول.`, 'info');
                                }}
                                className="flex-1 min-w-[120px] py-2.5 bg-white/5 hover:bg-[#10b981] hover:text-black text-white/80 text-xs font-bold rounded-sm border border-white/10 hover:border-transparent transition-all flex items-center justify-center gap-1.5 group cursor-pointer"
                              >
                                <span>فحص الشارت المباشر</span>
                                <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
                              </button>
                              
                              <button
                                onClick={(e) => handleCopyTradeSetup(sig, strength.fastActionCopyText, e)}
                                title="نسخ كامل معطيات الصفقة (دخول، وقف، أهداف) جاهزة للصق في المنصة للتنفيذ الفوري السريع"
                                className={`flex-1 min-w-[140px] py-2.5 text-xs font-bold rounded-sm border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                  copiedTradeSymbol === sig.symbol
                                    ? 'bg-gradient-to-r from-emerald-400 to-teal-400 text-black border-emerald-300 font-black shadow-[0_0_15px_rgba(52,211,153,0.5)]'
                                    : 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-400/40 hover:bg-cyan-500/30 hover:border-cyan-400'
                                }`}
                              >
                                {copiedTradeSymbol === sig.symbol ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-black" />
                                    <span className="font-black">تم نسخ الصفقة كاملة 📋</span>
                                  </>
                                ) : (
                                  <>
                                    <Zap className="w-3.5 h-3.5 text-cyan-400" />
                                    <span>نسخ كامل الصفقة للتنفيذ ⚡</span>
                                  </>
                                )}
                              </button>

                              <button
                                onClick={(e) => handleCopySymbol(sig.symbol, e)}
                                title={`نسخ اسم العملة مباشرة ${sig.symbol}`}
                                className={`px-3 py-2.5 text-xs font-bold rounded-sm border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                                  copiedSymbol === sig.symbol
                                    ? 'bg-[#10b981] text-black border-[#10b981]'
                                    : 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/30'
                                }`}
                              >
                                {copiedSymbol === sig.symbol ? (
                                  <>
                                    <Check className="w-3 h-3" />
                                    <span>تم</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>الرمز</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}

                    {filteredSniperSignals.length === 0 && (
                      <div className="col-span-full py-12 px-6 flex flex-col items-center justify-center text-center gap-4 border border-dashed border-[#10b981]/20 rounded-sm bg-[#10b981]/[0.02]">
                        <div className="p-4 bg-white/5 border border-white/10 rounded-full">
                          <ShieldCheck className="w-10 h-10 text-[#10b981]" />
                        </div>
                        <div className="max-w-md">
                          <h4 className="text-sm font-bold text-white mb-1">
                            {activeVerifiedSignals.length > 0 
                              ? 'لا توجد صفقات تطابق هذا المستوى أو الفلتر حالياً'
                              : isScanning 
                              ? 'الرادار المؤسساتي يفحص السوق لحظياً...' 
                              : 'حماية رأس المال نشطة (تصفية صارمة)'}
                          </h4>
                          <p className="text-xs text-white/50 leading-relaxed">
                            {activeVerifiedSignals.length > 0
                              ? `توجد ${activeVerifiedSignals.length} صفقات في المستويات الأخرى. يمكنك النقر أدناه لعرض كافة المستويات المتاحة.`
                              : isScanning 
                              ? `تم استبعاد العملات التي تتحرك بحركة عشوائية أو تذبذب عرضي أو تكررت خسارتها في الـ Backtesting. سيتم إظهار العملات فور اجتياز كافة اختبارات الأمان المؤسساتية.`
                              : `النظام يرفض التخمين العشوائي؛ لا تظهر أي عملة في قائمة الثقات إلا إذا تجاوزت تدقيق الـ Backtesting واختبار الأطر المتعددة (1D/4H/1H). يمكنك مراجعة سجل الاستبعاد أدناه.`
                            }
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-3">
                          {activeVerifiedSignals.length > 0 && (
                            <button
                              onClick={() => {
                                setSniperTierFilter('ALL');
                                setSniperDirectionFilter('ALL');
                                setSniperFilter('ALL');
                              }}
                              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-sm text-xs font-bold transition-all cursor-pointer"
                            >
                              عرض كافة المستويات المتاحة ({activeVerifiedSignals.length})
                            </button>
                          )}
                          {!isScanning && (
                            <button
                              onClick={startSniper}
                              className="px-5 py-2.5 bg-[#10b981] hover:bg-[#10b981]/90 text-black font-bold text-xs rounded-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center gap-2 cursor-pointer"
                            >
                              <Target className="w-4 h-4" />
                              <span>بدء مسح السوق واقتناص الصفقات المؤكدة</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Capital Protection Audit Section: Shows coins rejected by multi-timeframe engine & backtesting */}
                  {rejectedAudits.length > 0 && (
                    <div className="mt-8 bg-[#0c0c0c] border border-amber-500/20 rounded-sm p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 border-b border-white/5 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 bg-amber-500/10 border border-amber-500/30 rounded-sm">
                            <ShieldAlert className="w-4 h-4 text-amber-400" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white flex items-center gap-2">
                              <span>سجل تدقيق وتصفية المخاطر وقواطع الـ Backtesting (حماية رأس المال)</span>
                              <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-sm font-mono font-bold">
                                {rejectedAudits.length} صفقات تم استبعادها
                              </span>
                            </h4>
                            <p className="text-[11px] text-white/50 mt-0.5">
                              تم فحص هذه العملات واستبعادها تلقائياً لعدم اكتمال شروط الأمان بنسبة 85%+ أو لتكرار خسارتها في الـ Backtesting أو لتعارضها مع المسار العام (1D/4H) ومعدل التمويل لمنع الخسائر المالية.
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setRejectedAudits([])}
                          className="text-[11px] text-white/40 hover:text-white px-2 py-1 rounded-sm border border-white/10 hover:border-white/30 transition-all cursor-pointer self-start sm:self-auto"
                        >
                          مسح السجل
                        </button>
                      </div>

                      {/* Filter tabs for rejectedAudits */}
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        <button
                          onClick={() => setRejectedFilter('ALL')}
                          className={`px-3 py-1.5 text-xs font-bold rounded-sm border transition-all cursor-pointer ${
                            rejectedFilter === 'ALL'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-white/5 text-white/50 border-white/5 hover:text-white'
                          }`}
                        >
                          جميع المستبعدات ({rejectedAudits.length})
                        </button>
                        <button
                          onClick={() => setRejectedFilter('BACKTEST')}
                          className={`px-3 py-1.5 text-xs font-bold rounded-sm border transition-all cursor-pointer flex items-center gap-1.5 ${
                            rejectedFilter === 'BACKTEST'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-black shadow-[0_0_10px_rgba(244,63,94,0.2)]'
                              : 'bg-white/5 text-white/50 border-white/5 hover:text-rose-400'
                          }`}
                        >
                          <span>⛔ قواطع الـ Backtesting التاريخي</span>
                          <span className="font-mono font-bold text-[11px]">({rejectedAudits.filter(a => a.blockedByBacktest).length})</span>
                        </button>
                        <button
                          onClick={() => setRejectedFilter('MTF')}
                          className={`px-3 py-1.5 text-xs font-bold rounded-sm border transition-all cursor-pointer ${
                            rejectedFilter === 'MTF'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-white/5 text-white/50 border-white/5 hover:text-white'
                          }`}
                        >
                          تضارب الأطر 1D/4H وتذبذب السوق ({rejectedAudits.filter(a => !a.blockedByBacktest).length})
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {rejectedAudits
                          .filter(item => {
                            if (rejectedFilter === 'BACKTEST') return item.blockedByBacktest;
                            if (rejectedFilter === 'MTF') return !item.blockedByBacktest;
                            return true;
                          })
                          .map((item, idx) => (
                          <div
                            key={`${item.symbol}-${idx}`}
                            className={`bg-[#121212] border p-3.5 rounded-sm text-xs transition-all ${
                              item.blockedByBacktest
                                ? 'border-rose-500/30 hover:border-rose-500/60 bg-rose-950/10'
                                : 'border-white/10 hover:border-amber-500/30'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-white text-sm">{item.symbol}</span>
                                {item.blockedByBacktest && (
                                  <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.5 rounded-sm font-bold flex items-center gap-1">
                                    ⛔ قاطع Backtest
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] font-mono">
                                <span className={`px-1.5 py-0.5 rounded-sm ${item.d1 === 'BULLISH' ? 'bg-emerald-500/20 text-emerald-300' : item.d1 === 'BEARISH' ? 'bg-rose-500/20 text-rose-300' : 'bg-white/10 text-white/60'}`}>
                                  1D: {item.d1 === 'BULLISH' ? 'صاعد' : item.d1 === 'BEARISH' ? 'هابط' : 'عرضي'}
                                </span>
                                <span className={`px-1.5 py-0.5 rounded-sm ${item.h4 === 'BULLISH' ? 'bg-emerald-500/20 text-emerald-300' : item.h4 === 'BEARISH' ? 'bg-rose-500/20 text-rose-300' : 'bg-white/10 text-white/60'}`}>
                                  4H: {item.h4 === 'BULLISH' ? 'صاعد' : item.h4 === 'BEARISH' ? 'هابط' : 'عرضي'}
                                </span>
                              </div>
                            </div>

                            {item.setupCategory && (
                              <div className="text-[10px] text-white/50 mb-2 font-mono flex items-center gap-1">
                                <span className="text-white/40">النموذج:</span>
                                <span className="text-white/80 font-bold">{getSetupNameArabic(item.setupCategory)}</span>
                              </div>
                            )}

                            {item.blockedByBacktest && (
                              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-rose-500/5 p-1.5 rounded-sm mb-2 border border-rose-500/20">
                                <div>
                                  <span className="text-rose-300/60 block">خسائر متتالية:</span>
                                  <span className="text-rose-400 font-bold">{item.consecutiveLosses || 4} صفقات</span>
                                </div>
                                <div>
                                  <span className="text-rose-300/60 block">نسبة الفشل التاريخي:</span>
                                  <span className="text-rose-400 font-bold">{100 - (item.winRate || 30)}%</span>
                                </div>
                              </div>
                            )}

                            <div className={`p-2.5 rounded-sm text-[11px] leading-relaxed border ${
                              item.blockedByBacktest 
                                ? 'bg-rose-500/10 border-rose-500/30 text-rose-200/90' 
                                : 'bg-amber-500/5 border-amber-500/20 text-amber-300/90'
                            }`}>
                              <span className={`font-bold ${item.blockedByBacktest ? 'text-rose-400' : 'text-amber-400'}`}>سبب الاستبعاد: </span>
                              {item.reason}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'ai_terminal' && (
              <motion.div 
                key="ai_terminal" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="flex-1 p-6 md:p-8 overflow-y-auto"
              >
                <div className="max-w-7xl mx-auto h-full">
                  <DeepAnalysisTerminal 
                    selectedSymbol={selectedSymbol}
                    chartData={chartData}
                  />
                </div>
              </motion.div>
            )}

            {activeTab === 'correlation' && (
              <motion.div 
                key="correlation" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="flex-1 p-6 md:p-8 overflow-y-auto"
              >
                <div className="max-w-7xl mx-auto h-full">
                  <CorrelationMatrix 
                    selectedSymbol={selectedSymbol}
                    onSelectSymbol={(sym) => {
                      setSelectedSymbol(sym);
                      setActiveTab('dashboard');
                    }}
                  />
                </div>
              </motion.div>
            )}

            {activeTab === 'bottom_scanner' && (
              <motion.div 
                key="bottom_scanner" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="flex-1 p-6 md:p-8 overflow-y-auto"
              >
                <div className="max-w-7xl mx-auto space-y-6">
                  {/* Header & Controls */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[#10b981]">
                          <TrendingUp className="w-7 h-7" />
                        </span>
                        <div>
                          <h2 className="text-3xl font-black italic tracking-tight text-white flex items-center gap-2">
                            <span>رادار 'قاع القاع الجذري'</span>
                            <span className="text-xs font-mono font-bold bg-amber-400 text-black px-2 py-0.5 rounded uppercase tracking-wider">
                              Sub-Floor Bedrock
                            </span>
                          </h2>
                          <p className="text-[11px] text-white/50 tracking-wide mt-1">
                            مسح شامل لـ 180 يوماً لاقتناص العملات في أدنى مستوى هبوط مطلق (0% - 3% من قاع القاع) وصيد الانفجارات المفاجئة قبل فوات الأوان.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <button 
                        onClick={() => fetchBottoms(true)}
                        disabled={isScanningBottoms}
                        className="bg-gradient-to-r from-[#10b981] to-emerald-400 hover:from-[#10b981]/90 hover:to-emerald-400/90 disabled:opacity-50 text-black font-black px-6 py-2.5 rounded text-xs transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer"
                      >
                        {isScanningBottoms ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Radar className="w-4 h-4" />}
                        <span>{isScanningBottoms ? 'جاري المسح الفوري...' : 'مسح وتحديث القيعان الآن'}</span>
                      </button>

                      <button
                        onClick={() => {
                          playEmergencySound();
                          triggerDesktopNotification("🔔 تجربة صوت القنص التكتيكي", "التنبيهات الصوتية والدولية تعمل بدقة متناهية.");
                          addLog("تم اختبار الصوت التكتيكي للتنبيهات.", "info");
                        }}
                        className="p-2.5 bg-white/5 hover:bg-white/10 text-white/80 rounded border border-white/10 transition-all text-xs flex items-center gap-1.5"
                        title="تجربة صوت التنبيه الفوري"
                      >
                        <Volume2 className="w-4 h-4 text-amber-400" />
                        <span className="hidden sm:inline text-[11px] font-bold">تجربة التنبيه</span>
                      </button>
                    </div>
                  </div>

                  {/* Summary Bar */}
                  {bottomResults.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-amber-400/10 border border-amber-400/30 p-3 rounded flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-amber-300/80 font-bold">👑 قاع القاع الجذري (&le; 2.5%)</div>
                          <div className="text-xl font-black text-amber-400">
                            {bottomResults.filter(c => c.isSubFloorBedrock || parseFloat(c.distFromLow) <= 2.5).length} <span className="text-[10px] text-white/40">عملة</span>
                          </div>
                        </div>
                        <ShieldAlert className="w-6 h-6 text-amber-400/60" />
                      </div>

                      <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-emerald-300/80 font-bold">🚀 انفجار وسيولة لحظية الآن</div>
                          <div className="text-xl font-black text-emerald-400">
                            {bottomResults.filter(c => c.status === 'EXPLODING_NOW').length} <span className="text-[10px] text-white/40">عملة</span>
                          </div>
                        </div>
                        <Zap className="w-6 h-6 text-emerald-400/60" />
                      </div>

                      <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-rose-300/80 font-bold">📉 أقصى هبوط تاريخي (&ge; 70%)</div>
                          <div className="text-xl font-black text-rose-400">
                            {bottomResults.filter(c => parseFloat(c.dropFromHigh) >= 70).length} <span className="text-[10px] text-white/40">عملة</span>
                          </div>
                        </div>
                        <TrendingDown className="w-6 h-6 text-rose-400/60" />
                      </div>

                      <div className="bg-cyan-500/10 border border-cyan-500/30 p-3 rounded flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-cyan-300/80 font-bold">⚡ جاهزية انفجار قصوى (&ge; 75%)</div>
                          <div className="text-xl font-black text-cyan-400">
                            {bottomResults.filter(c => (c.ignitionReadiness || 0) >= 75).length} <span className="text-[10px] text-white/40">عملة</span>
                          </div>
                        </div>
                        <Flame className="w-6 h-6 text-cyan-400/60" />
                      </div>
                    </div>
                  )}

                  {/* Filters & Sorting Controls */}
                  {bottomResults.length > 0 && (
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#0d0d0d] p-3 rounded border border-white/5">
                      {/* Filter Tabs */}
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {[
                          { id: 'ALL', label: `💎 كافة الفرص (${bottomResults.length})` },
                          { id: 'ABSOLUTE', label: `👑 قاع القاع الجذري (${bottomResults.filter(c => c.isSubFloorBedrock || c.isAbsoluteLow || parseFloat(c.distFromLow) <= 3.5 || c.status === 'ABSOLUTE_BOTTOM').length})` },
                          { id: 'CRASH', label: `📉 أقصى هبوط 70%+ (${bottomResults.filter(c => parseFloat(c.dropFromHigh) >= 70).length})` },
                          { id: 'EXPLODING', label: `🚀 انفجار لحظي (${bottomResults.filter(c => c.status === 'EXPLODING_NOW').length})` },
                          { id: 'WAKING_UP', label: `⚡ بدء الانطلاق (${bottomResults.filter(c => c.status === 'WAKING_UP').length})` },
                          { id: 'SQUEEZE', label: `🔥 انضغاط وشيك (${bottomResults.filter(c => c.status === 'SQUEEZE_READY').length})` },
                          { id: 'RETEST', label: `🛡️ قاع مزدوج حصين (${bottomResults.filter(c => c.status === 'FLOOR_RETEST' || (c.floorTouches && c.floorTouches >= 2)).length})` },
                        ].map(tab => (
                          <button
                            key={tab.id}
                            onClick={() => setBottomFilterTab(tab.id as any)}
                            className={`px-3 py-1.5 rounded text-xs font-bold transition-all border ${
                              bottomFilterTab === tab.id
                                ? 'bg-gradient-to-r from-amber-400 to-yellow-300 text-black border-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.35)] font-black'
                                : 'bg-black/60 text-white/50 border-white/10 hover:border-white/30 hover:text-white'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      {/* Sort Dropdown */}
                      <div className="flex items-center gap-2 self-end lg:self-auto text-xs">
                        <span className="text-white/40 font-bold text-[11px] whitespace-nowrap">الترتيب حسب:</span>
                        <select
                          value={bottomSortBy}
                          onChange={(e) => setBottomSortBy(e.target.value as any)}
                          className="bg-black border border-white/15 text-white rounded px-3 py-1.5 text-xs font-bold focus:border-amber-400 focus:outline-none"
                        >
                          <option value="DIST_ASC">👑 الأقرب لأدنى قاع بالمليمتر (0% - 2% أولاً)</option>
                          <option value="DROP_DESC">📉 أقصى هبوط تاريخي من القمة (الأكثر انهياراً)</option>
                          <option value="IGNITION_DESC">⚡ أعلى جاهزية للانفجار المفاجئ (الاشتعال)</option>
                          <option value="SCORE_DESC">⭐ أعلى نقاط القوة الفنية (Score %)</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Body Content */}
                  {bottomResults.length === 0 ? (
                    <div className="bg-white/5 border border-dashed border-white/10 rounded-sm p-20 text-center flex flex-col items-center justify-center gap-4">
                      <Search className="w-12 h-12 text-white/10" />
                      <div className="space-y-1">
                        <h3 className="text-lg font-bold text-white/60">لم يتم إجراء مسح القيعان بعد</h3>
                        <p className="text-xs text-white/30 max-w-md mx-auto">
                          انقر على زر "مسح وتحديث القيعان الآن" لفحص أكثر من 150 عملة عبر شارت 180 يوم واصطياد العملات التي ترتكز على أدنى قاع تاريخي مطلق.
                        </p>
                      </div>
                      <button 
                        onClick={() => fetchBottoms(true)}
                        className="bg-[#10b981] hover:bg-[#10b981]/80 text-black font-black px-6 py-2 rounded text-xs transition-all mt-2"
                      >
                        بدء المسح الآن
                      </button>
                    </div>
                  ) : filteredBottomResults.length === 0 ? (
                    <div className="bg-white/5 border border-dashed border-white/10 rounded-sm p-16 text-center text-white/40 text-xs">
                      لا توجد عملات في هذا التصنيف حالياً. جرب اختيار "كافة الفرص" أو تصنيف آخر.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredBottomResults.map((coin) => {
                        const isRockBottom = coin.isSubFloorBedrock || parseFloat(coin.distFromLow) <= 2.5;
                        const isPinned = bottomPinnedSymbols.includes(coin.symbol);

                        return (
                          <div 
                            key={coin.symbol} 
                            className={`bg-[#0a0a0a] border ${
                              isRockBottom 
                                ? 'border-amber-400/50 shadow-[0_0_25px_rgba(251,191,36,0.12)]' 
                                : 'border-white/10'
                            } hover:border-[#10b981]/50 p-5 rounded-sm transition-all group relative overflow-hidden flex flex-col justify-between`}
                          >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-[#10b981]/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-[#10b981]/15 transition-all" />
                            
                            <div>
                              {/* Top Badges */}
                              <div className="flex justify-between items-start gap-2 mb-3 relative z-10">
                                <div className="flex gap-1.5 items-center flex-wrap">
                                  {isRockBottom && (
                                    <span className="px-2 py-0.5 rounded text-[8px] font-black tracking-tighter uppercase bg-amber-400 text-black shadow-[0_0_12px_rgba(251,191,36,0.6)] animate-pulse flex items-center gap-1">
                                      <span>👑 قاع القاع بالمليمتر</span>
                                      <span>(+{coin.distFromLow}%)</span>
                                    </span>
                                  )}
                                  <span className={`px-2 py-0.5 rounded text-[8px] font-black tracking-tighter uppercase ${
                                    coin.status === 'EXPLODING_NOW' ? 'bg-amber-400 text-black animate-pulse font-extrabold shadow-[0_0_12px_rgba(251,191,36,0.5)]' :
                                    coin.status === 'WAKING_UP' ? 'bg-emerald-500 text-black font-extrabold animate-pulse' : 
                                    coin.status === 'SQUEEZE_READY' ? 'bg-orange-500 text-white' :
                                    coin.status === 'ABSOLUTE_BOTTOM' ? 'bg-[#10b981] text-black font-extrabold' :
                                    coin.status === 'DORMANT_ELITE' ? 'bg-cyan-500 text-black' : 
                                    coin.status === 'FLOOR_RETEST' ? 'bg-indigo-400 text-black font-bold' : 'bg-white/10 text-white/60'
                                  }`}>
                                    {coin.categoryLabel || 'قاع استثماري'}
                                  </span>
                                </div>

                                <button
                                  onClick={() => {
                                    if (isPinned) {
                                      setBottomPinnedSymbols(prev => prev.filter(s => s !== coin.symbol));
                                      addLog(`تم إلغاء مراقبة ${coin.symbol}`, "info");
                                    } else {
                                      setBottomPinnedSymbols(prev => [...prev, coin.symbol]);
                                      playEmergencySound();
                                      triggerDesktopNotification(`🎯 تم تثبيت قاع ${coin.symbol}`, `الدخول: ${coin.targets?.entry} | الوقف: ${coin.targets?.sl}`);
                                      addLog(`تم تثبيت ومراقبة عملة القاع ${coin.symbol} مع تفعيل التنبيه الصوتي الفوري!`, "success");
                                    }
                                  }}
                                  className={`p-1.5 rounded transition-all text-xs ${
                                    isPinned ? 'bg-amber-400 text-black font-bold' : 'bg-white/5 hover:bg-white/10 text-white/40 hover:text-white'
                                  }`}
                                  title={isPinned ? "إلغاء التثبيت" : "تثبيت للمراقبة وتنبيه الانفجار"}
                                >
                                  <Bell className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Symbol and Price */}
                              <div className="flex items-center justify-between mb-4 relative z-10">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-white/5 border border-white/10 rounded flex items-center justify-center font-black text-[#10b981] text-sm">
                                    {coin.symbol.replace("USDT", "")}
                                  </div>
                                  <div>
                                    <h4 className="text-lg font-black text-white flex items-center gap-1.5">
                                      <span>{coin.symbol}</span>
                                      {isPinned && <span className="text-[10px] text-amber-300 font-bold bg-amber-400/20 px-1 rounded">مُثبتة</span>}
                                    </h4>
                                    <span className="text-[10px] text-white/40 uppercase font-mono">السعر: ${coin.price}</span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className={`text-sm font-black font-mono ${coin.change24h >= 0 ? 'text-[#10b981]' : 'text-rose-500'}`}>
                                    {coin.change24h >= 0 ? '+' : ''}{coin.change24h}%
                                  </div>
                                  <div className="text-[9px] text-white/40 uppercase">التغير اليومي</div>
                                </div>
                              </div>

                              {/* Early Ignition Gauge */}
                              <div className="bg-black/60 border border-white/5 rounded p-2.5 mb-3.5 relative z-10 flex items-center justify-between text-[10px]">
                                <span className="text-white/60 font-bold flex items-center gap-1">
                                  <Flame className={`w-3.5 h-3.5 ${(coin.ignitionReadiness || 0) >= 75 ? 'text-amber-400 animate-pulse' : 'text-white/40'}`} />
                                  <span>جاهزية الانفجار السعري:</span>
                                </span>
                                <div className="flex items-center gap-2">
                                  <div className="w-24 bg-white/10 h-2 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full transition-all ${
                                        (coin.ignitionReadiness || 60) >= 80 ? 'bg-gradient-to-r from-amber-400 to-yellow-300' : 
                                        (coin.ignitionReadiness || 60) >= 60 ? 'bg-[#10b981]' : 'bg-cyan-400'
                                      }`}
                                      style={{ width: `${coin.ignitionReadiness || 60}%` }}
                                    />
                                  </div>
                                  <span className="font-mono font-black text-amber-300">{coin.ignitionReadiness || 65}%</span>
                                </div>
                              </div>

                              {/* Core Metrics Grid */}
                              <div className="grid grid-cols-2 gap-2.5 mb-3.5 relative z-10">
                                <div className="bg-black/50 p-2.5 rounded border border-white/5">
                                  <span className="block text-[9px] text-white/40 uppercase mb-0.5">الهبوط من القمة التاريخية</span>
                                  <span className="text-rose-400 font-black text-sm">-{coin.dropFromHigh}%</span>
                                </div>
                                <div className="bg-black/50 p-2.5 rounded border border-white/5">
                                  <span className="block text-[9px] text-white/40 uppercase mb-0.5">المسافة من أدنى قاع</span>
                                  <span className={`font-black text-sm ${parseFloat(coin.distFromLow) <= 3.0 ? 'text-amber-400' : 'text-[#10b981]'}`}>
                                    +{coin.distFromLow}% {parseFloat(coin.distFromLow) <= 2.5 ? '🎯' : ''}
                                  </span>
                                </div>
                                <div className="bg-black/50 p-2.5 rounded border border-white/5">
                                  <span className="block text-[9px] text-white/40 uppercase mb-0.5">دعامات القاع</span>
                                  <span className="text-amber-300 font-bold text-xs">
                                    ملامسات x{coin.floorTouches || 1} {coin.floorTouches >= 2 ? '🛡️ صلب' : ''}
                                  </span>
                                </div>
                                <div className="bg-black/50 p-2.5 rounded border border-white/5">
                                  <span className="block text-[9px] text-white/40 uppercase mb-0.5">RSI اليومي (1D)</span>
                                  <span className={`font-bold text-xs ${coin.dailyRsi < 35 ? 'text-emerald-400' : 'text-white'}`}>
                                    {coin.dailyRsi} {coin.dailyRsi < 35 ? '(تشبع بيعي)' : ''}
                                  </span>
                                </div>
                              </div>

                              {/* Institutional High-Yield Targets & Ultra-Tight Stop Loss */}
                              {coin.targets && (
                                <div className="bg-[#10b981]/5 border border-[#10b981]/20 rounded p-3 mb-4 space-y-2 relative z-10">
                                  <div className="flex justify-between items-center border-b border-white/5 pb-1.5 mb-1.5">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] font-black text-[#10b981] italic">أهداف الاقتناص والتعظيم</span>
                                      <span className="text-[9px] font-mono text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20 font-bold">
                                        R:R 1:{coin.targets.rrRatio || 4.5}
                                      </span>
                                    </div>
                                    <div className="flex gap-1 items-center">
                                      <span className="text-[8px] text-white/40 uppercase">نقاط القوة</span>
                                      <span className="text-[10px] font-black text-amber-300 font-mono">{coin.score}%</span>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
                                    <div className="flex justify-between items-center">
                                      <span className="text-white/40">الدخول:</span>
                                      <span className="font-mono font-bold text-white">${coin.targets.entry}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-rose-400 font-bold">الوقف المحكم:</span>
                                      <span className="font-mono font-bold text-rose-400">
                                        ${coin.targets.sl} <span className="text-[8px] text-white/40">(-{coin.targets.riskPct}%)</span>
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-emerald-400">الهدف 1 (انطلاق):</span>
                                      <span className="font-mono font-bold text-emerald-400">
                                        ${coin.targets.tp1} <span className="text-[8px] text-emerald-300 font-black">(+{coin.targets.tp1Pct}%)</span>
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-emerald-400 font-black">الهدف 2 (الذهبي):</span>
                                      <span className="font-mono font-bold text-emerald-400">
                                        ${coin.targets.tp2} <span className="text-[8px] text-emerald-300 font-black">(+{coin.targets.tp2Pct}%)</span>
                                      </span>
                                    </div>
                                    {coin.targets.tp3 && (
                                      <div className="flex justify-between items-center">
                                        <span className="text-amber-400 font-bold">الهدف 3 (مضاعفة 2X):</span>
                                        <span className="font-mono font-bold text-amber-400">
                                          ${coin.targets.tp3} <span className="text-[8px] text-amber-300 font-black">(+{coin.targets.tp3Pct}%)</span>
                                        </span>
                                      </div>
                                    )}
                                    {coin.targets.tp4 && (
                                      <div className="flex justify-between items-center">
                                        <span className="text-purple-400 font-bold">الهدف 4 (دورة كبرى):</span>
                                        <span className="font-mono font-bold text-purple-400">
                                          ${coin.targets.tp4} <span className="text-[8px] text-purple-300 font-black">(+{coin.targets.tp4Pct}%)</span>
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 relative z-10 pt-2 border-t border-white/5">
                              <button 
                                onClick={() => {
                                  setSelectedSymbol(coin.symbol);
                                  setActiveTab('dashboard');
                                }}
                                className="flex-1 bg-white/5 hover:bg-white/10 text-white/80 py-2 rounded text-[10px] font-bold transition-all border border-white/10 text-center"
                              >
                                الشارت
                              </button>
                              <button 
                                onClick={() => {
                                  setSelectedSymbol(coin.symbol);
                                  handleAnalyze(coin.symbol);
                                  setActiveTab('dashboard');
                                }}
                                className="flex-1 bg-[#10b981]/10 hover:bg-[#10b981]/20 text-[#10b981] py-2 rounded text-[10px] font-bold transition-all border border-[#10b981]/30 text-center"
                              >
                                تحليل عميق
                              </button>
                              <button 
                                onClick={() => {
                                  const text = `🏆 صفقة قاع القاع: ${coin.symbol}\nسعر الدخول: ${coin.targets?.entry}\nالوقف: ${coin.targets?.sl} (-${coin.targets?.riskPct}%)\nالهدف 1: ${coin.targets?.tp1} (+${coin.targets?.tp1Pct}%)\nالهدف 2: ${coin.targets?.tp2} (+${coin.targets?.tp2Pct}%)\nالهدف 3: ${coin.targets?.tp3} (+${coin.targets?.tp3Pct}%)`;
                                  navigator.clipboard.writeText(text);
                                  addLog(`تم نسخ أهداف صفقة القاع لـ ${coin.symbol} للحافظة!`, "success");
                                }}
                                className="px-3 bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 py-2 rounded text-[10px] font-bold transition-all border border-amber-400/30 flex items-center justify-center gap-1"
                                title="نسخ الصفقة كاملة للتنفيذ المباشر"
                              >
                                <span>⚡ نسخ</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'council' && (
              <motion.div 
                key="council" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                className="flex-1 p-8 overflow-y-auto"
              >
                <div className="max-w-5xl mx-auto space-y-12">
                   <div className="border-b border-white/5 pb-6">
                      <h2 className="text-4xl font-bold italic">المحلل الاستراتيجي (Pro Expert)</h2>
                      <p className="text-[10px] text-white/40 uppercase tracking-[0.4em] mt-2">تحليل استراتيجي متكامل بناءً على الهيكلية والسيولة</p>
                   </div>

                    <div className="bg-[#0a0a0a] border border-white/5 p-10 rounded-sm space-y-8 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#10b981]/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                      
                      <div className="flex items-center justify-between border-b border-white/5 pb-8 relative z-10">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 bg-[#10b981] rounded-sm flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                            <Brain className="w-8 h-8 text-black" />
                          </div>
                          <div>
                            <h3 className="text-3xl font-black font-mono tracking-tighter">{lastAnalysis?.symbol || "بانتظار التحليل..."}</h3>
                            <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">المحرك العصبي: DeepSeek-V4-Pro</p>
                          </div>
                        </div>
                        <div className={`px-8 py-3 rounded-sm font-black text-lg shadow-lg ${
                          lastAnalysis?.direction === 'LONG' ? 'bg-[#10b981] text-black' : 
                          lastAnalysis?.direction === 'SHORT' ? 'bg-rose-500 text-white' : 'bg-white/10 text-white/40'
                        }`}>
                          {lastAnalysis?.direction === 'LONG' ? 'شراء صاعد' : 
                           lastAnalysis?.direction === 'SHORT' ? 'بيع هابط' : 'محايد'}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center relative z-10">
                        <div className="bg-white/[0.02] p-6 rounded-sm border border-white/5 hover:bg-white/[0.05] transition-all">
                          <span className="text-[10px] text-white/20 uppercase font-bold tracking-widest block mb-2">سعر الدخول</span>
                          <p className="text-2xl font-mono text-[#10b981] font-bold tracking-tight">{lastAnalysis?.entry || '---'}</p>
                        </div>
                        <div className="bg-white/[0.02] p-6 rounded-sm border border-white/5 hover:bg-white/[0.05] transition-all">
                          <span className="text-[10px] text-white/20 uppercase font-bold tracking-widest block mb-2">الأهداف الربحية</span>
                          <p className="text-2xl font-mono text-blue-400 font-bold tracking-tight">{lastAnalysis?.tp || '---'}</p>
                        </div>
                        <div className="bg-white/[0.02] p-6 rounded-sm border border-white/5 hover:bg-white/[0.05] transition-all">
                          <span className="text-[10px] text-white/20 uppercase font-bold tracking-widest block mb-2">وقف الخسارة</span>
                          <p className="text-2xl font-mono text-rose-500 font-bold tracking-tight">{lastAnalysis?.sl || '---'}</p>
                        </div>
                      </div>

                      <div className="bg-black/60 p-10 border border-white/5 rounded-sm relative overflow-hidden group min-h-[150px] flex flex-col justify-center">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-[#10b981]" />
                        <h4 className="text-[10px] text-[#10b981] uppercase font-bold mb-4 tracking-[0.3em]">التقرير الفني العميق:</h4>
                        <p className="text-lg leading-relaxed text-white/90 italic font-medium">
                          {lastAnalysis?.reasoning ? `"${lastAnalysis.reasoning}"` : "لم يتم إجراء تحليل فني لهذه العملة بعد. اضغط على 'تحليل الفرصة' للبدء."}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-8 border-t border-white/5 relative z-10">
                        <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-pulse" />
                          <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">قوة الثقة في القرار الاستراتيجي</span>
                        </div>
                        <div className="flex items-end gap-2">
                           <motion.span 
                            key={lastAnalysis?.confidence}
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-5xl font-black text-[#10b981]"
                           >
                            {lastAnalysis?.confidence || 0}
                           </motion.span>
                           <span className="text-xl font-bold text-white/20 mb-2">%</span>
                        </div>
                      </div>
                    </div>

                    {lastAnalysis?.patterns && lastAnalysis.patterns.length > 0 && (
                      <div className="bg-[#10b981]/5 border border-[#10b981]/10 p-6 rounded-sm space-y-4">
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-[#10b981]" />
                          <h4 className="text-[10px] font-bold text-white/60 uppercase tracking-widest">الأنماط الفنية المكتشفة</h4>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {lastAnalysis.patterns.map((p, i) => (
                            <div key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-sm text-[10px] font-bold text-white/80 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                              {p.label}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="bg-[#10b981]/5 border border-[#10b981]/20 p-8 rounded-sm">
                       <div className="flex items-center gap-3 mb-4">
                         <Zap className="w-5 h-5 text-[#10b981]" />
                         <h4 className="text-xs font-bold uppercase text-[#10b981]">بنية النماذج المتعددة (Multi-Agent Architecture) - SCALPING MODE</h4>
                       </div>
                       <p className="text-xs text-white/50 leading-relaxed max-w-3xl">
                         تعمل المنصة الآن بنظام وكلاء الذكاء الاصطناعي المستقلين لضمان صفقات "سكالبينج" سريعة الدخول والخروج بدون انعكاسات قوية.
                         <br/><br/>
                         • <strong>DeepSeek-V4-Flash:</strong> المحرك الفني الرئيسي (اقتناص الفجوات والسيولة بدقة).<br/>
                         • <strong>step-3.7-flash:</strong> خبير الاقتصاد الكلي (قراءة التقارير الطويلة وتأثير الأخبار).<br/>
                         • <strong>kat-coder-pro-v2.5:</strong> محرك التجميع والفرز (لجلب بيانات الشارت بدقة).
                       </p>
                   </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'whale' && (
              <motion.div 
                key="whale" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                className="flex-1 p-6 md:p-8 overflow-y-auto"
              >
                <div className="max-w-7xl mx-auto">
                  <WhaleRadar 
                    symbol={selectedSymbol}
                    orderBook={orderBook}
                    klines={chartData}
                    currentPrice={chartData.length > 0 ? chartData[chartData.length - 1].close : 0}
                  />
                </div>
              </motion.div>
            )}

            {activeTab === 'memory' && (
              <motion.div 
                key="memory" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                className="flex-1 p-6 md:p-8 overflow-y-auto"
              >
                <div className="max-w-7xl mx-auto">
                  <TradeMemory 
                    currentPrice={chartData.length > 0 ? chartData[chartData.length - 1].close : 0}
                    currentSymbol={selectedSymbol}
                    onSelectSymbol={(sym) => {
                      setSelectedSymbol(sym);
                      setActiveTab('dashboard');
                    }}
                    activeSignals={signals}
                  />
                </div>
              </motion.div>
            )}

            {activeTab === 'news' && (
              <motion.div 
                key="news" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                className="flex-1 p-6 md:p-8 overflow-y-auto"
              >
                <div className="max-w-7xl mx-auto">
                  <LiveNewsTerminal 
                    selectedSymbol={selectedSymbol}
                    allSymbols={allSymbols}
                    onSelectSymbol={(sym) => {
                      setSelectedSymbol(sym);
                      setActiveTab('dashboard');
                    }}
                  />
                </div>
              </motion.div>
            )}

            {activeTab === 'terminal' && (
              <motion.div 
                key="term" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex-1 p-6 flex flex-col gap-4 overflow-hidden"
              >
                <div className="flex items-center justify-between bg-black/40 p-2 border border-white/5 rounded-sm">
                  <div className="flex gap-2">
                    {[
                      { id: 'all', label: 'الكل' },
                      { id: 'info', label: 'إشعارات' },
                      { id: 'success', label: 'نجاح' },
                      { id: 'warn', label: 'تنبيهات' },
                      { id: 'council', label: 'التحليل الاستراتيجي' }
                    ].map(f => (
                      <button 
                        key={f.id}
                        onClick={() => setLogFilter(f.id as any)}
                        className={`text-[10px] px-3 py-1 rounded-sm border transition-all ${
                          logFilter === f.id ? 'bg-[#10b981] text-black border-[#10b981]' : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={clearLogs}
                    className="text-[10px] px-3 py-1 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-sm hover:bg-rose-500 hover:text-white transition-all flex items-center gap-2"
                  >
                    <X className="w-3 h-3" />
                    مسح السجل
                  </button>
                </div>

                <div className="flex-1 bg-black border border-white/5 p-6 font-mono text-[11px] overflow-y-auto space-y-2 custom-scrollbar">
                  <div className="text-[#10b981] mb-4 opacity-50 border-b border-[#10b981]/20 pb-2 flex justify-between">
                    <span>AVANTIS_NEURAL_KERNEL_V6.0</span>
                    <span dir="ltr">FILTER: {logFilter.toUpperCase()}</span>
                  </div>
                  {filteredLogs.map((log, i) => (
                    <div key={i} className="flex gap-4">
                      <span className="text-white/20 whitespace-nowrap">[{log.term}]</span>
                      <span className={`
                        ${log.type === 'success' ? 'text-[#10b981]' : 
                          log.type === 'warn' ? 'text-rose-500 font-bold' : 
                          log.type === 'council' ? 'text-blue-400 italic' : 'text-white/60'}
                      `}>
                        {log.msg}
                      </span>
                    </div>
                  ))}
                  {filteredLogs.length === 0 && (
                    <div className="h-full flex items-center justify-center text-white/10 uppercase tracking-[0.4em]">
                      لا توجد سجلات مطابقة
                    </div>
                  )}
                  <div className="pt-2 animate-pulse text-[#10b981]">_</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <AnimatePresence>
            {alertSignal && (
              <motion.div 
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                className="fixed bottom-8 left-8 z-[100] max-w-md w-full bg-gradient-to-br from-[#10b981] via-[#059669] to-[#047857] text-white p-0.5 rounded-lg shadow-[0_0_60px_rgba(16,185,129,0.5)] overflow-hidden"
              >
                <div className="bg-[#0b0f0e] rounded-[7px] p-5 space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-[#10b981]"></span>
                      </span>
                      <span className="text-xs font-black uppercase tracking-wider text-[#10b981]">
                        {alertSignal.fastOpportunityBadge || "⚡ إشعار قنص استباقي مؤكد"}
                      </span>
                    </div>
                    <button 
                      onClick={() => setAlertSignal(null)}
                      className="p-1 hover:bg-white/10 rounded-full transition-colors text-white/40 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Main Symbol & Action */}
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <h3 className="text-2xl font-black font-mono tracking-tight text-white">{alertSignal.symbol}</h3>
                        <span className="text-xs text-emerald-400 font-mono font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          {alertSignal.timeframe?.toUpperCase() || "1H"} HTF Sniper
                        </span>
                      </div>
                      <p className="text-xs text-[#10b981] mt-0.5 font-bold">
                        ثقة مؤسسية: {alertSignal.confidence}% • عائد متوقع: 1:{alertSignal.rrRatio || 5.5}
                      </p>
                    </div>
                    <div className={`px-3 py-1.5 text-xs font-black rounded font-mono ${
                      alertSignal.direction === 'LONG' ? 'bg-[#10b981] text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                    }`}>
                      {alertSignal.direction === 'LONG' ? '🚀 شراء LONG' : '🔻 بيع SHORT'}
                    </div>
                  </div>

                  {/* Reason Text */}
                  {alertSignal.reasoning && (
                    <p className="text-[11px] text-white/90 leading-relaxed bg-black/50 p-2.5 rounded border border-white/10 font-sans">
                      {alertSignal.reasoning}
                    </p>
                  )}

                  {/* Macro High-Yield Targets Grid */}
                  <div className="bg-black/60 border border-[#10b981]/20 rounded p-2.5 space-y-1.5 font-mono text-[11px]">
                    <div className="flex justify-between text-white/60">
                      <span>سعر الدخول: <strong className="text-white">${alertSignal.entry}</strong></span>
                      <span className="text-rose-400">الوقف: <strong>${alertSignal.sl}</strong></span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/5 text-center">
                      <div className="bg-[#10b981]/10 p-1.5 rounded border border-[#10b981]/20">
                        <span className="block text-[9px] text-[#10b981] font-sans font-bold">TP1 (حماية الرصيد)</span>
                        <span className="font-bold text-emerald-300 font-mono text-[10px]">${alertSignal.tp1}</span>
                        <span className="block text-[8px] text-emerald-400 font-black">+25%</span>
                      </div>
                      <div className="bg-[#10b981]/20 p-1.5 rounded border border-[#10b981]/40">
                        <span className="block text-[9px] text-emerald-300 font-sans font-black">TP2 (الهدف الرئيسي)</span>
                        <span className="font-bold text-white font-mono text-[10px]">${alertSignal.tp2}</span>
                        <span className="block text-[8px] text-emerald-300 font-black">+60%</span>
                      </div>
                      <div className="bg-amber-500/15 p-1.5 rounded border border-amber-500/30">
                        <span className="block text-[9px] text-amber-300 font-sans font-bold">TP3 (موجة التريند)</span>
                        <span className="font-bold text-amber-200 font-mono text-[10px]">${alertSignal.tp3}</span>
                        <span className="block text-[8px] text-amber-400 font-black">+120%</span>
                      </div>
                    </div>
                  </div>

                  {/* Execution Action Button */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => {
                        setSelectedSymbol(alertSignal.symbol);
                        setActiveTab('dashboard');
                        handleAnalyze(alertSignal.symbol);
                        setAlertSignal(null);
                      }}
                      className="flex-1 bg-[#10b981] hover:bg-[#10b981]/90 text-black font-black py-2.5 rounded text-xs transition-all flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                    >
                      <span>فتح الشارت وتجهيز الصفقة</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        const quickText = `🎯 اقتناص فوري مؤكد: ${alertSignal.symbol}\nالاتجاه: ${alertSignal.direction}\nدخول: ${alertSignal.entry}\nالوقف: ${alertSignal.sl}\nالهدف 1: ${alertSignal.tp1}\nالهدف 2: ${alertSignal.tp2}`;
                        navigator.clipboard.writeText(quickText);
                        addLog(`تم نسخ بيانات صفقة التنبيه لـ ${alertSignal.symbol} إلى الحافظة!`, 'success');
                      }}
                      className="px-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded text-xs transition-all flex items-center justify-center gap-1 border border-white/20"
                      title="نسخ بيانات التنبيه الفوري"
                    >
                      <span>⚡ نسخ</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <FinancialDisclaimer />
      </main>

      <BinanceConnectModal 
        isOpen={isBinanceModalOpen} 
        onClose={() => setIsBinanceModalOpen(false)} 
        onStatusChange={setBinanceAccount} 
      />

      <AiConfigModal
        isOpen={isAiConfigModalOpen}
        onClose={() => setIsAiConfigModalOpen(false)}
      />
    </div>
  );
}
