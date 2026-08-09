import React from 'react';
import { useStore } from '../store/useStore';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toasts, dismissToast } = useStore();

  if (toasts.length === 0) return null;

  const styles: Record<string, { wrap: string; icon: React.ElementType; iconColor: string }> = {
    success: {
      wrap: 'border-emerald-500/30 bg-emerald-950/80',
      icon: CheckCircle2,
      iconColor: 'text-emerald-400',
    },
    error: {
      wrap: 'border-rose-500/30 bg-rose-950/80',
      icon: XCircle,
      iconColor: 'text-rose-400',
    },
    info: {
      wrap: 'border-indigo-500/30 bg-indigo-950/80',
      icon: Info,
      iconColor: 'text-indigo-400',
    },
  };

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map((toast) => {
        const s = styles[toast.type] || styles.info;
        const Icon = s.icon;
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md animate-fade-in min-w-[260px] max-w-sm ${s.wrap}`}
          >
            <Icon size={18} className={`shrink-0 ${s.iconColor}`} />
            <span className="text-xs font-medium text-slate-100 leading-snug flex-1">{toast.message}</span>
            <button
              onClick={() => dismissToast(toast.id)}
              className="shrink-0 p-0.5 rounded text-slate-400 hover:text-slate-100 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
