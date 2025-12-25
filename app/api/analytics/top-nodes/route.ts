import { NextResponse } from "next/server";
import { getTopNodes } from "@/server/services/analytics.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const topNodes = await getTopNodes();
    return NextResponse.json(topNodes);
  } catch (error) {
    console.error("Error fetching top nodes:", error);
    return NextResponse.json(
      { error: "Internal server error", message: "Failed to fetch top nodes" },
      { status: 500 }
    );
  }
}
