// Mock data for TikTok Analytics Dashboard

export interface TikTokVideo {
  id: string;
  caption: string;
  author: string;
  authorAvatar: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  sentimentScore: number;
  createdAt: string;
  hashtags: string[];
  thumbnailUrl: string;
}

export interface Creator {
  id: string;
  username: string;
  avatar: string;
  followers: number;
  totalViews: number;
  avgEngagement: number;
  videoCount: number;
}

export interface SentimentData {
  positive: number;
  neutral: number;
  negative: number;
}

export interface TimeSeriesData {
  date: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
}

export interface HashtagData {
  tag: string;
  count: number;
  trend: 'up' | 'down' | 'stable';
}

export const mockVideos: TikTokVideo[] = [
  {
    id: '1',
    caption: 'This new dance trend is absolutely insane! 🔥 #fyp #dance #viral',
    author: '@dancequeen',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dance',
    views: 2450000,
    likes: 345000,
    comments: 12500,
    shares: 45000,
    saves: 15000,
    sentiment: 'positive',
    sentimentScore: 0.85,
    createdAt: '2026-02-05',
    hashtags: ['fyp', 'dance', 'viral'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&h=400&fit=crop',
  },
  {
    id: '2',
    caption: 'Wait for it... 😂 The ending had me dying #comedy #funny',
    author: '@funnyguymike',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike',
    views: 1890000,
    likes: 287000,
    comments: 8900,
    shares: 32000,
    saves: 11000,
    sentiment: 'positive',
    sentimentScore: 0.78,
    createdAt: '2026-02-04',
    hashtags: ['comedy', 'funny'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1527224538127-2104bb71c51b?w=300&h=400&fit=crop',
  },
  {
    id: '3',
    caption: 'Cooking hack that will change your life 🍳 #cooking #lifehack #food',
    author: '@cheflife',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chef',
    views: 980000,
    likes: 125000,
    comments: 3400,
    shares: 18000,
    saves: 5200,
    sentiment: 'neutral',
    sentimentScore: 0.52,
    createdAt: '2026-02-04',
    hashtags: ['cooking', 'lifehack', 'food'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&h=400&fit=crop',
  },
  {
    id: '4',
    caption: 'This product is terrible - do NOT buy it! 😤 #honest #review',
    author: '@reviewqueen',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=review',
    views: 654000,
    likes: 89000,
    comments: 5600,
    shares: 12000,
    saves: 3400,
    sentiment: 'negative',
    sentimentScore: 0.23,
    createdAt: '2026-02-03',
    hashtags: ['honest', 'review'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1560472355-536de3962603?w=300&h=400&fit=crop',
  },
  {
    id: '5',
    caption: 'Morning routine that changed my productivity 💪 #productivity #morning',
    author: '@motivateme',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=motivate',
    views: 1250000,
    likes: 198000,
    comments: 4500,
    shares: 28000,
    saves: 9500,
    sentiment: 'positive',
    sentimentScore: 0.91,
    createdAt: '2026-02-03',
    hashtags: ['productivity', 'morning'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=300&h=400&fit=crop',
  },
  {
    id: '6',
    caption: 'POV: When your cat judges you 😹 #catsoftiktok #pets',
    author: '@catlover99',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cat',
    views: 3200000,
    likes: 520000,
    comments: 18000,
    shares: 67000,
    saves: 22000,
    sentiment: 'positive',
    sentimentScore: 0.88,
    createdAt: '2026-02-02',
    hashtags: ['catsoftiktok', 'pets'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=300&h=400&fit=crop',
  },
];

export const mockCreators: Creator[] = [
  {
    id: '1',
    username: '@dancequeen',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dance',
    followers: 2500000,
    totalViews: 45000000,
    avgEngagement: 8.5,
    videoCount: 234,
  },
  {
    id: '2',
    username: '@funnyguymike',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike',
    followers: 1800000,
    totalViews: 32000000,
    avgEngagement: 7.2,
    videoCount: 189,
  },
  {
    id: '3',
    username: '@cheflife',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chef',
    followers: 980000,
    totalViews: 18000000,
    avgEngagement: 6.8,
    videoCount: 156,
  },
  {
    id: '4',
    username: '@catlover99',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cat',
    followers: 3200000,
    totalViews: 67000000,
    avgEngagement: 9.1,
    videoCount: 312,
  },
  {
    id: '5',
    username: '@motivateme',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=motivate',
    followers: 1250000,
    totalViews: 24000000,
    avgEngagement: 7.8,
    videoCount: 178,
  },
];

export const mockSentimentData: SentimentData = {
  positive: 58,
  neutral: 27,
  negative: 15,
};

export const mockTimeSeriesData: TimeSeriesData[] = [
  { date: 'Jan 31', views: 1200000, likes: 180000, comments: 8500, shares: 22000 },
  { date: 'Feb 1', views: 1450000, likes: 210000, comments: 9200, shares: 28000 },
  { date: 'Feb 2', views: 1890000, likes: 275000, comments: 12000, shares: 35000 },
  { date: 'Feb 3', views: 1650000, likes: 245000, comments: 10500, shares: 31000 },
  { date: 'Feb 4', views: 2100000, likes: 320000, comments: 14000, shares: 42000 },
  { date: 'Feb 5', views: 2450000, likes: 380000, comments: 16500, shares: 48000 },
  { date: 'Feb 6', views: 2200000, likes: 340000, comments: 15000, shares: 44000 },
];

export const mockHashtags: HashtagData[] = [
  { tag: '#fyp', count: 2450000, trend: 'up' },
  { tag: '#viral', count: 1890000, trend: 'up' },
  { tag: '#dance', count: 1650000, trend: 'stable' },
  { tag: '#comedy', count: 1420000, trend: 'up' },
  { tag: '#catsoftiktok', count: 1180000, trend: 'up' },
  { tag: '#cooking', count: 980000, trend: 'down' },
  { tag: '#lifehack', count: 850000, trend: 'stable' },
  { tag: '#productivity', count: 720000, trend: 'up' },
  { tag: '#morning', count: 650000, trend: 'stable' },
  { tag: '#pets', count: 580000, trend: 'up' },
];

export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};