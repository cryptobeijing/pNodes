"use client";

import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface HeaderProps {
  lastUpdated?: Date;
  onRefresh?: () => void;
  autoRefresh?: boolean;
  onAutoRefreshChange?: (value: boolean) => void;
  networkHealth?: 'healthy' | 'degraded' | 'critical';
  isLoading?: boolean;
}

export const Header = ({}: HeaderProps) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 h-16 border-b transition-colors duration-200',
        scrolled
          ? 'bg-background border-border shadow-sm'
          : 'bg-background/95 border-transparent'
      )}
    >
      <div className="container h-full flex items-center">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center overflow-hidden p-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-full h-full text-primary-foreground"
            >
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-foreground leading-none tracking-tight">
            Xandeum pNodes Analytics
          </h1>
        </div>
      </div>
    </header>
  );
};
