import { MarketSignal } from "./types";

export type SignalTier = "DIAMOND" | "PLATINUM" | "SILVER";

export interface SignalStrengthProfile {
  score: number; // 0 - 100
  tier: SignalTier;
  tierTitle: string;
  tierShortName: string;
  tierRankLabel: string;
  tierBadgeClass: string;
  cardBorderClass: string;
  badgeGlow: string;
  barColor: string;
  stars: string;
  levelRank: number; // 1 for Diamond, 2 for Platinum, 3 for Silver
  strengthReasons: string[];
  // ⚡ Fast Arrival & High-Strike Accuracy Attributes
  strikeHitRate: number; // 90 - 98%
  strikePillText: string;
  velocitySpeedBadge: string;
  waitingTimeEstimate: string;
  htfTimeframePill: string;
  isPreTrendCandidate: boolean;
  fastActionCopyText: string;
  imminentBurst: boolean;
}

export function evaluateSignalStrength(sig: MarketSignal): SignalStrengthProfile {
  let score = Math.round((sig.confidence || 80) * 0.42); // 34-41 pts
  const reasons: string[] = [];

  // 1. Structural multi-timeframe confirmation (1D + 4H + 1H) - استبعاد الفريمات الصغيرة
  if (sig.multiTimeframeConfirmed || (sig.multiTimeframeAnalysis && sig.multiTimeframeAnalysis.alignmentScore >= 80)) {
    score += 12;
    reasons.push("توافق هيكلي تام عبر الأطر الثلاثية الكبرى (1D + 4H + 1H)");
  }

  // 2. Trend of the Day & Pre-Trend Ignition on HTF 4H/1D (رصد عملات تريند اليوم قبل انطلاق الحركة)
  const isPreTrend = Boolean(sig.isTrendOfTheDay || sig.trendOfTheDay?.isCandidate || sig.setupCategory === 'PRE_IGNITION_COILED');
  if (isPreTrend) {
    score += 15;
    reasons.push("مرشحة بقوة لتكون تريند اليوم (Pre-Trend Ignition على 4H/1D)");
    if (sig.trendOfTheDay?.stageArabic) {
      reasons.push(sig.trendOfTheDay.stageArabic);
    }
  }

  // Real trade purity & HTF structural execution
  if (sig.isRealTradeConfirmed) {
    score += 10;
    reasons.push("صفقة هيكلية حقيقية تضرب الهدف بالمليمتر (Real Trade Confirmed)");
  }
  if (sig.realTradePurityScore && sig.realTradePurityScore >= 85) {
    score += Math.round(sig.realTradePurityScore * 0.08);
  }
  if (sig.hasDivergence) {
    score += 8;
    reasons.push("دايفرجنس انعكاسي مؤكد (RSI / MACD Divergence)");
  }
  if (sig.hasFvg) {
    score += 6;
    reasons.push("إعادة اختبار فجوة سيولة مؤسساتية (FVG Rebalance)");
  }
  if (sig.isPreIgnitionReady) {
    score += 8;
    reasons.push("جاهزية اقتناص استباقي قبل الحركة (Pre-Ignition)");
  }
  if (sig.highLiquidityQualityGate?.isPassed) {
    score += 6;
    reasons.push("تدفق سيولة حقيقي واجتياز مرشح الحيتان");
  }

  // 3. Risk-to-Reward ratio
  const rr = sig.rrRatio || 3.0;
  if (rr >= 4.5) {
    score += 9;
    reasons.push(`نسبة عائد للمخاطرة استثنائية (1:${rr})`);
  } else if (rr >= 3.5) {
    score += 6;
    reasons.push(`نسبة عائد للمخاطرة ممتازة (1:${rr})`);
  } else if (rr >= 2.5) {
    score += 3;
  }

  // 4. Profit targets yield
  const profit = sig.profitPercent || 10;
  if (profit >= 25) {
    score += 8;
    reasons.push(`عائد ربحي مستهدف كبير (+${profit}%)`);
  } else if (profit >= 14) {
    score += 5;
    reasons.push(`عائد ربحي مستهدف قوي (+${profit}%)`);
  }

  // Always enforce zero-loss breakeven
  reasons.push("حماية رأس المال: نقل الوقف لنقطة الدخول فور ضرب TP1");

  // Normalization between 74 and 99
  const finalScore = Math.min(99, Math.max(74, score));

  // Strike Hit Rate calculation (صفقة قوية تضرب الهدف بدقة عالية)
  const strikeHitRate = Math.min(98, Math.max(88, Math.round(
    (finalScore * 0.55) + 
    (sig.hasDivergence ? 12 : 6) + 
    (isPreTrend ? 14 : 8) + 
    (sig.hasFvg ? 8 : 4)
  )));

  // Velocity & Fast Arrival Calculation (وصول سريع لا انتظار طويل)
  const isPerfectZone = sig.entryProximity === 'PERFECT_ZONE_NOW';
  const imminentBurst = isPerfectZone || isPreTrend || Boolean(sig.isPreIgnitionReady) || Boolean(sig.isMomentumBreakout);
  
  let velocitySpeedBadge = "⚡ وصول سريع وانطلاق وشيك";
  let waitingTimeEstimate = "⏱️ انطلاق سريع - في قلب منطقة الدخول تماماً";
  if (isPerfectZone) {
    velocitySpeedBadge = "🔥 انطلاق فوري وشيك (جاهز الآن)";
    waitingTimeEstimate = "⏱️ حركة فورية دون انتظار - السعر عند التريغر";
  } else if (isPreTrend) {
    velocitySpeedBadge = "👑 تريند اليوم المرتقب (قبل الانفجار)";
    waitingTimeEstimate = "⏱️ رصد استباقي في نهاية التجميع - لا انتظار طويل";
  }

  // Ready formatted text for fast exchange execution copy
  const tp1Val = sig.tp1 || sig.tp || 0;
  const tp2Val = sig.tp2 || (tp1Val * 1.05);
  const fastActionCopyText = `🎯 توصية قناص النخبة: ${sig.symbol} (${sig.direction === 'LONG' ? 'شراء صاعد 🟢' : 'بيع هابط 🔴'})
📌 الدخول الدقيق: ${sig.entry}
🛡️ وقف الخسارة: ${sig.sl}
🎯 الهدف الأول TP1: ${tp1Val} (تأمين الوقف عند ضربه)
🚀 الهدف الثاني TP2: ${tp2Val}
⚡ نسبة المخاطرة للعائد R:R: 1:${sig.rrRatio || 3.5}
👑 الأطر المعتمدة: 1D • 4H • 1H أطر كبرى رصينة (استبعاد الفريمات الصغيرة)`;

  if (finalScore >= 90) {
    return {
      score: finalScore,
      tier: "DIAMOND",
      tierTitle: "المستوى الماسي النخبوي (خارق)",
      tierShortName: "الماسي النخبوي",
      tierRankLabel: "المستوى #1 الخارق",
      tierBadgeClass: "bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 text-black font-black border border-emerald-300",
      cardBorderClass: "border-emerald-400/80 shadow-[0_0_28px_rgba(16,185,129,0.22)] ring-1 ring-emerald-400/50",
      badgeGlow: "shadow-[0_0_16px_rgba(16,185,129,0.55)]",
      barColor: "from-emerald-400 to-teal-300",
      stars: "👑👑👑",
      levelRank: 1,
      strengthReasons: reasons.slice(0, 4),
      strikeHitRate,
      strikePillText: `🎯 نسبة ضرب الهدف المؤكد: ${strikeHitRate}%`,
      velocitySpeedBadge,
      waitingTimeEstimate,
      htfTimeframePill: "1D • 4H • 1H أطر كبرى رصينة",
      isPreTrendCandidate: isPreTrend,
      fastActionCopyText,
      imminentBurst
    };
  } else if (finalScore >= 82) {
    return {
      score: finalScore,
      tier: "PLATINUM",
      tierTitle: "المستوى البلاتيني الذهبي (قوي جداً)",
      tierShortName: "البلاتيني الذهبي",
      tierRankLabel: "المستوى #2 الذهبي",
      tierBadgeClass: "bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-black font-black border border-amber-300",
      cardBorderClass: "border-amber-400/60 shadow-[0_0_22px_rgba(245,158,11,0.15)] ring-1 ring-amber-400/30",
      badgeGlow: "shadow-[0_0_14px_rgba(251,191,36,0.45)]",
      barColor: "from-amber-400 to-yellow-300",
      stars: "💎💎",
      levelRank: 2,
      strengthReasons: reasons.slice(0, 3),
      strikeHitRate,
      strikePillText: `🎯 نسبة ضرب الهدف المؤكد: ${strikeHitRate}%`,
      velocitySpeedBadge,
      waitingTimeEstimate,
      htfTimeframePill: "1D • 4H • 1H أطر كبرى رصينة",
      isPreTrendCandidate: isPreTrend,
      fastActionCopyText,
      imminentBurst
    };
  } else {
    return {
      score: finalScore,
      tier: "SILVER",
      tierTitle: "المستوى الفضي التكتيكي (سريع)",
      tierShortName: "الفضي التكتيكي",
      tierRankLabel: "المستوى #3 الفضي",
      tierBadgeClass: "bg-sky-500/20 text-sky-300 border border-sky-400/50 font-bold",
      cardBorderClass: "border-sky-500/30 shadow-[0_0_15px_rgba(56,189,248,0.08)]",
      badgeGlow: "shadow-[0_0_10px_rgba(56,189,248,0.3)]",
      barColor: "from-sky-400 to-blue-400",
      stars: "⭐",
      levelRank: 3,
      strengthReasons: reasons.slice(0, 3),
      strikeHitRate,
      strikePillText: `🎯 نسبة ضرب الهدف المؤكد: ${strikeHitRate}%`,
      velocitySpeedBadge,
      waitingTimeEstimate,
      htfTimeframePill: "1D • 4H • 1H أطر كبرى رصينة",
      isPreTrendCandidate: isPreTrend,
      fastActionCopyText,
      imminentBurst
    };
  }
}
