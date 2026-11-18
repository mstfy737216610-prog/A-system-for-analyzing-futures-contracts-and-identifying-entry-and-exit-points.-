import { Zap, Shield, TrendingUp, Cpu, Activity, Search, RefreshCcw, ChevronRight, BarChart3, Target, Info, ShieldAlert, Terminal, MessageSquare, Brain, Layers, Clock, Globe, Signal, Maximize2, Menu, X, Filter, Settings, History, Lock } from "lucide-react";

export interface ModelReport {
  modelName: string;
  role: string;
  analysis: string;
  decision: "LONG" | "SHORT" | "NEUTRAL";
  confidence: number;
}

export interface ChartPattern {
  type: string;
  time: number;
  label: string;
}

export interface MarketSignal {
  symbol: string;
  timeframe?: string;
  direction: "LONG" | "SHORT" | "NEUTRAL";
  confidence: number;
  entry: number;
  sl: number;
  tp: number;
  tp1?: number;
  tp2?: number;
  tp3?: number;
  discussion?: string;
  reasoning: string;
  evidence?: string[];
  warnings?: string[];
  macroContext?: string;
  reports?: ModelReport[];
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  timestamp: number;
  patterns?: ChartPattern[];
  rrRatio?: number;
  profitPercent?: number;
  targetSpeed?: "FAST" | "NORMAL";
  recommendedLeverage?: number;
  expectedProfit20USD?: number;
  leveragedProfit20USD?: number;
  grade?: "AAA" | "AA" | "A";
  hasDivergence?: boolean;
  divergenceType?: string | null;
  hasFvg?: boolean;
  confluenceFactors?: string[];
  adx?: number;
  ichimokuCloudState?: string;
  stochK?: number;
  stochD?: number;
  williamsR?: number;
  vwapValue?: number;
  mfiValue?: number;
  pivotLevels?: { pivot: number; r1: number; r2: number; r3: number; s1: number; s2: number; s3: number };
  fibLevels?: { r236: number; r382: number; r500: number; r618: number; r786: number; ext127: number; ext161: number };
  washTradingScore?: number;
  isWashTradingDetected?: boolean;
  manipulationNotes?: string[];
  detectedCandlePatterns?: string[];
  isServerVerified?: boolean;
  setupCategory?: "PRE_IGNITION_COILED" | "WYCKOFF_SPRING" | "OVERSOLD_IMPULSE" | "LIQUIDITY_SWEEP" | "DIVERGENCE_REVERSAL" | "FVG_EXPANSION" | "MOMENTUM_BREAKOUT" | "STANDARD";
  zoneStrength?: string;
  impulseStrength?: number;
  isOversoldImpulseBuy?: boolean;
  isOverboughtImpulseSell?: boolean;
  isMomentumBreakout?: boolean;
  smartRiskLevel?: "SMART_CALCULATED_RISK" | "INSTITUTIONAL_SAFE";
  riskLabel?: string;
  invalidationPrice?: number;
  targetVelocity?: "INSTANT" | "FAST" | "NORMAL";
  fastOpportunityBadge?: string;
  multiTimeframeConfirmed?: boolean;
  multiTimeframeAnalysis?: {
    d1Trend: "BULLISH" | "BEARISH" | "NEUTRAL";
    h4Trend: "BULLISH" | "BEARISH" | "NEUTRAL";
    h1Trend: "BULLISH" | "BEARISH" | "NEUTRAL";
    alignmentScore: number;
    summary: string;
  };
  fundingRate?: number;
  liquidationRisk?: "LOW" | "MEDIUM" | "HIGH" | "EXTREME_SQUEEZE_RISK";
  aiCouncil?: {
    status: string;
    visualModel: { name: string; role: string; summary: string; confidence: number };
    reasoningModel: { name: string; role: string; summary: string; confidence: number };
    newsModel: { name: string; role: string; summary: string; impactScore: number };
    flashModel: { name: string; role: string; summary: string; executionSpeedMs: number };
  };
  // When no clear signal (<85% or range)
  unclearReason?: string;
  currentMarketState?: string;
  watchingLevels?: string[];
  marketOutlook?: string;
  // Pre-Ignition Sniper & Coiled Spring Attributes
  preIgnitionStatus?: "COILED_SPRING" | "WYCKOFF_SPRING_RECLAIM" | "WYCKOFF_UPTHRUST_REJECT" | "VOLATILITY_COMPRESSION" | "ABSORPTION_READY" | "NONE";
  preIgnitionScore?: number;
  isPreIgnitionReady?: boolean;
  preIgnitionReason?: string;
  executionStyle?: "LIMIT_DISCOUNT_ENTRY" | "CONFIRMED_RECLAIM" | "BREAKOUT_IMPACT";
  compressionRatio?: number;
  optimalLimitEntry?: number;
  coiledPhase?: string;
  // 🚀 Trend of the Day & Pre-Trend Ignition Engine (اقتناص تريند اليوم قبل انطلاق الحركة على أطر 4H و 1D)
  trendOfTheDay?: {
    isCandidate: boolean;
    score: number;
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
  };
  isTrendOfTheDay?: boolean;
  // Micro-Structure & Higher-Timeframe Execution Attributes
  ltfConfirmation?: {
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
  };
  microSurgicalEntry?: number;
  microStopLoss?: number;
  surgicalRrRatio?: number;
  humanTraderVerdict?: string;
  m15Structure?: string;
  m5Pattern?: string;
  is5mLiquiditySwept?: boolean;
  // Pure Real-Trade Attributes (صفقة حقيقية مؤكدة بالمليمتر)
  isRealTradeConfirmed?: boolean;
  realTradeTrigger?: string;
  entryProximity?: "PERFECT_ZONE_NOW" | "LIMIT_PENDING";
  executionInstruction?: string;
  realTradePurityScore?: number;
  // Multi-Dimensional Market Matrix (السيولة، الصفقات، حالة العملة، التذبذب)
  marketMatrix?: ComprehensiveMarketMatrix;
  // High Liquidity Quality Gate (مرشح دقة السيولة العالية)
  highLiquidityQualityGate?: {
    isPassed: boolean;
    takerFlowRatio15m: number;
    takerFlowUsd15m: number;
    avgTakerFlowUsd15m: number;
    inflowType: "MASSIVE_BOTTOM_ACCUMULATION" | "AGGRESSIVE_EXPANSION_FLOW" | "STANDARD_CONFIRMED" | "SUBPAR_REJECTED";
    inflowArabic: string;
    gatekeeperReason?: string;
  };
  // Institutional Capital Protection & Loss-Shield Attributes
  capitalProtectionPlan?: {
    breakevenTriggerPrice: number;
    breakevenRule: string;
    partialTakeProfitPct: number;
    maxCapitalRiskPct: number;
    invalidationReason: string;
    goldenRule: string;
    suggestedUnitsPer1000USD?: number;
  };
  // Fast Arrival & Zero Delay Execution Attributes (وصول سريع لا انتظار طويل)
  fastArrivalDetails?: {
    velocityLevel: "IMMINENT_BURST" | "RAPID_SWING" | "COILED_ACCELERATION";
    velocityArabic: string;
    waitingTimeArabic: string;
    strikeHitProbability: number;
    quickActionCopyText?: string;
  };
  // Master Specification v2.0 Attributes
  officialFormatText?: string;
  regimeEngine?: {
    regime: "BULLISH_TREND" | "BEARISH_TREND" | "RANGE_BOUND" | "RANGING_STAGNANT" | "EXTREME_VOLATILITY";
    labelArabic: string;
    confidence: number;
    stabilityHours: number;
    allowedStrategies: string[];
    forbiddenStrategies: string[];
    gatekeeperStatus: "PASSED" | "REJECTED_CONTRARY_REGIME" | "REJECTED_CHOPPY_RANGE" | "CAUTION_HIGH_VOLATILITY";
    gatekeeperReason?: string;
    isDirectionPermitted: boolean;
    metrics: {
      rollingVol: number;
      relativeAtr: number;
      emaAlignmentTrend: string;
      adxStrength: number;
      bollingerWidth: number;
    };
  };
  engineBreakdown?: Array<{
    id: string;
    name: string;
    nameArabic: string;
    weight: number;
    direction: "LONG" | "SHORT" | "NEUTRAL";
    rawScore: number;
    strength: number;
    dataQuality: number;
    contributionScore: number;
    evidence: string[];
    status: "CONFIRMED" | "MODERATE" | "WEAK" | "ALERT";
  }>;
  orderFlowEngine?: {
    deltaPerCandle: number;
    cvd: number;
    cvdTrend: string;
    hasCvdDivergence: boolean;
    cvdDivergenceType?: string | null;
    absorptionDetected: boolean;
    exhaustionDetected: boolean;
    imbalanceRatio: number;
    unfinishedAuction: boolean;
    volumeProfile: {
      poc: number;
      vah: number;
      val: number;
      hvn: number[];
      lvn: number[];
    };
  };
  smcEngine?: {
    orderBlocks: Array<{
      type: string;
      high: number;
      low: number;
      isUnmitigated: boolean;
      hasSweepPreceding: boolean;
      hasDisplacement: boolean;
      label: string;
    }>;
    fairValueGaps: Array<{
      type: string;
      top: number;
      bottom: number;
      label: string;
    }>;
    liquiditySweeps: Array<{
      type: string;
      price: number;
      label: string;
    }>;
    premiumDiscount: {
      zone: "DISCOUNT" | "PREMIUM" | "EQUILIBRIUM";
      discountPct: number;
      rangeLow: number;
      rangeHigh: number;
      equilibrium: number;
    };
    drawOnLiquidity: {
      targetPrice: number;
      type: string;
      label: string;
    };
  };
  whaleEngine?: {
    netflow24hUsd: number;
    netflow7dUsd: number;
    whaleExchangeRatio: number;
    isAccumulationConfirmed: boolean;
    accumulationScore: number;
    notes: string[];
  };
  derivativesEngine?: {
    fundingRate: number;
    fundingBias: string;
    openInterestDeltaPct: number;
    oiPriceInterpretation: string;
    longShortRatio: number;
    contrarianSignal: string;
    liquidationMap: {
      longLiquidationClusters: number[];
      shortLiquidationClusters: number[];
      primaryMagnetPrice: number;
    };
  };
  manipulationEngine?: {
    hasStopHunt: boolean;
    stopHuntDetails?: string;
    manipulationRiskScore: number;
    penaltyPoints: number;
    notes: string[];
  };
  sentimentEngine?: {
    sentimentScore: number;
    momentum24hVs20d: number;
    isNewsBlackoutActive: boolean;
    blackoutEventName?: string;
    notes: string[];
  };
  riskEngine?: {
    entryZone: [number, number];
    exactEntry: number;
    stopLoss: number;
    invalidationLevel: number;
    atrMargin: number;
    tp1: { price: number; closePct: number; label: string };
    tp2: { price: number; closePct: number; label: string };
    tp3: { price: number; closePct: number; label: string };
    rrRatio: number;
    positionRiskPct: number;
    leverageRecommendation: number;
    maxDailyLossLimitPct: number;
    isMartingaleForbidden: boolean;
    riskSummary: string;
  };
  htfPoiConfirmation?: HtfPoiConfirmation;
  noSignalReport?: {
    currentState: string;
    watchingTriggers: string[];
    scenarios: string;
  };
}

