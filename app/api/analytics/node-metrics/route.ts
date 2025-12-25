import { NextResponse } from "next/server";
import { getNodeMetrics } from "@/server/services/analytics.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const metrics = await getNodeMetrics();
    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Error fetching node metrics:", error);
    return NextResponse.json(
      { error: "Internal server error", message: "Failed to fetch node metrics" },
      { status: 500 }
    );
  }
}
