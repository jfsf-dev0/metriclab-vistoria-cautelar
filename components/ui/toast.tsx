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
    error: 'bg-white border-red-200 text-red-800 shadow-md',
    success: 'bg-white border-green-200 text-green-800 shadow-md',
    info: 'bg-white border-blue-200 text-blue-800 shadow-md',
  };

  const icons = {
    error: <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />,
    success: <CheckCircle2 className="w-4 h-4 shrink-0 text-green-600" />,
    info: <Info className="w-4 h-4 shrink-0 text-blue-600" />,
  };

  return (
    <div
      className={cn(
        'p-3.5 rounded-xl border text-xs flex items-center justify-between gap-2.5 shadow-sm transition-all duration-200 animate-in fade-in slide-in-from-top-2',
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
          className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition cursor-pointer"
          aria-label="Fechar notificação"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
