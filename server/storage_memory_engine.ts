import fs from "fs";
import path from "path";
import os from "os";

export interface AiProviderSite {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  enabled: boolean;
  models: string[];
  lastTestedAt?: number;
  lastLatencyMs?: number;
  lastStatus?: "OK" | "ERROR" | "UNTESTED";
  lastError?: string;
}

export interface AiRoleMapping {
  news: { providerId: string; model: string };
  vision: { providerId: string; model: string };
  learning: { providerId: string; model: string };
  report: { providerId: string; model: string };
  entryExplain: { providerId: string; model: string };
}

export interface AiHubConfigState {
  mode: "HYBRID" | "NO_AI" | "AI_ONLY";
  providers: AiProviderSite[];
  roleMapping: AiRoleMapping;
  isPreemptiveSniperMode: boolean;
  updatedAt: number;
}

export interface CoinTradeLesson {
  id: string;
  symbol: string;
  timeframe: string;
  direction: "LONG" | "SHORT";
  entry: number;
  exit?: number;
  sl: number;
  tp1: number;
  tp2: number;
  outcome: "OPEN" | "WIN" | "LOSS" | "BREAKEVEN";
  pnlPercent: number;
  entryReason: string;
  aiPostMortem?: string;
  mistakeTag?: string;
  learnedRule?: string;
  timestamp: number;
  closedAt?: number;
}

export interface CoinMemoryProfile {
  symbol: string;
  totalSignals: number;
  wins: number;
  losses: number;
  winRate: number;
  avgPnlPct: number;
  bestTimeframe: string;
  knownSupportZones: number[];
  knownResistanceZones: number[];
  detectedTrapsCount: number;
  learnedRules: string[];
  recentTrades: CoinTradeLesson[];
  lastUpdated: number;
}

export interface SystemCheckpointState {
  activeTab: string;
  selectedSymbol: string;
  activeTimeframe: string;
  huntingMode: string;
  botState: "RUNNING" | "STOPPED" | "PAUSED";
  capitalUsd: number;
  lastScanCursor: number;
  lastScannedSymbols: string[];
  activeWatchlist: string[];
  savedAt: number;
}

function resolveDefaultSyncDir(): string {
  const candidates = [
    process.env.AVANTIS_SYNC_DIR,
    "/sdcard/Download/AvantisCryptoMemory",
    "/storage/emulated/0/Download/AvantisCryptoMemory",
    path.join(os.homedir(), "storage", "downloads", "AvantisCryptoMemory"),
    path.join(os.homedir(), "Downloads", "AvantisCryptoMemory")
  ].filter(Boolean) as string[];

  for (const dir of candidates) {
    try {
      const parent = path.dirname(dir);
      if (fs.existsSync(parent)) {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        // Test write permission
        const probe = path.join(dir, ".write_test");
        fs.writeFileSync(probe, "ok");
        fs.unlinkSync(probe);
        return dir;
      }
    } catch {
      // Not writable or not Android/Termux
    }
  }

  // Fallback inside workspace data folder
  const localDir = path.join(process.cwd(), "downloads_sync", "AvantisCryptoMemory");
  fs.mkdirSync(localDir, { recursive: true });
  return localDir;
}

export const DEFAULT_AI_HUB_CONFIG: AiHubConfigState = {
  mode: "HYBRID",
  providers: [
    {
      id: "agnes-hub",
      name: "Agnes AI Hub (الموقع الأول)",
      baseUrl: "https://apihub.agnes-ai.com/v1",
      apiKey: process.env.AGNES_API_KEY || "sk-ctBztqbDFE41jH76EcqX1Xgn6zFk0l9AJieBufBfWEUR3vBR",
      enabled: true,
      models: [
        "agnes-3.0-flash",
        "agnes-2.5-flash",
        "agnes-2.5-pro",
        "agnes-image-2.5-flash",
        "agnes-image-2.1-flash"
      ],
      lastStatus: "OK"
    }
  ],
  roleMapping: {
    news: { providerId: "agnes-hub", model: "agnes-3.0-flash" },
    vision: { providerId: "agnes-hub", model: "agnes-2.5-flash" },
    learning: { providerId: "agnes-hub", model: "agnes-3.0-flash" },
    report: { providerId: "agnes-hub", model: "agnes-2.5-flash" },
    entryExplain: { providerId: "agnes-hub", model: "agnes-3.0-flash" }
  },
  isPreemptiveSniperMode: true,
  updatedAt: Date.now()
};

export class StorageMemoryEngine {
  private syncDir: string;
  private coinsDir: string;
  private isTermuxStorage: boolean;

  constructor() {
    this.syncDir = resolveDefaultSyncDir();
    this.coinsDir = path.join(this.syncDir, "coins");
    this.isTermuxStorage = this.syncDir.includes("/sdcard") || this.syncDir.includes("/storage/emulated") || this.syncDir.includes("storage/downloads");
    this.ensureDirs();
  }

  private ensureDirs() {
    if (!fs.existsSync(this.syncDir)) fs.mkdirSync(this.syncDir, { recursive: true });
    if (!fs.existsSync(this.coinsDir)) fs.mkdirSync(this.coinsDir, { recursive: true });
  }

