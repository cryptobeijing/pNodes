import { NextResponse } from "next/server";
import { getStorageAnalytics } from "@/server/services/analytics.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const storage = await getStorageAnalytics();
    return NextResponse.json(storage);
  } catch (error) {
    console.error("Error fetching storage analytics:", error);
    return NextResponse.json(
      { error: "Internal server error", message: "Failed to fetch storage analytics" },
      { status: 500 }
    );
  }
}
