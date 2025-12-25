import { NextResponse } from "next/server";
import { getCountryChoropleth } from "@/server/services/map.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const choroplethData = await getCountryChoropleth();
    return NextResponse.json(choroplethData);
  } catch (error) {
    console.error("Error fetching country choropleth data:", error);
    return NextResponse.json(
      { error: "Internal server error", message: "Failed to fetch country choropleth data" },
      { status: 500 }
    );
  }
}
