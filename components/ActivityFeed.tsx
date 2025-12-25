"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Server,
  ServerOff,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Activity,
  Clock,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export type ActivityEventType =
  | "node_online"
  | "node_offline"
  | "health_improved"
  | "health_degraded"
  | "storage_alert"
  | "new_node";

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  pubkey: string;
  pubkeyShort: string;
  message: string;
  timestamp: Date;
  metadata?: {
    healthChange?: { from: number; to: number };
    storagePercent?: number;
    country?: string;
  };
}

interface ActivityFeedProps {
  events?: ActivityEvent[];
  maxItems?: number;
  className?: string;
  onEventClick?: (event: ActivityEvent) => void;
}

// Generate simulated activity events for demo
function generateMockEvent(): ActivityEvent {
  const types: ActivityEventType[] = [
    "node_online",
    "node_offline",
    "health_improved",
    "health_degraded",
    "storage_alert",
    "new_node",
  ];

  const type = types[Math.floor(Math.random() * types.length)];
  const pubkey = `${Math.random().toString(36).substring(2, 10)}...${Math.random().toString(36).substring(2, 6)}`;

  const messages: Record<ActivityEventType, string> = {
    node_online: `Node ${pubkey} came online`,
    node_offline: `Node ${pubkey} went offline`,
    health_improved: `Node ${pubkey} health improved`,
    health_degraded: `Node ${pubkey} health degraded`,
    storage_alert: `Node ${pubkey} storage above 80%`,
    new_node: `New node ${pubkey} joined network`,
  };

  return {
    id: Math.random().toString(36).substring(2, 15),
    type,
    pubkey,
    pubkeyShort: pubkey,
    message: messages[type],
    timestamp: new Date(),
    metadata:
      type === "health_improved" || type === "health_degraded"
        ? {
            healthChange: {
              from: 70 + Math.floor(Math.random() * 20),
              to: 75 + Math.floor(Math.random() * 25),
            },
          }
        : type === "storage_alert"
        ? { storagePercent: 80 + Math.floor(Math.random() * 18) }
        : undefined,
  };
}

export function ActivityFeed({
  events: initialEvents = [],
  maxItems = 20,
  className,
  onEventClick,
}: ActivityFeedProps) {
  const [events, setEvents] = useState<ActivityEvent[]>(initialEvents);
  const [isPaused, setIsPaused] = useState(false);
  const [newEventCount, setNewEventCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isAtTopRef = useRef(true);

  // Simulate real-time events (for demo)
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const newEvent = generateMockEvent();
      setEvents((prev) => {
        const updated = [newEvent, ...prev].slice(0, maxItems);
        if (!isAtTopRef.current) {
          setNewEventCount((c) => c + 1);
        }
        return updated;
      });
    }, 3000 + Math.random() * 5000);

    return () => clearInterval(interval);
  }, [isPaused, maxItems]);

  // Handle scroll
  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      const isAtTop = containerRef.current.scrollTop < 10;
      isAtTopRef.current = isAtTop;
      if (isAtTop) {
        setNewEventCount(0);
      }
    }
  }, []);

  const scrollToTop = () => {
    containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    setNewEventCount(0);
  };

  const eventConfig: Record<
    ActivityEventType,
    { icon: typeof Server; color: string; bgColor: string }
  > = {
    node_online: {
      icon: Server,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    node_offline: {
      icon: ServerOff,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    health_improved: {
      icon: TrendingUp,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    health_degraded: {
      icon: TrendingDown,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    storage_alert: {
      icon: AlertTriangle,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    new_node: {
      icon: Activity,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full rounded-xl bg-card border border-border/50 overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">Live Activity</span>
          {!isPaused && (
            <span className="w-2 h-2 rounded-full bg-primary animate-live-dot" />
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsPaused(!isPaused)}
          className="text-xs h-7 px-2"
        >
          {isPaused ? "Resume" : "Pause"}
        </Button>
      </div>

      {/* Events list */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
      >
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
            <Clock className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">Waiting for activity...</p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {events.map((event, index) => {
              const config = eventConfig[event.type];
              const Icon = config.icon;

              return (
                <div
                  key={event.id}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 cursor-pointer",
                    "hover:bg-secondary/30 transition-colors",
                    index === 0 && "animate-feed-item"
                  )}
                  onClick={() => onEventClick?.(event)}
                >
                  <div
                    className={cn(
                      "flex-shrink-0 p-2 rounded-lg",
                      config.bgColor
                    )}
                  >
                    <Icon className={cn("w-4 h-4", config.color)} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">
                      {event.message}
                    </p>

                    {/* Metadata */}
                    {event.metadata?.healthChange && (
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>{event.metadata.healthChange.from}%</span>
                        <span className="text-muted-foreground/50">→</span>
                        <span
                          className={cn(
                            event.metadata.healthChange.to >
                              event.metadata.healthChange.from
                              ? "text-primary"
                              : "text-warning"
                          )}
                        >
                          {event.metadata.healthChange.to}%
                        </span>
                      </div>
                    )}

                    {event.metadata?.storagePercent && (
                      <div className="mt-1 text-xs text-warning">
                        {event.metadata.storagePercent}% storage used
                      </div>
                    )}

                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {formatTimestamp(event.timestamp)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New events indicator */}
      {newEventCount > 0 && (
        <button
          onClick={scrollToTop}
          className={cn(
            "absolute bottom-16 left-1/2 -translate-x-1/2",
            "flex items-center gap-2 px-3 py-1.5 rounded-full",
            "bg-primary text-primary-foreground text-xs font-medium",
            "shadow-lg animate-bounce-in",
            "hover:bg-primary/90 transition-colors"
          )}
        >
          <ChevronUp className="w-3 h-3" />
          {newEventCount} new {newEventCount === 1 ? "event" : "events"}
        </button>
      )}
    </div>
  );
}

// Compact inline activity indicator for header
export function ActivityIndicator({
  isLive,
  lastUpdate,
}: {
  isLive: boolean;
  lastUpdate?: Date;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "w-2 h-2 rounded-full",
          isLive ? "bg-primary animate-live-dot" : "bg-muted"
        )}
      />
      <span className="text-xs text-muted-foreground">
        {isLive ? "Live" : "Paused"}
      </span>
    </div>
  );
}
