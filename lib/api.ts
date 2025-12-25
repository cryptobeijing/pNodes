/**
 * API Configuration
 * Uses /api prefix for Next.js API routes (same origin)
 */
export const API_BASE_URL = "/api";

/**
 * Backend API response types
 */
export interface BackendPNode {
  pubkey: string;
  status: "online" | "offline";
  version: string;
  storageUsed: number;
  storageTotal: number;
  uptime: number;
  ip: string;
  lastSeen: string;
  ramUsed?: number;
  ramTotal?: number;
}

export interface AnalyticsSummary {
  totalPNodes: number;
  onlinePNodes: number;
  onlinePercentage: number;
  averageUptime: number;
  totalStorageUsed: number;
  totalStorageCapacity: number;
  totalStorageUsedTB: number;
  totalStorageCapacityTB: number;
  networkHealth: "healthy" | "degraded" | "unstable";
  consensusVersion: string;
}

export interface StorageAnalytics {
  pubkey: string;
  storageUsed: number;
  storageTotal: number;
  utilizationPercent: number;
}

export interface VersionDistribution {
  version: string;
  count: number;
}

export interface ExtendedSummary {
  totalPNodes: number;
  onlinePercentage: number;
  averageUptime24h: number;
  averageHealthScore: number;
  storagePressurePercent: number;
  networkHealth: "healthy" | "degraded" | "unstable";
}

export interface NodeMetrics {
  pubkey: string;
  healthScore: number;
  uptime24h: number;
  storageUtilization: number;
  tier: "Excellent" | "Good" | "Poor";
}

export interface TopNode {
  pubkey: string;
  healthScore: number;
  uptime24h: number;
}

export interface StoragePressure {
  highPressureNodes: number;
  totalNodes: number;
  percent: number;
}

export interface MapNode {
  pubkey: string;
  lat: number;
  lng: number;
  country: string;
  countryCode: string;
  region: string;
  status: "online" | "offline";
  healthScore: number;
  uptime24h: number;
  storageUtilization: number;
  version: string;
  lastSeen: string;
}

export interface GeoSummary {
  countries: Array<{ country: string; count: number }>;
  regions: Array<{ region: string; count: number }>;
}

export interface CountryStats {
  countryCode: string;
  country: string;
  nodeCount: number;
  onlineCount: number;
  offlineCount: number;
  avgHealthScore: number;
  avgUptime24h: number;
  avgStorageUtilization: number;
}

export interface CountryChoropleth {
  countries: CountryStats[];
  totalNodes: number;
  totalCountries: number;
}

export interface NodeStats {
  active_streams: number;
  cpu_percent: number;
  current_index: number;
  file_size: number;
  last_updated: number;
  packets_received: number;
  packets_sent: number;
  ram_total: number;
  ram_used: number;
  total_bytes: number;
  total_pages: number;
  uptime: number;
  timestamp?: string;
}

/**
 * API Client
 */
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    timeoutMs: number = 30000
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}`
        );
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Request timeout after ${timeoutMs}ms`);
      }
      throw error;
    }
  }

  async getPNodes(): Promise<BackendPNode[]> {
    return this.request<BackendPNode[]>("/pnodes");
  }

  async getPNode(pubkey: string): Promise<BackendPNode> {
    return this.request<BackendPNode>(`/pnodes/${pubkey}`);
  }

  async getAnalyticsSummary(): Promise<AnalyticsSummary> {
    return this.request<AnalyticsSummary>("/analytics/summary");
  }

  async getStorageAnalytics(): Promise<StorageAnalytics[]> {
    return this.request<StorageAnalytics[]>("/analytics/storage");
  }

  async getVersionDistribution(): Promise<VersionDistribution[]> {
    return this.request<VersionDistribution[]>("/analytics/versions");
  }

  async getExtendedSummary(): Promise<ExtendedSummary> {
    return this.request<ExtendedSummary>("/analytics/extended-summary");
  }

  async getNodeMetrics(): Promise<NodeMetrics[]> {
    return this.request<NodeMetrics[]>("/analytics/node-metrics");
  }

  async getTopNodes(): Promise<TopNode[]> {
    return this.request<TopNode[]>("/analytics/top-nodes");
  }

  async getStoragePressure(): Promise<StoragePressure> {
    return this.request<StoragePressure>("/analytics/storage-pressure");
  }

  async getMapNodes(): Promise<MapNode[]> {
    // Map endpoint can take longer, so use extended timeout
    return this.request<MapNode[]>("/pnodes/map", 60000);
  }

  async getGeoSummary(): Promise<GeoSummary> {
    return this.request<GeoSummary>("/analytics/geo-summary");
  }

  async getCountryChoropleth(): Promise<CountryChoropleth> {
    return this.request<CountryChoropleth>("/analytics/country-choropleth", 60000);
  }

  async getNodeStats(pubkey: string): Promise<NodeStats> {
    // Use longer timeout for stats requests as they can take time
    return this.request<NodeStats>(`/pnodes/${pubkey}/stats`, 15000);
  }

  async healthCheck(): Promise<{ status: string }> {
    return this.request<{ status: string }>("/health");
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
