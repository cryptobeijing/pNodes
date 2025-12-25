import { NextResponse } from "next/server";
import { getVersionDistribution } from "@/server/services/analytics.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const versions = await getVersionDistribution();
    return NextResponse.json(versions);
  } catch (error) {
    console.error("Error fetching version distribution:", error);
    return NextResponse.json(
      { error: "Internal server error", message: "Failed to fetch version distribution" },
      { status: 500 }
    );
  }
}
