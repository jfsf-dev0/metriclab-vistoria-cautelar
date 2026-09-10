import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'azul' | 'verde' | 'vermelho' | 'amarelo' | 'slate' | 'blue' | 'green' | 'red' | 'amber' | 'gray';
}

export function Badge({
  className,
  variant = 'azul',
  children,
  ...props
}: BadgeProps) {
  const variants = {
    azul: 'bg-blue-50 text-blue-700 border border-blue-200',
    blue: 'bg-blue-50 text-blue-700 border border-blue-200',
    verde: 'bg-green-50 text-green-700 border border-green-200',
    green: 'bg-green-50 text-green-700 border border-green-200',
    vermelho: 'bg-red-50 text-red-700 border border-red-200',
    red: 'bg-red-50 text-red-700 border border-red-200',
    amarelo: 'bg-amber-50 text-amber-700 border border-amber-200',
    amber: 'bg-amber-50 text-amber-700 border border-amber-200',
    slate: 'bg-gray-100 text-gray-700 border border-gray-200',
    gray: 'bg-gray-100 text-gray-700 border border-gray-200',
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
