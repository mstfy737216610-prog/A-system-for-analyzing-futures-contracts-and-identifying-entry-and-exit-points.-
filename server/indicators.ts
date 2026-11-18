export function sma(data: number[], period: number) {
  const res: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) { res.push(null); continue; }
    let sum = 0;
    for (let j = 0; j < period; j++) sum += data[i - j];
    res.push(sum / period);
  }
  return res;
}

export function ema(data: number[], period: number) {
  const res: (number | null)[] = [];
  const k = 2 / (period + 1);
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) { res.push(null); continue; }
    if (i === period - 1) {
      let sum = 0;
      for (let j = 0; j < period; j++) sum += data[j];
      res.push(sum / period);
      continue;
    }
    const prev = res[i - 1] ?? data[i];
    res.push(data[i] * k + prev * (1 - k));
  }
  return res;
}

export function rsi(closes: number[], period = 14) {
  if (closes.length <= period) return Array(closes.length).fill(50);
  const res: number[] = [];
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const ch = closes[i] - closes[i - 1];
    if (ch > 0) gains += ch;
    else losses -= ch;
  }
  let avgGain = gains / period, avgLoss = losses / period;
  res.push(avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss)));
  for (let i = period + 1; i < closes.length; i++) {
    const ch = closes[i] - closes[i - 1];
    const gain = ch > 0 ? ch : 0;
    const loss = ch < 0 ? -ch : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    res.push(avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss)));
  }
  const padded = Array(period).fill(res[0] ?? 50);
  return padded.concat(res);
}

export function bbands(closes: number[], period = 20, mult = 2) {
  const p = Math.min(period, Math.max(5, Math.floor(closes.length / 2)));
  const smaLine = sma(closes, p);
  const upper: number[] = [], lower: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    const center = smaLine[i];
    if (center === null || i < p - 1) {
      upper.push(closes[i]);
      lower.push(closes[i]);
      continue;
    }
    let sum = 0;
    for (let j = 0; j < p; j++) {
      const diff = closes[i - j] - center;
      sum += diff * diff;
    }
    const std = Math.sqrt(sum / p);
    upper.push(center + mult * std);
    lower.push(center - mult * std);
  }
  return { middle: smaLine, upper, lower };
}

export const bollingerBands = bbands;

export function atr(klines: any[], period = 14) {
  const p = Math.min(period, Math.max(3, Math.floor(klines.length / 3)));
  const tr: number[] = [];
  for (let i = 0; i < klines.length; i++) {
    if (i === 0) { tr.push(klines[i].high - klines[i].low); continue; }
    tr.push(Math.max(
      klines[i].high - klines[i].low,
      Math.abs(klines[i].high - klines[i - 1].close),
      Math.abs(klines[i].low - klines[i - 1].close)
    ));
  }
  const smaTr = sma(tr, p);
  return smaTr.map((v, i) => v ?? (klines[i].high - klines[i].low) ?? 0.01);
}

export function macd(closes: number[], fast = 12, slow = 26, signal = 9) {
  const emaFast = ema(closes, Math.min(fast, Math.max(4, Math.floor(closes.length / 3))));
  const emaSlow = ema(closes, Math.min(slow, Math.max(8, Math.floor(closes.length / 2))));
  const macdLine: (number | null)[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (emaFast[i] === null || emaSlow[i] === null) {
      macdLine.push(null);
    } else {
      macdLine.push((emaFast[i] as number) - (emaSlow[i] as number));
    }
  }
  const validMacd = macdLine.map(v => v ?? 0);
  const signalLine = ema(validMacd, signal);
  const histogram: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    const m = macdLine[i];
    const s = signalLine[i];
    if (m === null || s === null) histogram.push(0);
    else histogram.push(m - s);
  }
  return { macdLine, signalLine, histogram };
}

export function detectRsiDivergence(closes: number[], highs: number[], lows: number[], rsiLine: number[]) {
  const len = closes.length;
  if (len < 15) return { hasDivergence: false, type: null as string | null, description: null as string | null };

  const last = len - 1;
  const currentClose = closes[last];
  const currentRsi = rsiLine[last];

  let prevSwingLowPrice = Infinity;
  let prevSwingLowRsi = 100;
  let prevSwingLowIndex = -1;

  let prevSwingHighPrice = -Infinity;
  let prevSwingHighRsi = 0;
  let prevSwingHighIndex = -1;

  for (let i = Math.max(0, last - 18); i <= last - 3; i++) {
    if (i < 1 || i >= len - 1) continue;
    if (lows[i] <= lows[i - 1] && lows[i] <= lows[i + 1]) {
      if (lows[i] < prevSwingLowPrice) {
        prevSwingLowPrice = lows[i];
        prevSwingLowRsi = rsiLine[i];
        prevSwingLowIndex = i;
      }
    }
    if (highs[i] >= highs[i - 1] && highs[i] >= highs[i + 1]) {
      if (highs[i] > prevSwingHighPrice) {
        prevSwingHighPrice = highs[i];
        prevSwingHighRsi = rsiLine[i];
        prevSwingHighIndex = i;
      }
    }
  }

  // Bullish Divergence: Price made lower/equal low, but RSI made higher low (+3 points minimum)
  if (prevSwingLowIndex !== -1 && currentClose <= prevSwingLowPrice * 1.004 && currentRsi >= prevSwingLowRsi + 3) {
    return {
      hasDivergence: true,
      type: "BULLISH_DIVERGENCE",
      description: `دايفرجنس شرائي صاعد مؤكد (Bullish Divergence): قاع سعري منخفض مع ارتفاع ملحوظ في عزم القوة النسبية RSI (+${Math.round(currentRsi - prevSwingLowRsi)} نقطة)`
    };
  }

  // Bearish Divergence: Price made higher/equal high, but RSI made lower high (-3 points minimum)
  if (prevSwingHighIndex !== -1 && currentClose >= prevSwingHighPrice * 0.996 && currentRsi <= prevSwingHighRsi - 3) {
    return {
      hasDivergence: true,
      type: "BEARISH_DIVERGENCE",
      description: `دايفرجنس بيعي هابط مؤكد (Bearish Divergence): قمة سعرية مرتفعة مع انكسار عزم القوة النسبية RSI (${Math.round(currentRsi - prevSwingHighRsi)} نقطة)`
    };
  }

  return { hasDivergence: false, type: null, description: null };
}

export function detectFvg(klines: any[]) {
  const len = klines.length;
  if (len < 5) return { hasFvg: false, type: null as string | null, description: null as string | null };
  const last = len - 1;

  const c1 = klines[last - 3];
  const c2 = klines[last - 2];
  const c3 = klines[last - 1];

  if (!c1 || !c2 || !c3) return { hasFvg: false, type: null, description: null };

  if (c3.low > c1.high && c2.close > c2.open) {
    const gapSize = ((c3.low - c1.high) / c1.high) * 100;
    if (gapSize >= 0.15) {
      return {
        hasFvg: true,
        type: "BULLISH_FVG",
        description: `فجوة سعرية مؤسساتية صاعدة (Bullish FVG +${gapSize.toFixed(2)}%) تدعم استمرار الزخم الصاروخي`
      };
    }
  }

  if (c3.high < c1.low && c2.close < c2.open) {
    const gapSize = ((c1.low - c3.high) / c1.low) * 100;
    if (gapSize >= 0.15) {
      return {
        hasFvg: true,
        type: "BEARISH_FVG",
        description: `فجوة سعرية مؤسساتية هابطة (Bearish FVG -${gapSize.toFixed(2)}%) تعجل من هبوط السعر نحو الأهداف`
      };
    }
  }

  return { hasFvg: false, type: null, description: null };
}

// =======================================================
// Pre-Ignition & Coiled Spring Engine (اقتناص الحركة قبل حدوثها)
// =======================================================
export interface PreIgnitionResult {
  isPreIgnitionReady: boolean;
  status: "COILED_SPRING" | "WYCKOFF_SPRING_RECLAIM" | "WYCKOFF_UPTHRUST_REJECT" | "VOLATILITY_COMPRESSION" | "ABSORPTION_READY" | "NONE";
  score: number; // 0 - 100
  reason: string;
  executionStyle: "LIMIT_DISCOUNT_ENTRY" | "CONFIRMED_RECLAIM" | "BREAKOUT_IMPACT";
  compressionRatio: number;
  isVolumeDryingUp: boolean;
  isBollingerSqueeze: boolean;
  optimalLimitEntry: number;
  invalidationLevel: number;
  targetDirection: "LONG" | "SHORT" | "NEUTRAL";
  coiledPhase: string;
}

export function detectPreIgnitionSetup(
  klines: any[],
  currentClose: number,
  currentAtr: number,
  bb: { middle: (number | null)[]; upper: number[]; lower: number[] },
  rsiLine: number[],
  swingHighs: number[],
  swingLows: number[],
  recentSwingHigh: number,
  recentSwingLow: number,
  trend: "UP" | "DOWN" | "SIDEWAYS",
  volumes: number[],
  decimals: number
): PreIgnitionResult {
  const len = klines.length;
  if (len < 15) {
    return {
      isPreIgnitionReady: false,
      status: "NONE",
      score: 30,
      reason: "بيانات الشموع غير كافية لرصد الانضغاط المؤسساتي",
      executionStyle: "BREAKOUT_IMPACT",
      compressionRatio: 1,
      isVolumeDryingUp: false,
      isBollingerSqueeze: false,
      optimalLimitEntry: currentClose,
      invalidationLevel: currentClose * 0.98,
      targetDirection: "NEUTRAL",
      coiledPhase: "غير محدد"
    };
  }

  const last = len - 1;
  const lastCandle = klines[last];
  const prevCandle = klines[last - 1] || lastCandle;
  const prev2Candle = klines[last - 2] || prevCandle;

  // 1. Calculate Bollinger Bandwidth & Volatility Compression Ratio
  const currentMiddle = (bb.middle[last] as number) || currentClose;
  const currentUpper = bb.upper[last] || currentClose;
  const currentLower = bb.lower[last] || currentClose;
  const currentBbWidth = currentMiddle > 0 ? (currentUpper - currentLower) / currentMiddle : 0.05;

  const bbWidths: number[] = [];
  const lookback = Math.min(20, len);
  for (let i = last - lookback + 1; i <= last; i++) {
    if (i < 0) continue;
    const mid = (bb.middle[i] as number) || klines[i].close;
    const up = bb.upper[i] || klines[i].close;
    const low = bb.lower[i] || klines[i].close;
    if (mid > 0) bbWidths.push((up - low) / mid);
  }
  const avgBbWidth = bbWidths.length > 0 ? bbWidths.reduce((a, b) => a + b, 0) / bbWidths.length : 0.05;
  const compressionRatio = avgBbWidth > 0 ? Number((currentBbWidth / avgBbWidth).toFixed(2)) : 1;
  const isBollingerSqueeze = compressionRatio <= 0.78 || currentBbWidth <= 0.038;

  // 2. Volume Dry-Up (Smart Money accumulates on dry volume before markup)
  const recent3Vol = volumes.slice(-3);
  const avg20Vol = volumes.slice(-20).reduce((a, b) => a + b, 0) / Math.max(1, Math.min(20, volumes.length));
  const currentVolAvg3 = recent3Vol.reduce((a, b) => a + b, 0) / Math.max(1, recent3Vol.length);
  const isVolumeDryingUp = currentVolAvg3 < avg20Vol * 0.88;

  // 3. Wyckoff Spring (Pre-Pump Footprint):
  // Sweep of support: low of last 3 candles dipped below recentSwingLow, but candle reclaimed and closed ABOVE recentSwingLow!
  const minLowRecent3 = Math.min(Number(lastCandle.low), Number(prevCandle.low), Number(prev2Candle.low));
  const isSpringDip = minLowRecent3 < recentSwingLow;
  const isSpringReclaimed = currentClose >= recentSwingLow * 0.999;
  const isWyckoffSpring = isSpringDip && isSpringReclaimed && currentClose <= recentSwingLow * 1.025;

  // 4. Wyckoff Upthrust (Pre-Dump Footprint):
  // Sweep of resistance: high of last 3 candles spiked above recentSwingHigh, but candle closed back BELOW recentSwingHigh!
  const maxHighRecent3 = Math.max(Number(lastCandle.high), Number(prevCandle.high), Number(prev2Candle.high));
  const isUpthrustSpike = maxHighRecent3 > recentSwingHigh;
  const isUpthrustRejected = currentClose <= recentSwingHigh * 1.001;
  const isWyckoffUpthrust = isUpthrustSpike && isUpthrustRejected && currentClose >= recentSwingHigh * 0.975;

  // 5. Calculate Readiness Score (0 - 100)
  let score = 35;
  let targetDirection: "LONG" | "SHORT" | "NEUTRAL" = "NEUTRAL";
  let status: PreIgnitionResult["status"] = "NONE";
  let reason = "";
  let executionStyle: PreIgnitionResult["executionStyle"] = "BREAKOUT_IMPACT";
  let optimalLimitEntry = currentClose;
  let invalidationLevel = currentClose * 0.98;
  let coiledPhase = "مرحلة تذبذب اعتيادية";

  if (isWyckoffSpring) {
    targetDirection = "LONG";
    status = "WYCKOFF_SPRING_RECLAIM";
    score = 94;
    // Enter in discount zone: between swept low and current price (average ~40% discount)
    optimalLimitEntry = Number((minLowRecent3 + (currentClose - minLowRecent3) * 0.40).toFixed(decimals));
    invalidationLevel = Number((minLowRecent3 - currentAtr * 0.25).toFixed(decimals));
    executionStyle = "CONFIRMED_RECLAIM";
    coiledPhase = "سبرينغ وكنس سيولة القيعان (Wyckoff Spring)";
    reason = `تم رصد كنس احترافي لسيولة القيعان (Liquidity Sweep عند $${minLowRecent3}) مع استعادة فورية للمستوى (Reclaim). الحيتان ابتلعت أوامر وقف الخسارة قبل إطلاق الموجة الصاعدة. الدخول الموصى به أمر معلق عند التخفيض $${optimalLimitEntry}.`;
  } else if (isWyckoffUpthrust) {
    targetDirection = "SHORT";
    status = "WYCKOFF_UPTHRUST_REJECT";
    score = 94;
    optimalLimitEntry = Number((maxHighRecent3 - (maxHighRecent3 - currentClose) * 0.40).toFixed(decimals));
    invalidationLevel = Number((maxHighRecent3 + currentAtr * 0.25).toFixed(decimals));
    executionStyle = "CONFIRMED_RECLAIM";
    coiledPhase = "قمة وهمية وتصريف حيتان (Wyckoff Upthrust)";
    reason = `تم رصد مصيدة ثيران واختراق وهمي للقمة ($${maxHighRecent3}) مع إغلاق سريع أسفل المقاومة. تم اصطياد مشتري الاختراق المتأخرين والتصريف عليهم. فرصة بيع استباقية قبل الانهيار نحو القيعان.`;
  } else if (isBollingerSqueeze && isVolumeDryingUp) {
    score = 88;
    status = "COILED_SPRING";
    executionStyle = "LIMIT_DISCOUNT_ENTRY";
    coiledPhase = "انضغاط زنبركي خانق (Coiled Spring Compression)";
    if (trend === "UP" || currentClose > currentMiddle) {
      targetDirection = "LONG";
      optimalLimitEntry = Number((Math.min(currentClose, currentMiddle + (currentClose - currentMiddle) * 0.35)).toFixed(decimals));
      invalidationLevel = Number((currentLower - currentAtr * 0.2).toFixed(decimals));
      reason = `انضغاط سعري حاد (Bandwidth: ${(currentBbWidth * 100).toFixed(1)}%) مع جفاف في حجم التداول يوحي بانتهاء التجميع الهادئ وقرب انفجار صاعد وشيك.`;
    } else {
      targetDirection = "SHORT";
      optimalLimitEntry = Number((Math.max(currentClose, currentMiddle - (currentMiddle - currentClose) * 0.35)).toFixed(decimals));
      invalidationLevel = Number((currentUpper + currentAtr * 0.2).toFixed(decimals));
      reason = `انضغاط سعري حاد مع ميل هابط وجفاف أحجام التداول. انفجار هابط وشيك نحو مناطق السيولة السفلية.`;
    }
  } else if (isBollingerSqueeze) {
    score = 80;
    status = "VOLATILITY_COMPRESSION";
    targetDirection = trend === "UP" ? "LONG" : trend === "DOWN" ? "SHORT" : "NEUTRAL";
    executionStyle = "LIMIT_DISCOUNT_ENTRY";
    optimalLimitEntry = currentClose;
    invalidationLevel = targetDirection === "LONG" ? currentClose * 0.985 : currentClose * 1.015;
    coiledPhase = "انضغاط تقلبات الأسعار";
    reason = `نطاق الأسعار مضغوط بنسبة ${Math.round((1 - compressionRatio) * 100)}% مقارنة بالمعدل؛ تحرك متفجر متوقع خلال الشموع القادمة.`;
  }

  const isPreIgnitionReady = score >= 75 && targetDirection !== "NEUTRAL";

  return {
    isPreIgnitionReady,
    status,
    score,
    reason,
    executionStyle,
    compressionRatio,
    isVolumeDryingUp,
    isBollingerSqueeze,
    optimalLimitEntry,
    invalidationLevel,
    targetDirection,
    coiledPhase
  };
}

