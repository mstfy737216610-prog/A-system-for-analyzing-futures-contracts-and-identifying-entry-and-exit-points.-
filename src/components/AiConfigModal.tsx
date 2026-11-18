import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Cpu, Key, Globe, CheckCircle2, AlertCircle, RefreshCcw, 
  X, ShieldCheck, Sparkles, Server, Sliders, Info
} from "lucide-react";
import axios from "axios";

interface AiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiConfigModal: React.FC<AiConfigModalProps> = ({ isOpen, onClose }) => {
  const [customEndpoint, setCustomEndpoint] = useState("");
  const [customApiKey, setCustomApiKey] = useState("");
  const [useCustomApi, setUseCustomApi] = useState(false);
  const [modelVisual, setModelVisual] = useState("MiniMax-M3");
  const [modelReasoning, setModelReasoning] = useState("DeepSeek-V4-Pro");
  const [modelNews, setModelNews] = useState("Kimi K3");
  const [modelFlash, setModelFlash] = useState("step-3.7-flash");
  const [isPreemptiveSniperMode, setIsPreemptiveSniperMode] = useState(false);
  
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; latencyMs?: number; message?: string; error?: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Load current config from server
      axios.get("/api/ai-config").then((res) => {
        if (res.data) {
          if (res.data.customEndpoint) setCustomEndpoint(res.data.customEndpoint);
          if (res.data.useCustomApi !== undefined) setUseCustomApi(res.data.useCustomApi);
          if (res.data.modelVisual) setModelVisual(res.data.modelVisual);
          if (res.data.modelReasoning) setModelReasoning(res.data.modelReasoning);
          if (res.data.modelNews) setModelNews(res.data.modelNews);
          if (res.data.modelFlash) setModelFlash(res.data.modelFlash);
          if (res.data.isPreemptiveSniperMode !== undefined) setIsPreemptiveSniperMode(res.data.isPreemptiveSniperMode);
        }
      }).catch(() => {
        // Fallback to local storage if needed
        try {
          const saved = localStorage.getItem("avantis_ai_config");
          if (saved) {
            const parsed = JSON.parse(saved);
            setCustomEndpoint(parsed.customEndpoint || "");
            setCustomApiKey(parsed.customApiKey || "");
            setUseCustomApi(Boolean(parsed.useCustomApi));
            if (parsed.modelVisual) setModelVisual(parsed.modelVisual);
            if (parsed.modelReasoning) setModelReasoning(parsed.modelReasoning);
            if (parsed.modelNews) setModelNews(parsed.modelNews);
            if (parsed.modelFlash) setModelFlash(parsed.modelFlash);
            if (parsed.isPreemptiveSniperMode !== undefined) setIsPreemptiveSniperMode(parsed.isPreemptiveSniperMode);
          }
        } catch {}
      });
    }
  }, [isOpen]);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await axios.post("/api/ai-test", {
        customEndpoint,
        customApiKey,
        model: modelReasoning
      });
      setTestResult(res.data);
    } catch (err: any) {
      setTestResult({
        success: false,
        error: err.response?.data?.error || err.message || "فشل الاتصال بالواجهة البرمجية."
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await axios.post("/api/ai-config", {
        customEndpoint,
        customApiKey,
        useCustomApi,
        modelVisual,
        modelReasoning,
        modelNews,
        modelFlash,
        isPreemptiveSniperMode
      });

      localStorage.setItem("avantis_ai_config", JSON.stringify({
        customEndpoint,
        customApiKey,
        useCustomApi,
        modelVisual,
        modelReasoning,
        modelNews,
        modelFlash,
        isPreemptiveSniperMode
      }));

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error("Failed to save AI config", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-2xl bg-[#090d16] border border-cyan-500/30 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-cyan-950/40 via-blue-950/20 to-[#090d16] border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  تخصيص مزود ونماذج الذكاء الاصطناعي (AI Gateway API)
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded font-mono font-bold">
                    CUSTOM API
                  </span>
                </h3>
                <p className="text-xs text-white/50 mt-0.5">
                  تحكم كامل في مفاتيح ونماذج DeepSeek, MiniMax, Kimi, والمحرك الفوري
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

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar text-right" dir="rtl">
            {/* Auto-Connected Success Banner */}
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg text-[#10b981]">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    جميع أدوات ونماذج الذكاء الاصطناعي مربوطة وتعمل تلقائياً 🟢
                  </h4>
                  <p className="text-xs text-emerald-300/80 mt-0.5">
                    النظام مُهيأ مسبقاً ولا يتطلب منك إدخال أي مفتاح أو إعداد يدوي للبدء.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                <div className="p-2 bg-black/40 border border-white/5 rounded-md text-center">
                  <span className="text-cyan-400 font-bold block">MiniMax-M3</span>
                  <span className="text-[9px] text-white/50">شارت بصري 🟢</span>
                </div>
                <div className="p-2 bg-black/40 border border-white/5 rounded-md text-center">
                  <span className="text-emerald-400 font-bold block">DeepSeek-V4-Pro</span>
                  <span className="text-[9px] text-white/50">منطق الحيتان 🟢</span>
                </div>
                <div className="p-2 bg-black/40 border border-white/5 rounded-md text-center">
                  <span className="text-amber-400 font-bold block">Kimi K3</span>
                  <span className="text-[9px] text-white/50">أخبار ومشاعر 🟢</span>
                </div>
                <div className="p-2 bg-black/40 border border-white/5 rounded-md text-center">
                  <span className="text-purple-400 font-bold block">step-3.7-flash</span>
                  <span className="text-[9px] text-white/50">تنفيذ لحظي 🟢</span>
                </div>
              </div>
            </div>

            {/* Toggle Custom API */}
            <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-white block">تخصيص API خارجي يدوي (اختياري فقط)</span>
                <p className="text-xs text-white/50 mt-0.5">
                  افتراضياً، النظام يعمل ذاتياً. فعّل هذا الخيار فقط إذا كنت تملك خادم API خاص وتريد توجيه الطلبات إليه.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useCustomApi}
                  onChange={(e) => setUseCustomApi(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
              </label>
            </div>

            {/* Toggle Preemptive Sniper Mode */}
            <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-bold text-amber-300 block">وضع القنص الاستباقي (Preemptive Sniper Mode)</span>
                  <p className="text-[11px] text-amber-200/60 mt-0.5">
                    تنبيهات فورية عند اكتشاف تجميع الحيتان (Whale Accumulation) قبل اكتمال النماذج الفنية.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPreemptiveSniperMode}
                  onChange={(e) => setIsPreemptiveSniperMode(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]"></div>
              </label>
            </div>

            {/* Custom Endpoint & API Key Fields */}
            <div className={`space-y-4 transition-opacity ${useCustomApi ? 'opacity-100' : 'opacity-60'}`}>
              <div>
                <label className="block text-xs font-bold text-white/80 mb-1.5 flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  رابط نقطة النهاية (API Endpoint URL)
                </label>
                <input
                  type="text"
                  value={customEndpoint}
                  onChange={(e) => setCustomEndpoint(e.target.value)}
                  placeholder="مثال: https://api.deepseek.com/v1 أو https://openrouter.ai/api/v1"
                  className="w-full bg-black/40 border border-white/15 focus:border-cyan-400 rounded-lg px-4 py-2.5 text-sm text-white font-mono placeholder:text-white/30 focus:outline-none transition-colors"
                />
                <span className="text-[11px] text-white/40 mt-1 block font-sans">
                  يقبل أي خادم متوافق مع معيار OpenAI / Chat Completions.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-white/80 mb-1.5 flex items-center gap-2">
                  <Key className="w-3.5 h-3.5 text-cyan-400" />
                  مفتاح API السري (API Secret Key)
                </label>
                <input
                  type="password"
                  value={customApiKey}
                  onChange={(e) => setCustomApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full bg-black/40 border border-white/15 focus:border-cyan-400 rounded-lg px-4 py-2.5 text-sm text-white font-mono placeholder:text-white/30 focus:outline-none transition-colors"
                />
                <span className="text-[11px] text-white/40 mt-1 block font-sans">
                  يتم حفظ المفتاح بأمان داخل السيرفر لاستخدامه في التحليل المؤسساتي العميق.
                </span>
              </div>
            </div>

            {/* Models Specialization Grid */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold text-white">تخصيص نماذج المهام الأربعة (Task-Specific Model Mapping)</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Visual Chart Model */}
                <div className="p-3 bg-white/[0.02] border border-white/10 rounded-lg space-y-1.5">
                  <span className="text-[11px] font-bold text-cyan-300 block">1. تحليل الشارت البصري (Vision AI)</span>
                  <input
                    type="text"
                    value={modelVisual}
                    onChange={(e) => setModelVisual(e.target.value)}
                    placeholder="MiniMax-M3"
                    className="w-full bg-black/50 border border-white/10 focus:border-cyan-400 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                  />
                  <div className="flex gap-1 pt-1">
                    {["MiniMax-M3", "gemini-3.8-flash", "gpt-4o"].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setModelVisual(m)}
                        className={`text-[9px] px-1.5 py-0.5 rounded font-mono border ${modelVisual === m ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400' : 'bg-white/5 text-white/40 border-white/10'}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Deep Reasoning Model */}
                <div className="p-3 bg-white/[0.02] border border-white/10 rounded-lg space-y-1.5">
                  <span className="text-[11px] font-bold text-[#10b981] block">2. التحليل العميق والمنطقي (Reasoning)</span>
                  <input
                    type="text"
                    value={modelReasoning}
                    onChange={(e) => setModelReasoning(e.target.value)}
                    placeholder="DeepSeek-V4-Pro"
                    className="w-full bg-black/50 border border-white/10 focus:border-[#10b981] rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                  />
                  <div className="flex gap-1 pt-1">
                    {["DeepSeek-V4-Pro", "deepseek-chat", "deepseek-reasoner"].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setModelReasoning(m)}
                        className={`text-[9px] px-1.5 py-0.5 rounded font-mono border ${modelReasoning === m ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400' : 'bg-white/5 text-white/40 border-white/10'}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* News & Sentiment Model */}
                <div className="p-3 bg-white/[0.02] border border-white/10 rounded-lg space-y-1.5">
                  <span className="text-[11px] font-bold text-amber-300 block">3. تحليل الأخبار والمشاعر (Sentiment)</span>
                  <input
                    type="text"
                    value={modelNews}
                    onChange={(e) => setModelNews(e.target.value)}
                    placeholder="Kimi K3"
                    className="w-full bg-black/50 border border-white/10 focus:border-amber-400 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                  />
                  <div className="flex gap-1 pt-1">
                    {["Kimi K3", "moonshot-v1-auto", "gemini-3.1-flash-lite"].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setModelNews(m)}
                        className={`text-[9px] px-1.5 py-0.5 rounded font-mono border ${modelNews === m ? 'bg-amber-500/20 text-amber-300 border-amber-400' : 'bg-white/5 text-white/40 border-white/10'}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Flash Real-Time Model */}
                <div className="p-3 bg-white/[0.02] border border-white/10 rounded-lg space-y-1.5">
                  <span className="text-[11px] font-bold text-purple-300 block">4. التحليل اللحظي السريع (Fast Flash)</span>
                  <input
                    type="text"
                    value={modelFlash}
                    onChange={(e) => setModelFlash(e.target.value)}
                    placeholder="step-3.7-flash"
                    className="w-full bg-black/50 border border-white/10 focus:border-purple-400 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                  />
                  <div className="flex gap-1 pt-1">
                    {["step-3.7-flash", "gemini-3.1-flash-lite", "gpt-4o-mini"].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setModelFlash(m)}
                        className={`text-[9px] px-1.5 py-0.5 rounded font-mono border ${modelFlash === m ? 'bg-purple-500/20 text-purple-300 border-purple-400' : 'bg-white/5 text-white/40 border-white/10'}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Test Connection Results */}
            {testResult && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-lg border text-xs leading-relaxed ${
                  testResult.success 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                <div className="flex items-center gap-2 font-bold mb-1">
                  {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
                  <span>{testResult.success ? `تم الاتصال بنجاح (${testResult.latencyMs}ms)` : 'فشل فحص الاتصال'}</span>
                </div>
                <p className="opacity-90">{testResult.message || testResult.error}</p>
              </motion.div>
            )}

            {/* Informational Box */}
            <div className="p-3.5 bg-blue-500/5 border border-blue-500/20 rounded-lg flex items-start gap-2.5">
              <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-blue-300/80 leading-relaxed">
                ملاحظة: النظام يحافظ على أقصى درجات الدقة قبل السرعة، ولا يعرض أي إشارة إلا بعد اكتمال التدقيق الرياضي وهندسة الشموع بدقة 85%+ سواء تم استخدام المفتاح الخارجي أو المحرك الافتراضي.
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-black/40 border-t border-white/10 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting || !customEndpoint}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-40 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
            >
              {isTesting ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <Server className="w-3.5 h-3.5" />}
              <span>فحص الاتصال اللحظي</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-white/60 hover:text-white transition-colors"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-lg transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center gap-1.5"
              >
                {isSaving ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>{saveSuccess ? "تم الحفظ بنجاح!" : "حفظ الإعدادات"}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
export default AiConfigModal;
