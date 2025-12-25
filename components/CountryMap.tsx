"use client";

import dynamic from "next/dynamic";
import { CountryStats } from "@/lib/api";

// Dynamically import to avoid SSR issues with Leaflet
const CountryMapInternal = dynamic(
  () => import("./CountryMapInternal").then((mod) => mod.CountryMapInternal),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-2xl bg-[#0a0f1a] border border-border h-[500px] flex items-center justify-center">
        <div className="text-muted-foreground">Loading country map...</div>
      </div>
    ),
  }
);

interface CountryMapProps {
  countries: CountryStats[];
  totalNodes: number;
  isLoading?: boolean;
}

export function CountryMap(props: CountryMapProps) {
  return <CountryMapInternal {...props} />;
}
