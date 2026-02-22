import { useEffect, useState } from 'react';
import { Eye, EyeOff, Heart, MessageCircle, Share2, TrendingUp, Users, Loader2, Download, Info, Settings2, Calendar, ListFilter, Search, Trash2 } from 'lucide-react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { SentimentChart } from '@/components/dashboard/SentimentChart';
import { EngagementChart } from '@/components/dashboard/EngagementChart';
import { VideoCard } from '@/components/dashboard/VideoCard';
import { VideoTable } from '@/components/dashboard/VideoTable';
import { useTikTokData } from '@/hooks/useTikTokData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

const Index = () => {
  const {
    videos, sentiment, timeline, loading, scrapingProgress,
    apiConnected, sheetsConnected, supabaseConnected, sheetUrl, apifyToken: savedToken, groups, activeGroupName,
    setActiveGroupName, fetchSettings, updateSettings, addGroup, deleteGroup,
    fetchData, runScrape, exportData, credentialsFound
  } = useTikTokData();

  // Navigation & Filter State
  const [currentView, setCurrentView] = useState('Dashboard');
  const [selectedSentiment, setSelectedSentiment] = useState<'positive' | 'neutral' | 'negative' | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Scraper State
  const [searchInput, setSearchInput] = useState('');
  const [apifyToken, setApifyToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [videoLimit, setVideoLimit] = useState(20);
  const [sinceDate, setSinceDate] = useState('');
  const [scrapeComments, setScrapeComments] = useState(false);
  const [commentsLimit, setCommentsLimit] = useState(10);
  const [scrapeType, setScrapeType] = useState('Keyword');

  // Settings State
  const [tempSheetUrl, setTempSheetUrl] = useState('');
  const [tempApifyToken, setTempApifyToken] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupKeywords, setNewGroupKeywords] = useState('');
  const [newGroupExcludeKeywords, setNewGroupExcludeKeywords] = useState('');
  const [newGroupExactMatch, setNewGroupExactMatch] = useState(false);

  // Load Settings on Mount
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Load Data on Mount (and when specifically triggered by fetchData changes)
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Sync temp states when saved settings change
  useEffect(() => {
    if (sheetUrl) setTempSheetUrl(sheetUrl);
    if (savedToken) {
      setTempApifyToken(savedToken);
      // Initialize scraper state only once or when saved token is updated from server
      setApifyToken(prev => prev || savedToken);
    }
  }, [sheetUrl, savedToken]); // Removed apifyToken from dependency to stop typing-sync loop

  const handleScrape = async () => {
    if (!searchInput) {
      toast.error("Please enter a search value");
      return;
    }
    if (!apifyToken) {
      toast.error("Apify Token is required for scraping");
      return;
    }
    await runScrape(scrapeType, searchInput, videoLimit, apifyToken, sinceDate, scrapeComments, commentsLimit);
  };

  const handleUpdateSettings = async () => {
    await updateSettings(tempSheetUrl, tempApifyToken);
  };

  const handleAddGroup = async () => {
    if (!newGroupName || !newGroupKeywords) {
      toast.error("Group name and keywords are required");
      return;
    }
    const kwList = newGroupKeywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
    const exList = newGroupExcludeKeywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
    await addGroup(newGroupName, kwList, exList, newGroupExactMatch);
    setNewGroupName('');
    setNewGroupKeywords('');
    setNewGroupExcludeKeywords('');
    setNewGroupExactMatch(false);
  };

  const totalViews = videos.reduce((acc, v) => acc + (v.views || 0), 0);
  const totalLikes = videos.reduce((acc, v) => acc + (v.likes || 0), 0);
  const totalComments = videos.reduce((acc, v) => acc + (v.comments || 0), 0);
  const totalShares = videos.reduce((acc, v) => acc + (v.shares || 0), 0);
  const totalSaves = videos.reduce((acc, v) => acc + (v.saves || 0), 0);
  const avgEngagement = videos.length > 0 ? (videos.reduce((acc, v) => acc + (v.sentimentScore || 0), 0) / videos.length) * 100 : 0;

  // Derive filtered list
  const filteredVideos = videos.filter(v => {
    if (selectedSentiment && v.sentiment !== selectedSentiment) return false;
    if (selectedDate && v.createdAt !== selectedDate) return false;
    return true;
  });

  const clearFilters = () => {
    setSelectedSentiment(null);
    setSelectedDate(null);
  };

  const renderDashboard = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Area */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            <span className="gradient-text-primary">{activeGroupName}</span>{' '}
            <span className="text-foreground">Analytics Platform</span>
          </h1>
          <p className="text-muted-foreground text-sm">
            Everything in one place: extraction, filtering, and live insights.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={fetchData} disabled={loading} className="gap-2 shadow-sm border border-primary/10">
            <ListFilter className="w-4 h-4" /> Load from Sheets
          </Button>
          <Button variant="outline" onClick={() => exportData('csv')} disabled={videos.length === 0} className="gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* INTEGRATED SCRAPER PANEL */}
      <Card className="border-primary/20 bg-primary/5 shadow-inner">
        <CardHeader className="py-2 px-4 flex flex-row items-center justify-between border-b border-primary/10">
          <CardTitle className="text-xs flex items-center gap-2 font-bold text-primary">
            <Search className="w-4 h-4" /> TikTok Extraction Tool
          </CardTitle>
          <div className="flex items-center gap-3 text-[10px]">
            <span className={cn("px-2 py-0.5 rounded-full border", apiConnected ? "bg-green/10 text-green border-green/20" : "bg-destructive/10 text-destructive border-destructive/20")}>
              API: {apiConnected ? "CONNECTED" : "OFFLINE"}
            </span>
            <span className={cn("px-2 py-0.5 rounded-full border", supabaseConnected ? "bg-blue/10 text-blue border-blue/20" : "bg-muted/30 text-muted-foreground border-transparent")}>
              SUPABASE: {supabaseConnected ? "ACTIVE" : "OFFLINE"}
            </span>
            <span className={cn("px-2 py-0.5 rounded-full border", sheetsConnected ? "bg-green/10 text-green border-green/20" : "bg-orange/10 text-orange border-orange/20")}>
              SHEETS: {sheetsConnected ? "CONNECTED" : "STANDBY"}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase opacity-70">Search Method & Input</Label>
            <div className="flex rounded-md border border-input overflow-hidden text-[10px] h-7">
              <button onClick={() => setScrapeType('Keyword')} className={cn("flex-1 transition-colors", scrapeType === 'Keyword' ? "bg-primary text-white" : "hover:bg-muted")}>Keyword</button>
              <button onClick={() => setScrapeType('Hashtag')} className={cn("flex-1 transition-colors", scrapeType === 'Hashtag' ? "bg-primary text-white" : "hover:bg-muted")}>Hashtag</button>
              <button onClick={() => setScrapeType('Username')} className={cn("flex-1 transition-colors", scrapeType === 'Username' ? "bg-primary text-white" : "hover:bg-muted")}>Profile</button>
            </div>
            <Input
              className="h-8 text-xs bg-background"
              placeholder={scrapeType === 'Keyword' ? "e.g. fashion trends" : scrapeType === 'Hashtag' ? "e.g. food" : "username"}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase opacity-70">Limits</Label>
            <div className="flex gap-2">
              <Input type="number" className="h-8 text-xs w-20 bg-background" value={videoLimit} onChange={(e) => setVideoLimit(parseInt(e.target.value))} />
              <Input type="date" className="h-8 text-xs flex-1 bg-background" value={sinceDate} title="Scrape since date" onChange={(e) => setSinceDate(e.target.value)} />
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] font-bold opacity-70 uppercase">Get Comments</span>
              <Switch checked={scrapeComments} onCheckedChange={setScrapeComments} className="scale-75" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase opacity-70">Apify API Token</Label>
            <div className="relative">
              <Input
                type={showToken ? "text" : "password"}
                className="h-8 text-xs pr-8 bg-background"
                placeholder="Token..."
                value={apifyToken}
                onChange={(e) => setApifyToken(e.target.value)}
              />
              <button onClick={() => setShowToken(!showToken)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showToken ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </button>
            </div>
            {scrapeComments && (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] font-bold opacity-70 uppercase">Cmt/Vid:</span>
                <Input type="number" className="h-6 text-[10px] w-14 bg-background" value={commentsLimit} onChange={(e) => setCommentsLimit(parseInt(e.target.value))} />
              </div>
            )}
          </div>

          <div className="flex items-end">
            <Button onClick={handleScrape} disabled={loading} className="w-full h-8 font-bold text-xs glow-cyan uppercase tracking-wider">
              {loading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : "Run Extraction"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Selection & Quick Stats Area */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex gap-2">
            {['All Data', ...groups.map(g => g.name)].map(name => (
              <button
                key={name}
                onClick={() => setActiveGroupName(name)}
                className={cn(
                  "px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-md transition-all border",
                  activeGroupName === name ? "bg-primary text-white border-primary shadow-sm" : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
                )}
              >
                {name}
              </button>
            ))}
          </div>
          <div className="text-[10px] font-bold opacity-50 uppercase bg-muted/30 px-2 py-1 rounded">
            Total Records: {videos.length}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard title="Total Views" value={totalViews > 1000000 ? (totalViews / 1000000).toFixed(1) + 'M' : totalViews.toLocaleString()} icon={Eye} iconColor="cyan" />
          <MetricCard title="Total Likes" value={totalLikes > 1000000 ? (totalLikes / 1000000).toFixed(1) + 'M' : totalLikes.toLocaleString()} icon={Heart} iconColor="magenta" />
          <MetricCard title="Total Shares" value={totalShares.toLocaleString()} icon={Share2} iconColor="green" />
          <MetricCard title="Total Saves" value={totalSaves.toLocaleString()} icon={TrendingUp} iconColor="purple" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card className="bg-card border-border/50 shadow-sm p-4 flex flex-col justify-center items-center">
            <span className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Avg Engagement</span>
            <span className="text-xl font-black text-primary">{avgEngagement.toFixed(2)}%</span>
          </Card>
          <Card className="bg-card border-border/50 shadow-sm p-4 flex flex-col justify-center items-center">
            <span className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Total Comments</span>
            <span className="text-xl font-black text-magenta">{totalComments.toLocaleString()}</span>
          </Card>
          <Card className="bg-card border-border/50 shadow-sm p-4 flex flex-col justify-center items-center md:col-span-1 col-span-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Unique Videos</span>
            <span className="text-xl font-black text-cyan">{videos.length}</span>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <EngagementChart data={timeline} onPointClick={setSelectedDate} />
        </div>
        <div>
          <SentimentChart data={sentiment} onSegmentClick={setSelectedSentiment} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* HASHTAG CLOUD */}
        <Card className="border-border bg-card/50">
          <CardHeader className="py-4 border-b">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Trending Hashtags
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-2">
              {videos.flatMap(v => v.hashtags || []).length > 0 ? (
                Array.from(new Set(videos.flatMap(v => v.hashtags || [])))
                  .sort((a, b) => {
                    const countA = videos.filter(v => v.hashtags?.includes(a)).length;
                    const countB = videos.filter(v => v.hashtags?.includes(b)).length;
                    return countB - countA;
                  })
                  .slice(0, 15)
                  .map((tag, idx) => (
                    <span key={tag} className={cn(
                      "px-2 py-0.5 rounded-md text-[10px] border",
                      idx < 3 ? "bg-primary/20 text-primary font-bold border-primary/30" : "bg-muted text-muted-foreground border-transparent"
                    )}>
                      #{tag}
                    </span>
                  ))
              ) : (
                <p className="text-xs text-muted-foreground italic text-center py-4 w-full">No hashtag data.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* TOP AUTHORS */}
        <Card className="border-border bg-card/50">
          <CardHeader className="py-4 border-b">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-magenta" /> Top Contributors
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {videos.length > 0 ? (
              Array.from(new Set(videos.map(v => v.author)))
                .map(author => {
                  const authorVids = videos.filter(v => v.author === author);
                  const views = authorVids.reduce((sum, v) => sum + v.views, 0);
                  const count = authorVids.length;
                  const thumb = authorVids[0].authorAvatar;
                  return { author, views, count, thumb };
                })
                .sort((a, b) => b.views - a.views)
                .slice(0, 4)
                .map((leader, idx) => (
                  <div key={leader.author} className="flex items-center justify-between border-b border-border last:border-0 pb-2 last:pb-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-muted-foreground w-4">#{idx + 1}</span>
                      <img src={leader.thumb} className="w-6 h-6 rounded-full border border-primary/20" alt="" />
                      <span className="text-xs font-bold">{leader.author}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{(leader.views / 1000).toFixed(1)}K views</span>
                  </div>
                ))
            ) : (
              <p className="text-xs text-muted-foreground italic text-center py-4 w-full">No contributor data.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="p-6 rounded-xl bg-card border border-border">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">Content Feed ({activeGroupName})</h3>
            {(selectedSentiment || selectedDate) && (
              <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-2 py-1 rounded text-[10px] animate-in zoom-in-95">
                <span className="font-bold text-primary uppercase">
                  Filter Active: {selectedSentiment} {selectedDate && `| ${selectedDate}`}
                </span>
                <button onClick={clearFilters} className="text-primary hover:text-white hover:bg-primary rounded p-0.5 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{filteredVideos.length} items found</p>
        </div>

        <div className="space-y-8">
          {/* Detailed Table View (The List you asked for) */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Detailed Content Log</h4>
            <VideoTable videos={filteredVideos} />
          </div>

          {/* Visual Gallery View */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Visual Gallery</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVideos.length > 0 ? (
                filteredVideos.map((video) => <VideoCard key={video.id} video={video} />)
              ) : (
                <div className="col-span-full py-10 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
                  No data matches the selected chart filters.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );



  const renderSettings = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-left-4 duration-500">
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Settings2 className="w-6 h-6 text-primary" />
            Platform Settings
          </h2>
          <p className="text-muted-foreground">Configure your data storage and API connections</p>
        </div>

        {!credentialsFound && (
          <Card className="border-destructive bg-destructive/10">
            <CardHeader className="py-3">
              <CardTitle className="text-sm text-destructive flex items-center gap-2">
                <Info className="w-4 h-4" /> Google Sheets Setup Required
              </CardTitle>
            </CardHeader>
            <CardContent className="text-[10px] space-y-2">
              <p>Your <strong>credentials.json</strong> file is missing from the server root.</p>
              <p>1. Create a service account in Google Cloud Console.</p>
              <p>2. Download the JSON key and rename it to <strong>credentials.json</strong>.</p>
              <p>3. Place it in the <strong>Tiktok Bot</strong> folder.</p>
            </CardContent>
          </Card>
        )}

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Google Sheets Connection</CardTitle>
            <CardDescription>Paste your Google Sheet URL to persist the connection.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Sheet URL</Label>
              <Input
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={tempSheetUrl}
                onChange={(e) => setTempSheetUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Apify API Token</Label>
              <div className="relative">
                <Input
                  type={showToken ? "text" : "password"}
                  placeholder="Paste your token here"
                  value={tempApifyToken}
                  onChange={(e) => setTempApifyToken(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button onClick={handleUpdateSettings} className="w-full" disabled={loading}>
              Save Connection
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border bg-muted/20 text-[10px] p-4 text-muted-foreground">
          <strong>Service Account Setup:</strong> Ensure you have shared the sheet with your Service Account email (Editor role).
        </Card>
      </div>

      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Keyword Groups
          </h2>
          <p className="text-muted-foreground">Create virtual dashboards by grouping target keywords</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Create New Group</CardTitle>
            <CardDescription className="text-[10px]">Filter your feed using target and exclusion keywords.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Group Name</Label>
              <Input
                placeholder="e.g. Technology Trends"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Keywords to INCLUDE (Comma separated)</Label>
              <Input
                placeholder="e.g. ai, robot, software"
                value={newGroupKeywords}
                onChange={(e) => setNewGroupKeywords(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-destructive">Keywords to EXCLUDE (Noise reduction)</Label>
              <Input
                placeholder="e.g. food, ads, tutorial"
                value={newGroupExcludeKeywords}
                onChange={(e) => setNewGroupExcludeKeywords(e.target.value)}
              />
              <p className="text-[9px] text-muted-foreground italic">Videos containing any of these words will be hidden.</p>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border">
              <div>
                <Label className="text-xs">Exact Word Match Only</Label>
                <p className="text-[9px] text-muted-foreground">Avoid matching partial words (e.g. "car" won't match "carpet")</p>
              </div>
              <Switch checked={newGroupExactMatch} onCheckedChange={setNewGroupExactMatch} />
            </div>
            <Button onClick={handleAddGroup} className="w-full" variant="secondary">
              Add Keyword Group
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Existing Groups</h4>
          <div className="grid gap-2">
            {groups.map(group => (
              <div key={group.name} className="flex flex-col p-3 rounded-lg bg-card border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm">{group.name}</div>
                  <Button variant="ghost" size="icon" onClick={() => deleteGroup(group.name)} className="h-8 w-8 text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[9px]">
                  <div>
                    <span className="text-muted-foreground uppercase">Includes:</span>
                    <div className="truncate text-foreground font-medium">{group.keywords.join(', ')}</div>
                  </div>
                  {group.exclude_keywords && group.exclude_keywords.length > 0 && (
                    <div>
                      <span className="text-destructive uppercase">Excludes:</span>
                      <div className="truncate text-destructive font-medium">{group.exclude_keywords.join(', ')}</div>
                    </div>
                  )}
                </div>
                {group.exact_match && (
                  <div className="text-[8px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-full w-fit font-bold uppercase">
                    STRICT MODE
                  </div>
                )}
              </div>
            ))}
            {groups.length === 0 && (
              <div className="text-center py-8 text-xs text-muted-foreground border-2 border-dashed rounded-lg">
                No groups defined.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar currentView={currentView} onNavigate={setCurrentView} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header apiConnected={apiConnected} sheetsConnected={sheetsConnected} />

        <main className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Progress Bar for Scraping */}
          {scrapingProgress > 0 && (
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 animate-in fade-in slide-in-from-top-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-sm font-medium">Synchronizing with TikTok & Google Sheets...</span>
                </div>
                <span className="text-sm text-muted-foreground">{Math.round(scrapingProgress)}%</span>
              </div>
              <Progress value={scrapingProgress} className="h-2" />
            </div>
          )}

          {currentView === 'Dashboard' ? renderDashboard() : renderSettings()}

        </main>
      </div>
    </div>
  );
};

export default Index;