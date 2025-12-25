"use client";

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatStorage, formatPercentage } from '@/lib/format';

interface MetricCardProps {
  title: string;
  value: number | string;
  suffix?: string;
  prefix?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  delay?: number;
  format?: 'number' | 'percentage' | 'storage';
  subtitle?: string;
  onClick?: () => void;
}

export const MetricCard = ({
  title,
  value,
  suffix = '',
  prefix = '',
  icon: Icon,
  format = 'number',
  subtitle,
  onClick,
}: MetricCardProps) => {
  const formattedValue = () => {
    if (typeof value === 'string') {
      return value;
    }

    switch (format) {
      case 'percentage':
        return formatPercentage(value, 1);
      case 'storage':
        return formatStorage(value);
      default:
        if (value % 1 !== 0) {
          return value.toFixed(2);
        }
        return Math.floor(value).toLocaleString();
    }
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative p-6 rounded-xl bg-card border border-border',
        'transition-colors duration-200',
        onClick && 'cursor-pointer hover:border-primary/40 hover:bg-card/80'
      )}
    >
      {/* Icon */}
      <div className="absolute top-4 right-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2 pr-14">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </p>
        <p className="text-3xl font-semibold text-foreground tracking-tight tabular-nums">
          {prefix}
          {formattedValue()}
          {suffix}
        </p>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

export const MetricCardSkeleton = () => (
  <div className="relative p-6 rounded-xl bg-card border border-border overflow-hidden">
    <div className="absolute top-4 right-4">
      <div className="w-10 h-10 rounded-lg shimmer" />
    </div>
    <div className="space-y-3">
      <div className="h-3 w-24 rounded shimmer" />
      <div className="h-8 w-32 rounded shimmer" />
    </div>
  </div>
);
