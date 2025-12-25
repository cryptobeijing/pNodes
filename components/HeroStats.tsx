"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  useAnimatedValue,
  useValueChanged,
  formatAnimatedNumber,
} from "@/hooks/useSpringValue";
import {
  Server,
  Activity,
  HardDrive,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

interface StatItem {
  label: string;
  value: number;
  previousValue?: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  icon: React.ReactNode;
  color: "primary" | "accent" | "warning" | "destructive";
  trend?: "up" | "down" | "neutral";
}

interface HeroStatsProps {
  totalNodes: number;
  onlineNodes: number;
  avgHealthScore: number;
  avgUptime: number;
  totalStorage?: number;
  className?: string;
}

export function HeroStats({
  totalNodes,
  onlineNodes,
  avgHealthScore,
  avgUptime,
  totalStorage = 0,
  className,
}: HeroStatsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const stats: StatItem[] = [
    {
      label: "Total Nodes",
      value: totalNodes,
      icon: <Server className="w-5 h-5" />,
      color: "primary",
    },
    {
      label: "Online",
      value: onlineNodes,
      suffix: ` / ${totalNodes}`,
      icon: <Activity className="w-5 h-5" />,
      color: "accent",
      trend: onlineNodes > totalNodes * 0.9 ? "up" : onlineNodes > totalNodes * 0.7 ? "neutral" : "down",
    },
    {
      label: "Health Score",
      value: avgHealthScore,
      suffix: "%",
      decimals: 1,
      icon: <Zap className="w-5 h-5" />,
      color: avgHealthScore >= 90 ? "primary" : avgHealthScore >= 70 ? "warning" : "destructive",
      trend: avgHealthScore >= 90 ? "up" : avgHealthScore >= 70 ? "neutral" : "down",
    },
    {
      label: "Avg Uptime",
      value: avgUptime,
      suffix: "%",
      decimals: 1,
      icon: <TrendingUp className="w-5 h-5" />,
      color: avgUptime >= 95 ? "primary" : avgUptime >= 80 ? "warning" : "destructive",
    },
  ];

  if (!mounted) {
    return (
      <div className={cn("grid grid-cols-2 lg:grid-cols-4 gap-4", className)}>
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-xl bg-card/50 animate-pulse border border-border/50"
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-2 lg:grid-cols-4 gap-4", className)}>
      {stats.map((stat, index) => (
        <HeroStatCard key={stat.label} stat={stat} index={index} />
      ))}
    </div>
  );
}

function HeroStatCard({ stat, index }: { stat: StatItem; index: number }) {
  const animatedValue = useAnimatedValue(stat.value, 1000, "easeOut");
  const valueChanged = useValueChanged(stat.value, 0.1);

  const colorClasses = {
    primary: {
      bg: "from-primary/20 to-primary/5",
      text: "text-primary",
      glow: "shadow-primary/20",
      border: "border-primary/30",
    },
    accent: {
      bg: "from-accent/20 to-accent/5",
      text: "text-accent",
      glow: "shadow-accent/20",
      border: "border-accent/30",
    },
    warning: {
      bg: "from-warning/20 to-warning/5",
      text: "text-warning",
      glow: "shadow-warning/20",
      border: "border-warning/30",
    },
    destructive: {
      bg: "from-destructive/20 to-destructive/5",
      text: "text-destructive",
      glow: "shadow-destructive/20",
      border: "border-destructive/30",
    },
  };

  const colors = colorClasses[stat.color];

  const TrendIcon =
    stat.trend === "up"
      ? TrendingUp
      : stat.trend === "down"
      ? TrendingDown
      : Minus;

  return (
    <div
      className={cn(
        "relative group overflow-hidden rounded-xl border bg-gradient-to-br p-5",
        "transition-all duration-500 hover:scale-[1.02] hover:shadow-lg",
        colors.bg,
        colors.border,
        colors.glow,
        "animate-slide-in-bottom opacity-0",
        valueChanged && "animate-value-pop"
      )}
      style={{
        animationDelay: `${index * 100}ms`,
        animationFillMode: "forwards",
      }}
    >
      {/* Animated background gradient */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500",
          `from-transparent via-${stat.color}/5 to-transparent`
        )}
      />

      {/* Glow effect on hover */}
      <div
        className={cn(
          "absolute -inset-1 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl",
          `bg-${stat.color}/20`
        )}
      />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className={cn("p-2 rounded-lg bg-background/50", colors.text)}>
            {stat.icon}
          </div>
          {stat.trend && (
            <div
              className={cn(
                "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                stat.trend === "up" && "bg-primary/20 text-primary",
                stat.trend === "down" && "bg-destructive/20 text-destructive",
                stat.trend === "neutral" && "bg-muted text-muted-foreground"
              )}
            >
              <TrendIcon className="w-3 h-3" />
            </div>
          )}
        </div>

        {/* Value */}
        <div className="flex items-baseline gap-1">
          <span
            className={cn(
              "text-3xl font-bold tracking-tight tabular-nums",
              colors.text
            )}
          >
            {stat.prefix}
            {formatAnimatedNumber(animatedValue, { decimals: stat.decimals })}
          </span>
          {stat.suffix && (
            <span className="text-sm text-muted-foreground">{stat.suffix}</span>
          )}
        </div>

        {/* Label */}
        <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
      </div>

      {/* Decorative elements */}
      <div
        className={cn(
          "absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-10",
          `bg-${stat.color}`
        )}
      />
    </div>
  );
}

// Compact version for smaller displays
export function HeroStatsCompact({
  totalNodes,
  onlineNodes,
  avgHealthScore,
  className,
}: {
  totalNodes: number;
  onlineNodes: number;
  avgHealthScore: number;
  className?: string;
}) {
  const animatedTotal = useAnimatedValue(totalNodes, 800, "easeOut");
  const animatedOnline = useAnimatedValue(onlineNodes, 800, "easeOut");
  const animatedHealth = useAnimatedValue(avgHealthScore, 800, "easeOut");

  return (
    <div
      className={cn(
        "flex items-center gap-6 px-4 py-2 rounded-lg bg-secondary/30 border border-border/30",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Server className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">
          {formatAnimatedNumber(animatedTotal)} nodes
        </span>
      </div>
      <div className="w-px h-4 bg-border" />
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-accent" />
        <span className="text-sm font-medium">
          {formatAnimatedNumber(animatedOnline)} online
        </span>
      </div>
      <div className="w-px h-4 bg-border" />
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">
          {formatAnimatedNumber(animatedHealth, { decimals: 1 })}% health
        </span>
      </div>
    </div>
  );
}
