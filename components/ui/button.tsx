import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const variants = {
      primary:
        'bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-600/20 disabled:bg-blue-900 disabled:opacity-60',
      secondary:
        'bg-slate-700 hover:bg-slate-600 text-white font-medium disabled:bg-slate-800 disabled:opacity-50',
      danger:
        'bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 font-semibold disabled:opacity-40',
      outline:
        'border border-slate-700/50 hover:bg-slate-800 text-white disabled:opacity-40',
      ghost:
        'hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-40',
    };

    const sizes = {
      sm: 'px-3 py-2 text-xs min-h-[38px] rounded-lg',
      md: 'px-6 py-3 text-sm min-h-[48px] rounded-xl',
      lg: 'px-8 py-4 text-base min-h-[54px] rounded-xl font-bold',
    };

    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          'inline-flex items-center justify-center gap-2 transition-all duration-200 select-none cursor-pointer',
          !isDisabled && 'active:scale-95',
          isDisabled && 'cursor-not-allowed',
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
