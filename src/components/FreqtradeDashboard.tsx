import React, { useState, useEffect, useMemo } from "react";
import {
  Bot,
  Play,
  Pause,
  Square,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Shield,
  Sliders,
  BarChart3,
  Code2,
  Copy,
  Check,
  AlertTriangle,
  Zap,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Layers,
  ChevronRight,
  Flame,
  LineChart,
  Percent,
  CheckCircle2,
  Lock,
  ArrowRight
} from "lucide-react";

export interface FreqtradeProps {
  tickers: Record<string, { lastPrice: number; priceChangePercent: number; quoteVolume: number }>;
  onSelectCoin?: (symbol: string) => void;
}

interface StrategyDef {
  id: string;
  name: string;
  nameArabic: string;
  description: string;
  timeframe: string;
  defaultRoi: Record<string, number>;
  defaultTrailing: {
    trailing_stop: boolean;
    trailing_stop_positive: number;
    trailing_stop_positive_offset: number;
    trailing_only_offset_is_reached: boolean;
  };
  recommendedLeverage: number;
}

interface FuturesSignal {
  id: string;
  symbol: string;
  direction: "LONG" | "SHORT";
  confidence: number;
  entry: number;
  entryZoneMin: number;
  entryZoneMax: number;
  sl: number;
  slPercent: number;
  tp1: number;
  tp2: number;
  tp3: number;
  profitPercent: number;
  rrRatio: number;
  strategyId: string;
  strategyName: string;
  timeframe: string;
  recommendedLeverage: number;
  liquidationPrice: number;
  liquidationDistancePct: number;
  roiTable: Record<string, number>;
  trailingStop: {
    trailing_stop: boolean;
    trailing_stop_positive: number;
    trailing_stop_positive_offset: number;
    trailing_only_offset_is_reached: boolean;
  };
  binanceFuturesOrder: {
    symbol: string;
    type: "LIMIT";
    side: "BUY" | "SELL";
    price: number;
    stopLoss: number;
    takeProfit: number;
    leverage: number;
    marginType: "ISOLATED";
  };
  confluenceReasons: string[];
  timestamp: number;
}

interface BacktestTrade {
  id: string;
  symbol: string;
  direction: "LONG" | "SHORT";
  openTime: string;
  closeTime: string;
  openPrice: number;
  closePrice: number;
  profitPct: number;
  exitReason: "MINIMAL_ROI" | "TRAILING_STOP" | "STOP_LOSS" | "SIGNAL_EXIT";
  durationMinutes: number;
}

interface BacktestResult {
  strategyId: string;
  strategyName: string;
  symbol: string;
  timeframe: string;
  periodDays: number;
  candleCount: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  profitFactor: number;
  totalNetProfitPct: number;
  maxDrawdownPct: number;
  sharpeRatio: number;
  avgDurationMinutes: number;
  bestTradePct: number;
  worstTradePct: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  equityCurve: Array<{
    time: string;
    timestamp: number;
    equity: number;
    profitPct: number;
    drawdownPct: number;
  }>;
  trades: BacktestTrade[];
}

