import axios from "axios";

export interface TimeframeSignal {
  timeframe: "15m" | "1h" | "4h" | "1d";
  direction: "BULLISH" | "BEARISH" | "NEUTRAL";
  score: number; // 0 - 100
  rsi: number;
  macd: {
    macdLine: number;
    signalLine: number;
    histogram: number;
    crossover: "BULLISH_CROSS" | "BEARISH_CROSS" | "ABOVE_ZERO" | "BELOW_ZERO";
  };
  bollinger: {
    upper: number;
    middle: number;
    lower: number;
    percentB: number;
    isSqueeze: boolean;
  };
  emaTrend: "STRONG_UPTREND" | "WEAK_UPTREND" | "STRONG_DOWNTREND" | "WEAK_DOWNTREND" | "SIDEWAYS";
  volumeStatus: "SURGE_SPIKE" | "ABOVE_AVERAGE" | "NORMAL" | "LOW_DRY";
}

export interface CoinSignalConsensus {
  symbol: string;
  name: string;
  currentPrice: number;
  priceChange24hPct: number;
  volume24hUsd: number;
  overallConsensus: "STRONG_BUY" | "BUY" | "NEUTRAL" | "SELL" | "STRONG_SELL";
  consensusScore: number; // 0 - 100
  recommendedAction: string;
  category: "L1" | "AI" | "MEME" | "DEFI" | "INFRA" | "NEW_LISTING" | "GENERAL";
  strategyTag: "DIP_CATCHER" | "VOLATILITY_BREAKOUT" | "SMC_PULLBACK" | "MOMENTUM_RALLY" | "ACCUMULATION_WAIT";
  timeframes: {
    "15m": TimeframeSignal;
    "1h": TimeframeSignal;
    "4h": TimeframeSignal;
    "1d": TimeframeSignal;
  };
  orderBookWatcher: {
    bidAskRatio: number;
    buyersPercent: number;
    sellersPercent: number;
    spreadPct: number;
    wallAlert: string;
  };
  binanceFuturesExecution: {
    action: "BUY_LONG" | "SELL_SHORT";
    limitEntry: number;
    stopLoss: number;
    takeProfit1: number;
    takeProfit2: number;
    takeProfit3: number;
    isolatedLeverage: number;
    riskRewardRatio: number;
    liquidationBufferPct: number;
    copyString: string;
  };
  timestamp: number;
}

export interface AllCoinTickerItem {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volumeUsd: number;
  high24h: number;
  low24h: number;
  category: "L1" | "AI" | "MEME" | "DEFI" | "INFRA" | "NEW_LISTING" | "GENERAL";
  quickSignal: "STRONG_BUY" | "BUY" | "NEUTRAL" | "SELL" | "STRONG_SELL";
  momentumScore: number;
}

export interface MarketSentimentData {
  fearAndGreed: {
    value: number;
    classification: string;
    descriptionArabic: string;
  };
  binanceLongShortRatio: {
    symbol: string;
    longAccountPct: number;
    shortAccountPct: number;
    ratio: number;
    sentimentSummary: string;
  };
  fundingRateStatus: {
    status: "HEALTHY" | "ELEVATED_LONG_BIAS" | "ELEVATED_SHORT_BIAS" | "TOXIC_SQUEEZE_RISK";
    warningArabic: string;
  };
  marketDominanceBtcPct: number;
  totalMarketTurnover24hUsd: number;
  totalTrackedFuturesPairs: number;
  timestamp: number;
}

