import { MarketSignal } from "./types";

export const initialSignals: MarketSignal[] = [
  {
    symbol: "BTCUSDT",
    direction: "LONG",
    confidence: 96,
    entry: 81600,
    sl: 79800,
    tp: 86500,
    tp1: 83900,
    tp2: 86500,
    tp3: 91000,
    profitPercent: 6.0,
    rrRatio: 2.7,
    grade: "AAA",
    targetSpeed: "FAST",
    recommendedLeverage: 5,
    expectedProfit20USD: 1.20,
    leveragedProfit20USD: 6.00,
    riskLevel: "LOW",
    hasDivergence: true,
    divergenceType: "BULLISH_DIVERGENCE",
    hasFvg: true,
    timeframe: "1h",
    isRealTradeConfirmed: true,
    realTradePurityScore: 97,
    realTradeTrigger: "تجميع وانضغاط 4H/1D + دايفرجنس انعكاسي مؤكد",
    entryProximity: "PERFECT_ZONE_NOW",
    executionInstruction: "⚡ السعر في قلب منطقة الدخول بالمليمتر الآن - صفقة حقيقية جاهزة للتنفيذ الفوري",
    isTrendOfTheDay: true,
    trendOfTheDay: {
      isCandidate: true,
      score: 96,
      stage: "PRE_TREND_IGNITION",
      stageArabic: "⚡ اشتعال تريند اليوم (Pre-Trend Ignition)",
      verdictArabic: "🎯 تريند اليوم المرتقب: انضغاط Bollinger على 4H مع تراكم سيولة مؤسساتية وقوة نسبية أمام السوق.",
      htfConfluence: "توافق هيكلي تام (1D + 4H + 1H)",
      relativeStrengthScore: 94,
      dailyVolumeInflowMultiplier: 2.1,
      macroTargets: {
        tp1: 83900,
        tp2: 86500,
        tp3: 91000
      },
      macroSl: 79800,
      macroRrRatio: 2.7,
      reasons: [
        "انضغاط سعري حاد على إطار 4H (Bollinger Squeeze)",
        "تراكم حجم تداول مؤسساتي مسبق 2.1x",
        "استناد قوي أعلى متوسط 1D اليومي - مسار صاعد متماسك"
      ]
    },
    timestamp: Date.now() - 1000 * 60 * 12,
    confluenceFactors: [
      "توافق تام عبر الأطر الزمنية الكبرى (1D + 4H + 1H)",
      "دايفرجنس شرائي صاعد مؤكد على فريم الساعة (Bullish Divergence)",
      "اقتناص سيولة القاع الأخير وارتداد سريع (SMC Bear Trap)",
      "فجوة سعرية مؤسساتية متطابقة (Bullish FVG)",
      "تسارع إيجابي ملحوظ في مؤشر الزخم"
    ],
    reasoning: "إشارة شراء صاعدة (Long) عالية اليقين: اكتمال نموذج تجميع سيولة حيتان مع دايفرجنس RSI مؤكد عند دعم $81,600. الهدف الأول TP1 $83,900 لتأمين الدخول، والهدف الرئيسي TP2 $86,500 بنسبة ربح +6.0%.",
    patterns: [
      {
        type: "DOUBLE_BOTTOM",
        time: Date.now() - 1000 * 60 * 30,
        label: "قاع ارتدادي وتجميع سيولة حيتان"
      }
    ]
  },
  {
    symbol: "SOLUSDT",
    direction: "LONG",
    confidence: 95,
    entry: 104.20,
    sl: 101.10,
    tp: 112.50,
    tp1: 107.80,
    tp2: 112.50,
    tp3: 119.00,
    profitPercent: 7.9,
    rrRatio: 2.6,
    grade: "AAA",
    targetSpeed: "FAST",
    recommendedLeverage: 5,
    expectedProfit20USD: 1.58,
    leveragedProfit20USD: 7.90,
    riskLevel: "LOW",
    hasDivergence: true,
    divergenceType: "BULLISH_DIVERGENCE",
    hasFvg: true,
    timeframe: "1h",
    isRealTradeConfirmed: true,
    realTradePurityScore: 95,
    realTradeTrigger: "تجميع وانضغاط 4H + كسر وهمي للدعم واسترداد سريع",
    entryProximity: "PERFECT_ZONE_NOW",
    executionInstruction: "⚡ السعر في قلب منطقة الدخول تماماً - صفقة حقيقية جاهزة للتنفيذ",
    isTrendOfTheDay: true,
    trendOfTheDay: {
      isCandidate: true,
      score: 95,
      stage: "ACCUMULATION_COIL",
      stageArabic: "🌀 تجميع وانضغاط هيكلي (قبل الانفجار مباشرة)",
      verdictArabic: "🎯 تريند اليوم المرتقب: انضغاط وتضيّق على فريم 4H مع تدفق سيولة حيتان وتفوق نسبي.",
      htfConfluence: "توافق هيكلي متين (1D + 4H + 1H)",
      relativeStrengthScore: 92,
      dailyVolumeInflowMultiplier: 1.85,
      macroTargets: {
        tp1: 107.80,
        tp2: 112.50,
        tp3: 119.00
      },
      macroSl: 101.10,
      macroRrRatio: 2.6,
      reasons: [
        "انضغاط سعري حاد على إطار 4H (Bollinger Squeeze)",
        "تراكم حجم تداول مؤسساتي 1.85x",
        "ارتداد قوي من منطقة طلب رئيسية"
      ]
    },
    timestamp: Date.now() - 1000 * 60 * 18,
    confluenceFactors: [
      "توافق الأطر الكبرى 1D و 4H و 1H",
      "كسر وهمي لمستوى الدعم واسترداده الفوري (Liquidity Sweep)",
      "شمعة مطرقة صاعدة مصحوبة بزيادة في الحجم (Hammer Rejection)",
      "زخم شرائي متصاعد في مؤشر MACD",
      "توافق مع الاتجاه الهيكلي العام"
    ],
    reasoning: "إشارة شراء صاعدة (Long) قوية: امتصاص بيعي عند الدعم الرئيسي $104.20 مع رفض هبوطي قاطع. TP1 عند $107.80 (+3.5%) لتأمين الوقف فوراً، و TP2 عند $112.50 (+7.9%).",
    patterns: [
      {
        type: "DOUBLE_BOTTOM",
        time: Date.now() - 1000 * 60 * 45,
        label: "امتصاص سيولة ورفض قاع الدعم"
      }
    ]
  },
  {
    symbol: "ETHUSDT",
    direction: "LONG",
    confidence: 94,
    entry: 2410.0,
    sl: 2340.0,
    tp: 2580.0,
    tp1: 2490.0,
    tp2: 2580.0,
    tp3: 2720.0,
    profitPercent: 7.0,
    rrRatio: 2.4,
    grade: "AAA",
    targetSpeed: "FAST",
    recommendedLeverage: 5,
    expectedProfit20USD: 1.40,
    leveragedProfit20USD: 7.00,
    riskLevel: "LOW",
    hasDivergence: true,
    divergenceType: "BULLISH_DIVERGENCE",
    hasFvg: true,
    timestamp: Date.now() - 1000 * 60 * 25,
    confluenceFactors: [
      "إعادة اختبار ناجحة لمنطقة الفجوة السعرية (FVG Mitigation)",
      "تقاطع إيجابي في مؤشر الماكد MACD",
      "ارتداد من نطاق البولنجر السفلي"
    ],
    reasoning: "إشارة شراء صاعدة (Long) مؤكدة: إعادة اختبار منطقة الطلب المؤسساتية مع تأكيد المؤشرات الفنية. الهدف TP1 عند $2490 (+3.3%)، والهدف الرئيسي TP2 عند $2580 (+7.0%).",
    patterns: [
      {
        type: "DOUBLE_BOTTOM",
        time: Date.now() - 1000 * 60 * 60,
        label: "ارتداد من منطقة الطلب المؤسساتية"
      }
    ]
  },
  {
    symbol: "NEARUSDT",
    direction: "LONG",
    confidence: 93,
    entry: 4.82,
    sl: 4.65,
    tp: 5.28,
    tp1: 5.05,
    tp2: 5.28,
    tp3: 5.65,
    profitPercent: 9.5,
    rrRatio: 2.7,
    grade: "AAA",
    targetSpeed: "FAST",
    recommendedLeverage: 5,
    expectedProfit20USD: 1.90,
    leveragedProfit20USD: 9.50,
    riskLevel: "LOW",
    hasDivergence: true,
    divergenceType: "BULLISH_DIVERGENCE",
    hasFvg: true,
    timestamp: Date.now() - 1000 * 60 * 20,
    confluenceFactors: [
      "ارتداد من قاع وتجميع سيولة",
      "حجم تداول مرتفع 2.4x",
      "دايفرجنس شرائي إيجابي"
    ],
    reasoning: "إشارة شراء صاعدة (Long): تجميع مؤسساتي واضح مع ارتداد من الدعم $4.82. TP1 عند $5.05 (+4.7%)، و TP2 عند $5.28 (+9.5%).",
    patterns: []
  },
  {
    symbol: "SUIUSDT",
    direction: "LONG",
    confidence: 92,
    entry: 1.020,
    sl: 0.985,
    tp: 1.110,
    tp1: 1.065,
    tp2: 1.110,
    tp3: 1.190,
    profitPercent: 8.8,
    rrRatio: 2.5,
    grade: "AAA",
    targetSpeed: "FAST",
    recommendedLeverage: 5,
    expectedProfit20USD: 1.76,
    leveragedProfit20USD: 8.80,
    riskLevel: "LOW",
    hasDivergence: false,
    timestamp: Date.now() - 1000 * 60 * 15,
    confluenceFactors: [
      "اختراق قمة المقاومة بإغلاق شمعة زخم",
      "سيولة شرائية قوية",
      "متوسطات متحركة 9 و 21 في مسار صاعد"
    ],
    reasoning: "إشارة شراء صاعدة (Long): اختراق وتأكيد مسار صاعد على فريم الساعة عند $1.020. الهدف TP1 عند $1.065 (+4.4%)، والهدف الرئيسي TP2 عند $1.110 (+8.8%).",
    patterns: []
  }
];
