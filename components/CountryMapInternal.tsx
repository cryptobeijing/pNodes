"use client";

import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import type { FeatureCollection, Feature, Geometry } from "geojson";
import type { Layer, PathOptions } from "leaflet";
import "leaflet/dist/leaflet.css";
import { CountryStats } from "@/lib/api";

// ISO 3166-1 Alpha-2 to Alpha-3 mapping
const iso2to3: Record<string, string> = {
  AF: "AFG", AL: "ALB", DZ: "DZA", AS: "ASM", AD: "AND", AO: "AGO", AI: "AIA",
  AQ: "ATA", AG: "ATG", AR: "ARG", AM: "ARM", AW: "ABW", AU: "AUS", AT: "AUT",
  AZ: "AZE", BS: "BHS", BH: "BHR", BD: "BGD", BB: "BRB", BY: "BLR", BE: "BEL",
  BZ: "BLZ", BJ: "BEN", BM: "BMU", BT: "BTN", BO: "BOL", BA: "BIH", BW: "BWA",
  BR: "BRA", BN: "BRN", BG: "BGR", BF: "BFA", BI: "BDI", KH: "KHM", CM: "CMR",
  CA: "CAN", CV: "CPV", KY: "CYM", CF: "CAF", TD: "TCD", CL: "CHL", CN: "CHN",
  CO: "COL", KM: "COM", CG: "COG", CD: "COD", CR: "CRI", CI: "CIV", HR: "HRV",
  CU: "CUB", CY: "CYP", CZ: "CZE", DK: "DNK", DJ: "DJI", DM: "DMA", DO: "DOM",
  EC: "ECU", EG: "EGY", SV: "SLV", GQ: "GNQ", ER: "ERI", EE: "EST", ET: "ETH",
  FJ: "FJI", FI: "FIN", FR: "FRA", GA: "GAB", GM: "GMB", GE: "GEO", DE: "DEU",
  GH: "GHA", GR: "GRC", GL: "GRL", GD: "GRD", GU: "GUM", GT: "GTM", GN: "GIN",
  GW: "GNB", GY: "GUY", HT: "HTI", HN: "HND", HK: "HKG", HU: "HUN", IS: "ISL",
  IN: "IND", ID: "IDN", IR: "IRN", IQ: "IRQ", IE: "IRL", IL: "ISR", IT: "ITA",
  JM: "JAM", JP: "JPN", JO: "JOR", KZ: "KAZ", KE: "KEN", KI: "KIR", KP: "PRK",
  KR: "KOR", KW: "KWT", KG: "KGZ", LA: "LAO", LV: "LVA", LB: "LBN", LS: "LSO",
  LR: "LBR", LY: "LBY", LI: "LIE", LT: "LTU", LU: "LUX", MK: "MKD", MG: "MDG",
  MW: "MWI", MY: "MYS", MV: "MDV", ML: "MLI", MT: "MLT", MH: "MHL", MR: "MRT",
  MU: "MUS", MX: "MEX", FM: "FSM", MD: "MDA", MC: "MCO", MN: "MNG", ME: "MNE",
  MA: "MAR", MZ: "MOZ", MM: "MMR", NA: "NAM", NR: "NRU", NP: "NPL", NL: "NLD",
  NZ: "NZL", NI: "NIC", NE: "NER", NG: "NGA", NO: "NOR", OM: "OMN", PK: "PAK",
  PW: "PLW", PA: "PAN", PG: "PNG", PY: "PRY", PE: "PER", PH: "PHL", PL: "POL",
  PT: "PRT", PR: "PRI", QA: "QAT", RO: "ROU", RU: "RUS", RW: "RWA", SA: "SAU",
  SN: "SEN", RS: "SRB", SC: "SYC", SL: "SLE", SG: "SGP", SK: "SVK", SI: "SVN",
  SB: "SLB", SO: "SOM", ZA: "ZAF", SS: "SSD", ES: "ESP", LK: "LKA", SD: "SDN",
  SR: "SUR", SZ: "SWZ", SE: "SWE", CH: "CHE", SY: "SYR", TW: "TWN", TJ: "TJK",
  TZ: "TZA", TH: "THA", TL: "TLS", TG: "TGO", TO: "TON", TT: "TTO", TN: "TUN",
  TR: "TUR", TM: "TKM", UG: "UGA", UA: "UKR", AE: "ARE", GB: "GBR", US: "USA",
  UY: "URY", UZ: "UZB", VU: "VUT", VE: "VEN", VN: "VNM", YE: "YEM", ZM: "ZMB",
  ZW: "ZWE", XK: "XKX", PS: "PSE", EH: "ESH", NC: "NCL", PF: "PYF", TF: "ATF",
  MO: "MAC", CW: "CUW", SX: "SXM", BQ: "BES", AX: "ALA", GG: "GGY", JE: "JEY",
  IM: "IMN", FO: "FRO", GI: "GIB", VA: "VAT", SM: "SMR", WS: "WSM",
};

