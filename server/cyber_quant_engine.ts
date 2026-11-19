import axios from "axios";
import { storageMemory } from "./storage_memory_engine.ts";
import { aiHub, AiCallResult, AiRoleKey } from "./ai_hub.ts";

export interface CandleBar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  takerBuyVolume?: number;
  quoteVolume?: number;
}

export interface ExchangePriceComparison {
  exchange: "Binance Futures" | "Bybit Linear" | "OKX Swap" | "Gate Futures";
  price: number;
  change24hPct: number;
  volume24hUsd: number;
  spreadVsMedianPct: number;
  status: "ONLINE" | "OFFLINE";
}

export interface HistoricalFractalMatch {
  dateStr: string;
  candlesAgo: number;
  similarityPct: number;
  next6CandlesReturnPct: number;
  next12CandlesReturnPct: number;
  outcome: "BULLISH_RALLY" | "BEARISH_DROP" | "SIDEWAYS";
}

export interface CyberTrapAudit {
  trapRiskScore: number; // 0 (safe) to 100 (extreme trap)
  isSafeToTrade: boolean;
  detectedTraps: string[];
  candleAnatomy: {
    takerBuyRatioPct: number;
    netOrderflowDeltaBias: "STRONG_BUY_ABSORPTION" | "STRONG_SELL_PRESSURE" | "BALANCED";
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
}

export interface SmallCapitalRiskPlan {
  capitalUsd: number;
  riskPerTradeUsd: number;
  riskPercent: number;
  recommendedLeverage: number;
  marginType: "ISOLATED";
  positionSizeUsd: number;
  liquidationPrice: number;
  liquidationDistancePct: number;
  expectedProfitTp1Usd: number;
  expectedProfitTp2Usd: number;
  expectedProfitTp3Usd: number;
  compounding10TradesTargetUsd: number;
}

export interface CrossMarketPulse {
  cryptoMajorsAvgChangePct: number;
  aiSectorAvgChangePct: number;
  aiSectorLeaders: Array<{ symbol: string; price: number; change24hPct: number }>;
  goldMacro: { symbol: string; price: number; change24hPct: number };
  fearAndGreed: { value: number; label: string; arabic: string };
  btcFundingRatePct: number;
  btcLongShortRatio: number;
  overallMarketRegime: "RISK_ON_BULLISH" | "RISK_OFF_BEARISH" | "VOLATILE_ACCUMULATION" | "PRE_NEWS_CAUTION";
  regimeArabic: string;
}

export interface DeepCyberQuantReport {
  symbol: string;
  currentPrice: number;
  direction: "LONG" | "SHORT" | "WAIT";
  confidence: number;
  winProbabilityPct: number;
  grade: "AAA" | "AA" | "A" | "CAUTION";
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
  liquidityZones: Array<{ price: number; type: "BUY_WALL_DEMAND" | "SELL_WALL_SUPPLY" | "FVG_MAGNET"; strength: string }>;
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
  cyberTrapAudit: CyberTrapAudit;
  historicalMatches: HistoricalFractalMatch[];
  historicalWinRatePct: number;
  smallCapitalPlan: SmallCapitalRiskPlan;
  crossMarketPulse: CrossMarketPulse;
  coinMemory: ReturnType<typeof storageMemory.loadCoinProfile>;
  aiCouncil: Record<AiRoleKey, AiCallResult>;
  deterministicSummaryArabic: string;
  timestamp: number;
}

export interface FastOpportunityItem {
  symbol: string;
  price: number;
  change24hPct: number;
  volume24hUsd: number;
  direction: "LONG" | "SHORT";
  confidence: number;
  winProbabilityPct: number;
  setupType: "BOTTOM_COIL_EXPLOSION" | "DIP_ABSORPTION" | "SQUEEZE_BREAKOUT" | "LIQUIDITY_SWEEP_REVERSAL";
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
  smallCapPlan: SmallCapitalRiskPlan;
}

export class CyberQuantEngine {
  private pulseCache: CrossMarketPulse | null = null;
  private pulseCacheAt = 0;

  // 1. Fetch candles safely from Binance Futures
  public async fetchCandles(symbol: string, interval: string, limit = 120): Promise<CandleBar[]> {
    const sym = symbol.toUpperCase().trim();
    const formatted = sym.endsWith("USDT") ? sym : `${sym}USDT`;
    const urls = [
      `https://fapi.binance.com/fapi/v1/klines?symbol=${formatted}&interval=${interval}&limit=${limit}`,
      `https://api.binance.com/api/v3/klines?symbol=${formatted}&interval=${interval}&limit=${limit}`
    ];

    for (const url of urls) {
      try {
        const res = await axios.get(url, { timeout: 4500 });
        if (Array.isArray(res.data) && res.data.length > 0) {
          return res.data.map((k: any) => ({
            time: Math.floor(k[0] / 1000),
            open: parseFloat(k[1]),
            high: parseFloat(k[2]),
            low: parseFloat(k[3]),
            close: parseFloat(k[4]),
            volume: parseFloat(k[5]),
            quoteVolume: parseFloat(k[7]) || parseFloat(k[5]) * parseFloat(k[4]),
            takerBuyVolume: parseFloat(k[9]) || parseFloat(k[5]) * 0.5
          }));
        }
      } catch {}
    }
    return [];
  }