export interface AiConfigSettings {
  customEndpoint: string;
  customApiKey: string;
  useCustomApi: boolean;
  modelVisual: string;
  modelReasoning: string;
  modelNews: string;
  modelFlash: string;
}

export interface SwissWhaleIntelligence {
  symbol: string;
  timestamp: number;
  netExchangeFlow24hUsd: number; // Positive = Inflow (Sell Pressure), Negative = Outflow (Accumulation)
  netFlowStatus: "ACCUMULATION_OUTFLOW" | "HEAVY_EXCHANGE_INFLOW" | "NEUTRAL_FLOW";
  dormantWalletsAlert: boolean;
  dormantWalletsNote?: string;
  mvrvRatio: number;
  mvrvZone: "UNDERVALUED_ACCUMULATION" | "FAIR_VALUE" | "OVERHEATED_DANGER";
  cohorts: {
    retailUnder10Btc: number; // % balance change
    whales100To1000Btc: number; // % balance change
    megaWhalesOver1000Btc: number; // % balance change
  };
  largeWhaleTransactions: Array<{
    hash: string;
    amountBtc: number;
    amountUsd: number;
    fromType: "EXCHANGE" | "COLD_WALLET" | "UNKNOWN";
    toType: "EXCHANGE" | "COLD_WALLET" | "UNKNOWN";
    actionType: "BUY_OFF_EXCHANGE" | "DUMP_ON_EXCHANGE" | "INTERNAL_SHUFFLE";
    timeAgo: string;
  }>;
  orderBlocks: Array<{
    priceRange: [number, number];
    type: "BULLISH_DEMAND" | "BEARISH_SUPPLY";
    volumeUsd: number;
    strength: "CRITICAL" | "STRONG" | "MODERATE";
    testsCount: number;
  }>;
}

