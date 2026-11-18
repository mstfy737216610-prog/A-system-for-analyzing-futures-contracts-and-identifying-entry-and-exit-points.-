import React, { useState } from "react";
import { ShieldAlert, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";

export const FinancialDisclaimer: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="w-full bg-[#0a0d14]/90 border-t border-white/10 px-4 py-3 text-right" dir="rtl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-500/10 border border-amber-500/30 rounded text-amber-400 shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-amber-400 ml-1">تنبيه المخاطر وإخلاء المسؤولية المالية:</span>
            <span>
              جميع التحليلات والإشارات الصادرة عن النظام هي لغايات بحثية واسترشادية تعتمد على الذكاء الاصطناعي والحسابات الكمية وليست استشارة استثمارية.
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-[11px] text-white/60 hover:text-white transition-colors cursor-pointer shrink-0"
        >
          <span>{isExpanded ? "إخفاء التفاصيل" : "قراءة الإشعار الكامل"}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="max-w-7xl mx-auto mt-3 pt-3 border-t border-white/5 text-[11px] text-white/40 leading-relaxed space-y-2">
          <p>
            تداول العملات الرقمية والعقود الآجلة ينطوي على تقلبات سعرية حادة ومخاطر مرتفعة قد تؤدي إلى خسارة جزء من رأس المال أو كله. لا يقدم النظام أي وعود بأرباح مضمونة.
          </p>
          <p>
            النجاح في التداول يعتمد بالدرجة الأولى على الالتزام الصارم بقواعد إدارة المخاطر، وعدم المخاطرة بأكثر من 1% إلى 2% من المحفظة في الصفقة الواحدة، والالتزام غير المشروط بأوامر وقف الخسارة (Stop Loss) المحددة في التحليل.
          </p>
        </div>
      )}
    </div>
  );
};

export default FinancialDisclaimer;