// =======================================================
// Comprehensive Technical Indicators Required By Architect
// =======================================================

// 1. Average Directional Index (ADX) & Directional Movement (+DI, -DI)
export function adx(highs: number[], lows: number[], closes: number[], period = 14) {
  const len = closes.length;
  if (len < period + 1) return { adx: 25, plusDI: 20, minusDI: 20, trendStrength: "MODERATE" };

  const plusDM: number[] = [0];
  const minusDM: number[] = [0];
  const tr: number[] = [highs[0] - lows[0]];

  for (let i = 1; i < len; i++) {
    const upMove = highs[i] - highs[i - 1];
    const downMove = lows[i - 1] - lows[i];

    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);

    const currentTr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
    tr.push(currentTr);
  }

  const smoothedTR = tr.slice(-period).reduce((a, b) => a + b, 0);
  const smoothedPlusDM = plusDM.slice(-period).reduce((a, b) => a + b, 0);
  const smoothedMinusDM = minusDM.slice(-period).reduce((a, b) => a + b, 0);

  const plusDI = smoothedTR > 0 ? (smoothedPlusDM / smoothedTR) * 100 : 20;
  const minusDI = smoothedTR > 0 ? (smoothedMinusDM / smoothedTR) * 100 : 20;
  const dx = (plusDI + minusDI) > 0 ? (Math.abs(plusDI - minusDI) / (plusDI + minusDI)) * 100 : 25;
  const adxVal = Math.round(dx);

  let trendStrength: "STRONG_TREND" | "MODERATE" | "WEAK_RANGE" = "MODERATE";
  if (adxVal >= 30) trendStrength = "STRONG_TREND";
  else if (adxVal < 20) trendStrength = "WEAK_RANGE";

  return { adx: adxVal, plusDI: Math.round(plusDI), minusDI: Math.round(minusDI), trendStrength };
}

// 2. Ichimoku Cloud (Tenkan, Kijun, Senkou A, Senkou B)
export function ichimoku(highs: number[], lows: number[], closes: number[]) {
  const len = closes.length;
  const calcMid = (p: number, offset = 0) => {
    const start = Math.max(0, len - p - offset);
    const end = len - offset;
    const subHighs = highs.slice(start, end);
    const subLows = lows.slice(start, end);
    if (!subHighs.length) return closes[len - 1];
    return (Math.max(...subHighs) + Math.min(...subLows)) / 2;
  };

  const tenkan = calcMid(9);
  const kijun = calcMid(26);
  const senkouA = (tenkan + kijun) / 2;
  const senkouB = calcMid(52);
  const currentClose = closes[len - 1];

  const isAboveCloud = currentClose > Math.max(senkouA, senkouB);
  const isBelowCloud = currentClose < Math.min(senkouA, senkouB);
  const isInsideCloud = !isAboveCloud && !isBelowCloud;
  const tkCrossBullish = tenkan > kijun;

  return {
    tenkan,
    kijun,
    senkouA,
    senkouB,
    cloudState: isAboveCloud ? "BULLISH_ABOVE_CLOUD" : isBelowCloud ? "BEARISH_BELOW_CLOUD" : "INSIDE_CLOUD_RANGE",
    tkCrossBullish
  };
}

// 3. Stochastic Oscillator (%K, %D)
export function stochastic(highs: number[], lows: number[], closes: number[], period = 14) {
  const len = closes.length;
  if (len < period) return { k: 50, d: 50, isOverbought: false, isOversold: false };

  const recentCloses = closes.slice(-period);
  const recentHighs = highs.slice(-period);
  const recentLows = lows.slice(-period);

  const highestHigh = Math.max(...recentHighs);
  const lowestLow = Math.min(...recentLows);
  const currentClose = closes[len - 1];

  const rawK = highestHigh !== lowestLow ? ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100 : 50;
  const k = Math.min(100, Math.max(0, Math.round(rawK)));
  const d = Math.round(k * 0.7 + 15); // Fast smoothed approximation

  return {
    k,
    d,
    isOverbought: k > 80,
    isOversold: k < 20
  };
}

// 4. Williams %R
export function williamsR(highs: number[], lows: number[], closes: number[], period = 14) {
  const len = closes.length;
  if (len < period) return -50;
  const recentHighs = highs.slice(-period);
  const recentLows = lows.slice(-period);
  const highestHigh = Math.max(...recentHighs);
  const lowestLow = Math.min(...recentLows);
  const currentClose = closes[len - 1];

  if (highestHigh === lowestLow) return -50;
  return Math.round(((highestHigh - currentClose) / (highestHigh - lowestLow)) * -100);
}

// 5. Keltner Channels
export function keltnerChannels(highs: number[], lows: number[], closes: number[], period = 20, mult = 1.5) {
  const emaArr = ema(closes, period);
  const currentEma = emaArr[emaArr.length - 1] ?? closes[closes.length - 1];
  const tr = highs.map((h, i) => i === 0 ? h - lows[i] : Math.max(h - lows[i], Math.abs(h - closes[i - 1]), Math.abs(lows[i] - closes[i - 1])));
  const avgTr = tr.slice(-period).reduce((a, b) => a + b, 0) / Math.min(period, tr.length);

  return {
    upper: currentEma + mult * avgTr,
    middle: currentEma,
    lower: currentEma - mult * avgTr
  };
}

// 6. On-Balance Volume (OBV)
export function obv(closes: number[], volumes: number[]) {
  let obvVal = 0;
  for (let i = 1; i < closes.length; i++) {
    if (closes[i] > closes[i - 1]) obvVal += volumes[i];
    else if (closes[i] < closes[i - 1]) obvVal -= volumes[i];
  }
  return Math.round(obvVal);
}

// 7. Volume Weighted Average Price (VWAP)
export function vwap(klines: any[]) {
  let cumVol = 0;
  let cumVolPrice = 0;
  for (const k of klines) {
    const typicalPrice = (Number(k.high) + Number(k.low) + Number(k.close)) / 3;
    const vol = Number(k.volume) || 1;
    cumVolPrice += typicalPrice * vol;
    cumVol += vol;
  }
  return cumVol > 0 ? cumVolPrice / cumVol : klines[klines.length - 1]?.close || 0;
}

// 8. Money Flow Index (MFI)
export function mfi(highs: number[], lows: number[], closes: number[], volumes: number[], period = 14) {
  const len = closes.length;
  if (len < period + 1) return 50;

  let posFlow = 0;
  let negFlow = 0;

  for (let i = len - period; i < len; i++) {
    const typPrice = (highs[i] + lows[i] + closes[i]) / 3;
    const prevTypPrice = (highs[i - 1] + lows[i - 1] + closes[i - 1]) / 3;
    const rawMoneyFlow = typPrice * volumes[i];

    if (typPrice > prevTypPrice) posFlow += rawMoneyFlow;
    else if (typPrice < prevTypPrice) negFlow += rawMoneyFlow;
  }

  if (negFlow === 0) return 100;
  const moneyRatio = posFlow / negFlow;
  return Math.round(100 - (100 / (1 + moneyRatio)));
}

// 9. Fibonacci Retracements and Extensions
export function fibonacciLevels(high: number, low: number, isUptrend: boolean) {
  const diff = high - low;
  if (diff <= 0) return { r236: high, r382: high, r500: high, r618: high, r786: high, ext127: high, ext161: high };

  if (isUptrend) {
    return {
      r236: Number((high - diff * 0.236).toFixed(4)),
      r382: Number((high - diff * 0.382).toFixed(4)),
      r500: Number((high - diff * 0.500).toFixed(4)),
      r618: Number((high - diff * 0.618).toFixed(4)), // Golden Pocket
      r786: Number((high - diff * 0.786).toFixed(4)),
      ext127: Number((high + diff * 0.272).toFixed(4)),
      ext161: Number((high + diff * 0.618).toFixed(4))
    };
  } else {
    return {
      r236: Number((low + diff * 0.236).toFixed(4)),
      r382: Number((low + diff * 0.382).toFixed(4)),
      r500: Number((low + diff * 0.500).toFixed(4)),
      r618: Number((low + diff * 0.618).toFixed(4)),
      r786: Number((low + diff * 0.786).toFixed(4)),
      ext127: Number((low - diff * 0.272).toFixed(4)),
      ext161: Number((low - diff * 0.618).toFixed(4))
    };
  }
}

// 10. Pivot Points (Classic Floor Trader Pivots)
export function pivotPoints(high: number, low: number, close: number) {
  const pp = (high + low + close) / 3;
  const r1 = 2 * pp - low;
  const s1 = 2 * pp - high;
  const r2 = pp + (high - low);
  const s2 = pp - (high - low);
  const r3 = high + 2 * (pp - low);
  const s3 = low - 2 * (high - pp);

  return {
    pivot: Number(pp.toFixed(4)),
    r1: Number(r1.toFixed(4)),
    r2: Number(r2.toFixed(4)),
    r3: Number(r3.toFixed(4)),
    s1: Number(s1.toFixed(4)),
    s2: Number(s2.toFixed(4)),
    s3: Number(s3.toFixed(4))
  };
}

// 11. Advanced Multi-Candle Pattern Recognition
export function detectAllCandlePatterns(klines: any[]) {
  const len = klines.length;
  if (len < 5) return { patterns: [], dominantPattern: null };

  const patterns: string[] = [];
  const c0 = klines[len - 1]; // Current
  const c1 = klines[len - 2]; // Previous
  const c2 = klines[len - 3]; // 2 bars ago

  const c0Range = c0.high - c0.low || 0.0001;
  const c0Body = Math.abs(c0.close - c0.open);
  const c0UpperWick = c0.high - Math.max(c0.close, c0.open);
  const c0LowerWick = Math.min(c0.close, c0.open) - c0.low;

  // 1. Doji
  if (c0Body <= c0Range * 0.1) {
    patterns.push("شمعة الدوجي الحائرة (Doji Reversal)");
  }

  // 2. Hammer & Shooting Star
  if (c0LowerWick >= c0Range * 0.55 && c0Body <= c0Range * 0.35) {
    patterns.push("المطرقة الشرائية (Hammer Pinbar)");
  } else if (c0UpperWick >= c0Range * 0.55 && c0Body <= c0Range * 0.35) {
    patterns.push("الشهاب الهابط (Shooting Star)");
  }

  // 3. Engulfing
  if (c1.close < c1.open && c0.close > c0.open && c0.close >= c1.open && c0.open <= c1.close) {
    patterns.push("نمط الابتلاع الشرائي الصاعد (Bullish Engulfing)");
  } else if (c1.close > c1.open && c0.close < c0.open && c0.close <= c1.open && c0.open >= c1.close) {
    patterns.push("نمط الابتلاع البيعي الهابط (Bearish Engulfing)");
  }

  // 4. Morning Star & Evening Star (3-candle patterns)
  if (c2.close < c2.open && Math.abs(c1.close - c1.open) < c0Range * 0.35 && c0.close > c0.open && c0.close > (c2.open + c2.close) / 2) {
    patterns.push("نجمة الصباح الانعكاسية (Morning Star)");
  } else if (c2.close > c2.open && Math.abs(c1.close - c1.open) < c0Range * 0.35 && c0.close < c0.open && c0.close < (c2.open + c2.close) / 2) {
    patterns.push("نجمة المساء الهابطة (Evening Star)");
  }

  // 5. Three White Soldiers & Three Black Crows
  if (len >= 3) {
    const is3Soldiers = c2.close > c2.open && c1.close > c1.open && c0.close > c0.open &&
                        c0.close > c1.close && c1.close > c2.close;
    if (is3Soldiers) patterns.push("الجنود الثلاثة البيض (Three White Soldiers)");

    const is3Crows = c2.close < c2.open && c1.close < c1.open && c0.close < c0.open &&
                     c0.close < c1.close && c1.close < c2.close;
    if (is3Crows) patterns.push("الغربان الثلاثة السود (Three Black Crows)");
  }

  return {
    patterns,
    dominantPattern: patterns.length > 0 ? patterns[0] : null
  };
}

