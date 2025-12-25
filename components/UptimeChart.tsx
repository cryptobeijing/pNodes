"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface UptimeChartProps {
  data: { time: string; uptime: number }[];
  isLoading?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-sm">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className="text-sm font-semibold text-foreground">
          {payload[0].value.toFixed(2)}% uptime
        </p>
      </div>
    );
  }
  return null;
};

export const UptimeChart = ({ data, isLoading }: UptimeChartProps) => {
  if (isLoading || !data || data.length === 0) {
    return (
      <div className="p-6 rounded-xl bg-card border border-border">
        <div className="h-5 w-36 mb-2 rounded shimmer" />
        <div className="h-4 w-24 mb-8 rounded shimmer" />
        <div className="h-[220px] rounded-xl shimmer" />
      </div>
    );
  }

  return (
    <div className="p-6 rounded-xl bg-card border border-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground tracking-tight">Uptime Trend</h3>
          <p className="text-sm text-muted-foreground mt-1">Last 24 hours</p>
        </div>
        <div className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-lg">
          <span className="w-3 h-0.5 bg-primary rounded-full" />
          <span className="text-xs font-medium text-muted-foreground">Network Uptime</span>
        </div>
      </div>

      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="uptimeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(38, 65%, 56%)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="hsl(38, 65%, 56%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              tickMargin={12}
              interval={4}
            />
            <YAxis
              domain={['auto', 'auto']}
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              tickFormatter={(value) => `${Math.round(value)}%`}
              width={48}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="uptime"
              stroke="hsl(38, 65%, 56%)"
              strokeWidth={2}
              fill="url(#uptimeGradient)"
              fillOpacity={1}
              animationDuration={800}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
