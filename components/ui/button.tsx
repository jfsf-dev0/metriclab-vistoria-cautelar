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
        'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold shadow-sm transition-all duration-200 disabled:opacity-50',
      secondary:
        'bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all duration-200 disabled:opacity-50',
      danger:
        'bg-red-600 hover:bg-red-700 text-white font-semibold shadow-sm transition-all duration-200 disabled:opacity-50',
      outline:
        'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 transition-all duration-200 disabled:opacity-50',
      ghost:
        'hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-all duration-200 disabled:opacity-50',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs min-h-[36px] rounded-lg',
      md: 'px-6 py-3 text-sm min-h-[48px] rounded-xl font-semibold',
      lg: 'px-6 py-3 text-base min-h-[48px] rounded-xl font-semibold',
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