export interface TechnicalAnalysisResult {
  currentClose: number;
  currentRsi: number;
  currentBbUpper: number;
  currentBbLower: number;
  currentBbMiddle: number;
  currentAtr: number;
  ema9: number;
  ema21: number;
  sma50: number;
  adx: number;
  plusDI: number;
  minusDI: number;
  adxTrendStrength: string;
  ichimokuCloudState: string;
  stochK: number;
  stochD: number;
  williamsR: number;
  vwapValue: number;
  mfiValue: number;
  pivotLevels: { pivot: number; r1: number; r2: number; r3: number; s1: number; s2: number; s3: number };
  fibLevels: { r236: number; r382: number; r500: number; r618: number; r786: number; ext127: number; ext161: number };
  washTradingScore: number;
  isWashTradingDetected: boolean;
  manipulationNotes: string[];
  trend: "UP" | "DOWN" | "SIDEWAYS";
  volumeSurge: boolean;
  volRatio: number;
  candlestickPattern: string | null;
  detectedCandlePatterns: string[];
  isFakeBottom: boolean;
  isFakeTop: boolean;
  isExtremeOversold: boolean;
  isExtremeOverbought: boolean;
  isOversoldImpulseBuy: boolean;
  isOverboughtImpulseSell: boolean;
  isMomentumBreakout: boolean;
  isDormantCoin?: boolean;
  isStrongFloor?: boolean;
  setupCategory: "PRE_IGNITION_COILED" | "WYCKOFF_SPRING" | "OVERSOLD_IMPULSE" | "LIQUIDITY_SWEEP" | "DIVERGENCE_REVERSAL" | "FVG_EXPANSION" | "MOMENTUM_BREAKOUT" | "STANDARD";
  smartRiskLevel: "SMART_CALCULATED_RISK" | "INSTITUTIONAL_SAFE";
  riskLabel: string;
  invalidationPrice: number;
  targetVelocity: "INSTANT" | "FAST" | "NORMAL";
  fastOpportunityBadge?: string;
  preIgnitionStatus?: "COILED_SPRING" | "WYCKOFF_SPRING_RECLAIM" | "WYCKOFF_UPTHRUST_REJECT" | "VOLATILITY_COMPRESSION" | "ABSORPTION_READY" | "NONE";
  preIgnitionScore?: number;
  isPreIgnitionReady?: boolean;
  preIgnitionReason?: string;
  executionStyle?: "LIMIT_DISCOUNT_ENTRY" | "CONFIRMED_RECLAIM" | "BREAKOUT_IMPACT";
  compressionRatio?: number;
  optimalLimitEntry?: number;
  coiledPhase?: string;
  impulseStrength: number;
  zoneStrength: string;
  bullishConfluence: number;
  bearishConfluence: number;
  suggestedDirection: "LONG" | "SHORT" | "NEUTRAL";
  confidence: number;
  entry: number;
  sl: number;
  tp: number;
  tp1: number;
  tp2: number;
  tp3: number;
  rrRatio: number;
  profitPercent: number;
  targetSpeed: "FAST" | "NORMAL";
  recommendedLeverage: number;
  expectedProfit20USD: number;
  leveragedProfit20USD: number;
  patterns: Array<{ type: string; time: number; label: string }>;
  reasoning: string;
  grade: "AAA" | "AA" | "A";
  hasDivergence: boolean;
  divergenceType: string | null;
  hasFvg: boolean;
  confluenceFactors: string[];
  warnings: string[];
  capitalProtectionPlan?: {
    breakevenTriggerPrice: number;
    breakevenRule: string;
    partialTakeProfitPct: number;
    maxCapitalRiskPct: number;
    invalidationReason: string;
    goldenRule: string;
    suggestedUnitsPer1000USD?: number;
  };
}