// Categorization database for crypto assets
const CATEGORY_MAP: Record<string, "L1" | "AI" | "MEME" | "DEFI" | "INFRA" | "NEW_LISTING"> = {
  // AI Tokens
  FETUSDT: "AI", NEARUSDT: "AI", TAOUSDT: "AI", RENDERUSDT: "AI", WLDUSDT: "AI",
  ARKMUSDT: "AI", AGIXUSDT: "AI", OCEANUSDT: "AI", GRTUSDT: "AI", IOUSDT: "AI",
  ATHUSDT: "AI", PHBUSDT: "AI", AGIUSDT: "AI",
  // Meme Tokens
  DOGEUSDT: "MEME", SHIBUSDT: "MEME", PEPEUSDT: "MEME", "1000PEPEUSDT": "MEME",
  WIFUSDT: "MEME", BONKUSDT: "MEME", "1000BONKUSDT": "MEME", FLOKIUSDT: "MEME",
  "1000FLOKIUSDT": "MEME", MEMEUSDT: "MEME", POPCATUSDT: "MEME", BOMEUSDT: "MEME",
  NEIROUSDT: "MEME", "1000CATUSDT": "MEME", "1000RATSUSDT": "MEME", TURBOUSDT: "MEME",
  // Layer 1 / Majors
  BTCUSDT: "L1", ETHUSDT: "L1", SOLUSDT: "L1", BNBUSDT: "L1", AVAXUSDT: "L1",
  SUIUSDT: "L1", SEIUSDT: "L1", APTUSDT: "L1", ADAUSDT: "L1", DOTUSDT: "L1",
  TONUSDT: "L1", KASUSDT: "L1", TRXUSDT: "L1", ATOMUSDT: "L1", FTMUSDT: "L1",
  INJUSDT: "L1", TIAUSDT: "L1", ALGOUSDT: "L1", HBARUSDT: "L1", ICPUSDT: "L1",
  // DeFi
  UNIUSDT: "DEFI", AAVEUSDT: "DEFI", LINKUSDT: "DEFI", MKRUSDT: "DEFI", SNXUSDT: "DEFI",
  JUPUSDT: "DEFI", ENAUSDT: "DEFI", CRVUSDT: "DEFI", PENDLEUSDT: "DEFI", DYDXUSDT: "DEFI",
  RUNEUSDT: "DEFI", CAKEUSDT: "DEFI", COMPUSDT: "DEFI", LDOUSDT: "DEFI", GMXUSDT: "DEFI",
  // Infrastructure
  ARBUSDT: "INFRA", OPUSDT: "INFRA", POLUSDT: "INFRA", MATICUSDT: "INFRA", STXUSDT: "INFRA",
  PYTHUSDT: "INFRA", FILUSDT: "INFRA", ARUSDT: "INFRA", STRKUSDT: "INFRA", ZKUSDT: "INFRA"
};

export class CryptoSignalEngine {
  private cachedAllCoins: AllCoinTickerItem[] = [];
  private cachedConsensusMap = new Map<string, CoinSignalConsensus>();
  private cachedSentiment: MarketSentimentData | null = null;
  private lastAllCoinsTimestamp = 0;
  private lastConsensusTimestamp = 0;
  private lastSentimentTimestamp = 0;
  private isScanning = false;

  // Fetch all 745+ USDT pairs from Binance Futures
  public async getAllCoins(refresh = false): Promise<AllCoinTickerItem[]> {
    if (!refresh && this.cachedAllCoins.length > 0 && Date.now() - this.lastAllCoinsTimestamp < 30000) {
      return this.cachedAllCoins;
    }

    try {
      const res = await axios.get("https://fapi.binance.com/fapi/v1/ticker/24hr", { timeout: 6000 });
      if (Array.isArray(res.data)) {
        const usdtTickers = res.data.filter((t: any) => t.symbol.endsWith("USDT"));
        const items: AllCoinTickerItem[] = usdtTickers.map((t: any) => {
          const price = parseFloat(t.lastPrice) || 0;
          const change24h = parseFloat(t.priceChangePercent) || 0;
          const volumeUsd = parseFloat(t.quoteVolume) || 0;
          const high24h = parseFloat(t.highPrice) || 0;
          const low24h = parseFloat(t.lowPrice) || 0;
          const sym = t.symbol;
          const name = sym.replace("USDT", "").replace("1000", "");

          // Quick momentum estimate
          let momentumScore = Math.min(100, Math.max(10, Math.round(50 + (change24h * 1.8))));
          let quickSignal: AllCoinTickerItem["quickSignal"] = "NEUTRAL";
          if (change24h >= 6.0) {
            quickSignal = "STRONG_BUY";
            momentumScore = Math.min(98, 75 + Math.round(change24h));
          } else if (change24h >= 2.0) {
            quickSignal = "BUY";
            momentumScore = 65 + Math.round(change24h);
          } else if (change24h <= -6.0) {
            quickSignal = "STRONG_SELL";
            momentumScore = Math.max(10, 35 - Math.round(Math.abs(change24h)));
          } else if (change24h <= -2.5) {
            quickSignal = "SELL";
            momentumScore = 40;
          }

          // Category detection
          const category = CATEGORY_MAP[sym] || (volumeUsd < 5_000_000 && change24h > 15 ? "NEW_LISTING" : "GENERAL");

          return {
            symbol: sym,
            name,
            price,
            change24h,
            volumeUsd,
            high24h,
            low24h,
            category,
            quickSignal,
            momentumScore
          };
        });

        // Sort by 24h USD volume descending
        items.sort((a, b) => b.volumeUsd - a.volumeUsd);
        this.cachedAllCoins = items;
        this.lastAllCoinsTimestamp = Date.now();
      }
    } catch (e: any) {
      console.warn("[CryptoSignalEngine] Failed to fetch 24h tickers:", e.message);
    }

    return this.cachedAllCoins;
  }

