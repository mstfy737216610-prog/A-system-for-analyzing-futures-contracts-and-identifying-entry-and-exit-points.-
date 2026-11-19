import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import {
  Crosshair, Cpu, ShieldAlert, TrendingUp, TrendingDown, RefreshCcw,
  Eye, Activity, Layers, Globe, Sparkles, CheckCircle2, AlertTriangle,
  Copy, Check, DollarSign, Newspaper, Settings, FolderSync, Zap, Radar,
  Search, Award, BookOpen
} from "lucide-react";

interface CandleBar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  takerBuyVolume?: number;
}

interface ExchangePriceComparison {
  exchange: string;
  price: number;
  change24hPct: number;
  volume24hUsd: number;
  spreadVsMedianPct: number;
  status: string;
}

interface HistoricalFractalMatch {
  dateStr: string;
  candlesAgo: number;
  similarityPct: number;
  next6CandlesReturnPct: number;
  next12CandlesReturnPct: number;
  outcome: "BULLISH_RALLY" | "BEARISH_DROP" | "SIDEWAYS";
}

interface AiCallResult {
  role: string;
  usedAi: boolean;
  providerName: string;
  model: string;
  latencyMs: number;
  text: string;
  fallbackUsed?: boolean;
}

interface CrossMarketPulse {
  cryptoMajorsAvgChangePct: number;
  aiSectorAvgChangePct: number;
  aiSectorLeaders: Array<{ symbol: string; price: number; change24hPct: number }>;
  goldMacro: { symbol: string; price: number; change24hPct: number };
  fearAndGreed: { value: number; label: string; arabic: string };
  btcFundingRatePct: number;
  btcLongShortRatio: number;
  overallMarketRegime: string;
  regimeArabic: string;
}

interface DeepCyberQuantReport {
  symbol: string;
  currentPrice: number;
  direction: "LONG" | "SHORT" | "WAIT";
  confidence: number;
  winProbabilityPct: number;
  grade: string;
  entryLimit: number;
  entryZone: [number, number];
  stopLoss: number;
  tp1: number;
  tp2: number;
  tp3: number;
  rrRatio: number;
  expectedHorizon: string;
  supports: number[];
  resistances: number[];
  liquidityZones: Array<{ price: number; type: string; strength: string }>;
  exchangeComparison: ExchangePriceComparison[];
  multiTimeframeCandles: {
    "5m": CandleBar[];
    "15m": CandleBar[];
    "1h": CandleBar[];
    "4h": CandleBar[];
  };
  timeframeSignals: Array<{
    tf: "5m" | "15m" | "1h" | "4h";
    trend: "BULLISH" | "BEARISH" | "NEUTRAL";
    rsi: number;
    ema20: number;
    ema50: number;
    squeeze: boolean;
    verdictArabic: string;
  }>;
  cyberTrapAudit: {
    trapRiskScore: number;
    isSafeToTrade: boolean;
    detectedTraps: string[];
    candleAnatomy: {
      takerBuyRatioPct: number;
      netOrderflowDeltaBias: string;
      upperWickPct: number;
      lowerWickPct: number;
      volatilityCompressionPct: number;
      squeezeActive: boolean;
      explosionProbabilityPct: number;
    };
    crossExchangeAnomaly: {
      maxSpreadPct: number;
      arbitrageGapDetected: boolean;
      manipulationWarning: string;
    };
  };
  historicalMatches: HistoricalFractalMatch[];
  historicalWinRatePct: number;
  smallCapitalPlan: {
    capitalUsd: number;
    riskPerTradeUsd: number;
    riskPercent: number;
    recommendedLeverage: number;
    marginType: string;
    positionSizeUsd: number;
    liquidationPrice: number;
    liquidationDistancePct: number;
    expectedProfitTp1Usd: number;
    expectedProfitTp2Usd: number;
    expectedProfitTp3Usd: number;
    compounding10TradesTargetUsd: number;
  };
  crossMarketPulse: CrossMarketPulse;
  coinMemory: {
    symbol: string;
    totalSignals: number;
    wins: number;
    losses: number;
    winRate: number;
    learnedRules: string[];
  };
  aiCouncil: Record<string, AiCallResult>;
  deterministicSummaryArabic: string;
  timestamp: number;
}

interface FastOpportunityItem {
  symbol: string;
  price: number;
  change24hPct: number;
  volume24hUsd: number;
  direction: "LONG" | "SHORT";
  confidence: number;
  winProbabilityPct: number;
  setupType: string;
  setupArabic: string;
  timeframe: "5m" | "15m" | "1h" | "4h";
  entryLimit: number;
  stopLoss: number;
  tp1: number;
  tp2: number;
  tp3: number;
  rrRatio: number;
  trapRiskScore: number;
  squeezeScore: number;
  takerBuyPct: number;
  historicalWinRatePct: number;
  reasonArabic: string;
  smallCapPlan: DeepCyberQuantReport["smallCapitalPlan"];
}

