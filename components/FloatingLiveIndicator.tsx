"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Activity, Pause, Play, RefreshCw, Wifi, WifiOff } from "lucide-react";

interface FloatingLiveIndicatorProps {
  isLive: boolean;
  onToggleLive: () => void;
  lastUpdated?: Date;
  refreshInterval?: number; // in seconds
  nodesUpdated?: number;
  className?: string;
}

export function FloatingLiveIndicator({
  isLive,
  onToggleLive,
  lastUpdated,
  refreshInterval = 30,
  nodesUpdated = 0,
  className,
}: FloatingLiveIndicatorProps) {
  const [countdown, setCountdown] = useState(refreshInterval);
  const [showUpdate, setShowUpdate] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  // Countdown timer
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return refreshInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isLive, refreshInterval]);

  // Reset countdown on lastUpdated change
  useEffect(() => {
    setCountdown(refreshInterval);
    if (nodesUpdated > 0) {
      setShowUpdate(true);
      const timeout = setTimeout(() => setShowUpdate(false), 3000);
      return () => clearTimeout(timeout);
    }
  }, [lastUpdated, refreshInterval, nodesUpdated]);

  // Simulate connection status
  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(navigator.onLine);
    };

    window.addEventListener("online", checkConnection);
    window.addEventListener("offline", checkConnection);

    return () => {
      window.removeEventListener("online", checkConnection);
      window.removeEventListener("offline", checkConnection);
    };
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50",
        "flex flex-col items-end gap-2",
        className
      )}
    >
      {/* Update notification */}
      {showUpdate && nodesUpdated > 0 && (
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg",
            "bg-primary/20 text-primary text-sm font-medium",
            "border border-primary/30 backdrop-blur-sm",
            "animate-slide-in-bottom"
          )}
        >
          <RefreshCw className="w-4 h-4" />
          {nodesUpdated} node{nodesUpdated !== 1 ? "s" : ""} updated
        </div>
      )}

      {/* Main indicator */}
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl",
          "bg-card/95 backdrop-blur-md border border-border/50",
          "shadow-lg shadow-black/20",
          "transition-all duration-300",
          isLive && "ring-1 ring-primary/30"
        )}
      >
        {/* Connection status */}
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Wifi className="w-4 h-4 text-primary" />
          ) : (
            <WifiOff className="w-4 h-4 text-destructive" />
          )}
        </div>

        {/* Live status with pulsing dot */}
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "relative w-2.5 h-2.5 rounded-full",
              isLive ? "bg-primary" : "bg-muted"
            )}
          >
            {isLive && (
              <>
                <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-75" />
                <span className="absolute inset-0 rounded-full bg-primary animate-pulse" />
              </>
            )}
          </span>
          <span
            className={cn(
              "text-sm font-semibold uppercase tracking-wide",
              isLive ? "text-primary" : "text-muted-foreground"
            )}
          >
            {isLive ? "LIVE" : "PAUSED"}
          </span>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-border" />

        {/* Countdown or last updated */}
        <div className="flex flex-col items-end min-w-[70px]">
          {isLive ? (
            <>
              <span className="text-lg font-bold text-foreground tabular-nums">
                {countdown}s
              </span>
              <span className="text-xs text-muted-foreground">next refresh</span>
            </>
          ) : lastUpdated ? (
            <>
              <span className="text-sm font-medium text-foreground">
                {formatTime(lastUpdated)}
              </span>
              <span className="text-xs text-muted-foreground">last update</span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )}
        </div>

        {/* Toggle button */}
        <button
          onClick={onToggleLive}
          className={cn(
            "p-2 rounded-lg transition-all duration-200",
            "hover:bg-secondary/50",
            isLive
              ? "text-primary hover:text-primary/80"
              : "text-muted-foreground hover:text-foreground"
          )}
          title={isLive ? "Pause auto-refresh" : "Resume auto-refresh"}
        >
          {isLive ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}

// Minimal version for compact display
export function LiveBadge({ isLive }: { isLive: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
        isLive
          ? "bg-primary/20 text-primary"
          : "bg-muted text-muted-foreground"
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full",
          isLive ? "bg-primary animate-live-dot" : "bg-muted-foreground"
        )}
      />
      {isLive ? "LIVE" : "PAUSED"}
    </div>
  );
}

// Activity pulse ring (for icons)
export function PulseRing({
  isActive,
  color = "primary",
  children,
}: {
  isActive: boolean;
  color?: "primary" | "accent" | "destructive";
  children: React.ReactNode;
}) {
  const colorClasses = {
    primary: "bg-primary",
    accent: "bg-accent",
    destructive: "bg-destructive",
  };

  return (
    <div className="relative inline-flex">
      {children}
      {isActive && (
        <>
          <span
            className={cn(
              "absolute inset-0 rounded-full animate-pulse-ring opacity-75",
              colorClasses[color]
            )}
          />
          <span
            className={cn(
              "absolute inset-0 rounded-full animate-pulse-ring opacity-50",
              colorClasses[color]
            )}
            style={{ animationDelay: "0.5s" }}
          />
        </>
      )}
    </div>
  );
}
