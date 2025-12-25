"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Server,
  BarChart3,
  LucideIcon,
} from "lucide-react";

export type TabId = "overview" | "nodes" | "analytics";

interface Tab {
  id: TabId;
  label: string;
  icon: LucideIcon;
  description: string;
}

const tabs: Tab[] = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutDashboard,
    description: "Network summary and live activity",
  },
  {
    id: "nodes",
    label: "pNodes",
    icon: Server,
    description: "Browse and inspect pNodes",
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    description: "Health metrics and trends",
  },
];

interface NavigationTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  className?: string;
}

export function NavigationTabs({
  activeTab,
  onTabChange,
  className,
}: NavigationTabsProps) {
  const [hoveredTab, setHoveredTab] = useState<TabId | null>(null);

  return (
    <div className={cn("w-full", className)}>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-secondary/50 backdrop-blur-sm border border-border/50">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isHovered = hoveredTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              onMouseEnter={() => setHoveredTab(tab.id)}
              onMouseLeave={() => setHoveredTab(null)}
              className={cn(
                "relative flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-300",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                isActive
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {/* Active background with glow */}
              {isActive && (
                <span className="absolute inset-0 rounded-lg bg-primary animate-fade-in">
                  <span className="absolute inset-0 rounded-lg bg-primary/50 blur-md" />
                </span>
              )}

              {/* Hover background */}
              {!isActive && isHovered && (
                <span className="absolute inset-0 rounded-lg bg-muted/50 animate-fade-in" />
              )}

              <Icon
                className={cn(
                  "relative z-10 w-4 h-4 transition-transform duration-300",
                  isActive && "animate-bounce-in",
                  isHovered && !isActive && "scale-110"
                )}
              />
              <span className="relative z-10">{tab.label}</span>

              {/* Active indicator dot */}
              {isActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary-foreground animate-bounce-in" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden flex items-center gap-1 p-1 rounded-xl bg-secondary/50 backdrop-blur-sm border border-border/50 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "relative flex flex-col items-center gap-1 px-4 py-2 rounded-lg min-w-[72px] transition-all duration-300",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "animate-bounce-in")} />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

// Tab content wrapper with animations
interface TabContentProps {
  activeTab: TabId;
  tab: TabId;
  children: React.ReactNode;
}

export function TabContent({ activeTab, tab, children }: TabContentProps) {
  if (activeTab !== tab) return null;

  return (
    <div className="animate-fade-up" style={{ animationDuration: "0.3s" }}>
      {children}
    </div>
  );
}
