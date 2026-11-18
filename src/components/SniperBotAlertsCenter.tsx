import React, { useState, useEffect } from "react";
import {
  Bell,
  Volume2,
  VolumeX,
  Copy,
  Check,
  TrendingUp,
  TrendingDown,
  Target,
  Shield,
  Zap,
  Radio,
  Share2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  RefreshCw,
  Send,
  Sliders,
  CheckCircle2,
  Flame,
  ArrowUpRight
} from "lucide-react";

export interface BotTacticalAlert {
  id: string;
  type: "ENTRY_ZONE_NOW" | "LIMIT_READY" | "DIP_CATCHER" | "BREAKOUT_IGNITION" | "TP1_REACHED" | "TRAILING_ACTIVE";
  title: string;
  badge: string;
  priority: "HIGH" | "URGENT" | "NORMAL";
  symbol: string;
  direction: "LONG" | "SHORT";
  price: number;
  entry: number;
  distToEntryPct: number;
  sl: number;
  tp1: number;
  tp2: number;
  tp3: number;
  profitPercent: number;
  leverage: number;
  confidence: number;
  rrRatio: number;
  strategyName: string;
  message: string;
  actionInstruction: string;
  telegramMessage: string;
  timestamp: number;
}

interface SniperBotAlertsCenterProps {
  tickers: Record<string, { lastPrice: number; priceChangePercent: number; quoteVolume: number }>;
  onSelectCoin?: (symbol: string) => void;
  playEmergencySound: () => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
}

