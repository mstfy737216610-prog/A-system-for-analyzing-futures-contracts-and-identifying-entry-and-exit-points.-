import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Cpu, Key, Globe, CheckCircle2, AlertCircle, RefreshCcw,
  X, ShieldCheck, Sparkles, Server, Sliders, Plus, Trash2,
  Eye, EyeOff, FolderSync, Zap
} from "lucide-react";
import axios from "axios";

interface AiProviderSite {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  maskedKey?: string;
  hasKey?: boolean;
  enabled: boolean;
  models: string[];
  lastTestedAt?: number;
  lastLatencyMs?: number;
  lastStatus?: "OK" | "ERROR" | "UNTESTED";
  lastError?: string;
}

type AiRoleKey = "news" | "vision" | "learning" | "report" | "entryExplain";

interface AiHubConfigState {
  mode: "HYBRID" | "NO_AI" | "AI_ONLY";
  providers: AiProviderSite[];
  roleMapping: Record<AiRoleKey, { providerId: string; model: string }>;
  isPreemptiveSniperMode: boolean;
  updatedAt?: number;
}

interface AiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigUpdated?: (cfg: AiHubConfigState) => void;
}

const ROLE_LABELS: Array<{
  key: AiRoleKey;
  title: string;
  subtitle: string;
  accent: string;
}> = [
  {
    key: "news",
    title: "1. التحليل النصي للأخبار والماكرو",
    subtitle: "الفيدرالي الأمريكي، CoinDesk، Cointelegraph، وX/Telegram",
    accent: "text-amber-300 border-amber-500/30"
  },
  {
    key: "vision",
    title: "2. قراءة صور الشارت (Vision AI)",
    subtitle: "تحليل لقطات الشموع (15m/1h/4h) وكشف النماذج والسيولة — يوصى بـ agnes-2.5-flash",
    accent: "text-cyan-300 border-cyan-500/30"
  },
  {
    key: "learning",
    title: "3. مدقق التعلم وتحليل الخسائر والأخطاء",
    subtitle: "مراجعة سجل كل عملة واستخلاص قاعدة منع الخسارة المتكررة",
    accent: "text-rose-300 border-rose-500/30"
  },
  {
    key: "report",
    title: "4. صياغة التقرير السوقي المقروء",
    subtitle: "دمج قطاع الـ AI والذهب ومؤشرات السيولة في ملخص واضح",
    accent: "text-emerald-300 border-emerald-500/30"
  },
  {
    key: "entryExplain",
    title: "5. شرح سبب الدخول والأهداف والوقف",
    subtitle: "رسالة إقناع وتبرير تنفيذي لحساب الـ 50$ مع الرافعة المعزولة",
    accent: "text-purple-300 border-purple-500/30"
  }
];