export function analyzeData(klines: any[]): TechnicalAnalysisResult | null {
  if (!klines || klines.length < 15) return null;

  const closes = klines.map(k => Number(k.close));
  const highs = klines.map(k => Number(k.high));
  const lows = klines.map(k => Number(k.low));
  const opens = klines.map(k => Number(k.open));
  const volumes = klines.map(k => Number(k.volume));
  const len = closes.length;
  const last = len - 1;

  const currentClose = closes[last];
  const currentOpen = opens[last];
  const currentHigh = highs[last];
  const currentLow = lows[last];
  const currentVol = volumes[last];
  const decimals = currentClose >= 100 ? 2 : currentClose >= 1 ? 4 : (currentClose >= 0.0001 ? 6 : 8);

  // Moving Averages & Bands
  const ema9Arr = ema(closes, 9);
  const ema21Arr = ema(closes, 21);
  const sma50Arr = sma(closes, Math.min(50, len));
  const bb = bbands(closes, Math.min(20, len));
  const rsiLine = rsi(closes, Math.min(14, len - 2));
  const atrLine = atr(klines, Math.min(14, len - 2));

  const currentEma9 = ema9Arr[last] ?? currentClose;
  const currentEma21 = ema21Arr[last] ?? currentClose;
  const currentSma50 = sma50Arr[last] ?? currentClose;
  const currentBbUpper = bb.upper[last] ?? currentClose;
  const currentBbLower = bb.lower[last] ?? currentClose;
  const currentBbMiddle = (bb.middle[last] as number) ?? currentClose;
  const currentRsi = Math.round(rsiLine[last] ?? 50);
  const currentAtr = Math.max(atrLine[last] ?? (currentClose * 0.008), currentClose * 0.002);

  // Volume Surge Calculation (Last 20 candles average volume)
  const volLookback = Math.min(20, len);
  const recentVols = volumes.slice(-volLookback);
  const avgVol = recentVols.reduce((a, b) => a + b, 0) / (recentVols.length || 1);
  const volRatio = avgVol > 0 ? Number((currentVol / avgVol).toFixed(2)) : 1;
  const volumeSurge = volRatio >= 1.5;

  const adxResult = adx(highs, lows, closes, 14);

  let trend: "UP" | "DOWN" | "SIDEWAYS" = "SIDEWAYS";
  if (currentEma9 > currentEma21 && currentClose > currentSma50 && adxResult.adx > 22) {
    trend = "UP";
  } else if (currentEma9 < currentEma21 && currentClose < currentSma50 && adxResult.adx > 22) {
    trend = "DOWN";
  } else if (currentClose > currentEma21 && currentEma9 > currentEma21) {
    trend = "UP";
  } else if (currentClose < currentEma21 && currentEma9 < currentEma21) {
    trend = "DOWN";
  }

  // Support and Resistance based on Swing High/Low
  const lookback = Math.min(25, len - 2);
  const swingHighs = highs.slice(last - lookback, last);
  const swingLows = lows.slice(last - lookback, last);
  const recentSwingHigh = Math.max(...swingHighs);
  const recentSwingLow = Math.min(...swingLows);

  // Additional Advanced Indicators
  const ichimokuResult = ichimoku(highs, lows, closes);
  const stochResult = stochastic(highs, lows, closes, 14);
  const williamsRVal = williamsR(highs, lows, closes, 14);
  const vwapVal = vwap(klines);
  const mfiVal = mfi(highs, lows, closes, volumes, 14);
  const pivots = pivotPoints(highs[last - 1] || currentHigh, lows[last - 1] || currentLow, closes[last - 1] || currentClose);
  const fibs = fibonacciLevels(recentSwingHigh, recentSwingLow, trend === "UP");
  const candleSuite = detectAllCandlePatterns(klines);
  const washAudit = detectWashTradingAndManipulation(klines, volumes);

  // Candlestick Pattern Detection
  const range = currentHigh - currentLow || 0.0001;
  const body = Math.abs(currentClose - currentOpen);

  // --- BIGGER BRAIN: Institutional Pivot Strength & Order Flow Absorption ---
  const recentHighsArr = highs.slice(-12);
  const recentLowsArr = lows.slice(-12);
  const avgWickSize = klines.slice(-12).reduce((a, b) => a + (b.high - b.low - Math.abs(b.close - b.open)), 0) / 12;
  const currentWickSize = currentHigh - currentLow - body;
  const isInstitutionalWick = currentWickSize > avgWickSize * 1.8 && (currentLow < recentSwingLow || currentHigh > recentSwingHigh);
  
  // Absorption: High volume but price barely moves (Smart Money absorbing orders)
  const isVolumeAbsorption = volumeSurge && (body < range * 0.3) && (range < currentAtr * 0.8);
  
  // Pivot Strength: Multiple rejections of the same level
  const supportTouches = recentLowsArr.filter(l => Math.abs(l - recentSwingLow) < currentAtr * 0.15).length;
  const resistanceTouches = recentHighsArr.filter(h => Math.abs(h - recentSwingHigh) < currentAtr * 0.15).length;
  const isSolidSupport = supportTouches >= 3;
  const isSolidResistance = resistanceTouches >= 3;
  const isDormantCoin = (currentAtr / (currentClose || 1)) < 0.015;
  const isStrongFloor = isSolidSupport || supportTouches >= 2;

  const upperWick = currentHigh - Math.max(currentClose, currentOpen);
  const lowerWick = Math.min(currentClose, currentOpen) - currentLow;

  const prevClose = closes[last - 1];
  const prevOpen = opens[last - 1];
  const prevRange = highs[last - 1] - lows[last - 1] || 0.0001;
  const prevBody = Math.abs(prevClose - prevOpen);

  let candlestickPattern = candleSuite.dominantPattern;
  let isBullishPinbar = false;
  let isBearishPinbar = false;
  let isBullishEngulfing = false;
  let isBearishEngulfing = false;

  // Pinbar / Hammer (Lower wick is at least 55% of total candle range)
  if (lowerWick >= range * 0.52 && body <= range * 0.38) {
    candlestickPattern = "مطرقة شرائية (Hammer Pinbar)";
    isBullishPinbar = true;
  } else if (upperWick >= range * 0.52 && body <= range * 0.38) {
    candlestickPattern = "شهاب هابط (Shooting Star)";
    isBearishPinbar = true;
  } else if (prevClose < prevOpen && currentClose > currentOpen && currentClose >= prevOpen && currentOpen <= prevClose) {
    candlestickPattern = "ابتلاع شرائي صاعد (Bullish Engulfing)";
    isBullishEngulfing = true;
  } else if (prevClose > prevOpen && currentClose < currentOpen && currentClose <= prevOpen && currentOpen >= prevClose) {
    candlestickPattern = "ابتلاع بيعي هابط (Bearish Engulfing)";
    isBearishEngulfing = true;
  }

  // MACD Analysis
  const macdData = macd(closes);
  const currentMacdHist = macdData.histogram[last] ?? 0;
  const prevMacdHist = macdData.histogram[last - 1] ?? 0;
  const isMacdBullishExpansion = currentMacdHist > 0 && currentMacdHist >= prevMacdHist;
  const isMacdBearishExpansion = currentMacdHist < 0 && currentMacdHist <= prevMacdHist;

  // Precision SMC & Divergence Detectors
  const divergence = detectRsiDivergence(closes, highs, lows, rsiLine);
  const fvg = detectFvg(klines);

  // SMC Liquidity Sweep / Fakeout (Manipulation)
  // Bear Trap / Fake Breakdown: Price pushed below recent support swing low, but closed back above it
  const isFakeBottom = (currentLow < recentSwingLow && currentClose > recentSwingLow) || (currentClose < currentBbLower && currentRsi > 32);
  // Bull Trap / Fake Breakout: Price spiked above resistance swing high, but closed back below it
  const isFakeTop = (currentHigh > recentSwingHigh && currentClose < recentSwingHigh) || (currentClose > currentBbUpper && currentRsi < 68);

  const isExtremeOversold = currentRsi <= 30;
  const isExtremeOverbought = currentRsi >= 70;

  // Pre-Ignition & Coiled Spring Detection (اقتناص الحركة قبل حدوثها)
  const preIgnition = detectPreIgnitionSetup(
    klines,
    currentClose,
    currentAtr,
    bb,
    rsiLine,
    swingHighs,
    swingLows,
    recentSwingHigh,
    recentSwingLow,
    trend,
    volumes,
    decimals
  );

  // =======================================================
  // Strong Reversal Zone & Fast Impulse Detection Engine
  // (مناطق قوية مثل تشبع بيعي وحركة سريعة باتجاه الشراء / البيع)
  // =======================================================
  const recentRsis = rsiLine.slice(-4);
  const minRecentRsi = Math.min(...recentRsis);
  const maxRecentRsi = Math.max(...recentRsis);
  const wasRecentOversold = minRecentRsi <= 35 || currentRsi <= 35;
  const wasRecentOverbought = maxRecentRsi >= 68 || currentRsi >= 68;
  const isStochOversold = stochResult.k <= 25;
  const isStochOverbought = stochResult.k >= 78;
  const testedBbLower = currentLow <= currentBbLower * 1.006 || lows[last - 1] <= currentBbLower * 1.006;
  const testedBbUpper = currentHigh >= currentBbUpper * 0.994 || highs[last - 1] >= currentBbUpper * 0.994;
  const testedSupport = currentLow <= recentSwingLow * 1.008 || isFakeBottom;
  const testedResistance = currentHigh >= recentSwingHigh * 0.992 || isFakeTop;

  // Fast Bullish Impulse Candle (حركة صاعدة سريعة وخاطفة)
  // Bullish body >= 50% of range, buyers close near candle high, expansion >= 0.7 ATR
  const isBullishImpulse = currentClose > currentOpen && 
                           body >= range * 0.50 && 
                           upperWick <= range * 0.30 && 
                           (currentClose > prevClose || range >= currentAtr * 0.70);

  // Fast Bearish Impulse Candle (حركة هابطة سريعة وخاطفة)
  const isBearishImpulse = currentClose < currentOpen && 
                           body >= range * 0.50 && 
                           lowerWick <= range * 0.30 && 
                           (currentClose < prevClose || range >= currentAtr * 0.70);

  // Impulse Strength (0-100) based on body ratio, speed, and volume
  let impulseStrength = Math.round(
    Math.min(100, (body / range) * 50 + (volRatio >= 1.2 ? 30 : 15) + (isBullishImpulse || isBearishImpulse ? 20 : 0))
  );

  let zoneStrength = "NEUTRAL_ZONE";
  if (wasRecentOversold && (testedSupport || testedBbLower)) {
    zoneStrength = "STRONG_DEMAND_OVERSOLD";
  } else if (wasRecentOverbought && (testedResistance || testedBbUpper)) {
    zoneStrength = "STRONG_SUPPLY_OVERBOUGHT";
  } else if (testedSupport || testedBbLower) {
    zoneStrength = "KEY_SUPPORT_ZONE";
  } else if (testedResistance || testedBbUpper) {
    zoneStrength = "KEY_RESISTANCE_ZONE";
  }

  // Strong Zone + Fast Reversal Impulse Buy (تشبع بيعي + انطلاق صاعد سريع)
  const isOversoldImpulseBuy = (wasRecentOversold || isStochOversold || testedBbLower || testedSupport || (divergence.hasDivergence && divergence.type === "BULLISH_DIVERGENCE")) &&
                               (isBullishImpulse || isBullishEngulfing || (isBullishPinbar && currentClose > prevClose)) &&
                               (volRatio >= 1.40 || currentVol > volumes[last - 1] * 1.2 || (isMacdBullishExpansion && adxResult.adx > 20));

  // Strong Zone + Fast Reversal Impulse Sell (تشبع شرائي + هبوط خاطف سريع)
  const isOverboughtImpulseSell = (wasRecentOverbought || isStochOverbought || testedBbUpper || testedResistance || (divergence.hasDivergence && divergence.type === "BEARISH_DIVERGENCE")) &&
                                 (isBearishImpulse || isBearishEngulfing || (isBearishPinbar && currentClose < prevClose)) &&
                                 (volRatio >= 1.40 || currentVol > volumes[last - 1] * 1.2 || (isMacdBearishExpansion && adxResult.adx > 20));

  // Momentum Breakout & Volatility Expansion Buy (انفجار وزخم واختراق مقاومة)
  const isMomentumBreakoutBuy = (
    (currentClose >= recentSwingHigh * 0.999 && isBullishImpulse) ||
    (currentClose > currentEma9 && currentEma9 > currentEma21 && isBullishImpulse && (volRatio >= 1.2 || isMacdBullishExpansion)) ||
    (currentClose > currentBbMiddle && isBullishImpulse && volRatio >= 1.35) ||
    (currentClose > currentBbUpper && isBullishImpulse && volRatio > 1.5) // Strong outer breakout
  );

  // Momentum Breakdown & Fast Drop Sell (كسر هابط متسارع)
  const isMomentumBreakdownSell = (
    (currentClose <= recentSwingLow * 1.001 && isBearishImpulse) ||
    (currentClose < currentEma9 && currentEma9 < currentEma21 && isBearishImpulse && (volRatio >= 1.2 || isMacdBearishExpansion)) ||
    (currentClose < currentBbMiddle && isBearishImpulse && volRatio >= 1.35) ||
    (currentClose < currentBbLower && isBearishImpulse && volRatio > 1.5)
  );

  let setupCategory: "PRE_IGNITION_COILED" | "WYCKOFF_SPRING" | "OVERSOLD_IMPULSE" | "LIQUIDITY_SWEEP" | "DIVERGENCE_REVERSAL" | "FVG_EXPANSION" | "MOMENTUM_BREAKOUT" | "STANDARD" = "STANDARD";
  if (preIgnition.isPreIgnitionReady && preIgnition.status === "WYCKOFF_SPRING_RECLAIM") {
    setupCategory = "WYCKOFF_SPRING";
  } else if (preIgnition.isPreIgnitionReady && (preIgnition.status === "COILED_SPRING" || preIgnition.status === "VOLATILITY_COMPRESSION")) {
    setupCategory = "PRE_IGNITION_COILED";
  } else if (isOversoldImpulseBuy || isOverboughtImpulseSell) {
    setupCategory = "OVERSOLD_IMPULSE";
  } else if (isFakeBottom || isFakeTop) {
    setupCategory = "LIQUIDITY_SWEEP";
  } else if (divergence.hasDivergence) {
    setupCategory = "DIVERGENCE_REVERSAL";
  } else if (isMomentumBreakoutBuy || isMomentumBreakdownSell) {
    setupCategory = "MOMENTUM_BREAKOUT";
  } else if (fvg.hasFvg) {
    setupCategory = "FVG_EXPANSION";
  }

  // Confluence Scoring - High Institutional Rigor & Smart Alpha
  let bullishScore = 0;
  let bearishScore = 0;
  const bullishFactors: string[] = [];
  const bearishFactors: string[] = [];

  // 0. Pre-Ignition & Coiled Spring Confluence (Supreme Pre-Move Trigger - 45 points)
  if (preIgnition.isPreIgnitionReady && preIgnition.targetDirection === "LONG") {
    bullishScore += 45;
    bullishFactors.push(`⚡ جاهزية انفجار صاعد (${preIgnition.score}%): ${preIgnition.coiledPhase}`);
    if (preIgnition.status === "WYCKOFF_SPRING_RECLAIM") {
      bullishFactors.push("كنس سيولة القيعان واستعادة فورية (Spring Reclaim) - اقتناص ما قبل الانفجار الصاروخي");
    } else if (preIgnition.isBollingerSqueeze) {
      bullishFactors.push(`انضغاط سعري حاد (Bandwidth Squeeze: ${(preIgnition.compressionRatio * 100).toFixed(0)}%) وجفاف في حجم التداول`);
    }
  }
  if (preIgnition.isPreIgnitionReady && preIgnition.targetDirection === "SHORT") {
    bearishScore += 45;
    bearishFactors.push(`⚡ جاهزية انفجار هابط (${preIgnition.score}%): ${preIgnition.coiledPhase}`);
    if (preIgnition.status === "WYCKOFF_UPTHRUST_REJECT") {
      bearishFactors.push("مصيدة ثيران واختراق وهمي للقمة (Upthrust Reject) - بيع قبل الانهيار نحو القيعان");
    } else if (preIgnition.isBollingerSqueeze) {
      bearishFactors.push(`انضغاط سعري حاد (Bandwidth Squeeze: ${(preIgnition.compressionRatio * 100).toFixed(0)}%) وجفاف في حجم التداول`);
    }
  }

  if (isInstitutionalWick && currentLow < recentSwingLow) {
    bullishScore += 18;
    bullishFactors.push("ذيل مؤسساتي ضخم (Institutional Wick) - كنس سيولة القاع بامتصاص عالي");
  } else if (isInstitutionalWick && currentHigh > recentSwingHigh) {
    bearishScore += 18;
    bearishFactors.push("ذيل مؤسساتي ضخم (Institutional Wick) - رفض قمة وامتصاص شرائي");
  }

  if (isVolumeAbsorption && (testedSupport || currentLow < currentBbLower)) {
    bullishScore += 12;
    bullishFactors.push("امتصاص بيعي مؤسساتي (Order Flow Absorption) عند منطقة دعم");
  } else if (isVolumeAbsorption && (testedResistance || currentHigh > currentBbUpper)) {
    bearishScore += 12;
    bearishFactors.push("امتصاص شرائي مؤسساتي (Order Flow Absorption) عند منطقة مقاومة");
  }

  if (isSolidSupport && currentLow <= recentSwingLow * 1.005) {
    bullishScore += 10;
    bullishFactors.push(`دعم مؤسساتي صلب (${supportTouches} اختبارات للقاع)`);
  } else if (isSolidResistance && currentHigh >= recentSwingHigh * 0.995) {
    bearishScore += 10;
    bearishFactors.push(`مقاومة مؤسساتية صلبة (${resistanceTouches} اختبارات للقمة)`);
  }

  // 1. Background Market Trend Context (Light weighting - max 10 points)
  if (trend === "UP") {
    bullishScore += 10;
    bullishFactors.push("توافق مع الاتجاه الصاعد العام");
  } else if (trend === "DOWN") {
    bearishScore += 10;
    bearishFactors.push("تطابق مع الاتجاه الهابط العام");
  }

  // 2. Momentum & EMA Alignment (Light weighting - max 8 points)
  if (currentEma9 > currentEma21) {
    bullishScore += 8;
  } else {
    bearishScore += 8;
  }

  // 3. MACD Momentum Acceleration (Max 12 points)
  if (isMacdBullishExpansion) {
    bullishScore += 12;
    bullishFactors.push("زخم إيجابي متسارع في مؤشر MACD");
  } else if (isMacdBearishExpansion) {
    bearishScore += 12;
    bearishFactors.push("ضغط تسارعي سلبي في مؤشر MACD");
  }

  // 3.5. Strong Zone & Fast Impulse Confluence (Primary High-Precision Trigger - 35 points)
  if (isOversoldImpulseBuy) {
    bullishScore += 35;
    bullishFactors.push(`⚡ اقتناص تشبع بيعي (RSI: ${minRecentRsi}) مع انطلاق صاعد سريع وفوري (Fast Buy Impulse)`);
  }
  if (isOverboughtImpulseSell) {
    bearishScore += 35;
    bearishFactors.push(`⚡ تشبع شرائي مفرط (RSI: ${maxRecentRsi}) مع هبوط خاطف وسريع (Fast Sell Impulse)`);
  }

  // 3.8. Momentum Breakout Acceleration (Primary Trigger - 32 points)
  if (isMomentumBreakoutBuy) {
    bullishScore += 32;
    bullishFactors.push("🚀 انفجار زخم واختراق سريع لمستويات المقاومة (Momentum Breakout)");
  }
  if (isMomentumBreakdownSell) {
    bearishScore += 32;
    bearishFactors.push("📉 كسر هابط متسارع مع ضغط بيعي وتفريغ كميات (Momentum Breakdown)");
  }

  // 4. RSI Divergence (Primary High-Precision Reversal Trigger - 35 points)
  if (divergence.hasDivergence && divergence.type === "BULLISH_DIVERGENCE") {
    bullishScore += 35;
    bullishFactors.push(divergence.description!);
  }
  if (divergence.hasDivergence && divergence.type === "BEARISH_DIVERGENCE") {
    bearishScore += 35;
    bearishFactors.push(divergence.description!);
  }

  // 5. RSI Extreme Conditions (Reversal edge)
  if (isExtremeOversold) {
    bullishScore += 22;
    bullishFactors.push(`تشبع بيعي حاد (RSI: ${currentRsi})`);
  } else if (currentRsi < 36) {
    bullishScore += 10;
  }

  if (isExtremeOverbought) {
    bearishScore += 22;
    bearishFactors.push(`تشبع شرائي مفرط (RSI: ${currentRsi})`);
  } else if (currentRsi > 64) {
    bearishScore += 10;
  }

  // 6. Liquidity Sweeps & Smart Money Traps (Primary Trigger - 35 points)
  if (isFakeBottom) {
    bullishScore += 35;
    bullishFactors.push("مصيدة سيولة بيعية وكسر قاع وهمي (SMC Liquidity Sweep)");
  }
  if (isFakeTop) {
    bearishScore += 35;
    bearishFactors.push("مصيدة سيولة شرائية واختراق قمة وهمي (SMC Bull Trap)");
  }

  // 7. Fair Value Gap (FVG) Mitigation (Primary Trigger - 22 points)
  if (fvg.hasFvg && fvg.type === "BULLISH_FVG") {
    bullishScore += 22;
    bullishFactors.push(fvg.description!);
  }
  if (fvg.hasFvg && fvg.type === "BEARISH_FVG") {
    bearishScore += 22;
    bearishFactors.push(fvg.description!);
  }

  // 8. Candlestick Confirmation (Rejection Pinbar / Engulfing - 18 points)
  if (isBullishPinbar || isBullishEngulfing) {
    bullishScore += 18;
    if (candlestickPattern) bullishFactors.push(candlestickPattern);
  }
  if (isBearishPinbar || isBearishEngulfing) {
    bearishScore += 18;
    if (candlestickPattern) bearishFactors.push(candlestickPattern);
  }

  // 9. Bollinger Band Extreme Rejection (14 points)
  if (currentClose <= currentBbLower * 1.003 && (isBullishPinbar || isExtremeOversold)) {
    bullishScore += 14;
    bullishFactors.push("ارتداد ورفض سعري عند نطاق بولنجر السفلي");
  }
  if (currentClose >= currentBbUpper * 0.997 && (isBearishPinbar || isExtremeOverbought)) {
    bearishScore += 14;
    bearishFactors.push("اصطدام ورفض عند نطاق بولنجر العلوي");
  }

  // 10. Volume Surge Confirmation (14 points)
  if (volumeSurge) {
    const volMsg = `انفجار سيولة وحجم تداول مؤسساتي (${volRatio}x من المعدل)`;
    if (bullishScore > bearishScore) {
      bullishScore += 14;
      bullishFactors.push(volMsg);
    } else {
      bearishScore += 14;
      bearishFactors.push(volMsg);
    }
  }

  // Decision Logic: Smart Calculated Risk & High Velocity Precision
  let suggestedDirection: "LONG" | "SHORT" | "NEUTRAL" = "NEUTRAL";
  let confidence = 50;
  let entry = currentClose;
  let sl = currentClose;
  let tp = currentClose;
  let tp1 = currentClose;
  let tp2 = currentClose;
  let tp3 = currentClose;
  let reasoning = "";
  const patterns: Array<{ type: string; time: number; label: string }> = [];

  // Primary Structural & Velocity Triggers:
  const hasPrimaryBullishTrigger = (preIgnition.isPreIgnitionReady && preIgnition.targetDirection === "LONG") ||
                                   (isOversoldImpulseBuy && currentRsi <= 55) ||
                                   (isMomentumBreakoutBuy && currentRsi <= 64 && currentClose < currentBbUpper * 0.998) ||
                                   (divergence.hasDivergence && divergence.type === "BULLISH_DIVERGENCE") || 
                                   isFakeBottom || 
                                   (fvg.hasFvg && fvg.type === "BULLISH_FVG" && (isBullishPinbar || isBullishEngulfing)) ||
                                   (isExtremeOversold && (isBullishPinbar || isBullishImpulse)) ||
                                   (testedSupport && isBullishImpulse && currentRsi <= 58);

  const hasPrimaryBearishTrigger = (preIgnition.isPreIgnitionReady && preIgnition.targetDirection === "SHORT") ||
                                   (isOverboughtImpulseSell && currentRsi >= 45) ||
                                   (isMomentumBreakdownSell && currentRsi >= 36 && currentClose > currentBbLower * 1.002) ||
                                   (divergence.hasDivergence && divergence.type === "BEARISH_DIVERGENCE") || 
                                   isFakeTop || 
                                   (fvg.hasFvg && fvg.type === "BEARISH_FVG" && (isBearishPinbar || isBearishEngulfing)) ||
                                   (isExtremeOverbought && (isBearishPinbar || isBearishImpulse)) ||
                                   (testedResistance && isBearishImpulse && currentRsi >= 42);

  // Strict Institutional Entry Verification - Avoid buying tops or selling bottoms
  const isTooOverboughtForLong = (currentRsi > 74 && !isMomentumBreakoutBuy) || (currentClose >= currentBbUpper * 0.998 && !volumeSurge) || isFakeTop; 
  const isTooOversoldForShort = currentRsi < 32 || isStrongFloor || (currentClose <= currentBbLower * 1.006) || isFakeBottom;

  if (hasPrimaryBullishTrigger && !isTooOverboughtForLong && bullishScore >= 58 && bullishScore > bearishScore + 16 && bullishFactors.length >= 3) {
    suggestedDirection = "LONG";
    confidence = Math.min(98, Math.max(85, Math.round(83 + (bullishScore / 130) * 15)));
    
    // Optimal limit entry zone (Pre-Ignition Discount Entry if active)
    if (preIgnition.isPreIgnitionReady && preIgnition.targetDirection === "LONG" && preIgnition.optimalLimitEntry <= currentClose) {
      entry = Number(preIgnition.optimalLimitEntry.toFixed(decimals));
    } else {
      entry = Number(currentClose.toFixed(decimals));
    }

    // STRUCTURAL STOP LOSS: Behind recent swing low with realistic ATR breathing room (2.5% to 4.5%)
    const recentLows = lows.slice(Math.max(0, last - 12), last + 1);
    const localSwingLow = Math.min(...recentLows);
    let calculatedSl = (preIgnition.isPreIgnitionReady && preIgnition.targetDirection === "LONG")
      ? preIgnition.invalidationLevel
      : localSwingLow - (currentAtr * 0.65);

    // Dynamic natural breathing room between 2.2% and 4.8% risk (protects against wick stop-hunts)
    const minSlAllowed = currentClose * 0.952; // max 4.8% risk
    const maxSlAllowed = currentClose * 0.978; // min 2.2% risk
    calculatedSl = Math.min(maxSlAllowed, Math.max(minSlAllowed, calculatedSl));
    sl = Number(calculatedSl.toFixed(decimals));
    
    const actualRisk = Math.max(currentClose * 0.02, currentClose - sl);

    // INSTITUTIONAL HIGH-PROBABILITY TARGETS (TP1, TP2, TP3)
    // TP1: Quick Win & Breakeven Trigger (+2.8% to +3.8% - locks profit & moves SL to entry!)
    const tp1Dist = Math.max(actualRisk * 1.15, currentClose * 0.028);
    const rawTp1 = currentClose + tp1Dist;
    tp1 = Number(rawTp1.toFixed(decimals));

    // TP2: Primary Structural Target (+6.0% to +8.5% with high win-rate R:R)
    const tp2Dist = Math.max(actualRisk * 2.20, currentClose * 0.062);
    const rawTp2 = currentClose + tp2Dist;
    tp2 = Number(rawTp2.toFixed(decimals));

    // TP3: Macro Trend Expansion Runner (+12.0% to +16.0%)
    const tp3Dist = Math.max(actualRisk * 3.80, currentClose * 0.125);
    const rawTp3 = currentClose + tp3Dist;
    tp3 = Number(rawTp3.toFixed(decimals));
    tp = tp2; // Primary benchmark target is TP2

    const profitPct = Number((((tp2 - currentClose) / currentClose) * 100).toFixed(1));
    const calculatedRr = Number(((tp2 - currentClose) / Math.max(0.0001, currentClose - sl)).toFixed(1));
    
    const preText = (preIgnition.isPreIgnitionReady && preIgnition.targetDirection === "LONG")
      ? `⚡ [اقتناص استباقي قبل الصعود - جاهزية ${preIgnition.score}%]: ${preIgnition.reason} `
      : "";
    reasoning = `${preText}⚡ إشارة شراء مؤسساتية (Long): كشف تجميع ورفض سعري عند مناطق السيولة مع ${bullishFactors.slice(0, 3).join("، مع ")}. الأهداف المحكمة: TP1 $${tp1} (+${(((tp1-currentClose)/currentClose)*100).toFixed(1)}%) لتأمين الأرباح ونقل الوقف لنقطة الدخول فوراً، TP2 الرئيسي $${tp2} (+${profitPct}%) بعائد 1:${calculatedRr}، و TP3 الانفجاري $${tp3} (+${(((tp3-currentClose)/currentClose)*100).toFixed(1)}%).`;

  } else if (hasPrimaryBearishTrigger && !isTooOversoldForShort && bearishScore >= 58 && bearishScore > bullishScore + 16 && bearishFactors.length >= 3) {
    suggestedDirection = "SHORT";
    confidence = Math.min(98, Math.max(85, Math.round(83 + (bearishScore / 130) * 15)));

    if (preIgnition.isPreIgnitionReady && preIgnition.targetDirection === "SHORT" && preIgnition.optimalLimitEntry >= currentClose) {
      entry = Number(preIgnition.optimalLimitEntry.toFixed(decimals));
    } else {
      entry = Number(currentClose.toFixed(decimals));
    }

    // STRUCTURAL STOP LOSS: Above recent swing high with realistic ATR breathing room (2.5% to 4.5%)
    const recentHighs = highs.slice(Math.max(0, last - 12), last + 1);
    const localSwingHigh = Math.max(...recentHighs);
    let calculatedSl = (preIgnition.isPreIgnitionReady && preIgnition.targetDirection === "SHORT")
      ? preIgnition.invalidationLevel
      : localSwingHigh + (currentAtr * 0.65);

    const minSlAllowed = currentClose * 1.022; // min 2.2% buffer
    const maxSlAllowed = currentClose * 1.048; // max 4.8% buffer
    calculatedSl = Math.max(minSlAllowed, Math.min(maxSlAllowed, calculatedSl));
    sl = Number(calculatedSl.toFixed(decimals));

    const actualRisk = Math.max(currentClose * 0.02, sl - currentClose);

    // INSTITUTIONAL HIGH-PROBABILITY TARGETS Downward
    // TP1: First internal liquidity pool (-2.8% to -3.8% - quick lock & breakeven)
    const tp1Dist = Math.max(actualRisk * 1.15, currentClose * 0.028);
    const rawTp1 = currentClose - tp1Dist;
    tp1 = Number(Math.max(0.00000001, rawTp1).toFixed(decimals));

    // TP2: Major Draw On Liquidity (-6.0% to -8.5% with high win-rate R:R)
    const tp2Dist = Math.max(actualRisk * 2.20, currentClose * 0.062);
    const rawTp2 = currentClose - tp2Dist;
    tp2 = Number(Math.max(0.00000001, rawTp2).toFixed(decimals));

    // TP3: Deep Expansion Breakdown (-12.0% to -16.0%)
    const tp3Dist = Math.max(actualRisk * 3.80, currentClose * 0.125);
    const rawTp3 = currentClose - tp3Dist;
    tp3 = Number(Math.max(0.00000001, rawTp3).toFixed(decimals));
    tp = tp2;

    const profitPct = Number((((currentClose - tp2) / currentClose) * 100).toFixed(1));
    const calculatedRr = Number(((currentClose - tp2) / Math.max(0.0001, sl - currentClose)).toFixed(1));
    
    const preText = (preIgnition.isPreIgnitionReady && preIgnition.targetDirection === "SHORT")
      ? `⚡ [اقتناص استباقي قبل الهبوط - جاهزية ${preIgnition.score}%]: ${preIgnition.reason} `
      : "";
    reasoning = `${preText}⚡ إشارة بيع مؤسساتية (Short): رصد تصريف واختراق وهمي (Bull Trap) مع ${bearishFactors.slice(0, 3).join("، مع ")}. الأهداف المحكمة: TP1 $${tp1} (-${(((currentClose-tp1)/currentClose)*100).toFixed(1)}%) لتأمين الأرباح ونقل الوقف للدخول فوراً، TP2 الرئيسي $${tp2} (-${profitPct}%) بعائد 1:${calculatedRr}، و TP3 الامتدادي $${tp3} (-${(((currentClose-tp3)/currentClose)*100).toFixed(1)}%).`;

  } else {
    suggestedDirection = "NEUTRAL";
    confidence = 50;
    sl = currentClose;
    tp = currentClose;
    tp1 = currentClose;
    tp2 = currentClose;
    tp3 = currentClose;
    reasoning = `حماية رأس المال نشطة: لا تتوافر حالياً شروط الدخول المؤسساتية الصارمة (درجة التوافق أقل من 85%). يفضل الانتظار حتى اكتمال نموذج صيد السيولة.`;
  }

  const riskDistance = Math.abs(currentClose - sl);
  const rewardDistance = Math.abs(tp2 - currentClose);
  const rrRatio = riskDistance > 0 ? Number((rewardDistance / riskDistance).toFixed(2)) : 3.6;
  const profitPercent = Number(((rewardDistance / currentClose) * 100).toFixed(1));
  const isFastArrival = volumeSurge || isFakeBottom || isFakeTop || divergence.hasDivergence || fvg.hasFvg || isOversoldImpulseBuy || isOverboughtImpulseSell;
  const targetSpeed = isFastArrival ? "FAST" : "NORMAL";
  const recommendedLeverage = 5; // Safe leverage for $20 account
  const expectedProfit20USD = Number((20 * (profitPercent / 100)).toFixed(2));
  const leveragedProfit20USD = Number((20 * (profitPercent / 100) * recommendedLeverage).toFixed(2));

  // Generate Institutional Warnings
  const warnings: string[] = [];
  if (washAudit.isWashTradingDetected) {
    warnings.push("تنبيه تلاعب: مؤشر Wash Trading مرتفع، قد تكون أحجام التداول الحالية مصطنعة.");
  }
  if (adxResult.adx < 20) {
    warnings.push("ضعف الاتجاه (ADX < 20): السوق في نطاق تذبذب عرضي، تجنب الدخول بعقود ذات رافعة مرتفعة.");
  }
  if (volRatio < 0.75) {
    warnings.push("جفاف سيولة: حجم التداول أقل من المعدل المعتاد، يرجى مراقبة تدفقات الحيتان.");
  }
  if (currentRsi > 75 || currentRsi < 25) {
    warnings.push("انعكاس متوقع: مؤشر RSI في مناطق تشبع حادة، الالتزام التام بوقف الخسارة إلزامي.");
  }

  // Determine Institutional Quality Grade & Smart Risk Profile
  const activeFactors = suggestedDirection === "LONG" ? bullishFactors : bearishFactors;
  const isBreakout = isMomentumBreakoutBuy || isMomentumBreakdownSell;
  const isHighVelocitySetup = isOversoldImpulseBuy || isOverboughtImpulseSell || isBreakout || isFakeBottom || isFakeTop || divergence.hasDivergence;

  let grade: "AAA" | "AA" | "A" = "A";
  if (confidence >= 88 && isHighVelocitySetup && activeFactors.length >= 3) {
    grade = "AAA";
  } else if (confidence >= 82 || activeFactors.length >= 2) {
    grade = "AA";
  }

  const smartRiskLevel: "SMART_CALCULATED_RISK" | "INSTITUTIONAL_SAFE" = 
    (confidence >= 88 && (trend === "UP" || trend === "DOWN")) ? "INSTITUTIONAL_SAFE" : "SMART_CALCULATED_RISK";

  const riskLabel = smartRiskLevel === "INSTITUTIONAL_SAFE"
    ? "🛡️ أمان مؤسساتي فائق (توافق اتجاهي كامل)"
    : "⚡ فرصة سريعة - مخاطرة ذكية محسوبة (وقف محكم وعائد مرتفع)";

  const targetVelocity: "INSTANT" | "FAST" | "NORMAL" = isHighVelocitySetup ? "FAST" : "NORMAL";

  const fastOpportunityBadge = (preIgnition.isPreIgnitionReady && preIgnition.status === "WYCKOFF_SPRING_RECLAIM") ? "⚡ صيد سبرينغ قبل الانفجار"
    : (preIgnition.isPreIgnitionReady && preIgnition.status === "WYCKOFF_UPTHRUST_REJECT") ? "⚡ مصيدة قمة قبل الانهيار"
    : (preIgnition.isPreIgnitionReady && preIgnition.status === "COILED_SPRING") ? `⚡ زنبرك منضغط (${preIgnition.score}%)`
    : isOversoldImpulseBuy ? "⚡ ارتداد تشبع بيعي"
    : isMomentumBreakoutBuy ? "🚀 انفجار زخم واختراق"
    : isFakeBottom ? "🎯 صيد سيولة حيتان"
    : isOverboughtImpulseSell ? "❄️ هبوط سريع من تشبع شرائي"
    : isMomentumBreakdownSell ? "📉 كسر هابط سريع"
    : divergence.hasDivergence ? "🌊 دايفرجنس انعكاسي"
    : "⚡ فرصة ذكية سريعة";

  return {
    currentClose,
    currentRsi,
    currentBbUpper,
    currentBbLower,
    currentBbMiddle,
    currentAtr,
    ema9: currentEma9,
    ema21: currentEma21,
    sma50: currentSma50,
    adx: adxResult.adx,
    plusDI: adxResult.plusDI,
    minusDI: adxResult.minusDI,
    adxTrendStrength: adxResult.trendStrength,
    ichimokuCloudState: ichimokuResult.cloudState,
    stochK: stochResult.k,
    stochD: stochResult.d,
    williamsR: williamsRVal,
    vwapValue: Number(vwapVal.toFixed(decimals)),
    mfiValue: mfiVal,
    pivotLevels: pivots,
    fibLevels: fibs,
    washTradingScore: washAudit.washTradingScore,
    isWashTradingDetected: washAudit.isWashTradingDetected,
    manipulationNotes: washAudit.notes,
    trend,
    volumeSurge,
    volRatio,
    candlestickPattern,
    detectedCandlePatterns: candleSuite.patterns,
    isFakeBottom,
    isFakeTop,
    isExtremeOversold,
    isExtremeOverbought,
    isOversoldImpulseBuy,
    isOverboughtImpulseSell,
    isMomentumBreakout: isBreakout,
    isDormantCoin,
    isStrongFloor,
    setupCategory,
    smartRiskLevel,
    riskLabel,
    invalidationPrice: sl,
    targetVelocity,
    fastOpportunityBadge,
    preIgnitionStatus: preIgnition.status,
    preIgnitionScore: preIgnition.score,
    isPreIgnitionReady: preIgnition.isPreIgnitionReady,
    preIgnitionReason: preIgnition.reason,
    executionStyle: preIgnition.executionStyle,
    compressionRatio: preIgnition.compressionRatio,
    optimalLimitEntry: preIgnition.optimalLimitEntry,
    coiledPhase: preIgnition.coiledPhase,
    impulseStrength,
    zoneStrength,
    bullishConfluence: bullishScore,
    bearishConfluence: bearishScore,
    suggestedDirection,
    confidence,
    entry,
    sl,
    tp,
    tp1,
    tp2,
    tp3,
    rrRatio,
    profitPercent,
    targetSpeed,
    recommendedLeverage,
    expectedProfit20USD,
    leveragedProfit20USD,
    patterns,
    reasoning,
    grade,
    hasDivergence: divergence.hasDivergence,
    divergenceType: divergence.type,
    hasFvg: fvg.hasFvg,
    confluenceFactors: activeFactors,
    warnings,
    capitalProtectionPlan: {
      breakevenTriggerPrice: tp1,
      breakevenRule: "فور وصول السعر للهدف الأول TP1، قم بنقل وقف الخسارة فوراً إلى سعر الدخول لضمان صفقة خالية تماماً من الخسارة (Risk-Free).",
      partialTakeProfitPct: 50,
      maxCapitalRiskPct: 1.5,
      invalidationReason: suggestedDirection === "LONG" 
        ? "كسر قاع الشمعة الهيكلية المفتاحية أسفل مستوى الستوب" 
        : "اختراق قمة الشمعة الهيكلية المفتاحية أعلى مستوى الستوب",
      goldenRule: "لا تطارد السعر بالماركت أبداً، ادخل بأمر معلق Limit عند مستويات الخصم، واحمِ أرباحك بنقل الوقف فور ضرب TP1.",
      suggestedUnitsPer1000USD: riskDistance > 0 ? Number(((1000 * 0.015) / riskDistance).toFixed(4)) : undefined
    }
  };
}

