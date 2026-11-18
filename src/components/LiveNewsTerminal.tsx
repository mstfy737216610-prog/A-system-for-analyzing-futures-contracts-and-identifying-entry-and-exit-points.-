import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Newspaper, RefreshCcw, TrendingUp, TrendingDown, 
  Flame, ExternalLink, Zap, Globe, Gauge, Filter, 
  Search, CheckCircle2, AlertTriangle, Sparkles, SlidersHorizontal,
  ChevronDown
} from "lucide-react";
import { NewsArticle, FearAndGreedData } from "../types";
import axios from "axios";

interface LiveNewsTerminalProps {
  selectedSymbol?: string;
  allSymbols?: string[];
  onSelectSymbol?: (symbol: string) => void;
}

export const LiveNewsTerminal: React.FC<LiveNewsTerminalProps> = ({ 
  selectedSymbol = "BTCUSDT",
  allSymbols = [],
  onSelectSymbol 
}) => {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [fearAndGreed, setFearAndGreed] = useState<FearAndGreedData | null>({
    value: 72,
    classification: "Greed",
    classificationArabic: "طمع استثماري قوي"
  });
  const [loading, setLoading] = useState(false);

  // Filter States
  const [sentimentToneFilter, setSentimentToneFilter] = useState<"ALL" | "POSITIVE" | "NEGATIVE" | "NEUTRAL">("ALL");
  const [impactFilter, setImpactFilter] = useState<"ALL" | "HIGH" | "MEDIUM_HIGH">("ALL");
  const [filterBySymbol, setFilterBySymbol] = useState(false);
  const [activeSymbolTarget, setActiveSymbolTarget] = useState<string>(selectedSymbol);
  const [symbolSearchQuery, setSymbolSearchQuery] = useState("");
  const [isSymbolDropdownOpen, setIsSymbolDropdownOpen] = useState(false);

  // Keep target in sync with prop if user hasn't explicitly diverged
  useEffect(() => {
    if (selectedSymbol) {
      setActiveSymbolTarget(selectedSymbol);
    }
  }, [selectedSymbol]);

  const fetchNews = async (force = false) => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/news?force=${force}`);
      if (res.data) {
        if (Array.isArray(res.data.news)) setNews(res.data.news);
        if (res.data.fearAndGreed) setFearAndGreed(res.data.fearAndGreed);
      }
    } catch (e) {
      console.error("Failed to load news:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
    const timer = setInterval(() => fetchNews(false), 60000); // 1-minute background poll
    return () => clearInterval(timer);
  }, []);

  // Helper to extract base asset from trading symbol (e.g. BTCUSDT -> BTC)
  const cleanBase = (sym?: string) => (sym && typeof sym === "string") ? sym.toUpperCase().replace("USDT", "").replace("BUSD", "").replace("PERP", "").trim() : "";
  const currentBaseAsset = cleanBase(activeSymbolTarget);

  // Check if article affects the chosen symbol
  const checkArticleAffectsSymbol = (item: NewsArticle, targetBase: string) => {
    if (!targetBase) return true;
    const baseUpper = targetBase.toUpperCase();
    
    // 1. Direct symbol tag match
    const hasTagMatch = (item.affectedSymbols || []).some(s => {
      const cleanS = cleanBase(s);
      return cleanS === baseUpper || s.toUpperCase() === baseUpper || s.toUpperCase().includes(baseUpper);
    });
    if (hasTagMatch) return true;

    // 2. Keyword match in title or summary or raw text
    const fullText = `${item.title || ""} ${item.titleArabic || ""} ${item.summaryArabic || ""} ${item.institutionalTakeaway || ""}`.toUpperCase();
    if (fullText.includes(baseUpper)) return true;

    // Common crypto names aliases
    if (baseUpper === "BTC" && (fullText.includes("BITCOIN") || fullText.includes("بيتكوين") || fullText.includes("البيتكوين"))) return true;
    if (baseUpper === "ETH" && (fullText.includes("ETHEREUM") || fullText.includes("إيثيريوم") || fullText.includes("ايثيريوم"))) return true;
    if (baseUpper === "SOL" && (fullText.includes("SOLANA") || fullText.includes("سولانا"))) return true;
    if (baseUpper === "BNB" && (fullText.includes("BINANCE") || fullText.includes("بايننس") || fullText.includes("بينانس"))) return true;
    if (baseUpper === "XRP" && (fullText.includes("RIPPLE") || fullText.includes("ريبل"))) return true;
    if (baseUpper === "DOGE" && (fullText.includes("DOGECOIN") || fullText.includes("دوج"))) return true;

    return false;
  };

  // Filtered news computation
  const filteredNews = useMemo(() => {
    return news.filter(n => {
      // 1. Symbol Target Filter
      if (filterBySymbol) {
        const affects = checkArticleAffectsSymbol(n, currentBaseAsset);
        if (!affects) return false;
      }

      // 2. Sentiment Tone Filter
      const score = typeof n.sentimentScore === "number" ? n.sentimentScore : (n.sentiment === "BULLISH" ? 75 : n.sentiment === "BEARISH" ? -75 : 0);
      const tone = n.sentimentTone || (score > 15 ? "POSITIVE" : score < -15 ? "NEGATIVE" : "NEUTRAL");

      if (sentimentToneFilter === "POSITIVE" && tone !== "POSITIVE") return false;
      if (sentimentToneFilter === "NEGATIVE" && tone !== "NEGATIVE") return false;
      if (sentimentToneFilter === "NEUTRAL" && tone !== "NEUTRAL") return false;

      // 3. Impact Filter
      if (impactFilter === "HIGH" && n.impact !== "HIGH") return false;
      if (impactFilter === "MEDIUM_HIGH" && n.impact === "LOW") return false;

      return true;
    });
  }, [news, filterBySymbol, currentBaseAsset, sentimentToneFilter, impactFilter]);

  // Sentiment Breakdown Stats for filtered set
  const sentimentStats = useMemo(() => {
    const list = filterBySymbol ? news.filter(n => checkArticleAffectsSymbol(n, currentBaseAsset)) : news;
    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;
    let sumScore = 0;

    list.forEach(item => {
      const score = typeof item.sentimentScore === "number" ? item.sentimentScore : (item.sentiment === "BULLISH" ? 75 : item.sentiment === "BEARISH" ? -75 : 0);
      const tone = item.sentimentTone || (score > 15 ? "POSITIVE" : score < -15 ? "NEGATIVE" : "NEUTRAL");
      if (tone === "POSITIVE") positiveCount++;
      else if (tone === "NEGATIVE") negativeCount++;
      else neutralCount++;
      sumScore += score;
    });

    const total = list.length || 1;
    const avgScore = Math.round(sumScore / total);
    const overallTone = avgScore > 15 ? "POSITIVE" : avgScore < -15 ? "NEGATIVE" : "NEUTRAL";

    return {
      total: list.length,
      positiveCount,
      negativeCount,
      neutralCount,
      avgScore,
      overallTone,
      bullishPercent: Math.round((positiveCount / total) * 100),
      bearishPercent: Math.round((negativeCount / total) * 100),
    };
  }, [news, filterBySymbol, currentBaseAsset]);

  const fgValue = fearAndGreed?.value || 50;

  return (
    <div className="space-y-6">
      {/* Top Header with Fear & Greed & Sentiment Overview */}
      <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 rounded-sm border border-blue-500/20 text-blue-400">
            <Newspaper className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">رادار الأخبار الذكي وتحليل النبرة (Sentiment Terminal)</h2>
              <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-mono font-bold">
                SENTIMENT AI
              </span>
            </div>
            <p className="text-xs text-white/40 mt-0.5">
              فلترة لحظية للأخبار حسب تأثيرها المباشر على العملة المختارة مع رصد النبرة المؤسساتية (إيجابي / سلبي / محايد)
            </p>
          </div>
        </div>

        {/* Fear & Greed Compact Meter + Refresh */}
        <div className="flex items-center gap-4 bg-black/60 border border-white/5 p-3 rounded-sm self-start md:self-auto">
          <Gauge className="w-5 h-5 text-amber-400" />
          <div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[10px] text-white/40 uppercase">مؤشر الخوف والطمع العام</span>
              <span className="text-xs font-bold font-mono text-amber-400">{fgValue}/100</span>
            </div>
            <span className="text-xs font-bold text-white block mt-0.5">
              {fearAndGreed?.classificationArabic || "طمع استثماري"}
            </span>
          </div>
          <button
            onClick={() => fetchNews(true)}
            disabled={loading}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-sm text-white/60 hover:text-white transition-all ml-2"
            title="تحديث فوري للأخبار"
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#10b981]" : ""}`} />
          </button>
        </div>
      </div>

      {/* Advanced Filter Toolbar: Target Symbol & Sentiment Tone */}
      <div className="bg-[#0a0a0a] border border-white/10 p-4 rounded-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Symbol Specific Filter Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilterBySymbol(!filterBySymbol)}
              className={`flex items-center gap-2 px-3 py-2 rounded-sm text-xs font-bold font-mono transition-all border ${
                filterBySymbol 
                  ? "bg-[#10b981]/20 border-[#10b981] text-[#10b981] shadow-[0_0_12px_rgba(16,185,129,0.2)]" 
                  : "bg-white/5 border-white/10 text-white/50 hover:text-white"
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>أخبار {currentBaseAsset} فقط</span>
              <span className={`w-2 h-2 rounded-full ${filterBySymbol ? "bg-[#10b981] animate-pulse" : "bg-white/20"}`} />
            </button>

            {/* Change Active Target Currency */}
            <div className="relative">
              <div 
                onClick={() => setIsSymbolDropdownOpen(!isSymbolDropdownOpen)}
                className="flex items-center gap-1.5 bg-black border border-white/10 hover:border-white/20 px-2.5 py-1.5 rounded-sm cursor-pointer text-xs font-mono text-white/80"
                title="تغيير العملة المستهدفة بالفلترة"
              >
                <span className="text-white/40 text-[10px]">العملة:</span>
                <span className="font-bold text-white">{currentBaseAsset}</span>
                <ChevronDown className="w-3 h-3 text-white/40" />
              </div>

              {isSymbolDropdownOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-[#0e0e0e] border border-white/15 rounded-sm shadow-2xl z-50 p-2 space-y-1">
                  <div className="relative mb-1">
                    <Search className="w-3 h-3 text-white/40 absolute right-2 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="ابحث عن رمز..."
                      value={symbolSearchQuery}
                      onChange={(e) => setSymbolSearchQuery(e.target.value.toUpperCase())}
                      className="w-full bg-black border border-white/10 rounded-xs py-1 pr-7 pl-2 text-[10px] text-white focus:outline-hidden focus:border-[#10b981]"
                    />
                  </div>
                  <div className="max-h-36 overflow-y-auto custom-scrollbar space-y-0.5">
                    {["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", "DOGEUSDT", ...allSymbols]
                      .filter((v, i, a) => a.indexOf(v) === i)
                      .filter(s => s.toLowerCase().includes(symbolSearchQuery.toLowerCase()))
                      .slice(0, 15)
                      .map(sym => (
                        <button
                          key={sym}
                          onClick={() => {
                            setActiveSymbolTarget(sym);
                            setFilterBySymbol(true);
                            setIsSymbolDropdownOpen(false);
                            if (onSelectSymbol) onSelectSymbol(sym);
                          }}
                          className={`w-full text-right px-2 py-1 rounded text-[11px] font-mono hover:bg-white/10 flex items-center justify-between ${
                            cleanBase(sym) === currentBaseAsset ? "text-[#10b981] font-bold bg-[#10b981]/10" : "text-white/70"
                          }`}
                        >
                          <span>{cleanBase(sym)}</span>
                          <span className="text-[9px] text-white/30">{sym}</span>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Toggle to Show All Market News */}
            {filterBySymbol && (
              <button
                onClick={() => setFilterBySymbol(false)}
                className="text-[10px] text-white/40 hover:text-white underline px-1"
              >
                إظهار جميع أخبار السوق
              </button>
            )}
          </div>

          {/* Sentiment Tone Meter (Score Bar) */}
          <div className="flex items-center gap-3 bg-black/70 border border-white/5 px-3 py-2 rounded-sm font-mono text-xs">
            <span className="text-[10px] text-white/40">نبرة الأخبار لـ {filterBySymbol ? currentBaseAsset : "السوق"}:</span>
            <div className="flex items-center gap-1.5">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                sentimentStats.overallTone === "POSITIVE" 
                  ? "bg-[#10b981]/20 text-[#10b981]" 
                  : sentimentStats.overallTone === "NEGATIVE" 
                    ? "bg-rose-500/20 text-rose-400" 
                    : "bg-white/10 text-white/60"
              }`}>
                {sentimentStats.overallTone === "POSITIVE" ? "إيجابية 🟢" : sentimentStats.overallTone === "NEGATIVE" ? "سلبية 🔴" : "محايدة ⚪"}
              </span>
              <span className={`text-[11px] font-bold ${
                sentimentStats.avgScore > 0 ? "text-[#10b981]" : sentimentStats.avgScore < 0 ? "text-rose-400" : "text-white/60"
              }`}>
                ({sentimentStats.avgScore > 0 ? `+${sentimentStats.avgScore}` : sentimentStats.avgScore}%)
              </span>
            </div>
          </div>
        </div>

        {/* Sentiment Tone & Impact Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/5">
          {/* Tone Selector */}
          <div className="flex items-center gap-1.5 bg-black/60 p-1 border border-white/5 rounded-sm">
            <span className="text-[10px] text-white/30 px-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-white/40" /> نبرة الخبر:
            </span>
            {[
              { id: "ALL", label: "الكل" },
              { id: "POSITIVE", label: "إيجابي فقط 🟢" },
              { id: "NEGATIVE", label: "سلبي فقط 🔴" },
              { id: "NEUTRAL", label: "محايد ⚪" }
            ].map(btn => (
              <button
                key={btn.id}
                onClick={() => setSentimentToneFilter(btn.id as any)}
                className={`text-[11px] px-3 py-1 rounded transition-all font-sans ${
                  sentimentToneFilter === btn.id 
                    ? btn.id === "POSITIVE"
                      ? "bg-[#10b981] text-black font-bold shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                      : btn.id === "NEGATIVE"
                        ? "bg-rose-500 text-white font-bold shadow-[0_0_10px_rgba(244,63,94,0.3)]"
                        : "bg-white/20 text-white font-bold"
                    : "text-white/40 hover:text-white hover:bg-white/5"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Impact Selector */}
          <div className="flex items-center gap-1.5 bg-black/60 p-1 border border-white/5 rounded-sm">
            <span className="text-[10px] text-white/30 px-2 flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-400" /> التأثير:
            </span>
            {[
              { id: "ALL", label: "كافة المستويات" },
              { id: "HIGH", label: "عالي التأثير 🔥" },
              { id: "MEDIUM_HIGH", label: "متوسط فأعلى" }
            ].map(btn => (
              <button
                key={btn.id}
                onClick={() => setImpactFilter(btn.id as any)}
                className={`text-[11px] px-2.5 py-1 rounded transition-all ${
                  impactFilter === btn.id 
                    ? "bg-amber-500 text-black font-bold shadow-[0_0_10px_rgba(245,158,11,0.3)]" 
                    : "text-white/40 hover:text-white hover:bg-white/5"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <span className="text-[10px] text-white/40 font-mono">
            {filteredNews.length} من أصل {news.length} خبر
          </span>
        </div>
      </div>

      {/* News Stream Cards */}
      <div className="space-y-4">
        {filteredNews.length === 0 ? (
          <div className="bg-[#0a0a0a] border border-white/5 rounded-sm p-12 text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-amber-400/60 mx-auto" />
            <h4 className="text-sm font-bold text-white">لا توجد أخبار مطابقة لخيارات الفلترة الحالية</h4>
            <p className="text-xs text-white/40 max-w-md mx-auto leading-relaxed">
              {filterBySymbol 
                ? `لم يتم رصد أخبار مباشرة تخص ${currentBaseAsset} تطابق نبرة "${sentimentToneFilter === 'POSITIVE' ? 'إيجابي' : sentimentToneFilter === 'NEGATIVE' ? 'سلبي' : 'المحددة'}". جرب إيقاف فلترة العملة أو اختيار نبرة أخرى.`
                : "جرب تغيير فلاتر النبرة أو درجة التأثير لعرض بقية التغطيات الإخبارية."}
            </p>
            {filterBySymbol && (
              <button
                onClick={() => setFilterBySymbol(false)}
                className="mt-2 text-xs bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-sm border border-white/10 transition-all font-mono"
              >
                عرض أخبار جميع العملات
              </button>
            )}
          </div>
        ) : (
          filteredNews.map((item, idx) => {
            const score = typeof item.sentimentScore === "number" ? item.sentimentScore : (item.sentiment === "BULLISH" ? 75 : item.sentiment === "BEARISH" ? -75 : 0);
            const tone = item.sentimentTone || (score > 15 ? "POSITIVE" : score < -15 ? "NEGATIVE" : "NEUTRAL");
            const isPos = tone === "POSITIVE";
            const isNeg = tone === "NEGATIVE";

            // Visual percentage fill for tone indicator meter
            const scoreFillPercent = Math.min(100, Math.max(10, Math.abs(score)));

            return (
              <motion.div
                key={item.id || idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className={`bg-[#0a0a0a] hover:bg-white/[0.02] border p-5 rounded-sm transition-all space-y-3 relative overflow-hidden ${
                  isPos 
                    ? "border-[#10b981]/20 hover:border-[#10b981]/40" 
                    : isNeg 
                      ? "border-rose-500/20 hover:border-rose-500/40" 
                      : "border-white/5 hover:border-white/10"
                }`}
              >
                {/* Sentiment Accent Bar on right side */}
                <div 
                  className={`absolute top-0 right-0 bottom-0 w-1 ${
                    isPos ? "bg-[#10b981]" : isNeg ? "bg-rose-500" : "bg-white/20"
                  }`} 
                />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mr-2">
                  <div className="flex flex-wrap items-center gap-2">
                    
                    {/* Sentiment Tone Badge */}
                    <div className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1.5 font-mono ${
                      isPos 
                        ? "bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30" 
                        : isNeg 
                          ? "bg-rose-500/15 text-rose-400 border border-rose-500/30" 
                          : "bg-white/10 text-white/60 border border-white/10"
                    }`}>
                      {isPos ? <TrendingUp className="w-3.5 h-3.5" /> : isNeg ? <TrendingDown className="w-3.5 h-3.5" /> : null}
                      <span>نبرة الخبر: {isPos ? "إيجابي (Positive)" : isNeg ? "سلبي (Negative)" : "محايد (Neutral)"}</span>
                      <span className="text-[10px] opacity-80">
                        ({score > 0 ? `+${score}` : score}%)
                      </span>
                    </div>

                    {/* Impact Badge */}
                    {item.impact === "HIGH" && (
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 font-mono">
                        <Flame className="w-3 h-3 text-amber-400" /> عالي التأثير (High Impact)
                      </span>
                    )}

                    <span className="text-[10px] text-white/30 font-mono">{item.source} • {item.pubDate}</span>
                  </div>

                  {/* Affected Symbols Chips */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-white/30">العملات المعنية:</span>
                    {(item.affectedSymbols || []).map(sym => {
                      const base = cleanBase(sym);
                      const isMatchingCurrent = base === currentBaseAsset;
                      return (
                        <button
                          key={sym}
                          onClick={() => onSelectSymbol && onSelectSymbol(sym.includes("USDT") ? sym : `${sym}USDT`)}
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-sm border transition-all ${
                            isMatchingCurrent 
                              ? "bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40 shadow-xs" 
                              : "bg-white/5 hover:bg-white/10 text-white/80 border-white/5"
                          }`}
                          title={`تحليل واقتناص شارت ${base}`}
                        >
                          {base}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sentiment Strength Visual Bar */}
                <div className="mr-2 flex items-center gap-2">
                  <span className="text-[9px] text-white/30 font-mono uppercase">مؤشر القوة:</span>
                  <div className="flex-1 max-w-xs h-1.5 bg-white/5 rounded-full overflow-hidden flex">
                    {isNeg ? (
                      <div 
                        className="bg-rose-500 h-full rounded-full transition-all duration-500 mr-auto"
                        style={{ width: `${scoreFillPercent}%` }}
                      />
                    ) : (
                      <div 
                        className="bg-[#10b981] h-full rounded-full transition-all duration-500 ml-auto"
                        style={{ width: `${scoreFillPercent}%` }}
                      />
                    )}
                  </div>
                  <span className={`text-[9px] font-mono font-bold ${
                    isPos ? "text-[#10b981]" : isNeg ? "text-rose-400" : "text-white/40"
                  }`}>
                    {scoreFillPercent}% {isPos ? "زخم شراء" : isNeg ? "ضغط بيع" : "توازن"}
                  </span>
                </div>

                {/* News Title & Summary */}
                <div className="mr-2">
                  <h3 className="text-sm font-bold text-white leading-snug hover:text-blue-300 transition-colors">
                    {item.titleArabic || item.title}
                  </h3>
                  <p className="text-xs text-white/60 mt-1.5 leading-relaxed font-sans">
                    {item.summaryArabic}
                  </p>
                </div>

                {/* Institutional Takeaway (Whale action expected) */}
                <div className="mr-2 p-3 bg-white/[0.02] border border-white/5 rounded-sm flex items-start gap-2.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                  <div className="text-[11px] text-white/70 leading-relaxed font-sans">
                    <strong className="text-white font-bold ml-1">قراءة وتحرك الحيتان:</strong>
                    {item.institutionalTakeaway}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LiveNewsTerminal;
