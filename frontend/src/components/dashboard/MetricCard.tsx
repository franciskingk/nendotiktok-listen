import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  change?: number;
  icon: LucideIcon;
  iconColor?: 'cyan' | 'magenta' | 'purple' | 'green' | 'amber';
}

const iconColorClasses = {
  cyan: 'text-cyan bg-cyan/10',
  magenta: 'text-magenta bg-magenta/10',
  purple: 'text-purple bg-purple/10',
  green: 'text-green bg-green/10',
  amber: 'text-amber bg-amber/10',
};

export const MetricCard = ({
  title,
  value,
  change = 0,
  icon: Icon,
  iconColor = 'cyan',
}: MetricCardProps) => {
  const isPositive = change >= 0;
  const hasChange = change !== 0;

  return (
    <div className="group relative p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-300 overflow-hidden">
      {/* Glow effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className={cn('p-3 rounded-lg', iconColorClasses[iconColor])}>
            <Icon className="w-5 h-5" />
          </div>
          {hasChange && (
            <div
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                isPositive
                  ? 'bg-green/10 text-green'
                  : 'bg-destructive/10 text-destructive'
              )}
            >
              {isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {Math.abs(change)}%
            </div>
          )}
        </div>

        <h3 className="text-sm text-muted-foreground mb-1">{title}</h3>
        <p className="text-3xl font-bold tracking-tight">{value}</p>
      </div>
    </div>
  );
};