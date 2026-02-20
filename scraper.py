"""
TikTok scraper module using Apify Actor (clockworks/tiktok-scraper)
"""
from apify_client import ApifyClient
import asyncio
from datetime import datetime
import os
import re


class TikTokScraper:
    def __init__(self, api_token=None):
        """
        Initialize Apify scraper
        
        Args:
            api_token: Apify API token. If None, looks for APIFY_API_TOKEN env var.
        """
        self.token = api_token or os.getenv('APIFY_API_TOKEN')
        if not self.token:
            print("[WARN] No Apify API token provided. Scraper will fail unless token is passed.")
            self.client = None
        else:
            self.client = ApifyClient(self.token)
        
        # Using clockworks/tiktok-scraper as it is reliable
        self.actor_id = "clockworks/tiktok-scraper"

    async def initialize(self):
        """Check connection - lightweight for Apify"""
        if not self.client and self.token:
            self.client = ApifyClient(self.token)
        return True if self.client else False
    
    def extract_hashtags(self, caption):
        """Helper to extract hashtags from caption"""
        if not caption: return ""
        return ', '.join(re.findall(r'#(\w+)', caption))

    def extract_mentions(self, caption):
        """Helper to extract mentions from caption"""
        if not caption: return ""
        return ', '.join(re.findall(r'@(\w+)', caption))

    def _map_result(self, item, extract_comments=False):
        """Map Apify result to our app's data structure"""
        try:
            # Video Date
            video_date = datetime.now()
            if 'createTime' in item:
                try: video_date = datetime.fromtimestamp(item['createTime'])
                except: pass
            elif 'createTimeISO' in item:
                try: video_date = datetime.fromisoformat(item['createTimeISO'].replace('Z', '+00:00'))
                except: pass

            video_data = {
                'video_id': item.get('id', item.get('videoMeta', {}).get('id', '')),
                'video_url': item.get('webVideoUrl', ''),
                'caption': item.get('text', ''),
                'author': item.get('authorMeta', {}).get('name', ''),
                'likes': item.get('diggCount', 0),
                'comments': item.get('commentCount', 0),
                'shares': item.get('shareCount', 0),
                'saves': item.get('collectCount', 0),
                'views': item.get('playCount', 0),
                'publish_date': video_date.strftime('%Y-%m-%d %H:%M:%S'),
                'hashtags': ', '.join([t.get('name', '') for t in item.get('hashtags', [])]) or self.extract_hashtags(item.get('text', '')),
                'mentions': self.extract_mentions(item.get('text', '')),
                'thumbnail_url': item.get('coverUrl', item.get('videoMeta', {}).get('coverUrl', ''))
            }

            if extract_comments:
                comments_list = []
                # clockworks/tiktok-scraper usually returns comments in 'comments' list if requested
                raw_comments = item.get('comments', [])
                for c in raw_comments:
                    try:
                        c_date = datetime.now()
                        if 'createTime' in c:
                             try: c_date = datetime.fromtimestamp(c['createTime'])
                             except: pass
                        
                        comments_list.append({
                            'comment_id': c.get('id', ''),
                            'video_id': video_data['video_id'],
                            'text': c.get('text', ''),
                            'author': c.get('authorUniqueId', ''),
                            'date': c_date.strftime('%Y-%m-%d %H:%M:%S'),
                            'likes': c.get('diggCount', 0)
                        })
                    except: continue
                video_data['scraped_comments'] = comments_list

            return video_data
        except Exception as e:
            print(f"Error mapping item: {e}")
            return None

    async def _run_actor(self, run_input, limit=None, since_date=None, comments_per_video=0):
        """Generic actor runner with limits"""
        if not self.client:
            print("[ERROR] Apify Client not initialized. Missing API Token.")
            return []
        
        print(f"[INFO] Starting Apify Actor: {self.actor_id} with input: {run_input}")
        
        results = []
        try:
            run = self.client.actor(self.actor_id).call(run_input=run_input)
            
            dataset_id = run.get('defaultDatasetId')
            if not dataset_id:
                return []
            
            print(f"[INFO] Run finished. Fetching results from dataset {dataset_id}...")
            
            dataset_items = self.client.dataset(dataset_id).iterate_items()
            
            count = 0
            for item in dataset_items:
                # Map result (extract comments if requested)
                mapped = self._map_result(item, extract_comments=(comments_per_video > 0))
                if not mapped: continue
                
                # Check limits
                if since_date:
                    item_date = datetime.strptime(mapped['publish_date'], '%Y-%m-%d %H:%M:%S')
                    if item_date < since_date:
                        continue 
                
                results.append(mapped)
                count += 1
                
                if limit and count >= limit:
                    break
            
            return results
            
        except Exception as e:
            print(f"[ERROR] Error running Apify actor: {e}")
            return []

    async def scrape_hashtag(self, hashtags, count=None, since_date=None, comments_per_video=0):
        if isinstance(hashtags, str):
            hashtags = [h.strip() for h in hashtags.split(',')]
            
        limit = count if count else 100
        run_input = {
            "hashtags": hashtags,
            "resultsPerPage": limit,
            "shouldDownloadVideos": False,
            "commentsPerVideo": comments_per_video
        }
        return await self._run_actor(run_input, limit, since_date, comments_per_video)

    async def scrape_user(self, usernames, count=None, since_date=None, comments_per_video=0):
        if isinstance(usernames, str):
            usernames = [u.strip() for u in usernames.split(',')]
            
        limit = count if count else 100
        run_input = {
            "profiles": usernames,
            "resultsPerPage": limit,
            "shouldDownloadVideos": False,
            "commentsPerVideo": comments_per_video
        }
        return await self._run_actor(run_input, limit, since_date, comments_per_video)

    async def scrape_search(self, queries, count=None, since_date=None, comments_per_video=0):
        if isinstance(queries, str):
            queries = [q.strip() for q in queries.split(',')]
        
        limit = count if count else 100
        run_input = {
            "searchQueries": queries,
            "resultsPerPage": limit,
            "shouldDownloadVideos": False,
            "commentsPerVideo": comments_per_video
        }
        return await self._run_actor(run_input, limit, since_date, comments_per_video)

    async def close(self):
        pass


# Synchronous wrappers
def scrape_hashtag_sync(hashtags, count=None, since_date=None, api_token=None, comments_per_video=0):
    scraper = TikTokScraper(api_token)
    return asyncio.run(scraper.scrape_hashtag(hashtags, count, since_date, comments_per_video))

def scrape_user_sync(usernames, count=None, since_date=None, api_token=None, comments_per_video=0):
    scraper = TikTokScraper(api_token)
    return asyncio.run(scraper.scrape_user(usernames, count, since_date, comments_per_video))

def scrape_search_sync(queries, count=None, since_date=None, api_token=None, comments_per_video=0):
    scraper = TikTokScraper(api_token)
    return asyncio.run(scraper.scrape_search(queries, count, since_date, comments_per_video))