interface MultiScreenQuantCockpitProps {
  selectedSymbol: string;
  allSymbols: string[];
  onSelectSymbol: (sym: string) => void;
  onOpenAiModal: () => void;
  onOpenNews: () => void;
  onOpenTermuxDocs: () => void;
}

function drawMiniCandlesCanvas(
  canvas: HTMLCanvasElement | null,
  candles: CandleBar[],
  tfLabel: string,
  supports: number[],
  resistances: number[],
  symbol: string
) {
  if (!canvas || !candles || candles.length === 0) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  ctx.fillStyle = "#070b12";
  ctx.fillRect(0, 0, w, h);

  // Grid
  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    const y = (h / 4) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  const bars = candles.slice(-48);
  let minP = Math.min(...bars.map((b) => b.low));
  let maxP = Math.max(...bars.map((b) => b.high));
  if (maxP <= minP) maxP = minP * 1.01;
  const pad = (maxP - minP) * 0.12;
  minP -= pad;
  maxP += pad;

  const toY = (p: number) => h - 18 - ((p - minP) / (maxP - minP)) * (h - 38);
  const stepX = (w - 16) / bars.length;
  const bodyW = Math.max(2, stepX * 0.62);

  // Draw S/R dashed lines
  const drawLevel = (price: number, color: string, label: string) => {
    if (price < minP || price > maxP) return;
    const y = toY(price);
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(4, y);
    ctx.lineTo(w - 4, y);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = "10px monospace";
    ctx.fillText(`${label} ${price}`, 6, Math.max(12, y - 3));
    ctx.restore();
  };

  if (supports[0]) drawLevel(supports[0], "rgba(16,185,129,0.7)", "S1");
  if (resistances[0]) drawLevel(resistances[0], "rgba(244,63,94,0.7)", "R1");

  // Compute EMA20 overlay
  const emaVals: number[] = [];
  const k = 2 / 21;
  let ema = bars[0].close;
  for (const b of bars) {
    ema = b.close * k + ema * (1 - k);
    emaVals.push(ema);
  }

  // Draw candlesticks
  bars.forEach((b, idx) => {
    const cx = 8 + idx * stepX + stepX / 2;
    const isUp = b.close >= b.open;
    const color = isUp ? "#10b981" : "#f43f5e";

    ctx.strokeStyle = color;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(cx, toY(b.high));
    ctx.lineTo(cx, toY(b.low));
    ctx.stroke();

    const yOpen = toY(b.open);
    const yClose = toY(b.close);
    const rectY = Math.min(yOpen, yClose);
    const rectH = Math.max(2, Math.abs(yClose - yOpen));
    ctx.fillStyle = color;
    ctx.fillRect(cx - bodyW / 2, rectY, bodyW, rectH);
  });

  // Draw EMA20 curve
  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  emaVals.forEach((val, idx) => {
    const cx = 8 + idx * stepX + stepX / 2;
    const cy = toY(val);
    if (idx === 0) ctx.moveTo(cx, cy);
    else ctx.lineTo(cx, cy);
  });
  ctx.stroke();

  // Corner Watermark for Vision AI clarity
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = "bold 11px monospace";
  ctx.fillText(`${symbol} [${tfLabel.toUpperCase()}] | Last: ${bars[bars.length - 1].close}`, 8, 14);
}