interface CountryMapProps {
  countries: CountryStats[];
  totalNodes: number;
  isLoading?: boolean;
}

// Color scale for choropleth (light to dark blue based on node count)
function getColor(nodeCount: number, maxNodes: number): string {
  if (nodeCount === 0) return "#1a1f2e"; // Dark background for no nodes

  // Normalize to 0-1 range using log scale for better distribution
  const ratio = Math.log(nodeCount + 1) / Math.log(maxNodes + 1);

  // Color gradient from light blue to bright cyan/teal
  if (ratio > 0.8) return "#00f5d4"; // Brightest - most nodes
  if (ratio > 0.6) return "#00d4aa";
  if (ratio > 0.4) return "#00b894";
  if (ratio > 0.2) return "#00a085";
  if (ratio > 0.1) return "#008f7a";
  return "#0a6c5c"; // Darkest - few nodes
}

// Map bounds controller
function MapController() {
  const map = useMap();

  useEffect(() => {
    map.setMaxBounds([[-90, -180], [90, 180]]);
    map.setMinZoom(1.5);
  }, [map]);

  return null;
}

export function CountryMapInternal({ countries, totalNodes, isLoading }: CountryMapProps) {
  const [geoData, setGeoData] = useState<FeatureCollection | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<CountryStats | null>(null);

  // Create lookup map from ISO-3 code to country stats
  const countryDataMap = useMemo(() => {
    const map = new Map<string, CountryStats>();
    for (const country of countries) {
      const iso3 = iso2to3[country.countryCode];
      if (iso3) {
        map.set(iso3, country);
      }
    }
    return map;
  }, [countries]);

  const maxNodes = useMemo(() => {
    return Math.max(...countries.map((c) => c.nodeCount), 1);
  }, [countries]);

  // Load GeoJSON data
  useEffect(() => {
    fetch("/data/countries-simple.geojson")
      .then((res) => res.json())
      .then((data) => setGeoData(data))
      .catch((err) => console.error("Failed to load GeoJSON:", err));
  }, []);

  // Style function for each country
  const countryStyle = (feature: Feature<Geometry> | undefined): PathOptions => {
    if (!feature) return {};

    const countryId = feature.id as string;
    const countryData = countryDataMap.get(countryId);
    const nodeCount = countryData?.nodeCount || 0;

    return {
      fillColor: getColor(nodeCount, maxNodes),
      weight: 1,
      opacity: 1,
      color: "#2d3748",
      fillOpacity: nodeCount > 0 ? 0.85 : 0.3,
    };
  };

  // Event handlers for each country
  const onEachCountry = (feature: Feature<Geometry>, layer: Layer) => {
    const countryId = feature.id as string;
    const countryData = countryDataMap.get(countryId);
    const countryName = feature.properties?.name || "Unknown";

    if (countryData) {
      layer.bindTooltip(
        `<div class="country-tooltip">
          <div class="font-bold text-white">${countryName}</div>
          <div class="text-cyan-400 font-semibold">${countryData.nodeCount} node${countryData.nodeCount !== 1 ? 's' : ''}</div>
          <div class="text-xs text-gray-400 mt-1">
            <div>Online: ${countryData.onlineCount} | Offline: ${countryData.offlineCount}</div>
            <div>Avg Health: ${countryData.avgHealthScore}%</div>
          </div>
        </div>`,
        {
          sticky: true,
          className: "custom-tooltip",
        }
      );
    } else {
      layer.bindTooltip(
        `<div class="country-tooltip">
          <div class="font-bold text-gray-400">${countryName}</div>
          <div class="text-xs text-gray-500">No nodes</div>
        </div>`,
        {
          sticky: true,
          className: "custom-tooltip",
        }
      );
    }

    layer.on({
      mouseover: (e) => {
        const l = e.target;
        l.setStyle({
          weight: 2,
          color: "#00f5d4",
          fillOpacity: 0.95,
        });
        l.bringToFront();
        if (countryData) {
          setSelectedCountry(countryData);
        }
      },
      mouseout: (e) => {
        const l = e.target;
        l.setStyle(countryStyle(feature));
        setSelectedCountry(null);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-[#0a0f1a] border border-border h-[500px] flex items-center justify-center">
        <div className="text-muted-foreground">Loading country map...</div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-[#0a0f1a] border border-border overflow-hidden h-[500px] relative">
      {/* Stats overlay - top left */}
      <div className="absolute top-4 left-4 z-[1000] bg-[#0d1929]/90 backdrop-blur-sm border border-[#1e3a5f] rounded-lg px-4 py-3">
        <div className="text-sm text-gray-400">Network Distribution</div>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-2xl font-bold text-white">{countries.length}</span>
          <span className="text-sm text-gray-400">countries</span>
          <span className="text-gray-600 mx-1">|</span>
          <span className="text-xl font-semibold text-cyan-400">{totalNodes}</span>
          <span className="text-sm text-gray-400">nodes</span>
        </div>
      </div>

      {/* Selected country detail - top right */}
      {selectedCountry && (
        <div className="absolute top-4 right-4 z-[1000] bg-[#0d1929]/90 backdrop-blur-sm border border-[#1e3a5f] rounded-lg px-4 py-3 min-w-[200px]">
          <div className="font-semibold text-white">{selectedCountry.country}</div>
          <div className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Nodes</span>
              <span className="text-cyan-400 font-medium">{selectedCountry.nodeCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Online</span>
              <span className="text-green-400">{selectedCountry.onlineCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Avg Health</span>
              <span className="text-white">{selectedCountry.avgHealthScore}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Avg Uptime</span>
              <span className="text-white">{selectedCountry.avgUptime24h}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Legend - bottom left */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-[#0d1929]/90 backdrop-blur-sm border border-[#1e3a5f] rounded-lg p-3">
        <div className="text-xs text-gray-400 mb-2">Node Density</div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: "#0a6c5c" }} />
          <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: "#008f7a" }} />
          <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: "#00a085" }} />
          <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: "#00b894" }} />
          <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: "#00d4aa" }} />
          <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: "#00f5d4" }} />
        </div>
        <div className="flex justify-between text-[10px] text-gray-500 mt-1">
          <span>Few</span>
          <span>Many</span>
        </div>
      </div>

      {/* Top countries list - bottom right */}
      <div className="absolute bottom-4 right-4 z-[1000] bg-[#0d1929]/90 backdrop-blur-sm border border-[#1e3a5f] rounded-lg p-3 max-h-[140px] overflow-hidden">
        <div className="text-xs text-gray-400 mb-2">Top Countries</div>
        <div className="space-y-1">
          {countries.slice(0, 5).map((country, idx) => (
            <div key={country.countryCode} className="flex items-center gap-2 text-xs">
              <span className="text-gray-500 w-4">{idx + 1}.</span>
              <span className="text-gray-300 flex-1 truncate max-w-[100px]">{country.country}</span>
              <span className="text-cyan-400 font-medium">{country.nodeCount}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Map */}
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: "100%", width: "100%", background: "#0a0f1a" }}
        scrollWheelZoom={true}
        zoomControl={true}
        attributionControl={false}
      >
        <MapController />
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        {geoData && (
          <GeoJSON
            key={JSON.stringify(countries.map(c => c.countryCode))}
            data={geoData}
            style={countryStyle}
            onEachFeature={onEachCountry}
          />
        )}
      </MapContainer>

      {/* Custom tooltip styles */}
      <style jsx global>{`
        .custom-tooltip {
          background: rgba(13, 25, 41, 0.95) !important;
          border: 1px solid #1e3a5f !important;
          border-radius: 8px !important;
          padding: 8px 12px !important;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4) !important;
        }
        .custom-tooltip .country-tooltip {
          font-family: inherit;
        }
        .leaflet-tooltip-left:before,
        .leaflet-tooltip-right:before {
          border-color: transparent !important;
        }
        .leaflet-control-zoom {
          border: 1px solid #1e3a5f !important;
          background: #0d1929 !important;
        }
        .leaflet-control-zoom a {
          background: #0d1929 !important;
          color: #9ca3af !important;
          border-bottom: 1px solid #1e3a5f !important;
        }
        .leaflet-control-zoom a:hover {
          background: #162d4a !important;
          color: #ffffff !important;
        }
      `}</style>
    </div>
  );
}
