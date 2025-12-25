"use client";

import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { useAnimatedValue } from "@/hooks/useSpringValue";

interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface AnimatedDonutChartProps {
  data: DonutSegment[];
  title?: string;
  subtitle?: string;
  size?: number;
  thickness?: number;
  centerValue?: number | string;
  centerLabel?: string;
  className?: string;
  onSegmentClick?: (segment: DonutSegment) => void;
  animationDuration?: number;
}

export function AnimatedDonutChart({
  data,
  title,
  subtitle,
  size = 200,
  thickness = 35,
  centerValue,
  centerLabel,
  className,
  onSegmentClick,
  animationDuration = 1000,
}: AnimatedDonutChartProps) {
  const [mounted, setMounted] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [animationProgress, setAnimationProgress] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  // Animate on mount
  useEffect(() => {
    setMounted(true);
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimationProgress(eased);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [animationDuration]);

  // Calculate segment positions
  let cumulativePercent = 0;
  const segments = data.map((item, index) => {
    const percent = (item.value / total) * 100;
    const startPercent = cumulativePercent;
    cumulativePercent += percent;

    const dashArray = (percent / 100) * circumference * animationProgress;
    const dashOffset = -(startPercent / 100) * circumference;

    return {
      ...item,
      percent,
      startPercent,
      dashArray,
      dashOffset,
      index,
    };
  });

  const animatedCenterValue = useAnimatedValue(
    typeof centerValue === "number" ? centerValue : total,
    animationDuration,
    "easeOut"
  );

  if (!mounted) {
    return (
      <div
        className={cn(
          "flex flex-col items-center gap-4 p-6 rounded-xl bg-card border border-border animate-pulse",
          className
        )}
        style={{ width: size + 100 }}
      >
        <div
          className="rounded-full bg-muted"
          style={{ width: size, height: size }}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 p-6 rounded-xl bg-card border border-border/50",
        "transition-all duration-300 hover:border-border",
        className
      )}
    >
      {title && (
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      )}

      <div className="relative" style={{ width: size, height: size }}>
        {/* Slow rotation container */}
        <svg
          ref={svgRef}
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90 animate-spin-slow"
          style={{ animationDuration: "120s" }}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={thickness}
            className="opacity-30"
          />

          {/* Segments */}
          {segments.map((segment, index) => {
            const isHovered = hoveredIndex === index;
            const scale = isHovered ? 1.05 : 1;

            return (
              <circle
                key={segment.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth={thickness}
                strokeDasharray={`${segment.dashArray} ${circumference}`}
                strokeDashoffset={segment.dashOffset}
                strokeLinecap="round"
                className={cn(
                  "transition-all duration-300 cursor-pointer",
                  isHovered && "filter drop-shadow-lg"
                )}
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: "center",
                  opacity: hoveredIndex !== null && !isHovered ? 0.5 : 1,
                }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => onSegmentClick?.(segment)}
              />
            );
          })}
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-foreground tabular-nums">
            {typeof centerValue === "string"
              ? centerValue
              : Math.round(animatedCenterValue).toLocaleString()}
          </span>
          {centerLabel && (
            <span className="text-sm text-muted-foreground">{centerLabel}</span>
          )}
        </div>

        {/* Hover tooltip */}
        {hoveredIndex !== null && (
          <div
            className={cn(
              "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
              "px-3 py-2 rounded-lg bg-popover border border-border shadow-lg",
              "animate-scale-in pointer-events-none z-10"
            )}
            style={{ marginTop: -size / 2 - 50 }}
          >
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: segments[hoveredIndex].color }}
              />
              <span className="text-sm font-medium">
                {segments[hoveredIndex].label}
              </span>
            </div>
            <div className="text-lg font-bold text-foreground">
              {segments[hoveredIndex].value.toLocaleString()}
              <span className="text-sm text-muted-foreground ml-1">
                ({segments[hoveredIndex].percent.toFixed(1)}%)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-3 mt-2">
        {segments.map((segment, index) => (
          <button
            key={segment.label}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm",
              "transition-all duration-200",
              "hover:bg-secondary/50",
              hoveredIndex === index && "bg-secondary/50 ring-1 ring-primary/50"
            )}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            onClick={() => onSegmentClick?.(segment)}
          >
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: segment.color }}
            />
            <span className="text-muted-foreground">{segment.label}</span>
            <span className="font-medium text-foreground">
              {segment.percent.toFixed(0)}%
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Preset color palettes
export const chartColors = {
  primary: [
    "hsl(142, 71%, 45%)", // Primary green
    "hsl(199, 89%, 48%)", // Accent cyan
    "hsl(262, 83%, 58%)", // Purple
    "hsl(24, 95%, 53%)", // Orange
    "hsl(339, 90%, 51%)", // Pink
    "hsl(48, 96%, 53%)", // Yellow
  ],
  health: [
    "hsl(142, 71%, 45%)", // Excellent - green
    "hsl(48, 96%, 53%)", // Good - yellow
    "hsl(0, 84%, 60%)", // Poor - red
  ],
  status: [
    "hsl(142, 71%, 45%)", // Online - green
    "hsl(0, 84%, 60%)", // Offline - red
  ],
  regions: [
    "hsl(199, 89%, 48%)", // Cyan
    "hsl(142, 71%, 45%)", // Green
    "hsl(262, 83%, 58%)", // Purple
    "hsl(24, 95%, 53%)", // Orange
    "hsl(339, 90%, 51%)", // Pink
  ],
};

// Helper to create chart data from version/tier distribution
export function createVersionChartData(
  versions: { version: string; count: number }[]
): DonutSegment[] {
  const colors = chartColors.primary;
  return versions.slice(0, 6).map((v, i) => ({
    label: v.version || "Unknown",
    value: v.count,
    color: colors[i % colors.length],
  }));
}

export function createHealthTierChartData(tiers: {
  excellent: number;
  good: number;
  poor: number;
}): DonutSegment[] {
  return [
    { label: "Excellent", value: tiers.excellent, color: chartColors.health[0] },
    { label: "Good", value: tiers.good, color: chartColors.health[1] },
    { label: "Poor", value: tiers.poor, color: chartColors.health[2] },
  ].filter((t) => t.value > 0);
}

export function createStatusChartData(
  online: number,
  offline: number
): DonutSegment[] {
  return [
    { label: "Online", value: online, color: chartColors.status[0] },
    { label: "Offline", value: offline, color: chartColors.status[1] },
  ].filter((s) => s.value > 0);
}
