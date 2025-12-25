import { NextResponse } from "next/server";
import { getExtendedSummary } from "@/server/services/analytics.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const summary = await getExtendedSummary();
    return NextResponse.json(summary);
  } catch (error) {
    console.error("Error fetching extended summary:", error);
    return NextResponse.json(
      { error: "Internal server error", message: "Failed to fetch extended summary" },
      { status: 500 }
    );
  }
}