export const FreqtradeDashboard: React.FC<FreqtradeProps> = ({ tickers, onSelectCoin }) => {
  const [activeSubTab, setActiveSubTab] = useState<"signals" | "backtest" | "roi_trailing" | "builder">("signals");

  // Bot Daemon state
  const [botState, setBotState] = useState<"RUNNING" | "STOPPED" | "PAUSED">("RUNNING");
  const [activeStrategyId, setActiveStrategyId] = useState<string>("freqtrade_futures_smc");
  const [strategies, setStrategies] = useState<StrategyDef[]>([]);
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [blacklist, setBlacklist] = useState<string[]>([]);
  const [roiTable, setRoiTable] = useState<Record<string, number>>({
    "0": 0.08,
    "30": 0.05,
    "60": 0.03,
    "120": 0.015
  });
  const [trailingConfig, setTrailingConfig] = useState({
    trailing_stop: true,
    trailing_stop_positive: 0.015,
    trailing_stop_positive_offset: 0.025,
    trailing_only_offset_is_reached: true
  });

  // Signals state
  const [signals, setSignals] = useState<FuturesSignal[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [signalFilter, setSignalFilter] = useState<"ALL" | "LONG" | "SHORT" | "IN_ZONE">("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Backtest state
  const [backtestSymbol, setBacktestSymbol] = useState("BTCUSDT");
  const [backtestStrategy, setBacktestStrategy] = useState("freqtrade_futures_smc");
  const [backtestTimeframe, setBacktestTimeframe] = useState("1h");
  const [backtestPeriod, setBacktestPeriod] = useState(14);
  const [isBacktesting, setIsBacktesting] = useState(false);
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [backtestFilter, setBacktestFilter] = useState<"ALL" | "WON" | "LOST">("ALL");

  // Code Export state
  const [exportStrategyPy, setExportStrategyPy] = useState("");
  const [exportConfigJson, setExportConfigJson] = useState("");
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  // Fetch initial status and signals on mount
  useEffect(() => {
    fetchStatus();
    fetchSignals();
    fetchExportFiles("freqtrade_futures_smc");
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/freqtrade/status");
      const data = await res.json();
      if (data.success) {
        setBotState(data.botState);
        setActiveStrategyId(data.activeStrategyId);
        setStrategies(data.strategies || []);
        setRoiTable(data.currentRoiTable || {});
        setTrailingConfig(data.currentTrailingStop || {});
        setWhitelist(data.whitelist || []);
        setBlacklist(data.blacklist || []);
      }
    } catch (e) {
      console.error("Error fetching Freqtrade status:", e);
    }
  };

  const fetchSignals = async (force: boolean = false) => {
    setIsScanning(true);
    try {
      const res = await fetch(`/api/freqtrade/signals?force=${force}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.signals)) {
        setSignals(data.signals);
      }
    } catch (e) {
      console.error("Error fetching Freqtrade signals:", e);
    } finally {
      setIsScanning(false);
    }
  };

  const handleControl = async (action: "START" | "STOP" | "PAUSE", newStratId?: string) => {
    try {
      const res = await fetch("/api/freqtrade/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, strategyId: newStratId || activeStrategyId })
      });
      const data = await res.json();
      if (data.success) {
        setBotState(data.botState);
        if (newStratId) {
          setActiveStrategyId(newStratId);
          fetchExportFiles(newStratId);
        }
      }
    } catch (e) {
      console.error("Error controlling bot:", e);
    }
  };

  const handleRunBacktest = async () => {
    setIsBacktesting(true);
    try {
      const res = await fetch("/api/freqtrade/backtest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          strategyId: backtestStrategy,
          symbol: backtestSymbol,
          timeframe: backtestTimeframe,
          periodDays: backtestPeriod
        })
      });
      const data = await res.json();
      if (data.success) {
        setBacktestResult(data.result);
      }
    } catch (e) {
      console.error("Error running backtest:", e);
    } finally {
      setIsBacktesting(false);
    }
  };

  const fetchExportFiles = async (stratId: string) => {
    try {
      const res = await fetch(`/api/freqtrade/export?strategyId=${stratId}`);
      const data = await res.json();
      if (data.success) {
        setExportStrategyPy(data.strategyPy);
        setExportConfigJson(data.configJson);
      }
    } catch (e) {
      console.error("Error fetching export files:", e);
    }
  };

  const handleSaveRoiTrailing = async () => {
    try {
      const res = await fetch("/api/freqtrade/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roiTable,
          trailingStop: trailingConfig
        })
      });
      const data = await res.json();
      if (data.success) {
        alert("✅ تم حفظ إعدادات الـ Minimal ROI و Trailing Stop بنجاح وتفعيلها في المحرك بالخلفية.");
      }
    } catch (e) {
      console.error("Error saving config:", e);
    }
  };

  const copyOrderCommand = (sig: FuturesSignal) => {
    const text = `Binance Futures Order:
Pair: ${sig.symbol}
Direction: ${sig.direction}
Type: LIMIT
Entry Price: ${sig.entry}
Take Profit 1: ${sig.tp1} (Move SL to Breakeven)
Take Profit 2: ${sig.tp2} (Target Profit +${sig.profitPercent}%)
Stop Loss: ${sig.sl} (-${sig.slPercent}%)
Recommended Leverage: ${sig.recommendedLeverage}x (Isolated)
Liquidation Price: ~${sig.liquidationPrice}`;

    navigator.clipboard.writeText(text);
    setCopiedId(sig.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Filter signals
  const filteredSignals = useMemo(() => {
    return signals.filter(sig => {
      const curPrice = tickers[sig.symbol]?.lastPrice || sig.entry;
      const inZone = curPrice >= sig.entryZoneMin && curPrice <= sig.entryZoneMax;

      if (signalFilter === "LONG" && sig.direction !== "LONG") return false;
      if (signalFilter === "SHORT" && sig.direction !== "SHORT") return false;
      if (signalFilter === "IN_ZONE" && !inZone) return false;
      return true;
    });
  }, [signals, signalFilter, tickers]);

  return (
    <div className="space-y-6 text-white pb-20" dir="rtl">
      {/* 🚀 Top Institutional Freqtrade Controller Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0d1527] via-[#101b33] to-[#0a101f] border border-[#1e293b]/80 shadow-2xl p-6">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#10b981]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#3b82f6]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#10b981]/10 border border-[#10b981]/30">
                <span className="relative flex h-2.5 w-2.5">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    botState === "RUNNING" ? "bg-emerald-400" : botState === "PAUSED" ? "bg-amber-400" : "bg-rose-400"
                  }`} />
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    botState === "RUNNING" ? "bg-emerald-500" : botState === "PAUSED" ? "bg-amber-500" : "bg-rose-500"
                  }`} />
                </span>
                <span className="text-xs font-bold text-emerald-400 tracking-wider">
                  محرك Freqtrade للعقود الآجلة: {botState === "RUNNING" ? "يعمل بالخلفية بدقة تامة (ACTIVE)" : botState === "PAUSED" ? "متوقف مؤقتاً (PAUSED)" : "متوقف (STOPPED)"}
                </span>
              </div>

              <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                <span>Futures Isolated Mode (العقود الآجلة)</span>
              </div>

              <div className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                <span>قائمة المراقبة النشطة: {whitelist.length} عملة</span>
              </div>
            </div>

            <h1 className="text-2xl lg:text-3xl font-black text-white flex items-center gap-3">
              <Bot className="w-8 h-8 text-emerald-400" />
              <span>محرك Freqtrade المؤسساتي المتكامل — العقود الآجلة</span>
            </h1>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              تحليل خوارزمي دقيق يعمل في الخلفية وفق مستودع Freqtrade الحقيقي: يكتشف الفرص، ويحدد منطقة الدخول بالمليمتر، ويحسب وقف الخسارة الفني، مع جدول Minimal ROI لتأمين الربح و Trailing Stop لحماية الأرباح.
            </p>
          </div>

          {/* Quick Bot Controls */}
          <div className="flex flex-wrap items-center gap-2.5 bg-black/40 p-2.5 rounded-xl border border-white/5 backdrop-blur-md">
            {botState !== "RUNNING" ? (
              <button
                onClick={() => handleControl("START")}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-900/40 transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>تشغيل المحرك (Start)</span>
              </button>
            ) : (
              <button
                onClick={() => handleControl("PAUSE")}
                className="px-4 py-2 rounded-lg bg-amber-600/80 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>إيقاف مؤقت (Pause)</span>
              </button>
            )}

            <button
              onClick={() => handleControl("STOP")}
              className={`px-4 py-2 rounded-lg text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                botState === "STOPPED" ? "bg-rose-600" : "bg-rose-950/60 hover:bg-rose-900 border border-rose-500/30"
              }`}
            >
              <Square className="w-3.5 h-3.5" />
              <span>إيقاف تام (Stop)</span>
            </button>

            <button
              onClick={() => fetchSignals(true)}
              disabled={isScanning}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? "animate-spin text-emerald-400" : ""}`} />
              <span>{isScanning ? "جاري المسح الفوري..." : "مسح فوري الآن"}</span>
            </button>
          </div>
        </div>

        {/* Sub-Tabs Bar */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-white/10">
          <button
            onClick={() => setActiveSubTab("signals")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === "signals"
                ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/30 font-black"
                : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>صفقات العقود الآجلة المباشرة ({signals.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab("backtest")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === "backtest"
                ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/30 font-black"
                : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>محرك الاختبار التاريخي المتقدم (Backtesting & Equity Curve)</span>
          </button>

          <button
            onClick={() => setActiveSubTab("roi_trailing")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === "roi_trailing"
                ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/30 font-black"
                : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>وقف الخسارة المتحرك وجدول العائد (Trailing Stop & Minimal ROI)</span>
          </button>

          <button
            onClick={() => setActiveSubTab("builder")}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === "builder"
                ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/30 font-black"
                : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>مصدّر كود Freqtrade بلغة Python (Strategy & Config)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. LIVE FUTURES SIGNALS TAB */}
      {/* ========================================================================= */}
      {activeSubTab === "signals" && (
        <div className="space-y-6">
          {/* Signal Filters & Strategy selector bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-[#0f172a] p-4 rounded-xl border border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-400">تصفية الإشارات:</span>
              {(["ALL", "IN_ZONE", "LONG", "SHORT"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setSignalFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    signalFilter === f
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      : "bg-slate-800/80 text-slate-400 hover:text-white"
                  }`}
                >
                  {f === "ALL" && "الكل"}
                  {f === "IN_ZONE" && "🟢 داخل منطقة الدخول الآن"}
                  {f === "LONG" && "🚀 شراء فقط (LONG)"}
                  {f === "SHORT" && "🔻 بيع فقط (SHORT)"}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400">الاستراتيجية الفعّالة:</span>
              <select
                value={activeStrategyId}
                onChange={e => {
                  const sId = e.target.value;
                  setActiveStrategyId(sId);
                  handleControl(botState, sId);
                }}
                className="bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 px-3 py-1.5 rounded-lg outline-none cursor-pointer"
              >
                {strategies.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.nameArabic}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Signals Cards Grid */}
          {filteredSignals.length === 0 ? (
            <div className="bg-[#0f172a] rounded-2xl border border-slate-800/80 p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <Bot className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">لا توجد صفقات معلقة في هذا التصنيف حالياً</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                محرك Freqtrade يطبق فلاتر صارمة جداً لسلامة رأس المال؛ إذا لم يكن السعر في منطقة دخول مثالية فإنه يستبعد العملات الضعيفة وغير المتحركة.
              </p>
              <button
                onClick={() => fetchSignals(true)}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs inline-flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>إعادة مسح العملات النشطة فوراً</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {filteredSignals.map(sig => {
                const liveTicker = tickers[sig.symbol];
                const livePrice = liveTicker?.lastPrice || sig.entry;
                const inZone = livePrice >= sig.entryZoneMin && livePrice <= sig.entryZoneMax;
                const distPct = sig.entry > 0 ? ((livePrice - sig.entry) / sig.entry) * 100 : 0;
                const isLong = sig.direction === "LONG";
                
                // Real-time unrealized PnL %
                const unPnl = isLong 
                  ? ((livePrice - sig.entry) / sig.entry) * 100 
                  : ((sig.entry - livePrice) / sig.entry) * 100;

                const isHitTp1 = isLong ? livePrice >= sig.tp1 : livePrice <= sig.tp1;
                const isHitSl = isLong ? livePrice <= sig.sl : livePrice >= sig.sl;

                return (
                  <div
                    key={sig.id}
                    className={`rounded-2xl border transition-all duration-200 overflow-hidden bg-gradient-to-b from-[#0f172a] to-[#090d16] ${
                      inZone
                        ? "border-emerald-500/60 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/30"
                        : "border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {/* Card Header */}
                    <div className="p-5 border-b border-slate-800/80 flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => onSelectCoin && onSelectCoin(sig.symbol)}
                            className="text-xl font-black text-white hover:text-emerald-400 flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>{sig.symbol}</span>
                            <ArrowUpRight className="w-4 h-4 text-slate-400" />
                          </button>

                          <span
                            className={`px-3 py-1 rounded-md text-xs font-black flex items-center gap-1 ${
                              isLong
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            }`}
                          >
                            {isLong ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                            <span>{isLong ? "شراء صاعد LONG" : "بيع هابط SHORT"}</span>
                          </span>

                          <span className="px-2.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[11px] font-bold">
                            رافعة {sig.recommendedLeverage}x Isolated
                          </span>
                        </div>

                        <p className="text-xs text-slate-400 flex items-center gap-2">
                          <span>{sig.strategyName}</span>
                          <span>•</span>
                          <span className="text-emerald-400 font-bold">يقين {sig.confidence}%</span>
                          <span>•</span>
                          <span className="text-slate-300">عائد 1:{sig.rrRatio}</span>
                        </p>
                      </div>

                      {/* Status Badge */}
                      <div>
                        {isHitTp1 ? (
                          <span className="px-3 py-1 rounded-full bg-emerald-500 text-black text-xs font-black flex items-center gap-1 animate-pulse">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>ضرب TP1 — الوقف الآن على الدخول (Risk-Free)</span>
                          </span>
                        ) : isHitSl ? (
                          <span className="px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold">
                            ملامسة وقف الخسارة
                          </span>
                        ) : inZone ? (
                          <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 text-xs font-black flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                            <span>في قلب منطقة الدخول بالمليمتر!</span>
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-xs font-bold">
                            بانتظار وصول السعر ({distPct > 0 ? `+${distPct.toFixed(2)}%` : `${distPct.toFixed(2)}%`})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Price Structure */}
                    <div className="p-5 space-y-4">
                      {/* Live Market Price vs Entry Zone */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-black/30 p-3.5 rounded-xl border border-white/5">
                        <div>
                          <div className="text-[11px] text-slate-400 font-bold">السعر المباشر الآن</div>
                          <div className="text-base font-black text-white mt-0.5">
                            ${livePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                          </div>
                          <div className={`text-[10px] font-bold ${unPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                            PnL: {unPnl >= 0 ? `+${unPnl.toFixed(2)}%` : `${unPnl.toFixed(2)}%`}
                          </div>
                        </div>

                        <div>
                          <div className="text-[11px] text-slate-400 font-bold">سعر الدخول المقترح</div>
                          <div className="text-base font-black text-amber-300 mt-0.5">
                            ${sig.entry.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            منطقة: {sig.entryZoneMin} - {sig.entryZoneMax}
                          </div>
                        </div>

                        <div>
                          <div className="text-[11px] text-slate-400 font-bold">وقف الخسارة الفني (SL)</div>
                          <div className="text-base font-black text-rose-400 mt-0.5">
                            ${sig.sl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                          </div>
                          <div className="text-[10px] text-rose-300/80">
                            أقصى خطر: -{sig.slPercent}%
                          </div>
                        </div>

                        <div>
                          <div className="text-[11px] text-slate-400 font-bold">سعر التصفية (Liquidation)</div>
                          <div className="text-base font-black text-slate-300 mt-0.5">
                            ${sig.liquidationPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                          </div>
                          <div className="text-[10px] text-emerald-400 font-bold">
                            أمان: {sig.liquidationDistancePct}% بعيداً
                          </div>
                        </div>
                      </div>

                      {/* Take Profit Multi-Levels (Freqtrade targets) */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                          <span className="flex items-center gap-1.5">
                            <Target className="w-3.5 h-3.5 text-emerald-400" />
                            <span>أهداف الصفقة المنظمة وفق Freqtrade:</span>
                          </span>
                          <span className="text-emerald-400 font-bold">الهدف الرئيسي: +{sig.profitPercent}%</span>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-center">
                            <div className="text-[10px] text-emerald-400 font-bold">TP1 (نقل الوقف للدخول)</div>
                            <div className="text-xs font-black text-white mt-0.5">${sig.tp1}</div>
                            <div className="text-[9px] text-emerald-300/80 font-bold">+3.2% (تأمين)</div>
                          </div>

                          <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-center ring-1 ring-emerald-500/20">
                            <div className="text-[10px] text-emerald-300 font-black">TP2 (الهدف الأساسي)</div>
                            <div className="text-xs font-black text-emerald-300 mt-0.5">${sig.tp2}</div>
                            <div className="text-[9px] text-emerald-400 font-bold">+{sig.profitPercent}% (جني الأرباح)</div>
                          </div>

                          <div className="p-2.5 rounded-lg bg-blue-950/20 border border-blue-500/20 text-center">
                            <div className="text-[10px] text-blue-400 font-bold">TP3 (امتداد الموجة)</div>
                            <div className="text-xs font-black text-white mt-0.5">${sig.tp3}</div>
                            <div className="text-[9px] text-blue-300 font-bold">+12.0% (Trailing)</div>
                          </div>
                        </div>
                      </div>

                      {/* Trailing Stop & Minimal ROI Table Rule for this Signal */}
                      <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs space-y-2">
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="font-bold flex items-center gap-1.5 text-amber-300">
                            <Shield className="w-3.5 h-3.5" />
                            <span>قاعدة Trailing Stop:</span>
                          </span>
                          <span className="text-[11px] text-slate-400">
                            تفعيل عند ربح +{((sig.trailingStop?.trailing_stop_positive_offset || 0.025) * 100).toFixed(1)}% مع ملاحقة بفارق {((sig.trailingStop?.trailing_stop_positive || 0.015) * 100).toFixed(1)}%
                          </span>
                        </div>

                        {/* Confluence triggers */}
                        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-1.5">
                          {sig.confluenceReasons.map((r, i) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-white/5 text-slate-300 text-[10px] font-semibold border border-white/5">
                              ✓ {r}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Order copy button */}
                      <button
                        onClick={() => copyOrderCommand(sig)}
                        className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          copiedId === sig.id
                            ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/30"
                            : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                        }`}
                      >
                        {copiedId === sig.id ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>تم نسخ الأمر بصيغة Binance Futures بنجاح!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 text-emerald-400" />
                            <span>نسخ تفاصيل الأمر (Limit / TP / SL) للدخول في Binance Futures فوراً</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. HISTORICAL BACKTESTING ENGINE TAB */}
      {/* ========================================================================= */}
      {activeSubTab === "backtest" && (
        <div className="space-y-6">
          {/* Backtest Config Panel */}
          <div className="bg-[#0f172a] p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-400" />
                  <span>محرك الاختبار التاريخي الحقيقي (Freqtrade Historical Backtesting)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  يقوم المحرك بجلب بيانات الشموع الحقيقية من منصة بينانس ويقوم بمحاكاة دقيقة خطوة بخطوة عبر الزمن لتأكيد نسبة الربح، مؤشر شارب، وأقصى هبوط.
                </p>
              </div>

              <button
                onClick={handleRunBacktest}
                disabled={isBacktesting}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/30 transition-all cursor-pointer disabled:opacity-50"
              >
                <Play className={`w-4 h-4 ${isBacktesting ? "animate-spin" : ""}`} />
                <span>{isBacktesting ? "جاري تشغيل المحاكاة التاريخية..." : "بدء تشغيل الاختبار التاريخي (Run Backtest)"}</span>
              </button>
            </div>

            {/* Backtest Parameters Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-800">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">الزوج المراد اختباره (745+ عملة):</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={backtestSymbol}
                    onChange={e => setBacktestSymbol(e.target.value.toUpperCase())}
                    placeholder="BTCUSDT"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-emerald-400 outline-none uppercase"
                  />
                  <select
                    value={backtestSymbol}
                    onChange={e => setBacktestSymbol(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-xs font-bold text-slate-300 outline-none cursor-pointer"
                    title="اختر من قائمة العملات الأكثر سيولة"
                  >
                    {whitelist.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">استراتيجية الاختبار:</label>
                <select
                  value={backtestStrategy}
                  onChange={e => setBacktestStrategy(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-white outline-none"
                >
                  {strategies.map(s => (
                    <option key={s.id} value={s.id}>{s.nameArabic}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">الفريم الزمني (Timeframe):</label>
                <select
                  value={backtestTimeframe}
                  onChange={e => setBacktestTimeframe(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-white outline-none"
                >
                  <option value="15m">15 دقيقة (مضاربة سريعة)</option>
                  <option value="1h">1 ساعة (الفريم القياسي)</option>
                  <option value="4h">4 ساعات (سوينغ وتريند)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">المدة التاريخية:</label>
                <select
                  value={backtestPeriod}
                  onChange={e => setBacktestPeriod(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-white outline-none"
                >
                  <option value={7}>آخر 7 أيام (سريع)</option>
                  <option value={14}>آخر 14 يوماً (موصى به)</option>
                  <option value={30}>آخر 30 يوماً (شامل)</option>
                  <option value={60}>آخر 60 يوماً (دورة كاملة)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Backtest Results Presentation */}
          {backtestResult && (
            <div className="space-y-6">
              {/* Quant Performance Scorecards */}
              <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
                <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800">
                  <div className="text-[11px] font-bold text-slate-400">نسبة الصفقات الرابحة</div>
                  <div className="text-xl font-black text-emerald-400 mt-1">{backtestResult.winRate}%</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {backtestResult.winningTrades} رابحة / {backtestResult.losingTrades} خاسرة
                  </div>
                </div>

                <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800">
                  <div className="text-[11px] font-bold text-slate-400">مؤشر الربحية (Profit Factor)</div>
                  <div className="text-xl font-black text-blue-400 mt-1">{backtestResult.profitFactor}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {backtestResult.profitFactor >= 1.5 ? "مستقر ومؤسساتي ✓" : "مقبول"}
                  </div>
                </div>

                <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800">
                  <div className="text-[11px] font-bold text-slate-400">صافي العائد التراكمي</div>
                  <div className={`text-xl font-black mt-1 ${backtestResult.totalNetProfitPct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {backtestResult.totalNetProfitPct >= 0 ? `+${backtestResult.totalNetProfitPct}%` : `${backtestResult.totalNetProfitPct}%`}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">محفظة $1,000 افتراضية</div>
                </div>

                <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800">
                  <div className="text-[11px] font-bold text-slate-400">أقصى هبوط (Max Drawdown)</div>
                  <div className="text-xl font-black text-rose-400 mt-1">{backtestResult.maxDrawdownPct}%</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">أمان رأس المال</div>
                </div>

                <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800">
                  <div className="text-[11px] font-bold text-slate-400">معدل شارب (Sharpe Ratio)</div>
                  <div className="text-xl font-black text-purple-400 mt-1">{backtestResult.sharpeRatio}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">أداء معدل بالمخاطرة</div>
                </div>

                <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800">
                  <div className="text-[11px] font-bold text-slate-400">إجمالي الصفقات المنفذة</div>
                  <div className="text-xl font-black text-white mt-1">{backtestResult.totalTrades}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">على {backtestResult.candleCount} شمعة</div>
                </div>

                <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800">
                  <div className="text-[11px] font-bold text-slate-400">متوسط بقاء الصفقة</div>
                  <div className="text-xl font-black text-amber-300 mt-1">{Math.round(backtestResult.avgDurationMinutes / 60)} ساعة</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{backtestResult.avgDurationMinutes} دقيقة</div>
                </div>
              </div>

              {/* Equity Curve SVG Chart */}
              <div className="bg-[#0f172a] p-6 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <LineChart className="w-4 h-4 text-emerald-400" />
                    <span>منحنى نمو المحفظة التاريخي (Equity Growth Curve): {backtestResult.symbol}</span>
                  </h3>
                  <span className="text-xs text-slate-400">
                    من {backtestResult.equityCurve[0]?.time} إلى {backtestResult.equityCurve[backtestResult.equityCurve.length - 1]?.time}
                  </span>
                </div>

                {/* SVG Line Curve */}
                <div className="w-full h-56 relative bg-black/40 rounded-xl p-4 border border-white/5 overflow-hidden">
                  {(() => {
                    const points = backtestResult.equityCurve;
                    if (points.length < 2) return <div className="text-xs text-slate-400 text-center mt-20">لا توجد نقاط كافية للمنحنى</div>;
                    
                    const equities = points.map(p => p.equity);
                    const minEq = Math.min(...equities) * 0.98;
                    const maxEq = Math.max(...equities) * 1.02;
                    const range = maxEq - minEq || 1;

                    const width = 800;
                    const height = 180;
                    
                    const coords = points.map((p, idx) => {
                      const x = (idx / (points.length - 1)) * width;
                      const y = height - ((p.equity - minEq) / range) * height;
                      return `${x},${y}`;
                    }).join(" ");

                    const lastEquity = points[points.length - 1].equity;

                    return (
                      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                        <defs>
                          <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        {/* Area under curve */}
                        <polygon
                          points={`0,${height} ${coords} ${width},${height}`}
                          fill="url(#equityGrad)"
                        />
                        {/* Stroke Line */}
                        <polyline
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={coords}
                        />
                        {/* Last point dot */}
                        {coords.split(" ").slice(-1).map((lastCoord, i) => {
                          const [cx, cy] = lastCoord.split(",");
                          return (
                            <circle key={i} cx={cx} cy={cy} r="4" fill="#34d399" stroke="#064e3b" strokeWidth="2" />
                          );
                        })}
                      </svg>
                    );
                  })()}
                </div>
              </div>

              {/* Trade Log Table */}
              <div className="bg-[#0f172a] rounded-2xl border border-slate-800 overflow-hidden space-y-3">
                <div className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-white">سجل الصفقات التفصيلي للمحاكاة ({backtestResult.trades.length})</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    {(["ALL", "WON", "LOST"] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setBacktestFilter(f)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          backtestFilter === f
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        {f === "ALL" && "الكل"}
                        {f === "WON" && `الرابحة (${backtestResult.winningTrades})`}
                        {f === "LOST" && `الخاسرة (${backtestResult.losingTrades})`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-bold bg-slate-900/50">
                        <th className="p-3.5">الزوج والاتجاه</th>
                        <th className="p-3.5">وقت الدخول</th>
                        <th className="p-3.5">سعر الدخول</th>
                        <th className="p-3.5">سعر الإغلاق</th>
                        <th className="p-3.5">الربح / الخسارة %</th>
                        <th className="p-3.5">سبب الخروج</th>
                        <th className="p-3.5">مدة الصفقة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {backtestResult.trades
                        .filter(t => {
                          if (backtestFilter === "WON") return t.profitPct > 0;
                          if (backtestFilter === "LOST") return t.profitPct <= 0;
                          return true;
                        })
                        .map(trade => {
                          const isWin = trade.profitPct > 0;
                          return (
                            <tr key={trade.id} className="hover:bg-slate-800/40 transition-colors">
                              <td className="p-3.5 font-bold flex items-center gap-2">
                                <span className={trade.direction === "LONG" ? "text-emerald-400" : "text-rose-400"}>
                                  {trade.direction === "LONG" ? "▲ LONG" : "▼ SHORT"}
                                </span>
                                <span className="text-white">{trade.symbol}</span>
                              </td>
                              <td className="p-3.5 text-slate-400">{trade.openTime}</td>
                              <td className="p-3.5 text-slate-300 font-mono">${trade.openPrice}</td>
                              <td className="p-3.5 text-slate-300 font-mono">${trade.closePrice}</td>
                              <td className={`p-3.5 font-black font-mono ${isWin ? "text-emerald-400" : "text-rose-400"}`}>
                                {isWin ? `+${trade.profitPct}%` : `${trade.profitPct}%`}
                              </td>
                              <td className="p-3.5">
                                {trade.exitReason === "MINIMAL_ROI" && (
                                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                                    هدف جدول ROI
                                  </span>
                                )}
                                {trade.exitReason === "TRAILING_STOP" && (
                                  <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold">
                                    Trailing Stop مؤمّن
                                  </span>
                                )}
                                {trade.exitReason === "STOP_LOSS" && (
                                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold">
                                    وقف خسارة SL
                                  </span>
                                )}
                                {trade.exitReason === "SIGNAL_EXIT" && (
                                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold">
                                    نهاية المدة
                                  </span>
                                )}
                              </td>
                              <td className="p-3.5 text-slate-400 font-mono">{Math.round(trade.durationMinutes / 60)}h ({trade.durationMinutes}m)</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TRAILING STOP & DYNAMIC MINIMAL ROI TAB */}
      {/* ========================================================================= */}
      {activeSubTab === "roi_trailing" && (
        <div className="space-y-6">
          {/* Visual Concept Banner */}
          <div className="bg-[#0f172a] p-6 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-emerald-400" />
              <span>فلسفة Freqtrade الثورية: حماية الأرباح عبر Trailing Stop وجدول Minimal ROI الديناميكي</span>
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed max-w-4xl">
              في تداول العقود الآجلة، أكبر أسباب الخسارة هي انتظار أهداف غير واقعية أو عودة الصفقة من ربح إلى خسارة. 
              يحل Freqtrade هذه المشكلة بآليتين مدمجتين:
              <br />
              1. <strong className="text-emerald-400">Trailing Stop (وقف الخسارة المتحرك):</strong> فور وصول الصفقة لربح أولي (مثلاً +2.5%)، يتم سحب وقف الخسارة تلقائياً ليتحرك خلف السعر ويقفل الأرباح حتى لو انعكس السوق فجأة.
              <br />
              2. <strong className="text-blue-400">Dynamic Minimal ROI (جدول العائد المتناقص مع الوقت):</strong> يطلب ربحاً كبيراً في البداية (+8% فوراً)، لكن كلما طال بقاء الصفقة (بعد 30 و 60 و 120 دقيقة)، يكتفي بنسبة ربح أقل (+5%، +3%، +1.5%) للخروج بأمان قبل استنزاف الزخم.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Minimal ROI Table Editor */}
            <div className="bg-[#0f172a] p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>جدول Minimal ROI (الربح المستهدف حسب وقت بقاء الصفقة)</span>
                </h3>
              </div>

              <div className="space-y-3">
                {Object.entries(roiTable).map(([minutes, target]) => (
                  <div key={minutes} className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-white">
                        {minutes === "0" ? "⚡ في الدقائق الأولى (0 دقيقة)" : `⏱️ بعد مرور ${minutes} دقيقة`}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        الخروج فور تحقيق هذا الربح
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.005"
                        value={target}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          setRoiTable(prev => ({ ...prev, [minutes]: val }));
                        }}
                        className="w-24 bg-black/50 border border-slate-700 rounded-lg px-2.5 py-1 text-center font-mono font-bold text-emerald-400 text-xs"
                      />
                      <span className="text-xs font-bold text-slate-300">({(Number(target) * 100).toFixed(1)}%)</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-500/20 text-xs text-blue-300">
                💡 كلما زاد زمن الصفقة دون كسر المقاومة، يقوم Freqtrade بتخفيض شرط الربح لحماية رأس المال وعدم تعليق الرصيد.
              </div>
            </div>

            {/* Trailing Stop-Loss Configurator */}
            <div className="bg-[#0f172a] p-6 rounded-2xl border border-slate-800 space-y-5">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>إعدادات Trailing Stop (وقف الخسارة المتحرك)</span>
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div>
                    <div className="text-xs font-bold text-white">تفعيل ميزة Trailing Stop</div>
                    <div className="text-[11px] text-slate-400">سحب الوقف تلقائياً خلف السعر أثناء الصعود</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={trailingConfig.trailing_stop}
                    onChange={e => setTrailingConfig(prev => ({ ...prev, trailing_stop: e.target.checked }))}
                    className="w-4 h-4 accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">
                    مسافة الملاحقة (trailing_stop_positive):
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      step="0.002"
                      value={trailingConfig.trailing_stop_positive}
                      onChange={e => setTrailingConfig(prev => ({ ...prev, trailing_stop_positive: parseFloat(e.target.value) || 0 }))}
                      className="w-32 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold text-emerald-400 font-mono"
                    />
                    <span className="text-xs text-slate-400">
                      = {(trailingConfig.trailing_stop_positive * 100).toFixed(1)}% مسافة خلف أعلى قمة
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">
                    شرط تفعيل الملاحقة (trailing_stop_positive_offset):
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      step="0.005"
                      value={trailingConfig.trailing_stop_positive_offset}
                      onChange={e => setTrailingConfig(prev => ({ ...prev, trailing_stop_positive_offset: parseFloat(e.target.value) || 0 }))}
                      className="w-32 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold text-blue-400 font-mono"
                    />
                    <span className="text-xs text-slate-400">
                      = يبدأ بسحب الوقف فور تحقيق الصفقة +{(trailingConfig.trailing_stop_positive_offset * 100).toFixed(1)}% ربح
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div>
                    <div className="text-xs font-bold text-white">trailing_only_offset_is_reached</div>
                    <div className="text-[11px] text-slate-400">عدم تحريك الوقف إلا بعد تجاوز عتبة الربح المحددة</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={trailingConfig.trailing_only_offset_is_reached}
                    onChange={e => setTrailingConfig(prev => ({ ...prev, trailing_only_offset_is_reached: e.target.checked }))}
                    className="w-4 h-4 accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveRoiTrailing}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>حفظ وتفعيل هذه الإعدادات في المحرك بالخلفية الآن</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. STRATEGY BUILDER & FREQTRADE PYTHON EXPORTER */}
      {/* ========================================================================= */}
      {activeSubTab === "builder" && (
        <div className="space-y-6">
          <div className="bg-[#0f172a] p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-emerald-400" />
                  <span>تصدير كود بايثون القياسي لمستودع Freqtrade (Native Strategy Export)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  إذا كنت ترغب بتشغيل نفس هذه الاستراتيجية على سيرفر VPS خاص بك باستخدام Freqtrade الأصلي، يمكنك نسخ كود الاستراتيجية وملف config.json الجاهزين بضغطة زر واحدة.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(exportStrategyPy);
                    setCopiedFile("py");
                    setTimeout(() => setCopiedFile(null), 2500);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 border border-slate-700 cursor-pointer"
                >
                  {copiedFile === "py" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedFile === "py" ? "تم نسخ Strategy.py!" : "نسخ Strategy.py"}</span>
                </button>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(exportConfigJson);
                    setCopiedFile("json");
                    setTimeout(() => setCopiedFile(null), 2500);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 border border-slate-700 cursor-pointer"
                >
                  {copiedFile === "json" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedFile === "json" ? "تم نسخ Config.json!" : "نسخ Config.json"}</span>
                </button>
              </div>
            </div>

            {/* Code Viewers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>📄 ملف الاستراتيجية: strategy.py</span>
                  <span className="text-[10px] text-slate-500 font-mono">IStrategy Interface v3</span>
                </div>
                <pre className="bg-black/70 p-4 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-400 h-96 overflow-y-auto leading-relaxed select-all" dir="ltr">
                  {exportStrategyPy}
                </pre>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>⚙️ ملف الإعدادات: config.json</span>
                  <span className="text-[10px] text-slate-500 font-mono">Binance Futures Isolated</span>
                </div>
                <pre className="bg-black/70 p-4 rounded-xl border border-slate-800 text-[11px] font-mono text-blue-300 h-96 overflow-y-auto leading-relaxed select-all" dir="ltr">
                  {exportConfigJson}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
