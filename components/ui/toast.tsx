import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ToastProps {
  message: string;
  variant?: 'error' | 'success' | 'info';
  onClose?: () => void;
  className?: string;
}

export function Toast({
  message,
  variant = 'error',
  onClose,
  className,
}: ToastProps) {
  const styles = {
    error: 'bg-red-950/80 border-red-800/80 text-red-200 shadow-red-950/50',
    success: 'bg-emerald-950/80 border-emerald-800/80 text-emerald-200 shadow-emerald-950/50',
    info: 'bg-blue-950/80 border-blue-800/80 text-blue-200 shadow-blue-950/50',
  };

  const icons = {
    error: <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />,
    success: <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />,
    info: <Info className="w-4 h-4 shrink-0 text-blue-400" />,
  };

  return (
    <div
      className={cn(
        'p-3.5 rounded-xl border backdrop-blur-md text-xs flex items-center justify-between gap-2.5 shadow-xl transition-all duration-200 animate-in fade-in slide-in-from-top-2',
        styles[variant],
        className
      )}
      role="alert"
    >
      <div className="flex items-center gap-2.5 flex-1">
        {icons[variant]}
        <span className="font-medium leading-snug">{message}</span>
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition cursor-pointer"
          aria-label="Fechar notificação"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