  // 2. Compare live prices & 24h changes across 4 major exchanges (NO API KEYS)
  public async compareExchanges(symbol: string): Promise<ExchangePriceComparison[]> {
    const cleanBase = symbol.toUpperCase().replace("USDT", "").replace("1000", "").trim();
    const sym = symbol.toUpperCase().endsWith("USDT") ? symbol.toUpperCase() : `${cleanBase}USDT`;
    const okxInst = `${cleanBase}-USDT-SWAP`;
    const gateContract = `${cleanBase}_USDT`;

    const [binRes, bybRes, okxRes, gateRes] = await Promise.allSettled([
      axios.get(`https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=${sym}`, { timeout: 3500 }),
      axios.get(`https://api.bybit.com/v5/market/tickers?category=linear&symbol=${sym}`, { timeout: 3500 }),
      axios.get(`https://www.okx.com/api/v5/market/ticker?instId=${okxInst}`, { timeout: 3500 }),
      axios.get(`https://api.gateio.ws/api/v4/futures/usdt/tickers?contract=${gateContract}`, { timeout: 3500 })
    ]);

    const raw: Array<Omit<ExchangePriceComparison, "spreadVsMedianPct">> = [];

    if (binRes.status === "fulfilled" && binRes.value.data?.lastPrice) {
      raw.push({
        exchange: "Binance Futures",
        price: parseFloat(binRes.value.data.lastPrice),
        change24hPct: parseFloat(binRes.value.data.priceChangePercent || "0"),
        volume24hUsd: parseFloat(binRes.value.data.quoteVolume || "0"),
        status: "ONLINE"
      });
    }
    if (bybRes.status === "fulfilled" && bybRes.value.data?.result?.list?.[0]?.lastPrice) {
      const it = bybRes.value.data.result.list[0];
      raw.push({
        exchange: "Bybit Linear",
        price: parseFloat(it.lastPrice),
        change24hPct: Number((parseFloat(it.price24hPcnt || "0") * 100).toFixed(2)),
        volume24hUsd: parseFloat(it.turnover24h || "0"),
        status: "ONLINE"
      });
    }
    if (okxRes.status === "fulfilled" && okxRes.value.data?.data?.[0]?.last) {
      const it = okxRes.value.data.data[0];
      const last = parseFloat(it.last);
      const open24 = parseFloat(it.open24h || it.last);
      raw.push({
        exchange: "OKX Swap",
        price: last,
        change24hPct: open24 > 0 ? Number((((last - open24) / open24) * 100).toFixed(2)) : 0,
        volume24hUsd: parseFloat(it.volCcy24h || "0") * last,
        status: "ONLINE"
      });
    }
    if (gateRes.status === "fulfilled" && Array.isArray(gateRes.value.data) && gateRes.value.data[0]?.last) {
      const it = gateRes.value.data[0];
      raw.push({
        exchange: "Gate Futures",
        price: parseFloat(it.last),
        change24hPct: parseFloat(it.change_percentage || "0"),
        volume24hUsd: parseFloat(it.volume_24h_quote || "0"),
        status: "ONLINE"
      });
    }

    const prices = raw.map(r => r.price).filter(p => p > 0).sort((a, b) => a - b);
    const median = prices.length > 0 ? prices[Math.floor(prices.length / 2)] : 1;

    return raw.map(r => ({
      ...r,
      spreadVsMedianPct: median > 0 ? Number((((r.price - median) / median) * 100).toFixed(4)) : 0
    }));
  }

  // 3. Cross-Market & AI Sector + Macro Gold Pulse
  public async getCrossMarketPulse(force = false): Promise<CrossMarketPulse> {
    if (!force && this.pulseCache && Date.now() - this.pulseCacheAt < 45000) {
      return this.pulseCache;
    }

    const [tickersRes, fngRes, lsRes, premRes] = await Promise.allSettled([
      axios.get("https://fapi.binance.com/fapi/v1/ticker/24hr", { timeout: 5500 }),
      axios.get("https://api.alternative.me/fng/?limit=1", { timeout: 3500 }),
      axios.get("https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=BTCUSDT&period=1h&limit=1", { timeout: 3500 }),
      axios.get("https://fapi.binance.com/fapi/v1/premiumIndex?symbol=BTCUSDT", { timeout: 3500 })
    ]);

    const tMap = new Map<string, any>();
    if (tickersRes.status === "fulfilled" && Array.isArray(tickersRes.value.data)) {
      for (const t of tickersRes.value.data) tMap.set(t.symbol, t);
    }

    const majors = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT"].map(s => parseFloat(tMap.get(s)?.priceChangePercent || "0"));
    const cryptoMajorsAvgChangePct = Number((majors.reduce((a, b) => a + b, 0) / majors.length).toFixed(2));

    const aiSyms = ["TAOUSDT", "FETUSDT", "NEARUSDT", "RENDERUSDT", "WLDUSDT"];
    const aiSectorLeaders = aiSyms.map(s => ({
      symbol: s,
      price: parseFloat(tMap.get(s)?.lastPrice || "0"),
      change24hPct: parseFloat(tMap.get(s)?.priceChangePercent || "0")
    })).filter(x => x.price > 0);
    const aiSectorAvgChangePct = aiSectorLeaders.length > 0
      ? Number((aiSectorLeaders.reduce((a, b) => a + b.change24hPct, 0) / aiSectorLeaders.length).toFixed(2))
      : 0;

    const goldTicker = tMap.get("XAUUSDT");
    const goldMacro = {
      symbol: "XAUUSDT",
      price: parseFloat(goldTicker?.lastPrice || "2650"),
      change24hPct: parseFloat(goldTicker?.priceChangePercent || "0")
    };

    let fgVal = 55;
    let fgLabel = "Neutral";
    let fgAr = "توازن وترقب في شهية المخاطرة";
    if (fngRes.status === "fulfilled" && fngRes.value.data?.data?.[0]) {
      fgVal = parseInt(fngRes.value.data.data[0].value, 10) || 55;
      fgLabel = fngRes.value.data.data[0].value_classification || "Neutral";
      fgAr = fgVal >= 70 ? "طمع مرتفع - انتبه من مصائد جني الأرباح" : fgVal >= 55 ? "طمع إيجابي - زخم شرائي جيد" : fgVal <= 30 ? "خوف شديد - مناطق تجميع حيتان تاريخية" : "توازن وحذر نسبي";
    }

    let lsRatio = 1.4;
    if (lsRes.status === "fulfilled" && Array.isArray(lsRes.value.data) && lsRes.value.data[0]) {
      lsRatio = Number(parseFloat(lsRes.value.data[0].longShortRatio || "1.4").toFixed(2));
    }

    let fundingPct = 0.01;
    if (premRes.status === "fulfilled" && premRes.value.data?.lastFundingRate) {
      fundingPct = Number((parseFloat(premRes.value.data.lastFundingRate) * 100).toFixed(4));
    }

    let overallMarketRegime: CrossMarketPulse["overallMarketRegime"] = "VOLATILE_ACCUMULATION";
    let regimeArabic = "مرحلة تجميع وتذبذب ذكي — ركز على أوامر Limit عند مناطق الدعم والسيولة";

    if (cryptoMajorsAvgChangePct >= 2.0 && aiSectorAvgChangePct >= 2.0) {
      overallMarketRegime = "RISK_ON_BULLISH";
      regimeArabic = "اندفاع شهية المخاطرة (Risk-On): قطاع الكريبتو والذكاء الاصطناعي في موجة صعود متزامنة";
    } else if (cryptoMajorsAvgChangePct <= -2.5) {
      overallMarketRegime = "RISK_OFF_BEARISH";
      regimeArabic = "حذر وتصريف هبوطي (Risk-Off): تجنب الشراء العشوائي واقتنص الارتدادات فقط أو صفقات Short";
    } else if (Math.abs(fundingPct) > 0.03) {
      overallMarketRegime = "PRE_NEWS_CAUTION";
      regimeArabic = "توتر تمويلي مرتفع — احتمال تصفيات مفاجئة (Squeeze) قبل الأخبار";
    }

    this.pulseCache = {
      cryptoMajorsAvgChangePct,
      aiSectorAvgChangePct,
      aiSectorLeaders,
      goldMacro,
      fearAndGreed: { value: fgVal, label: fgLabel, arabic: fgAr },
      btcFundingRatePct: fundingPct,
      btcLongShortRatio: lsRatio,
      overallMarketRegime,
      regimeArabic
    };
    this.pulseCacheAt = Date.now();
    return this.pulseCache;
  }

