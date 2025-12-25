import { NodeInspectorClient } from "@/components/NodeInspectorClient";

interface PageProps {
  params: Promise<{ pubkey: string }>;
}

export default async function NodeInspectorPage({ params }: PageProps) {
  const { pubkey } = await params;
  return <NodeInspectorClient pubkey={pubkey} />;
}
