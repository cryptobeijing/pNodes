import { NextResponse } from "next/server";
import { getNodeStatsByPubkey } from "@/server/services/pnode.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface RouteParams {
  params: Promise<{ pubkey: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { pubkey } = await params;
    const stats = await getNodeStatsByPubkey(pubkey);

    if (!stats) {
      return NextResponse.json(
        { error: "Not found", message: `Stats for pNode ${pubkey} not available` },
        { status: 404 }
      );
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching node stats:", error);
    return NextResponse.json(
      { error: "Internal server error", message: "Failed to fetch node stats" },
      { status: 500 }
    );
  }
}