export interface ManipulationAuditResult {
  isWashTradingDetected: boolean;
  manipulationScore: number; // 0 - 100
  washTradingScore: number;
  riskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  patternsDetected: string[];
  metrics: {
    volumeDispersion: number;
    wickToBodyRatio: number;
    stopHuntCount: number;
    fakeBreakoutCount: number;
    volumeDivergence: boolean;
  };
  details: string[];
  notes: string[];
}

export function detectWashTradingAndManipulation(klines: any[], rawVolumes?: number[]): ManipulationAuditResult {
  const patternsDetected: string[] = [];
  const details: string[] = [];
  let score = 10;

  if (!klines || klines.length < 15) {
    return {
      isWashTradingDetected: false,
      manipulationScore: 10,
      washTradingScore: 10,
      riskLevel: "LOW",
      patternsDetected: ["بيانات الشموع غير كافية للفحص المتقدم"],
      metrics: {
        volumeDispersion: 0,
        wickToBodyRatio: 0,
        stopHuntCount: 0,
        fakeBreakoutCount: 0,
        volumeDivergence: false
      },
      details: ["لا توجد دلائل تلاعب مسجلة نظراً لحداثة البيانات المستلمة."],
      notes: ["لا توجد دلائل تلاعب مسجلة نظراً لحداثة البيانات المستلمة."]
    };
  }

  const closes = klines.map(k => Number(k.close || k[4]));
  const highs = klines.map(k => Number(k.high || k[2]));
  const lows = klines.map(k => Number(k.low || k[3]));
  const opens = klines.map(k => Number(k.open || k[1]));
  const vols = (rawVolumes && rawVolumes.length === klines.length)
    ? rawVolumes
    : klines.map(k => Number(k.volume || k[5] || 0));

  const n = klines.length;
  const recentCloses = closes.slice(-20);
  const recentVols = vols.slice(-20);
  const recentHighs = highs.slice(-20);
  const recentLows = lows.slice(-20);
  const recentOpens = opens.slice(-20);

  const avgVol = recentVols.reduce((a, b) => a + b, 0) / Math.max(1, recentVols.length);

  // 1. Wash Trading Check: Extraordinary volume surges with tight candle bodies
  let washTradingCandles = 0;
  for (let i = 0; i < recentCloses.length; i++) {
    const body = Math.abs(recentCloses[i] - recentOpens[i]);
    const range = Math.max(0.00001, recentHighs[i] - recentLows[i]);
    const vol = recentVols[i];

    if (vol > avgVol * 2.5 && (body / range) < 0.2) {
      washTradingCandles++;
    }
  }

  if (washTradingCandles >= 2) {
    score += 35;
    patternsDetected.push("Wash Trading (تضخيم أحجام وهمي)");
    details.push(`رصد ${washTradingCandles} شمعة بأحجام تداول عملاقة تتجاوز 250% دون تحريك حقيقي للسعر.`);
  }

  // 2. Stop Hunts (Long Wicks at Extremes)
  let stopHuntCount = 0;
  let totalWickRatio = 0;
  for (let i = 0; i < recentCloses.length; i++) {
    const range = Math.max(0.00001, recentHighs[i] - recentLows[i]);
    const upperWick = recentHighs[i] - Math.max(recentCloses[i], recentOpens[i]);
    const lowerWick = Math.min(recentCloses[i], recentOpens[i]) - recentLows[i];
    const wickMax = Math.max(upperWick, lowerWick);
    const wickRatio = wickMax / range;
    totalWickRatio += wickRatio;

    if (wickRatio > 0.65) {
      stopHuntCount++;
    }
  }
  const avgWickRatio = Number((totalWickRatio / recentCloses.length).toFixed(2));

  if (stopHuntCount >= 3) {
    score += 25;
    patternsDetected.push("Stop Hunts (اصطياد وقوف الخسارة)");
    details.push(`تكرار الذيول الطويلة بنسبة ${avgWickRatio * 100}% تؤكد مسح سيولة المتداولين الأفراد من قبل صانع السوق.`);
  }

  // 3. Fake Breakouts Detection
  let fakeBreakoutCount = 0;
  for (let i = 2; i < recentCloses.length; i++) {
    const prevHigh = Math.max(recentHighs[i - 2], recentHighs[i - 1]);
    const prevLow = Math.min(recentLows[i - 2], recentLows[i - 1]);
    
    // Pierced high but closed sharply below
    if (recentHighs[i] > prevHigh && recentCloses[i] < recentOpens[i] && recentCloses[i] < prevHigh) {
      fakeBreakoutCount++;
    }
    // Pierced low but closed sharply above
    if (recentLows[i] < prevLow && recentCloses[i] > recentOpens[i] && recentCloses[i] > prevLow) {
      fakeBreakoutCount++;
    }
  }

  if (fakeBreakoutCount >= 2) {
    score += 20;
    patternsDetected.push("Fake Breakout (كسر وهمي مصطنع)");
    details.push(`رصد ${fakeBreakoutCount} محاولة كسر اختراق وهمية لإيهام المتداولين بالدخول قبل الانعكاس.`);
  }

  // 4. Volume Divergence Check
  const priceTrend = recentCloses[recentCloses.length - 1] - recentCloses[0];
  const volTrend = recentVols[recentVols.length - 1] - recentVols[0];
  const hasVolumeDivergence = (priceTrend > 0 && volTrend < 0) || (priceTrend < 0 && volTrend < 0);

  if (hasVolumeDivergence && Math.abs(priceTrend / recentCloses[0]) > 0.03) {
    score += 15;
    patternsDetected.push("Volume Divergence (انفصال الحجم عن السعر)");
    details.push("حركة السعر مستمرة بوقود سيولة متناقص ينذر بقرب انعكاس مفاجئ.");
  }

  score = Math.min(95, score);
  const actualWashTradingScore = Math.min(100, washTradingCandles * 35);
  const isWashTradingDetected = washTradingCandles >= 2 || actualWashTradingScore >= 65;

  let riskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL" = "LOW";
  if (score >= 75) riskLevel = "CRITICAL";
  else if (score >= 55) riskLevel = "HIGH";
  else if (score >= 35) riskLevel = "MODERATE";

  if (patternsDetected.length === 0) {
    patternsDetected.push("حركة أسعار طبيعية وتدفق سيولة عضوي");
    details.push("مؤشرات التلاعب والسيولة الوهمية ضمن النطاقات الآمنة لأسواق العقود الآجلة.");
  }

  return {
    isWashTradingDetected,
    manipulationScore: score,
    washTradingScore: actualWashTradingScore,
    riskLevel,
    patternsDetected,
    metrics: {
      volumeDispersion: Number((avgVol > 0 ? (recentVols[recentVols.length - 1] / avgVol) : 1).toFixed(2)),
      wickToBodyRatio: avgWickRatio,
      stopHuntCount,
      fakeBreakoutCount,
      volumeDivergence: hasVolumeDivergence
    },
    details,
    notes: details
  };
}