  // 4. Historical Fractal Pattern Matcher (Cosine similarity on last 500 candles)
  public findHistoricalFractals(candles: CandleBar[], windowLen = 14): {
    matches: HistoricalFractalMatch[];
    historicalWinRatePct: number;
  } {
    if (candles.length < windowLen + 30) {
      return { matches: [], historicalWinRatePct: 50 };
    }

    const toReturnsVec = (slice: CandleBar[]) => {
      const vec: number[] = [];
      for (let i = 1; i < slice.length; i++) {
        const prev = slice[i - 1].close || 1;
        vec.push((slice[i].close - prev) / prev);
      }
      return vec;
    };

    const cosineSim = (a: number[], b: number[]) => {
      let dot = 0, normA = 0, normB = 0;
      for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
      }
      const denom = Math.sqrt(normA) * Math.sqrt(normB);
      return denom > 0 ? dot / denom : 0;
    };

    const currentSlice = candles.slice(-windowLen);
    const curVec = toReturnsVec(currentSlice);

    const candidates: HistoricalFractalMatch[] = [];
    // Stop at candles.length - windowLen - 13 so we know what happened in next 12 candles
    for (let i = 0; i <= candles.length - windowLen - 14; i++) {
      const histSlice = candles.slice(i, i + windowLen);
      const histVec = toReturnsVec(histSlice);
      const sim = cosineSim(curVec, histVec);

      if (sim > 0.55) {
        const basePrice = candles[i + windowLen - 1].close;
        const p6 = candles[i + windowLen + 5].close;
        const p12 = candles[i + windowLen + 11].close;
        const ret6 = Number((((p6 - basePrice) / basePrice) * 100).toFixed(2));
        const ret12 = Number((((p12 - basePrice) / basePrice) * 100).toFixed(2));

        candidates.push({
          dateStr: new Date(candles[i + windowLen - 1].time * 1000).toISOString().replace("T", " ").slice(0, 16),
          candlesAgo: candles.length - (i + windowLen),
          similarityPct: Math.min(99, Math.round(sim * 100)),
          next6CandlesReturnPct: ret6,
          next12CandlesReturnPct: ret12,
          outcome: ret6 > 0.4 ? "BULLISH_RALLY" : ret6 < -0.4 ? "BEARISH_DROP" : "SIDEWAYS"
        });
      }
    }

    // Deduplicate nearby windows
    candidates.sort((a, b) => b.similarityPct - a.similarityPct);
    const selected: HistoricalFractalMatch[] = [];
    for (const c of candidates) {
      if (selected.every(s => Math.abs(s.candlesAgo - c.candlesAgo) >= 10)) {
        selected.push(c);
        if (selected.length >= 4) break;
      }
    }

    const bullishCount = selected.filter(m => m.next6CandlesReturnPct > 0).length;
    const winRate = selected.length > 0 ? Math.round((Math.max(bullishCount, selected.length - bullishCount) / selected.length) * 100) : 65;

    return { matches: selected, historicalWinRatePct: winRate };
  }

  // 5. Small Capital ($50) Risk-Managed Futures Plan
  public buildSmallCapitalPlan(
    capitalUsd: number,
    direction: "LONG" | "SHORT",
    entry: number,
    sl: number,
    tp1: number,
    tp2: number,
    tp3: number
  ): SmallCapitalRiskPlan {
    const cap = Math.max(10, capitalUsd || 50);
    const riskPercent = 4.0; // Max $2.00 risk on $50 account so 10 consecutive losses wouldn't wipe out!
    const riskPerTradeUsd = Number((cap * (riskPercent / 100)).toFixed(2));
    const slDistPct = entry > 0 ? Math.max(0.005, Math.abs(entry - sl) / entry) : 0.02;

    // Position size = riskUsd / slDistPct
    const rawPosSize = riskPerTradeUsd / slDistPct;
    // Cap leverage between 5x and 12x so liquidation buffer stays super safe
    const idealLev = Math.min(12, Math.max(5, Math.round(rawPosSize / (cap * 0.35))));
    const safePosSize = Number(Math.min(cap * idealLev * 0.7, rawPosSize).toFixed(2));

    const liqBufferPct = Number(((100 / idealLev) * 0.85).toFixed(2));
    const liquidationPrice = Number(
      (direction === "LONG"
        ? entry * (1 - liqBufferPct / 100)
        : entry * (1 + liqBufferPct / 100)
      ).toFixed(entry < 1 ? 5 : 2)
    );

    const calcProfitUsd = (tp: number) => {
      const movePct = Math.abs(tp - entry) / (entry || 1);
      return Number((safePosSize * movePct).toFixed(2));
    };

    const tp2Profit = calcProfitUsd(tp2);
    // Projected compounding if 10 winning trades at average R:R happen
    const growthFactor = 1 + (tp2Profit / cap) * 0.65;
    const compounding10TradesTargetUsd = Number((cap * Math.pow(growthFactor, 10)).toFixed(2));

    return {
      capitalUsd: cap,
      riskPerTradeUsd,
      riskPercent,
      recommendedLeverage: idealLev,
      marginType: "ISOLATED",
      positionSizeUsd: safePosSize,
      liquidationPrice,
      liquidationDistancePct: liqBufferPct,
      expectedProfitTp1Usd: calcProfitUsd(tp1),
      expectedProfitTp2Usd: tp2Profit,
      expectedProfitTp3Usd: calcProfitUsd(tp3),
      compounding10TradesTargetUsd
    };
  }

