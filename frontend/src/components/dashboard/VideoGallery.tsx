import { mockVideos } from '@/lib/mockData';
import { VideoCard } from './VideoCard';

export const VideoGallery = () => {
  return (
    <div className="p-6 rounded-xl bg-card border border-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Top Performing Videos</h3>
          <p className="text-sm text-muted-foreground">Most engaged content this week</p>
        </div>
        <button className="text-sm text-primary hover:text-primary/80 transition-colors">
          View All →
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockVideos.slice(0, 6).map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    </div>
  );
};