import { NextResponse } from "next/server";
import { getGeoSummary } from "@/server/services/map.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const geoSummary = await getGeoSummary();
    return NextResponse.json(geoSummary);
  } catch (error) {
    console.error("Error fetching geo summary:", error);
    return NextResponse.json(
      { error: "Internal server error", message: "Failed to fetch geo summary" },
      { status: 500 }
    );
  }
}
