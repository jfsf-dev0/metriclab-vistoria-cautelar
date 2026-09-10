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
        'inline-flex items-center bg-transparent border border-[#E5E5E3] rounded-[4px] px-2 py-0.5 text-[11px] font-medium tracking-[0.3px] text-[#6B6B6B]',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
