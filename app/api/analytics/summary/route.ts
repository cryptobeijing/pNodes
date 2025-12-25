import { NextResponse } from "next/server";
import { getAnalyticsSummary } from "@/server/services/analytics.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const summary = await getAnalyticsSummary();
    return NextResponse.json(summary);
  } catch (error) {
    console.error("Error fetching analytics summary:", error);
    return NextResponse.json(
      { error: "Internal server error", message: "Failed to fetch analytics summary" },
      { status: 500 }
    );
  }
}