export const MultiScreenQuantCockpit: React.FC<MultiScreenQuantCockpitProps> = ({
  selectedSymbol,
  allSymbols,
  onSelectSymbol,
  onOpenAiModal,
  onOpenNews,
  onOpenTermuxDocs
}) => {
  const [symbolInput, setSymbolInput] = useState(selectedSymbol || "BTCUSDT");
  const [capitalUsd, setCapitalUsd] = useState<number>(50);
  const [scanTimeframe, setScanTimeframe] = useState<"5m" | "15m" | "1h" | "4h">("15m");
  const [includeAi, setIncludeAi] = useState<boolean>(true);
  const [loadingDeep, setLoadingDeep] = useState<boolean>(false);
  const [loadingScan, setLoadingScan] = useState<boolean>(false);
  const [pulse, setPulse] = useState<CrossMarketPulse | null>(null);
  const [report, setReport] = useState<DeepCyberQuantReport | null>(null);
  const [scanResult, setScanResult] = useState<{
    scannedTotalPairs: number;
    shortlistedScanned: number;
    opportunities: FastOpportunityItem[];
  } | null>(null);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [copiedFlag, setCopiedFlag] = useState(false);
  const [recordingOutcome, setRecordingOutcome] = useState(false);

  const canvasRefs = useRef<Record<"5m" | "15m" | "1h" | "4h", HTMLCanvasElement | null>>({
    "5m": null,
    "15m": null,
    "1h": null,
    "4h": null
  });

  useEffect(() => {
    if (selectedSymbol) setSymbolInput(selectedSymbol);
  }, [selectedSymbol]);

  const drawAllCharts = useCallback((rep: DeepCyberQuantReport) => {
    (["5m", "15m", "1h", "4h"] as const).forEach((tf) => {
      drawMiniCandlesCanvas(
        canvasRefs.current[tf],
        rep.multiTimeframeCandles[tf],
        tf,
        rep.supports,
        rep.resistances,
        rep.symbol
      );
    });
  }, []);

  useEffect(() => {
    if (report) {
      const id = requestAnimationFrame(() => drawAllCharts(report));
      return () => cancelAnimationFrame(id);
    }
  }, [report, drawAllCharts]);

  const runDeepAnalyze = useCallback(
    async (targetSym: string, withScreenshots = false, aiFlag = includeAi) => {
      const cleanSym = targetSym.toUpperCase().trim().endsWith("USDT")
        ? targetSym.toUpperCase().trim()
        : `${targetSym.toUpperCase().trim()}USDT`;
      setLoadingDeep(true);
      setStatusBanner(
        withScreenshots
          ? `جاري التقاط صور الشاشات الـ 4 (5m/15m/1h/4h) وإرسالها مع التحليل الكمي لـ ${cleanSym}...`
          : `جاري التحليل السيبراني والكمي عبر 4 منصات وتاريخ 450 شمعة لـ ${cleanSym}...`
      );

      try {
        const screenshots: Array<{ label: string; dataUrl: string }> = [];
        if (withScreenshots) {
          (["15m", "1h", "4h"] as const).forEach((tf) => {
            const c = canvasRefs.current[tf];
            if (c) {
              screenshots.push({
                label: `${cleanSym}-${tf}`,
                dataUrl: c.toDataURL("image/png")
              });
            }
          });
        }

        const res = await axios.post("/api/cyber-quant/deep-analyze", {
          symbol: cleanSym,
          capitalUsd,
          screenshots,
          includeAi: aiFlag
        });

        if (res.data?.report) {
          setReport(res.data.report);
          if (res.data.report.crossMarketPulse) setPulse(res.data.report.crossMarketPulse);
          onSelectSymbol(cleanSym);
          setStatusBanner(
            `اكتمل الفحص الشامل لـ ${cleanSym} (${aiFlag ? "مع مجلس الـ 5 نماذج AI" : "بدون AI — المحرك الكمي المستقل"}) ✅`
          );
        }
      } catch (err: any) {
        setStatusBanner(err?.response?.data?.error || "تعذر إتمام التحليل العميق حالياً.");
      } finally {
        setLoadingDeep(false);
      }
    },
    [capitalUsd, includeAi, onSelectSymbol]
  );

  const runFullMarketScan = async () => {
    setLoadingScan(true);
    setStatusBanner(`جاري مسح جميع عملات العقود الآجلة (745+ عملة) على فريم ${scanTimeframe} لاقتناص الفرص الأعلى ربحاً (>80%)...`);
    try {
      const res = await axios.get("/api/cyber-quant/scan-market", {
        params: { capitalUsd, timeframe: scanTimeframe }
      });
      if (res.data?.opportunities) {
        setScanResult({
          scannedTotalPairs: res.data.scannedTotalPairs,
          shortlistedScanned: res.data.shortlistedScanned,
          opportunities: res.data.opportunities
        });
        if (res.data.crossPulse) setPulse(res.data.crossPulse);
        setStatusBanner(
          `تم فحص ${res.data.scannedTotalPairs} زوج عقود آجلة وتصفية ${res.data.opportunities.length} فرصة سريعة وعالية الدقة 🎯`
        );
      }
    } catch (err: any) {
      setStatusBanner(err?.response?.data?.error || "فشل مسح السوق الكامل");
    } finally {
      setLoadingScan(false);
    }
  };

  useEffect(() => {
    axios
      .get("/api/cyber-quant/pulse")
      .then((r) => {
        if (r.data?.pulse) setPulse(r.data.pulse);
      })
      .catch(() => {});
    runDeepAnalyze(selectedSymbol || "BTCUSDT", false, includeAi);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRecordOutcome = async (outcome: "WIN" | "LOSS") => {
    if (!report) return;
    setRecordingOutcome(true);
    try {
      const pnlPct = outcome === "WIN" ? 18.5 : -4.5;
      const res = await axios.post("/api/storage/record-lesson", {
        symbol: report.symbol,
        timeframe: "15m",
        direction: report.direction === "SHORT" ? "SHORT" : "LONG",
        entry: report.entryLimit,
        exit: outcome === "WIN" ? report.tp2 : report.stopLoss,
        sl: report.stopLoss,
        tp1: report.tp1,
        tp2: report.tp2,
        outcome,
        pnlPercent: pnlPct,
        entryReason: report.deterministicSummaryArabic
      });
      if (res.data?.profile) {
        setReport((prev) => (prev ? { ...prev, coinMemory: res.data.profile } : prev));
        setStatusBanner(`تم حفظ نتيجة الصفقة (${outcome}) واستخلاص الدرس في ملف ${report.symbol}.json بمجلد التنزيلات 🧠`);
      }
    } catch {
      setStatusBanner("تعذر حفظ سجل التعلم");
    } finally {
      setRecordingOutcome(false);
    }
  };

  const copyTradePlan = () => {
    if (!report) return;
    const text = `🎯 خطة قنص ${report.symbol} (${report.direction})
💰 السعر الحالي: $${report.currentPrice}
📥 دخول Limit آمن: $${report.entryLimit}
🛑 وقف الخسارة: $${report.stopLoss}
🎯 TP1: $${report.tp1} | TP2: $${report.tp2} | TP3: $${report.tp3}
⚖️ نسبة العائد: 1:${report.rrRatio} | احتمالية النجاح: ${report.winProbabilityPct}%
🛡️ خطة رأس مال $${report.smallCapitalPlan.capitalUsd}: رافعة معزولة ${report.smallCapitalPlan.recommendedLeverage}x | أقصى خسارة $${report.smallCapitalPlan.riskPerTradeUsd}
📌 السبب: ${report.aiCouncil?.entryExplain?.text || report.deterministicSummaryArabic}`;
    navigator.clipboard.writeText(text);
    setCopiedFlag(true);
    setTimeout(() => setCopiedFlag(false), 1800);
  };

  return (
    <div className="space-y-5 text-right" dir="rtl">
      {/* Top Command Bar */}
      <div className="bg-[#090d16] border border-cyan-500/25 rounded-xl p-4 space-y-3 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Radar className="w-5 h-5 text-cyan-400" />
              <span>غرفة العمليات المتعددة الشاشات + التحليل السيبراني والكمي</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-mono">
                بدون مفتاح Binance 🔓
              </span>
            </h2>
            <p className="text-xs text-white/55 mt-0.5">
              مراقبة 4 أطر زمنية معاً + مقارنة 4 منصات (Binance / Bybit / OKX / Gate) + كشف المصائد + مجلس 5 نماذج AI متوازية
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* AI vs Non-AI Toggle */}
            <button
              type="button"
              onClick={() => setIncludeAi(!includeAi)}
              className={`px-3 py-2 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all ${
                includeAi
                  ? "bg-cyan-500/15 border-cyan-400/50 text-cyan-300"
                  : "bg-amber-500/15 border-amber-400/50 text-amber-300"
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>{includeAi ? "الوضع: بالذكاء الاصطناعي + الكمي" : "الوضع: بدون ذكاء اصطناعي (كمي فائق)"}</span>
            </button>

            <button
              type="button"
              onClick={onOpenAiModal}
              className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-bold text-white flex items-center gap-1.5"
            >
              <Settings className="w-4 h-4 text-cyan-400" />
              <span>مواقع ومفاتيح AI</span>
            </button>

            <button
              type="button"
              onClick={onOpenNews}
              className="px-3 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-bold text-amber-300 flex items-center gap-1.5"
            >
              <Newspaper className="w-4 h-4" />
              <span>أخبار الفيدرالي</span>
            </button>

            <button
              type="button"
              onClick={onOpenTermuxDocs}
              className="px-3 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-bold text-emerald-300 flex items-center gap-1.5"
            >
              <FolderSync className="w-4 h-4" />
              <span>ذاكرة Termux والتنزيلات</span>
            </button>
          </div>
        </div>

        {/* Search + Capital + Sniper Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 pt-2 border-t border-white/10">
          <div className="lg:col-span-3 relative">
            <Search className="w-4 h-4 text-white/30 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              list="cockpit-symbols-list"
              value={symbolInput}
              onChange={(e) => setSymbolInput(e.target.value.toUpperCase())}
              placeholder="اكتب أي عملة (BTC, TAO, SOL, PEPE...)"
              className="w-full bg-black/70 border border-white/15 focus:border-cyan-400 rounded-lg pr-9 pl-3 py-2.5 text-xs font-mono text-white focus:outline-none"
            />
            <datalist id="cockpit-symbols-list">
              {allSymbols.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>

          <div className="lg:col-span-2 flex items-center gap-2 bg-black/70 border border-white/15 rounded-lg px-3 py-1.5">
            <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="flex-1">
              <span className="text-[9px] text-white/45 block">رأس المال ($)</span>
              <input
                type="number"
                min={10}
                max={100000}
                value={capitalUsd}
                onChange={(e) => setCapitalUsd(Math.max(10, Number(e.target.value) || 50))}
                className="w-full bg-transparent text-xs font-mono font-bold text-emerald-300 focus:outline-none"
              />
            </div>
          </div>

          <div className="lg:col-span-2 flex items-center gap-1 bg-black/70 border border-white/15 rounded-lg p-1">
            {(["5m", "15m", "1h", "4h"] as const).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setScanTimeframe(tf)}
                className={`flex-1 py-1.5 rounded text-[11px] font-mono font-bold transition-all ${
                  scanTimeframe === tf ? "bg-amber-400 text-black" : "text-white/50 hover:text-white"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <div className="lg:col-span-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={runFullMarketScan}
              disabled={loadingScan}
              className="flex-1 min-w-[160px] px-4 py-2.5 bg-gradient-to-l from-amber-400 to-orange-400 hover:brightness-110 text-black font-black text-xs rounded-lg flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20"
            >
              {loadingScan ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Crosshair className="w-4 h-4" />}
              <span>اقتناص الفرص (كل السوق)</span>
            </button>

            <button
              type="button"
              onClick={() => runDeepAnalyze(symbolInput, false, includeAi)}
              disabled={loadingDeep}
              className="flex-1 min-w-[140px] px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs rounded-lg flex items-center justify-center gap-1.5"
            >
              {loadingDeep ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
              <span>فحص منفرد عميق</span>
            </button>

            <button
              type="button"
              onClick={() => runDeepAnalyze(symbolInput, true, true)}
              disabled={loadingDeep || !report}
              className="px-3.5 py-2.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-200 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5"
              title="يلتقط صور الشاشات الـ 4 ويرسلها لنموذج الرؤية البصرية"
            >
              <Eye className="w-4 h-4" />
              <span>فحص الصور البصري</span>
            </button>
          </div>
        </div>

        {statusBanner && (
          <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/25 rounded-lg text-xs text-cyan-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{statusBanner}</span>
          </div>
        )}
      </div>

      {/* Cross-Market Pulse Ribbon (Crypto Majors + AI Sector + Gold Macro + Sentiment) */}
      {pulse && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <div className="p-3 bg-[#090d16] border border-white/10 rounded-xl">
            <span className="text-[10px] text-white/45 block">نبض العملات القيادية</span>
            <span className={`text-sm font-black font-mono ${pulse.cryptoMajorsAvgChangePct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {pulse.cryptoMajorsAvgChangePct >= 0 ? "+" : ""}
              {pulse.cryptoMajorsAvgChangePct}%
            </span>
          </div>
          <div className="p-3 bg-[#090d16] border border-cyan-500/25 rounded-xl">
            <span className="text-[10px] text-cyan-300/70 block">قطاع الذكاء الاصطناعي (AI)</span>
            <span className={`text-sm font-black font-mono ${pulse.aiSectorAvgChangePct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {pulse.aiSectorAvgChangePct >= 0 ? "+" : ""}
              {pulse.aiSectorAvgChangePct}%
            </span>
          </div>
          <div className="p-3 bg-[#090d16] border border-amber-500/25 rounded-xl">
            <span className="text-[10px] text-amber-300/70 block">الذهب (XAUUSDT)</span>
            <span className="text-sm font-black font-mono text-amber-300">
              ${pulse.goldMacro.price} ({pulse.goldMacro.change24hPct >= 0 ? "+" : ""}
              {pulse.goldMacro.change24hPct}%)
            </span>
          </div>
          <div className="p-3 bg-[#090d16] border border-white/10 rounded-xl">
            <span className="text-[10px] text-white/45 block">مؤشر الخوف والطمع</span>
            <span className="text-sm font-black font-mono text-white">
              {pulse.fearAndGreed.value}/100
            </span>
            <span className="text-[9px] text-white/50 block truncate">{pulse.fearAndGreed.arabic}</span>
          </div>
          <div className="p-3 bg-[#090d16] border border-white/10 rounded-xl">
            <span className="text-[10px] text-white/45 block">التمويل / Long-Short</span>
            <span className="text-xs font-black font-mono text-white">
              {pulse.btcFundingRatePct}% | L/S {pulse.btcLongShortRatio}
            </span>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
            <span className="text-[10px] text-emerald-300/70 block">حالة السوق العامة</span>
            <span className="text-xs font-black text-emerald-300">{pulse.regimeArabic}</span>
          </div>
        </div>
      )}

      {/* Full-Market Opportunities Grid (if scanned) */}
      {scanResult && (
        <div className="bg-[#090d16] border border-amber-500/30 rounded-xl p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-black text-white">
                نتائج قناص السوق الشامل ({scanResult.opportunities.length} فرصة عالية الاحتمال من أصل {scanResult.scannedTotalPairs} عملة)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-amber-300">
              فريم المسح: {scanTimeframe} | خطة رأس المال: ${capitalUsd}
            </span>
          </div>

          {scanResult.opportunities.length === 0 ? (
            <div className="py-6 text-center text-xs text-white/50">
              لا توجد فرص مطابقة لشروط الأمان الصارمة الآن على فريم {scanTimeframe}. جرب فريماً آخر مثل 15m أو 1h.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {scanResult.opportunities.map((opp) => (
                <div
                  key={opp.symbol}
                  className="p-3.5 bg-black/50 border border-white/10 hover:border-amber-400/50 rounded-xl space-y-2.5 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-black font-mono text-white">{opp.symbol}</span>
                      <span className="text-[10px] text-white/50 block">{opp.setupArabic}</span>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded text-[11px] font-black font-mono ${
                        opp.direction === "LONG" ? "bg-emerald-500 text-black" : "bg-rose-500 text-white"
                      }`}
                    >
                      {opp.direction === "LONG" ? "🚀 LONG" : "🔻 SHORT"} {opp.winProbabilityPct}%
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono bg-white/[0.03] p-2 rounded-lg">
                    <div>
                      <span className="text-white/40 block">دخول Limit</span>
                      <strong className="text-white">${opp.entryLimit}</strong>
                    </div>
                    <div>
                      <span className="text-white/40 block">الوقف SL</span>
                      <strong className="text-rose-400">${opp.stopLoss}</strong>
                    </div>
                    <div>
                      <span className="text-white/40 block">TP2</span>
                      <strong className="text-emerald-400">${opp.tp2}</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-white/70">
                    <span>
                      رافعة {opp.smallCapPlan.recommendedLeverage}x | ربح متوقع TP2:{" "}
                      <strong className="text-emerald-300">+${opp.smallCapPlan.expectedProfitTp2Usd}</strong>
                    </span>
                    <span className="font-mono text-cyan-300">R:R 1:{opp.rrRatio}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSymbolInput(opp.symbol);
                      runDeepAnalyze(opp.symbol, false, includeAi);
                    }}
                    className="w-full py-2 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/35 text-cyan-200 font-bold text-[11px] rounded-lg"
                  >
                    فتح على الـ 4 شاشات وفحص التلاعب
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Deep Analysis & 4-Screen Candlestick Monitor */}
      {report && (
        <>
          {/* 4-Screen Live Candlesticks */}
          <div className="bg-[#090d16] border border-white/10 rounded-xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>شاشات الشموع اليابانية المتزامنة (5m / 15m / 1h / 4h) — {report.symbol}</span>
              </h3>
              <span className="text-[11px] text-white/50">
                الخط السماوي = EMA20 | الأخضر المتقطع = دعم S1 | الأحمر المتقطع = مقاومة R1
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(["5m", "15m", "1h", "4h"] as const).map((tf) => {
                const sig = report.timeframeSignals.find((s) => s.tf === tf);
                return (
                  <div key={tf} className="bg-black/60 border border-white/10 rounded-xl p-2.5 space-y-2">
                    <div className="flex items-center justify-between text-xs px-1">
                      <span className="font-mono font-black text-white">شاشة {tf.toUpperCase()}</span>
                      {sig && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            sig.trend === "BULLISH"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : sig.trend === "BEARISH"
                                ? "bg-rose-500/20 text-rose-300"
                                : "bg-white/10 text-white/60"
                          }`}
                        >
                          {sig.verdictArabic}
                        </span>
                      )}
                    </div>
                    <canvas
                      ref={(el) => {
                        canvasRefs.current[tf] = el;
                      }}
                      width={560}
                      height={210}
                      className="w-full h-[185px] rounded-lg border border-white/5"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Signal Decision + $50 Capital Risk Plan + Multi-Exchange Comparison */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            {/* Signal & $50 Small Capital Plan */}
            <div className="xl:col-span-5 bg-[#090d16] border border-emerald-500/30 rounded-xl p-4 space-y-4">
              <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black font-mono text-white">{report.symbol}</span>
                    <span className="text-xs font-mono bg-white/10 text-white px-2 py-0.5 rounded">
                      ${report.currentPrice}
                    </span>
                    <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded font-bold">
                      {report.grade}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/60 mt-1">
                    المدة المتوقعة: {report.expectedHorizon} • احتمالية النجاح: <strong className="text-emerald-300">{report.winProbabilityPct}%</strong>
                  </p>
                </div>

                <div
                  className={`px-3 py-1.5 rounded-lg text-xs font-black font-mono flex items-center gap-1 ${
                    report.direction === "LONG" ? "bg-emerald-500 text-black" : "bg-rose-500 text-white"
                  }`}
                >
                  {report.direction === "LONG" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span>{report.direction}</span>
                </div>
              </div>

              {/* Targets Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center font-mono text-xs">
                <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                  <span className="text-[9px] text-white/45 block">دخول Limit</span>
                  <strong className="text-white">${report.entryLimit}</strong>
                </div>
                <div className="p-2 bg-rose-500/10 rounded-lg border border-rose-500/30">
                  <span className="text-[9px] text-rose-300 block">وقف الخسارة</span>
                  <strong className="text-rose-300">${report.stopLoss}</strong>
                </div>
                <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/25">
                  <span className="text-[9px] text-emerald-300 block">TP1</span>
                  <strong className="text-emerald-300">${report.tp1}</strong>
                </div>
                <div className="p-2 bg-emerald-500/15 rounded-lg border border-emerald-500/40">
                  <span className="text-[9px] text-emerald-200 block">TP2</span>
                  <strong className="text-white">${report.tp2}</strong>
                </div>
                <div className="p-2 bg-amber-500/15 rounded-lg border border-amber-500/35">
                  <span className="text-[9px] text-amber-300 block">TP3</span>
                  <strong className="text-amber-200">${report.tp3}</strong>
                </div>
              </div>

              {/* $50 Capital Compounding & Anti-Liquidation Shield */}
              <div className="p-3.5 bg-emerald-500/5 border border-emerald-500/25 rounded-xl space-y-2 text-xs">
                <div className="font-black text-emerald-300 flex items-center justify-between">
                  <span>🛡️ خطة حماية رأس المال (${report.smallCapitalPlan.capitalUsd}) ومنع التصفير</span>
                  <span className="font-mono text-[11px]">R:R 1:{report.rrRatio}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div>الرافعة الآمنة: <strong className="text-white">{report.smallCapitalPlan.recommendedLeverage}x (معزول)</strong></div>
                  <div>أقصى خسارة للصفقة: <strong className="text-rose-300">${report.smallCapitalPlan.riskPerTradeUsd} ({report.smallCapitalPlan.riskPercent}%)</strong></div>
                  <div>مسافة التصفية الآمنة: <strong className="text-cyan-300">{report.smallCapitalPlan.liquidationDistancePct}%</strong></div>
                  <div>حجم المركز: <strong className="text-white">${report.smallCapitalPlan.positionSizeUsd}</strong></div>
                  <div>الربح المتوقع (TP1 / TP2 / TP3): <strong className="text-emerald-300">+${report.smallCapitalPlan.expectedProfitTp1Usd} / +${report.smallCapitalPlan.expectedProfitTp2Usd} / +${report.smallCapitalPlan.expectedProfitTp3Usd}</strong></div>
                  <div>نمو التراكم (10 صفقات): <strong className="text-amber-300">${report.smallCapitalPlan.compounding10TradesTargetUsd}</strong></div>
                </div>
              </div>

              {/* Actions: Copy & Record Trade Lesson */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={copyTradePlan}
                  className="flex-1 py-2 px-3 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5"
                >
                  {copiedFlag ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedFlag ? "تم النسخ!" : "نسخ خطة الدخول"}</span>
                </button>
                <button
                  type="button"
                  disabled={recordingOutcome}
                  onClick={() => handleRecordOutcome("WIN")}
                  className="py-2 px-3 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold rounded-lg"
                >
                  ✅ تسجيل ربح (تعلم)
                </button>
                <button
                  type="button"
                  disabled={recordingOutcome}
                  onClick={() => handleRecordOutcome("LOSS")}
                  className="py-2 px-3 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold rounded-lg"
                >
                  ❌ تسجيل خسارة (تحليل الخطأ)
                </button>
              </div>
            </div>

            {/* Cyber Trap Audit + Cross-Exchange + Fractals */}
            <div className="xl:col-span-7 space-y-4">
              {/* Multi-Exchange Price Comparison */}
              <div className="bg-[#090d16] border border-white/10 rounded-xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-xs font-black text-white flex items-center gap-2">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    <span>مقارنة الأسعار اللحظية عبر المنصات الكبرى (كشف الفجوات والاحتيال السعري)</span>
                  </h4>
                  <span className="text-[10px] font-mono text-cyan-300">
                    أقصى فرق: {report.cyberTrapAudit.crossExchangeAnomaly.maxSpreadPct}%
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {report.exchangeComparison.map((ex) => (
                    <div key={ex.exchange} className="p-2.5 bg-black/50 border border-white/10 rounded-lg font-mono">
                      <span className="text-[10px] text-white/50 block">{ex.exchange}</span>
                      <strong className="text-xs text-white block mt-0.5">${ex.price}</strong>
                      <div className="flex items-center justify-between text-[10px] mt-1">
                        <span className={ex.change24hPct >= 0 ? "text-emerald-400" : "text-rose-400"}>
                          {ex.change24hPct >= 0 ? "+" : ""}
                          {ex.change24hPct}%
                        </span>
                        <span className="text-white/40">Δ {ex.spreadVsMedianPct}%</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-white/65">{report.cyberTrapAudit.crossExchangeAnomaly.manipulationWarning}</p>
              </div>

              {/* Cyber Trap & Candle Anatomy */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#090d16] border border-white/10 rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-amber-400" />
                      <span>مدقق الأمن السيبراني وعمق الشموع</span>
                    </h4>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        report.cyberTrapAudit.isSafeToTrade ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
                      }`}
                    >
                      خطورة المصائد: {report.cyberTrapAudit.trapRiskScore}/100
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-black/40 p-2.5 rounded-lg">
                    <div>ضغط الشراء (Taker): <strong className="text-emerald-300">{report.cyberTrapAudit.candleAnatomy.takerBuyRatioPct}%</strong></div>
                    <div>احتمال الانفجار: <strong className="text-amber-300">{report.cyberTrapAudit.candleAnatomy.explosionProbabilityPct}%</strong></div>
                    <div>ذيل علوي: <strong className="text-white">{report.cyberTrapAudit.candleAnatomy.upperWickPct}%</strong></div>
                    <div>ذيل سفلي: <strong className="text-white">{report.cyberTrapAudit.candleAnatomy.lowerWickPct}%</strong></div>
                  </div>

                  <ul className="space-y-1 text-[11px] text-white/75">
                    {report.cyberTrapAudit.detectedTraps.map((t, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Historical Fractal Matches */}
                <div className="bg-[#090d16] border border-white/10 rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-purple-400" />
                      <span>التشابه التاريخي (Historical Fractals)</span>
                    </h4>
                    <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-bold">
                      نجاح تاريخي: {report.historicalWinRatePct}%
                    </span>
                  </div>

                  {report.historicalMatches.length === 0 ? (
                    <p className="text-xs text-white/50">النمط الحالي فريد نسبياً — يعتمد التقييم على السيولة وعمق الشموع.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {report.historicalMatches.slice(0, 4).map((m, i) => (
                        <div key={i} className="flex items-center justify-between text-[11px] font-mono bg-black/40 px-2.5 py-1.5 rounded-lg">
                          <span className="text-white/75">{m.dateStr}</span>
                          <span className="text-cyan-300">تطابق {m.similarityPct}%</span>
                          <span className={m.next12CandlesReturnPct >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                            {m.next12CandlesReturnPct >= 0 ? "+" : ""}
                            {m.next12CandlesReturnPct}% (12 شمعة)
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="text-[11px] text-white/60 pt-1 border-t border-white/5">
                    مناطق السيولة: دعم <strong className="text-emerald-300">${report.supports.join(" / $")}</strong> | مقاومة{" "}
                    <strong className="text-rose-300">${report.resistances.join(" / $")}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 5 Parallel AI Council Reports */}
          <div className="bg-[#090d16] border border-cyan-500/25 rounded-xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <span>تقرير مجلس الخبراء المتوازي (5 أدوار متخصصة + ذاكرة العملة المستقلة {report.symbol}.json)</span>
              </h3>
              <span className="text-[11px] text-white/55">
                سجل {report.symbol}: {report.coinMemory.wins} ربح / {report.coinMemory.losses} خسارة (نسبة نجاح {report.coinMemory.winRate}%)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {[
                { key: "entryExplain", title: "1. لماذا ندخل؟ (الأهداف والوقف)", color: "border-emerald-500/35" },
                { key: "vision", title: "2. قراءة الشارت والشموع البصرية", color: "border-cyan-500/35" },
                { key: "news", title: "3. أخبار الفيدرالي والسيولة والماكرو", color: "border-amber-500/35" },
                { key: "report", title: "4. التقرير السوقي المقروء الشامل", color: "border-blue-500/35" },
                { key: "learning", title: "5. ذاكرة أخطاء وقواعد هذه العملة", color: "border-purple-500/35" }
              ].map((card) => {
                const item = report.aiCouncil?.[card.key];
                if (!item) return null;
                return (
                  <div key={card.key} className={`p-3.5 bg-black/50 border rounded-xl space-y-2 ${card.color}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-white">{card.title}</span>
                      <span className="text-[9px] font-mono bg-white/10 text-white/80 px-1.5 py-0.5 rounded">
                        {item.model} ({item.latencyMs}ms)
                      </span>
                    </div>
                    <p className="text-xs text-white/85 leading-relaxed whitespace-pre-line">{item.text}</p>
                    <div className="text-[10px] text-white/40 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>{item.providerName}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MultiScreenQuantCockpit;
