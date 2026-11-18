import { ComprehensiveMarketMatrix } from "../src/types";

export interface MarketMatrixEvaluation {
  matrix: ComprehensiveMarketMatrix;
  isMatrixApproved: boolean;
  matrixScore: number;
  rejectionReason?: string;
}

export function evaluateComprehensiveMarketMatrix(
  h1RawKlines: any[],
  techCloses: number[],
  currentClose: number,
  currentAtr: number,
  bbUpper: number,
  bbLower: number,
  bbMiddle: number,
  proposedDir: "LONG" | "SHORT",
  btc1hChangePct: number = 0,
  depthOrderBook?: { bids: [string, string][]; asks: [string, string][] }
): MarketMatrixEvaluation {
  if (!h1RawKlines || h1RawKlines.length < 5) {
    return {
      matrix: generateDefaultMatrix(currentClose, currentAtr),
      isMatrixApproved: false,
      matrixScore: 50,
      rejectionReason: "بيانات الشموع والتدفق المالي غير كافية لتقييم السيولة والصفقات"
    };
  }

  const lastK = h1RawKlines[h1RawKlines.length - 1];
  const prevK = h1RawKlines[h1RawKlines.length - 2];

  // 1. ========================================================
  // السيولة وعمق السوق (Liquidity & Depth Analysis)
  // ========================================================
  const totalVolume1h = parseFloat(lastK[5]) || 0;
  const turnover1hUsd = parseFloat(lastK[7]) || (totalVolume1h * currentClose);
  const takerBuyBase = parseFloat(lastK[9]) || (totalVolume1h * 0.5);
  const takerBuyQuoteUsd = parseFloat(lastK[10]) || (takerBuyBase * currentClose);
  const takerSellQuoteUsd = Math.max(0, turnover1hUsd - takerBuyQuoteUsd);
  const orderFlowDeltaUsd = takerBuyQuoteUsd - takerSellQuoteUsd;
  const buyPressurePct = turnover1hUsd > 0 
    ? Math.round((takerBuyQuoteUsd / turnover1hUsd) * 100) 
    : 50;

  // Order Book depth calculation if available
  let bidAskWallRatio = 1.0;
  let orderBookImbalance: "HEAVY_BUY_WALLS" | "HEAVY_SELL_WALLS" | "BALANCED_DEPTH" = "BALANCED_DEPTH";
  if (depthOrderBook && Array.isArray(depthOrderBook.bids) && Array.isArray(depthOrderBook.asks)) {
    const totalBidVol = depthOrderBook.bids.slice(0, 15).reduce((sum, b) => sum + (parseFloat(b[0]) * parseFloat(b[1])), 0);
    const totalAskVol = depthOrderBook.asks.slice(0, 15).reduce((sum, a) => sum + (parseFloat(a[0]) * parseFloat(a[1])), 0);
    if (totalAskVol > 0) {
      bidAskWallRatio = Number((totalBidVol / totalAskVol).toFixed(2));
      if (bidAskWallRatio >= 1.35) orderBookImbalance = "HEAVY_BUY_WALLS";
      else if (bidAskWallRatio <= 0.74) orderBookImbalance = "HEAVY_SELL_WALLS";
    }
  }

  let liquidityQuality: "DEEP_INSTITUTIONAL" | "HEALTHY_LIQUID" | "MEDIUM_CAUTION" | "THIN_SLIPPAGE_RISK" = "HEALTHY_LIQUID";
  let slippageRisk: "MINIMAL" | "LOW" | "MODERATE" | "HIGH" = "LOW";
  if (turnover1hUsd >= 5_000_000) {
    liquidityQuality = "DEEP_INSTITUTIONAL";
    slippageRisk = "MINIMAL";
  } else if (turnover1hUsd >= 600_000) {
    liquidityQuality = "HEALTHY_LIQUID";
    slippageRisk = "LOW";
  } else if (turnover1hUsd >= 120_000) {
    liquidityQuality = "MEDIUM_CAUTION";
    slippageRisk = "MODERATE";
  } else {
    liquidityQuality = "THIN_SLIPPAGE_RISK";
    slippageRisk = "HIGH";
  }

  const liquiditySummary = `${liquidityQuality === "DEEP_INSTITUTIONAL" ? "سيولة مؤسساتية عميقة" : liquidityQuality === "HEALTHY_LIQUID" ? "سيولة صحية نشطة" : "سيولة حذرة"} (دوران ساعة: $${(turnover1hUsd / 1000).toFixed(0)}k | ضغط الشراء الماركت: ${buyPressurePct}%)`;

  // 2. ========================================================
  // الصفقات والتدفق المالي وبصمة الحيتان (Trades & Deal Flow)
  // ========================================================
  const tradeCount1h = parseInt(lastK[8]) || Math.max(50, Math.round(turnover1hUsd / 1500));
  const avgTradeSizeUsd = Math.round(turnover1hUsd / Math.max(1, tradeCount1h));

  // Compute baseline average trade size over last 12 klines
  const lookbackKlines = h1RawKlines.slice(-14, -1);
  let historicalTotalQuote = 0;
  let historicalTotalTrades = 0;
  for (const k of lookbackKlines) {
    historicalTotalQuote += parseFloat(k[7]) || (parseFloat(k[5]) * currentClose);
    historicalTotalTrades += parseInt(k[8]) || 1;
  }
  const baselineAvgTradeSize = historicalTotalTrades > 0 
    ? historicalTotalQuote / historicalTotalTrades 
    : avgTradeSizeUsd;

  const tradeSizeRatio = baselineAvgTradeSize > 0 
    ? avgTradeSizeUsd / baselineAvgTradeSize 
    : 1;

  let whaleDominance: "WHALE_ACCUMULATING" | "WHALE_DISTRIBUTING" | "BALANCED_MIX" | "RETAIL_NOISE" = "BALANCED_MIX";
  let whaleActivityScore = 50;

  if (tradeSizeRatio >= 1.6 && buyPressurePct >= 52) {
    whaleDominance = "WHALE_ACCUMULATING";
    whaleActivityScore = Math.min(98, Math.round(75 + (tradeSizeRatio * 10)));
  } else if (tradeSizeRatio >= 1.6 && buyPressurePct <= 46) {
    whaleDominance = "WHALE_DISTRIBUTING";
    whaleActivityScore = Math.min(98, Math.round(75 + (tradeSizeRatio * 10)));
  } else if (tradeCount1h >= 1200) {
    whaleDominance = "BALANCED_MIX";
    whaleActivityScore = 65;
  } else {
    whaleDominance = "RETAIL_NOISE";
    whaleActivityScore = 40;
  }

  const largeDealsDetected = tradeSizeRatio >= 1.5 || avgTradeSizeUsd >= 4000;
  const dealFlowPace: "RAPID_FIRE" | "STEADY_ACCUMULATION" | "SLOW_QUIET" = 
    tradeCount1h >= 2500 ? "RAPID_FIRE" : (tradeCount1h >= 500 ? "STEADY_ACCUMULATION" : "SLOW_QUIET");

  const tradesSummary = `${whaleDominance === "WHALE_ACCUMULATING" ? "تجميع حيتان مؤكد بصفقات ضخمة" : whaleDominance === "WHALE_DISTRIBUTING" ? "تصريف حيتان نشط" : "تدفق صفقات متوازن"} (متوسط الصفقة: $${avgTradeSizeUsd} | عدد الصفقات: ${tradeCount1h})`;

  // 3. ========================================================
  // حالة العملة والمسار السوقي (Coin Status & Market Regime)
  // ========================================================
  const startClose = parseFloat(h1RawKlines[Math.max(0, h1RawKlines.length - 4)][4]) || currentClose;
  const coin4hChangePct = Number((((currentClose - startClose) / startClose) * 100).toFixed(2));
  const rsScore = Math.min(100, Math.max(-100, Math.round((coin4hChangePct - btc1hChangePct) * 12)));

  let rsVsBtc: "STRONG_LEADER" | "PARALLEL_WITH_BTC" | "LAGGING_WEAK" = "PARALLEL_WITH_BTC";
  if (rsScore >= 25) rsVsBtc = "STRONG_LEADER";
  else if (rsScore <= -25) rsVsBtc = "LAGGING_WEAK";

  // Volatility & Bollinger Band Width
  const bbWidthPercent = bbMiddle > 0 ? Number((((bbUpper - bbLower) / bbMiddle) * 100).toFixed(2)) : 4.0;
  const isSqueeze = bbWidthPercent <= 3.5;

  let regime: "INSTITUTIONAL_ACCUMULATION" | "MOMENTUM_EXPANSION" | "COILED_COMPRESSION" | "DISTRIBUTION_RISK" | "RANGING_STAGNANT" = "MOMENTUM_EXPANSION";
  let regimeArabic = "انطلاق وزخم اتجاهي حقيقي";

  if (isSqueeze) {
    regime = "COILED_COMPRESSION";
    regimeArabic = "انضغاط متفجر وشيك (Coiled Compression)";
  } else if (proposedDir === "LONG" && buyPressurePct >= 55 && (whaleDominance === "WHALE_ACCUMULATING" || tradeSizeRatio >= 1.3)) {
    regime = "INSTITUTIONAL_ACCUMULATION";
    regimeArabic = "تجميع مؤسساتي ذكي (Whale Accumulation)";
  } else if (proposedDir === "SHORT" && buyPressurePct <= 42 && whaleDominance === "WHALE_DISTRIBUTING") {
    regime = "DISTRIBUTION_RISK";
    regimeArabic = "تصريف مؤسساتي (Distribution Risk)";
  } else if (Math.abs(coin4hChangePct) < 0.6 && !largeDealsDetected) {
    regime = "RANGING_STAGNANT";
    regimeArabic = "حركة عرضية راكدة";
  }

  const vitality: "HYPER_ACTIVE" | "STABLE_GROWTH" | "DORMANT_REJECT" = 
    turnover1hUsd < 80_000 ? "DORMANT_REJECT" : (turnover1hUsd >= 1_500_000 ? "HYPER_ACTIVE" : "STABLE_GROWTH");

  const coinStatusSummary = `حالة العملة: ${regimeArabic} | القوة أمام BTC: ${rsVsBtc === "STRONG_LEADER" ? "قائدة قوية للسوق (+RS)" : rsVsBtc === "LAGGING_WEAK" ? "ضعيفة متخلفة (-RS)" : "متوازنة مع BTC"}`;

  // 4. ========================================================
  // التحرك والتذبذب الحقيقي (Movement & Volatility Dynamics)
  // ========================================================
  const atrPercent = currentClose > 0 ? Number(((currentAtr / currentClose) * 100).toFixed(2)) : 2.0;
  const lastOpen = parseFloat(lastK[1]) || currentClose;
  const priceVelocityPerHourPct = Number((((currentClose - lastOpen) / (lastOpen || 1)) * 100).toFixed(2));

  let volatilityState: "COILED_EXPLOSION_IMMINENT" | "HIGH_VELOCITY_EXPANSION" | "STABLE_PREDICTABLE" | "EXHAUSTED_VOLATILITY" = "STABLE_PREDICTABLE";
  let volatilityStateArabic = "تذبذب صحي ومستقر";

  if (isSqueeze) {
    volatilityState = "COILED_EXPLOSION_IMMINENT";
    volatilityStateArabic = "طاقة تذبذب كامنة - انفجار وشيك";
  } else if (atrPercent >= 2.5 && Math.abs(priceVelocityPerHourPct) >= 1.0) {
    volatilityState = "HIGH_VELOCITY_EXPANSION";
    volatilityStateArabic = "توسع حركي سريع عالي الزخم";
  } else if (atrPercent > 7.5) {
    volatilityState = "EXHAUSTED_VOLATILITY";
    volatilityStateArabic = "تذبذب متضخم وعشوائي مجهد";
  }

  // Directional movement efficiency (clean candles vs jagged wicks)
  const range = (parseFloat(lastK[2]) - parseFloat(lastK[3])) || 0.0001;
  const body = Math.abs(currentClose - lastOpen);
  const movementEfficiencyScore = Math.min(100, Math.round((body / range) * 70 + (Math.abs(priceVelocityPerHourPct) >= 0.5 ? 30 : 15)));

  const expectedMoveTimeframe = atrPercent >= 3.0 ? "سريعة وخاطفة (1 - 4 ساعات)" : "انسيابية مدروسة (4 - 12 ساعة)";
  const dynamicsSummary = `${volatilityStateArabic} (ATR%: ${atrPercent}% | سرعة السعر: ${priceVelocityPerHourPct > 0 ? "+" : ""}${priceVelocityPerHourPct}%/ساعة | كفاءة الحركة: ${movementEfficiencyScore}%)`;

  // 5. ========================================================
  // الحصيلة الإجمالية وفلتر الاعتماد المتكامل (Multi-Dimensional Gatekeeper)
  // ========================================================
  let multiDimensionalScore = 75;
  if (liquidityQuality === "DEEP_INSTITUTIONAL") multiDimensionalScore += 10;
  if (whaleDominance === "WHALE_ACCUMULATING" && proposedDir === "LONG") multiDimensionalScore += 10;
  if (whaleDominance === "WHALE_DISTRIBUTING" && proposedDir === "SHORT") multiDimensionalScore += 10;
  if (rsVsBtc === "STRONG_LEADER" && proposedDir === "LONG") multiDimensionalScore += 5;
  if (volatilityState === "COILED_EXPLOSION_IMMINENT" || volatilityState === "HIGH_VELOCITY_EXPANSION") multiDimensionalScore += 5;
  multiDimensionalScore = Math.min(99, Math.max(45, multiDimensionalScore));

  const multiDimensionalVerdictArabic = `مصفوفة شاملة معتمدة: سيولة ${liquidityQuality === "DEEP_INSTITUTIONAL" ? "عميقة" : "نشطة"} + تدفق صفقات ${whaleDominance === "WHALE_ACCUMULATING" ? "تجميع حيتان" : "شراء ماركت سائد"} + حالة عملة في ${regimeArabic} + تذبذب ${volatilityStateArabic}.`;

  const matrix: ComprehensiveMarketMatrix = {
    liquidity: {
      turnover1hUsd: Math.round(turnover1hUsd),
      takerBuyQuoteUsd: Math.round(takerBuyQuoteUsd),
      takerSellQuoteUsd: Math.round(takerSellQuoteUsd),
      orderFlowDeltaUsd: Math.round(orderFlowDeltaUsd),
      buyPressurePct,
      bidAskWallRatio,
      orderBookImbalance,
      liquidityQuality,
      slippageRisk,
      summaryArabic: liquiditySummary
    },
    trades: {
      tradeCount1h,
      avgTradeSizeUsd,
      whaleActivityScore,
      whaleDominance,
      largeDealsDetected,
      dealFlowPace,
      summaryArabic: tradesSummary
    },
    coinStatus: {
      regime,
      regimeArabic,
      rsVsBtc,
      rsScore,
      vitality,
      turnover24hUsd: Math.round(turnover1hUsd * 22),
      summaryArabic: coinStatusSummary
    },
    dynamics: {
      atrPercent,
      bbWidthPercent,
      volatilityState,
      volatilityStateArabic,
      priceVelocityPerHourPct,
      movementEfficiencyScore,
      expectedMoveTimeframe,
      summaryArabic: dynamicsSummary
    },
    multiDimensionalScore,
    multiDimensionalVerdictArabic
  };

  // 🔸 Institutional Quality Gatekeeper Rules (استبعاد أي صفقة تفشل في اختبارات السيولة والصفقات والتذبذب)
  // Check 1: Thin liquidity rejection (Minimum $120k/h turnover to ensure actively moving pairs)
  if (turnover1hUsd < 120_000) {
    return {
      matrix,
      isMatrixApproved: false,
      matrixScore: 40,
      rejectionReason: `سيولة غير كافية ($${Math.round(turnover1hUsd/1000)}k/ساعة) - عملة خاملة وغير نشطة، تم الاستبعاد لحماية رأس المال من التجمد`
    };
  }

  // Check 2: Aggressive Order Flow Delta Contradiction
  if (proposedDir === "LONG" && buyPressurePct < 48) {
    return {
      matrix,
      isMatrixApproved: false,
      matrixScore: 45,
      rejectionReason: `تدفق الصفقات الماركت يميل للبيع (${100 - buyPressurePct}% ضغط بيع) - حماية رأس المال تمنع الشراء ضد تدفق البيع الماركت`
    };
  }
  if (proposedDir === "SHORT" && buyPressurePct > 52) {
    return {
      matrix,
      isMatrixApproved: false,
      matrixScore: 45,
      rejectionReason: `تدفق الصفقات الماركت يميل للشراء (${buyPressurePct}% ضغط شراء) - حماية رأس المال تمنع البيع ضد تدفق الشراء الماركت`
    };
  }

  // Check 3: Stagnant Dead Coin (Flat ATR and low velocity - عملات لا تتحرك)
  if (atrPercent < 0.60 && Math.abs(priceVelocityPerHourPct) < 0.15) {
    return {
      matrix,
      isMatrixApproved: false,
      matrixScore: 48,
      rejectionReason: `عملة راكدة وتذبذبها ميت (ATR: ${atrPercent}% وسرعة السعر ${priceVelocityPerHourPct}%/س) - لا توجد حركة تستحق دخول الصفقة`
    };
  }

  // Check 4: Chaotic Exhausted Volatility
  if (volatilityState === "EXHAUSTED_VOLATILITY") {
    return {
      matrix,
      isMatrixApproved: false,
      matrixScore: 52,
      rejectionReason: `تذبذب متضخم وعشوائي مجهد (ATR: ${atrPercent}%) - ذيول شموع تصادمية وخطر ضرب الوقف عشوائياً`
    };
  }

  // Passed all multi-dimensional tests!
  return {
    matrix,
    isMatrixApproved: true,
    matrixScore: multiDimensionalScore
  };
}

