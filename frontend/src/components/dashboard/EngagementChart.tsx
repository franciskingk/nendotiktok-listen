import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TimeSeriesData, formatNumber } from '@/lib/mockData';

interface EngagementChartProps {
  data: TimeSeriesData[];
  onPointClick?: (date: string) => void;
}

export const EngagementChart = ({ data, onPointClick }: EngagementChartProps) => {
  const handleClick = (data: any) => {
    if (onPointClick && data && data.activeLabel) {
      onPointClick(data.activeLabel);
    }
  };

  return (
    <div className="p-6 rounded-xl bg-card border border-border">
      {/* ... header remains same ... */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Engagement Timeline</h3>
          <p className="text-sm text-muted-foreground">Views and interactions over time</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-cyan" />
            <span className="text-xs text-muted-foreground">Views</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-magenta" />
            <span className="text-xs text-muted-foreground">Likes</span>
          </div>
        </div>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} onClick={handleClick} style={{ cursor: onPointClick ? 'pointer' : 'default' }}>
            <defs>
              <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(174, 72%, 45%)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="hsl(174, 72%, 45%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorLikes" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(325, 78%, 55%)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="hsl(325, 78%, 55%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              tickFormatter={(value) => formatNumber(value)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--popover-foreground))',
              }}
              formatter={(value: number) => [formatNumber(value), '']}
            />
            <Area
              type="monotone"
              dataKey="views"
              stroke="hsl(174, 72%, 45%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorViews)"
            />
            <Area
              type="monotone"
              dataKey="likes"
              stroke="hsl(325, 78%, 55%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorLikes)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};