export interface EconomicEvent {
  title: string;
  date: string;
  time?: string;
  impact: "HIGH" | "MEDIUM" | "LOW";
  expectedImpact: string;
  category?: string;
}

export interface MacroData {
  fedBias: string;
  interestRateSentiment: string;
  marketMood: string;
  globalNews: string[];
  dailyDigest?: string;
  upcomingEvents?: EconomicEvent[];
  lastUpdate: number;
}

export interface KlineData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  quoteVolume?: number;
  takerBuyVolume?: number;
  takerBuyQuoteVolume?: number;
}

export interface OrderBookLevel {
  price: number;
  quantity: number;
  total: number;
}

export interface OrderBookData {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  timestamp: number;
}

export type TimeFrame = "1m" | "3m" | "5m" | "15m" | "30m" | "1h" | "4h" | "1d";

export interface HtfPoiConfirmation {
  htfTimeframe: string;
  ltfTimeframe: string;
  hasPoi: boolean;
  poiType: "ORDER_BLOCK" | "FVG" | "SWEEP_HIGH" | "SWEEP_LOW" | "NONE";
  poiLevel: number;
  poiLabel: string;
  isConfirmedOnLtf: boolean;
  hasSweep: boolean;
  hasCisd: boolean;
  hasIfvg: boolean;
  fixedLotSize: number;
  maxConcurrentTrades: number;
  slLevel: number;
  tpLevel: number;
  confirmationDetails: string;
  rulesApplied: {
    rule1_htf_poi_mapping: string;
    rule2_fvg_break_ifvg: string;
    rule3_sweep_wick: string;
    rule4_cisd_confirmation: string;
    rule5_immediate_entry: string;
    rule6_sl_placement: string;
    rule7_tp_target: string;
    rule8_fixed_lot: string;
  };
}

