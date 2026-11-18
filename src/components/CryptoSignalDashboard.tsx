import React, { useState, useEffect, useMemo } from "react";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Shield,
  Zap,
  Target,
  Copy,
  Check,
  RefreshCw,
  Sliders,
  Radio,
  ExternalLink,
  Volume2,
  VolumeX,
  Bell,
  Search,
  Filter,
  BarChart3,
  Layers,
  ChevronRight,
  Flame,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Share2,
  PieChart,
  Gauge,
  Coins,
  Sparkles,
  ArrowRight
} from "lucide-react";

export interface TimeframeSignal {
  timeframe: "15m" | "1h" | "4h" | "1d";
  direction: "BULLISH" | "BEARISH" | "NEUTRAL";
  score: number;
  rsi: number;
  macd: {
    macdLine: number;
    signalLine: number;
    histogram: number;
    crossover: string;
  };
  bollinger: {
    upper: number;
    middle: number;
    lower: number;
    percentB: number;
    isSqueeze: boolean;
  };
  emaTrend: string;
  volumeStatus: string;
}

export interface CoinSignalConsensus {
  symbol: string;
  name: string;
  currentPrice: number;
  priceChange24hPct: number;
  volume24hUsd: number;
  overallConsensus: "STRONG_BUY" | "BUY" | "NEUTRAL" | "SELL" | "STRONG_SELL";
  consensusScore: number;
  recommendedAction: string;
  category?: "L1" | "AI" | "MEME" | "DEFI" | "INFRA" | "NEW_LISTING" | "GENERAL";
  strategyTag: "DIP_CATCHER" | "VOLATILITY_BREAKOUT" | "SMC_PULLBACK" | "MOMENTUM_RALLY" | "ACCUMULATION_WAIT";
  timeframes: {
    "15m": TimeframeSignal;
    "1h": TimeframeSignal;
    "4h": TimeframeSignal;
    "1d": TimeframeSignal;
  };
  orderBookWatcher: {
    bidAskRatio: number;
    buyersPercent: number;
    sellersPercent: number;
    spreadPct: number;
    wallAlert: string;
  };
  binanceFuturesExecution: {
    action: "BUY_LONG" | "SELL_SHORT";
    limitEntry: number;
    stopLoss: number;
    takeProfit1: number;
    takeProfit2: number;
    takeProfit3: number;
    isolatedLeverage: number;
    riskRewardRatio: number;
    liquidationBufferPct: number;
    copyString: string;
  };
  timestamp: number;
}

export interface AllCoinTickerItem {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volumeUsd: number;
  high24h: number;
  low24h: number;
  category: "L1" | "AI" | "MEME" | "DEFI" | "INFRA" | "NEW_LISTING" | "GENERAL";
  quickSignal: "STRONG_BUY" | "BUY" | "NEUTRAL" | "SELL" | "STRONG_SELL";
  momentumScore: number;
}

export interface MarketSentimentData {
  fearAndGreed: {
    value: number;
    classification: string;
    descriptionArabic: string;
  };
  binanceLongShortRatio: {
    symbol: string;
    longAccountPct: number;
    shortAccountPct: number;
    ratio: number;
    sentimentSummary: string;
  };
  fundingRateStatus: {
    status: "HEALTHY" | "ELEVATED_LONG_BIAS" | "ELEVATED_SHORT_BIAS" | "TOXIC_SQUEEZE_RISK";
    warningArabic: string;
  };
  marketDominanceBtcPct: number;
  totalMarketTurnover24hUsd: number;
  totalTrackedFuturesPairs: number;
  timestamp: number;
}

interface CryptoSignalDashboardProps {
  onSelectCoin?: (symbol: string) => void;
  onOpenTradeModal?: (signal: any) => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
}

