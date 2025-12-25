"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useAnimatedValue } from "@/hooks/useSpringValue";
import { Globe, TrendingUp, Users } from "lucide-react";

interface CountryData {
  countryCode: string;
  country: string;
  nodeCount: number;
  onlineCount: number;
  offlineCount: number;
  avgHealthScore: number;
}

interface TopCountriesRankingProps {
  countries: CountryData[];
  totalNodes: number;
  className?: string;
  maxItems?: number;
  onCountryClick?: (country: CountryData) => void;
}

// Country flag emoji from country code
function getCountryFlag(countryCode: string): string {
  try {
    const codePoints = countryCode
      .toUpperCase()
      .split("")
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  } catch {
    return "🌍";
  }
}

export function TopCountriesRanking({
  countries,
  totalNodes,
  className,
  maxItems = 10,
  onCountryClick,
}: TopCountriesRankingProps) {
  const [mounted, setMounted] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const maxCount = countries[0]?.nodeCount || 1;
  const displayCountries = countries.slice(0, maxItems);

  if (!mounted) {
    return (
      <div className={cn("rounded-xl bg-card border border-border/50 p-6", className)}>
        <div className="h-8 w-48 bg-muted/50 rounded animate-pulse mb-6" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 mb-4">
            <div className="w-8 h-8 rounded-full bg-muted/50 animate-pulse" />
            <div className="flex-1 h-6 bg-muted/50 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl bg-card border border-border/50 overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10">
            <Globe className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Top Countries</h3>
            <p className="text-xs text-muted-foreground">
              Node distribution by region
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4" />
          {countries.length} countries
        </div>
      </div>

      {/* Rankings */}
      <div className="p-4 space-y-2">
        {displayCountries.map((country, index) => (
          <CountryRankingBar
            key={country.countryCode}
            country={country}
            index={index}
            maxCount={maxCount}
            totalNodes={totalNodes}
            isHovered={hoveredIndex === index}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            onClick={() => onCountryClick?.(country)}
          />
        ))}
      </div>

      {/* Footer */}
      {countries.length > maxItems && (
        <div className="px-6 py-3 border-t border-border/50 text-center">
          <span className="text-sm text-muted-foreground">
            +{countries.length - maxItems} more countries
          </span>
        </div>
      )}
    </div>
  );
}

function CountryRankingBar({
  country,
  index,
  maxCount,
  totalNodes,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: {
  country: CountryData;
  index: number;
  maxCount: number;
  totalNodes: number;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
}) {
  const [animateBar, setAnimateBar] = useState(false);
  const animatedCount = useAnimatedValue(country.nodeCount, 800, "easeOut");
  const percentage = (country.nodeCount / totalNodes) * 100;
  const barWidth = (country.nodeCount / maxCount) * 100;

  useEffect(() => {
    const timeout = setTimeout(() => {
      setAnimateBar(true);
    }, index * 100);
    return () => clearTimeout(timeout);
  }, [index]);

  const getRankBadge = (rank: number) => {
    if (rank === 0)
      return { bg: "bg-yellow-500/20", text: "text-yellow-500", label: "1st" };
    if (rank === 1)
      return { bg: "bg-gray-400/20", text: "text-gray-400", label: "2nd" };
    if (rank === 2)
      return { bg: "bg-amber-600/20", text: "text-amber-600", label: "3rd" };
    return null;
  };

  const rankBadge = getRankBadge(index);
  const onlinePercent = (country.onlineCount / country.nodeCount) * 100;

  return (
    <div
      className={cn(
        "relative group cursor-pointer rounded-lg p-3 -mx-1",
        "transition-all duration-300",
        isHovered && "bg-secondary/50"
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      {/* Main row */}
      <div className="flex items-center gap-3 mb-2">
        {/* Rank & Flag */}
        <div className="flex items-center gap-2 w-20">
          <span className="text-2xl">{getCountryFlag(country.countryCode)}</span>
          {rankBadge ? (
            <span
              className={cn(
                "text-xs font-bold px-1.5 py-0.5 rounded",
                rankBadge.bg,
                rankBadge.text
              )}
            >
              {rankBadge.label}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground font-medium">
              #{index + 1}
            </span>
          )}
        </div>

        {/* Country name */}
        <div className="flex-1 min-w-0">
          <span className="font-medium text-foreground truncate block">
            {country.country}
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-right">
          <div>
            <span className="text-lg font-bold text-foreground tabular-nums">
              {Math.round(animatedCount)}
            </span>
            <span className="text-xs text-muted-foreground ml-1">nodes</span>
          </div>
          <span className="text-sm text-muted-foreground w-12 text-right">
            {percentage.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 bg-secondary/50 rounded-full overflow-hidden">
        {/* Background bar */}
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full",
            "bg-gradient-to-r from-primary/80 to-accent/80",
            "transition-all duration-700 ease-out",
            "bar-shimmer"
          )}
          style={{
            width: animateBar ? `${barWidth}%` : "0%",
            transformOrigin: "left",
          }}
        />

        {/* Online indicator overlay */}
        <div
          className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-700"
          style={{
            width: animateBar ? `${(barWidth * onlinePercent) / 100}%` : "0%",
          }}
        />
      </div>

      {/* Expanded details on hover */}
      {isHovered && (
        <div className="mt-3 pt-3 border-t border-border/30 animate-fade-in">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-muted-foreground">Online:</span>
                <span className="font-medium text-primary">
                  {country.onlineCount}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-destructive" />
                <span className="text-muted-foreground">Offline:</span>
                <span className="font-medium text-destructive">
                  {country.offlineCount}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">Health:</span>
              <span
                className={cn(
                  "font-medium",
                  country.avgHealthScore >= 90
                    ? "text-primary"
                    : country.avgHealthScore >= 70
                    ? "text-warning"
                    : "text-destructive"
                )}
              >
                {country.avgHealthScore.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Compact version for sidebar
export function TopCountriesCompact({
  countries,
  className,
}: {
  countries: CountryData[];
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {countries.slice(0, 5).map((country, index) => (
        <div
          key={country.countryCode}
          className="flex items-center justify-between text-sm"
        >
          <div className="flex items-center gap-2">
            <span>{getCountryFlag(country.countryCode)}</span>
            <span className="text-foreground truncate max-w-[120px]">
              {country.country}
            </span>
          </div>
          <span className="font-medium text-muted-foreground">
            {country.nodeCount}
          </span>
        </div>
      ))}
    </div>
  );
}
