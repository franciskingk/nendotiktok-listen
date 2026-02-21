from fastapi import FastAPI, HTTPException, Request, BackgroundTasks
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os.path
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
import json
import sys
from datetime import datetime
import pandas as pd
import asyncio

# Add the parent directory to sys.path so we can import modules from the root
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import existing modules
try:
    from scraper import scrape_hashtag_sync, scrape_user_sync, scrape_search_sync, TikTokScraper
    from analysis import TikTokAnalyzer
    from sheets import SheetsManager
except ImportError as e:
    print(f"Import Error: {e}")
    # Fallback/Dummy classes if imports fail (to prevent deploy crash)
    from scraper import TikTokScraper
    scrape_hashtag_sync = None
    class TikTokAnalyzer:
        def calculate_engagement_rate(self, df): return df
        def add_sentiment_analysis(self, df, **kwargs): return df
    class SheetsManager:
        def __init__(self, **kwargs): pass
        def connect(self): return False

app = FastAPI(title="TikTok Pulse API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Analyzer
try:
    analyzer = TikTokAnalyzer()
except:
    analyzer = None

# Vercel is Read-Only. We cannot write to these files.
# We will use in-memory storage for the session (ephemeral) or external DBs.
CONFIG_FILE = "config.json"
DATA_CACHE = "data_cache.json"

def load_local_data():
    # Return empty structure as we can't reliably read/write cache file on Vercel
    return {"videos": [], "comments": []}

def save_local_data(data):
    # Disabled for Vercel (Read-Only FS)
    pass

def load_config():
    config = {"sheet_url": "", "apify_token": "", "groups": []}
    
    # Prioritize Environment Variables
    env_sheet_url = os.environ.get("SHEET_URL")
    if env_sheet_url:
        config["sheet_url"] = env_sheet_url

    env_apify_token = os.environ.get("APIFY_TOKEN")
    if env_apify_token:
        config["apify_token"] = env_apify_token

    env_groups = os.environ.get("GROUPS")
    if env_groups:
        try:
            config["groups"] = json.loads(env_groups)
        except Exception as e:
            print(f"Error parsing GROUPS from environment: {e}")

    if "groups" not in config or not isinstance(config["groups"], list):
        config["groups"] = []
        
    return config

def save_config(config):
    # Disabled for Vercel (Read-Only FS)
    print("WARNING: configuration save ignored on read-only filesystem")
    pass

class SettingsRequest(BaseModel):
    sheet_url: str
    apify_token: Optional[str] = None

class KeywordGroup(BaseModel):
    name: str
    keywords: List[str]
    exclude_keywords: List[str] = []
    exact_match: bool = False

@app.get("/api/settings")
def get_settings():
    return load_config()

@app.post("/api/settings")
def update_settings(request: SettingsRequest):
    # This endpoint will only "pretend" to save in the runtime
    config = load_config()
    config["sheet_url"] = request.sheet_url
    if request.apify_token is not None:
        config["apify_token"] = request.apify_token
    # save_config(config) # Disabled
    return {"success": True, "config": config, "warning": "Settings not persisted in Vercel environment"}

@app.post("/api/groups")
def add_group(group: KeywordGroup):
    config = load_config()
    config["groups"] = [g for g in config["groups"] if g["name"] != group.name]
    config["groups"].append(group.dict())
    # save_config(config) # Disabled
    return {"success": True, "groups": config["groups"], "warning": "Groups not persisted in Vercel environment"}

@app.delete("/api/groups/{name}")
def delete_group(name: str):
    config = load_config()
    config["groups"] = [g for g in config["groups"] if g["name"] != name]
    # save_config(config) # Disabled
    return {"success": True, "groups": config["groups"], "warning": "Groups not persisted in Vercel environment"}

class ScrapeRequest(BaseModel):
    scrape_type: str
    search_input: str
    video_count: Optional[int] = 50
    since_date: Optional[str] = None
    apify_token: str
    sheet_url: Optional[str] = None
    scrape_comments: bool = False
    comments_limit: Optional[int] = 0

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy", 
        "timestamp": datetime.now().isoformat(),
        "credentials_found": os.path.exists("credentials.json"),
        "environment": os.environ.get("RAILWAY_ENVIRONMENT", "vercel")
    }

