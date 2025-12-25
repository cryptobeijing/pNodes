import { NextResponse } from "next/server";
import { getAllPNodes } from "@/server/services/pnode.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const nodes = await getAllPNodes();
    return NextResponse.json(nodes);
  } catch (error) {
    console.error("Error fetching pNodes:", error);
    return NextResponse.json(
      { error: "Internal server error", message: "Failed to fetch pNodes" },
      { status: 500 }
    );
  }
}
