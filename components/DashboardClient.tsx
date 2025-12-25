"use client";

import { useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { MetricDetailDialog } from "@/components/MetricDetailDialog";
import { DebugPanel } from "@/components/DebugPanel";
import { PNodesTable } from "@/components/PNodesTable";
import { PNodeDetailsPanel } from "@/components/PNodeDetailsPanel";
import { CountryMap } from "@/components/CountryMap";
import { Footer } from "@/components/Footer";
import { usePNodes, type PNode } from "@/hooks/usePNodes";

// New dynamic components
import { NavigationTabs, TabContent, type TabId } from "@/components/NavigationTabs";
import { HeroStats } from "@/components/HeroStats";
import { LiveNetworkPulse } from "@/components/LiveNetworkPulse";
import {
  AnimatedDonutChart,
  createVersionChartData,
  createHealthTierChartData,
  createStatusChartData,
} from "@/components/AnimatedDonutChart";
import { ActivityFeed } from "@/components/ActivityFeed";
import { FloatingLiveIndicator } from "@/components/FloatingLiveIndicator";
import { TopCountriesRanking } from "@/components/TopCountriesRanking";
import { AnalyticsTab } from "@/components/AnalyticsTab";

export function DashboardClient() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedNode, setSelectedNode] = useState<PNode | null>(null);
  const [metricDialog, setMetricDialog] = useState<{
    open: boolean;
    type: string;
    title: string;
  } | null>(null);

  const handleNodeSelect = (node: PNode) => {
    setSelectedNode(node);
  };

  const {
    pnodes,
    stats,
    loading,
    error,
    lastUpdated,
    refresh,
    uptimeHistory,
    storageDistribution,
    extendedSummary,
    topNodes,
    nodeMetrics,
    countryChoropleth,
    countryMapLoading,
  } = usePNodes(autoRefresh);

  const networkHealth =
    stats.totalNodes > 0 && stats.onlineNodes / stats.totalNodes >= 0.6
      ? "healthy"
      : stats.totalNodes > 0 && stats.onlineNodes / stats.totalNodes >= 0.4
        ? "degraded"
        : "critical";

  // Calculate version distribution for donut chart
  const versionData = useMemo(() => {
    const versionCounts = new Map<string, number>();
    pnodes.forEach((node) => {
      const version = node.version || "Unknown";
      versionCounts.set(version, (versionCounts.get(version) || 0) + 1);
    });
    const versions = Array.from(versionCounts.entries())
      .map(([version, count]) => ({ version, count }))
      .sort((a, b) => b.count - a.count);
    return createVersionChartData(versions);
  }, [pnodes]);

  // Calculate health tier distribution
  const healthTierData = useMemo(() => {
    if (!nodeMetrics || nodeMetrics.length === 0) return [];
    const tiers = { excellent: 0, good: 0, poor: 0 };
    nodeMetrics.forEach((m) => {
      if (m.healthScore >= 90) tiers.excellent++;
      else if (m.healthScore >= 70) tiers.good++;
      else tiers.poor++;
    });
    return createHealthTierChartData(tiers);
  }, [nodeMetrics]);

  // Status distribution
  const statusData = useMemo(() => {
    return createStatusChartData(
      stats.onlineNodes,
      stats.totalNodes - stats.onlineNodes
    );
  }, [stats]);

  return (
    <div className="min-h-screen bg-background">
      <Header
        lastUpdated={lastUpdated}
        onRefresh={refresh}
        autoRefresh={autoRefresh}
        onAutoRefreshChange={setAutoRefresh}
        networkHealth={networkHealth}
        isLoading={loading}
      />

      <main className="container py-8 space-y-8">
        {/* Error State */}
        {error && (
          <div className="p-8 rounded-2xl bg-destructive/10 border border-destructive/30 text-center animate-fade-up">
            <p className="text-destructive font-semibold mb-4 text-lg">
              {error}
            </p>
            <button
              onClick={refresh}
              className="px-6 py-2.5 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-all font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {/* Hero Stats */}
        <HeroStats
          totalNodes={stats.totalNodes}
          onlineNodes={stats.onlineNodes}
          avgHealthScore={extendedSummary?.averageHealthScore || 0}
          avgUptime={extendedSummary?.averageUptime24h || 0}
        />

        {/* Navigation Tabs */}
        <NavigationTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          className="mb-2"
        />

        {/* Tab Content */}
        <div className="min-h-[600px]">
          {/* Overview Tab */}
          <TabContent activeTab={activeTab} tab="overview">
            <div className="space-y-8">
              {/* Live Network Pulse + Activity Feed */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <LiveNetworkPulse
                    nodeCount={stats.totalNodes}
                    healthScore={extendedSummary?.averageHealthScore || 90}
                    isLive={autoRefresh}
                  />
                </div>
                <div className="h-80">
                  <ActivityFeed maxItems={15} />
                </div>
              </div>

              {/* Distribution Charts */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <AnimatedDonutChart
                  data={statusData}
                  title="Node Status"
                  subtitle="Online vs Offline"
                  centerValue={stats.onlineNodes}
                  centerLabel="online"
                  size={180}
                />
                <AnimatedDonutChart
                  data={healthTierData}
                  title="Health Distribution"
                  subtitle="By performance tier"
                  centerValue={`${Math.round(extendedSummary?.averageHealthScore || 0)}%`}
                  centerLabel="avg health"
                  size={180}
                />
                <AnimatedDonutChart
                  data={versionData}
                  title="Version Distribution"
                  subtitle="Client versions"
                  centerValue={versionData.length}
                  centerLabel="versions"
                  size={180}
                />
              </div>

              {/* Global Node Distribution */}
              <div>
                <div className="mb-4">
                  <h2 className="section-title">Global pNodes Distribution</h2>
                  <p className="section-subtitle">
                    Geographic distribution of pNodes across{" "}
                    {countryChoropleth?.totalCountries || 0} countries
                  </p>
                </div>
                <CountryMap
                  countries={countryChoropleth?.countries || []}
                  totalNodes={countryChoropleth?.totalNodes || 0}
                  isLoading={countryMapLoading}
                />
              </div>
            </div>
          </TabContent>

          {/* Nodes Tab */}
          <TabContent activeTab={activeTab} tab="nodes">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="section-title">pNodes List</h2>
                  <p className="section-subtitle">
                    Click on any node to view detailed information
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    {stats.onlineNodes} online
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-destructive" />
                    {stats.totalNodes - stats.onlineNodes} offline
                  </span>
                </div>
              </div>
              <PNodesTable
                pnodes={pnodes}
                isLoading={loading}
                onSelectNode={handleNodeSelect}
              />
            </div>
          </TabContent>

          {/* Analytics Tab */}
          <TabContent activeTab={activeTab} tab="analytics">
            <AnalyticsTab
              stats={stats}
              extendedSummary={extendedSummary || undefined}
              nodeMetrics={nodeMetrics || undefined}
              pnodes={pnodes}
              isLoading={loading}
            />
          </TabContent>
        </div>
      </main>

      <Footer />

      {/* Floating Live Indicator */}
      <FloatingLiveIndicator
        isLive={autoRefresh}
        onToggleLive={() => setAutoRefresh(!autoRefresh)}
        lastUpdated={lastUpdated}
        refreshInterval={30}
      />

      {/* Detail Panel */}
      <PNodeDetailsPanel
        node={selectedNode}
        onClose={() => setSelectedNode(null)}
      />

      {/* Metric Detail Dialog */}
      {metricDialog && (
        <MetricDetailDialog
          open={metricDialog.open}
          onOpenChange={(open) => {
            if (!open) {
              setMetricDialog(null);
            } else {
              setMetricDialog({ ...metricDialog, open: true });
            }
          }}
          title={metricDialog.title}
          type={
            metricDialog.type as
              | "storage"
              | "online"
              | "uptime"
              | "health"
              | "pressure"
              | "stability"
          }
          data={
            metricDialog.type === "storage"
              ? {
                  totalCapacityTB: stats.totalStorageCapacityTB,
                  totalCapacityGB: stats.totalStorageCapacity / 1024 ** 3,
                  usedTB: stats.totalStorageUsedTB,
                  usedGB: stats.totalStorageUsed / 1024 ** 3,
                  usedPercentage:
                    stats.totalStorageCapacity > 0
                      ? (stats.totalStorageUsed / stats.totalStorageCapacity) *
                        100
                      : 0,
                }
              : metricDialog.type === "online"
                ? {
                    totalNodes: stats.totalNodes,
                    onlineNodes: stats.onlineNodes,
                    offlineNodes: stats.totalNodes - stats.onlineNodes,
                    onlinePercentage:
                      stats.totalNodes > 0
                        ? (stats.onlineNodes / stats.totalNodes) * 100
                        : 0,
                  }
                : metricDialog.type === "uptime"
                  ? {
                      averageUptime: stats.averageUptime,
                    }
                  : metricDialog.type === "health"
                    ? {
                        averageHealthScore: extendedSummary?.averageHealthScore,
                      }
                    : metricDialog.type === "pressure"
                      ? {
                          storagePressurePercent:
                            extendedSummary?.storagePressurePercent,
                        }
                      : metricDialog.type === "stability"
                        ? {
                            networkHealth: extendedSummary?.networkHealth,
                            stabilityValue:
                              extendedSummary?.networkHealth === "healthy"
                                ? 100
                                : extendedSummary?.networkHealth === "degraded"
                                  ? 75
                                  : 50,
                          }
                        : undefined
          }
        />
      )}

      {/* Debug Panel */}
      <DebugPanel
        apiData={{
          pnodes,
          summary: stats,
          extendedSummary,
          nodeMetrics,
          storagePressure: extendedSummary
            ? {
                highPressureNodes: extendedSummary.storagePressurePercent
                  ? Math.round(
                      (extendedSummary.storagePressurePercent / 100) *
                        stats.totalNodes
                    )
                  : 0,
                totalNodes: stats.totalNodes,
                percent: extendedSummary.storagePressurePercent || 0,
              }
            : undefined,
          uptimeHistory,
          storageDistribution,
          topNodes,
        }}
      />
    </div>
  );
}
