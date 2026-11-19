import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FolderSync, Download, Save, RefreshCcw, Brain, Terminal,
  FileCode2, CheckCircle2, Copy, Check, BookOpen, PlusCircle
} from "lucide-react";

interface StorageStatus {
  syncDir: string;
  coinsDir: string;
  isTermuxDownloads: boolean;
  trackedCoinsCount: number;
  trackedCoinFiles: string[];
  hasCheckpoint: boolean;
  hasAiConfig: boolean;
  hasJournal: boolean;
  platform: string;
  arch: string;
}

interface CoinProfile {
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
  recentTrades: Array<{
    id: string;
    direction: string;
    outcome: string;
    pnlPercent: number;
    entry: number;
    sl: number;
    aiPostMortem?: string;
    timestamp: number;
  }>;
}

interface TermuxAndDocsHubProps {
  currentSymbol: string;
  currentTimeframe: string;
  currentTab: string;
  onSelectSymbol: (sym: string) => void;
  onRestoreCheckpoint?: (cp: any) => void;
}

export const TermuxAndDocsHub: React.FC<TermuxAndDocsHubProps> = ({
  currentSymbol,
  currentTimeframe,
  currentTab,
  onSelectSymbol,
  onRestoreCheckpoint
}) => {
  const [status, setStatus] = useState<StorageStatus | null>(null);
  const [checkpoint, setCheckpoint] = useState<any>(null);
  const [coins, setCoins] = useState<CoinProfile[]>([]);
  const [syncInput, setSyncInput] = useState("/sdcard/Download/AvantisCryptoMemory");
  const [docs, setDocs] = useState<{ termuxInstall: string; howItWorks: string; termuxScript: string }>({
    termuxInstall: "",
    howItWorks: "",
    termuxScript: ""
  });
  const [docTab, setDocTab] = useState<"termux" | "explain" | "script">("termux");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [copiedDoc, setCopiedDoc] = useState(false);

  // Manual trade lesson form
  const [lessonSym, setLessonSym] = useState(currentSymbol || "BTCUSDT");
  const [lessonDir, setLessonDir] = useState<"LONG" | "SHORT">("LONG");
  const [lessonOutcome, setLessonOutcome] = useState<"WIN" | "LOSS">("WIN");
  const [lessonPnl, setLessonPnl] = useState<number>(22);
  const [lessonReason, setLessonReason] = useState("دخول بعد انضغاط بولنجر مع سيولة مشترين أعلى من 55%");
  const [savingLesson, setSavingLesson] = useState(false);

  const loadAll = async () => {
    try {
      const [stRes, coinsRes, docsRes] = await Promise.all([
        axios.get("/api/storage/status"),
        axios.get("/api/storage/coins"),
        axios.get("/api/docs/files")
      ]);
      if (stRes.data?.status) {
        setStatus(stRes.data.status);
        setSyncInput(stRes.data.status.syncDir);
      }
      if (stRes.data?.checkpoint) setCheckpoint(stRes.data.checkpoint);
      if (coinsRes.data?.coins) setCoins(coinsRes.data.coins);
      if (docsRes.data) {
        setDocs({
          termuxInstall: docsRes.data.termuxInstall || "",
          howItWorks: docsRes.data.howItWorks || "",
          termuxScript: docsRes.data.termuxScript || ""
        });
      }
    } catch {}
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleUpdateSyncDir = async () => {
    try {
      const res = await axios.post("/api/storage/sync-dir", { syncDir: syncInput });
      if (res.data?.success) {
        setFeedback(`تم ربط ومزامنة مجلد الحفظ بنجاح: ${res.data.syncDir}`);
        loadAll();
      } else {
        setFeedback(res.data?.error || "تعذر الكتابة في هذا المسار");
      }
    } catch (err: any) {
      setFeedback(err?.response?.data?.error || "تعذر تغيير مسار المزامنة");
    }
  };

  const handleSaveCheckpointNow = async () => {
    try {
      const res = await axios.post("/api/storage/checkpoint", {
        activeTab: currentTab,
        selectedSymbol: currentSymbol,
        activeTimeframe: currentTimeframe,
        savedAt: Date.now()
      });
      if (res.data?.checkpoint) {
        setCheckpoint(res.data.checkpoint);
        setFeedback("تم حفظ نقطة الاستئناف (Checkpoint) في مجلد التنزيلات بنجاح ✅");
      }
    } catch {
      setFeedback("فشل حفظ نقطة الاستئناف");
    }
  };

  const handleRecordLesson = async () => {
    setSavingLesson(true);
    try {
      const res = await axios.post("/api/storage/record-lesson", {
        symbol: lessonSym,
        direction: lessonDir,
        outcome: lessonOutcome,
        pnlPercent: lessonOutcome === "LOSS" ? -Math.abs(lessonPnl) : Math.abs(lessonPnl),
        entryReason: lessonReason,
        timeframe: currentTimeframe
      });
      if (res.data?.success) {
        setFeedback(`تم حفظ الدرس والتحليل الذكي داخل ملف ${lessonSym.toUpperCase()}.json ✅`);
        loadAll();
      }
    } catch {
      setFeedback("فشل حفظ الدرس");
    } finally {
      setSavingLesson(false);
    }
  };

  const activeDocText =
    docTab === "termux" ? docs.termuxInstall : docTab === "explain" ? docs.howItWorks : docs.termuxScript;

  const copyActiveDoc = () => {
    navigator.clipboard.writeText(activeDocText);
    setCopiedDoc(true);
    setTimeout(() => setCopiedDoc(false), 1800);
  };

  const downloadTextFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Header Banner */}
      <div className="bg-[#090d16] border border-emerald-500/30 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <FolderSync className="w-5 h-5 text-emerald-400" />
              <span>مركز ذاكرة Termux ومزامنة مجلد التنزيلات + ملفات التثبيت والشرح الكامل</span>
            </h2>
            <p className="text-xs text-white/60 mt-1">
              كل عملة لها ملف JSON مستقل للتعلم الذاتي، مع حفظ لحظي لنقطة التوقف واستبدال مفاتيح AI مباشرة من الموقع إلى التنزيلات
            </p>
          </div>

          <a
            href="/api/storage/export-bundle"
            download
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs rounded-lg flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>تنزيل حزمة الذاكرة الكاملة لمجلد التنزيلات</span>
          </a>
        </div>

        {feedback && (
          <div className="p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-lg text-xs text-emerald-200 flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Storage Path Config + Checkpoint Resume */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="p-4 bg-black/50 border border-white/10 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-white">مسار المزامنة في الذاكرة الداخلية (Downloads)</span>
              <span className="text-[10px] font-mono bg-emerald-500/15 text-emerald-300 px-2 py-0.5 rounded">
                {status?.isTermuxDownloads ? "Termux /sdcard متصل 🟢" : `مسار محلي (${status?.platform || "linux"})`}
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                dir="ltr"
                value={syncInput}
                onChange={(e) => setSyncInput(e.target.value)}
                className="flex-1 bg-black border border-white/15 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-400"
              />
              <button
                type="button"
                onClick={handleUpdateSyncDir}
                className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 text-xs font-bold rounded-lg"
              >
                ربط المسار
              </button>
            </div>
            <p className="text-[11px] text-white/50">
              ملفات العملات المحفوظة حالياً: <strong className="text-white font-mono">{status?.trackedCoinsCount || 0}</strong> ملف مستقل داخل{" "}
              <code className="font-mono text-emerald-300" dir="ltr">{status?.coinsDir}</code>
            </p>
          </div>

          <div className="p-4 bg-black/50 border border-white/10 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-white">حفظ واستئناف نقطة التوقف (Checkpoint Resume)</span>
              {checkpoint?.savedAt && (
                <span className="text-[10px] font-mono text-white/45">
                  آخر حفظ: {new Date(checkpoint.savedAt).toLocaleTimeString("ar-SA")}
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 text-[11px] font-mono bg-white/[0.03] p-2.5 rounded-lg">
              <div>العملة: <strong className="text-emerald-300">{checkpoint?.selectedSymbol || currentSymbol}</strong></div>
              <div>الفريم: <strong className="text-cyan-300">{checkpoint?.activeTimeframe || currentTimeframe}</strong></div>
              <div>الشاشة: <strong className="text-amber-300">{checkpoint?.activeTab || currentTab}</strong></div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveCheckpointNow}
                className="flex-1 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-200 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>حفظ الحالة الحالية الآن</span>
              </button>
              {checkpoint && onRestoreCheckpoint && (
                <button
                  type="button"
                  onClick={() => onRestoreCheckpoint(checkpoint)}
                  className="flex-1 py-2 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-200 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5"
                >
                  <RefreshCcw className="w-3.5 h-3.5" />
                  <span>استئناف من آخر توقف</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Per-Coin Learning Files & Manual Outcome Recorder */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-4 bg-[#090d16] border border-white/10 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-cyan-400" />
            <span>تسجيل صفقة وتدريب الذاكرة (تعلم ذاتي)</span>
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-white/50 block mb-1">العملة</label>
                <input
                  type="text"
                  value={lessonSym}
                  onChange={(e) => setLessonSym(e.target.value.toUpperCase())}
                  className="w-full bg-black border border-white/15 rounded-lg px-3 py-2 font-mono text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-white/50 block mb-1">الاتجاه</label>
                <select
                  value={lessonDir}
                  onChange={(e) => setLessonDir(e.target.value as any)}
                  className="w-full bg-black border border-white/15 rounded-lg px-3 py-2 text-white focus:outline-none"
                >
                  <option value="LONG">LONG (شراء)</option>
                  <option value="SHORT">SHORT (بيع)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-white/50 block mb-1">النتيجة</label>
                <select
                  value={lessonOutcome}
                  onChange={(e) => setLessonOutcome(e.target.value as any)}
                  className="w-full bg-black border border-white/15 rounded-lg px-3 py-2 text-white focus:outline-none"
                >
                  <option value="WIN">✅ صفقة ناجحة (WIN)</option>
                  <option value="LOSS">❌ صفقة خاسرة (LOSS)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-white/50 block mb-1">نسبة الربح/الخسارة %</label>
                <input
                  type="number"
                  value={lessonPnl}
                  onChange={(e) => setLessonPnl(Number(e.target.value))}
                  className="w-full bg-black border border-white/15 rounded-lg px-3 py-2 font-mono text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-white/50 block mb-1">سبب الدخول والملابسات</label>
              <textarea
                rows={2}
                value={lessonReason}
                onChange={(e) => setLessonReason(e.target.value)}
                className="w-full bg-black border border-white/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={handleRecordLesson}
              disabled={savingLesson}
              className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs rounded-lg flex items-center justify-center gap-1.5"
            >
              {savingLesson ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
              <span>تحليل بالذكاء الاصطناعي وحفظ في {lessonSym}.json</span>
            </button>
          </div>
        </div>

        <div className="xl:col-span-8 bg-[#090d16] border border-white/10 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-400" />
              <span>ملفات العملات المستقلة ({coins.length} ملف في الذاكرة)</span>
            </h3>
            <button
              type="button"
              onClick={loadAll}
              className="text-xs text-cyan-300 hover:underline flex items-center gap-1"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              <span>تحديث</span>
            </button>
          </div>

          {coins.length === 0 ? (
            <div className="py-10 text-center text-xs text-white/50">
              يتم إنشاء ملف JSON مستقل لكل عملة تلقائياً بمجرد فحصها أو تسجيل صفقة لها.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[340px] overflow-y-auto custom-scrollbar pr-1">
              {coins.map((c) => (
                <div key={c.symbol} className="p-3 bg-black/50 border border-white/10 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => onSelectSymbol(c.symbol)}
                      className="text-sm font-black font-mono text-emerald-300 hover:underline"
                    >
                      {c.symbol}.json
                    </button>
                    <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded text-white">
                      نجاح: {c.winRate}% ({c.wins}W / {c.losses}L)
                    </span>
                  </div>
                  <div className="text-[10px] text-white/60 font-mono">
                    دعوم: ${c.knownSupportZones.join(", $") || "---"} | مصائد مكتشفة: {c.detectedTrapsCount}
                  </div>
                  {c.learnedRules.length > 0 && (
                    <div className="text-[11px] text-amber-200/90 bg-amber-500/10 border border-amber-500/20 rounded p-2">
                      {c.learnedRules[0]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Termux Install Guide & Full System Explanation Viewer */}
      <div className="bg-[#090d16] border border-cyan-500/25 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex flex-wrap gap-2">
            {[
              { id: "termux" as const, label: "📱 طريقة التثبيت من Termux (أوامر كاملة)", icon: Terminal },
              { id: "explain" as const, label: "📘 شرح العمل والتعديل وإضافة المفاتيح", icon: BookOpen },
              { id: "script" as const, label: "⚡ سكربت التثبيت الآلي (termux_setup.sh)", icon: FileCode2 }
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setDocTab(t.id)}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all ${
                  docTab === t.id
                    ? "bg-cyan-500 text-black border-cyan-400"
                    : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10"
                }`}
              >
                <t.icon className="w-4 h-4" />
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copyActiveDoc}
              className="px-3 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-lg flex items-center gap-1.5"
            >
              {copiedDoc ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedDoc ? "تم النسخ!" : "نسخ المحتوى"}</span>
            </button>
            <button
              type="button"
              onClick={() =>
                downloadTextFile(
                  docTab === "termux"
                    ? "طريقة_التثبيت_من_ترميكس.md"
                    : docTab === "explain"
                      ? "شرح_العمل_والتطوير.md"
                      : "termux_setup.sh",
                  activeDocText
                )
              }
              className="px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold rounded-lg flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تنزيل الملف</span>
            </button>
          </div>
        </div>

        <pre className="bg-black/80 border border-white/10 rounded-xl p-4 text-xs text-white/85 font-mono leading-relaxed overflow-x-auto max-h-[480px] overflow-y-auto whitespace-pre-wrap">
          {activeDocText || "جاري تحميل الملف..."}
        </pre>
      </div>
    </div>
  );
};

export default TermuxAndDocsHub;
