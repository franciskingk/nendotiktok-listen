from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
import json
from datetime import datetime
import pandas as pd
import asyncio

# Import existing modules
from scraper import scrape_hashtag_sync, scrape_user_sync, scrape_search_sync
from analysis import TikTokAnalyzer
from sheets import SheetsManager

app = FastAPI(title="TikTok Pulse API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the actual frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Analyzer
analyzer = TikTokAnalyzer()

CONFIG_FILE = "config.json"
DATA_CACHE = "data_cache.json"

def load_local_data():
    if os.path.exists(DATA_CACHE):
        try:
            with open(DATA_CACHE, "r") as f:
                return json.load(f)
        except:
            pass
    return {"videos": [], "comments": []}

def save_local_data(data):
    # Load existing to avoid overwriting all
    existing = load_local_data()
    
    # Merge videos (deduplicate by video_id)
    video_ids = {v['video_id'] for v in existing['videos']}
    for v in data.get('videos', []):
        if str(v['video_id']) not in video_ids:
            existing['videos'].append(v)
            video_ids.add(str(v['video_id']))
            
    # Merge comments (deduplicate by comment_id)
    comment_ids = {c['comment_id'] for c in existing['comments']}
    for c in data.get('comments', []):
        if str(c['comment_id']) not in comment_ids:
            existing['comments'].append(c)
            comment_ids.add(str(c['comment_id']))
            
    with open(DATA_CACHE, "w") as f:
        json.dump(existing, f)

def load_config():
    config = {"sheet_url": "", "apify_token": "", "groups": []}
    
    # 1. Load from config.json if it exists
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r") as f:
                file_config = json.load(f)
                config.update(file_config)
        except Exception as e:
            print(f"Error loading {CONFIG_FILE}: {e}")

    # 2. Override/Populate with Environment Variables
    env_sheet_url = os.environ.get("SHEET_URL")
    if env_sheet_url:
        config["sheet_url"] = env_sheet_url

    env_apify_token = os.environ.get("APIFY_TOKEN")
    if env_apify_token:
        config["apify_token"] = env_apify_token

    env_groups = os.environ.get("GROUPS")
    if env_groups:
        try:
            # Parse GROUPS from JSON string if provided in env
            config["groups"] = json.loads(env_groups)
        except Exception as e:
            print(f"Error parsing GROUPS from environment: {e}")

    # Ensure groups key always exists as a list
    if "groups" not in config or not isinstance(config["groups"], list):
        config["groups"] = []
        
    return config

def save_config(config):
    with open(CONFIG_FILE, "w") as f:
        json.dump(config, f)

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
    try:
        config = load_config()
        config["sheet_url"] = request.sheet_url
        if request.apify_token is not None:
            config["apify_token"] = request.apify_token
        save_config(config)
        print(f"DEBUG: Saved config: {config}")
        return {"success": True, "config": config}
    except Exception as e:
        print(f"DEBUG ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/groups")
def add_group(group: KeywordGroup):
    config = load_config()
    # Remove existing group with same name if exists
    config["groups"] = [g for g in config["groups"] if g["name"] != group.name]
    config["groups"].append(group.dict())
    save_config(config)
    return {"success": True, "groups": config["groups"]}

@app.delete("/api/groups/{name}")
def delete_group(name: str):
    config = load_config()
    config["groups"] = [g for g in config["groups"] if g["name"] != name]
    save_config(config)
    return {"success": True, "groups": config["groups"]}

class ScrapeRequest(BaseModel):
    scrape_type: str  # "Hashtag", "Username", "Keyword"
    search_input: str
    video_count: Optional[int] = 50
    since_date: Optional[str] = None
    apify_token: str
    scrape_comments: bool = False
    comments_limit: Optional[int] = 0

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy", 
        "timestamp": datetime.now().isoformat(),
        "credentials_found": os.path.exists("credentials.json")
    }

@app.get("/api/data")
async def get_data():
    try:
        config = load_config()
        local_data = load_local_data()
        
        videos = local_data.get("videos", [])
        comments = local_data.get("comments", [])
        
        sheet_url = config.get("sheet_url")
        manager = SheetsManager(sheet_url=sheet_url if sheet_url else None)
        
        if manager.connect():
            df_videos = manager.get_all_data()
            df_comments = manager.get_all_comments()
            
            if not df_videos.empty:
                # Merge Sheets data into the list, avoiding duplicates from local cache
                sheet_videos = df_videos.to_dict(orient='records')
                local_ids = {str(v['video_id']) for v in videos}
                for v in sheet_videos:
                    if str(v['video_id']) not in local_ids:
                        videos.append(v)
            
            if not df_comments.empty:
                sheet_comments = df_comments.to_dict(orient='records')
                local_c_ids = {str(c['comment_id']) for c in comments}
                for c in sheet_comments:
                    if str(c['comment_id']) not in local_c_ids:
                        comments.append(c)

        # Convert list to DataFrame for analysis
        df_videos = pd.DataFrame(videos)
        df_comments = pd.DataFrame(comments)
        
        if not df_videos.empty:
            df_videos = analyzer.calculate_engagement_rate(df_videos)
            df_videos = analyzer.add_sentiment_analysis(df_videos, method='vader')
            if 'publish_date' in df_videos.columns:
                df_videos['publish_date'] = pd.to_datetime(df_videos['publish_date']).dt.strftime('%Y-%m-%d %H:%M:%S')
            if 'timestamp' in df_videos.columns:
                df_videos['timestamp'] = pd.to_datetime(df_videos['timestamp']).dt.strftime('%Y-%m-%d %H:%M:%S')
        
        if not df_comments.empty:
            df_comments = analyzer.add_sentiment_analysis(df_comments, method='vader', text_column='text')
            if 'date' in df_comments.columns:
                df_comments['date'] = pd.to_datetime(df_comments['date']).dt.strftime('%Y-%m-%d %H:%M:%S')
            if 'scraped_at' in df_comments.columns:
                df_comments['scraped_at'] = pd.to_datetime(df_comments['scraped_at']).dt.strftime('%Y-%m-%d %H:%M:%S')

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
            
            # Save to local cache regardless of Sheets status
            save_local_data({"videos": results, "comments": all_comments})
            
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