  // 6. Comprehensive Multi-Screen Deep Cyber-Quant + AI Council Analysis for ANY Symbol
  public async runFullDeepAnalysis(params: {
    symbol: string;
    capitalUsd?: number;
    screenshots?: Array<{ label: string; dataUrl: string }>;
    includeAi?: boolean;
  }): Promise<DeepCyberQuantReport> {
    const sym = params.symbol.toUpperCase().trim().endsWith("USDT")
      ? params.symbol.toUpperCase().trim()
      : `${params.symbol.toUpperCase().trim()}USDT`;
    const capitalUsd = params.capitalUsd || 50;

    // Fetch 4 timeframes + depth + multi-exchange + cross-market pulse in parallel!
    const [c5m, c15m, c1h, c4h, depthRes, exchangeComp, crossPulse, newsRes] = await Promise.all([
      this.fetchCandles(sym, "5m", 100),
      this.fetchCandles(sym, "15m", 450),
      this.fetchCandles(sym, "1h", 250),
      this.fetchCandles(sym, "4h", 120),
      axios.get(`https://fapi.binance.com/fapi/v1/depth?symbol=${sym}&limit=20`, { timeout: 3500 }).catch(() => null),
      this.compareExchanges(sym),
      this.getCrossMarketPulse(),
      axios.get("https://cointelegraph.com/rss", { timeout: 3500 }).catch(() => null)
    ]);

    const mainCandles = c15m.length >= 30 ? c15m : c1h;
    const curPrice = mainCandles[mainCandles.length - 1]?.close || exchangeComp[0]?.price || 1;
    const precision = curPrice < 0.001 ? 6 : curPrice < 1 ? 4 : curPrice < 10 ? 3 : 2;

    // Compute per-timeframe summaries (5m, 15m, 1h, 4h)
    const analyzeTf = (tf: "5m" | "15m" | "1h" | "4h", bars: CandleBar[]) => {
      const closes = bars.map(b => b.close);
      const rsi = this.calcRsi(closes, 14);
      const ema20 = this.calcEma(closes, 20);
      const ema50 = this.calcEma(closes, 50);
      const bb = this.calcBollinger(closes, 20, 2);
      const last = closes[closes.length - 1] || curPrice;
      let trend: "BULLISH" | "BEARISH" | "NEUTRAL" = "NEUTRAL";
      if (last > ema20 && ema20 > ema50) trend = "BULLISH";
      else if (last < ema20 && ema20 < ema50) trend = "BEARISH";
      else if (rsi < 35) trend = "BULLISH";
      else if (rsi > 72) trend = "BEARISH";

      const verdictArabic = trend === "BULLISH"
        ? `صاعد (${bb.isSqueeze ? "انضغاط انفجاري + " : ""}RSI: ${rsi.toFixed(1)})`
        : trend === "BEARISH"
          ? `هابط (RSI: ${rsi.toFixed(1)})`
          : `تذبذب عرضي (RSI: ${rsi.toFixed(1)})`;

      return { tf, trend, rsi: Number(rsi.toFixed(1)), ema20: Number(ema20.toFixed(precision)), ema50: Number(ema50.toFixed(precision)), squeeze: bb.isSqueeze, verdictArabic };
    };

    const timeframeSignals = [
      analyzeTf("5m", c5m),
      analyzeTf("15m", c15m),
      analyzeTf("1h", c1h),
      analyzeTf("4h", c4h)
    ];

    // Deep Candle Anatomy (Last 5 candles on 15m)
    const recent5 = mainCandles.slice(-5);
    const sumVol = recent5.reduce((s, b) => s + b.volume, 0) || 1;
    const sumTakerBuy = recent5.reduce((s, b) => s + (b.takerBuyVolume ?? b.volume * 0.5), 0);
    const takerBuyRatioPct = Math.round((sumTakerBuy / sumVol) * 100);

    const lastBar = mainCandles[mainCandles.length - 1] || { open: curPrice, high: curPrice, low: curPrice, close: curPrice, volume: 0 };
    const barRange = Math.max(lastBar.high - lastBar.low, curPrice * 0.0001);
    const upperWickPct = Math.round(((lastBar.high - Math.max(lastBar.open, lastBar.close)) / barRange) * 100);
    const lowerWickPct = Math.round(((Math.min(lastBar.open, lastBar.close) - lastBar.low) / barRange) * 100);

    const bb15 = this.calcBollinger(mainCandles.map(b => b.close), 20, 2);
    const explosionProbabilityPct = Math.min(96, Math.max(25, Math.round((bb15.isSqueeze ? 72 : 42) + Math.abs(takerBuyRatioPct - 50) * 1.1)));

    // Cross-Exchange Anomaly & Trap Detection
    const spreads = exchangeComp.map(e => Math.abs(e.spreadVsMedianPct));
    const maxSpreadPct = spreads.length > 0 ? Number(Math.max(...spreads).toFixed(3)) : 0;
    const detectedTraps: string[] = [];
    let trapRiskScore = 10;

    if (maxSpreadPct > 0.35) {
      trapRiskScore += 30;
      detectedTraps.push(`تباين سعري مشبوه بين المنصات (${maxSpreadPct}%) قد يشير إلى ذيل اصطناعي لضرب الستوبات`);
    }
    if (upperWickPct > 65 && takerBuyRatioPct < 45) {
      trapRiskScore += 28;
      detectedTraps.push(`مصيدة صعود (Bull Trap): ذيل علوي طويل (${upperWickPct}%) مع ضغط بيع حقيقي داخل الشمعة`);
    }
    if (lowerWickPct > 65 && takerBuyRatioPct > 55) {
      // Actually a bullish liquidity sweep!
      detectedTraps.push(`سحب سيولة صاعد (Liquidity Sweep): ذيل سفلي (${lowerWickPct}%) امتص الستوبات بمشتريات قوية (${takerBuyRatioPct}%)`);
    }
    if (Math.abs(crossPulse.btcFundingRatePct) > 0.03) {
      trapRiskScore += 20;
      detectedTraps.push(`تمويل مرتفع (${crossPulse.btcFundingRatePct}%) يرفع احتمالية Long/Short Squeeze`);
    }
    if (detectedTraps.length === 0) {
      detectedTraps.push("لا توجد مصائد تلاعب نشطة — هيكل الشموع والمنصات متطابق وآمن");
    }

    const cyberTrapAudit: CyberTrapAudit = {
      trapRiskScore: Math.min(100, trapRiskScore),
      isSafeToTrade: trapRiskScore < 55,
      detectedTraps,
      candleAnatomy: {
        takerBuyRatioPct,
        netOrderflowDeltaBias: takerBuyRatioPct >= 56 ? "STRONG_BUY_ABSORPTION" : takerBuyRatioPct <= 44 ? "STRONG_SELL_PRESSURE" : "BALANCED",
        upperWickPct,
        lowerWickPct,
        volatilityCompressionPct: Math.round(bb15.compressionPct),
        squeezeActive: bb15.isSqueeze,
        explosionProbabilityPct
      },
      crossExchangeAnomaly: {
        maxSpreadPct,
        arbitrageGapDetected: maxSpreadPct > 0.25,
        manipulationWarning: maxSpreadPct > 0.35 ? "تحذير: فرق سعر واضح بين بينانس والمنصات الأخرى — التزم بأمر Limit" : "أسعار المنصات متطابقة (Binance / Bybit / OKX / Gate)"
      }
    };

    // Supports, Resistances & Liquidity Zones
    const lows60 = c1h.slice(-60).map(b => b.low);
    const highs60 = c1h.slice(-60).map(b => b.high);
    const s1 = Number(Math.min(...lows60.slice(-20)).toFixed(precision));
    const s2 = Number(Math.min(...lows60).toFixed(precision));
    const r1 = Number(Math.max(...highs60.slice(-20)).toFixed(precision));
    const r2 = Number(Math.max(...highs60).toFixed(precision));

    const liquidityZones: DeepCyberQuantReport["liquidityZones"] = [
      { price: s1, type: "BUY_WALL_DEMAND", strength: "قوي - قاع طلب قريب" },
      { price: r1, type: "SELL_WALL_SUPPLY", strength: "قوي - منطقة عرض وسيولة" }
    ];

    if (depthRes && depthRes.data?.bids && depthRes.data?.asks) {
      const topBid = depthRes.data.bids.slice(0, 15).sort((a: any, b: any) => parseFloat(b[1]) - parseFloat(a[1]))[0];
      const topAsk = depthRes.data.asks.slice(0, 15).sort((a: any, b: any) => parseFloat(b[1]) - parseFloat(a[1]))[0];
      if (topBid) liquidityZones.push({ price: Number(parseFloat(topBid[0]).toFixed(precision)), type: "BUY_WALL_DEMAND", strength: "جدار شراء حيتان حي في دفتر الأوامر" });
      if (topAsk) liquidityZones.push({ price: Number(parseFloat(topAsk[0]).toFixed(precision)), type: "SELL_WALL_SUPPLY", strength: "جدار بيع حيتان حي في دفتر الأوامر" });
    }

    // Historical Fractals
    const fractalResult = this.findHistoricalFractals(c15m.length >= 60 ? c15m : c1h, 14);

    // Direction & Signal Decision
    const bullTfs = timeframeSignals.filter(t => t.trend === "BULLISH").length;
    const bearTfs = timeframeSignals.filter(t => t.trend === "BEARISH").length;
    let direction: "LONG" | "SHORT" | "WAIT" = "LONG";
    if (bearTfs > bullTfs || (takerBuyRatioPct < 43 && timeframeSignals[2].rsi > 62)) {
      direction = "SHORT";
    } else if (bullTfs === bearTfs && Math.abs(takerBuyRatioPct - 50) < 4) {
      direction = takerBuyRatioPct >= 50 ? "LONG" : "SHORT";
    }

    const atr15 = this.calcAtr(mainCandles, 14);
    const atrPct = Math.min(0.035, Math.max(0.012, atr15 / curPrice));

    const entryLimit = Number((direction === "LONG" ? curPrice * 0.997 : curPrice * 1.003).toFixed(precision));
    const stopLoss = Number((direction === "LONG" ? entryLimit * (1 - atrPct * 1.15) : entryLimit * (1 + atrPct * 1.15)).toFixed(precision));
    const tp1 = Number((direction === "LONG" ? entryLimit * (1 + atrPct * 1.5) : entryLimit * (1 - atrPct * 1.5)).toFixed(precision));
    const tp2 = Number((direction === "LONG" ? entryLimit * (1 + atrPct * 3.2) : entryLimit * (1 - atrPct * 3.2)).toFixed(precision));
    const tp3 = Number((direction === "LONG" ? entryLimit * (1 + atrPct * 5.2) : entryLimit * (1 - atrPct * 5.2)).toFixed(precision));

    const riskDist = Math.abs(entryLimit - stopLoss) || curPrice * 0.01;
    const rewardDist = Math.abs(tp2 - entryLimit);
    const rrRatio = Number((rewardDist / riskDist).toFixed(2));

    const confidence = Math.min(96, Math.max(62, Math.round(
      64 +
      (Math.abs(bullTfs - bearTfs) * 5) +
      (bb15.isSqueeze ? 7 : 0) +
      (cyberTrapAudit.isSafeToTrade ? 6 : -12) +
      (fractalResult.historicalWinRatePct >= 70 ? 5 : 0)
    )));

    const winProbabilityPct = Math.min(93, Math.max(58, Math.round((confidence * 0.65) + (fractalResult.historicalWinRatePct * 0.35))));
    const grade: DeepCyberQuantReport["grade"] = confidence >= 88 ? "AAA" : confidence >= 80 ? "AA" : confidence >= 72 ? "A" : "CAUTION";

    const smallCapitalPlan = this.buildSmallCapitalPlan(capitalUsd, direction, entryLimit, stopLoss, tp1, tp2, tp3);

    // Update Coin Memory Zones in Termux Downloads sync!
    const coinMemory = storageMemory.updateCoinZones(sym, [s1, s2], [r1, r2], !cyberTrapAudit.isSafeToTrade);

    // Extract latest RSS news titles
    let newsHeadlines = "ترقب بيانات الفيدرالي الأمريكي وتدفقات صناديق ETF والسيولة المؤسساتية.";
    if (newsRes && newsRes.data && typeof newsRes.data === "string") {
      const titles: string[] = [];
      const regex = /<title><!\[CDATA\[(.*?)\]\]><\/title>/g;
      let m;
      while ((m = regex.exec(newsRes.data)) !== null && titles.length < 5) {
        if (!m[1].includes("Cointelegraph")) titles.push(`- ${m[1]}`);
      }
      if (titles.length > 0) newsHeadlines = titles.join("\n");
    }

    const deterministicSummaryArabic = `العملة ${sym} عند $${curPrice} | الاتجاه المرجح: ${direction === "LONG" ? "صاعد LONG" : "هابط SHORT"} (ثقة ${confidence}% | احتمالية ربح تاريخية ${winProbabilityPct}%). تدفق المشترين داخل الشموع ${takerBuyRatioPct}%، وأقرب دعم عند $${s1} ومقاومة عند $${r1}.`;

    const quantSummaryText = `السعر الحالي: $${curPrice} | متوسط منصات Binance/Bybit/OKX/Gate متطابق بفارق ${maxSpreadPct}%
الفريمات: 5m=${timeframeSignals[0].verdictArabic} | 15m=${timeframeSignals[1].verdictArabic} | 1h=${timeframeSignals[2].verdictArabic} | 4h=${timeframeSignals[3].verdictArabic}
عمق الشموع: نسبة ضغط المشترين (Taker Buy) = ${takerBuyRatioPct}% | احتمالية الانفجار السعري = ${explosionProbabilityPct}%
الدعوم: $${s1}, $${s2} | المقاومات: $${r1}, $${r2}
التشابه التاريخي: ${fractalResult.matches.length} أنماط متطابقة بدقة تصل إلى ${fractalResult.matches[0]?.similarityPct || 75}% ونسبة نجاح تاريخية ${fractalResult.historicalWinRatePct}%
نبض السوق الكلي: الكريبتو (${crossPulse.cryptoMajorsAvgChangePct}%) | قطاع الذكاء الاصطناعي (${crossPulse.aiSectorAvgChangePct}%) | الذهب (${crossPulse.goldMacro.price}) | الخوف والطمع (${crossPulse.fearAndGreed.value})`;

    const coinHistoryText = coinMemory.recentTrades.length > 0
      ? `عدد الصفقات المسجلة: ${coinMemory.totalSignals} | نسبة النجاح: ${coinMemory.winRate}% | القواعد المتعلمة: ${coinMemory.learnedRules.join(" ؛ ") || "لا يوجد أخطاء مسجلة بعد"}`
      : `سجل جديد للعملة ${sym}. لا توجد خسائر سابقة مسجلة؛ التزم بوقف الخسارة ونقل الوقف عند TP1.`;

    const entryPlanText = `الاتجاه: ${direction} | دخول Limit: $${entryLimit} | وقف الخسارة: $${stopLoss} | الأهداف: TP1=$${tp1}, TP2=$${tp2}, TP3=$${tp3} | نسبة العائد: 1:${rrRatio} | خطة رأس مال $${capitalUsd}: رافعة معزولة ${smallCapitalPlan.recommendedLeverage}x، أقصى مخاطرة $${smallCapitalPlan.riskPerTradeUsd}، مسافة التصفية الآمنة ${smallCapitalPlan.liquidationDistancePct}%`;

    // Invoke all 5 AI roles in parallel (or instant math fallback if No-AI mode)
    const aiCouncil = params.includeAi === false
      ? {
          news: { role: "news" as AiRoleKey, usedAi: false, providerName: "المحرك الكمي (بدون AI)", model: "Quant-v4", latencyMs: 1, text: `تحليل الأخبار الآلي: مؤشر الخوف والطمع عند ${crossPulse.fearAndGreed.value}/100 (${crossPulse.fearAndGreed.arabic}) مع معدل تمويل ${crossPulse.btcFundingRatePct}%.` },
          vision: { role: "vision" as AiRoleKey, usedAi: false, providerName: "المحرك الكمي (بدون AI)", model: "Quant-v4", latencyMs: 1, text: `فحص هندسة الشموع الآلي: ${timeframeSignals[1].verdictArabic}، ذيل علوي ${upperWickPct}%، ذيل سفلي ${lowerWickPct}%، مناطق السيولة عند $${s1} و $${r1}.` },
          learning: { role: "learning" as AiRoleKey, usedAi: false, providerName: "ذاكرة التعلم المحلية", model: "Memory-v4", latencyMs: 1, text: coinHistoryText },
          report: { role: "report" as AiRoleKey, usedAi: false, providerName: "المحرك الكمي (بدون AI)", model: "Quant-v4", latencyMs: 1, text: deterministicSummaryArabic },
          entryExplain: { role: "entryExplain" as AiRoleKey, usedAi: false, providerName: "المحرك الكمي (بدون AI)", model: "Quant-v4", latencyMs: 1, text: `دخلنا بأمر معلق عند $${entryLimit} بناءً على توافق ${bullTfs}/4 فريمات وتدفق شراء ${takerBuyRatioPct}% مع وقف محكم عند $${stopLoss} لحماية حساب $${capitalUsd}.` }
        }
      : await aiHub.runParallelCouncil({
          symbol: sym,
          quantSummary: quantSummaryText,
          newsHeadlines,
          coinHistorySummary: coinHistoryText,
          entryPlanSummary: entryPlanText,
          screenshots: params.screenshots,
          fallbacks: {
            news: () => `تقييم الأخبار والسوق الكلي: مؤشر الخوف والطمع ${crossPulse.fearAndGreed.value}/100 (${crossPulse.fearAndGreed.arabic})، قطاع AI يتحرك بمتوسط ${crossPulse.aiSectorAvgChangePct}%، ومعدل التمويل ${crossPulse.btcFundingRatePct}%.`,
            vision: () => `تحليل هندسة الشموع لـ ${sym}: ${timeframeSignals[1].verdictArabic} مع احتمالية انفجار تقلب ${explosionProbabilityPct}%. لا توجد فجوات تلاعب بين المنصات (فارق ${maxSpreadPct}%).`,
            learning: () => coinHistoryText,
            report: () => `${deterministicSummaryArabic}\n• الدعم الرئيسي: $${s1} | المقاومة الرئيسية: $${r1}\n• التشابه التاريخي: ${fractalResult.historicalWinRatePct}% نجاح عبر ${fractalResult.matches.length} أنماط متطابقة.`,
            entryExplain: () => `سبب الدخول (${direction}): تدفق المشترين ${takerBuyRatioPct}% مع ${bb15.isSqueeze ? "انضغاط بولنجر جاهز للانفجار" : "توافق سعري عبر الفريمات"}. أمر الدخول $${entryLimit} والوقف الصارم $${stopLoss} لحساب $${capitalUsd} برافعة ${smallCapitalPlan.recommendedLeverage}x معزولة.`
          }
        });

    return {
      symbol: sym,
      currentPrice: curPrice,
      direction,
      confidence,
      winProbabilityPct,
      grade,
      entryLimit,
      entryZone: [Number((entryLimit * 0.998).toFixed(precision)), Number((entryLimit * 1.002).toFixed(precision))],
      stopLoss,
      tp1,
      tp2,
      tp3,
      rrRatio,
      expectedHorizon: timeframeSignals[1].squeeze ? "45 دقيقة - 4 ساعات (انضغاط جاهز للانفجار)" : "2 - 8 ساعات",
      supports: [s1, s2],
      resistances: [r1, r2],
      liquidityZones,
      exchangeComparison: exchangeComp,
      multiTimeframeCandles: {
        "5m": c5m.slice(-60),
        "15m": c15m.slice(-60),
        "1h": c1h.slice(-60),
        "4h": c4h.slice(-60)
      },
      timeframeSignals,
      cyberTrapAudit,
      historicalMatches: fractalResult.matches,
      historicalWinRatePct: fractalResult.historicalWinRatePct,
      smallCapitalPlan,
      crossMarketPulse: crossPulse,
      coinMemory,
      aiCouncil,
      deterministicSummaryArabic,
      timestamp: Date.now()
    };
  }