export const AiConfigModal: React.FC<AiConfigModalProps> = ({ isOpen, onClose, onConfigUpdated }) => {
  const [config, setConfig] = useState<AiHubConfigState | null>(null);
  const [syncDir, setSyncDir] = useState<string>("");
  const [isTermux, setIsTermux] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testMessages, setTestMessages] = useState<Record<string, { ok: boolean; msg: string }>>({});
  const [showKeyIds, setShowKeyIds] = useState<Record<string, boolean>>({});

  // New site form
  const [newName, setNewName] = useState("");
  const [newBaseUrl, setNewBaseUrl] = useState("");
  const [newApiKey, setNewApiKey] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setSaveFeedback(null);
    axios
      .get("/api/ai-hub/config")
      .then((res) => {
        if (res.data?.config) {
          setConfig(res.data.config);
        }
        if (res.data?.storage) {
          setSyncDir(res.data.storage.syncDir || "");
          setIsTermux(Boolean(res.data.storage.isTermuxDownloads));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen]);

  const handleTestProvider = async (provider: AiProviderSite) => {
    const keyToSend = provider.apiKey && !provider.apiKey.includes("...") ? provider.apiKey : "";
    if (!provider.baseUrl || (!keyToSend && !provider.hasKey)) {
      setTestMessages((prev) => ({
        ...prev,
        [provider.id]: { ok: false, msg: "يرجى إدخال رابط الموقع (Base URL) ومفتاح API صالح قبل الاختبار." }
      }));
      return;
    }

    setTestingId(provider.id);
    try {
      // If user left masked key untouched, send config save first or pass full key
      const res = await axios.post("/api/ai-hub/test-provider", {
        baseUrl: provider.baseUrl,
        apiKey: keyToSend || provider.apiKey,
        model: provider.models.find((m) => m.includes("3.0-flash") || m.includes("2.5-flash")) || provider.models[0]
      });

      if (res.data?.success) {
        const discovered: string[] = Array.isArray(res.data.models) && res.data.models.length > 0
          ? res.data.models
          : provider.models;
        setConfig((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            providers: prev.providers.map((p) =>
              p.id === provider.id
                ? {
                    ...p,
                    models: discovered,
                    lastStatus: "OK",
                    lastLatencyMs: res.data.latencyMs,
                    lastTestedAt: Date.now(),
                    lastError: undefined
                  }
                : p
            )
          };
        });
        setTestMessages((prev) => ({
          ...prev,
          [provider.id]: {
            ok: true,
            msg: `متصل بنجاح (${res.data.latencyMs}ms) عبر ${res.data.testedModel} — تم اكتشاف ${discovered.length} نموذج.`
          }
        }));
      } else {
        setConfig((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            providers: prev.providers.map((p) =>
              p.id === provider.id ? { ...p, lastStatus: "ERROR", lastError: res.data?.error } : p
            )
          };
        });
        setTestMessages((prev) => ({
          ...prev,
          [provider.id]: { ok: false, msg: res.data?.error || "فشل فحص الخادم" }
        }));
      }
    } catch (err: any) {
      setTestMessages((prev) => ({
        ...prev,
        [provider.id]: { ok: false, msg: err?.response?.data?.error || err.message }
      }));
    } finally {
      setTestingId(null);
    }
  };

  const handleAddProvider = () => {
    if (!newBaseUrl.trim() || !newApiKey.trim() || !config) return;
    const id = `site-${Date.now()}`;
    const newSite: AiProviderSite = {
      id,
      name: newName.trim() || `موقع ذكاء اصطناعي #${config.providers.length + 1}`,
      baseUrl: newBaseUrl.trim().replace(/\/+$/, ""),
      apiKey: newApiKey.trim(),
      hasKey: true,
      enabled: true,
      models: ["gpt-4o-mini", "deepseek-chat", "agnes-3.0-flash"],
      lastStatus: "UNTESTED"
    };
    setConfig({
      ...config,
      providers: [...config.providers, newSite]
    });
    setNewName("");
    setNewBaseUrl("");
    setNewApiKey("");
  };

  const handleRemoveProvider = (id: string) => {
    if (!config || config.providers.length <= 1) return;
    const remaining = config.providers.filter((p) => p.id !== id);
    const fallbackId = remaining[0].id;
    const nextMapping = { ...config.roleMapping };
    (Object.keys(nextMapping) as AiRoleKey[]).forEach((role) => {
      if (nextMapping[role].providerId === id) {
        nextMapping[role] = {
          providerId: fallbackId,
          model: remaining[0].models[0] || "agnes-3.0-flash"
        };
      }
    });
    setConfig({ ...config, providers: remaining, roleMapping: nextMapping });
  };

  const handleSaveAll = async () => {
    if (!config) return;
    setSaving(true);
    setSaveFeedback(null);
    try {
      const res = await axios.post("/api/ai-hub/config", config);
      if (res.data?.config) {
        setConfig(res.data.config);
        onConfigUpdated?.(res.data.config);
      }
      setSaveFeedback("تم حفظ المفاتيح والمواقع والنماذج ومزامنتها فوراً مع ذاكرة التخزين ومجلد التنزيلات!");
      setTimeout(() => {
        setSaveFeedback(null);
        onClose();
      }, 1100);
    } catch (err: any) {
      setSaveFeedback(err?.response?.data?.error || "فشل حفظ الإعدادات");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          className="w-full max-w-4xl bg-[#090d16] border border-cyan-500/30 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
          dir="rtl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-l from-cyan-950/40 via-emerald-950/20 to-[#090d16] border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-cyan-500/15 border border-cyan-500/30 rounded-lg text-cyan-400">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  مركز إدارة مواقع ومفاتيح الذكاء الاصطناعي المتعددة (5 أدوار متوازية)
                </h3>
                <p className="text-xs text-white/55 mt-0.5">
                  أضف أي عدد من المواقع والمفاتيح، بدّل وضع العمل (مع AI أو بدون AI)، وعيّن كل نموذج في مكانه الصحيح
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-white/40 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-6 custom-scrollbar text-right">
            {loading || !config ? (
              <div className="py-12 text-center text-white/60 text-sm flex items-center justify-center gap-2">
                <RefreshCcw className="w-4 h-4 animate-spin text-cyan-400" />
                <span>جاري تحميل إعدادات المواقع والنماذج من الذاكرة الدائمة...</span>
              </div>
            ) : (
              <>
                {/* Termux Downloads Auto-Sync Banner */}
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <FolderSync className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div className="text-xs">
                      <span className="font-bold text-white block">
                        المزامنة المباشرة مع ذاكرة الهاتف ({isTermux ? "مجلد التنزيلات في Termux 🟢" : "مجلد المزامنة المحلي"})
                      </span>
                      <span className="font-mono text-[11px] text-emerald-300/90" dir="ltr">
                        {syncDir}/ai_providers_config.json
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-200 px-2.5 py-1 rounded">
                    حفظ واستبدال فوري تلقائي
                  </span>
                </div>

                {/* Execution Mode Switcher */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    وضع تشغيل المحرك (يعمل مع الذكاء الاصطناعي أو بدونه بالكامل):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      {
                        id: "HYBRID" as const,
                        title: "الوضع الهجين الموصى به (HYBRID)",
                        desc: "يجمع التحليل الكمي الرياضي + مجلس الـ 5 نماذج AI معاً"
                      },
                      {
                        id: "NO_AI" as const,
                        title: "بدون ذكاء اصطناعي (NO_AI)",
                        desc: "محرك كمي رياضي وأمن سيبراني مستقل 100% بسرعة فائقة"
                      },
                      {
                        id: "AI_ONLY" as const,
                        title: "أولوية الذكاء الاصطناعي (AI_ONLY)",
                        desc: "اعتماد أعمق على تقارير ورؤية الشارت للنماذج المتصلة"
                      }
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setConfig({ ...config, mode: m.id })}
                        className={`p-3 rounded-xl border text-right transition-all ${
                          config.mode === m.id
                            ? "bg-cyan-500/15 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                            : "bg-white/[0.02] border-white/10 text-white/60 hover:bg-white/[0.04]"
                        }`}
                      >
                        <div className="text-xs font-black">{m.title}</div>
                        <div className="text-[10px] opacity-75 mt-1">{m.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Configured AI Sites List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-cyan-400" />
                      <h4 className="text-sm font-black text-white">المواقع والمفاتيح المربوطة ({config.providers.length})</h4>
                    </div>
                    <span className="text-[11px] text-white/45">
                      Agnes AI Hub مختبر ومجهز — يمكنك تعديل المفتاح أو إضافة مواقع أخرى بحرية
                    </span>
                  </div>

                  <div className="space-y-3">
                    {config.providers.map((prov) => {
                      const testInfo = testMessages[prov.id];
                      const showKey = Boolean(showKeyIds[prov.id]);
                      return (
                        <div
                          key={prov.id}
                          className={`p-4 rounded-xl border transition-all space-y-3 ${
                            prov.enabled ? "bg-white/[0.03] border-white/15" : "bg-black/40 border-white/5 opacity-60"
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={prov.enabled}
                                onChange={(e) =>
                                  setConfig({
                                    ...config,
                                    providers: config.providers.map((p) =>
                                      p.id === prov.id ? { ...p, enabled: e.target.checked } : p
                                    )
                                  })
                                }
                                className="accent-emerald-500 w-4 h-4"
                              />
                              <input
                                type="text"
                                value={prov.name}
                                onChange={(e) =>
                                  setConfig({
                                    ...config,
                                    providers: config.providers.map((p) =>
                                      p.id === prov.id ? { ...p, name: e.target.value } : p
                                    )
                                  })
                                }
                                className="bg-transparent border-b border-white/10 focus:border-cyan-400 text-sm font-bold text-white px-1 py-0.5 focus:outline-none"
                              />
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                                  prov.lastStatus === "OK"
                                    ? "bg-emerald-500/20 text-emerald-300"
                                    : prov.lastStatus === "ERROR"
                                      ? "bg-rose-500/20 text-rose-300"
                                      : "bg-white/10 text-white/50"
                                }`}
                              >
                                {prov.lastStatus === "OK"
                                  ? `نشط 🟢 ${prov.lastLatencyMs ? `${prov.lastLatencyMs}ms` : ""}`
                                  : prov.lastStatus === "ERROR"
                                    ? "خطأ"
                                    : "غير مختبر"}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleTestProvider(prov)}
                                disabled={testingId === prov.id}
                                className="px-3 py-1.5 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 text-[11px] font-bold rounded-lg flex items-center gap-1.5"
                              >
                                {testingId === prov.id ? (
                                  <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Server className="w-3.5 h-3.5" />
                                )}
                                <span>اختبار وجلب النماذج</span>
                              </button>
                              {config.providers.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveProvider(prov.id)}
                                  className="p-1.5 text-rose-400/70 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg"
                                  title="حذف هذا الموقع"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] text-white/50 block mb-1">رابط الموقع (Base URL)</label>
                              <input
                                type="text"
                                dir="ltr"
                                value={prov.baseUrl}
                                onChange={(e) =>
                                  setConfig({
                                    ...config,
                                    providers: config.providers.map((p) =>
                                      p.id === prov.id ? { ...p, baseUrl: e.target.value } : p
                                    )
                                  })
                                }
                                className="w-full bg-black/60 border border-white/10 focus:border-cyan-400 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] text-white/50 block mb-1">
                                مفتاح API الجديد (استبدال المفتاح الحالي: {prov.maskedKey || "غير مضبوط"})
                              </label>
                              <div className="relative">
                                <input
                                  type={showKey ? "text" : "password"}
                                  dir="ltr"
                                  value={prov.apiKey.includes("...") ? "" : prov.apiKey}
                                  placeholder={prov.maskedKey ? `المفتاح الحالي محفوظ (${prov.maskedKey}) — اكتب جديداً للاستبدال` : "sk-..."}
                                  onChange={(e) =>
                                    setConfig({
                                      ...config,
                                      providers: config.providers.map((p) =>
                                        p.id === prov.id ? { ...p, apiKey: e.target.value } : p
                                      )
                                    })
                                  }
                                  className="w-full bg-black/60 border border-white/10 focus:border-cyan-400 rounded-lg px-3 py-2 pl-9 text-xs text-white font-mono placeholder:text-white/30 focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowKeyIds((prev) => ({ ...prev, [prov.id]: !prev[prov.id] }))}
                                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                                >
                                  {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Available Models chips */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[10px] text-white/40 ml-1">النماذج المتاحة:</span>
                            {prov.models.map((m) => (
                              <span
                                key={m}
                                className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                                  m.includes("3.0-flash") || m.includes("2.5-flash")
                                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                                    : "bg-white/5 border-white/10 text-white/60"
                                }`}
                              >
                                {m}
                              </span>
                            ))}
                          </div>

                          {testInfo && (
                            <div
                              className={`p-2.5 rounded-lg text-xs border flex items-center gap-2 ${
                                testInfo.ok
                                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                                  : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                              }`}
                            >
                              {testInfo.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                              <span>{testInfo.msg}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Add New Provider Site */}
                  <div className="p-4 bg-cyan-500/5 border border-dashed border-cyan-500/30 rounded-xl space-y-3">
                    <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                      <Plus className="w-4 h-4" />
                      <span>إضافة موقع ذكاء اصطناعي جديد (OpenAI / DeepSeek / OpenRouter / Groq / إلخ)</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="اسم الموقع (مثال: DeepSeek Hub)"
                        className="bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                      />
                      <input
                        type="text"
                        dir="ltr"
                        value={newBaseUrl}
                        onChange={(e) => setNewBaseUrl(e.target.value)}
                        placeholder="https://api.example.com/v1"
                        className="bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                      />
                      <div className="flex gap-2">
                        <input
                          type="password"
                          dir="ltr"
                          value={newApiKey}
                          onChange={(e) => setNewApiKey(e.target.value)}
                          placeholder="sk-..."
                          className="flex-1 bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                        />
                        <button
                          type="button"
                          onClick={handleAddProvider}
                          disabled={!newBaseUrl.trim() || !newApiKey.trim()}
                          className="px-3.5 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-black font-black text-xs rounded-lg shrink-0"
                        >
                          إضافة
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5-Role Model Mapping */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-sm font-black text-white">توزيع الـ 5 نماذج للعمل في وقت واحد (كل نموذج في مكانه الصحيح)</h4>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-lg text-[11px] text-amber-200/90 leading-relaxed">
                    <strong>تنبيه تقني مهم لنماذج Agnes:</strong> نموذج <code className="font-mono text-white">agnes-3.0-flash</code> و{" "}
                    <code className="font-mono text-white">agnes-2.5-flash</code> يدعمان قراءة النصوص <strong>وفحص صور الشارت (Vision)</strong> بدقة عالية. أما{" "}
                    <code className="font-mono text-amber-300">agnes-image-*</code> فهو لتوليد الصور فقط، ويقوم محركنا تلقائياً بتحويله إلى{" "}
                    <code className="font-mono text-emerald-300">agnes-2.5-flash</code> عند إرسال لقطات الشارت لمنع أي خطأ.
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {ROLE_LABELS.map((role) => {
                      const map = config.roleMapping[role.key] || {
                        providerId: config.providers[0]?.id || "",
                        model: "agnes-3.0-flash"
                      };
                      const activeProv = config.providers.find((p) => p.id === map.providerId) || config.providers[0];
                      const modelChoices = activeProv?.models || [];

                      return (
                        <div key={role.key} className={`p-3.5 bg-white/[0.02] border rounded-xl space-y-2 ${role.accent}`}>
                          <div>
                            <div className="text-xs font-black text-white">{role.title}</div>
                            <div className="text-[10px] text-white/55 mt-0.5">{role.subtitle}</div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <select
                              value={map.providerId}
                              onChange={(e) => {
                                const nextProvId = e.target.value;
                                const p = config.providers.find((x) => x.id === nextProvId);
                                setConfig({
                                  ...config,
                                  roleMapping: {
                                    ...config.roleMapping,
                                    [role.key]: {
                                      providerId: nextProvId,
                                      model: p?.models[0] || map.model
                                    }
                                  }
                                });
                              }}
                              className="bg-black/70 border border-white/15 rounded-lg px-2.5 py-1.5 text-[11px] text-white focus:outline-none"
                            >
                              {config.providers.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                            </select>

                            <input
                              type="text"
                              dir="ltr"
                              list={`models-${role.key}`}
                              value={map.model}
                              onChange={(e) =>
                                setConfig({
                                  ...config,
                                  roleMapping: {
                                    ...config.roleMapping,
                                    [role.key]: {
                                      ...map,
                                      model: e.target.value
                                    }
                                  }
                                })
                              }
                              className="bg-black/70 border border-white/15 rounded-lg px-2.5 py-1.5 text-[11px] text-white font-mono focus:outline-none"
                            />
                            <datalist id={`models-${role.key}`}>
                              {modelChoices.map((m) => (
                                <option key={m} value={m} />
                              ))}
                            </datalist>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Preemptive Sniper Toggle */}
                <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-amber-200 block">وضع القنص الاستباقي قبل وقوع الحركة</span>
                      <span className="text-[10px] text-white/55">
                        يراقب انضغاط البولنجر وتدفق المشترين داخل الشموع لإرسال التنبيه قبل الانفجار السعري
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.isPreemptiveSniperMode}
                    onChange={(e) => setConfig({ ...config, isPreemptiveSniperMode: e.target.checked })}
                    className="accent-amber-500 w-5 h-5"
                  />
                </div>

                {saveFeedback && (
                  <div className="p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-lg text-xs text-emerald-200 flex items-center gap-2 font-bold">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{saveFeedback}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-black/50 border-t border-white/10 flex items-center justify-between gap-3">
            <div className="text-[11px] text-white/45 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-emerald-400" />
              <span>لا حاجة لمفتاح Binance الخاص — كل التحليلات تعمل ببيانات السوق المفتوحة</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-white/60 hover:text-white transition-colors"
              >
                إغلاق
              </button>
              <button
                type="button"
                onClick={handleSaveAll}
                disabled={saving || !config}
                className="px-6 py-2 bg-gradient-to-l from-cyan-400 to-emerald-400 hover:brightness-110 text-black font-black text-xs rounded-lg transition-all flex items-center gap-1.5"
              >
                {saving ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>حفظ ومزامنة مع التنزيلات</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AiConfigModal;
