/**
 * Geo Location Service
 *
 * Provides IP geolocation resolution using ip-api.com (free, no key required).
 * Results are aggressively cached (24h TTL) to minimize API calls.
 * Uses batch API for efficient bulk lookups (up to 100 IPs per request).
 */

import { geoCacheService } from "./redis.service";

export interface GeoLocation {
  lat: number;
  lng: number;
  country: string;
  countryCode: string; // ISO 3166-1 alpha-2 code (e.g., "US", "DE")
  region: string;
  city?: string;
}

const GEO_CACHE_KEY_PREFIX = "geo:";
const GEO_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const BATCH_SIZE = 100; // ip-api.com allows up to 100 IPs per batch request

/**
 * Check if an IP is private/reserved (not routable on public internet)
 */
function isPrivateIP(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4) return true;

  // 127.0.0.0/8 - Loopback
  if (parts[0] === 127) return true;

  // 10.0.0.0/8 - Private
  if (parts[0] === 10) return true;

  // 172.16.0.0/12 - Private
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;

  // 192.168.0.0/16 - Private
  if (parts[0] === 192 && parts[1] === 168) return true;

  // 0.0.0.0/8 - Invalid
  if (parts[0] === 0) return true;

  // 169.254.0.0/16 - Link-local
  if (parts[0] === 169 && parts[1] === 254) return true;

  return false;
}

/**
 * Default geo location for private/localhost IPs (assigned to France)
 */
const DEFAULT_PRIVATE_IP_GEO: GeoLocation = {
  lat: 48.8566,
  lng: 2.3522,
  country: "France",
  countryCode: "FR",
  region: "Île-de-France",
  city: "Paris",
};

/**
 * Extract IP address from address string (format: "ip:port" or just "ip")
 */
function extractIP(address: string | undefined): string | null {
  if (!address) return null;

  // Remove port if present (format: "ip:port")
  const ip = address.split(":")[0].trim();

  // Basic IPv4 validation
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipv4Regex.test(ip)) {
    return null;
  }

  return ip;
}

/**
 * Get geo location for private IPs (returns default France location)
 */
export function getPrivateIPGeo(ip: string): GeoLocation | null {
  if (isPrivateIP(ip)) {
    return DEFAULT_PRIVATE_IP_GEO;
  }
  return null;
}

/**
 * Resolve IP address to geographic location using ip-api.com
 * Results are cached for 24 hours to minimize API calls.
 *
 * @param ip - IP address to resolve
 * @param timeoutMs - Request timeout in milliseconds (default: 5000)
 * @returns GeoLocation or null if resolution fails
 */
export async function resolveIPToGeo(
  ip: string,
  timeoutMs: number = 5000
): Promise<GeoLocation | null> {
  // Check cache first (Redis-backed with in-memory fallback)
  const cacheKey = `${GEO_CACHE_KEY_PREFIX}${ip}`;
  const cached = await geoCacheService.get<GeoLocation>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // Create fetch promise with timeout using AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(
        `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,regionName,city,lat,lon`,
        {
          headers: {
            Accept: "application/json",
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as {
        status?: string;
        message?: string;
        lat?: number | string;
        lon?: number | string;
        country?: string;
        countryCode?: string;
        regionName?: string;
        city?: string;
      };

      // Check if API returned an error
      if (data.status === "fail") {
        return null;
      }

      // Validate required fields
      if (!data.lat || !data.lon || !data.country) {
        return null;
      }

      const geo: GeoLocation = {
        lat: typeof data.lat === "string" ? parseFloat(data.lat) : data.lat,
        lng: typeof data.lon === "string" ? parseFloat(data.lon) : data.lon,
        country: data.country || "Unknown",
        countryCode: data.countryCode || "XX",
        region: data.regionName || "Unknown",
        city: data.city || undefined,
      };

      // Cache the result for 24 hours (Redis-backed with in-memory fallback)
      await geoCacheService.set(cacheKey, geo, GEO_CACHE_TTL_MS);

      return geo;
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);

      // Handle timeout/abort errors silently
      if (
        fetchError instanceof Error &&
        (fetchError.name === "AbortError" ||
          fetchError.message?.includes("timeout"))
      ) {
        return null;
      }

      throw fetchError; // Re-throw other errors
    }
  } catch {
    // Handle network errors and other failures silently
    return null;
  }
}