  public getStorageStatus() {
    let coinFiles: string[] = [];
    try {
      coinFiles = fs.readdirSync(this.coinsDir).filter(f => f.endsWith(".json"));
    } catch {}

    return {
      syncDir: this.syncDir,
      coinsDir: this.coinsDir,
      isTermuxDownloads: this.isTermuxStorage,
      trackedCoinsCount: coinFiles.length,
      trackedCoinFiles: coinFiles,
      hasCheckpoint: fs.existsSync(path.join(this.syncDir, "checkpoint_state.json")),
      hasAiConfig: fs.existsSync(path.join(this.syncDir, "ai_providers_config.json")),
      hasJournal: fs.existsSync(path.join(this.syncDir, "learning_journal.json")),
      platform: os.platform(),
      arch: os.arch()
    };
  }

  public setSyncDirectory(newDir: string): { success: boolean; syncDir: string; error?: string } {
    try {
      const resolved = path.resolve(newDir.trim());
      fs.mkdirSync(resolved, { recursive: true });
      const probe = path.join(resolved, ".write_test");
      fs.writeFileSync(probe, "ok");
      fs.unlinkSync(probe);

      this.syncDir = resolved;
      this.coinsDir = path.join(this.syncDir, "coins");
      this.ensureDirs();
      this.isTermuxStorage = this.syncDir.includes("/sdcard") || this.syncDir.includes("/storage/emulated") || this.syncDir.includes("storage/downloads");
      return { success: true, syncDir: this.syncDir };
    } catch (e: any) {
      return { success: false, syncDir: this.syncDir, error: e.message || "تعذر الكتابة في المسار المحدد" };
    }
  }

  // 1. AI Providers & Role Config Sync
  public loadAiConfig(): AiHubConfigState {
    const file = path.join(this.syncDir, "ai_providers_config.json");
    try {
      if (fs.existsSync(file)) {
        const parsed = JSON.parse(fs.readFileSync(file, "utf-8"));
        if (parsed && Array.isArray(parsed.providers) && parsed.providers.length > 0) {
          // Heal accidental legacy hcnsec key seeded on Agnes Hub if present
          const agnes = parsed.providers.find((p: AiProviderSite) => p.id === "agnes-hub");
          if (agnes && agnes.baseUrl.includes("agnes-ai.com") && agnes.apiKey === "sk-jIBYn33yO8H8F5CQSsWdLms3BKJJKGyZ020cRkWF9waD51CU") {
            agnes.apiKey = process.env.AGNES_API_KEY || "sk-ctBztqbDFE41jH76EcqX1Xgn6zFk0l9AJieBufBfWEUR3vBR";
            this.saveAiConfig(parsed);
          }
          return parsed;
        }
      }
    } catch {}
    this.saveAiConfig(DEFAULT_AI_HUB_CONFIG);
    return DEFAULT_AI_HUB_CONFIG;
  }

  public saveAiConfig(cfg: AiHubConfigState): AiHubConfigState {
    const file = path.join(this.syncDir, "ai_providers_config.json");
    const updated = { ...cfg, updatedAt: Date.now() };
    try {
      this.ensureDirs();
      fs.writeFileSync(file, JSON.stringify(updated, null, 2), "utf-8");
    } catch (e) {
      console.error("[StorageMemory] saveAiConfig failed:", e);
    }
    return updated;
  }

  // 2. Per-Coin Separate Learning File (<syncDir>/coins/BTCUSDT.json)
  public loadCoinProfile(symbol: string): CoinMemoryProfile {
    const sym = symbol.toUpperCase().trim().replace(/[^A-Z0-9]/g, "");
    const file = path.join(this.coinsDir, `${sym}.json`);
    try {
      if (fs.existsSync(file)) {
        return JSON.parse(fs.readFileSync(file, "utf-8"));
      }
    } catch {}

    return {
      symbol: sym,
      totalSignals: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      avgPnlPct: 0,
      bestTimeframe: "15m",
      knownSupportZones: [],
      knownResistanceZones: [],
      detectedTrapsCount: 0,
      learnedRules: [],
      recentTrades: [],
      lastUpdated: Date.now()
    };
  }

  public saveCoinProfile(profile: CoinMemoryProfile): CoinMemoryProfile {
    const sym = profile.symbol.toUpperCase().trim().replace(/[^A-Z0-9]/g, "");
    const file = path.join(this.coinsDir, `${sym}.json`);
    const next = { ...profile, symbol: sym, lastUpdated: Date.now() };
    try {
      this.ensureDirs();
      fs.writeFileSync(file, JSON.stringify(next, null, 2), "utf-8");
    } catch (e) {
      console.error(`[StorageMemory] saveCoinProfile(${sym}) failed:`, e);
    }
    return next;
  }

