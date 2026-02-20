import { TikTokVideo, formatNumber } from '@/lib/mockData';
import { ExternalLink, Heart, MessageCircle, Eye, Share2 } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface VideoTableProps {
    videos: TikTokVideo[];
}

const sentimentColors = {
    positive: 'bg-green/20 text-green border-green/30',
    neutral: 'bg-blue/20 text-blue border-blue/30',
    negative: 'bg-destructive/20 text-destructive border-destructive/30',
};

export const VideoTable = ({ videos }: VideoTableProps) => {
    return (
        <div className="rounded-md border border-border bg-card overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/50">
                        <TableHead className="w-[100px]">Video</TableHead>
                        <TableHead>Caption & Creator</TableHead>
                        <TableHead>Stats</TableHead>
                        <TableHead>Sentiment</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {videos.map((video) => (
                        <TableRow key={video.id} className="hover:bg-muted/30 transition-colors">
                            <TableCell>
                                <div className="relative w-16 h-20 rounded overflow-hidden border border-border">
                                    <img
                                        src={video.thumbnailUrl}
                                        alt=""
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium line-clamp-1">{video.caption}</p>
                                    <div className="flex items-center gap-2">
                                        <img
                                            src={video.authorAvatar}
                                            alt=""
                                            className="w-4 h-4 rounded-full"
                                        />
                                        <span className="text-xs text-primary font-bold">{video.author}</span>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                            <Eye className="w-3 h-3 text-cyan" /> {formatNumber(video.views)}
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                            <Heart className="w-3 h-3 text-magenta" /> {formatNumber(video.likes)}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                            <MessageCircle className="w-3 h-3 text-blue" /> {formatNumber(video.comments)}
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                            <Share2 className="w-3 h-3 text-green" /> {formatNumber(video.shares)}
                                        </div>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge
                                    variant="outline"
                                    className={`${sentimentColors[video.sentiment]} capitalize text-[10px] font-bold`}
                                >
                                    {video.sentiment}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <span className="text-xs text-muted-foreground">
                                    {new Date(video.createdAt).toLocaleDateString()}
                                </span>
                            </TableCell>
                            <TableCell className="text-right">
                                <a
                                    href={`https://www.tiktok.com/${video.author}/video/${video.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-bold"
                                >
                                    Open <ExternalLink className="w-3 h-3" />
                                </a>
                            </TableCell>
                        </TableRow>
                    ))}
                    {videos.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground italic">
                                No videos match the current filters.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};
