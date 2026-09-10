import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  flat?: boolean;
}

export function Card({ className, flat = false, ...props }: CardProps) {
  if (flat) {
    return (
      <div
        className={cn(
          'bg-transparent border-b border-[#E5E5E3] py-4',
          className
        )}
        {...props}
      />
    );
  }

  return (
    <div
      className={cn(
        'bg-[#FFFFFF] border border-[#E5E5E3] rounded-[8px] p-5 shadow-none transition-colors',
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-1 pb-3', className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-[15px] font-medium text-[#111111] tracking-[-0.2px]', className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-[13px] text-[#9B9B9B]', className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('pt-0', className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center pt-3 border-t border-[#E5E5E3]', className)} {...props} />;
}