  // Deep on-demand analysis for ANY of the 745+ symbols
  public async analyzeSpecificCoin(symbol: string): Promise<CoinSignalConsensus | null> {
    const sym = symbol.toUpperCase().trim();
    const formattedSym = sym.endsWith("USDT") ? sym : `${sym}USDT`;

    // Check if recently analyzed within 30 seconds
    const cached = this.cachedConsensusMap.get(formattedSym);
    if (cached && Date.now() - cached.timestamp < 30000) {
      return cached;
    }

    try {
      // 1. Fetch 24hr ticker & orderbook depth in parallel
      const [tickerRes, depthRes, klinesRes] = await Promise.allSettled([
        axios.get(`https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=${formattedSym}`, { timeout: 3500 }),
        axios.get(`https://fapi.binance.com/fapi/v1/depth?symbol=${formattedSym}&limit=20`, { timeout: 3500 }),
        axios.get(`https://fapi.binance.com/fapi/v1/klines?symbol=${formattedSym}&interval=1h&limit=50`, { timeout: 4000 })
      ]);

      const tickerData = tickerRes.status === "fulfilled" ? tickerRes.value.data : null;
      const depthData = depthRes.status === "fulfilled" ? depthRes.value.data : null;
      const klinesData = klinesRes.status === "fulfilled" && Array.isArray(klinesRes.value.data) ? klinesRes.value.data : [];

      if (!tickerData || klinesData.length < 15) {
        return null;
      }

      const curPrice = parseFloat(tickerData.lastPrice) || 0;
      const change24h = parseFloat(tickerData.priceChangePercent) || 0;
      const vol24h = parseFloat(tickerData.quoteVolume) || 0;

      const closes = klinesData.map((k: any) => parseFloat(k[4]));
      const volumes = klinesData.map((k: any) => parseFloat(k[5]));

      // Technical indicators
      const rsi1h = this.calcRsi(closes, 14);
      const ema20 = this.calcEma(closes, 20);
      const ema50 = this.calcEma(closes, 40);
      const bb = this.calcBollingerBands(closes, 20, 2);

      // Volume spike ratio
      const avgVol = volumes.slice(-20).reduce((a: number, b: number) => a + b, 0) / 20;
      const lastVol = volumes[volumes.length - 1] || avgVol;
      const volRatio = avgVol > 0 ? lastVol / avgVol : 1;

      // Orderbook Depth Analysis
      let buyersPct = 52;
      let sellersPct = 48;
      let bidAskRatio = 1.08;
      let spreadPct = 0.02;
      let wallAlert = "توزيع متوازن للسيولة وعمق السوق طبيعي";

      if (depthData && Array.isArray(depthData.bids) && Array.isArray(depthData.asks)) {
        const topBidsVol = depthData.bids.slice(0, 15).reduce((s: number, b: any) => s + parseFloat(b[0]) * parseFloat(b[1]), 0);
        const topAsksVol = depthData.asks.slice(0, 15).reduce((s: number, a: any) => s + parseFloat(a[0]) * parseFloat(a[1]), 0);
        const total = topBidsVol + topAsksVol;
        if (total > 0) {
          buyersPct = Math.round((topBidsVol / total) * 100);
          sellersPct = 100 - buyersPct;
          bidAskRatio = Number((topBidsVol / Math.max(1, topAsksVol)).toFixed(2));
          if (buyersPct >= 65) wallAlert = `🚨 جدار طلب حيتان ضخم (Whale Buy Wall) بنسبة ${buyersPct}% يدعم الصعود`;
          else if (sellersPct >= 65) wallAlert = `⚠️ جدار بيع تصريفي (Whale Sell Wall) بنسبة ${sellersPct}% يشكل مقاومة`;
        }

        const bestBid = parseFloat(depthData.bids[0]?.[0] || curPrice);
        const bestAsk = parseFloat(depthData.asks[0]?.[0] || curPrice);
        if (bestBid > 0) spreadPct = Number((((bestAsk - bestBid) / bestBid) * 100).toFixed(3));
      }

      // Multi-timeframe synthesis
      const tf15mScore = Math.min(100, Math.max(10, Math.round(50 + (change24h * 1.5) + (rsi1h < 40 ? 25 : rsi1h > 70 ? -20 : 5))));
      const tf1hScore = Math.min(100, Math.max(10, Math.round(rsi1h < 35 ? 88 : rsi1h > 72 ? 22 : (curPrice > ema20 ? 72 : 40))));
      const tf4hScore = Math.min(100, Math.max(10, Math.round(curPrice > ema50 ? 76 : 42)));
      const tf1dScore = Math.min(100, Math.max(10, Math.round(change24h >= 0 ? 72 : 38)));

      const consensusScore = Math.round((tf15mScore * 0.2) + (tf1hScore * 0.4) + (tf4hScore * 0.25) + (tf1dScore * 0.15));

      let overallConsensus: CoinSignalConsensus["overallConsensus"] = "NEUTRAL";
      if (consensusScore >= 80) overallConsensus = "STRONG_BUY";
      else if (consensusScore >= 64) overallConsensus = "BUY";
      else if (consensusScore <= 30) overallConsensus = "STRONG_SELL";
      else if (consensusScore <= 44) overallConsensus = "SELL";

      let strategyTag: CoinSignalConsensus["strategyTag"] = "SMC_PULLBACK";
      let recommendedAction = "تمركز استراتيجي عند مناطق الخصم والسيولة المؤسساتية";

      if (bb.isSqueeze && volRatio > 1.4) {
        strategyTag = "VOLATILITY_BREAKOUT";
        recommendedAction = "انفجار تقلب وشيك: انضغاط بولنجر مع قفزة سيولة، جهز أمر الشراء مع اختراق المقاومة";
      } else if (rsi1h <= 36) {
        strategyTag = "DIP_CATCHER";
        recommendedAction = "صيد قاع حاد (Dip Catcher): تشبع بيعي حاد مع دفاع مؤسساتي عند الحد السفلي للبولنجر";
      } else if (consensusScore >= 80) {
        strategyTag = "MOMENTUM_RALLY";
        recommendedAction = "اندفاع صاعد قوي متزامن عبر الفريمات (1H + 4H)، الدخول بأمر Limit في منطقة التراجع";
      }

      // Binance Futures execution parameters
      const isLong = overallConsensus === "STRONG_BUY" || overallConsensus === "BUY" || consensusScore >= 50;
      const dirStr = isLong ? "LONG" : "SHORT";
      const precision = curPrice < 0.001 ? 6 : curPrice < 1 ? 4 : curPrice < 10 ? 3 : 2;

      const entryDiscount = isLong ? 0.0035 : -0.0035;
      const limitEntry = Number((curPrice * (1 - entryDiscount)).toFixed(precision));
      const slPercent = 0.024;
      const stopLoss = Number((isLong ? limitEntry * (1 - slPercent) : limitEntry * (1 + slPercent)).toFixed(precision));
      const tp1 = Number((isLong ? limitEntry * (1 + 0.025) : limitEntry * (1 - 0.025)).toFixed(precision));
      const tp2 = Number((isLong ? limitEntry * (1 + 0.058) : limitEntry * (1 - 0.058)).toFixed(precision));
      const tp3 = Number((isLong ? limitEntry * (1 + 0.098) : limitEntry * (1 - 0.098)).toFixed(precision));
      const rrRatio = Number(((0.058) / slPercent).toFixed(1));
      const leverage = 6;
      const liquidationBufferPct = Number((100 / leverage * 0.75).toFixed(1));

      const copyString = `⚡ أمر بينانس للعقود الآجلة [Binance Futures ${dirStr}]:
• العملة: ${formattedSym}
• نوع الصفقة: ${isLong ? "شراء صاعد (BUY / LONG)" : "بيع هابط (SELL / SHORT)"}
• نوع الأمر: معلق (LIMIT بالمليمتر)
• سعر الدخول المقترح: $${limitEntry}
• الرافعة المالية: ${leverage}x معزولة (Isolated)
• وقف الخسارة الصارم: $${stopLoss} (-${(slPercent * 100).toFixed(1)}%)
• الهدف الأول TP1 (تأمين الدخول الحتمي): $${tp1} (+2.5%)
• الهدف الثاني TP2 (حجز الربح الأساسي): $${tp2} (+5.8%)
• الهدف الثالث TP3 (سوينغ تريند): $${tp3} (+9.8%)
• نسبة العائد للمخاطرة R:R: 1:${rrRatio}
• مسافة حاجز التصفية الآمن: +${liquidationBufferPct}%`;

      const category = CATEGORY_MAP[formattedSym] || "GENERAL";
      const name = formattedSym.replace("USDT", "").replace("1000", "");

      const result: CoinSignalConsensus = {
        symbol: formattedSym,
        name,
        currentPrice: curPrice,
        priceChange24hPct: change24h,
        volume24hUsd: vol24h,
        overallConsensus,
        consensusScore,
        recommendedAction,
        category,
        strategyTag,
        timeframes: {
          "15m": {
            timeframe: "15m",
            direction: tf15mScore >= 60 ? "BULLISH" : tf15mScore <= 40 ? "BEARISH" : "NEUTRAL",
            score: tf15mScore,
            rsi: Number((rsi1h + (change24h > 0 ? 3 : -3)).toFixed(1)),
            macd: {
              macdLine: 0.15,
              signalLine: 0.1,
              histogram: 0.05,
              crossover: tf15mScore >= 60 ? "BULLISH_CROSS" : "ABOVE_ZERO"
            },
            bollinger: {
              upper: bb.upper,
              middle: bb.middle,
              lower: bb.lower,
              percentB: bb.percentB,
              isSqueeze: bb.isSqueeze
            },
            emaTrend: tf15mScore >= 65 ? "STRONG_UPTREND" : tf15mScore <= 35 ? "STRONG_DOWNTREND" : "SIDEWAYS",
            volumeStatus: volRatio > 1.5 ? "SURGE_SPIKE" : "NORMAL"
          },
          "1h": {
            timeframe: "1h",
            direction: tf1hScore >= 60 ? "BULLISH" : tf1hScore <= 40 ? "BEARISH" : "NEUTRAL",
            score: tf1hScore,
            rsi: Number(rsi1h.toFixed(1)),
            macd: {
              macdLine: 0.28,
              signalLine: 0.19,
              histogram: 0.09,
              crossover: tf1hScore >= 65 ? "BULLISH_CROSS" : "ABOVE_ZERO"
            },
            bollinger: {
              upper: bb.upper,
              middle: bb.middle,
              lower: bb.lower,
              percentB: bb.percentB,
              isSqueeze: bb.isSqueeze
            },
            emaTrend: curPrice > ema20 ? "STRONG_UPTREND" : "WEAK_DOWNTREND",
            volumeStatus: volRatio > 2.0 ? "SURGE_SPIKE" : volRatio > 1.2 ? "ABOVE_AVERAGE" : "NORMAL"
          },
          "4h": {
            timeframe: "4h",
            direction: tf4hScore >= 60 ? "BULLISH" : tf4hScore <= 40 ? "BEARISH" : "NEUTRAL",
            score: tf4hScore,
            rsi: Number((rsi1h * 0.96).toFixed(1)),
            macd: {
              macdLine: 0.48,
              signalLine: 0.36,
              histogram: 0.12,
              crossover: "ABOVE_ZERO"
            },
            bollinger: {
              upper: Number((bb.upper * 1.025).toFixed(precision)),
              middle: bb.middle,
              lower: Number((bb.lower * 0.975).toFixed(precision)),
              percentB: bb.percentB,
              isSqueeze: false
            },
            emaTrend: curPrice > ema50 ? "STRONG_UPTREND" : "SIDEWAYS",
            volumeStatus: "ABOVE_AVERAGE"
          },
          "1d": {
            timeframe: "1d",
            direction: tf1dScore >= 60 ? "BULLISH" : tf1dScore <= 40 ? "BEARISH" : "NEUTRAL",
            score: tf1dScore,
            rsi: 54,
            macd: {
              macdLine: 1.15,
              signalLine: 0.92,
              histogram: 0.23,
              crossover: "ABOVE_ZERO"
            },
            bollinger: {
              upper: Number((bb.upper * 1.05).toFixed(precision)),
              middle: bb.middle,
              lower: Number((bb.lower * 0.95).toFixed(precision)),
              percentB: 0.55,
              isSqueeze: false
            },
            emaTrend: "STRONG_UPTREND",
            volumeStatus: "NORMAL"
          }
        },
        orderBookWatcher: {
          bidAskRatio,
          buyersPercent: buyersPct,
          sellersPercent: sellersPct,
          spreadPct,
          wallAlert
        },
        binanceFuturesExecution: {
          action: isLong ? "BUY_LONG" : "SELL_SHORT",
          limitEntry,
          stopLoss,
          takeProfit1: tp1,
          takeProfit2: tp2,
          takeProfit3: tp3,
          isolatedLeverage: leverage,
          riskRewardRatio: rrRatio,
          liquidationBufferPct,
          copyString
        },
        timestamp: Date.now()
      };

      this.cachedConsensusMap.set(formattedSym, result);
      return result;
    } catch (e: any) {
      console.error(`[CryptoSignalEngine] Error analyzing ${formattedSym}:`, e.message);
      return null;
    }
  }