function generateDefaultMatrix(currentClose: number, currentAtr: number): ComprehensiveMarketMatrix {
  return {
    liquidity: {
      turnover1hUsd: 1_200_000,
      takerBuyQuoteUsd: 700_000,
      takerSellQuoteUsd: 500_000,
      orderFlowDeltaUsd: 200_000,
      buyPressurePct: 58,
      liquidityQuality: "HEALTHY_LIQUID",
      slippageRisk: "LOW",
      summaryArabic: "سيولة صحية نشطة وتدفق صفقات ماركت متوازن"
    },
    trades: {
      tradeCount1h: 1500,
      avgTradeSizeUsd: 800,
      whaleActivityScore: 65,
      whaleDominance: "BALANCED_MIX",
      largeDealsDetected: false,
      dealFlowPace: "STEADY_ACCUMULATION",
      summaryArabic: "تدفق صفقات منتظم ومشاركة متوازنة"
    },
    coinStatus: {
      regime: "MOMENTUM_EXPANSION",
      regimeArabic: "انطلاق وزخم اتجاهي",
      rsVsBtc: "PARALLEL_WITH_BTC",
      rsScore: 10,
      vitality: "STABLE_GROWTH",
      summaryArabic: "حالة العملة نشطة ومتوافقة مع اتجاه السوق"
    },
    dynamics: {
      atrPercent: Number(((currentAtr / (currentClose || 1)) * 100).toFixed(2)),
      bbWidthPercent: 4.5,
      volatilityState: "STABLE_PREDICTABLE",
      volatilityStateArabic: "تذبذب صحي ومستقر",
      priceVelocityPerHourPct: 0.8,
      movementEfficiencyScore: 75,
      expectedMoveTimeframe: "انسيابية (4 - 12 ساعة)",
      summaryArabic: "تذبذب منتظم مدروس"
    },
    multiDimensionalScore: 80,
    multiDimensionalVerdictArabic: "مصفوفة متكاملة مقبولة ومستوفية للشروط"
  };
}
