import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: string;
}

export function Badge({
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center bg-white border border-[#E2E2DC] rounded-[4px] px-2 py-0.5 text-[12px] font-medium tracking-[0.04em] text-[#6B7280]',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
