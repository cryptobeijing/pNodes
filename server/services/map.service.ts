/**
 * Map Service
 *
 * Provides map-specific data combining pNode information with geographic data.
 * Reuses cached pNode and metrics data for efficiency.
 */

import { getAllPNodes } from "./pnode.service";
import { getCachedNodeMetrics } from "./analytics.service";
import { batchResolveGeo } from "./geo.service";
import { MapNode, GeoSummary, CountryChoropleth, CountryStats } from "@/server/types/pnode";

/**
 * Get all pNodes with geographic and health data for map visualization.
 *
 * This function:
 * - Uses deduplicated pNode data (214 unique nodes)
 * - Uses batch geo lookups for efficiency (100 IPs per request)
 * - Geo data cached for 24h
 *
 * @returns Array of MapNode objects with geo and health data
 */
export async function getMapNodes(): Promise<MapNode[]> {
  try {
    // Get deduplicated nodes
    const [nodes, metrics] = await Promise.all([
      getAllPNodes(),
      getCachedNodeMetrics(),
    ]);

    // Create metrics map for quick lookup
    const metricsMap = new Map(metrics.map((m) => [m.pubkey, m]));

    // Extract all addresses for batch geo lookup
    const addresses = nodes.map((node) => node.address || node.ip);

    // Batch resolve all geo data (uses cache + batch API)
    const geoMap = await batchResolveGeo(addresses);

    // Build MapNode array
    const mapNodes: MapNode[] = [];

    for (const node of nodes) {
      const address = node.address || node.ip;
      // Extract IP from address (format: "ip:port")
      const ip = address?.split(":")[0];

      if (!ip) continue;

      const geo = geoMap.get(ip);
      if (!geo) continue;

      const nodeMetrics = metricsMap.get(node.pubkey);

      mapNodes.push({
        pubkey: node.pubkey,
        lat: geo.lat,
        lng: geo.lng,
        country: geo.country,
        countryCode: geo.countryCode,
        region: geo.region,
        status: node.status,
        healthScore: nodeMetrics?.healthScore ?? 0,
        uptime24h: nodeMetrics?.uptime24h ?? 0,
        storageUtilization: nodeMetrics?.storageUtilization ?? 0,
        version: node.version,
        lastSeen: node.lastSeen,
      });
    }

    console.log(`Geo lookup: ${mapNodes.length}/${nodes.length} nodes mapped`);

    return mapNodes;
  } catch (error) {
    console.error("Error in getMapNodes:", error);
    throw error;
  }
}

/**
 * Get geographic summary analytics.
 *
 * @returns Summary of nodes by country and region
 */
export async function getGeoSummary(): Promise<GeoSummary> {
  const mapNodes = await getMapNodes();

  // Count by country
  const countryMap = new Map<string, number>();
  for (const node of mapNodes) {
    countryMap.set(node.country, (countryMap.get(node.country) || 0) + 1);
  }

  // Count by region
  const regionMap = new Map<string, number>();
  for (const node of mapNodes) {
    regionMap.set(node.region, (regionMap.get(node.region) || 0) + 1);
  }

  const countries = Array.from(countryMap.entries())
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count);

  const regions = Array.from(regionMap.entries())
    .map(([region, count]) => ({ region, count }))
    .sort((a, b) => b.count - a.count);

  return {
    countries,
    regions,
  };
}

/**
 * Get country choropleth data for map visualization.
 * Aggregates node statistics by country with ISO codes for GeoJSON matching.
 *
 * @returns CountryChoropleth with aggregated country statistics
 */
export async function getCountryChoropleth(): Promise<CountryChoropleth> {
  const mapNodes = await getMapNodes();

  // Aggregate by country code
  const countryDataMap = new Map<
    string,
    {
      countryCode: string;
      country: string;
      nodes: MapNode[];
    }
  >();

  for (const node of mapNodes) {
    const existing = countryDataMap.get(node.countryCode);
    if (existing) {
      existing.nodes.push(node);
    } else {
      countryDataMap.set(node.countryCode, {
        countryCode: node.countryCode,
        country: node.country,
        nodes: [node],
      });
    }
  }

  // Calculate statistics for each country
  const countries: CountryStats[] = Array.from(countryDataMap.values()).map(
    ({ countryCode, country, nodes }) => {
      const onlineNodes = nodes.filter((n) => n.status === "online");
      const avgHealthScore =
        nodes.length > 0
          ? nodes.reduce((sum, n) => sum + n.healthScore, 0) / nodes.length
          : 0;
      const avgUptime24h =
        nodes.length > 0
          ? nodes.reduce((sum, n) => sum + n.uptime24h, 0) / nodes.length
          : 0;
      const avgStorageUtilization =
        nodes.length > 0
          ? nodes.reduce((sum, n) => sum + n.storageUtilization, 0) /
            nodes.length
          : 0;

      return {
        countryCode,
        country,
        nodeCount: nodes.length,
        onlineCount: onlineNodes.length,
        offlineCount: nodes.length - onlineNodes.length,
        avgHealthScore: Math.round(avgHealthScore * 10) / 10,
        avgUptime24h: Math.round(avgUptime24h * 10) / 10,
        avgStorageUtilization: Math.round(avgStorageUtilization * 10) / 10,
      };
    }
  );

  // Sort by node count descending
  countries.sort((a, b) => b.nodeCount - a.nodeCount);

  return {
    countries,
    totalNodes: mapNodes.length,
    totalCountries: countries.length,
  };
}