@app.get("/api/data")
async def get_data():
    try:
        config = load_config()
        # local_data = load_local_data() # Skip local cache
        videos = []
        comments = []
        
        sheet_url = config.get("sheet_url")
        manager = SheetsManager(sheet_url=sheet_url if sheet_url else None)
        
        if manager.connect():
            df_videos = manager.get_all_data()
            df_comments = manager.get_all_comments()
            
            if not df_videos.empty:
                videos = df_videos.to_dict(orient='records')
            
            if not df_comments.empty:
                comments = df_comments.to_dict(orient='records')

        df_videos = pd.DataFrame(videos)
        df_comments = pd.DataFrame(comments)
        
        if not df_videos.empty and analyzer:
            df_videos = analyzer.calculate_engagement_rate(df_videos)
            df_videos = analyzer.add_sentiment_analysis(df_videos, method='vader')
            if 'publish_date' in df_videos.columns:
                df_videos['publish_date'] = pd.to_datetime(df_videos['publish_date']).dt.strftime('%Y-%m-%d %H:%M:%S')
        
        if not df_comments.empty and analyzer:
            df_comments = analyzer.add_sentiment_analysis(df_comments, method='vader', text_column='text')
            if 'date' in df_comments.columns:
                df_comments['date'] = pd.to_datetime(df_comments['date']).dt.strftime('%Y-%m-%d %H:%M:%S')

        return {
            "videos": df_videos.to_dict(orient='records') if not df_videos.empty else [],
            "comments": df_comments.to_dict(orient='records') if not df_comments.empty else [],
            "credentials_found": os.path.exists("credentials.json")
        }
    except Exception as e:
        print(f"API Data Error: {e}")
        return {"videos": [], "comments": [], "error": str(e)}

@app.post("/api/scrape")
async def run_scrape(request: ScrapeRequest):
    try:
        config = load_config()
        since_dt = None
        if request.since_date:
            try:
                since_dt = datetime.fromisoformat(request.since_date)
            except:
                pass

        if not scrape_hashtag_sync:
            raise HTTPException(status_code=500, detail="Scraper module not loaded correctly")

        results = []
        loop = asyncio.get_event_loop()
        
        if request.scrape_type == "Hashtag":
            results = await loop.run_in_executor(None, scrape_hashtag_sync, 
                        request.search_input, request.video_count, since_dt, request.apify_token, request.comments_limit if request.scrape_comments else 0)
        elif request.scrape_type == "Username":
            results = await loop.run_in_executor(None, scrape_user_sync, 
                        request.search_input, request.video_count, since_dt, request.apify_token, request.comments_limit if request.scrape_comments else 0)
        else: # Keyword
            results = await loop.run_in_executor(None, scrape_search_sync, 
                        request.search_input, request.video_count, since_dt, request.apify_token, request.comments_limit if request.scrape_comments else 0)
        
        if results:
            all_comments = []
            for video in results:
                if 'scraped_comments' in video:
                    all_comments.extend(video['scraped_comments'])
                    del video['scraped_comments']
            
            # save_local_data(...) # Disabled
            
            # Try to save to Sheets if connected
            manager = SheetsManager(sheet_url=config.get("sheet_url") if config.get("sheet_url") else None)
            if manager.connect():
                manager.append_data(results)
                if all_comments:
                    manager.append_comments(all_comments)
            
            return {
                "success": True, 
                "video_count": len(results), 
                "comment_count": len(all_comments)
            }
        else:
            return {"success": False, "error": "No results found"}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/scrape")