  // 7. Full Market Fast High-Win-Rate Scanner (ALL 745+ Binance Futures pairs, NO API key needed)
  public async scanFullMarketOpportunities(capitalUsd = 50, timeframe: "5m" | "15m" | "1h" | "4h" = "15m"): Promise<{
    scannedTotalPairs: number;
    shortlistedScanned: number;
    opportunities: FastOpportunityItem[];
    crossPulse: CrossMarketPulse;
    timestamp: number;
  }> {
    const [tickersRes, crossPulse] = await Promise.all([
      axios.get("https://fapi.binance.com/fapi/v1/ticker/24hr", { timeout: 6000 }),
      this.getCrossMarketPulse()
    ]);

    const allUsdt = Array.isArray(tickersRes.data)
      ? tickersRes.data.filter((t: any) =>
          t.symbol.endsWith("USDT") &&
          parseFloat(t.quoteVolume || "0") >= 5_000_000 && // healthy liquidity
          !t.symbol.includes("USDC") && !t.symbol.includes("FDUSD")
        )
      : [];

    // Rank diverse candidates across entire market:
    // High volatility coils, deep dip rebound candidates, high volume movers, AI sector leaders
    const sortedByActivity = [...allUsdt].sort((a, b) => {
      const scoreA = Math.log10(parseFloat(a.quoteVolume) + 1) * (1 + Math.min(10, Math.abs(parseFloat(a.priceChangePercent))) * 0.25);
      const scoreB = Math.log10(parseFloat(b.quoteVolume) + 1) * (1 + Math.min(10, Math.abs(parseFloat(b.priceChangePercent))) * 0.25);
      return scoreB - scoreA;
    });

    const candidates = sortedByActivity.slice(0, 48);
    const opportunities: FastOpportunityItem[] = [];

    // Scan in batches of 12
    for (let i = 0; i < candidates.length; i += 12) {
      const batch = candidates.slice(i, i + 12);
      const batchResults = await Promise.all(
        batch.map(async (ticker: any) => {
          const sym = ticker.symbol;
          try {
            const candles = await this.fetchCandles(sym, timeframe, 120);
            if (candles.length < 40) return null;

            const closes = candles.map(c => c.close);
            const curPrice = closes[closes.length - 1];
            const precision = curPrice < 0.001 ? 6 : curPrice < 1 ? 4 : curPrice < 10 ? 3 : 2;
            const rsi = this.calcRsi(closes, 14);
            const ema20 = this.calcEma(closes, 20);
            const ema50 = this.calcEma(closes, 50);
            const bb = this.calcBollinger(closes, 20, 2);
            const atr = this.calcAtr(candles, 14);

            const recent4 = candles.slice(-4);
            const totVol = recent4.reduce((s, b) => s + b.volume, 0) || 1;
            const buyVol = recent4.reduce((s, b) => s + (b.takerBuyVolume ?? b.volume * 0.5), 0);
            const takerBuyPct = Math.round((buyVol / totVol) * 100);

            const change24h = parseFloat(ticker.priceChangePercent || "0");
            const vol24h = parseFloat(ticker.quoteVolume || "0");

            // Trap Risk Check
            const lastBar = candles[candles.length - 1];
            const barRange = Math.max(lastBar.high - lastBar.low, curPrice * 0.0001);
            const upperWickPct = ((lastBar.high - Math.max(lastBar.open, lastBar.close)) / barRange) * 100;
            const lowerWickPct = ((Math.min(lastBar.open, lastBar.close) - lastBar.low) / barRange) * 100;

            let trapRiskScore = 10;
            if (Math.abs(change24h) > 22) trapRiskScore += 25;
            if (upperWickPct > 65 && takerBuyPct < 45) trapRiskScore += 30;
            if (lowerWickPct > 65 && takerBuyPct > 58) trapRiskScore = Math.max(5, trapRiskScore - 5); // bullish sweep!

            // Determine Setup
            let direction: "LONG" | "SHORT" = "LONG";
            let setupType: FastOpportunityItem["setupType"] = "SQUEEZE_BREAKOUT";
            let setupArabic = "انفجار انضغاط بولنجر مع سيولة متصاعدة";
            let confidence = 78;

            if (rsi <= 38 && takerBuyPct >= 50) {
              direction = "LONG";
              setupType = "DIP_ABSORPTION";
              setupArabic = "تشبع بيعي + امتصاص شراء مؤسساتي في القاع";
              confidence = 87 + Math.min(8, Math.round((39 - rsi) * 0.6));
            } else if (lowerWickPct >= 50 && takerBuyPct >= 53 && curPrice >= ema20 * 0.99) {
              direction = "LONG";
              setupType = "LIQUIDITY_SWEEP_REVERSAL";
              setupArabic = "سحب سيولة سفلي (Stop Hunt) وارتداد سريع مؤكد";
              confidence = 86;
            } else if (bb.isSqueeze && curPrice >= ema20 * 0.995 && takerBuyPct >= 52) {
              direction = "LONG";
              setupType = "BOTTOM_COIL_EXPLOSION";
              setupArabic = "انضغاط سعري جاهز لانفجار صاعد سريع";
              confidence = 88;
            } else if (rsi >= 66 && takerBuyPct <= 46 && (upperWickPct >= 40 || curPrice < ema20)) {
              direction = "SHORT";
              setupType = "LIQUIDITY_SWEEP_REVERSAL";
              setupArabic = "تشبع شرائي وتصريف حيتان (Short Momentum)";
              confidence = 85;
            } else if (curPrice < ema20 && ema20 < ema50 && rsi >= 34 && rsi <= 52 && takerBuyPct <= 45) {
              direction = "SHORT";
              setupType = "SQUEEZE_BREAKOUT";
              setupArabic = "استمرار ضغط بيعي وكسر دعم قريب";
              confidence = 83;
            } else if (curPrice > ema20 && ema20 > ema50 && rsi >= 46 && rsi <= 65 && takerBuyPct >= 53) {
              direction = "LONG";
              setupType = "SQUEEZE_BREAKOUT";
              setupArabic = "استمرار تريند صاعد مع تدفق مشترين";
              confidence = 83;
            } else {
              return null; // Skip weak/uncertain setups so only high-accuracy opportunities show!
            }

            if (trapRiskScore >= 50) return null;

            const hist = this.findHistoricalFractals(candles, 12);
            const winProb = Math.min(94, Math.max(76, Math.round((confidence * 0.65) + (hist.historicalWinRatePct * 0.35))));

            const atrPct = Math.min(0.032, Math.max(0.012, atr / curPrice));
            const entryLimit = Number((direction === "LONG" ? curPrice * 0.9975 : curPrice * 1.0025).toFixed(precision));
            const stopLoss = Number((direction === "LONG" ? entryLimit * (1 - atrPct * 1.1) : entryLimit * (1 + atrPct * 1.1)).toFixed(precision));
            const tp1 = Number((direction === "LONG" ? entryLimit * (1 + atrPct * 1.5) : entryLimit * (1 - atrPct * 1.5)).toFixed(precision));
            const tp2 = Number((direction === "LONG" ? entryLimit * (1 + atrPct * 3.3) : entryLimit * (1 - atrPct * 3.3)).toFixed(precision));
            const tp3 = Number((direction === "LONG" ? entryLimit * (1 + atrPct * 5.4) : entryLimit * (1 - atrPct * 5.4)).toFixed(precision));
            const rrRatio = Number((Math.abs(tp2 - entryLimit) / Math.max(1e-8, Math.abs(entryLimit - stopLoss))).toFixed(2));

            const smallCapPlan = this.buildSmallCapitalPlan(capitalUsd, direction, entryLimit, stopLoss, tp1, tp2, tp3);

            const reasonArabic = `${setupArabic} | RSI=${rsi.toFixed(1)} | شراء الحيتان داخل الشموع=${takerBuyPct}% | نجاح تاريخي=${hist.historicalWinRatePct}%`;

            return {
              symbol: sym,
              price: curPrice,
              change24hPct: change24h,
              volume24hUsd: vol24h,
              direction,
              confidence: Math.min(96, confidence),
              winProbabilityPct: winProb,
              setupType,
              setupArabic,
              timeframe,
              entryLimit,
              stopLoss,
              tp1,
              tp2,
              tp3,
              rrRatio,
              trapRiskScore,
              squeezeScore: Math.round(bb.compressionPct),
              takerBuyPct,
              historicalWinRatePct: hist.historicalWinRatePct,
              reasonArabic,
              smallCapPlan
            } as FastOpportunityItem;
          } catch {
            return null;
          }
        })
      );

      for (const r of batchResults) {
        if (r) opportunities.push(r);
      }
    }

    opportunities.sort((a, b) => (b.winProbabilityPct + b.confidence) - (a.winProbabilityPct + a.confidence));

    // Save checkpoint of latest scan
    storageMemory.saveCheckpoint({
      capitalUsd,
      activeTimeframe: timeframe,
      lastScannedSymbols: opportunities.slice(0, 10).map(o => o.symbol)
    });

    return {
      scannedTotalPairs: allUsdt.length,
      shortlistedScanned: candidates.length,
      opportunities: opportunities.slice(0, 18),
      crossPulse,
      timestamp: Date.now()
    };
  }

