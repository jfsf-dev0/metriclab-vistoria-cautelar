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
        'sticky top-0 z-30 h-[56px] w-full bg-white border-b border-[#E2E2DC] px-4 flex items-center justify-between select-none',
        className
      )}
    >
      {/* Left side: either leftAction (min 44x44px touch area) or Logo */}
      <div className="flex items-center gap-1 min-w-[44px] min-h-[44px]">
        {leftAction ? (
          <div className="min-w-[44px] min-h-[44px] flex items-center justify-center -ml-2">
            {leftAction}
          </div>
        ) : showLogo ? (
          <MetricLabLogo size="sm" showText={true} />
        ) : null}
      </div>

      {/* Center: Title (Inter 600, 18px, letter-spacing -0.3px, #111111) */}
      {title && (
        <div className="flex-1 text-center px-2">
          <h2 className="text-[18px] font-semibold text-[#111111] truncate tracking-[-0.3px]">
            {title}
          </h2>
        </div>
      )}

      {/* Right side: contextual action (min 44x44px touch area) */}
      <div className="flex items-center justify-end min-w-[44px] min-h-[44px] text-[#111111]">
        {rightAction}
      </div>
    </header>
  );
}
