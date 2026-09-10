import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, leftIcon, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-gray-600 uppercase tracking-wide"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-4 pointer-events-none text-gray-400 flex items-center justify-center">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'w-full bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-xl px-4 py-3 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed',
              leftIcon && 'pl-11',
              error && 'border-red-500 focus:ring-red-500 focus:border-red-500',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
        {!error && helperText && (
          <p className="text-[11px] text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
