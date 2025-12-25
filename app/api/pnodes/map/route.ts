import { NextResponse } from "next/server";
import { getMapNodes } from "@/server/services/map.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const mapNodes = await getMapNodes();
    return NextResponse.json(mapNodes);
  } catch (error) {
    console.error("Error fetching map nodes:", error);
    // Return empty array on error instead of 500 to prevent map from breaking
    return NextResponse.json([]);
  }
}