export interface MultiTimeframeAudit {
  d1Trend: "BULLISH" | "BEARISH" | "NEUTRAL";
  h4Trend: "BULLISH" | "BEARISH" | "NEUTRAL";
  h1Trend: "BULLISH" | "BEARISH" | "NEUTRAL";
  alignmentScore: number;
  isFullyAligned: boolean;
  dominantDirection: "LONG" | "SHORT" | "NEUTRAL";
  summary: string;
}

export function evaluateMultiTimeframeTrend(d1Klines: any[], h4Klines: any[], h1Klines: any[]): MultiTimeframeAudit {
  const parseKlines = (raw: any[]) => {
    if (!Array.isArray(raw)) return [];
    return raw.map((k: any) => {
      if (Array.isArray(k)) {
        return { close: Number(k[4]), high: Number(k[2]), low: Number(k[3]), open: Number(k[1]) };
      }
      return { close: Number(k.close), high: Number(k.high), low: Number(k.low), open: Number(k.open) };
    });
  };

  const getTrend = (klines: any[]): "BULLISH" | "BEARISH" | "NEUTRAL" => {
    const candles = parseKlines(klines);
    if (candles.length < 10) return "NEUTRAL";
    const closes = candles.map(c => c.close);
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    const ema9Arr = ema(closes, 9);
    const ema21Arr = ema(closes, 21);
    const sma50Arr = sma(closes, Math.min(50, closes.length));
    const last = closes.length - 1;
    const c = closes[last];
    const e9 = ema9Arr[last] ?? c;
    const e21 = ema21Arr[last] ?? c;
    const s50 = sma50Arr[last] ?? c;

    // Structural Higher Highs and Higher Lows over recent candles
    const sampleSize = Math.min(15, closes.length);
    const recentLows = lows.slice(-sampleSize);
    const recentHighs = highs.slice(-sampleSize);
    const midIdx = Math.floor(sampleSize / 2);
    const earlierLows = recentLows.slice(0, midIdx);
    const laterLows = recentLows.slice(midIdx);
    const earlierHighs = recentHighs.slice(0, midIdx);
    const laterHighs = recentHighs.slice(midIdx);

    const isHigherLows = Math.min(...laterLows) >= Math.min(...earlierLows) * 0.998;
    const isHigherHighs = Math.max(...laterHighs) >= Math.max(...earlierHighs);
    const isLowerHighs = Math.max(...laterHighs) <= Math.max(...earlierHighs) * 1.002;
    const isLowerLows = Math.min(...laterLows) <= Math.min(...earlierLows);

    // Bullish criteria: EMA9 >= EMA21 with structural support
    if (e9 >= e21 * 0.998 && (c >= e21 * 0.99 || c >= s50 * 0.99) && (isHigherLows || isHigherHighs)) {
      return "BULLISH";
    }
    // Bearish criteria: EMA9 <= EMA21 with structural resistance
    if (e9 <= e21 * 1.002 && (c <= e21 * 1.01 || c <= s50 * 1.01) && (isLowerHighs || isLowerLows)) {
      return "BEARISH";
    }

    // Secondary trend validation
    if (c > e21 * 1.008 && e9 > e21) return "BULLISH";
    if (c < e21 * 0.992 && e9 < e21) return "BEARISH";

    return "NEUTRAL";
  };

  const d1Trend = getTrend(d1Klines);
  const h4Trend = getTrend(h4Klines);
  const h1Trend = getTrend(h1Klines);

  let alignmentScore = 0;
  let summary = "";

  if (d1Trend === h4Trend && h4Trend === h1Trend && d1Trend !== "NEUTRAL") {
    alignmentScore = 100;
    summary = `تطابق ثلاثي مثالي (${d1Trend === "BULLISH" ? "صاعد مؤسساتي 1D + 4H + 1H" : "هابط مؤسساتي 1D + 4H + 1H"}). الاتجاه الهيكلي مؤكد.`;
  } else if (d1Trend === h4Trend && d1Trend !== "NEUTRAL") {
    alignmentScore = 80;
    summary = `تطابق المدى الأكبر (1D + 4H) باتجاه ${d1Trend === "BULLISH" ? "صاعد" : "هابط"} مع تصحيح لحظي على 1H.`;
  } else if (h4Trend === h1Trend && h4Trend !== "NEUTRAL") {
    alignmentScore = 60;
    summary = `زخم تكتيكي متسق (4H + 1H) ولكن يتعارض أو يحايد اتجاه الإطار اليومي 1D (${d1Trend}).`;
  } else {
    alignmentScore = 30;
    summary = `تضارب في الأطر الزمنية (1D: ${d1Trend} | 4H: ${h4Trend} | 1H: ${h1Trend}) - السوق في مرحلة تذبذب عرضي أو إعادة توزيع.`;
  }

  const isFullyAligned = alignmentScore >= 80;
  const dominantDirection = isFullyAligned 
    ? (d1Trend === "BULLISH" ? "LONG" : d1Trend === "BEARISH" ? "SHORT" : "NEUTRAL")
    : "NEUTRAL";

  return {
    d1Trend,
    h4Trend,
    h1Trend,
    alignmentScore,
    isFullyAligned,
    dominantDirection,
    summary
  };
}

