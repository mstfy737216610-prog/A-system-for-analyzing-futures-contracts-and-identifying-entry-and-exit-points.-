import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  ShieldAlert, Eye, AlertTriangle, ArrowUpRight, ArrowDownRight, 
  RefreshCcw, Layers, Crosshair, Radar, BarChart2, Zap
} from "lucide-react";
import { WhaleMetrics, OrderBookData, KlineData } from "../types";
import axios from "axios";

interface WhaleRadarProps {
  symbol: string;
  orderBook: OrderBookData | null;
  klines: KlineData[];
  currentPrice: number;
}

export const WhaleRadar: React.FC<WhaleRadarProps> = ({ symbol, orderBook, klines, currentPrice }) => {
  const [metrics, setMetrics] = useState<WhaleMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchWhaleAnalysis = async () => {
    try {
      setLoading(true);
      const res = await axios.post("/api/whale-radar", {
        symbol,
        orderBook,
        klines: klines.slice(-50),
        currentPrice
      });
      if (res.data) {
        setMetrics(res.data);
      }
    } catch (e) {
      console.error("Failed to fetch whale analysis:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWhaleAnalysis();
    if (!autoRefresh) return;
    const interval = setInterval(fetchWhaleAnalysis, 10000); // 10s radar update
    return () => clearInterval(interval);
  }, [symbol, currentPrice, autoRefresh]);

  const bidRatio = metrics?.bidAskRatio || 1;
  const bidPercent = Math.min(85, Math.max(15, Math.round((bidRatio / (bidRatio + 1)) * 100)));
  const askPercent = 100 - bidPercent;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-500/10 rounded-sm border border-purple-500/20 text-purple-400">
            <Radar className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">رادار الحيتان وكشف تلاعب السوق (Whale & Smart Money Radar)</h2>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-mono font-bold">
                {symbol}
              </span>
            </div>
            <p className="text-xs text-white/40 mt-0.5">
              مراقبة آنية لجدران الأوامر العميقة، كشف الكسور الوهمية (Liquidity Sweeps)، وأوامر الجبل الجليدي (Iceberg)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`text-[11px] px-3 py-1.5 rounded-sm border transition-all ${
              autoRefresh 
                ? "bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]" 
                : "bg-white/5 border-white/10 text-white/40"
            }`}
          >
            {autoRefresh ? "المسح التلقائي: نشط" : "المسح التلقائي: متوقف"}
          </button>
          <button
            onClick={fetchWhaleAnalysis}
            disabled={loading}
            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-sm text-white/60 hover:text-white transition-all"
            title="تحديث فوري للرادار"
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#10b981]" : ""}`} />
          </button>
        </div>
      </div>

      {/* Top 3 Core Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1: Order Book Skew */}
        <div className="bg-[#0a0a0a] border border-white/5 p-5 rounded-sm space-y-3">
          <div className="flex items-center justify-between text-xs text-white/40">
            <span>توازن دفتر الأوامر (Bid/Ask Skew)</span>
            <span className="font-mono text-white/80">{metrics?.bidAskRatio || 1.0}x</span>
          </div>
          <div className="h-2 w-full bg-black rounded-full overflow-hidden flex">
            <div 
              className="h-full bg-[#10b981] transition-all duration-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
              style={{ width: `${bidPercent}%` }} 
            />
            <div 
              className="h-full bg-red-500 transition-all duration-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" 
              style={{ width: `${askPercent}%` }} 
            />
          </div>
          <div className="flex justify-between text-[11px] font-mono">
            <span className="text-[#10b981] font-bold">شراء: {bidPercent}% (${Math.round((Number(metrics?.bidVolumeTotalUsd) || 0) / 1000)}k)</span>
            <span className="text-red-400 font-bold">بيع: {askPercent}% (${Math.round((Number(metrics?.askVolumeTotalUsd) || 0) / 1000)}k)</span>
          </div>
          <p className="text-[10px] text-white/50 pt-1 border-t border-white/5">
            {metrics?.whalePressure === "BUY_ABSORPTION" 
              ? "ضغط امتصاص شرائي قوي: الحيتان تدعم القاع بجدران طلب كثيفة." 
              : metrics?.whalePressure === "SELL_WALL_PRESSURE" 
              ? "جدران تصريف قوية: عروض بيع مكثفة تقاوم الصعود." 
              : "توازن معتدل بين أوامر الشراء والبيع في الدفتر."}
          </p>
        </div>

        {/* Metric 2: Manipulation Risk Score */}
        <div className="bg-[#0a0a0a] border border-white/5 p-5 rounded-sm space-y-3">
          <div className="flex items-center justify-between text-xs text-white/40">
            <span>مؤشر احتمالية التلاعب اللحظي</span>
            <span className={`font-mono font-bold ${
              (metrics?.manipulationRiskScore || 0) > 60 ? "text-amber-400" : "text-[#10b981]"
            }`}>
              {metrics?.manipulationRiskScore || 0}/100
            </span>
          </div>
          <div className="w-full bg-black h-2 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                (metrics?.manipulationRiskScore || 0) > 60 
                  ? "bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]" 
                  : "bg-[#10b981] shadow-[0_0_10px_rgba(16,185,129,0.5)]"
              }`}
              style={{ width: `${metrics?.manipulationRiskScore || 15}%` }}
            />
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            {(metrics?.manipulationRiskScore || 0) > 60 ? (
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                بيئة مصائد سيولة نشطة (High Manipulation)
              </span>
            ) : (
              <span className="text-[#10b981] font-bold flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                حركة نظيفة متوافقة مع قوى العرض والطلب
              </span>
            )}
          </div>
          <p className="text-[10px] text-white/50 pt-1 border-t border-white/5">
            يقيس احتمالية ضرب وقف الخسارة قبل التحرك الحقيقي.
          </p>
        </div>

        {/* Metric 3: Liquidity Swept Status */}
        <div className="bg-[#0a0a0a] border border-white/5 p-5 rounded-sm space-y-3">
          <div className="flex items-center justify-between text-xs text-white/40">
            <span>مصائد السيولة (SMC Stop Hunts)</span>
            <span className="font-mono text-purple-400">Smart Money</span>
          </div>
          <div className="flex items-center gap-2">
            {metrics?.liquiditySwept ? (
              <div className="p-2 bg-purple-500/10 border border-purple-500/30 rounded-sm text-purple-300 text-xs font-bold w-full flex items-center justify-between">
                <span>
                  {metrics.sweepType === "BEAR_TRAP_SWEEP" ? "🎯 مصيدة بيع (Bear Trap - ضرب قاع ثم ارتداد)" : "⚠️ مصيدة شراء (Bull Trap - ضرب قمة ثم هبوط)"}
                </span>
                <span className="bg-purple-500 text-black px-1.5 py-0.5 rounded text-[10px]">مكتمل</span>
              </div>
            ) : (
              <div className="p-2 bg-white/5 border border-white/10 rounded-sm text-white/60 text-xs w-full flex items-center justify-between">
                <span>لا توجد مصيدة سيولة حالية على الإطار اللحظي</span>
                <span className="text-[10px] text-white/40">نطاق اعتيادي</span>
              </div>
            )}
          </div>
          <p className="text-[10px] text-white/50 pt-1 border-t border-white/5">
            عندما تضرب الحيتان مستويات الوقف للمتداولين ثم تعكس السعر فوراً.
          </p>
        </div>
      </div>

      {/* Institutional Verdict Banner */}
      <div className="bg-gradient-to-r from-purple-950/20 via-black to-[#0a0a0a] border border-purple-500/20 p-5 rounded-sm">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-purple-500/20 text-purple-400 rounded-sm mt-0.5">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-purple-300 uppercase tracking-wider mb-1">
              الخلاصة التحليلية لسلوك صانع السوق (Institutional Smart Money Verdict)
            </h3>
            <p className="text-sm text-white/90 leading-relaxed font-sans">
              {metrics?.institutionalVerdict || "جاري تجميع نبضات دفتر الأوامر وحساب تدفقات الصفقات المؤسساتية..."}
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Whale Signals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Detection Panel 1: Spoofing & Icebergs */}
        <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-sm space-y-4">
          <h3 className="text-xs font-bold text-white/80 uppercase tracking-wider flex items-center gap-2">
            <Eye className="w-4 h-4 text-cyan-400" />
            كشف التمويه والأوامر الخفية (Spoofing & Icebergs)
          </h3>

          <div className="space-y-3">
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white/90">الجدران التمويهية (Spoofing Walls)</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                  metrics?.spoofingDetected ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-[#10b981]/20 text-[#10b981]"
                }`}>
                  {metrics?.spoofingDetected ? "تم الرصد ⚠️" : "سليم وطبيعي"}
                </span>
              </div>
              <p className="text-xs text-white/50 leading-relaxed">
                {metrics?.spoofingNote || "دفتر الأوامر يعكس عمقاً حقيقياً دون مؤشرات جدران وهمية."}
              </p>
            </div>

            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white/90">أوامر الجبل الجليدي (Iceberg Absorption)</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                  metrics?.icebergDetected ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "bg-white/10 text-white/40"
                }`}>
                  {metrics?.icebergDetected ? "امتصاص نشط 🧊" : "غير ملحوظ"}
                </span>
              </div>
              <p className="text-xs text-white/50 leading-relaxed">
                {metrics?.icebergNote || "لا توجد أوامر جبل جليدي نشطة حالياً."}
              </p>
            </div>
          </div>
        </div>

        {/* Detection Panel 2: Major Whale Walls in Book */}
        <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-sm space-y-4">
          <h3 className="text-xs font-bold text-white/80 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#10b981]" />
            أكبر جدران الحيتان النشطة في دفتر الأوامر
          </h3>

          <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar">
            {metrics?.largeOrders && metrics.largeOrders.length > 0 ? (
              metrics.largeOrders.map((order, idx) => {
                const diffPct = (currentPrice > 0 && typeof order.price === 'number') ? (((order.price - currentPrice) / currentPrice) * 100).toFixed(2) : "0.00";
                return (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-2.5 bg-black/40 border border-white/5 rounded-sm text-xs font-mono"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        order.side === "BUY" ? "bg-[#10b981]/20 text-[#10b981]" : "bg-red-500/20 text-red-400"
                      }`}>
                        {order.side === "BUY" ? "طلب شراء" : "عرض بيع"}
                      </span>
                      <span className="text-white font-bold">${typeof order.price === 'number' ? order.price.toLocaleString() : order.price}</span>
                      <span className="text-[10px] text-white/30">({Number(diffPct) > 0 ? `+${diffPct}%` : `${diffPct}%`})</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-white/60">{typeof order.quantity === 'number' && isFinite(order.quantity) ? order.quantity.toFixed(2) : '0.00'} عقد</span>
                      <span className="text-white font-bold">${typeof order.valueUsd === 'number' && isFinite(order.valueUsd) ? (order.valueUsd / 1000).toFixed(1) : '0.0'}k</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-xs text-white/30">
                جاري رصد مستويات السيولة الكبرى...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhaleRadar;
