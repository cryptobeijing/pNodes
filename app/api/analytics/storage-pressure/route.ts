import { NextResponse } from "next/server";
import { getStoragePressure } from "@/server/services/analytics.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const pressure = await getStoragePressure();
    return NextResponse.json(pressure);
  } catch (error) {
    console.error("Error fetching storage pressure:", error);
    return NextResponse.json(
      { error: "Internal server error", message: "Failed to fetch storage pressure" },
      { status: 500 }
    );
  }
}
