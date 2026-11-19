import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Lock, Shield, Key, CheckCircle2, AlertCircle, RefreshCcw, 
  ExternalLink, Eye, EyeOff, Server, Wallet, ShieldCheck, X
} from "lucide-react";
import { BinanceAccountInfo } from "../types";
import axios from "axios";

interface BinanceConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (info: BinanceAccountInfo) => void;
}

export const BinanceConnectModal: React.FC<BinanceConnectModalProps> = ({ 
  isOpen, 
  onClose,
  onStatusChange 
}) => {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("avantis_binance_api_key") || "");
  const [apiSecret, setApiSecret] = useState(() => localStorage.getItem("avantis_binance_api_secret") || "");
  const [showSecret, setShowSecret] = useState(false);
  const [testing, setTesting] = useState(false);
  const [accountInfo, setAccountInfo] = useState<BinanceAccountInfo | null>(null);

  const testConnection = async () => {
    try {
      setTesting(true);
      const res = await axios.post("/api/binance/test", {
        apiKey: apiKey.trim(),
        apiSecret: apiSecret.trim()
      });

      if (res.data) {
        setAccountInfo(res.data);
        if (onStatusChange) onStatusChange(res.data);
        if (res.data.connected && apiKey && apiSecret) {
          localStorage.setItem("avantis_binance_api_key", apiKey.trim());
          localStorage.setItem("avantis_binance_api_secret", apiSecret.trim());
        }
      }
    } catch (err: any) {
      setAccountInfo({
        connected: false,
        error: "فشل الاتصال بخادم Binance."
      });
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      testConnection();
    }
  }, [isOpen]);

  const disconnect = () => {
    localStorage.removeItem("avantis_binance_api_key");
    localStorage.removeItem("avantis_binance_api_secret");
    setApiKey("");
    setApiSecret("");
    setAccountInfo(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#0c0c0c] border border-white/10 w-full max-w-lg rounded-sm p-6 space-y-6 shadow-2xl relative"
      >
        <button
          onClick={onClose}
          className="absolute left-4 top-4 p-1.5 text-white/40 hover:text-white rounded-sm hover:bg-white/5 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-sm border border-emerald-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              الوضع الآمن بدون مفاتيح بايننس (اختياري تماماً)
            </h3>
            <p className="text-xs text-emerald-300/80 mt-0.5">
              النظام يعمل 100% بدون الحاجة لأي مفتاح Binance الخاص عبر بيانات العقود المفتوحة (Binance / Bybit / OKX / Gate)
            </p>
          </div>
        </div>

        {/* Security Assurance Notice */}
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-sm flex items-start gap-3">
          <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
          <p className="text-xs text-white/80 leading-relaxed">
            <strong className="text-emerald-300 block mb-0.5">لا تحتاج إلى إدخال مفتاح Binance نهائياً:</strong>
            جميع شاشات التحليل، مسح الـ 745+ عملة، ومقارنة الأسعار عبر المنصات تعطي إشارات وتنبيهات دخول دقيقة دون لمس محفظتك. الحقول بالأسفل اختيارية فقط إذا أردت عرض رصيدك (Read-Only).
          </p>
        </div>

        {/* Account Info Status Card if Connected */}
        {accountInfo && (
          <div className={`p-4 rounded-sm border ${
            accountInfo.connected 
              ? "bg-[#10b981]/5 border-[#10b981]/20" 
              : "bg-red-500/5 border-red-500/20"
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Server className="w-3.5 h-3.5" />
                حالة الاتصال بخوادم بينانس
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                accountInfo.connected ? "bg-[#10b981]/20 text-[#10b981]" : "bg-red-500/20 text-red-400"
              }`}>
                {accountInfo.connected ? "متصل (Online)" : "غير متصل"}
              </span>
            </div>

            {accountInfo.connected && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-white/40 block">رصيد المحفظة الإجمالي:</span>
                  <strong className="text-white text-sm font-bold">
                    ${accountInfo.walletBalanceUsdt !== undefined ? accountInfo.walletBalanceUsdt : "0.00"} USDT
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-white/40 block">الرصيد المتاح للتداول:</span>
                  <strong className="text-[#10b981] text-sm font-bold">
                    ${accountInfo.availableBalanceUsdt !== undefined ? accountInfo.availableBalanceUsdt : "0.00"} USDT
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-white/40 block">سرعة الاستجابة (Latency):</span>
                  <strong className="text-blue-400">{accountInfo.latencyMs}ms</strong>
                </div>
                <div>
                  <span className="text-[10px] text-white/40 block">الصفقات المفتوحة:</span>
                  <strong className="text-purple-400">{accountInfo.positionsCount || 0} صفقة</strong>
                </div>
              </div>
            )}

            {accountInfo.error && (
              <p className="text-xs text-red-400 mt-2 font-mono">
                {accountInfo.error}
              </p>
            )}
          </div>
        )}

        {/* API Key Inputs */}
        <div className="space-y-4">
          <div>
            <label className="text-xs text-white/60 block mb-1.5 font-bold">Binance API Key (مفتاح الـ API)</label>
            <input
              type="text"
              placeholder="ألصق مفتاح Binance API هنا..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-sm py-2.5 px-3 text-xs text-white placeholder:text-white/20 font-mono focus:outline-none focus:border-[#f59e0b]"
            />
          </div>

          <div>
            <label className="text-xs text-white/60 block mb-1.5 font-bold">Binance API Secret (الرمز السري)</label>
            <div className="relative">
              <input
                type={showSecret ? "text" : "password"}
                placeholder="ألصق الـ Secret Key هنا..."
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-sm py-2.5 pr-3 pl-10 text-xs text-white placeholder:text-white/20 font-mono focus:outline-none focus:border-[#f59e0b]"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
              >
                {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          {apiKey ? (
            <button
              onClick={disconnect}
              className="text-xs text-red-400 hover:underline"
            >
              فصل المفاتيح الحالية
            </button>
          ) : <div />}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs text-white/60 hover:text-white rounded-sm hover:bg-white/5 transition-all"
            >
              إغلاق
            </button>
            <button
              onClick={testConnection}
              disabled={testing}
              className="px-5 py-2 bg-[#f59e0b] hover:bg-[#f59e0b]/90 text-black font-bold text-xs rounded-sm transition-all flex items-center gap-2"
            >
              {testing && <RefreshCcw className="w-3.5 h-3.5 animate-spin" />}
              اختبار وحفظ الاتصال
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default BinanceConnectModal;
