import { Crown, TrendingUp } from 'lucide-react';
import { mockCreators, formatNumber } from '@/lib/mockData';
import { cn } from '@/lib/utils';

const rankColors = [
  'from-amber to-amber/60',
  'from-muted-foreground to-muted-foreground/60',
  'from-amber/70 to-amber/40',
];

export const CreatorLeaderboard = () => {
  return (
    <div className="p-6 rounded-xl bg-card border border-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Top Creators</h3>
          <p className="text-sm text-muted-foreground">Ranked by engagement</p>
        </div>
        <button className="text-sm text-primary hover:text-primary/80 transition-colors">
          View All →
        </button>
      </div>

      <div className="space-y-3">
        {mockCreators.slice(0, 5).map((creator, index) => (
          <div
            key={creator.id}
            className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            {/* Rank */}
            <div
              className={cn(
                'flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm',
                index < 3
                  ? `bg-gradient-to-br ${rankColors[index]} text-background`
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {index === 0 ? <Crown className="w-4 h-4" /> : index + 1}
            </div>

            {/* Avatar & Info */}
            <img
              src={creator.avatar}
              alt={creator.username}
              className="w-10 h-10 rounded-full border-2 border-border"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{creator.username}</p>
              <p className="text-xs text-muted-foreground">
                {formatNumber(creator.followers)} followers
              </p>
            </div>

            {/* Stats */}
            <div className="text-right">
              <div className="flex items-center gap-1 text-green">
                <TrendingUp className="w-3 h-3" />
                <span className="text-sm font-medium">{creator.avgEngagement}%</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {formatNumber(creator.totalViews)} views
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};