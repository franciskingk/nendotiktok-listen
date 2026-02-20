import { TrendingUp, TrendingDown, Minus, Hash } from 'lucide-react';
import { mockHashtags, formatNumber } from '@/lib/mockData';
import { cn } from '@/lib/utils';

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Minus,
};

const trendColors = {
  up: 'text-green',
  down: 'text-destructive',
  stable: 'text-muted-foreground',
};

export const TrendingHashtags = () => {
  return (
    <div className="p-6 rounded-xl bg-card border border-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Trending Hashtags</h3>
          <p className="text-sm text-muted-foreground">Most used tags this week</p>
        </div>
      </div>

      <div className="space-y-2">
        {mockHashtags.map((hashtag, index) => {
          const TrendIcon = trendIcons[hashtag.trend];
          const maxCount = mockHashtags[0].count;
          const percentage = (hashtag.count / maxCount) * 100;

          return (
            <div key={hashtag.tag} className="group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-cyan" />
                  <span className="text-sm font-medium">{hashtag.tag.slice(1)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {formatNumber(hashtag.count)}
                  </span>
                  <TrendIcon
                    className={cn('w-4 h-4', trendColors[hashtag.trend])}
                  />
                </div>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan to-primary rounded-full transition-all duration-500 group-hover:opacity-80"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};