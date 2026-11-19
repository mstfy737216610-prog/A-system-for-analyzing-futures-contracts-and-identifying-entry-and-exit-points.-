import axios from "axios";
import { GoogleGenAI } from "@google/genai";
import { storageMemory, AiHubConfigState, AiProviderSite, AiRoleMapping, CoinTradeLesson } from "./storage_memory_engine.ts";

export type AiRoleKey = keyof AiRoleMapping;

export interface AiCallResult {
  role: AiRoleKey;
  usedAi: boolean;
  providerName: string;
  model: string;
  latencyMs: number;
  text: string;
  fallbackUsed?: boolean;
  error?: string;
}

export class MultiSiteAiHub {
  private config: AiHubConfigState;
  private geminiClient: GoogleGenAI | null = null;

  constructor() {
    this.config = storageMemory.loadAiConfig();
    if (process.env.GEMINI_API_KEY) {
      this.geminiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY
      });
    }
  }

  public getConfig(): AiHubConfigState {
    this.config = storageMemory.loadAiConfig();
    return this.config;
  }

  public getMaskedConfig() {
    const cfg = this.getConfig();
    return {
      ...cfg,
      providers: cfg.providers.map(p => ({
        ...p,
        maskedKey: p.apiKey ? `${p.apiKey.slice(0, 6)}...${p.apiKey.slice(-4)}` : "",
        hasKey: Boolean(p.apiKey)
      }))
    };
  }

  public updateConfig(next: Partial<AiHubConfigState>): AiHubConfigState {
    const current = this.getConfig();
    const mergedProviders = Array.isArray(next.providers)
      ? next.providers.map(incoming => {
          const existing = current.providers.find(p => p.id === incoming.id);
          // Preserve existing apiKey if incoming key is masked or empty when editing other fields
          const cleanKey = incoming.apiKey && !incoming.apiKey.includes("...")
            ? incoming.apiKey.trim()
            : (existing?.apiKey || "");
          return {
            ...existing,
            ...incoming,
            baseUrl: (incoming.baseUrl || existing?.baseUrl || "").trim().replace(/\/+$/, ""),
            apiKey: cleanKey,
            models: Array.isArray(incoming.models) ? incoming.models : (existing?.models || [])
          };
        })
      : current.providers;

    const updated: AiHubConfigState = {
      mode: next.mode || current.mode,
      providers: mergedProviders,
      roleMapping: next.roleMapping ? { ...current.roleMapping, ...next.roleMapping } : current.roleMapping,
      isPreemptiveSniperMode: next.isPreemptiveSniperMode ?? current.isPreemptiveSniperMode,
      updatedAt: Date.now()
    };

    this.config = storageMemory.saveAiConfig(updated);
    return this.config;
  }

  public async testProvider(baseUrl: string, apiKey: string, model?: string): Promise<{
    success: boolean;
    latencyMs: number;
    models: string[];
    testedModel: string;
    reply?: string;
    error?: string;
  }> {
    const cleanBase = baseUrl.trim().replace(/\/+$/, "");
    const t0 = Date.now();
    let discoveredModels: string[] = [];

    // 1. Fetch /models list
    try {
      const mRes = await axios.get(`${cleanBase}/models`, {
        headers: { Authorization: `Bearer ${apiKey.trim()}` },
        timeout: 6000
      });
      if (Array.isArray(mRes.data?.data)) {
        discoveredModels = mRes.data.data.map((m: any) => m.id).filter(Boolean);
      }
    } catch {
      // Some providers don't expose /models
    }

    // 2. Test chat completion
    const testModel = model || discoveredModels.find(m => m.includes("3.0-flash") || m.includes("2.5-flash") || m.includes("chat") || m.includes("flash")) || discoveredModels[0] || "gpt-4o-mini";
    try {
      const chatUrl = cleanBase.endsWith("/chat/completions") ? cleanBase : `${cleanBase}/chat/completions`;
      const cRes = await axios.post(chatUrl, {
        model: testModel,
        messages: [
          { role: "system", content: "You are a concise trading system." },
          { role: "user", content: "Reply with: ONLINE" }
        ],
        max_tokens: 15
      }, {
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
          "Content-Type": "application/json"
        },
        timeout: 8000
      });

      const latencyMs = Date.now() - t0;
      const reply = cRes.data?.choices?.[0]?.message?.content || "ONLINE";
      return {
        success: true,
        latencyMs,
        models: discoveredModels,
        testedModel: testModel,
        reply: String(reply).trim()
      };
    } catch (e: any) {
      return {
        success: false,
        latencyMs: Date.now() - t0,
        models: discoveredModels,
        testedModel: testModel,
        error: e?.response?.data?.error?.message || e?.response?.data?.message || e.message
      };
    }
  }

  private normalizeVisionModel(provider: AiProviderSite, requestedModel: string): string {
    // Agnes image-* models are image-generation only (/v1/images/generations);
    // agnes-2.5-flash and agnes-3.0-flash are multimodal vision-understanding models!
    if (provider.baseUrl.includes("agnes-ai.com") && requestedModel.includes("agnes-image")) {
      return "agnes-2.5-flash";
    }
    return requestedModel;
  }

  public async invokeRole(
    role: AiRoleKey,
    systemPrompt: string,
    userPrompt: string,
    deterministicFallback: () => string,
    imagesBase64?: Array<{ label: string; dataUrl: string }>
  ): Promise<AiCallResult> {
    const cfg = this.getConfig();
    if (cfg.mode === "NO_AI") {
      return {
        role,
        usedAi: false,
        providerName: "المحرك الكمي المستقل (بدون ذكاء اصطناعي)",
        model: "CyberQuant-Math-v4",
        latencyMs: 1,
        text: deterministicFallback()
      };
    }

    const mapping = cfg.roleMapping[role];
    const primaryProvider = cfg.providers.find(p => p.id === mapping?.providerId && p.enabled);
    const orderedProviders = [
      ...(primaryProvider ? [primaryProvider] : []),
      ...cfg.providers.filter(p => p.enabled && p.id !== mapping?.providerId)
    ];

    const t0 = Date.now();

    for (const provider of orderedProviders) {
      if (!provider.baseUrl || !provider.apiKey) continue;
      const chatUrl = provider.baseUrl.endsWith("/chat/completions")
        ? provider.baseUrl
        : `${provider.baseUrl}/chat/completions`;

      let candidateModels = [mapping?.model || provider.models[0] || "agnes-3.0-flash"];
      if (imagesBase64 && imagesBase64.length > 0) {
        candidateModels = candidateModels.map(m => this.normalizeVisionModel(provider, m));
      }
      // Smart backup models on the same provider in case of quota/model error
      for (const m of ["agnes-3.0-flash", "agnes-2.5-flash", ...(provider.models || [])]) {
        if (!candidateModels.includes(m) && !m.includes("agnes-image") && !m.includes("agnes-video")) {
          candidateModels.push(m);
        }
      }

      for (const modelName of candidateModels.slice(0, 3)) {
        try {
          let userContent: any = userPrompt;
          if (imagesBase64 && imagesBase64.length > 0) {
            userContent = [
              { type: "text", text: userPrompt },
              ...imagesBase64.slice(0, 4).map(img => ({
                type: "image_url",
                image_url: { url: img.dataUrl }
              }))
            ];
          }

          const resp = await axios.post(chatUrl, {
            model: modelName,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userContent }
            ],
            temperature: 0.25,
            max_tokens: 900
          }, {
            headers: {
              Authorization: `Bearer ${provider.apiKey}`,
              "Content-Type": "application/json"
            },
            timeout: imagesBase64 && imagesBase64.length > 0 ? 15000 : 8500
          });

          const content = resp.data?.choices?.[0]?.message?.content;
          if (content && String(content).trim().length > 5) {
            return {
              role,
              usedAi: true,
              providerName: provider.name,
              model: modelName,
              latencyMs: Date.now() - t0,
              text: String(content).trim()
            };
          }
        } catch (err: any) {
          console.warn(`[AI Hub][${role}] ${provider.name}/${modelName} failed:`, err?.response?.data?.error?.message || err.message);
        }
      }
    }

    // Try Gemini Direct if configured in environment
    if (this.geminiClient && process.env.GEMINI_API_KEY) {
      try {
        const parts: any[] = [{ text: `${systemPrompt}\n\n${userPrompt}` }];
        if (imagesBase64 && imagesBase64.length > 0) {
          for (const img of imagesBase64.slice(0, 4)) {
            const match = img.dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,/);
            const mimeType = match ? match[1] : "image/png";
            const data = img.dataUrl.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");
            parts.push({ inlineData: { data, mimeType } });
          }
        }
        const gRes = await this.geminiClient.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [{ role: "user", parts }]
        });
        if (gRes.text) {
          return {
            role,
            usedAi: true,
            providerName: "Gemini Direct",
            model: "gemini-2.5-flash",
            latencyMs: Date.now() - t0,
            text: gRes.text.trim()
          };
        }
      } catch {}
    }

    // Guaranteed Deterministic Fallback (Never breaks even without internet/AI!)
    return {
      role,
      usedAi: false,
      providerName: "المحرك الكمي المستقل (Fallback بدون AI)",
      model: "CyberQuant-Math-v4",
      latencyMs: Date.now() - t0,
      fallbackUsed: true,
      text: deterministicFallback()
    };
  }

  // Run all 5 AI roles concurrently in parallel!
  public async runParallelCouncil(params: {
    symbol: string;
    quantSummary: string;
    newsHeadlines: string;
    coinHistorySummary: string;
    entryPlanSummary: string;
    screenshots?: Array<{ label: string; dataUrl: string }>;
    fallbacks: Record<AiRoleKey, () => string>;
  }): Promise<Record<AiRoleKey, AiCallResult>> {
    const [newsRes, visionRes, learningRes, reportRes, entryRes] = await Promise.all([
      this.invokeRole(
        "news",
        "أنت محلل أخبار الفيدرالي الأمريكي والكريبتو ومؤشرات السوشيال ميديا (X/Telegram/CoinDesk). اكتب بالعربية بإيجاز ودقة مع تصنيف التأثير (إيجابي/سلبي/محايد) ودرجة التأثير من 10.",
        `العملة: ${params.symbol}\nأحدث العناوين والأحداث:\n${params.newsHeadlines}\nقيّم تأثير الأخبار على السيولة والتذبذب السعري قبل حدوث الحركة.`,
        params.fallbacks.news
      ),
      this.invokeRole(
        "vision",
        "أنت خبير تحليل بصري للشموع اليابانية والنماذج الكلاسيكية والمؤسساتية (رأس وكتفين، مثلثات، كسر دعم/مقاومة، سحب سيولة). صف ما تراه في صور الشارت بدقة بالعربية.",
        `افحص صور الشارت المرفقة للعملة ${params.symbol} عبر الفريمات (15m / 1h / 2h / 4h) وحدد النمط السعري، ومناطق السيولة، وهل هناك مصيدة صعود/هبوط أم اختراق حقيقي.\nبيانات مساعدة:\n${params.quantSummary}`,
        params.fallbacks.vision,
        params.screenshots && params.screenshots.length > 0 ? params.screenshots : undefined
      ),
      this.invokeRole(
        "learning",
        "أنت مدقق أخطاء تداول خبير (Post-Trade Risk Auditor). حلل سجل الصفقات السابقة لهذه العملة وحدد الأخطاء المتكررة وقاعدة حماية رأس المال.",
        `سجل التعلم والصفقات السابقة للعملة ${params.symbol}:\n${params.coinHistorySummary}\nما أهم درس مستفاد لتجنب الخسارة أو الانعكاس على هذه العملة؟`,
        params.fallbacks.learning
      ),
      this.invokeRole(
        "report",
        "أنت كبير محللي الصناديق الكمية. اكتب تقريراً مقروءاً بالعربية يجمع بين السيولة، التباعدات، نبض قطاع الذكاء الاصطناعي والكريبتو، وموعد أخبار الفيدرالي.",
        `العملة: ${params.symbol}\nالملخص الكمي ومتعدد المنصات:\n${params.quantSummary}\nاكتب تقريراً احترافياً واضحاً في 4 نقاط مركزة.`,
        params.fallbacks.report
      ),
      this.invokeRole(
        "entryExplain",
        "أنت مساعد تنفيذ صفقات فوري. اشرح للمتداول بلغة عربية مقنعة وواضحة سبب الدخول ومكان وقف الخسارة والأهداف لحساب صغير (50 دولار).",
        `خطة الصفقة للعملة ${params.symbol}:\n${params.entryPlanSummary}\nاشرح سبب الدخول والوقف والأهداف بوضوح تام.`,
        params.fallbacks.entryExplain
      )
    ]);

    return {
      news: newsRes,
      vision: visionRes,
      learning: learningRes,
      report: reportRes,
      entryExplain: entryRes
    };
  }

  public async analyzeClosedTradeLesson(lesson: CoinTradeLesson): Promise<string> {
    const prompt = `العملة: ${lesson.symbol} (${lesson.direction}) | الفريم: ${lesson.timeframe}
سعر الدخول: ${lesson.entry} | سعر الخروج: ${lesson.exit || "غير محدد"} | الوقف: ${lesson.sl} | النتيجة: ${lesson.outcome} (${lesson.pnlPercent}%)
سبب الدخول الأصلي: ${lesson.entryReason}
السؤال: لماذا نجحت أو فشلت هذه الصفقة؟ وما القاعدة الذهبية المختصرة (في سطرين بالعربية) لتطبيقها مستقبلاً على ${lesson.symbol}؟`;

    const res = await this.invokeRole(
      "learning",
      "أنت مدقق أخطاء تداول مؤسساتي تستخلص الدروس العملية من كل صفقة رابحة أو خاسرة.",
      prompt,
      () => {
        if (lesson.outcome === "LOSS") {
          return `درس آلي [${lesson.symbol}]: حدث انعكاس نحو الوقف (${lesson.sl}). القاعدة: لا تدخل بسعر السوق عند تمدد الشمعة، وانتظر تأكيد إغلاق شمعة 15m فوق منطقة السيولة مع وقف صارم وحجم تداول ≥ 1.3x.`;
        }
        return `درس آلي [${lesson.symbol}]: تحقق الهدف بنجاح (+${lesson.pnlPercent}%). القاعدة: استمر في الدخول بأوامر Limit عند الفجوات السعرية ونقل الوقف لنقطة الدخول عند TP1.`;
      }
    );

    return res.text;
  }
}

export const aiHub = new MultiSiteAiHub();
