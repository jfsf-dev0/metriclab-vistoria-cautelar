import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'card' | 'text' | 'circle' | 'button' | 'custom';
}

export function LoadingSkeleton({
  className,
  variant = 'custom',
  ...props
}: LoadingSkeletonProps) {
  const variants = {
    custom: 'rounded-xl',
    card: 'h-24 w-full rounded-2xl',
    text: 'h-4 w-3/4 rounded-md',
    circle: 'h-10 w-10 rounded-full',
    button: 'h-12 w-full rounded-xl',
  };

  return (
    <div
      className={cn(
        'animate-pulse bg-slate-700/60',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export function TrechoCardSkeleton() {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 shadow-lg flex items-center justify-between gap-3 animate-pulse">
      <div className="space-y-2 flex-1">
        <div className="h-5 w-48 bg-slate-700/70 rounded-md" />
        <div className="flex items-center gap-2">
          <div className="h-4 w-28 bg-slate-700/50 rounded-md" />
          <div className="h-4 w-32 bg-slate-700/40 rounded-full" />
        </div>
      </div>
      <div className="w-8 h-8 rounded-full bg-slate-700/50 shrink-0" />
    </div>
  );
}