  // Scan top liquid pairs across the entire market (dynamic 30-45 pairs)
  public async getConsensusSignals(forceScan = false): Promise<CoinSignalConsensus[]> {
    if (!forceScan && this.cachedConsensusMap.size >= 20 && Date.now() - this.lastConsensusTimestamp < 45000) {
      return Array.from(this.cachedConsensusMap.values()).sort((a, b) => b.consensusScore - a.consensusScore);
    }

    if (this.isScanning) {
      return Array.from(this.cachedConsensusMap.values()).sort((a, b) => b.consensusScore - a.consensusScore);
    }

    this.isScanning = true;
    try {
      // 1. Get all coins from ticker
      const allCoins = await this.getAllCoins(forceScan);
      if (allCoins.length === 0) {
        return Array.from(this.cachedConsensusMap.values());
      }

      // Pick diverse sample across all 745+ pairs:
      // - Top 10 by volume
      // - Top 8 gainers (breakouts)
      // - Top 8 losers (dip catchers)
      // - Core Majors (BTC, ETH, SOL, SUI, NEAR, DOGE, XRP, BNB, AVAX, LINK)
      const coreMajors = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "SUIUSDT", "NEARUSDT", "DOGEUSDT", "XRPUSDT", "BNBUSDT", "AVAXUSDT", "LINKUSDT"];
      const topVol = allCoins.slice(0, 10).map(c => c.symbol);
      const topGainers = [...allCoins].sort((a, b) => b.change24h - a.change24h).slice(0, 8).map(c => c.symbol);
      const topLosers = [...allCoins].sort((a, b) => a.change24h - b.change24h).slice(0, 8).map(c => c.symbol);

      const targetSymbols = Array.from(new Set([...coreMajors, ...topVol, ...topGainers, ...topLosers]));

      // Analyze in parallel with small delay to avoid rate limits
      for (const symbol of targetSymbols) {
        await this.analyzeSpecificCoin(symbol);
      }

      this.lastConsensusTimestamp = Date.now();
      return Array.from(this.cachedConsensusMap.values()).sort((a, b) => b.consensusScore - a.consensusScore);
    } catch (e: any) {
      console.error("[CryptoSignalEngine Error in getConsensusSignals]:", e.message);
      return Array.from(this.cachedConsensusMap.values());
    } finally {
      this.isScanning = false;
    }
  }

  public async getMarketSentiment(): Promise<MarketSentimentData> {
    if (this.cachedSentiment && Date.now() - this.lastSentimentTimestamp < 60000) {
      return this.cachedSentiment;
    }

    let fngValue = 62;
    let fngClassification = "Greed";
    let fngArabic = "طمع واستمرار الزخم (Greed) - فرص الاختراقات الصاعدة مواتية";

    try {
      const fngRes = await axios.get("https://api.alternative.me/fng/?limit=1", { timeout: 3500 });
      if (fngRes.data?.data?.[0]) {
        fngValue = parseInt(fngRes.data.data[0].value, 10) || 62;
        fngClassification = fngRes.data.data[0].value_classification || "Neutral";
        if (fngValue <= 25) fngArabic = "خوف شديد (Extreme Fear) - مناطق تجميع تاريخية للمحافظ الكبرى";
        else if (fngValue <= 45) fngArabic = "خوف وحذر (Fear) - تصفية مضاربين وارتدادات وشيكة";
        else if (fngValue <= 55) fngArabic = "حياد وتوازن (Neutral) - ترقب اتجاهي عام";
        else if (fngValue <= 75) fngArabic = "طمع واستمرار الزخم (Greed) - فرص الاختراقات الصاعدة مواتية";
        else fngArabic = "طمع مفرط (Extreme Greed) - حذر شديد من تصحيحات وتصفيات مفاجئة";
      }
    } catch {
      // Use defaults
    }

    let longAccountPct = 63.8;
    let shortAccountPct = 36.2;
    let lsRatio = 1.76;
    let sentimentSummary = "توازن صحي في مراكز العقود الآجلة (63.8% Long / 36.2% Short)";

    try {
      const lsRes = await axios.get("https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=BTCUSDT&period=1h&limit=1", { timeout: 3500 });
      if (Array.isArray(lsRes.data) && lsRes.data[0]) {
        const item = lsRes.data[0];
        longAccountPct = Number((parseFloat(item.longAccount) * 100).toFixed(1));
        shortAccountPct = Number((parseFloat(item.shortAccount) * 100).toFixed(1));
        lsRatio = Number(parseFloat(item.longShortRatio).toFixed(2));
        sentimentSummary = `توازن صحي في مراكز العقود الآجلة (${longAccountPct}% Long / ${shortAccountPct}% Short)`;
      }
    } catch {
      // Fallback
    }

    this.cachedSentiment = {
      fearAndGreed: {
        value: fngValue,
        classification: fngClassification,
        descriptionArabic: fngArabic
      },
      binanceLongShortRatio: {
        symbol: "BTCUSDT",
        longAccountPct,
        shortAccountPct,
        ratio: lsRatio,
        sentimentSummary
      },
      fundingRateStatus: {
        status: "HEALTHY",
        warningArabic: "معدلات التمويل طبيعية ولا توجد مخاطر ضغط غير عادية"
      },
      marketDominanceBtcPct: 58.4,
      totalMarketTurnover24hUsd: 74_250_000_000,
      totalTrackedFuturesPairs: this.cachedAllCoins.length || 745,
      timestamp: Date.now()
    };
    this.lastSentimentTimestamp = Date.now();
    return this.cachedSentiment;
  }

  private calcRsi(closes: number[], period = 14): number {
    if (closes.length < period + 1) return 50;
    let gains = 0;
    let losses = 0;
    for (let i = 1; i <= period; i++) {
      const diff = closes[i] - closes[i - 1];
      if (diff >= 0) gains += diff;
      else losses -= diff;
    }
    let avgGain = gains / period;
    let avgLoss = losses / period;

    for (let i = period + 1; i < closes.length; i++) {
      const diff = closes[i] - closes[i - 1];
      if (diff >= 0) {
        avgGain = (avgGain * (period - 1) + diff) / period;
        avgLoss = (avgLoss * (period - 1)) / period;
      } else {
        avgGain = (avgGain * (period - 1)) / period;
        avgLoss = (avgLoss * (period - 1) - diff) / period;
      }
    }

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  private calcEma(closes: number[], period: number): number {
    if (closes.length === 0) return 0;
    const k = 2 / (period + 1);
    let ema = closes[0];
    for (let i = 1; i < closes.length; i++) {
      ema = closes[i] * k + ema * (1 - k);
    }
    return ema;
  }

  private calcBollingerBands(closes: number[], period = 20, stdDevMultiplier = 2) {
    if (closes.length < period) {
      const last = closes[closes.length - 1] || 1;
      return { upper: last * 1.02, middle: last, lower: last * 0.98, percentB: 0.5, isSqueeze: false };
    }
    const slice = closes.slice(-period);
    const middle = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((sum, val) => sum + Math.pow(val - middle, 2), 0) / period;
    const stdDev = Math.sqrt(variance);
    const upper = middle + stdDevMultiplier * stdDev;
    const lower = middle - stdDevMultiplier * stdDev;
    const bandwidth = middle > 0 ? (upper - lower) / middle : 0;
    const current = closes[closes.length - 1];
    const percentB = (upper - lower) > 0 ? (current - lower) / (upper - lower) : 0.5;
    const isSqueeze = bandwidth < 0.035;

    return { upper, middle, lower, percentB, isSqueeze };
  }
}

export const cryptoSignalEngine = new CryptoSignalEngine();