export const SniperBotAlertsCenter: React.FC<SniperBotAlertsCenterProps> = ({
  tickers,
  onSelectCoin,
  playEmergencySound,
  isMuted,
  setIsMuted
}) => {
  const [alerts, setAlerts] = useState<BotTacticalAlert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<"ALL" | "URGENT" | "DIP" | "ENTRY_NOW">("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedTgId, setCopiedTgId] = useState<string | null>(null);
  const [lastAlertId, setLastAlertId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [alertSearch, setAlertSearch] = useState("");

  // Poll live alerts stream every 15 seconds
  useEffect(() => {
    fetchAlerts(false);
    const interval = setInterval(() => {
      fetchAlerts(false);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async (manual: boolean = false) => {
    if (manual) setIsLoading(true);
    try {
      const res = await fetch("/api/bot-alerts");
      const data = await res.json();
      if (data.success && Array.isArray(data.alerts)) {
        setAlerts(data.alerts);

        // Sound chime if top urgent alert changed
        if (data.alerts.length > 0) {
          const topAlert = data.alerts[0];
          if (topAlert.id !== lastAlertId) {
            setLastAlertId(topAlert.id);
            if (!isMuted && manual) {
              playEmergencySound();
            }
          }
        }
      }
    } catch (e) {
      console.error("Error fetching bot alerts:", e);
    } finally {
      if (manual) setIsLoading(false);
    }
  };

  const copyBinanceOrder = (alert: BotTacticalAlert) => {
    const text = `Binance Futures Limit Order:
Pair: ${alert.symbol}
Side: ${alert.direction === "LONG" ? "BUY" : "SELL"}
Type: LIMIT
Price: ${alert.entry}
Take Profit: ${alert.tp2} (+${alert.profitPercent}%)
Stop Loss: ${alert.sl}
Leverage: ${alert.leverage}x (Isolated)
TP1 (Move SL to Breakeven): ${alert.tp1}`;

    navigator.clipboard.writeText(text);
    setCopiedId(alert.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const copyTelegramMessage = (alert: BotTacticalAlert) => {
    navigator.clipboard.writeText(alert.telegramMessage);
    setCopiedTgId(alert.id);
    setTimeout(() => setCopiedTgId(null), 2500);
  };

  // Filter alerts
  const filteredAlerts = alerts.filter(a => {
    if (alertSearch.trim()) {
      const q = alertSearch.toUpperCase().trim();
      if (!a.symbol.toUpperCase().includes(q)) return false;
    }
    if (selectedFilter === "URGENT") return a.priority === "URGENT";
    if (selectedFilter === "DIP") return a.type === "DIP_CATCHER";
    if (selectedFilter === "ENTRY_NOW") return a.type === "ENTRY_ZONE_NOW";
    return true;
  });

  return (
    <div className="space-y-4" dir="rtl">
      {/* 🚨 Tactical Alert Stream Command Bar */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#0c1322] via-[#0f172a] to-[#070b14] border border-[#1e293b] p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>تنبيهات البوت الفورية (Live Bot Tactical Dispatcher)</span>
              </span>

              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[11px] font-mono font-bold">
                مدمج بأنظمة Haehnchen & Freqtrade
              </span>

              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-mono font-bold">
                {alerts.length} تنبيه نشط بالخلفية
              </span>
            </div>

            <h3 className="text-lg font-black text-white flex items-center gap-2 mt-1">
              <Zap className="w-5 h-5 text-emerald-400" />
              <span>غرفة عمليات وتنبيهات القناص الآلي — تنبيهات دقيقة للتنفيذ المباشر</span>
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              يقوم المحرك بمسح أزواج العقود الآجلة بالخلفية وإطلاق تنبيهات تكتيكية متناهية الدقة فور وصول السعر لمنطقة الدخول بالمليمتر، أو صيد القيعان الحادة (Dip Catcher)، مع أوامر جاهزة للتنفيذ ونسخ فوري لتليجرام.
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                if (isMuted) {
                  setIsMuted(false);
                  playEmergencySound();
                } else {
                  playEmergencySound();
                }
              }}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="تجربة صوت التنبيه التكتيكي"
            >
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <span>فحص الصوت 🔔</span>
            </button>

            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-2 rounded-lg border transition-all cursor-pointer ${
                isMuted
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
              }`}
              title={isMuted ? "الصوت مكتوم - اضغط للتشغيل" : "الصوت مفعل"}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              onClick={() => fetchAlerts(true)}
              disabled={isLoading}
              className="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>{isLoading ? "تحديث..." : "تحديث التنبيهات"}</span>
            </button>
          </div>
        </div>

        {/* Filter Badges & Search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-4 pt-3 border-t border-white/5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-400 font-bold">تصفية التنبيهات:</span>
            {[
              { id: "ALL", label: `جميع التنبيهات (${alerts.length})` },
              { id: "ENTRY_NOW", label: `🚨 دخول فوري (${alerts.filter(a => a.type === "ENTRY_ZONE_NOW").length})` },
              { id: "DIP", label: `🌊 صيد القيعان (${alerts.filter(a => a.type === "DIP_CATCHER").length})` },
              { id: "URGENT", label: `⚡ عاجلة (${alerts.filter(a => a.priority === "URGENT").length})` }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setSelectedFilter(f.id as any)}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  selectedFilter === f.id
                    ? "bg-emerald-500 text-black shadow-md font-black"
                    : "bg-black/40 text-slate-300 hover:bg-white/5 border border-white/5"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-48">
            <input
              type="text"
              placeholder="تصفية بالرمز (BTC, SOL...)"
              value={alertSearch}
              onChange={e => setAlertSearch(e.target.value)}
              className="w-full bg-[#070b14] border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 outline-none uppercase font-mono"
            />
          </div>
        </div>
      </div>

      {/* ⚡ Alerts Cards Stream */}
      {filteredAlerts.length === 0 ? (
        <div className="bg-[#0b101d] rounded-xl border border-slate-800 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto text-slate-400">
            <Radio className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-white">الرادار يراقب الأسعار بالخلفية بدقة</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            لا توجد إشارات تخترق شروط الأمان الآن في هذا التصنيف. سيعمل البوت على إرسال تنبيه صوتي فوري بمجرد اقتراب السعر من منطقة الدخول.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAlerts.map(alert => {
            const liveTicker = tickers[alert.symbol];
            const livePrice = liveTicker?.lastPrice || alert.price;
            const distPct = alert.entry > 0 ? ((livePrice - alert.entry) / alert.entry) * 100 : 0;
            const isLong = alert.direction === "LONG";
            const inZone = alert.type === "ENTRY_ZONE_NOW" || Math.abs(distPct) <= 0.35;
            const isDip = alert.type === "DIP_CATCHER";
            const isExpanded = expandedId === alert.id;

            return (
              <div
                key={alert.id}
                className={`rounded-xl border transition-all duration-200 overflow-hidden bg-[#0d1424] ${
                  inZone
                    ? "border-emerald-500/70 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/30"
                    : isDip
                    ? "border-purple-500/50 shadow-lg shadow-purple-500/10"
                    : "border-slate-800 hover:border-slate-700"
                }`}
              >
                {/* Alert Card Header */}
                <div className="p-4 border-b border-slate-800/80 flex items-start justify-between gap-3 bg-black/20">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => onSelectCoin && onSelectCoin(alert.symbol)}
                        className="text-lg font-black text-white hover:text-emerald-400 flex items-center gap-1 cursor-pointer"
                        title="عرض الشارت المباشر للعملة"
                      >
                        <span>{alert.symbol}</span>
                        <ArrowUpRight className="w-4 h-4 text-slate-400" />
                      </button>

                      <span
                        className={`px-2.5 py-0.5 rounded text-[11px] font-black flex items-center gap-1 ${
                          isLong
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        }`}
                      >
                        {isLong ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        <span>{isLong ? "LONG شراء" : "SHORT بيع"}</span>
                      </span>

                      <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold">
                        {alert.leverage}x Isolated
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 font-bold flex items-center gap-1.5">
                      <span>{alert.title}</span>
                    </div>
                  </div>

                  {/* Priority Tag */}
                  <div>
                    {alert.priority === "URGENT" ? (
                      <span className="px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[11px] font-black flex items-center gap-1 animate-pulse">
                        <Flame className="w-3 h-3 text-rose-400" />
                        <span>تنبيه عاجل</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
                        {alert.badge}
                      </span>
                    )}
                  </div>
                </div>

                {/* Pricing & Levels Grid */}
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-3 gap-2 bg-black/40 p-3 rounded-lg border border-white/5 text-center">
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold">السعر المباشر الآن</div>
                      <div className="text-sm font-black text-white mt-0.5 font-mono">
                        ${livePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                      </div>
                      <div className={`text-[10px] font-bold ${Math.abs(distPct) <= 0.35 ? "text-emerald-400" : "text-slate-400"}`}>
                        {Math.abs(distPct) <= 0.35 ? "🎯 في منطقة الدخول" : `فارق: ${distPct > 0 ? `+${distPct.toFixed(2)}%` : `${distPct.toFixed(2)}%`}`}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-400 font-bold">سعر الدخول المقترح</div>
                      <div className="text-sm font-black text-amber-300 mt-0.5 font-mono">
                        ${alert.entry.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                      </div>
                      <div className="text-[10px] text-emerald-400 font-bold">
                        ثقة: {alert.confidence}%
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-400 font-bold">وقف الخسارة (SL)</div>
                      <div className="text-sm font-black text-rose-400 mt-0.5 font-mono">
                        ${alert.sl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold">
                        عائد: 1:{alert.rrRatio}
                      </div>
                    </div>
                  </div>

                  {/* Target Levels Bar */}
                  <div className="grid grid-cols-3 gap-1.5 text-center">
                    <div className="p-2 rounded bg-emerald-950/20 border border-emerald-500/20">
                      <div className="text-[9px] text-emerald-400 font-bold">TP1 (نقل الوقف للدخول)</div>
                      <div className="text-xs font-black text-white font-mono mt-0.5">${alert.tp1}</div>
                    </div>

                    <div className="p-2 rounded bg-emerald-950/40 border border-emerald-500/40 ring-1 ring-emerald-500/20">
                      <div className="text-[9px] text-emerald-300 font-black">TP2 (الهدف الأساسي)</div>
                      <div className="text-xs font-black text-emerald-300 font-mono mt-0.5">${alert.tp2} (+{alert.profitPercent}%)</div>
                    </div>

                    <div className="p-2 rounded bg-blue-950/20 border border-blue-500/20">
                      <div className="text-[9px] text-blue-400 font-bold">TP3 (موجة ممتدة)</div>
                      <div className="text-xs font-black text-white font-mono mt-0.5">${alert.tp3} (+12%)</div>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="p-2.5 rounded-lg bg-black/30 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
                    <span className="font-semibold">{alert.actionInstruction}</span>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>{isExpanded ? "إخفاء التفاصيل" : "عرض الرسالة"}</span>
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>

                  {/* Expanded Telegram Message Preview */}
                  {isExpanded && (
                    <div className="space-y-2">
                      <pre className="p-3 rounded-lg bg-black/60 border border-slate-800 text-[11px] font-mono text-emerald-400/90 leading-relaxed whitespace-pre-wrap select-all">
                        {alert.telegramMessage}
                      </pre>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => copyBinanceOrder(alert)}
                      className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        copiedId === alert.id
                          ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20 font-black"
                          : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                      }`}
                    >
                      {copiedId === alert.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-emerald-400" />}
                      <span>{copiedId === alert.id ? "تم نسخ أمر بينانس!" : "نسخ أمر بينانس"}</span>
                    </button>

                    <button
                      onClick={() => copyTelegramMessage(alert)}
                      className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        copiedTgId === alert.id
                          ? "bg-blue-500 text-white shadow-md font-black"
                          : "bg-blue-950/40 hover:bg-blue-900/60 text-blue-300 border border-blue-500/30"
                      }`}
                    >
                      {copiedTgId === alert.id ? <Check className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5 text-blue-400" />}
                      <span>{copiedTgId === alert.id ? "تم نسخ تليجرام!" : "نسخ تنبيه تليجرام"}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