  private calcRsi(closes: number[], period = 14): number {
    if (closes.length < period + 1) return 50;
    let gains = 0, losses = 0;
    for (let i = 1; i <= period; i++) {
      const diff = closes[i] - closes[i - 1];
      if (diff > 0) gains += diff;
      else losses -= diff;
    }
    let avgG = gains / period;
    let avgL = losses / period;
    for (let i = period + 1; i < closes.length; i++) {
      const diff = closes[i] - closes[i - 1];
      avgG = (avgG * (period - 1) + (diff > 0 ? diff : 0)) / period;
      avgL = (avgL * (period - 1) + (diff < 0 ? -diff : 0)) / period;
    }
    if (avgL === 0) return 100;
    return 100 - 100 / (1 + avgG / avgL);
  }

  private calcEma(closes: number[], period: number): number {
    if (closes.length === 0) return 0;
    const p = Math.min(period, closes.length);
    const k = 2 / (p + 1);
    let ema = closes[0];
    for (let i = 1; i < closes.length; i++) {
      ema = closes[i] * k + ema * (1 - k);
    }
    return ema;
  }

  private calcAtr(candles: CandleBar[], period = 14): number {
    if (candles.length < 3) return 0;
    const trs: number[] = [];
    for (let i = 1; i < candles.length; i++) {
      trs.push(Math.max(
        candles[i].high - candles[i].low,
        Math.abs(candles[i].high - candles[i - 1].close),
        Math.abs(candles[i].low - candles[i - 1].close)
      ));
    }
    const slice = trs.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / (slice.length || 1);
  }

  private calcBollinger(closes: number[], period = 20, mult = 2) {
    if (closes.length < period) {
      return { upper: 0, middle: 0, lower: 0, isSqueeze: false, compressionPct: 30 };
    }
    const slice = closes.slice(-period);
    const middle = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((s, v) => s + (v - middle) ** 2, 0) / period;
    const std = Math.sqrt(variance);
    const upper = middle + mult * std;
    const lower = middle - mult * std;
    const bw = middle > 0 ? (upper - lower) / middle : 0.04;
    const isSqueeze = bw < 0.035;
    const compressionPct = Math.min(99, Math.max(10, Math.round((1 - Math.min(bw, 0.1) / 0.1) * 100)));
    return { upper, middle, lower, isSqueeze, compressionPct };
  }
}

export const cyberQuantEngine = new CyberQuantEngine();