  public recordCoinTradeLesson(lesson: CoinTradeLesson): CoinMemoryProfile {
    const profile = this.loadCoinProfile(lesson.symbol);
    const existingIdx = profile.recentTrades.findIndex(t => t.id === lesson.id);
    if (existingIdx >= 0) {
      profile.recentTrades[existingIdx] = lesson;
    } else {
      profile.recentTrades.unshift(lesson);
      profile.recentTrades = profile.recentTrades.slice(0, 100);
    }

    const closed = profile.recentTrades.filter(t => t.outcome === "WIN" || t.outcome === "LOSS");
    profile.totalSignals = profile.recentTrades.length;
    profile.wins = closed.filter(t => t.outcome === "WIN").length;
    profile.losses = closed.filter(t => t.outcome === "LOSS").length;
    profile.winRate = closed.length > 0 ? Math.round((profile.wins / closed.length) * 100) : 0;
    profile.avgPnlPct = closed.length > 0
      ? Number((closed.reduce((s, t) => s + t.pnlPercent, 0) / closed.length).toFixed(2))
      : 0;

    if (lesson.learnedRule && !profile.learnedRules.includes(lesson.learnedRule)) {
      profile.learnedRules.unshift(lesson.learnedRule);
      profile.learnedRules = profile.learnedRules.slice(0, 25);
    }

    this.saveCoinProfile(profile);
    this.appendToJournal(lesson);
    return profile;
  }

  public updateCoinZones(symbol: string, supports: number[], resistances: number[], trapDetected: boolean): CoinMemoryProfile {
    const profile = this.loadCoinProfile(symbol);
    profile.knownSupportZones = Array.from(new Set([...supports.slice(0, 5), ...profile.knownSupportZones])).slice(0, 10);
    profile.knownResistanceZones = Array.from(new Set([...resistances.slice(0, 5), ...profile.knownResistanceZones])).slice(0, 10);
    if (trapDetected) profile.detectedTrapsCount += 1;
    return this.saveCoinProfile(profile);
  }

  public listAllCoinProfiles(): CoinMemoryProfile[] {
    try {
      this.ensureDirs();
      const files = fs.readdirSync(this.coinsDir).filter(f => f.endsWith(".json"));
      return files.map(f => {
        try {
          return JSON.parse(fs.readFileSync(path.join(this.coinsDir, f), "utf-8"));
        } catch {
          return null;
        }
      }).filter(Boolean).sort((a: any, b: any) => (b.lastUpdated || 0) - (a.lastUpdated || 0));
    } catch {
      return [];
    }
  }

  // 3. Global Learning Journal
  public loadJournal(): CoinTradeLesson[] {
    const file = path.join(this.syncDir, "learning_journal.json");
    try {
      if (fs.existsSync(file)) {
        const parsed = JSON.parse(fs.readFileSync(file, "utf-8"));
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  }

  private appendToJournal(lesson: CoinTradeLesson) {
    const file = path.join(this.syncDir, "learning_journal.json");
    const journal = this.loadJournal();
    const idx = journal.findIndex(j => j.id === lesson.id);
    if (idx >= 0) journal[idx] = lesson;
    else journal.unshift(lesson);
    try {
      fs.writeFileSync(file, JSON.stringify(journal.slice(0, 500), null, 2), "utf-8");
    } catch {}
  }

  // 4. Resume Checkpoint State (Save where stopped & resume cleanly)
  public loadCheckpoint(): SystemCheckpointState {
    const file = path.join(this.syncDir, "checkpoint_state.json");
    try {
      if (fs.existsSync(file)) {
        return JSON.parse(fs.readFileSync(file, "utf-8"));
      }
    } catch {}
    return {
      activeTab: "multiscreen",
      selectedSymbol: "BTCUSDT",
      activeTimeframe: "15m",
      huntingMode: "SMART_FAST",
      botState: "RUNNING",
      capitalUsd: 50,
      lastScanCursor: 0,
      lastScannedSymbols: [],
      activeWatchlist: ["BTCUSDT", "ETHUSDT", "SOLUSDT", "TAOUSDT", "FETUSDT", "NEARUSDT", "SUIUSDT", "XAUUSDT"],
      savedAt: Date.now()
    };
  }

  public saveCheckpoint(patch: Partial<SystemCheckpointState>): SystemCheckpointState {
    const file = path.join(this.syncDir, "checkpoint_state.json");
    const prev = this.loadCheckpoint();
    const next: SystemCheckpointState = {
      ...prev,
      ...patch,
      savedAt: Date.now()
    };
    try {
      this.ensureDirs();
      fs.writeFileSync(file, JSON.stringify(next, null, 2), "utf-8");
    } catch (e) {
      console.error("[StorageMemory] saveCheckpoint failed:", e);
    }
    return next;
  }

  // Export complete synced backup bundle (for downloading directly to phone Downloads folder from browser)
  public exportFullSyncBundle() {
    return {
      exportedAt: new Date().toISOString(),
      syncDir: this.syncDir,
      aiConfig: this.loadAiConfig(),
      checkpoint: this.loadCheckpoint(),
      journal: this.loadJournal(),
      coinProfiles: this.listAllCoinProfiles()
    };
  }
}

export const storageMemory = new StorageMemoryEngine();