async def legacy_scrape(request: ScrapeRequest):
    """Old endpoint kept for compatibility. Re-routes to async flow if on Vercel."""
    if os.environ.get("VERCEL") or os.environ.get("RAILWAY_ENVIRONMENT"):
        return await run_scrape_async(request)
    
    # Local synchronous behavior (preserved for local dev if desired)
    try:
        since_dt = None
        if request.since_date:
            try: since_dt = datetime.fromisoformat(request.since_date)
            except: pass

        if not scrape_hashtag_sync:
            raise HTTPException(status_code=500, detail="Scraper module not loaded correctly")

        results = []
        loop = asyncio.get_event_loop()
        if request.scrape_type == "Hashtag":
            results = await loop.run_in_executor(None, scrape_hashtag_sync, request.search_input, request.video_count, since_dt, request.apify_token, request.comments_limit if request.scrape_comments else 0)
        elif request.scrape_type == "Username":
            results = await loop.run_in_executor(None, scrape_user_sync, request.search_input, request.video_count, since_dt, request.apify_token, request.comments_limit if request.scrape_comments else 0)
        else: # Keyword
            results = await loop.run_in_executor(None, scrape_search_sync, request.search_input, request.video_count, since_dt, request.apify_token, request.comments_limit if request.scrape_comments else 0)
        
        # Save results...
        manager = SheetsManager(sheet_url=request.sheet_url or load_config().get("sheet_url"))
        if manager.connect():
             manager.append_data(results)
        
        return {"success": True, "video_count": len(results)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def process_webhook_results(run_id: str, dataset_id: str, sheet_url: str = None):
    """Background task to fetch and save findings from Apify"""
    try:
        config = load_config()
        token = config.get("apify_token") or os.environ.get("APIFY_TOKEN")
        scraper = TikTokScraper(token)
        results = scraper.fetch_results(dataset_id)
        
        if results:
            target_sheet = sheet_url or config.get("sheet_url")
            print(f"[INFO] Webhook saving {len(results)} results to {target_sheet}")
            manager = SheetsManager(sheet_url=target_sheet)
            if manager.connect():
                manager.append_data(results)
        
        print(f"Async Scrape Finished for run {run_id}. Saved results to Sheets.")
    except Exception as e:
        print(f"Webhook processing error: {e}")

@app.post("/api/webhook")
async def apify_webhook(request: Request, background_tasks: BackgroundTasks):
    """Webhook endpoint for Apify to notify completion"""
    try:
        data = await request.json()
        run_id = data.get("runId")
        dataset_id = data.get("datasetId")
        sheet_url = data.get("sheetUrl")
        
        if run_id and dataset_id:
            background_tasks.add_task(process_webhook_results, run_id, dataset_id, sheet_url)
            return {"status": "processing"}
        return {"status": "invalid payload"}
    except Exception as e:
        print(f"Webhook error: {e}")
        return {"status": "error", "message": str(e)}

@app.post("/api/scrape/async")
async def run_scrape_async(request: ScrapeRequest):
    """Initiate a scrape job without waiting for it to finish (Vercel compatible)"""
    try:
        config = load_config()
        # Detect host for webhook URL
        host = os.environ.get("VERCEL_URL", "localhost:8001")
        if not host.startswith("http"):
             host = f"https://{host}"
        
        webhook_url = f"{host}/api/webhook"
        
        scraper = TikTokScraper(request.apify_token)
        run_info = await scraper.start_scrape_async(
            request.scrape_type,
            request.search_input,
            request.video_count,
            webhook_url=webhook_url,
            sheet_url=request.sheet_url or config.get("sheet_url")
        )
        
        if run_info:
            return {
                "success": True, 
                "message": "Scrape initiated! Results will appear in Google Sheets in a few minutes.",
                "run_id": run_info.get("id")
            }
        else:
            return {"success": False, "error": "Failed to initiate scrape job. Check your Apify Token."}
            
    except Exception as e:
        print(f"Async Scrape Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Server static files for Production
if os.path.exists("dist"):
    app.mount("/assets", StaticFiles(directory="dist/assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Exclude /api routes
        if full_path.startswith("api"):
             return {"detail": "Not Found"}
             
        # Check if the file exists in dist
        file_path = os.path.join("dist", full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
            
        # Fallback to SPA index.html
        return FileResponse("dist/index.html")