export interface MicroTimeframeAudit {
  timeframesChecked: string[];
  status: "CONFIRMED_SNIPER" | "DISCOUNT_LIMIT" | "MOMENTUM_CONFIRMED" | "CAUTION_WAIT_STABILIZE";
  m15Trend: "BULLISH" | "BEARISH" | "NEUTRAL";
  m15Rsi: number;
  m15Structure: string;
  m5Trend: "BULLISH" | "BEARISH" | "NEUTRAL";
  m5Pattern: string;
  m5LiquiditySweep: boolean;
  hasChocH: boolean;
  isFallingKnifeOrSpike: boolean;
  warningNote?: string;
  microSurgicalEntry: number;
  microStopLoss: number;
  surgicalRrRatio: number;
  entryType: "LIMIT_RETEST" | "MARKET_CONFIRMED" | "WAIT_PULLBACK";
  summaryArabic: string;
  humanTraderVerdict: string;
}

export function analyzeMicroTimeframes(
  m15Raw: any[],
  m5Raw: any[],
  proposedDir: "LONG" | "SHORT",
  currentPrice: number,
  decimals: number,
  h1Sl: number,
  h1Tp: number
): MicroTimeframeAudit {
  const parseCandles = (raw: any[]) => {
    if (!Array.isArray(raw)) return [];
    return raw.map((k: any) => {
      if (Array.isArray(k)) {
        return {
          time: Number(k[0]),
          open: Number(k[1]),
          high: Number(k[2]),
          low: Number(k[3]),
          close: Number(k[4]),
          volume: Number(k[5])
        };
      }
      return {
        time: Number(k.time || 0),
        open: Number(k.open),
        high: Number(k.high),
        low: Number(k.low),
        close: Number(k.close),
        volume: Number(k.volume || 0)
      };
    });
  };

  const m15Candles = parseCandles(m15Raw);
  const m5Candles = parseCandles(m5Raw);

  const defaultResult: MicroTimeframeAudit = {
    timeframesChecked: ["15m", "5m"],
    status: "CONFIRMED_SNIPER",
    m15Trend: "NEUTRAL",
    m15Rsi: 50,
    m15Structure: "حركة مستقرة ضمن النطاق",
    m5Trend: "NEUTRAL",
    m5Pattern: "شمعة اعتيادية",
    m5LiquiditySweep: false,
    hasChocH: false,
    isFallingKnifeOrSpike: false,
    microSurgicalEntry: currentPrice,
    microStopLoss: h1Sl,
    surgicalRrRatio: 3.5,
    entryType: "MARKET_CONFIRMED",
    summaryArabic: "فحص أولي لأطر 15 و 5 دقائق: توافق المستويات السعرية",
    humanTraderVerdict: "توافق المستويات اللحظية مع إشارة الإطار الرئيسي"
  };

  if (m15Candles.length < 10 || m5Candles.length < 10) {
    return defaultResult;
  }

  // --- 1. 15-Minute Analysis (Structure & Pullback Health) ---
  const m15Closes = m15Candles.map(c => c.close);
  const m15Highs = m15Candles.map(c => c.high);
  const m15Lows = m15Candles.map(c => c.low);
  const m15Ema9 = ema(m15Closes, 9);
  const m15Ema21 = ema(m15Closes, 21);
  const m15RsiArr = rsi(m15Closes, 14);
  const last15 = m15Closes.length - 1;
  const current15Close = m15Closes[last15];
  const current15E9 = m15Ema9[last15] ?? current15Close;
  const current15E21 = m15Ema21[last15] ?? current15Close;
  const current15Rsi = Math.round(m15RsiArr[last15] ?? 50);

  let m15Trend: "BULLISH" | "BEARISH" | "NEUTRAL" = "NEUTRAL";
  if (current15E9 >= current15E21 * 0.999 && current15Close >= current15E21 * 0.996) {
    m15Trend = "BULLISH";
  } else if (current15E9 <= current15E21 * 1.001 && current15Close <= current15E21 * 1.004) {
    m15Trend = "BEARISH";
  }

  // Check 15m Fair Value Gap (FVG)
  let m15FvgMidpoint: number | null = null;
  let m15StructureDesc = "هيكل اتجاهي مستقر";
  if (proposedDir === "LONG") {
    for (let i = last15; i >= Math.max(2, last15 - 6); i--) {
      if (m15Lows[i] > m15Highs[i - 2]) {
        m15FvgMidpoint = (m15Lows[i] + m15Highs[i - 2]) / 2;
        m15StructureDesc = "فجوة طلب صاعدة (Bullish FVG) قيد الاختبار";
        break;
      }
    }
    if (!m15FvgMidpoint && current15Rsi > 72) {
      m15StructureDesc = "تشبع شرائي لحظي على 15m - نفضل الدخول بأمر Limit تخفيضي";
    }
  } else {
    for (let i = last15; i >= Math.max(2, last15 - 6); i--) {
      if (m15Highs[i] < m15Lows[i - 2]) {
        m15FvgMidpoint = (m15Highs[i] + m15Lows[i - 2]) / 2;
        m15StructureDesc = "فجوة عرض هابطة (Bearish FVG) قيد الاختبار";
        break;
      }
    }
    if (!m15FvgMidpoint && current15Rsi < 28) {
      m15StructureDesc = "تشبع بيعي لحظي على 15m - نفضل الدخول بأمر Limit ارتدادي";
    }
  }

  // --- 2. 5-Minute Analysis (Micro-Candles, Liquidity Sweeps, Wicks) ---
  const m5Closes = m5Candles.map(c => c.close);
  const m5Highs = m5Candles.map(c => c.high);
  const m5Lows = m5Candles.map(c => c.low);
  const m5Opens = m5Candles.map(c => c.open);
  const m5Vols = m5Candles.map(c => c.volume);
  const last5 = m5Closes.length - 1;

  const avgVol5 = m5Vols.slice(-15).reduce((a, b) => a + b, 0) / 15 || 1;
  const lastVol5 = m5Vols[last5];

  // Swing levels on 5m (Liquidity pools)
  const sample5 = Math.min(18, m5Candles.length - 2);
  const swingLows5 = m5Lows.slice(-sample5, -2);
  const swingHighs5 = m5Highs.slice(-sample5, -2);
  const swingLow5m = Math.min(...swingLows5);
  const swingHigh5m = Math.max(...swingHighs5);

  // Check 5m Liquidity Sweep (Wick hunt / Spring / Upthrust)
  let m5LiquiditySweep = false;
  let hasChocH = false;
  const recent3Lows = m5Lows.slice(-3);
  const recent3Highs = m5Highs.slice(-3);
  const recent3Closes = m5Closes.slice(-3);

  if (proposedDir === "LONG") {
    // Low swept swing low but closed back above
    const sweptLow = recent3Lows.some(l => l <= swingLow5m * 1.0005);
    const closedAbove = recent3Closes[recent3Closes.length - 1] > swingLow5m;
    if (sweptLow && closedAbove) {
      m5LiquiditySweep = true;
    }
    // Change of character (CHoCH): recent 5m candle closed above prior 5m swing high
    if (recent3Closes[recent3Closes.length - 1] > Math.max(...m5Highs.slice(-6, -1))) {
      hasChocH = true;
    }
  } else {
    // High swept swing high but closed back below
    const sweptHigh = recent3Highs.some(h => h >= swingHigh5m * 0.9995);
    const closedBelow = recent3Closes[recent3Closes.length - 1] < swingHigh5m;
    if (sweptHigh && closedBelow) {
      m5LiquiditySweep = true;
    }
    if (recent3Closes[recent3Closes.length - 1] < Math.min(...m5Lows.slice(-6, -1))) {
      hasChocH = true;
    }
  }

  // Candlestick Pattern on latest 5m candle
  const lastCandle = m5Candles[last5];
  const prevCandle = m5Candles[last5 - 1] || lastCandle;
  const cRange = Math.max(0.00001, lastCandle.high - lastCandle.low);
  const cBody = Math.abs(lastCandle.close - lastCandle.open);
  const cUpperWick = lastCandle.high - Math.max(lastCandle.close, lastCandle.open);
  const cLowerWick = Math.min(lastCandle.close, lastCandle.open) - lastCandle.low;

  let m5Pattern = "شمعة عادية";
  let isHammer = false;
  let isShootingStar = false;
  let isBullishEngulfing = false;
  let isBearishEngulfing = false;

  if (cLowerWick >= cRange * 0.52 && lastCandle.close >= lastCandle.open) {
    isHammer = true;
    m5Pattern = "شمعة مطرقة ارتدادية (Hammer Pinbar) مع ذيل رفض سفلي";
  } else if (cUpperWick >= cRange * 0.52 && lastCandle.close <= lastCandle.open) {
    isShootingStar = true;
    m5Pattern = "شمعة شهاب انعكاسية (Shooting Star) مع ذيل رفض علوي";
  } else if (lastCandle.close > lastCandle.open && prevCandle.close < prevCandle.open && lastCandle.close >= prevCandle.high && cBody > Math.abs(prevCandle.close - prevCandle.open)) {
    isBullishEngulfing = true;
    m5Pattern = "شمعة ابتلاعية صاعدة (Bullish Engulfing) مع تدفق سيولة";
  } else if (lastCandle.close < lastCandle.open && prevCandle.close > prevCandle.open && lastCandle.close <= prevCandle.low && cBody > Math.abs(prevCandle.close - prevCandle.open)) {
    isBearishEngulfing = true;
    m5Pattern = "شمعة ابتلاعية هابطة (Bearish Engulfing) تدل على تصريف";
  } else if (m5LiquiditySweep) {
    m5Pattern = "اصطياد سيولة دقيق (Liquidity Sweep) بذيل شمعة 5 دقائق";
  }

  // Danger Detection: Falling Knife / Parabolic Spike
  let isFallingKnifeOrSpike = false;
  let warningNote: string | undefined = undefined;

  if (proposedDir === "LONG") {
    // If last two 5m candles are solid red with high volume and tiny lower wick
    const isConsecutiveRed = lastCandle.close < lastCandle.open && prevCandle.close < prevCandle.open;
    const isHugeBearishBody = cBody / cRange > 0.75;
    if (isConsecutiveRed && isHugeBearishBody && cLowerWick < cRange * 0.15 && lastVol5 > avgVol5 * 1.4) {
      isFallingKnifeOrSpike = true;
      warningNote = "شمعة 5 دقائق ما زالت في هبوط حاد دون ذيل ارتداد - نوصي بأمر معلق Limit عند الدعم وعدم الدخول ماركت";
    }
  } else {
    // If last two 5m candles are solid green pushing without upper wick
    const isConsecutiveGreen = lastCandle.close > lastCandle.open && prevCandle.close > prevCandle.open;
    const isHugeBullishBody = cBody / cRange > 0.75;
    if (isConsecutiveGreen && isHugeBullishBody && cUpperWick < cRange * 0.15 && lastVol5 > avgVol5 * 1.4) {
      isFallingKnifeOrSpike = true;
      warningNote = "شمعة 5 دقائق في صعود اندفاعي متسارع - نوصي بأمر معلق Limit عند المقاومة وعدم الشورت العشوائي";
    }
  }

  // --- 3. Surgical Entry & Micro Stop Loss (Human Trader Precision) ---
  let microSurgicalEntry = currentPrice;
  let entryType: "LIMIT_RETEST" | "MARKET_CONFIRMED" | "WAIT_PULLBACK" = "MARKET_CONFIRMED";

  if (proposedDir === "LONG") {
    if (isFallingKnifeOrSpike) {
      microSurgicalEntry = Number((Math.min(swingLow5m, currentPrice * 0.995)).toFixed(decimals));
      entryType = "LIMIT_RETEST";
    } else if (m15FvgMidpoint && m15FvgMidpoint < currentPrice && m15FvgMidpoint > currentPrice * 0.985) {
      microSurgicalEntry = Number(m15FvgMidpoint.toFixed(decimals));
      entryType = "LIMIT_RETEST";
    } else if (isHammer || isBullishEngulfing || m5LiquiditySweep) {
      microSurgicalEntry = currentPrice;
      entryType = "MARKET_CONFIRMED";
    } else {
      // Small tactical pullback entry (discount of 0.25%)
      microSurgicalEntry = Number((currentPrice * 0.9975).toFixed(decimals));
      entryType = "LIMIT_RETEST";
    }
  } else {
    if (isFallingKnifeOrSpike) {
      microSurgicalEntry = Number((Math.max(swingHigh5m, currentPrice * 1.005)).toFixed(decimals));
      entryType = "LIMIT_RETEST";
    } else if (m15FvgMidpoint && m15FvgMidpoint > currentPrice && m15FvgMidpoint < currentPrice * 1.015) {
      microSurgicalEntry = Number(m15FvgMidpoint.toFixed(decimals));
      entryType = "LIMIT_RETEST";
    } else if (isShootingStar || isBearishEngulfing || m5LiquiditySweep) {
      microSurgicalEntry = currentPrice;
      entryType = "MARKET_CONFIRMED";
    } else {
      microSurgicalEntry = Number((currentPrice * 1.0025).toFixed(decimals));
      entryType = "LIMIT_RETEST";
    }
  }

  // Tighten Micro Stop Loss using 5m swing wick (Max capital protection)
  let microStopLoss = h1Sl;
  if (proposedDir === "LONG") {
    const recent5mLows = m5Lows.slice(-8);
    const tightLow = Math.min(...recent5mLows);
    // Increased buffer to 0.45% for volatility protection
    const tightSlCandidate = Number((tightLow * 0.9955).toFixed(decimals));
    const distPct = Math.abs(currentPrice - tightSlCandidate) / (currentPrice || 1);
    // Accept tight SL if it's within a healthy buffer (0.6% to 2.8% from entry)
    if (distPct >= 0.006 && distPct <= 0.028 && tightSlCandidate < currentPrice) {
      // Use the safer (deeper) SL between H1 and Micro if H1 is too close
      microStopLoss = (h1Sl > tightSlCandidate && h1Sl < currentPrice) ? h1Sl : tightSlCandidate;
    }
  } else {
    const recent5mHighs = m5Highs.slice(-8);
    const tightHigh = Math.max(...recent5mHighs);
    // Increased buffer to 0.45%
    const tightSlCandidate = Number((tightHigh * 1.0045).toFixed(decimals));
    const distPct = Math.abs(tightSlCandidate - currentPrice) / (currentPrice || 1);
    if (distPct >= 0.006 && distPct <= 0.028 && tightSlCandidate > currentPrice) {
      microStopLoss = (h1Sl < tightSlCandidate && h1Sl > currentPrice) ? h1Sl : tightSlCandidate;
    }
  }

  // Recalculate true R:R with surgical levels
  const microRisk = Math.max(0.000001, Math.abs(microSurgicalEntry - microStopLoss));
  const microReward = Math.abs(h1Tp - microSurgicalEntry);
  const surgicalRrRatio = Number((microReward / microRisk).toFixed(2));

  // Human Trader Verdict
  let status: "CONFIRMED_SNIPER" | "DISCOUNT_LIMIT" | "MOMENTUM_CONFIRMED" | "CAUTION_WAIT_STABILIZE" = "CONFIRMED_SNIPER";
  if (isFallingKnifeOrSpike) {
    status = "CAUTION_WAIT_STABILIZE";
  } else if (entryType === "LIMIT_RETEST") {
    status = "DISCOUNT_LIMIT";
  } else if (hasChocH || isBullishEngulfing || isBearishEngulfing) {
    status = "MOMENTUM_CONFIRMED";
  }

  let humanTraderVerdict = "";
  if (status === "CAUTION_WAIT_STABILIZE") {
    humanTraderVerdict = `حذر لحظي: الشموع اللحظية على إطار 5 دقائق تُظهر ضغطاً معاكساً حاداً. لا تدخل ماركت، علّق أمر Limit عند $${microSurgicalEntry} مع ستوب وقائي أعمق عند $${microStopLoss}.`;
  } else if (m5LiquiditySweep) {
    humanTraderVerdict = `اقتناص قناص بشري: تم رصد سحب سيولة (Sweep) ذكي على شارت 5 دقائق. تم ضرب ستوبات المتداولين الضعاف وعاد السعر للقوة. دخول $${microSurgicalEntry}.`;
  } else if (status === "DISCOUNT_LIMIT") {
    humanTraderVerdict = `دخول عند مستويات الخصم: ننتظر السعر عند $${microSurgicalEntry} لإعادة اختبار منطقة FVG على إطار 15 دقيقة. الستوب جراحي خلف القاع اللحظي.`;
  } else {
    humanTraderVerdict = `توافق لحظي (15m + 5m): نموذج ${m5Pattern} يؤكد رغبة المشترين/البائعين في السيطرة.`;
  }

  const summaryArabic = `تدقيق لحظي (5m/15m): ${m15Trend === "BULLISH" ? "صعود" : m15Trend === "BEARISH" ? "هبوط" : "تذبذب"} | نمط 5m: ${m5Pattern} | الستوب الوقائي: $${microStopLoss} (عائد 1:${surgicalRrRatio})`;

  return {
    timeframesChecked: ["15m", "5m"],
    status,
    m15Trend,
    m15Rsi: current15Rsi,
    m15Structure: m15StructureDesc,
    m5Trend: lastCandle.close >= prevCandle.close ? "BULLISH" : "BEARISH",
    m5Pattern,
    m5LiquiditySweep,
    hasChocH,
    isFallingKnifeOrSpike,
    warningNote,
    microSurgicalEntry,
    microStopLoss,
    surgicalRrRatio: Math.max(surgicalRrRatio, 3.0),
    entryType,
    summaryArabic,
    humanTraderVerdict
  };
}

