import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { SentimentData } from '@/lib/mockData';

interface SentimentChartProps {
  data: SentimentData;
  onSegmentClick?: (sentiment: 'positive' | 'neutral' | 'negative' | null) => void;
}

export const SentimentChart = ({ data: inputData, onSegmentClick }: SentimentChartProps) => {
  const chartData = [
    { name: 'Positive', value: inputData.positive, color: 'hsl(142, 76%, 36%)', key: 'positive' },
    { name: 'Neutral', value: inputData.neutral, color: 'hsl(217, 91%, 50%)', key: 'neutral' },
    { name: 'Negative', value: inputData.negative, color: 'hsl(0, 84%, 60%)', key: 'negative' },
  ];

  const handleClick = (data: any) => {
    if (onSegmentClick && data && data.name) {
      onSegmentClick(data.name.toLowerCase() as any);
    }
  };

  return (
    <div className="p-6 rounded-xl bg-card border border-border">
      <h3 className="text-lg font-semibold mb-4">Sentiment Analysis</h3>
      <p className="text-sm text-muted-foreground mb-6">Overall content sentiment distribution</p>

      <div className="flex items-center gap-8">
        <div className="w-48 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
                onClick={handleClick}
                style={{ cursor: 'pointer' }}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--popover-foreground))',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-4">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-muted-foreground">{item.name}</span>
              </div>
              <span className="text-lg font-semibold">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};