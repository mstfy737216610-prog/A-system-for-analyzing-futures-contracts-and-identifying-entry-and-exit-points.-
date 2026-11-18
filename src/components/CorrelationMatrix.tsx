import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Network, RefreshCcw, TrendingUp, TrendingDown, 
  ShieldAlert, ShieldCheck, Zap, Info, ArrowUpRight, 
  ArrowDownRight, Sliders, Activity, Check, HelpCircle,
  BarChart2, Flame
} from "lucide-react";
import axios from "axios";
import { CorrelationMatrixData, CorrelationPairStat } from "../types";

interface CorrelationMatrixProps {
  selectedSymbol: string;
  onSelectSymbol?: (symbol: string) => void;
}

export const CorrelationMatrix: React.FC<CorrelationMatrixProps> = ({ 
  selectedSymbol, 
  onSelectSymbol 
}) => {
  const [timeframe, setTimeframe] = useState<string>("1h");
  const [data, setData] = useState<CorrelationMatrixData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<number>(Date.now());
  const [btcShockPercent, setBtcShockPercent] = useState<number>(3.0); // e.g. +3% BTC movement
  const [selectedCell, setSelectedCell] = useState<{ symA: string; symB: string; value: number } | null>(null);

  const cleanSymbol = selectedSymbol.toUpperCase().includes("USDT")
    ? selectedSymbol.toUpperCase()
    : `${selectedSymbol.toUpperCase()}USDT`;

  const fetchCorrelation = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/api/correlation?symbol=${cleanSymbol}&timeframe=${timeframe}`);
      if (res.data && res.data.matrix) {
        setData(res.data);
        setLastRefreshed(Date.now());
      } else {
        throw new Error("تنسيق بيانات الارتباط غير صالح");
      }
    } catch (err: any) {
      console.error("Correlation fetch error:", err);
      setError("تعذر تحديث مصفوفة الارتباط اللحظية من الخادم.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCorrelation();
    const interval = setInterval(fetchCorrelation, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, [cleanSymbol, timeframe]);

  // Heatmap color mapper
  const getCellColor = (val: number, isDiagonal: boolean) => {
    if (isDiagonal) return "bg-white/10 text-white font-black border border-white/20";
    if (val >= 0.80) return "bg-emerald-500/25 text-emerald-300 font-bold border border-emerald-500/40 hover:bg-emerald-500/35";
    if (val >= 0.55) return "bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/20 hover:bg-emerald-500/25";
    if (val >= 0.25) return "bg-cyan-500/15 text-cyan-300 border border-cyan-500/20 hover:bg-cyan-500/25";
    if (val >= -0.10) return "bg-white/[0.03] text-white/60 border border-white/5 hover:bg-white/10";
    return "bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30 hover:bg-rose-500/30";
  };

  const getDecouplingBadge = (state: string) => {
    switch (state) {
      case "DECOUPLED_ALPHA":
        return {
          bg: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
          icon: Zap,
          title: "فك ارتباط صاعد (Alpha مستقل)",
          dot: "bg-cyan-400"
        };
      case "HIGH_BETA":
        return {
          bg: "bg-amber-500/15 text-amber-300 border-amber-500/30",
          icon: Flame,
          title: "حساسية وتضخيم مضارب (High Beta)",
          dot: "bg-amber-400"
        };
      case "STRONGLY_COUPLED":
        return {
          bg: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
          icon: Activity,
          title: "ارتباط عضوي وثيق بالبيتكوين",
          dot: "bg-emerald-400"
        };
      case "INVERSE_HEDGE":
        return {
          bg: "bg-purple-500/15 text-purple-300 border-purple-500/30",
          icon: ShieldCheck,
          title: "ارتباط عكسي / أصل تحوط",
          dot: "bg-purple-400"
        };
      default:
        return {
          bg: "bg-white/10 text-white/80 border-white/20",
          icon: Activity,
          title: "ارتباط معتدل متوازن",
          dot: "bg-white/40"
        };
    }
  };

  const targetDisplayName = cleanSymbol.replace("USDT", "");
  const btcBeta = (typeof data?.btcBeta === 'number' && isFinite(data.btcBeta)) ? data.btcBeta : 1.0;
  const btcCorr = (typeof data?.btcCorrelation === 'number' && isFinite(data.btcCorrelation)) ? data.btcCorrelation : 0.8;
  const rSquared = (typeof data?.rSquared === 'number' && isFinite(data.rSquared)) ? data.rSquared : 64;
  const decouplingInfo = getDecouplingBadge(data?.decouplingState || "NEUTRAL");

  // Shock Simulator Calculation
  const estimatedImpactPercent = Number((btcShockPercent * btcBeta).toFixed(2));

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#10b981]/10 border border-[#10b981]/30 rounded-sm text-[#10b981]">
              <Network className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  مصفوفة الارتباط اللحظية (Correlation Matrix)
                  <span className="text-[10px] bg-[#10b981]/20 text-[#10b981] px-2 py-0.5 rounded font-mono font-bold">
                    LIVE
                  </span>
                </h2>
              </div>
              <p className="text-xs text-white/50 mt-0.5">
                قياس إحصائي دقيق لمعامل الارتباط (Pearson r) وحساسية بيتا (Beta β) لـ <span className="text-white font-bold font-mono">{cleanSymbol}</span> بحركات البيتكوين والعملات الرائدة لحظياً.
              </p>
            </div>
          </div>

          {/* Timeframe & Action Bar */}
          <div className="flex items-center gap-2 self-start lg:self-auto">
            <div className="flex items-center gap-1 bg-black/60 p-1 border border-white/10 rounded-sm">
              {[
                { id: "15m", label: "15m", desc: "لحظي" },
                { id: "1h", label: "1h", desc: "24 ساعة" },
                { id: "4h", label: "4h", desc: "مؤسساتي" },
                { id: "1d", label: "1d", desc: "استراتيجي" }
              ].map(tf => (
                <button
                  key={tf.id}
                  onClick={() => setTimeframe(tf.id)}
                  className={`text-[11px] px-3 py-1.5 rounded-sm font-bold transition-all ${
                    timeframe === tf.id
                      ? "bg-[#10b981] text-black shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                      : "text-white/40 hover:text-white hover:bg-white/5"
                  }`}
                  title={tf.desc}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            <button
              onClick={fetchCorrelation}
              disabled={isLoading}
              className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-sm text-white/80 hover:text-white transition-all disabled:opacity-50 cursor-pointer"
              title="تحديث البيانات لحظياً"
            >
              <RefreshCcw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#10b981]" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 4-KPI Institutional Snapshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Pearson Correlation with BTC */}
        <div className="bg-[#0a0a0a] border border-white/10 p-5 rounded-sm relative group">
          <div className="flex items-center justify-between text-[11px] text-white/40 mb-2 font-bold uppercase">
            <span>الارتباط بالبيتكوين (r)</span>
            <span className="font-mono text-xs text-[#10b981]">BTC Correlation</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-black font-mono ${
              btcCorr >= 0.75 ? "text-emerald-400" :
              btcCorr >= 0.40 ? "text-cyan-400" :
              btcCorr >= -0.10 ? "text-amber-400" : "text-rose-400"
            }`}>
              {btcCorr > 0 ? `+${btcCorr.toFixed(2)}` : btcCorr.toFixed(2)}
            </span>
            <span className="text-xs text-white/40 font-mono">[-1.00 إلى +1.00]</span>
          </div>
          <div className="mt-3">
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden flex">
              <div 
                className={`h-full ${
                  btcCorr >= 0.75 ? "bg-emerald-400" :
                  btcCorr >= 0.40 ? "bg-cyan-400" :
                  btcCorr >= -0.10 ? "bg-amber-400" : "bg-rose-400"
                }`}
                style={{ width: `${Math.max(10, Math.min(100, ((btcCorr + 1) / 2) * 100))}%` }}
              />
            </div>
          </div>
          <p className="text-[11px] text-white/50 mt-2.5 leading-relaxed">
            {btcCorr >= 0.80 ? "ارتباط وثيق جداً؛ تتبع مسار البيتكوين لحظة بلحظة." :
             btcCorr >= 0.50 ? "ارتباط إيجابي معتدل؛ تتأثر بالاتجاه العام مع استقلالية جزئية." :
             btcCorr >= 0.15 ? "فك ارتباط ملحوظ؛ السعر يخضع لمناورات وتجميع ذاتي." :
             "ارتباط عكسي / حركة مغايرة لاتجاه البيتكوين."}
          </p>
        </div>

        {/* KPI 2: Beta Sensitivity (β) */}
        <div className="bg-[#0a0a0a] border border-white/10 p-5 rounded-sm relative group">
          <div className="flex items-center justify-between text-[11px] text-white/40 mb-2 font-bold uppercase">
            <span>معامل الحساسية (Beta β)</span>
            <span className="font-mono text-xs text-amber-400">Volatility Multiplier</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-amber-400">
              {btcBeta.toFixed(2)}x
            </span>
            <span className="text-xs text-white/40">مقارنة بـ BTC</span>
          </div>
          <div className="mt-3">
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-amber-400"
                style={{ width: `${Math.max(15, Math.min(100, (btcBeta / 2.5) * 100))}%` }}
              />
            </div>
          </div>
          <p className="text-[11px] text-white/50 mt-2.5 leading-relaxed">
            {btcBeta > 1.3 ? `حساسية مضاعفة؛ حركة 1% في البيتكوين ينتج عنها تاريخياً حركة ${(btcBeta * 1).toFixed(1)}% في ${targetDisplayName}.` :
             btcBeta >= 0.9 ? `حساسية متكافئة؛ تتذبذب بنفس وتيرة حركة البيتكوين تقريباً.` :
             `حساسية دفاعية منخفضة؛ أقل تقلباً وتأثراً بصدمات البيتكوين المفاجئة.`}
          </p>
        </div>

        {/* KPI 3: R-Squared (حجم التبعية) */}
        <div className="bg-[#0a0a0a] border border-white/10 p-5 rounded-sm relative group">
          <div className="flex items-center justify-between text-[11px] text-white/40 mb-2 font-bold uppercase">
            <span>معامل التبعية (R² Determinism)</span>
            <span className="font-mono text-xs text-cyan-400">BTC Impact</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-cyan-400">
              {rSquared}%
            </span>
            <span className="text-xs text-white/40">تفسير الحركة</span>
          </div>
          <div className="mt-3">
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-cyan-400"
                style={{ width: `${Math.max(5, Math.min(100, rSquared))}%` }}
              />
            </div>
          </div>
          <p className="text-[11px] text-white/50 mt-2.5 leading-relaxed">
            {rSquared}% من حركة السعر لـ {targetDisplayName} ناتجة حصرياً عن موجات البيتكوين، بينما {(100 - rSquared).toFixed(1)}% تمثل حركة فنية مستقلة.
          </p>
        </div>

        {/* KPI 4: Decoupling Regime Badge */}
        <div className={`p-5 rounded-sm border ${decouplingInfo.bg} flex flex-col justify-between`}>
          <div>
            <div className="flex items-center justify-between text-[11px] mb-2 font-bold uppercase opacity-80">
              <span>حالة فك الارتباط</span>
              <span className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${decouplingInfo.dot} animate-pulse`} />
                <span>Regime</span>
              </span>
            </div>
            <div className="text-lg font-black text-white flex items-center gap-2">
              <decouplingInfo.icon className="w-5 h-5 shrink-0" />
              <span>{data?.decouplingLabel || decouplingInfo.title}</span>
            </div>
          </div>
          <p className="text-[11px] text-white/80 mt-3 leading-relaxed border-t border-white/10 pt-2.5">
            {data?.decouplingDescription || "تقييم سلوك العملة المستقل مقابل المؤشر المرجعي."}
          </p>
        </div>
      </div>

      {/* Shock Simulator & Strategic Directive */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Shock Calculator (Left - 7 cols) */}
        <div className="lg:col-span-7 bg-[#0a0a0a] border border-white/10 p-6 rounded-sm space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#10b981]" />
              <h3 className="text-sm font-bold text-white">
                محاكي صدمات البيتكوين (BTC Shock Scenario Simulator)
              </h3>
            </div>
            <span className="text-[10px] text-white/40 font-mono">حساب التأثير اللحظي</span>
          </div>

          <p className="text-xs text-white/60">
            اختبر ماذا سيحدث لسعر <strong className="text-white">{targetDisplayName}</strong> بناءً على معامل الحساسية الحالي (<span className="text-amber-400 font-mono font-bold">{btcBeta}x</span>) إذا تحرك البيتكوين فجأة:
          </p>

          {/* Quick Preset Buttons */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {[
              { val: 5, label: "+5% صعود قوي", color: "border-emerald-500/40 text-emerald-400" },
              { val: 3, label: "+3% صعود", color: "border-emerald-500/30 text-emerald-400" },
              { val: 1, label: "+1% هادئ", color: "border-emerald-500/20 text-emerald-400" },
              { val: -1, label: "-1% هبوط طفيف", color: "border-rose-500/20 text-rose-400" },
              { val: -3, label: "-3% تصحيح", color: "border-rose-500/30 text-rose-400" },
              { val: -5, label: "-5% هبوط حاد", color: "border-rose-500/40 text-rose-400" },
            ].map(preset => (
              <button
                key={preset.val}
                onClick={() => setBtcShockPercent(preset.val)}
                className={`py-2 px-2 text-[10px] font-bold rounded-sm border transition-all cursor-pointer ${
                  btcShockPercent === preset.val
                    ? "bg-white/15 text-white border-white shadow-xs"
                    : `bg-white/[0.02] ${preset.color} hover:bg-white/5`
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Calculated Outcome Box */}
          <div className="bg-[#10b981]/5 border border-[#10b981]/25 p-5 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-[10px] text-white/40 uppercase mb-1 font-bold">
                حركة البيتكوين المفترضة:
              </div>
              <div className={`text-xl font-bold font-mono ${btcShockPercent >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {btcShockPercent >= 0 ? `+${btcShockPercent}%` : `${btcShockPercent}%`}
              </div>
            </div>

            <div className="sm:text-center">
              <div className="text-[10px] text-white/40 uppercase mb-1 font-bold">
                معامل التضخيم (Beta β):
              </div>
              <div className="text-xl font-bold font-mono text-amber-400">
                × {btcBeta.toFixed(2)}
              </div>
            </div>

            <div className="sm:text-left">
              <div className="text-[10px] text-white/40 uppercase mb-1 font-bold">
                التأثير المتوقع على {targetDisplayName}:
              </div>
              <div className={`text-2xl font-black font-mono flex items-center sm:justify-end gap-1 ${
                estimatedImpactPercent >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}>
                {estimatedImpactPercent >= 0 ? (
                  <ArrowUpRight className="w-5 h-5" />
                ) : (
                  <ArrowDownRight className="w-5 h-5" />
                )}
                <span>{estimatedImpactPercent >= 0 ? `+${estimatedImpactPercent}%` : `${estimatedImpactPercent}%`}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Institutional Takeaway (Right - 5 cols) */}
        <div className="lg:col-span-5 bg-[#0a0a0a] border border-white/10 p-6 rounded-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-4">
              <ShieldAlert className="w-4 h-4 text-[#10b981]" />
              <h3 className="text-sm font-bold text-white">
                توجيه إدارة المخاطر المؤسساتية
              </h3>
            </div>
            <p className="text-xs leading-relaxed text-white/80 border-r-2 border-[#10b981] pr-3 italic">
              "{data?.marketTakeaway || "راقب مسار البيتكوين كفلتر اتجاه قبل الدخول في أي صفقة سكالبينج."}"
            </p>
          </div>

          <div className="bg-white/[0.02] border border-white/5 p-3.5 rounded-sm space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between text-white/60">
              <span>مسار الارتباط الأخير (15 شمعة):</span>
              <span className="font-bold text-white font-mono">
                {data?.rollingTrend === "INCREASING" ? "تزايد الارتباط بالبيتكوين ↗" :
                 data?.rollingTrend === "DECREASING" ? "تزايد فك الارتباط والاستقلالية ↘" :
                 "استقرار نسبي في الارتباط ➔"}
              </span>
            </div>
            <div className="flex items-center justify-between text-white/60">
              <span>الزوج المرجعي الأكثر ارتباطاً:</span>
              <span className="font-bold text-[#10b981] font-mono">
                {data?.leaders?.[0]?.name || "BTCUSDT"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Heatmap Matrix (N x N Grid) */}
      <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-[#10b981]" />
            <h3 className="text-sm font-bold text-white">
              شبكة الارتباط المتقاطع الشاملة (Cross-Asset Heatmap Matrix)
            </h3>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-white/40">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-emerald-500/40 rounded-xs border border-emerald-500/60" />
              <span>ارتباط قوي جداً (+0.80+)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-cyan-500/30 rounded-xs border border-cyan-500/50" />
              <span>معتدل (+0.30+)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-white/10 rounded-xs border border-white/20" />
              <span>فك ارتباط (~0.0)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-rose-500/40 rounded-xs border border-rose-500/60" />
              <span>عكسي (&lt; 0.0)</span>
            </div>
          </div>
        </div>

        {/* Matrix Grid Container */}
        <div className="overflow-x-auto custom-scrollbar pt-2">
          {data && data.symbols && data.symbols.length > 0 ? (
            <table className="w-full border-collapse text-center font-mono">
              <thead>
                <tr>
                  <th className="p-2.5 text-xs text-right font-bold text-white/50 border-b border-white/10 bg-black/40">
                    العملة / الزوج
                  </th>
                  {data.symbols.map(sym => (
                    <th 
                      key={sym} 
                      className={`p-2.5 text-xs font-bold border-b border-white/10 ${
                        sym === cleanSymbol ? "text-[#10b981] bg-[#10b981]/10 font-black" : "text-white/80"
                      }`}
                    >
                      {sym.replace("USDT", "")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.symbols.map((symRow) => (
                  <tr key={symRow} className="hover:bg-white/[0.02] transition-colors">
                    <td className={`p-2.5 text-xs text-right font-bold border-b border-white/5 ${
                      symRow === cleanSymbol ? "text-[#10b981] bg-[#10b981]/10 font-black" : "text-white/80"
                    }`}>
                      {symRow.replace("USDT", "")}
                      {symRow === cleanSymbol && <span className="text-[9px] mr-1 text-[#10b981]">(المختارة)</span>}
                    </td>
                    {data.symbols.map((symCol) => {
                      const isDiag = symRow === symCol;
                      const rawVal = data.matrix?.[symRow]?.[symCol] ?? (isDiag ? 1.0 : 0);
                      const val = (typeof rawVal === 'number' && isFinite(rawVal)) ? rawVal : (isDiag ? 1.0 : 0);
                      const isTargetCell = symRow === cleanSymbol || symCol === cleanSymbol;

                      return (
                        <td
                          key={symCol}
                          onClick={() => setSelectedCell({ symA: symRow, symB: symCol, value: val })}
                          className={`p-2 text-xs transition-all cursor-pointer border border-black/40 ${getCellColor(val, isDiag)} ${
                            isTargetCell && !isDiag ? "ring-1 ring-white/15" : ""
                          }`}
                          title={`${symRow.replace("USDT", "")} مقابل ${symCol.replace("USDT", "")}: ${val.toFixed(3)}`}
                        >
                          {val.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center text-white/40 text-xs flex items-center justify-center gap-2">
              <RefreshCcw className="w-4 h-4 animate-spin text-[#10b981]" />
              <span>جاري تحميل وحساب مصفوفة الارتباط اللحظية...</span>
            </div>
          )}
        </div>

        {/* Clicked Cell Tooltip/Detail Bar */}
        {selectedCell && (
          <div className="p-3 bg-white/5 border border-white/10 rounded-sm flex items-center justify-between text-xs animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <span className="text-white/60">العلاقة المحددة:</span>
              <span className="font-bold text-white font-mono">{selectedCell.symA.replace("USDT", "")}</span>
              <span className="text-white/40">⟷</span>
              <span className="font-bold text-white font-mono">{selectedCell.symB.replace("USDT", "")}</span>
              <span className="text-white/60 font-mono mr-2">
                (معامل بيرسون: <strong className="text-[#10b981]">{typeof selectedCell.value === 'number' && isFinite(selectedCell.value) ? selectedCell.value.toFixed(3) : '0.000'}</strong>)
              </span>
            </div>
            <button
              onClick={() => setSelectedCell(null)}
              className="text-white/40 hover:text-white text-xs px-2 py-0.5 rounded cursor-pointer"
            >
              ✕ إغلاق
            </button>
          </div>
        )}
      </div>

      {/* Leading Benchmark Assets Breakdown */}
      <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-sm space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#10b981]" />
            <h3 className="text-sm font-bold text-white">
              تفصيل تأثر {targetDisplayName} بالعملات الرائدة لحظياً (Leaders Impact)
            </h3>
          </div>
          <span className="text-[10px] text-white/40 font-mono">آخر تحديث: {new Date(lastRefreshed).toLocaleTimeString()}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.leaders?.map((leader: CorrelationPairStat) => {
            const corr = (typeof leader?.correlation === 'number' && isFinite(leader.correlation)) ? leader.correlation : 0;
            const pct = Math.round(((corr + 1) / 2) * 100);
            const leaderBeta = (typeof leader?.beta === 'number' && isFinite(leader.beta)) ? leader.beta : 1.0;

            return (
              <div 
                key={leader.symbol}
                className="bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-white/15 p-4 rounded-sm transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-sm">{leader.name}</span>
                      {leader.symbol === "BTCUSDT" && (
                        <span className="text-[9px] bg-[#10b981]/20 text-[#10b981] px-1.5 py-0.2 rounded font-bold">
                          المحرك الأساسي
                        </span>
                      )}
                    </div>
                    <span className={`text-xs font-mono font-black ${
                      corr >= 0.70 ? "text-emerald-400" :
                      corr >= 0.35 ? "text-cyan-400" :
                      corr >= -0.10 ? "text-white/70" : "text-rose-400"
                    }`}>
                      {corr >= 0 ? `+${corr.toFixed(2)}` : corr.toFixed(2)}
                    </span>
                  </div>

                  {/* Progress gauge */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-white/40 font-mono">
                      <span>مدى الترابط</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden flex">
                      <div 
                        className={`h-full ${
                          corr >= 0.70 ? "bg-emerald-400" :
                          corr >= 0.35 ? "bg-cyan-400" :
                          corr >= -0.10 ? "bg-white/40" : "bg-rose-400"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="text-xs text-white/60 leading-relaxed border-t border-white/5 pt-2.5">
                  <p>{leader.impactDescription}</p>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 text-white/40 font-mono border-t border-white/5">
                  <span>معامل بيتا: <strong className="text-amber-400">{leaderBeta.toFixed(2)}x</strong></span>
                  {onSelectSymbol && (
                    <button
                      onClick={() => onSelectSymbol(leader.symbol)}
                      className="text-[#10b981] hover:underline flex items-center gap-1 cursor-pointer text-[10px]"
                    >
                      <span>فحص شارت {leader.symbol.replace("USDT", "")}</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
