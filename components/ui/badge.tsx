import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'azul' | 'verde' | 'vermelho' | 'amarelo' | 'slate';
}

export function Badge({
  className,
  variant = 'azul',
  children,
  ...props
}: BadgeProps) {
  const variants = {
    azul: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    verde: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    vermelho: 'bg-red-500/20 text-red-400 border border-red-500/30',
    amarelo: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    slate: 'bg-slate-800 text-slate-400 border border-slate-700/50',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium tracking-wide transition-all duration-200',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
