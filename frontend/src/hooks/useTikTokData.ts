import { useState, useCallback, useRef, useMemo } from 'react';
import { TikTokVideo, Creator, SentimentData, TimeSeriesData, HashtagData } from '@/lib/mockData';
import { toast } from 'sonner';

export const useTikTokData = () => {
    const [videos, setVideos] = useState<TikTokVideo[]>([]);
    const [creators, setCreators] = useState<Creator[]>([]);
    const [sentiment, setSentiment] = useState<SentimentData>({ positive: 0, neutral: 0, negative: 0 });
    const [timeline, setTimeline] = useState<TimeSeriesData[]>([]);
    const [hashtags, setHashtags] = useState<HashtagData[]>([]);
    const [loading, setLoading] = useState(false);
    const [scrapingProgress, setScrapingProgress] = useState(0);

    const [apiConnected, setApiConnected] = useState(false);
    const [supabaseConnected, setSupabaseConnected] = useState(false);
    const [sheetUrl, setSheetUrl] = useState('');
    const [apifyToken, setApifyToken] = useState('');
    const [groups, setGroups] = useState<{ name: string, keywords: string[], exclude_keywords?: string[], exact_match?: boolean }[]>([]);
    const [activeGroupName, setActiveGroupName] = useState<string>('All Data');

    const fetchSettings = useCallback(async () => {
        try {
            // Fetch health/credentials too
            const healthRes = await fetch('/api/health');
            if (healthRes.ok) {
                const healthData = await healthRes.json();
                setSupabaseConnected(healthData.supabase_connected);
                setApiConnected(true);
            }

            const response = await fetch('/api/settings');
            if (response.ok) {
                const data = await response.json();
                setApifyToken(data.apify_token || '');
                setGroups(data.groups || []);
            }
        } catch (error) {
            console.error("Failed to fetch settings", error);
        }
    }, []);

    const updateSettings = async (url: string, token?: string) => {
        try {
            console.log("Saving settings...", { url, token });
            const response = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sheet_url: url, apify_token: token || apifyToken })
            });
            if (response.ok) {
                const data = await response.json();
                console.log("Settings saved:", data);
                setSheetUrl(url);
                if (token) setApifyToken(token);
                toast.success("Settings updated successfully");
                await fetchData();
            } else {
                const errorData = await response.json().catch(() => ({ detail: "Unknown server error" }));
                toast.error(`Failed to save: ${errorData.detail || "Server error"}`);
            }
        } catch (error) {
            console.error("Save error:", error);
            toast.error("Network error: Could not reach backend");
        }
    };

    const addGroup = async (name: string, keywords: string[], exclude_keywords: string[] = [], exact_match: boolean = false) => {
        try {
            const response = await fetch('/api/groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, keywords, exclude_keywords, exact_match })
            });
            if (response.ok) {
                const data = await response.json();
                setGroups(data.groups);
                toast.success(`Group "${name}" created!`);
            }
        } catch (error) {
            toast.error("Failed to create group");
        }
    };

    const deleteGroup = async (name: string) => {
        try {
            const response = await fetch(`/api/groups/${name}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                const data = await response.json();
                setGroups(data.groups);
                if (activeGroupName === name) setActiveGroupName('All Data');
                toast.success(`Group "${name}" removed`);
            }
        } catch (error) {
            toast.error("Failed to delete group");
        }
    };

    // Stable key for groups dependency
    const groupsKey = useMemo(() => JSON.stringify(groups), [groups]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/data');
            if (!response.ok) throw new Error("API Offline");

            setApiConnected(true);
            const data = await response.json();

            if (data.error) {
                // Only show connection error if a URL is actually configured
                if (sheetUrl) {
                    toast.error(data.error);
                }
                setSheetsConnected(false);
                setVideos([]);
                return;
            }

            setSheetsConnected(true);

            // Map API data to UI model
            let rawVideos: TikTokVideo[] = data.videos.map((v: any) => ({
                id: v.video_id,
                caption: v.caption || '',
                author: '@' + (v.author || 'unknown'),
                authorAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${v.author}`,
                views: parseInt(v.views) || 0,
                likes: parseInt(v.likes) || 0,
                comments: parseInt(v.comments) || 0,
                shares: parseInt(v.shares) || 0,
                saves: parseInt(v.saves) || 0,
                sentiment: v.sentiment || 'neutral',
                sentimentScore: v.sentiment_score || 0.5,
                createdAt: v.publish_date,
                hashtags: v.hashtags ? v.hashtags.split(',').map((h: string) => h.trim().toLowerCase()) : [],
                thumbnailUrl: v.thumbnail_url || `https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&h=400&fit=crop`
            }));

            // APPLY ADVANCED GROUP FILTERING
            let filteredVideos = rawVideos;
            if (activeGroupName !== 'All Data') {
                const activeGroup = groups.find(g => g.name === activeGroupName);
                if (activeGroup) {
                    const groupKeywords = (activeGroup.keywords || []).map(k => k.toLowerCase().trim());
                    const excludeKeywords = (activeGroup.exclude_keywords || []).map(k => k.toLowerCase().trim());
                    const exactMatch = activeGroup.exact_match || false;

                    filteredVideos = rawVideos.filter(v => {
                        const text = (v.caption + ' ' + (v.hashtags || []).join(' ')).toLowerCase();

                        // Check Exclusion (Noise reduction)
                        const isExcluded = excludeKeywords.some(k => text.includes(k));
                        if (isExcluded) return false;

                        // Check Inclusion
                        if (exactMatch) {
                            // Match whole words only
                            return groupKeywords.some(k => {
                                const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                const regex = new RegExp(`\\b${escaped}\\b`, 'i');
                                return regex.test(text);
                            });
                        } else {
                            // Broad match
                            return groupKeywords.some(k => text.includes(k));
                        }
                    });
                }
            }

            setVideos(filteredVideos);

            // Sentiment aggregation (using filtered data)
            const counts = filteredVideos.reduce((acc: any, curr: any) => {
                const s = curr.sentiment || 'neutral';
                acc[s] = (acc[s] || 0) + 1;
                return acc;
            }, { positive: 0, neutral: 0, negative: 0 });

            const total = filteredVideos.length || 1;
            setSentiment({
                positive: Math.round((counts.positive / total) * 100),
                neutral: Math.round((counts.neutral / total) * 100),
                negative: Math.round((counts.negative / total) * 100)
            });

            // Timeline aggregation (using filtered data)
            const timeData: any = {};
            filteredVideos.forEach((v: any) => {
                if (!v.createdAt) return;
                const date = v.createdAt.split(' ')[0];
                if (!timeData[date]) {
                    timeData[date] = { date, views: 0, likes: 0, comments: 0, shares: 0 };
                }
                timeData[date].views += v.views;
                timeData[date].likes += v.likes;
                timeData[date].comments += v.comments;
                timeData[date].shares += v.shares;
            });
            setTimeline(Object.values(timeData).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()) as TimeSeriesData[]);

        } catch (error) {
            console.error(error);
            setApiConnected(false);
            setSheetsConnected(false);
            // Suppress toast for initial offline state
            if (activeGroupName !== 'All Data' || groups.length > 0) {
                toast.error("Failed to connect to backend");
            }
        } finally {
            setLoading(false);
        }
    }, [activeGroupName, groupsKey, sheetUrl]);

    const runScrape = async (
        type: string,
        input: string,
        limit: number,
        token: string,
        sinceDate?: string,
        scrapeComments: boolean = false,
        commentsLimit: number = 0
    ) => {
        setLoading(true);
        setScrapingProgress(10);

        try {
            const progressInterval = setInterval(() => {
                setScrapingProgress(prev => (prev < 95 ? prev + (95 - prev) * 0.1 : prev));
            }, 1500);

            const response = await fetch('/api/scrape/async', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    scrape_type: type,
                    search_input: input,
                    video_count: limit,
                    since_date: sinceDate,
                    apify_token: token,
                    sheet_url: sheetUrl, // Pass sheet_url from current state
                    scrape_comments: scrapeComments,
                    comments_limit: commentsLimit
                })
            });

            clearInterval(progressInterval);
            setScrapingProgress(100);

            const data = await response.json();
            if (data.success) {
                toast.success(data.message || "Scrape initiated! Results will appear in a few minutes.");
                // We don't fetchData immediately as it's still running on Apify
            } else {
                toast.error(data.error || "Scraping failed");
            }
        } catch (error) {
            toast.error("Network error during scraping");
        } finally {
            setLoading(false);
            setTimeout(() => setScrapingProgress(0), 1000);
        }
    };

    const exportData = (format: 'csv' | 'excel') => {
        if (videos.length === 0) {
            toast.error("No data to export");
            return;
        }

        const headers = ['ID', 'Author', 'Caption', 'Views', 'Likes', 'Comments', 'Shares', 'Sentiment', 'Date', 'Hashtags'];
        const rows = videos.map(v => [
            v.id,
            v.author,
            `"${v.caption.replace(/"/g, '""')}"`,
            v.views,
            v.likes,
            v.comments,
            v.shares,
            v.sentiment,
            v.createdAt,
            v.hashtags.join(', ')
        ]);

        const content = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `tiktok_export_${activeGroupName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.${format === 'csv' ? 'csv' : 'xlsx'}`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Data exported as ${format.toUpperCase()}`);
    };

    return {
        videos, creators, sentiment, timeline, hashtags,
        loading, scrapingProgress, apiConnected, supabaseConnected,
        apifyToken, groups, activeGroupName, setActiveGroupName,
        fetchSettings, updateSettings, addGroup, deleteGroup,
        fetchData, runScrape, exportData
    };
};
