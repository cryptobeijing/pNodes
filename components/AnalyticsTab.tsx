"use client";

import { useMemo } from "react";
import {
  HardDrive,
  Activity,
  Clock,
  AlertTriangle,
  TrendingUp,
  Info,
  ExternalLink,
  Zap,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatStorage } from "@/lib/format";

interface AnalyticsTabProps {
  stats: {
    totalNodes: number;
    onlineNodes: number;
    totalStorageCapacity: number;
    totalStorageUsed: number;
    totalStorageCapacityTB?: number;
    totalStorageUsedTB?: number;
  };
  extendedSummary?: {
    averageHealthScore: number;
    averageUptime24h: number;
    storagePressurePercent: number;
    networkHealth: string;
  };
  nodeMetrics?: Array<{
    tier: "Excellent" | "Good" | "Poor";
    healthScore: number;
  }>;
  pnodes: Array<{
    version: string;
    region: string;
    storageUsed: number;
    storageTotal: number;
  }>;
  isLoading: boolean;
}

// Gauge component for performance score
const PerformanceGauge = ({ score }: { score: number }) => {
  const percentage = Math.min(100, Math.max(0, score));
  const rotation = (percentage / 100) * 180 - 90;

  const getColor = () => {
    if (percentage >= 90) return "text-primary";
    if (percentage >= 75) return "text-warning";
    return "text-destructive";
  };

  return (
    <div className="relative w-40 h-20 mx-auto">
      {/* Background arc */}
      <svg className="w-full h-full" viewBox="0 0 100 50">
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${percentage * 1.26} 126`}
          className="transition-all duration-700"
        />
      </svg>
      {/* Needle */}
      <div
        className="absolute bottom-0 left-1/2 origin-bottom transition-transform duration-700"
        style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
      >
        <div className={cn("w-0.5 h-8 rounded-full", getColor().replace("text-", "bg-"))} />
      </div>
      {/* Score display */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2">
        <span className={cn("text-2xl font-bold", getColor())}>
          {percentage.toFixed(0)}
        </span>
      </div>
    </div>
  );
};

// Simple stat card
const StatCard = ({
  label,
  value,
  subValue,
  icon: Icon,
  color = "primary",
}: {
  label: string;
  value: string | number;
  subValue?: string;
  icon: any;
  color?: "primary" | "warning" | "destructive" | "accent";
}) => {
  const colorClasses = {
    primary: "bg-primary/10 text-primary",
    warning: "bg-warning/10 text-warning",
    destructive: "bg-destructive/10 text-destructive",
    accent: "bg-accent/10 text-accent",
  };

  return (
    <div className="p-5 rounded-xl bg-card border border-border">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
        <div className={cn("p-2 rounded-lg", colorClasses[color])}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-semibold text-foreground">{value}</p>
      {subValue && (
        <p className="text-sm text-muted-foreground mt-1">{subValue}</p>
      )}
    </div>
  );
};

// Progress bar component
const ProgressBar = ({
  value,
  label,
  color = "primary",
}: {
  value: number;
  label: string;
  color?: "primary" | "warning" | "destructive";
}) => {
  const colorClasses = {
    primary: "bg-primary",
    warning: "bg-warning",
    destructive: "bg-destructive",
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground font-medium">{value.toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", colorClasses[color])}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
};

export function AnalyticsTab({
  stats,
  extendedSummary,
  nodeMetrics,
  pnodes,
  isLoading,
}: AnalyticsTabProps) {
  // Calculate health tier distribution
  const healthDistribution = useMemo(() => {
    if (!nodeMetrics || nodeMetrics.length === 0) {
      return { excellent: 0, good: 0, poor: 0 };
    }
    return {
      excellent: nodeMetrics.filter((m) => m.tier === "Excellent").length,
      good: nodeMetrics.filter((m) => m.tier === "Good").length,
      poor: nodeMetrics.filter((m) => m.tier === "Poor").length,
    };
  }, [nodeMetrics]);

  // Calculate version distribution
  const versionDistribution = useMemo(() => {
    const versions = new Map<string, number>();
    pnodes.forEach((node) => {
      const version = node.version || "Unknown";
      versions.set(version, (versions.get(version) || 0) + 1);
    });
    return Array.from(versions.entries())
      .map(([version, count]) => ({ version, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [pnodes]);

  // Calculate region distribution
  const regionDistribution = useMemo(() => {
    const regions = new Map<string, number>();
    pnodes.forEach((node) => {
      const region = node.region || "Unknown";
      regions.set(region, (regions.get(region) || 0) + 1);
    });
    return Array.from(regions.entries())
      .map(([region, count]) => ({ region, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [pnodes]);

  // Calculate storage pressure nodes
  const storagePressure = useMemo(() => {
    const highPressure = pnodes.filter((node) => {
      if (node.storageTotal === 0) return false;
      const util = (node.storageUsed / node.storageTotal) * 100;
      return util >= 80 && util < 90;
    }).length;

    const critical = pnodes.filter((node) => {
      if (node.storageTotal === 0) return false;
      const util = (node.storageUsed / node.storageTotal) * 100;
      return util >= 90;
    }).length;

    return { highPressure, critical };
  }, [pnodes]);

  // Calculate network utilization
  const networkUtilization = stats.totalStorageCapacity > 0
    ? (stats.totalStorageUsed / stats.totalStorageCapacity) * 100
    : 0;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl shimmer" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 rounded-xl shimmer" />
          <div className="h-64 rounded-xl shimmer" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Section 1: Network Capacity */}
      <section>
        <h3 className="text-lg font-semibold text-foreground mb-4">Network Capacity</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Capacity"
            value={`${(stats.totalStorageCapacityTB || 0).toFixed(2)} TB`}
            subValue="Network storage capacity"
            icon={HardDrive}
            color="primary"
          />
          <StatCard
            label="Storage Used"
            value={formatStorage(stats.totalStorageUsed)}
            subValue="Currently allocated"
            icon={HardDrive}
            color="accent"
          />
          <StatCard
            label="Active pNodes"
            value={stats.onlineNodes}
            subValue={`of ${stats.totalNodes} total`}
            icon={Activity}
            color="primary"
          />
          <StatCard
            label="Online Rate"
            value={`${stats.totalNodes > 0 ? ((stats.onlineNodes / stats.totalNodes) * 100).toFixed(1) : 0}%`}
            subValue="Network availability"
            icon={TrendingUp}
            color={stats.onlineNodes / stats.totalNodes >= 0.9 ? "primary" : "warning"}
          />
        </div>

        {/* Network Utilization Bar */}
        <div className="mt-4 p-4 rounded-xl bg-card border border-border">
          <ProgressBar
            value={networkUtilization}
            label="Network Storage Utilization"
            color={networkUtilization > 80 ? "destructive" : networkUtilization > 60 ? "warning" : "primary"}
          />
        </div>
      </section>

      {/* Section 2: Performance Metrics */}
      <section>
        <h3 className="text-lg font-semibold text-foreground mb-4">Performance Metrics</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Performance Gauge */}
          <div className="p-6 rounded-xl bg-card border border-border">
            <h4 className="text-sm font-medium text-muted-foreground mb-4 text-center">
              Average Performance Score
            </h4>
            <PerformanceGauge score={extendedSummary?.averageHealthScore || 0} />
            <p className="text-xs text-muted-foreground text-center mt-4">
              Based on uptime, storage, and response rate
            </p>
          </div>

          {/* Node Stats */}
          <div className="p-6 rounded-xl bg-card border border-border space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Node Stats</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">24h Uptime</span>
                </div>
                <span className="text-lg font-semibold text-foreground">
                  {(extendedSummary?.averageUptime24h || 0).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Avg Storage/Node</span>
                </div>
                <span className="text-lg font-semibold text-foreground">
                  {stats.totalNodes > 0
                    ? formatStorage(stats.totalStorageCapacity / stats.totalNodes)
                    : "0 GB"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Latest Version</span>
                </div>
                <span className="text-lg font-semibold text-primary">
                  {versionDistribution.length > 0 && stats.totalNodes > 0
                    ? `${((versionDistribution[0].count / stats.totalNodes) * 100).toFixed(0)}%`
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Health Tier Distribution */}
          <div className="p-6 rounded-xl bg-card border border-border">
            <h4 className="text-sm font-medium text-muted-foreground mb-4">Health Tiers</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-sm text-muted-foreground">Excellent (≥90)</span>
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {healthDistribution.excellent}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-warning" />
                  <span className="text-sm text-muted-foreground">Good (75-89)</span>
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {healthDistribution.good}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-destructive" />
                  <span className="text-sm text-muted-foreground">Poor (&lt;75)</span>
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {healthDistribution.poor}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: STOINC Insights */}
      <section>
        <h3 className="text-lg font-semibold text-foreground mb-4">STOINC Insights</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* STOINC Distribution */}
          <div className="p-6 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-medium text-foreground">Storage Income Distribution</h4>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              STOINC (Storage Income) is distributed to pNode operators from dApp storage fees paid in SOL.
            </p>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">pNode Operators</span>
                  <span className="text-primary font-semibold">94%</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: "94%" }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Development & Ops</span>
                  <span className="text-accent font-semibold">6%</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full" style={{ width: "6%" }} />
                </div>
              </div>
            </div>
          </div>

          {/* Boost Factors */}
          <div className="p-6 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-warning" />
              <h4 className="text-sm font-medium text-foreground">Boost Factors</h4>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Storage Credits depend on performance score, storage space, and boost multipliers.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between p-2 rounded bg-muted/30">
                <span className="text-muted-foreground">Deep South Base</span>
                <span className="text-warning font-semibold">16x</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-muted/30">
                <span className="text-muted-foreground">Titan NFT Boost</span>
                <span className="text-warning font-semibold">up to 11x</span>
              </div>
            </div>
            <a
              href="https://www.xandeum.network/stoinc"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-primary hover:underline mt-4"
            >
              Learn more about STOINC
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </section>

      {/* Section 4: Storage Pressure */}
      <section>
        <h3 className="text-lg font-semibold text-foreground mb-4">Storage Pressure</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className={cn(
            "p-5 rounded-xl border",
            storagePressure.highPressure > 0
              ? "bg-warning/5 border-warning/30"
              : "bg-card border-border"
          )}>
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                storagePressure.highPressure > 0 ? "bg-warning/10" : "bg-muted"
              )}>
                <AlertTriangle className={cn(
                  "w-5 h-5",
                  storagePressure.highPressure > 0 ? "text-warning" : "text-muted-foreground"
                )} />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">
                  {storagePressure.highPressure}
                </p>
                <p className="text-sm text-muted-foreground">High Pressure (80-90%)</p>
              </div>
            </div>
          </div>

          <div className={cn(
            "p-5 rounded-xl border",
            storagePressure.critical > 0
              ? "bg-destructive/5 border-destructive/30"
              : "bg-card border-border"
          )}>
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                storagePressure.critical > 0 ? "bg-destructive/10" : "bg-muted"
              )}>
                <AlertTriangle className={cn(
                  "w-5 h-5",
                  storagePressure.critical > 0 ? "text-destructive" : "text-muted-foreground"
                )} />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">
                  {storagePressure.critical}
                </p>
                <p className="text-sm text-muted-foreground">Critical (&gt;90%)</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Network Distribution */}
      <section>
        <h3 className="text-lg font-semibold text-foreground mb-4">Network Distribution</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Version Distribution */}
          <div className="p-6 rounded-xl bg-card border border-border">
            <h4 className="text-sm font-medium text-muted-foreground mb-4">Client Versions</h4>
            <div className="space-y-3">
              {versionDistribution.map(({ version, count }) => (
                <div key={version} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground font-mono">{version}</span>
                    <span className="text-muted-foreground">{count} nodes</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${(count / stats.totalNodes) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Region Distribution */}
          <div className="p-6 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <h4 className="text-sm font-medium text-muted-foreground">Top Regions</h4>
            </div>
            <div className="space-y-3">
              {regionDistribution.map(({ region, count }, index) => (
                <div key={region} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-4">{index + 1}</span>
                    <span className="text-sm text-foreground">{region}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
