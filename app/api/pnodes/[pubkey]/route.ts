import { NextResponse } from "next/server";
import { getPNodeByPubkey } from "@/server/services/pnode.service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface RouteParams {
  params: Promise<{ pubkey: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { pubkey } = await params;
    const node = await getPNodeByPubkey(pubkey);

    if (!node) {
      return NextResponse.json(
        { error: "Not found", message: `pNode with pubkey ${pubkey} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json(node);
  } catch (error) {
    console.error("Error fetching pNode:", error);
    return NextResponse.json(
      { error: "Internal server error", message: "Failed to fetch pNode" },
      { status: 500 }
    );
  }
}