/**
 * Resolve IP address from node address string
 * Handles extraction and validation before calling geo resolver
 *
 * @param address - Node address string (format: "ip:port" or just "ip")
 * @param timeoutMs - Request timeout in milliseconds (default: 3000)
 */
export async function resolveNodeGeo(
  address: string | undefined,
  timeoutMs: number = 3000
): Promise<GeoLocation | null> {
  const ip = extractIP(address);
  if (!ip) {
    return null;
  }

  return resolveIPToGeo(ip, timeoutMs);
}

/**
 * Batch resolve multiple IP addresses using ip-api.com batch endpoint.
 * Much more efficient than individual requests - up to 100 IPs per request.
 * Results are cached for 24 hours.
 *
 * @param addresses - Array of address strings (format: "ip:port" or just "ip")
 * @param timeoutMs - Request timeout in milliseconds (default: 10000)
 * @returns Map of IP to GeoLocation
 */
export async function batchResolveGeo(
  addresses: string[],
  timeoutMs: number = 10000
): Promise<Map<string, GeoLocation>> {
  const results = new Map<string, GeoLocation>();

  // Extract and validate IPs, separating private from public
  const publicIps: string[] = [];
  for (const address of addresses) {
    const ip = extractIP(address);
    if (!ip) continue;

    // Check if it's a private IP - assign default France location
    const privateGeo = getPrivateIPGeo(ip);
    if (privateGeo) {
      results.set(ip, privateGeo);
    } else {
      publicIps.push(ip);
    }
  }

  // If no public IPs to lookup, return early with private IP results
  if (publicIps.length === 0) {
    return results;
  }

  const allIps = publicIps;

  // Check cache first
  const uncachedIps: string[] = [];
  for (const ip of allIps) {
    const cacheKey = `${GEO_CACHE_KEY_PREFIX}${ip}`;
    const cached = await geoCacheService.get<GeoLocation>(cacheKey);
    if (cached) {
      results.set(ip, cached);
    } else {
      uncachedIps.push(ip);
    }
  }

  // If all IPs were cached, return early
  if (uncachedIps.length === 0) {
    return results;
  }

  // Process uncached IPs in batches using the batch API
  for (let i = 0; i < uncachedIps.length; i += BATCH_SIZE) {
    const batch = uncachedIps.slice(i, i + BATCH_SIZE);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      // ip-api.com batch endpoint accepts POST with JSON array of IPs
      const response = await fetch(
        "http://ip-api.com/batch?fields=status,message,query,country,countryCode,regionName,city,lat,lon",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(batch),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(`Batch geo lookup failed: ${response.status}`);
        continue;
      }

      const data = (await response.json()) as Array<{
        query?: string;
        status?: string;
        message?: string;
        lat?: number | string;
        lon?: number | string;
        country?: string;
        countryCode?: string;
        regionName?: string;
        city?: string;
      }>;

      // Process each result
      for (const item of data) {
        if (item.status === "fail" || !item.lat || !item.lon || !item.country) {
          continue;
        }

        const ip = item.query;
        if (!ip) continue;

        const geo: GeoLocation = {
          lat: typeof item.lat === "string" ? parseFloat(item.lat) : item.lat,
          lng: typeof item.lon === "string" ? parseFloat(item.lon) : item.lon,
          country: item.country || "Unknown",
          countryCode: item.countryCode || "XX",
          region: item.regionName || "Unknown",
          city: item.city || undefined,
        };

        results.set(ip, geo);

        // Cache the result
        const cacheKey = `${GEO_CACHE_KEY_PREFIX}${ip}`;
        await geoCacheService.set(cacheKey, geo, GEO_CACHE_TTL_MS);
      }

      // Add a small delay between batches to be nice to the API
      if (i + BATCH_SIZE < uncachedIps.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.error("Batch geo lookup timed out");
      } else {
        console.error("Batch geo lookup error:", error);
      }
    }
  }

  return results;
}