export interface NewsArticle {
  id: string;
  title: string;
  titleArabic: string;
  summaryArabic: string;
  source: string;
  pubDate: string;
  url: string;
  sentiment: "BULLISH" | "BEARISH" | "NEUTRAL";
  sentimentScore?: number; // -100 (Extremely Bearish) to +100 (Extremely Bullish)
  sentimentTone?: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  impact: "HIGH" | "MEDIUM" | "LOW";
  affectedSymbols: string[];
  institutionalTakeaway: string;
}

export interface FearAndGreedData {
  value: number;
  classification: string;
  classificationArabic: string;
}

export interface WhaleMetrics {
  symbol: string;
  bidAskRatio: number;
  bidVolumeTotalUsd: number;
  askVolumeTotalUsd: number;
  whalePressure: "BUY_ABSORPTION" | "SELL_WALL_PRESSURE" | "BALANCED";
  spoofingDetected: boolean;
  spoofingNote?: string;
  icebergDetected: boolean;
  icebergNote?: string;
  liquiditySwept: boolean;
  sweepType?: "BEAR_TRAP_SWEEP" | "BULL_TRAP_SWEEP" | "NONE";
  manipulationRiskScore: number;
  largeOrders: Array<{
    price: number;
    quantity: number;
    valueUsd: number;
    side: "BUY" | "SELL";
    isWall: boolean;
  }>;
  cvdTrend: "BUY_PRESSURE" | "SELL_PRESSURE" | "NEUTRAL";
  institutionalVerdict: string;
}

export interface TradeRecord {
  id: string;
  symbol: string;
  direction: "LONG" | "SHORT";
  entry: number;
  sl: number;
  tp: number;
  openTime: number;
  profitPercent: number;
  rrRatio: number;
  grade: "AAA" | "AA" | "A";
  pattern: string;
  status: "OPEN" | "TP_HIT" | "SL_HIT";
  closePrice?: number;
  closeTime?: number;
  realizedPnlPercent?: number;
  realizedPnlUsd?: number;
}

export interface LearningStats {
  totalTrades: number;
  wonTrades: number;
  lostTrades: number;
  openTrades: number;
  winRate: number;
  profitFactor: number;
  totalPnlPercent: number;
  totalPnlUsd: number;
  bestPattern: string;
  patternAccuracy: Record<string, { total: number; won: number; winRate: number }>;
}

export interface BinanceAccountInfo {
  connected: boolean;
  walletBalanceUsdt?: number;
  availableBalanceUsdt?: number;
  totalUnrealizedPnl?: number;
  positionsCount?: number;
  latencyMs?: number;
  accountType?: string;
  error?: string;
}

