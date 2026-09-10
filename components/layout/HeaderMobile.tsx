import React from 'react';
import { cn } from '@/lib/utils';
import { MetricLabLogo } from '@/components/brand/MetricLabLogo';

export interface HeaderMobileProps {
  title?: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  showLogo?: boolean;
  className?: string;
}

export function HeaderMobile({
  title,
  leftAction,
  rightAction,
  showLogo = true,
  className,
}: HeaderMobileProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-30 h-14 w-full bg-white border-b border-gray-200 shadow-sm px-4 flex items-center justify-between transition-all duration-200 select-none',
        className
      )}
    >
      {/* Left side: either leftAction (e.g. back button) or Logo */}
      <div className="flex items-center gap-2 min-w-[70px]">
        {leftAction ? (
          leftAction
        ) : showLogo ? (
          <MetricLabLogo size="sm" showText={true} />
        ) : null}
      </div>

      {/* Center: Title */}
      {title && (
        <div className="flex-1 text-center px-2">
          <h2 className="text-xs sm:text-sm font-bold text-gray-900 truncate tracking-tight">
            {title}
          </h2>
        </div>
      )}

      {/* Right side: contextual action / badge / greeting */}
      <div className="flex items-center justify-end min-w-[70px]">
        {rightAction}
      </div>
    </header>
  );
}
