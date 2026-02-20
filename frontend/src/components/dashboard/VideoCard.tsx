import { Eye, Heart, MessageCircle, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TikTokVideo, formatNumber } from '@/lib/mockData';
import { Badge } from '@/components/ui/badge';

interface VideoCardProps {
  video: TikTokVideo;
}

const sentimentColors = {
  positive: 'bg-green/20 text-green border-green/30',
  neutral: 'bg-blue/20 text-blue border-blue/30',
  negative: 'bg-destructive/20 text-destructive border-destructive/30',
};

export const VideoCard = ({ video }: VideoCardProps) => {
  return (
    <div className="group relative rounded-xl overflow-hidden bg-card border border-border hover:border-primary/50 transition-all duration-300">
      {/* Thumbnail */}
      <div className="relative aspect-[3/4] overflow-hidden">
        <img
          src={video.thumbnailUrl}
          alt={video.caption}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

        {/* Sentiment Badge */}
        <Badge
          variant="outline"
          className={cn(
            'absolute top-3 right-3 capitalize',
            sentimentColors[video.sentiment]
          )}
        >
          {video.sentiment}
        </Badge>

        {/* Stats Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="grid grid-cols-4 gap-2">
            <div className="flex flex-col items-center text-center">
              <Eye className="w-4 h-4 text-cyan mb-1" />
              <span className="text-xs font-medium">{formatNumber(video.views)}</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <Heart className="w-4 h-4 text-magenta mb-1" />
              <span className="text-xs font-medium">{formatNumber(video.likes)}</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <MessageCircle className="w-4 h-4 text-blue mb-1" />
              <span className="text-xs font-medium">{formatNumber(video.comments)}</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <Share2 className="w-4 h-4 text-purple mb-1" />
              <span className="text-xs font-medium">{formatNumber(video.shares)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <img
            src={video.authorAvatar}
            alt={video.author}
            className="w-6 h-6 rounded-full"
          />
          <span className="text-sm text-primary font-medium">{video.author}</span>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">{video.caption}</p>
        <div className="flex flex-wrap gap-1 mt-2">
          {(video.hashtags || []).slice(0, 3).map((tag) => (
            <span key={tag} className="text-xs text-cyan">
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};