export interface CorrelationPairStat {
  symbol: string;
  name: string;
  correlation: number; // -1.0 to +1.0
  beta: number;        // Sensitivity relative to target/benchmark
  direction: "POSITIVE" | "NEGATIVE" | "DECOUPLED";
  strength: "VERY_STRONG" | "STRONG" | "MODERATE" | "WEAK" | "INVERSE";
  impactDescription: string;
  priceChangePercent24h?: number;
  lastPrice?: number;
}

export interface CorrelationMatrixData {
  targetSymbol: string;
  timeframe: string;
  timestamp: number;
  benchmark: string;
  btcCorrelation: number;
  btcBeta: number;
  rSquared: number;
  decouplingState: "DECOUPLED_ALPHA" | "HIGH_BETA" | "STRONGLY_COUPLED" | "INVERSE_HEDGE" | "NEUTRAL";
  decouplingLabel: string;
  decouplingDescription: string;
  rollingTrend: "INCREASING" | "DECREASING" | "STABLE";
  symbols: string[];
  matrix: Record<string, Record<string, number>>;
  leaders: CorrelationPairStat[];
  marketTakeaway: string;
}

export interface RejectedAuditItem {
  symbol: string;
  reason: string;
  d1: string;
  h4: string;
  h1: string;
  confidence: number;
  setupCategory?: string;
  blockedByBacktest?: boolean;
  consecutiveLosses?: number;
  winRate?: number;
  marketRegime?: string;
  timestamp?: number;
}

export interface ComprehensiveMarketMatrix {
  // 1. السيولة وعمق السوق (Liquidity & Depth)
  liquidity: {
    turnover1hUsd: number;
    takerBuyQuoteUsd: number;
    takerSellQuoteUsd: number;
    orderFlowDeltaUsd: number;
    buyPressurePct: number;
    bidAskWallRatio?: number;
    orderBookImbalance?: "HEAVY_BUY_WALLS" | "HEAVY_SELL_WALLS" | "BALANCED_DEPTH";
    liquidityQuality: "DEEP_INSTITUTIONAL" | "HEALTHY_LIQUID" | "MEDIUM_CAUTION" | "THIN_SLIPPAGE_RISK";
    slippageRisk: "MINIMAL" | "LOW" | "MODERATE" | "HIGH";
    summaryArabic: string;
  };
  // 2. الصفقات والتدفق المالي وبصمة الحيتان (Trades & Deal Flow)
  trades: {
    tradeCount1h: number;
    avgTradeSizeUsd: number;
    whaleActivityScore: number; // 0 - 100
    whaleDominance: "WHALE_ACCUMULATING" | "WHALE_DISTRIBUTING" | "BALANCED_MIX" | "RETAIL_NOISE";
    largeDealsDetected: boolean;
    dealFlowPace: "RAPID_FIRE" | "STEADY_ACCUMULATION" | "SLOW_QUIET";
    summaryArabic: string;
  };
  // 3. حالة العملة والمسار السوقي (Coin Status & Market Regime)
  coinStatus: {
    regime: "INSTITUTIONAL_ACCUMULATION" | "MOMENTUM_EXPANSION" | "COILED_COMPRESSION" | "DISTRIBUTION_RISK" | "RANGING_STAGNANT";
    regimeArabic: string;
    rsVsBtc: "STRONG_LEADER" | "PARALLEL_WITH_BTC" | "LAGGING_WEAK";
    rsScore: number; // -100 to +100
    vitality: "HYPER_ACTIVE" | "STABLE_GROWTH" | "DORMANT_REJECT";
    turnover24hUsd?: number;
    rankOrTier?: string;
    summaryArabic: string;
  };
  // 4. التحرك والتذبذب الحقيقي (Movement & Volatility Dynamics)
  dynamics: {
    atrPercent: number; // Realized hourly volatility as % of price
    bbWidthPercent: number;
    volatilityState: "COILED_EXPLOSION_IMMINENT" | "HIGH_VELOCITY_EXPANSION" | "STABLE_PREDICTABLE" | "EXHAUSTED_VOLATILITY";
    volatilityStateArabic: string;
    priceVelocityPerHourPct: number;
    movementEfficiencyScore: number; // 0 - 100 (directional cleanliness)
    expectedMoveTimeframe: string;
    summaryArabic: string;
  };
  // الحصيلة الإجمالية للمصفوفة المتكاملة
  multiDimensionalScore: number; // 0 - 100
  multiDimensionalVerdictArabic: string;
}
