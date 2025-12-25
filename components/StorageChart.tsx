"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface StorageChartProps {
  data: { range: string; count: number }[];
  isLoading?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-sm">
        <p className="text-xs text-muted-foreground mb-1">{label} utilization</p>
        <p className="text-sm font-semibold text-foreground">
          {payload[0].value} nodes
        </p>
      </div>
    );
  }
  return null;
};

const getBarColor = (range: string) => {
  if (range.includes('80-100')) return 'hsl(0, 70%, 55%)';      // Destructive red
  if (range.includes('60-80')) return 'hsl(45, 90%, 55%)';      // Warning yellow
  return 'hsl(38, 65%, 56%)';                                   // Primary gold
};

export const StorageChart = ({ data, isLoading }: StorageChartProps) => {
  if (isLoading || !data || data.length === 0) {
    return (
      <div className="p-6 rounded-xl bg-card border border-border">
        <div className="h-5 w-44 mb-2 rounded shimmer" />
        <div className="h-4 w-32 mb-8 rounded shimmer" />
        <div className="h-[220px] rounded-xl shimmer" />
      </div>
    );
  }

  return (
    <div className="p-6 rounded-xl bg-card border border-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground tracking-tight">Storage Utilization</h3>
          <p className="text-sm text-muted-foreground mt-1">Distribution by usage</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(38, 65%, 56%)' }} />
            <span className="text-xs font-medium text-muted-foreground">Normal</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(45, 90%, 55%)' }} />
            <span className="text-xs font-medium text-muted-foreground">High</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(0, 70%, 55%)' }} />
            <span className="text-xs font-medium text-muted-foreground">Critical</span>
          </div>
        </div>
      </div>

      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
          >
            <XAxis
              dataKey="range"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              tickMargin={12}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              width={35}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
            <Bar
              dataKey="count"
              radius={[4, 4, 0, 0]}
              animationDuration={800}
              animationEasing="ease-out"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getBarColor(entry.range)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