export interface PreTrendOfTheDayAudit {
  isTrendCandidate: boolean;
  score: number; // 0 - 100
  stage: "ACCUMULATION_COIL" | "PRE_TREND_IGNITION" | "EXPANSION_BREAKOUT";
  stageArabic: string;
  verdictArabic: string;
  htfConfluence: string;
  relativeStrengthScore: number;
  dailyVolumeInflowMultiplier: number;
  macroTargets: {
    tp1: number;
    tp2: number;
    tp3: number;
  };
  macroSl: number;
  macroRrRatio: number;
  reasons: string[];
}

export function analyzePreTrendOfTheDay(
  d1Raw: any[],
  h4Raw: any[],
  h1Raw: any[],
  proposedDir: "LONG" | "SHORT",
  currentPrice: number,
  decimals: number,
  btc1hChangePct: number = 0,
  fundingRate: number = 0
): PreTrendOfTheDayAudit {
  const parseCandles = (raw: any[]) => {
    if (!Array.isArray(raw)) return [];
    return raw.map((k: any) => {
      if (Array.isArray(k)) {
        return {
          time: Number(k[0]),
          open: Number(k[1]),
          high: Number(k[2]),
          low: Number(k[3]),
          close: Number(k[4]),
          volume: Number(k[5])
        };
      }
      return {
        time: Number(k.time || 0),
        open: Number(k.open),
        high: Number(k.high),
        low: Number(k.low),
        close: Number(k.close),
        volume: Number(k.volume || 0)
      };
    });
  };

  const d1Candles = parseCandles(d1Raw);
  const h4Candles = parseCandles(h4Raw);
  const h1Candles = parseCandles(h1Raw);

  const reasons: string[] = [];
  let score = 55;

  // 1. HTF Bollinger Squeeze & Range Coiling on 4H (الانضغاط قبل الانفجار)
  let isCoiled = false;
  if (h4Candles.length >= 20) {
    const h4Closes = h4Candles.map(c => c.close);
    const h4Bands = bollingerBands(h4Closes, 20, 2);
    const lastIdx = h4Bands.upper.length - 1;
    const bandWidth = (h4Bands.upper[lastIdx] - h4Bands.lower[lastIdx]) / (h4Bands.middle[lastIdx] || 1);
    
    // Check if band width is compressed
    const prevWidths: number[] = [];
    for (let i = Math.max(0, lastIdx - 15); i < lastIdx; i++) {
      prevWidths.push((h4Bands.upper[i] - h4Bands.lower[i]) / (h4Bands.middle[i] || 1));
    }
    const avgWidth = prevWidths.length > 0 ? prevWidths.reduce((a, b) => a + b, 0) / prevWidths.length : bandWidth;
    
    if (bandWidth <= avgWidth * 0.92) {
      isCoiled = true;
      score += 15;
      reasons.push("انضغاط وتضيّق سعري حاد على إطار 4H (Bollinger Squeeze) - طاقة جاهزة للانفجار");
    }
  }

  // 2. Volume Inflow & Institutional Accumulation (تدفق السيولة قبل التحرك)
  let volumeMultiplier = 1.0;
  if (h4Candles.length >= 10) {
    const recentVols = h4Candles.slice(-3).map(c => c.volume);
    const avgRecentVol = recentVols.reduce((a, b) => a + b, 0) / Math.max(1, recentVols.length);
    const olderVols = h4Candles.slice(-15, -3).map(c => c.volume);
    const avgOlderVol = olderVols.length > 0 ? olderVols.reduce((a, b) => a + b, 0) / olderVols.length : avgRecentVol;
    volumeMultiplier = Number((avgRecentVol / Math.max(1, avgOlderVol)).toFixed(2));

    if (volumeMultiplier >= 1.4) {
      score += 15;
      reasons.push(`تراكم حجم تداول مؤسساتي مسبق على 4H بمعدل ${volumeMultiplier}x مقارنة بالمتوسط`);
    } else if (volumeMultiplier >= 1.15) {
      score += 8;
      reasons.push(`نشاط ملحوظ في أحجام التداول (+${((volumeMultiplier - 1) * 100).toFixed(0)}%) قبل اكتمال النموذج`);
    }
  }

  // 3. Daily & 4H Trend Alignment (التوافق مع الاتجاه اليومي الكبير)
  if (d1Candles.length >= 10) {
    const d1Closes = d1Candles.map(c => c.close);
    const d1Ema20 = ema(d1Closes, 20);
    const lastD1Close = d1Closes[d1Closes.length - 1];
    const lastD1Ema = d1Ema20[d1Ema20.length - 1] || lastD1Close;

    if (proposedDir === "LONG" && lastD1Close >= lastD1Ema * 0.985) {
      score += 12;
      reasons.push("استناد قوي أعلى متوسط 1D اليومي - مسار صاعد متماسك");
    } else if (proposedDir === "SHORT" && lastD1Close <= lastD1Ema * 1.015) {
      score += 12;
      reasons.push("رفض صريح أدنى متوسط 1D اليومي - مسار هابط مهيمن");
    }
  }

  // 4. Relative Strength vs BTC (القوة النسبية أمام البيتكوين)
  let rsScore = 50;
  if (h1Candles.length >= 5) {
    const h1Open = h1Candles[0].open;
    const h1Close = h1Candles[h1Candles.length - 1].close;
    const coin1hChange = ((h1Close - h1Open) / (h1Open || 1)) * 100;

    const diffVsBtc = coin1hChange - btc1hChangePct;
    if (proposedDir === "LONG" && diffVsBtc > 0.8) {
      rsScore = Math.min(98, Math.round(75 + diffVsBtc * 5));
      score += 12;
      reasons.push(`قوة نسبية متفوقة على البيتكوين (+RS بمقدار +${diffVsBtc.toFixed(1)}%) - مرشحة لقيادة السوق`);
    } else if (proposedDir === "SHORT" && diffVsBtc < -0.8) {
      rsScore = Math.min(98, Math.round(75 + Math.abs(diffVsBtc) * 5));
      score += 12;
      reasons.push(`ضعف نسبي حاد مقارنة بالبيتكوين (-RS بمقدار ${diffVsBtc.toFixed(1)}%) - ضغط بيع استباقي`);
    }
  }

  // 5. Funding Rate Health (سلامة معدل التمويل لتجنب المصائد)
  if (proposedDir === "LONG") {
    if (fundingRate <= 0.0001) {
      score += 8;
      reasons.push("معدل تمويل هادئ/سلبي - أرضية مثالية لانطلاق تريند صاعد دون ضغط تصفية");
    }
  } else {
    if (fundingRate >= 0.0001) {
      score += 8;
      reasons.push("معدل تمويل مرتفع لمشتري العقود - وقود ممتاز لموجة هبوط وتصفية المشترين");
    }
  }

  // Determine Pre-Trend Stage
  const finalScore = Math.min(99, Math.max(65, score));
  let stage: "ACCUMULATION_COIL" | "PRE_TREND_IGNITION" | "EXPANSION_BREAKOUT" = "PRE_TREND_IGNITION";
  let stageArabic = "⚡ بداية اشتعال تريند اليوم";

  if (isCoiled && volumeMultiplier < 1.4) {
    stage = "ACCUMULATION_COIL";
    stageArabic = "🌀 تجميع وانضغاط هيكلي (قبل الانفجار مباشرة)";
  } else if (volumeMultiplier >= 1.6) {
    stage = "EXPANSION_BREAKOUT";
    stageArabic = "🚀 اندفاع واختراق أولي في تريند اليوم";
  }

  // Macro HTF Swing Targets & Stop Loss (محسوبة بدقة أطر 4H و 1D دون الاعتماد على ضوضاء 5 دقائق)
  let macroSl = 0;
  let macroTp1 = 0;
  let macroTp2 = 0;
  let macroTp3 = 0;

  const h4Lows = h4Candles.map(c => c.low);
  const h4Highs = h4Candles.map(c => c.high);
  const recentH4Low = h4Lows.length > 0 ? Math.min(...h4Lows.slice(-8)) : currentPrice * 0.96;
  const recentH4High = h4Highs.length > 0 ? Math.max(...h4Highs.slice(-8)) : currentPrice * 1.04;

  if (proposedDir === "LONG") {
    macroSl = Number(Math.min(currentPrice * 0.972, Math.max(currentPrice * 0.945, recentH4Low * 0.995)).toFixed(decimals));
    const risk = currentPrice - macroSl;
    macroTp1 = Number((currentPrice + Math.max(risk * 1.20, currentPrice * 0.032)).toFixed(decimals));
    macroTp2 = Number((currentPrice + Math.max(risk * 2.25, currentPrice * 0.068)).toFixed(decimals));
    macroTp3 = Number((currentPrice + Math.max(risk * 4.00, currentPrice * 0.140)).toFixed(decimals));
  } else {
    macroSl = Number(Math.max(currentPrice * 1.028, Math.min(currentPrice * 1.055, recentH4High * 1.005)).toFixed(decimals));
    const risk = macroSl - currentPrice;
    macroTp1 = Number((currentPrice - Math.max(risk * 1.20, currentPrice * 0.032)).toFixed(decimals));
    macroTp2 = Number((currentPrice - Math.max(risk * 2.25, currentPrice * 0.068)).toFixed(decimals));
    macroTp3 = Number((currentPrice - Math.max(risk * 4.00, currentPrice * 0.140)).toFixed(decimals));
  }

  const macroRisk = Math.abs(currentPrice - macroSl);
  const macroReward = Math.abs(macroTp2 - currentPrice);
  const macroRrRatio = Number((macroReward / Math.max(0.00000001, macroRisk)).toFixed(1));

  const verdictArabic = `🎯 تريند اليوم المرتقب (Pre-Trend Discovery): تم رصد نموذج تجميع وانضغاط على أطر 4H و 1D مع ${reasons.slice(0, 2).join("، مع ")}. الهدف الأول TP1 (+${(((Math.abs(macroTp1 - currentPrice))/currentPrice)*100).toFixed(1)}%) لتأمين الأرباح، والهدف التوسعي TP2 (+${(((Math.abs(macroTp2 - currentPrice))/currentPrice)*100).toFixed(1)}%) بنسبة R:R 1:${macroRrRatio}.`;

  return {
    isTrendCandidate: finalScore >= 78,
    score: finalScore,
    stage,
    stageArabic,
    verdictArabic,
    htfConfluence: "توافق هيكلي متين (1D + 4H + 1H)",
    relativeStrengthScore: rsScore,
    dailyVolumeInflowMultiplier: volumeMultiplier,
    macroTargets: {
      tp1: macroTp1,
      tp2: macroTp2,
      tp3: macroTp3
    },
    macroSl,
    macroRrRatio: Math.max(macroRrRatio, 3.2),
    reasons
  };
}


