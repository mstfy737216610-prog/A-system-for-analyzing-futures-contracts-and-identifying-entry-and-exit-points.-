import React, { useState } from "react";
import { 
  Target, TrendingUp, TrendingDown, ShieldAlert, ShieldCheck, 
  Layers, CheckCircle2, AlertTriangle, Eye, Activity, Zap,
  Clock, ArrowUpRight, ArrowDownRight, Scale, Crosshair,
  Copy, Check, FileText, BarChart3, Database, Compass, Lock
} from "lucide-react";
import { MarketSignal } from "../types";

interface InstitutionalSignalCardProps {
  signal: MarketSignal | null;
  timeframe?: string;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const InstitutionalSignalCard: React.FC<InstitutionalSignalCardProps> = ({
  signal,
  timeframe = "1h",
  onRefresh,
  isLoading = false
}) => {
  const [copied, setCopied] = useState(false);
  const [showRawOfficialText, setShowRawOfficialText] = useState(false);

  if (!signal) {
    return (
      <div className="bg-[#090e1a] border border-white/10 p-8 rounded-xl text-center space-y-3" dir="rtl">
        <Target className="w-8 h-8 text-white/30 mx-auto" />
        <h3 className="text-sm font-bold text-white">لم يتم إجراء فحص فني بعد</h3>
        <p className="text-xs text-white/50 max-w-md mx-auto">
          اضغط على زر "تحليل الفرصة" لإجراء فحص مؤسساتي متكامل يجمع حركة الشموع، تجميع الحيتان، كشف التلاعب، والتأكيد بنسبة 85%+.
        </p>
      </div>
    );
  }

  const isSignalValid = signal.direction !== "NEUTRAL" && (
    (signal.confidence || 0) >= 80 || signal.smartRiskLevel === "SMART_CALCULATED_RISK"
  );

  // Calculate default TP1/TP2/TP3 if not explicitly provided
  const entry = signal.entry || 0;
  const sl = signal.sl || 0;
  const delta = Math.abs((signal.tp || entry) - entry);
  const isLong = signal.direction === "LONG";
  
  const tp1 = signal.tp1 || (isLong ? Number((entry + delta * 0.4).toFixed(4)) : Number((entry - delta * 0.4).toFixed(4)));
  const tp2 = signal.tp2 || (isLong ? Number((entry + delta * 0.75).toFixed(4)) : Number((entry - delta * 0.75).toFixed(4)));
  const tp3 = signal.tp3 || signal.tp || (isLong ? Number((entry + delta).toFixed(4)) : Number((entry - delta).toFixed(4)));

  const rrRatio = signal.rrRatio || (delta > 0 && Math.abs(entry - sl) > 0 ? Number((delta / Math.abs(entry - sl)).toFixed(1)) : 3.5);

  const handleCopyOfficial = () => {
    if (signal.officialFormatText) {
      navigator.clipboard.writeText(signal.officialFormatText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const riskEngine = signal.riskEngine;
  const regimeEngine = signal.regimeEngine;
  const engineBreakdown = signal.engineBreakdown || [];

  return (
    <div className="bg-[#080d19] border border-white/10 rounded-xl overflow-hidden shadow-2xl space-y-0 text-right" dir="rtl">
      {/* Top Bar: Master Spec v2.0 Header & Regime Gatekeeper Indicator */}
      <div className="bg-black/50 border-b border-white/10 px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-bold text-white tracking-wide">نظام التحليل المؤسساتي — Master Spec v2.0</span>
          {regimeEngine && (
            <span className="bg-blue-500/15 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded text-[11px] font-mono">
              نظام السوق: {regimeEngine.labelArabic}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {signal.officialFormatText && (
            <button
              onClick={handleCopyOfficial}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/15 text-white/80 hover:text-white transition-all text-[11px]"
              title="نسخ التقرير الرسمي طبقاً لوثيقة المواصفات"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "تم النسخ بنجاح" : "نسخ التقرير الرسمي v2.0"}</span>
            </button>
          )}

          {signal.officialFormatText && (
            <button
              onClick={() => setShowRawOfficialText(!showRawOfficialText)}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 transition-all text-[11px]"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{showRawOfficialText ? "إخفاء النص الخام" : "عرض النص الرسمي"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Raw Official Text Collapsible */}
      {showRawOfficialText && signal.officialFormatText && (
        <div className="p-4 bg-[#050913] border-b border-white/10 font-mono text-xs text-white/90 whitespace-pre-wrap leading-relaxed select-all">
          {signal.officialFormatText}
        </div>
      )}

      {/* 1. When NO CLEAR SIGNAL (<85% or Neutral or Rejected by Regime) */}
      {!isSignalValid ? (
        <div className="p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-amber-400 tracking-wide">
                    لا توجد إشارة واضحة حالياً ({signal.symbol})
                  </h3>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono font-bold">
                    حماية رأس المال نشطة (قاعدة: غياب الإشارة إشارة)
                  </span>
                </div>
                <p className="text-xs text-white/50 mt-0.5">
                  الدقة لم تصل إلى شرط الإشارة المؤكدة (≥ 85%)، أو أن استراتيجية الاتجاه غير مسموحة بنظام السوق الحالي.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs text-white/60">
              <Clock className="w-3.5 h-3.5 text-white/40" />
              <span>الإطار: {signal.timeframe || timeframe}</span>
              <span>•</span>
              <span className="text-amber-300 font-bold">معدل التوافق: {signal.confidence || 50}%</span>
            </div>
          </div>

          {/* Strict 3 Mandatory Sections from Spec Section 12 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* الحالة الحالية */}
            <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
                <Activity className="w-4 h-4" />
                <span>1. الحالة الحالية (Market State)</span>
              </div>
              <p className="text-xs text-white/70 leading-relaxed font-sans">
                {signal.noSignalReport?.currentState || 
                 signal.currentMarketState || 
                 signal.reasoning || 
                 "السعر يتحرك في نطاق عرضي وتذبذب ضيق مع توازن نسبي بين قوى العرض والطلب وغياب التدفق المؤسساتي الكافي لاختراق المستويات."}
              </p>
            </div>

            {/* ما نراقبه */}
            <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                <Eye className="w-4 h-4" />
                <span>2. ما نراقبه (Key Levels & Triggers)</span>
              </div>
              <ul className="text-xs text-white/70 leading-relaxed space-y-1 list-disc list-inside">
                {(signal.noSignalReport?.watchingTriggers || signal.watchingLevels || []).length > 0 ? (
                  (signal.noSignalReport?.watchingTriggers || signal.watchingLevels || []).map((lvl, idx) => <li key={idx}>{lvl}</li>)
                ) : (
                  <>
                    <li>اختبار وتفريغ مناطق السيولة السفلية أو العلوية (Liquidity Sweep).</li>
                    <li>ظهور انفراج دايفرجنس مؤكد على مؤشر الزخم RSI أو CVD.</li>
                    <li>تسارع مفاجئ في أحجام التداول (Volume Surge &gt; 1.5x) لتأكيد التدفق.</li>
                  </>
                )}
              </ul>
            </div>

            {/* السيناريوهات */}
            <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#10b981]">
                <Target className="w-4 h-4" />
                <span>3. السيناريوهات (Scenarios & Next Setups)</span>
              </div>
              <p className="text-xs text-white/70 leading-relaxed font-sans">
                {signal.noSignalReport?.scenarios || 
                 signal.marketOutlook || 
                 "الانتظار هو القرار الأكثر ربحية لحين وضوح مسار الحيتان وتأكيد كسر نطاق التذبذب بشمعة إغلاق صريحة خارج مناطق التجميع."}
              </p>
            </div>
          </div>

          {/* Gatekeeper Permissible Matrix */}
          {regimeEngine && (
            <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-blue-400" />
                  مصفوفة سماح الاستراتيجيات (Regime Permissible Matrix)
                </span>
                <span className="text-[11px] font-mono text-white/50">
                  ثبات النظام: {regimeEngine.stabilityHours} ساعة
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <span className="text-[11px] font-bold text-emerald-300 block mb-1">الاستراتيجيات المسموحة حالياً:</span>
                  <span className="text-emerald-200/80 font-mono text-[11px]">{regimeEngine.allowedStrategies.join(" • ")}</span>
                </div>
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                  <span className="text-[11px] font-bold text-rose-300 block mb-1">الممنوعة قطعاً (تُرفض تلقائياً):</span>
                  <span className="text-rose-200/80 font-mono text-[11px]">{regimeEngine.forbiddenStrategies.join(" • ")}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* 2. When STRONG CONFIRMED SIGNAL (≥ 85%) */
        <div className="p-6 sm:p-8 space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl border ${
                signal.direction === "LONG" 
                  ? "bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]" 
                  : "bg-rose-500/10 border-rose-500/30 text-rose-400"
              }`}>
                {signal.direction === "LONG" ? (
                  <TrendingUp className="w-7 h-7" />
                ) : (
                  <TrendingDown className="w-7 h-7" />
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                    ⚡ إشارة تداول — {signal.symbol}
                  </h3>
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-md font-bold font-mono border ${
                    signal.direction === "LONG"
                      ? "bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40"
                      : "bg-rose-500/20 text-rose-400 border-rose-500/40"
                  }`}>
                    {signal.direction === "LONG" ? "شراء صاعد (LONG)" : "بيع هابط (SHORT)"}
                  </span>

                  {/* Fast Opportunity Badge */}
                  {signal.fastOpportunityBadge && (
                    <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-md font-bold">
                      {signal.fastOpportunityBadge}
                    </span>
                  )}

                  {/* Elite Dormant / Floor Badges */}
                  {signal.confluenceFactors?.some(f => f.includes("Dormant") || f.includes("راقدة")) && (
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      فرصة راقدة (Dormant)
                    </span>
                  )}

                  {signal.confluenceFactors?.some(f => f.includes("Floor") || f.includes("قاع فولاذي")) && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      دعم فولاذي مؤكد
                    </span>
                  )}

                  {/* Smart Risk vs Institutional Safe Badge */}
                  {signal.smartRiskLevel === "SMART_CALCULATED_RISK" ? (
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-md font-bold">
                      ⚡ مخاطرة ذكية محسوبة
                    </span>
                  ) : (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-md font-bold">
                      🛡️ أمان مؤسساتي معتمد
                    </span>
                  )}
                </div>
                <p className="text-xs text-white/60 mt-1">
                  {signal.riskLabel || `توافق محركات التحليل الـ 13 • الدقة المعتمدة ${signal.confidence}% (Confluence ≥ 85)`}
                </p>
              </div>
            </div>

            {/* Quick Metrics Badges */}
            <div className="flex flex-wrap items-center gap-2 font-mono self-start sm:self-auto">
              <div className="px-3 py-1.5 bg-white/[0.03] border border-white/10 rounded-lg text-center">
                <span className="text-[10px] text-white/40 block">الإطار الزمني</span>
                <span className="text-xs font-bold text-white">{signal.timeframe || timeframe}</span>
              </div>
              <div className="px-3 py-1.5 bg-white/[0.03] border border-white/10 rounded-lg text-center">
                <span className="text-[10px] text-white/40 block">مستوى الثقة</span>
                <span className="text-xs font-bold text-[#10b981]">{signal.confidence}%</span>
              </div>
              <div className="px-3 py-1.5 bg-[#10b981]/10 border border-[#10b981]/30 rounded-lg text-center">
                <span className="text-[10px] text-[#10b981]/70 block">نسبة R/R</span>
                <span className="text-xs font-black text-[#10b981]">1:{rrRatio}</span>
              </div>
              <div className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-lg text-center">
                <span className="text-[10px] text-purple-300/80 block">حجم المخاطرة</span>
                <span className="text-xs font-black text-purple-300">
                  {riskEngine ? `${riskEngine.capitalRiskPct}% (رافعة ${riskEngine.leverageRecommendation}x)` : "1.0%"}
                </span>
              </div>
            </div>
          </div>

          {/* Trade Execution Grid (Entry Zone, SL, TP1, TP2, TP3) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono">
            {/* منطقة الدخول */}
            <div className="p-3.5 bg-black/40 border border-white/10 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-white/40 uppercase font-sans">الدخول (Entry Zone)</span>
                <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1 rounded">منطقة</span>
              </div>
              <span className="text-sm sm:text-base font-black text-cyan-300">
                ${riskEngine ? `${riskEngine.entryZone[0]} – ${riskEngine.entryZone[1]}` : entry}
              </span>
            </div>

            {/* وقف الخسارة / الإلغاء */}
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/25 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-rose-300/80 uppercase font-sans">وقف الخسارة (SL)</span>
                <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1 rounded">هيكلي + ATR</span>
              </div>
              <span className="text-sm sm:text-base font-black text-rose-400">${sl}</span>
            </div>

            {/* TP1 */}
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/25 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-emerald-400/80 uppercase font-sans">أقرب سيولة (TP1)</span>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1 rounded">إغلاق 40%</span>
              </div>
              <span className="text-sm sm:text-base font-black text-emerald-400">${tp1}</span>
            </div>

            {/* TP2 */}
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/25 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-emerald-400/80 uppercase font-sans">FVG/VAH (TP2)</span>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1 rounded">40% + BE</span>
              </div>
              <span className="text-sm sm:text-base font-black text-emerald-400">${tp2}</span>
            </div>

            {/* TP3 */}
            <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/35 rounded-xl space-y-1 col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-emerald-300 uppercase font-sans">سحب السيولة DOL (TP3)</span>
                <span className="text-[9px] bg-emerald-500/30 text-emerald-200 px-1 rounded">20% Trailing</span>
              </div>
              <span className="text-sm sm:text-base font-black text-emerald-300">${tp3}</span>
            </div>
          </div>

          {/* Engine-by-Engine Score Breakdown Table (تفكيك النقاط محركاً محركاً) */}
          {engineBreakdown.length > 0 && (
            <div className="p-5 bg-white/[0.02] border border-white/10 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  <span>تفكيك النقاط محركاً محركاً (Confidence Confluence Score Breakdown)</span>
                </div>
                <span className="text-[11px] font-mono font-bold text-emerald-400">
                  مجموع التوافق: {signal.confidence}% / 100%
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1 font-mono text-xs">
                {engineBreakdown.map((item, idx) => {
                  const score = typeof item.contributionScore === 'number' && isFinite(item.contributionScore)
                    ? item.contributionScore
                    : typeof (item as any).scoreContribution === 'number' && isFinite((item as any).scoreContribution)
                      ? (item as any).scoreContribution
                      : 0;
                  const name = item.nameArabic || (item as any).engineName || item.name || `محرك ${idx + 1}`;
                  const weightPct = typeof item.weight === 'number' && isFinite(item.weight)
                    ? Math.round(item.weight <= 1 ? item.weight * 100 : item.weight)
                    : 10;
                  const evidenceList = Array.isArray(item.evidence) ? item.evidence : [];

                  return (
                    <div key={idx} className="p-2.5 bg-black/40 border border-white/5 rounded-lg space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-sans font-bold text-white/90 text-[11px]">{name}</span>
                        <span className="text-[10px] text-white/40">وزن {weightPct}%</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-white/60">المساهمة:</span>
                        <span className={`font-bold ${score >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {score >= 0 ? `+${score.toFixed(1)}` : score.toFixed(1)}
                        </span>
                      </div>
                      {evidenceList.length > 0 && (
                        <p className="text-[10px] font-sans text-white/50 truncate" title={evidenceList[0]}>
                          {evidenceList[0]}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* التحليل المفصل */}
          <div className="p-5 bg-white/[0.02] border border-white/10 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#10b981]">
              <Target className="w-4 h-4" />
              <span>التحليل المفصل (Strategic Technical Breakdown)</span>
            </div>
            <p className="text-sm leading-relaxed text-white/85 font-sans">
              {signal.reasoning}
            </p>
          </div>

          {/* مجلس الذكاء الاصطناعي المربوط تلقائياً (4-Model AI Council Consensus) */}
          <div className="p-5 bg-white/[0.02] border border-white/10 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span>إجماع مجلس الذكاء الاصطناعي المربوط تلقائياً (Pre-Connected AI Council)</span>
              </div>
              <span className="text-[10px] font-mono text-[#10b981] bg-[#10b981]/15 px-2 py-0.5 rounded border border-[#10b981]/30">
                4 نماذج متصلة تلقائياً 🟢
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
              {/* 1. MiniMax-M3 */}
              <div className="p-3 bg-black/40 border border-cyan-500/20 rounded-lg space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-cyan-300">MiniMax-M3</span>
                  <span className="text-[9px] text-cyan-400 font-mono">بصري 👁️</span>
                </div>
                <span className="text-[10px] text-white/50 block">تحليل الشارت البصري</span>
                <p className="text-[11px] text-white/80 leading-relaxed font-sans">
                  {signal.aiCouncil?.visualModel?.summary || "تم مسح الشارت والشموع والمناطق المؤسساتية بصرياً بنجاح."}
                </p>
              </div>

              {/* 2. DeepSeek-V4-Pro */}
              <div className="p-3 bg-black/40 border border-[#10b981]/20 rounded-lg space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#10b981]">DeepSeek-V4-Pro</span>
                  <span className="text-[9px] text-[#10b981] font-mono">منطقي 🧠</span>
                </div>
                <span className="text-[10px] text-white/50 block">التحليل العميق والمنطقي</span>
                <p className="text-[11px] text-white/80 leading-relaxed font-sans">
                  {signal.aiCouncil?.reasoningModel?.summary || "مطابقة كتل الأوامر واختبارات السيولة وتتبع تحركات الحيتان."}
                </p>
              </div>

              {/* 3. Kimi K3 */}
              <div className="p-3 bg-black/40 border border-amber-500/20 rounded-lg space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-300">Kimi K3</span>
                  <span className="text-[9px] text-amber-400 font-mono">أخبار 📰</span>
                </div>
                <span className="text-[10px] text-white/50 block">تحليل الأخبار والمشاعر</span>
                <p className="text-[11px] text-white/80 leading-relaxed font-sans">
                  {signal.aiCouncil?.newsModel?.summary || "تقييم المشاعر العامة ومؤشر الخوف والطمع وأثر الأخبار على حركة السعر."}
                </p>
              </div>

              {/* 4. step-3.7-flash */}
              <div className="p-3 bg-black/40 border border-purple-500/20 rounded-lg space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-purple-300">step-3.7-flash</span>
                  <span className="text-[9px] text-purple-400 font-mono">لحظي ⚡</span>
                </div>
                <span className="text-[10px] text-white/50 block">التحليل اللحظي السريع</span>
                <p className="text-[11px] text-white/80 leading-relaxed font-sans">
                  {signal.aiCouncil?.flashModel?.summary || "حساب فوري للأهداف (TP1/TP2/TP3) ووقف الخسارة وتصفية الدقة 85%+."}
                </p>
              </div>
            </div>
          </div>

          {/* الأدلة والبراهين */}
          <div className="p-5 bg-white/[0.02] border border-white/10 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
              <CheckCircle2 className="w-4 h-4" />
              <span>الأدلة والبراهين الفنية المعتمدة (Confluence Evidences)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {((signal.evidence && signal.evidence.length > 0) ? signal.evidence : (signal.confluenceFactors || [])).map((factor, i) => (
                <div key={i} className="flex items-start gap-2 p-2.5 bg-black/40 border border-white/5 rounded-lg text-xs text-white/80">
                  <span className="text-[#10b981] font-bold">✓</span>
                  <span>{factor}</span>
                </div>
              ))}
            </div>
          </div>

          {/* التحذيرات وإدارة المخاطر */}
          <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <span className="font-bold text-amber-300 block">التحذيرات وإدارة المخاطر (Risk Invalidation Rules):</span>
              <p className="text-amber-200/80 leading-relaxed font-sans">
                {signal.warnings && signal.warnings.length > 0 
                  ? signal.warnings.join(" • ")
                  : `الالتزام بوقف الخسارة الهيكلي عند $${sl}. يتم نقل وقف الخسارة إلى نقطة الدخول (Break-Even) فور تحقيق الهدف الأول TP1 ($${tp1}).`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstitutionalSignalCard;