export const CryptoSignalDashboard: React.FC<CryptoSignalDashboardProps> = ({
  onSelectCoin,
  onOpenTradeModal,
  isMuted,
  setIsMuted
}) => {
  const [consensusList, setConsensusList] = useState<CoinSignalConsensus[]>([]);
  const [allCoins, setAllCoins] = useState<AllCoinTickerItem[]>([]);
  const [sentiment, setSentiment] = useState<MarketSentimentData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzingCustom, setIsAnalyzingCustom] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState<CoinSignalConsensus | null>(null);
  const [filterType, setFilterType] = useState<"ALL" | "STRONG_BUY" | "DIP" | "BREAKOUT">("ALL");
  const [activeCategory, setActiveCategory] = useState<"ALL" | "TOP_VOLUME" | "GAINERS" | "DIP" | "AI" | "MEME" | "L1" | "DEFI">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [customInputSymbol, setCustomInputSymbol] = useState("");
  const [copiedSymbol, setCopiedSymbol] = useState<string | null>(null);
  const [activeViewMode, setActiveViewMode] = useState<"ALL_COINS" | "MATRIX" | "CARDS">("ALL_COINS");
  const [desktopNotifAllowed, setDesktopNotifAllowed] = useState(false);
  const [allCoinsPageSize, setAllCoinsPageSize] = useState(60);

  // Check notification permission on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setDesktopNotifAllowed(Notification.permission === "granted");
    }
  }, []);

  const requestDesktopNotification = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const res = await Notification.requestPermission();
      if (res === "granted") {
        setDesktopNotifAllowed(true);
        new Notification("⚡ تم تفعيل تنبيهات قناص الصفقات الفورية", {
          body: "ستتلقى تنبيهات دقيقة فور وصول الصفقات المؤسساتية لمنطقة الدخول.",
          icon: "/favicon.ico"
        });
      }
    }
  };

  // Synthesizer Web Audio Sound (Radar Sonar Chime)
  const playTacticalSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.25);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // AudioContext fallback
    }
  };

  const fetchData = async (manual = false) => {
    if (manual) setIsLoading(true);
    try {
      const [resConsensus, resSentiment, resAllCoins] = await Promise.all([
        fetch(`/api/crypto-signal/consensus${manual ? "?force=true" : ""}`),
        fetch("/api/crypto-signal/sentiment"),
        fetch(`/api/crypto-signal/all-coins${manual ? "?refresh=true" : ""}`)
      ]);

      const dataConsensus = await resConsensus.json();
      const dataSentiment = await resSentiment.json();
      const dataAllCoins = await resAllCoins.json();

      if (dataConsensus.success && Array.isArray(dataConsensus.consensus)) {
        setConsensusList(dataConsensus.consensus);
        if (!selectedCoin && dataConsensus.consensus.length > 0) {
          setSelectedCoin(dataConsensus.consensus[0]);
        }
      }

      if (dataSentiment.success && dataSentiment.sentiment) {
        setSentiment(dataSentiment.sentiment);
      }

      if (dataAllCoins.success && Array.isArray(dataAllCoins.coins)) {
        setAllCoins(dataAllCoins.coins);
      }
    } catch (e) {
      console.error("Error fetching crypto signal data:", e);
    } finally {
      if (manual) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(false);
    const interval = setInterval(() => {
      fetchData(false);
    }, 25000);
    return () => clearInterval(interval);
  }, []);

  // On-demand analysis for ANY specific coin among all 745+ pairs
  const handleAnalyzeCoin = async (sym: string) => {
    if (!sym) return;
    setIsAnalyzingCustom(true);
    try {
      const cleanSym = sym.toUpperCase().trim();
      const formattedSym = cleanSym.endsWith("USDT") ? cleanSym : `${cleanSym}USDT`;
      
      const res = await fetch(`/api/crypto-signal/analyze?symbol=${encodeURIComponent(formattedSym)}`);
      const data = await res.json();
      if (data.success && data.analysis) {
        setSelectedCoin(data.analysis);
        // Also add or update in consensus list
        setConsensusList(prev => {
          const filtered = prev.filter(p => p.symbol !== data.analysis.symbol);
          return [data.analysis, ...filtered];
        });
        playTacticalSound();
      } else {
        alert(data.error || "تعذر تحليل العملة، يرجى التأكد من رمز العملة");
      }
    } catch (e) {
      console.error("Error analyzing coin:", e);
    } finally {
      setIsAnalyzingCustom(false);
    }
  };

  const handleCopyOrder = (coin: CoinSignalConsensus) => {
    navigator.clipboard.writeText(coin.binanceFuturesExecution.copyString);
    setCopiedSymbol(coin.symbol);
    setTimeout(() => setCopiedSymbol(null), 2500);
  };

  // Filtered Consensus List (Multi-Timeframe Matrix)
  const filteredConsensus = useMemo(() => {
    return consensusList.filter(item => {
      const matchesSearch = item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (filterType === "STRONG_BUY") return item.overallConsensus === "STRONG_BUY" || item.consensusScore >= 75;
      if (filterType === "DIP") return item.strategyTag === "DIP_CATCHER";
      if (filterType === "BREAKOUT") return item.strategyTag === "VOLATILITY_BREAKOUT";
      return true;
    });
  }, [consensusList, searchQuery, filterType]);

  // Filtered All-Coins Universe (All 745+ Pairs)
  const filteredAllCoins = useMemo(() => {
    let list = allCoins;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(c => c.symbol.toLowerCase().includes(q) || c.name.toLowerCase().includes(q));
    }

    // Category filter
    if (activeCategory === "TOP_VOLUME") {
      list = [...list].sort((a, b) => b.volumeUsd - a.volumeUsd);
    } else if (activeCategory === "GAINERS") {
      list = [...list].sort((a, b) => b.change24h - a.change24h);
    } else if (activeCategory === "DIP") {
      list = [...list].sort((a, b) => a.change24h - b.change24h);
    } else if (activeCategory === "AI") {
      list = list.filter(c => c.category === "AI");
    } else if (activeCategory === "MEME") {
      list = list.filter(c => c.category === "MEME");
    } else if (activeCategory === "L1") {
      list = list.filter(c => c.category === "L1");
    } else if (activeCategory === "DEFI") {
      list = list.filter(c => c.category === "DEFI");
    }

    return list;
  }, [allCoins, searchQuery, activeCategory]);

  const getConsensusBadge = (consensus: string, score: number) => {
    switch (consensus) {
      case "STRONG_BUY":
        return {
          label: `شراء فائق القوة (${score}%)`,
          bg: "bg-emerald-500/15 border-emerald-500/40 text-emerald-400",
          dot: "bg-emerald-400"
        };
      case "BUY":
        return {
          label: `شراء مؤكد (${score}%)`,
          bg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-300",
          dot: "bg-emerald-400"
        };
      case "STRONG_SELL":
        return {
          label: `بيع هابط قوي (${score}%)`,
          bg: "bg-rose-500/15 border-rose-500/40 text-rose-400",
          dot: "bg-rose-400"
        };
      case "SELL":
        return {
          label: `بيع هابط (${score}%)`,
          bg: "bg-rose-500/10 border-rose-500/20 text-rose-300",
          dot: "bg-rose-400"
        };
      default:
        return {
          label: `حياد وتوازن (${score}%)`,
          bg: "bg-amber-500/10 border-amber-500/20 text-amber-300",
          dot: "bg-amber-400"
        };
    }
  };

  const getDirectionBadge = (dir: string) => {
    if (dir === "BULLISH") {
      return <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">صاعد ↗</span>;
    }
    if (dir === "BEARISH") {
      return <span className="text-[11px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">هابط ↘</span>;
    }
    return <span className="text-[11px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">حياد ⇄</span>;
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* 🚀 Header & Command Ribbon */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#0a1224] via-[#09152b] to-[#060c18] border border-[#1e293b] p-6 shadow-2xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>تغطية شاملة: موصول بـ {allCoins.length > 0 ? allCoins.length : "745+"} زوج عقود آجلة (Binance Futures)</span>
              </span>

              <span className="px-2.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-[11px] font-mono font-bold">
                مقتبس من cryptosignalorg & Haehnchen Bot
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[11px] font-mono font-bold">
                فحص فوري متعدد الفريمات (15M • 1H • 4H • 1D)
              </span>
            </div>

            <h2 className="text-xl lg:text-2xl font-black text-white flex items-center gap-2.5 mt-2">
              <Coins className="w-6 h-6 text-emerald-400" />
              <span>رادار ومصفوفة كافة عملات العقود الآجلة (All Binance Futures Radar)</span>
            </h2>

            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              تم إلغاء التقييد بالعملات المحددة. المحرك موصول الآن بـ <strong>جميع أزواج العقود الآجلة على بينانس ({allCoins.length || 745} عملة)</strong> بالكامل، مع تحليل فوري حسب الطلب لأي عملة تختارها، وفحص متعدد الفريمات، ورصد تدفق دفتر الأوامر وجدران الحيتان لتنفيذ مباشر بالمليمتر.
            </p>
          </div>

          {/* Quick Action Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                playTacticalSound();
              }}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
              title="تجربة صوت تنبيه الرادار الصوتي"
            >
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <span>رادار صوتي 🔔</span>
            </button>

            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-2 rounded-lg border transition-all cursor-pointer ${
                isMuted
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
              }`}
              title={isMuted ? "الصوت مكتوم" : "الصوت مفعل"}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {!desktopNotifAllowed && (
              <button
                onClick={requestDesktopNotification}
                className="px-3 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                title="تفعيل إشعارات المتصفح لتنبيهات الصفقات"
              >
                <Bell className="w-4 h-4 text-amber-400" />
                <span>إشعارات المتصفح</span>
              </button>
            )}

            <button
              onClick={() => fetchData(true)}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-lg"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              <span>{isLoading ? "جاري الفحص..." : "تحديث كافة العملات"}</span>
            </button>
          </div>
        </div>

        {/* ⚡ Instant Custom Coin Analyzer Bar (Analyze ANY coin on Binance Futures) */}
        <div className="mt-5 p-3.5 bg-black/50 border border-emerald-500/30 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-white shrink-0">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>تحليل واقتناص فوري لأي عملة من بينانس (745+ زوج):</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                placeholder="اكتب رمز أي عملة (مثال: TAO, PEPE, WIF, SUI)"
                value={customInputSymbol}
                onChange={(e) => setCustomInputSymbol(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && customInputSymbol) {
                    handleAnalyzeCoin(customInputSymbol);
                  }
                }}
                className="w-full bg-[#070b14] border border-emerald-500/40 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 font-mono uppercase"
              />
            </div>

            <button
              onClick={() => handleAnalyzeCoin(customInputSymbol)}
              disabled={!customInputSymbol || isAnalyzingCustom}
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shrink-0"
            >
              {isAnalyzingCustom ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>جاري التحليل...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  <span>تحليل واقتناص 🎯</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 📊 Macro Risk & Sentiment Ribbon */}
        {sentiment && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-4 pt-4 border-t border-white/10">
            {/* Fear & Greed Card */}
            <div className="bg-black/40 rounded-lg p-3.5 border border-white/5 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
                <span className="flex items-center gap-1.5">
                  <Gauge className="w-4 h-4 text-emerald-400" />
                  <span>مؤشر الخوف والطمع (Fear & Greed)</span>
                </span>
                <span className="font-mono text-emerald-400 text-sm font-black">{sentiment.fearAndGreed.value}/100</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-700 ${
                    sentiment.fearAndGreed.value >= 60 ? "bg-emerald-500" : sentiment.fearAndGreed.value <= 35 ? "bg-rose-500" : "bg-amber-400"
                  }`}
                  style={{ width: `${sentiment.fearAndGreed.value}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-300 font-medium">
                {sentiment.fearAndGreed.descriptionArabic}
              </p>
            </div>

            {/* Long / Short Ratio */}
            <div className="bg-black/40 rounded-lg p-3.5 border border-white/5 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
                <span className="flex items-center gap-1.5">
                  <PieChart className="w-4 h-4 text-sky-400" />
                  <span>مراكز المتداولين (Long/Short)</span>
                </span>
                <span className="font-mono text-sky-400 text-xs font-bold">{sentiment.binanceLongShortRatio.ratio}x</span>
              </div>
              <div className="w-full flex h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full" 
                  style={{ width: `${sentiment.binanceLongShortRatio.longAccountPct}%` }}
                  title={`Long: ${sentiment.binanceLongShortRatio.longAccountPct}%`}
                />
                <div 
                  className="bg-rose-500 h-full" 
                  style={{ width: `${sentiment.binanceLongShortRatio.shortAccountPct}%` }}
                  title={`Short: ${sentiment.binanceLongShortRatio.shortAccountPct}%`}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-emerald-400 font-bold">شراء: {sentiment.binanceLongShortRatio.longAccountPct}%</span>
                <span className="text-rose-400 font-bold">بيع: {sentiment.binanceLongShortRatio.shortAccountPct}%</span>
              </div>
            </div>

            {/* Funding Rate Status */}
            <div className="bg-black/40 rounded-lg p-3.5 border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-purple-400" />
                  <span>معدلات التمويل وحظر الفخاخ</span>
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                  sentiment.fundingRateStatus.status === "HEALTHY" 
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" 
                    : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                }`}>
                  {sentiment.fundingRateStatus.status === "HEALTHY" ? "طبيعي آمن" : "حذر من ضغط"}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                {sentiment.fundingRateStatus.warningArabic}
              </p>
            </div>

            {/* Dominance & Turnover */}
            <div className="bg-black/40 rounded-lg p-3.5 border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
                <span className="flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-amber-400" />
                  <span>سيولة السوق الإجمالية (24H)</span>
                </span>
                <span className="text-amber-400 font-mono font-bold">${(sentiment.totalMarketTurnover24hUsd / 1e9).toFixed(1)}B</span>
              </div>
              <div className="text-[11px] text-slate-300 flex items-center justify-between pt-1">
                <span>استحواذ بيتكوين BTC.D:</span>
                <span className="font-mono font-bold text-white">{sentiment.marketDominanceBtcPct}%</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 🧭 View Modes and Category Filtering Ribbon */}
      <div className="flex flex-col gap-3 bg-[#0d1525] border border-slate-800 p-4 rounded-xl shadow-lg">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          {/* Main View Tabs */}
          <div className="flex items-center gap-2 bg-black/50 p-1 rounded-lg border border-slate-700/60 w-full sm:w-auto">
            <button
              onClick={() => setActiveViewMode("ALL_COINS")}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 flex-1 sm:flex-initial ${
                activeViewMode === "ALL_COINS" ? "bg-emerald-500 text-black font-black shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              <Coins className="w-4 h-4" />
              <span>كافة العملات ({allCoins.length || 745})</span>
            </button>

            <button
              onClick={() => setActiveViewMode("MATRIX")}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 flex-1 sm:flex-initial ${
                activeViewMode === "MATRIX" ? "bg-sky-500 text-black font-black shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>مصفوفة الفريمات (15M • 1H • 4H • 1D)</span>
            </button>

            <button
              onClick={() => setActiveViewMode("CARDS")}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 flex-1 sm:flex-initial ${
                activeViewMode === "CARDS" ? "bg-amber-400 text-black font-black shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>بطاقات القناص</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              placeholder="بحث في جميع الـ 745+ عملة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#070b14] border border-slate-700/80 rounded-lg pr-9 pl-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Category Pills (All, AI, Meme, L1, DeFi, High Vol, Gainers, Dip) */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-400 font-bold ml-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>تصنيف السوق:</span>
          </span>

          {[
            { id: "ALL", label: `جميع الأزواج (${allCoins.length || 745})` },
            { id: "TOP_VOLUME", label: "🔥 أعلى سيولة" },
            { id: "GAINERS", label: "🚀 الأكثر ارتفاعاً" },
            { id: "DIP", label: "🌊 الأكثر هبوطاً (Dip Catcher)" },
            { id: "AI", label: "🤖 ذكاء اصطناعي AI" },
            { id: "MEME", label: "🐶 عملات ميم Meme" },
            { id: "L1", label: "🌐 طبقة أولى Layer 1" },
            { id: "DEFI", label: "🏦 تمويل لا مركزي DeFi" }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? "bg-emerald-500 text-black shadow-md font-black"
                  : "bg-black/40 text-slate-300 hover:bg-white/5 border border-white/5"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 🌐 VIEW 1: ALL COINS EXPLORER (Full 745+ Binance Futures Universe) */}
      {activeViewMode === "ALL_COINS" && (
        <div className="bg-[#0b101e] rounded-xl border border-[#1e293b] overflow-hidden shadow-xl space-y-3">
          <div className="p-4 bg-[#0f172a] border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
            <span className="font-bold flex items-center gap-1.5 text-emerald-400">
              <Coins className="w-4 h-4" />
              <span>مستكشف كافة عملات العقود الآجلة — اضغط على أي عملة لبدء التحليل الفني الشامل واقتناص الصفقة بالمليمتر:</span>
            </span>
            <span className="text-slate-400 font-mono">
              عرض {Math.min(filteredAllCoins.length, allCoinsPageSize)} من أصل {filteredAllCoins.length} عملة
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-[#0a0f1d] text-slate-400 text-xs font-bold border-b border-slate-800">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">العملة والرمز</th>
                  <th className="py-3 px-4">السعر المباشر</th>
                  <th className="py-3 px-4">التغير 24H</th>
                  <th className="py-3 px-4">حجم التداول (USD)</th>
                  <th className="py-3 px-4 text-center">التصنيف</th>
                  <th className="py-3 px-4 text-center">إشارة الزخم الفوري</th>
                  <th className="py-3 px-4 text-center">إجراءات القناص</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs font-mono">
                {filteredAllCoins.slice(0, allCoinsPageSize).map((coin, idx) => {
                  const isSelected = selectedCoin?.symbol === coin.symbol;
                  return (
                    <tr
                      key={coin.symbol}
                      onClick={() => handleAnalyzeCoin(coin.symbol)}
                      className={`hover:bg-slate-800/40 transition-colors cursor-pointer ${
                        isSelected ? "bg-emerald-500/10 border-l-4 border-l-emerald-500" : ""
                      }`}
                    >
                      <td className="py-3 px-4 text-slate-500">{idx + 1}</td>

                      {/* Symbol */}
                      <td className="py-3 px-4 font-sans">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-[11px]">
                            {coin.name.substring(0, 3)}
                          </div>
                          <div>
                            <span className="font-black text-white text-sm">{coin.symbol}</span>
                            <span className="text-[10px] text-slate-400 block font-mono">Perp Futures</span>
                          </div>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4 font-bold text-white">
                        ${coin.price < 0.001 ? coin.price.toFixed(6) : coin.price < 1 ? coin.price.toFixed(4) : coin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                      </td>

                      {/* 24h Change */}
                      <td className="py-3 px-4 font-bold">
                        <span className={`inline-flex items-center gap-1 ${coin.change24h >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {coin.change24h >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                          <span>{coin.change24h >= 0 ? "+" : ""}{coin.change24h.toFixed(2)}%</span>
                        </span>
                      </td>

                      {/* Volume */}
                      <td className="py-3 px-4 text-slate-300">
                        ${(coin.volumeUsd / 1e6).toFixed(1)}M
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 text-center font-sans">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {coin.category === "AI" ? "🤖 AI" : coin.category === "MEME" ? "🐶 Meme" : coin.category === "L1" ? "🌐 L1" : coin.category === "DEFI" ? "🏦 DeFi" : "⚡ General"}
                        </span>
                      </td>

                      {/* Quick Signal */}
                      <td className="py-3 px-4 text-center font-sans">
                        {coin.quickSignal === "STRONG_BUY" && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                            شراء قوي 🔥
                          </span>
                        )}
                        {coin.quickSignal === "BUY" && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                            صاعد ↗
                          </span>
                        )}
                        {coin.quickSignal === "NEUTRAL" && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                            حياد ⇄
                          </span>
                        )}
                        {coin.quickSignal === "SELL" && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/10 text-rose-300 border border-rose-500/20">
                            هابط ↘
                          </span>
                        )}
                        {coin.quickSignal === "STRONG_SELL" && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/40">
                            قاع حاد (Dip) 🌊
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-center font-sans">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAnalyzeCoin(coin.symbol);
                          }}
                          className="px-3 py-1.5 rounded-md bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs transition-all flex items-center justify-center gap-1 cursor-pointer mx-auto shadow-md"
                        >
                          <Target className="w-3.5 h-3.5" />
                          <span>تحليل واقتناص</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination / Load More */}
          {allCoinsPageSize < filteredAllCoins.length && (
            <div className="p-4 text-center border-t border-slate-800">
              <button
                onClick={() => setAllCoinsPageSize(prev => prev + 60)}
                className="px-6 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 cursor-pointer shadow-md"
              >
                تحميل المزيد من العملات (+60 عملة) ...
              </button>
            </div>
          )}
        </div>
      )}

      {/* 📊 VIEW 2: MULTI-TIMEFRAME CONSENSUS MATRIX */}
      {activeViewMode === "MATRIX" && (
        <div className="bg-[#0b101e] rounded-xl border border-[#1e293b] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-[#0f172a] text-slate-400 text-xs font-bold border-b border-slate-800">
                  <th className="py-3 px-4">العملة والرمز</th>
                  <th className="py-3 px-4">السعر والتغير</th>
                  <th className="py-3 px-3 text-center">فريم 15M (Scalp)</th>
                  <th className="py-3 px-3 text-center">فريم 1H (Intraday)</th>
                  <th className="py-3 px-3 text-center">فريم 4H (Swing)</th>
                  <th className="py-3 px-3 text-center">فريم 1D (Macro)</th>
                  <th className="py-3 px-4 text-center">التوافق الإجمالي</th>
                  <th className="py-3 px-4 text-center">عمق الأوامر (Haehnchen)</th>
                  <th className="py-3 px-4 text-center">إجراءات القناص</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredConsensus.map((coin) => {
                  const consensusBadge = getConsensusBadge(coin.overallConsensus, coin.consensusScore);
                  const isSelected = selectedCoin?.symbol === coin.symbol;

                  return (
                    <tr
                      key={coin.symbol}
                      onClick={() => setSelectedCoin(coin)}
                      className={`hover:bg-slate-800/40 transition-colors cursor-pointer ${
                        isSelected ? "bg-emerald-500/10 border-l-4 border-l-emerald-500" : ""
                      }`}
                    >
                      {/* Symbol & Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-xs">
                            {coin.name.substring(0, 3)}
                          </div>
                          <div>
                            <div className="font-black text-white text-sm">{coin.symbol}</div>
                            <div className="text-[11px] text-slate-400">
                              {coin.strategyTag === "DIP_CATCHER" && <span className="text-emerald-400 font-bold">🌊 صيد قاع حاد</span>}
                              {coin.strategyTag === "VOLATILITY_BREAKOUT" && <span className="text-amber-400 font-bold">⚡ انفجار تقلب</span>}
                              {coin.strategyTag === "MOMENTUM_RALLY" && <span className="text-sky-400 font-bold">🚀 اندفاع مومنتم</span>}
                              {coin.strategyTag === "SMC_PULLBACK" && <span className="text-purple-400 font-bold">🛡️ تصحيح SMC</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Price & 24h Change */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-bold text-white text-sm">
                          ${coin.currentPrice < 0.001 ? coin.currentPrice.toFixed(6) : coin.currentPrice < 1 ? coin.currentPrice.toFixed(4) : coin.currentPrice.toLocaleString()}
                        </div>
                        <div className={`text-xs font-bold flex items-center gap-1 ${
                          coin.priceChange24hPct >= 0 ? "text-emerald-400" : "text-rose-400"
                        }`}>
                          {coin.priceChange24hPct >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                          <span>{coin.priceChange24hPct >= 0 ? "+" : ""}{coin.priceChange24hPct.toFixed(2)}%</span>
                        </div>
                      </td>

                      {/* 15m Timeframe */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="space-y-1">
                          {getDirectionBadge(coin.timeframes["15m"].direction)}
                          <div className="text-[10px] font-mono text-slate-400">
                            RSI: <span className="font-bold text-white">{coin.timeframes["15m"].rsi}</span>
                          </div>
                        </div>
                      </td>

                      {/* 1h Timeframe */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="space-y-1">
                          {getDirectionBadge(coin.timeframes["1h"].direction)}
                          <div className="text-[10px] font-mono text-slate-400">
                            RSI: <span className="font-bold text-white">{coin.timeframes["1h"].rsi}</span>
                            {coin.timeframes["1h"].bollinger.isSqueeze && (
                              <span className="block text-[9px] text-amber-300 font-bold">انضغاط بولنجر 🔥</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 4h Timeframe */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="space-y-1">
                          {getDirectionBadge(coin.timeframes["4h"].direction)}
                          <div className="text-[10px] font-mono text-slate-400">
                            RSI: <span className="font-bold text-white">{coin.timeframes["4h"].rsi}</span>
                          </div>
                        </div>
                      </td>

                      {/* 1d Timeframe */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="space-y-1">
                          {getDirectionBadge(coin.timeframes["1d"].direction)}
                          <div className="text-[10px] font-mono text-slate-400">
                            RSI: <span className="font-bold text-white">{coin.timeframes["1d"].rsi}</span>
                          </div>
                        </div>
                      </td>

                      {/* Overall Consensus */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${consensusBadge.bg}`}>
                          <span className={`w-2 h-2 rounded-full ${consensusBadge.dot} animate-pulse`} />
                          <span>{consensusBadge.label}</span>
                        </span>
                      </td>

                      {/* Orderbook Depth (Haehnchen Bot feature) */}
                      <td className="py-3.5 px-4 text-center font-mono">
                        <div className="space-y-1">
                          <div className="flex items-center justify-center gap-2 text-xs">
                            <span className="text-emerald-400 font-bold">{coin.orderBookWatcher.buyersPercent}% ش</span>
                            <span className="text-slate-500">|</span>
                            <span className="text-rose-400 font-bold">{coin.orderBookWatcher.sellersPercent}% ب</span>
                          </div>
                          <div className="w-24 mx-auto bg-slate-800 h-1.5 rounded-full overflow-hidden flex">
                            <div className="bg-emerald-500 h-full" style={{ width: `${coin.orderBookWatcher.buyersPercent}%` }} />
                            <div className="bg-rose-500 h-full" style={{ width: `${coin.orderBookWatcher.sellersPercent}%` }} />
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onSelectCoin) onSelectCoin(coin.symbol);
                            }}
                            className="px-2.5 py-1.5 rounded-md bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs transition-all flex items-center gap-1 cursor-pointer"
                            title="عرض العملة في شاشة التداول والشارت المزدوج"
                          >
                            <span>قنص الشارت</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyOrder(coin);
                            }}
                            className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer"
                            title="نسخ أمر بينانس للعقود الآجلة"
                          >
                            {copiedSymbol === coin.symbol ? (
                              <Check className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Copy className="w-4 h-4 text-slate-300" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ⚡ Selected Coin Manual Execution Inspector (Haehnchen & Freqtrade Precision Execution Card) */}
      {selectedCoin && (
        <div className="bg-gradient-to-r from-[#0c1626] via-[#09152b] to-[#070e1b] rounded-xl border border-emerald-500/40 p-6 shadow-2xl space-y-5">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/15 rounded-xl border border-emerald-500/40 text-emerald-400">
                <Target className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-white">{selectedCoin.symbol}</h3>
                  <span className={`text-xs px-2.5 py-0.5 rounded font-bold border ${getConsensusBadge(selectedCoin.overallConsensus, selectedCoin.consensusScore).bg}`}>
                    {selectedCoin.binanceFuturesExecution.action === "BUY_LONG" ? "صفقة شراء LONG 🚀" : "صفقة بيع SHORT 🔻"}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 font-bold border border-purple-500/30">
                    رافعة {selectedCoin.binanceFuturesExecution.isolatedLeverage}x معزولة Isolated
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  {selectedCoin.recommendedAction}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => handleCopyOrder(selectedCoin)}
                className="px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                {copiedSymbol === selectedCoin.symbol ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedSymbol === selectedCoin.symbol ? "تم نسخ أمر بينانس بالكامل!" : "نسخ أمر بينانس للعقود الآجلة"}</span>
              </button>

              <button
                onClick={() => {
                  if (onSelectCoin) onSelectCoin(selectedCoin.symbol);
                }}
                className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
              >
                <ExternalLink className="w-4 h-4 text-emerald-400" />
                <span>فتح الشارت الفني المباشر</span>
              </button>
            </div>
          </div>

          {/* Precision Numbers Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-black/50 p-3 rounded-lg border border-white/5 space-y-1">
              <div className="text-[11px] text-slate-400 font-bold">سعر الدخول المحدد (Limit)</div>
              <div className="font-mono text-base font-black text-emerald-400">
                ${selectedCoin.binanceFuturesExecution.limitEntry}
              </div>
              <div className="text-[10px] text-slate-400">أمر معلق Limit بالمليمتر</div>
            </div>

            <div className="bg-black/50 p-3 rounded-lg border border-white/5 space-y-1">
              <div className="text-[11px] text-slate-400 font-bold">وقف الخسارة الصارم (SL)</div>
              <div className="font-mono text-base font-black text-rose-400">
                ${selectedCoin.binanceFuturesExecution.stopLoss}
              </div>
              <div className="text-[10px] text-rose-400/80 font-bold">إلغاء النموذج الفوري</div>
            </div>

            <div className="bg-black/50 p-3 rounded-lg border border-white/5 space-y-1">
              <div className="text-[11px] text-slate-400 font-bold">الهدف الأول TP1 (نقل الوقف)</div>
              <div className="font-mono text-base font-black text-sky-400">
                ${selectedCoin.binanceFuturesExecution.takeProfit1}
              </div>
              <div className="text-[10px] text-sky-400/80 font-bold">+2.5% ➔ إغلاق 50% وتأمين</div>
            </div>

            <div className="bg-black/50 p-3 rounded-lg border border-white/5 space-y-1">
              <div className="text-[11px] text-slate-400 font-bold">الهدف الثاني TP2 (رئيسي)</div>
              <div className="font-mono text-base font-black text-emerald-300">
                ${selectedCoin.binanceFuturesExecution.takeProfit2}
              </div>
              <div className="text-[10px] text-emerald-400 font-bold">+5.8% حجز ربح أساسي</div>
            </div>

            <div className="bg-black/50 p-3 rounded-lg border border-white/5 space-y-1">
              <div className="text-[11px] text-slate-400 font-bold">الهدف الثالث TP3 (امتداد)</div>
              <div className="font-mono text-base font-black text-amber-300">
                ${selectedCoin.binanceFuturesExecution.takeProfit3}
              </div>
              <div className="text-[10px] text-amber-400 font-bold">+9.8% سوينغ تريند</div>
            </div>

            <div className="bg-black/50 p-3 rounded-lg border border-white/5 space-y-1">
              <div className="text-[11px] text-slate-400 font-bold">العائد للمخاطرة R:R</div>
              <div className="font-mono text-base font-black text-purple-400">
                1:{selectedCoin.binanceFuturesExecution.riskRewardRatio}
              </div>
              <div className="text-[10px] text-emerald-400 font-bold">حاجز تصفية: +{selectedCoin.binanceFuturesExecution.liquidationBufferPct}%</div>
            </div>
          </div>

          {/* Haehnchen Orderbook Depth Analysis & Wall Alert */}
          <div className="bg-black/40 p-4 rounded-lg border border-slate-800 space-y-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-white">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>تحليل تدفق دفتر الأوامر والسيولة (Haehnchen Depth & Spread Watcher):</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-emerald-400 font-bold">طلبات الشراء: {selectedCoin.orderBookWatcher.buyersPercent}%</span>
                <span className="text-rose-400 font-bold">عروض البيع: {selectedCoin.orderBookWatcher.sellersPercent}%</span>
                <span className="text-slate-400">السبريد: {selectedCoin.orderBookWatcher.spreadPct}%</span>
              </div>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden flex">
              <div className="bg-emerald-500 h-full" style={{ width: `${selectedCoin.orderBookWatcher.buyersPercent}%` }} />
              <div className="bg-rose-500 h-full" style={{ width: `${selectedCoin.orderBookWatcher.sellersPercent}%` }} />
            </div>
            <div className="text-xs text-slate-300 font-medium">
              💡 {selectedCoin.orderBookWatcher.wallAlert}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
