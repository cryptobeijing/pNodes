"use client";

import { useState, useMemo } from 'react';
import { Search, Copy, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatStorage, calculatePercentage, formatRelativeTime, shortenPubkey } from '@/lib/format';
import type { PNode } from '@/hooks/usePNodes';

interface PNodesTableProps {
  pnodes: PNode[];
  isLoading: boolean;
  onSelectNode: (node: PNode) => void;
}

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 hover:bg-muted rounded-md transition-colors"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-primary" />
      ) : (
        <Copy className="w-3.5 h-3.5 text-muted-foreground" />
      )}
    </button>
  );
};

export const PNodesTable = ({ pnodes, isLoading, onSelectNode }: PNodesTableProps) => {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const filteredNodes = useMemo(() => {
    let result = [...pnodes];

    // Filter by search
    if (search.trim()) {
      const searchLower = search.toLowerCase().trim();
      result = result.filter((node) => {
        return (
          node.pubkey.toLowerCase().includes(searchLower) ||
          (node.region || '').toLowerCase().includes(searchLower) ||
          (node.ip || '').toLowerCase().includes(searchLower)
        );
      });
    }

    // Sort by health score descending
    result.sort((a, b) => (b.healthScore || 0) - (a.healthScore || 0));

    // Deduplicate
    const seen = new Set<string>();
    return result.filter((node) => {
      if (seen.has(node.pubkey)) return false;
      seen.add(node.pubkey);
      return true;
    });
  }, [pnodes, search]);

  const totalPages = Math.ceil(filteredNodes.length / itemsPerPage);
  const paginatedNodes = filteredNodes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-72 rounded-lg shimmer" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl shimmer" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search & Count */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by ID, region, or IP..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9 bg-card border-border"
          />
        </div>
        <span className="text-sm text-muted-foreground">
          {filteredNodes.length} pNodes
        </span>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedNodes.map((node) => {
          const storagePercent = node.storageTotal > 0
            ? calculatePercentage(node.storageUsed, node.storageTotal)
            : 0;

          return (
            <div
              key={node.pubkey}
              onClick={() => onSelectNode(node)}
              className={cn(
                "p-4 rounded-xl bg-card border border-border cursor-pointer",
                "hover:border-primary/40 transition-colors"
              )}
            >
              {/* Header: ID + Status */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono text-foreground">
                    {shortenPubkey(node.pubkey, 4)}
                  </code>
                  <CopyButton text={node.pubkey} />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={cn(
                    "w-2 h-2 rounded-full",
                    node.status === 'online' ? 'bg-primary' : 'bg-destructive'
                  )} />
                  <span className="text-xs text-muted-foreground capitalize">
                    {node.status}
                  </span>
                </div>
              </div>

              {/* Health Score */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground">Health</span>
                <span className={cn(
                  "text-lg font-semibold",
                  (node.healthScore || 0) >= 90 ? 'text-primary' :
                  (node.healthScore || 0) >= 75 ? 'text-warning' : 'text-destructive'
                )}>
                  {node.healthScore?.toFixed(0) || 'N/A'}
                </span>
              </div>

              {/* Storage Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Storage</span>
                  <span className="text-muted-foreground">{storagePercent.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      storagePercent > 80 ? 'bg-destructive' :
                      storagePercent > 60 ? 'bg-warning' : 'bg-primary'
                    )}
                    style={{ width: `${Math.min(100, storagePercent)}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatStorage(node.storageUsed)} / {formatStorage(node.storageTotal)}
                </div>
              </div>

              {/* Footer: Region + Last Seen */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                <span className="text-xs text-muted-foreground">{node.region || 'Unknown'}</span>
                <span className="text-xs text-muted-foreground">{formatRelativeTime(node.lastSeen)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredNodes.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">No pNodes found</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="h-8 w-8"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <span className="text-sm text-muted-foreground px-4">
            Page {currentPage} of {totalPages}
          </span>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="h-8 w-8"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
