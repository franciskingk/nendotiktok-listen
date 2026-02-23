import os
from supabase import create_client, Client
from datetime import datetime
import pandas as pd
from typing import List, Dict, Any

class SupabaseManager:
    def __init__(self, url: str = None, key: str = None):
        """
        Initialize Supabase connection
        """
        self.url = url or os.environ.get("SUPABASE_URL")
        self.key = key or os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")
        
        if not self.url or not self.key:
            print("[WARN] Supabase credentials missing. Database operations will fail.")
            self.client = None
        else:
            self.client = create_client(self.url, self.key)

    def is_connected(self) -> bool:
        return self.client is not None

    def save_videos(self, videos: List[Dict[str, Any]]):
        """
        Save videos to Supabase with deduplication (upsert)
        """
        if not self.client or not videos:
            return 0
        
        # Prepare data for Supabase
        # We ensure numeric fields are integers and dates are handled
        formatted_videos = []
        for v in videos:
            formatted = {
                "video_id": str(v.get("video_id", "")),
                "video_url": v.get("video_url", ""),
                "caption": v.get("caption", ""),
                "author": v.get("author", ""),
                "likes": int(v.get("likes", 0)),
                "comments": int(v.get("comments", 0)),
                "shares": int(v.get("shares", 0)),
                "saves": int(v.get("saves", 0)),
                "views": int(v.get("views", 0)),
                "publish_date": v.get("publish_date"),
                "hashtags": v.get("hashtags", ""),
                "mentions": v.get("mentions", ""),
                "thumbnail_url": v.get("thumbnail_url", ""),
            }
            formatted_videos.append(formatted)

        try:
            # upsert will update if video_id exists, or insert if it doesn't
            # This relies on video_id being the Primary Key in Supabase
            result = self.client.table("videos").upsert(formatted_videos, on_conflict="video_id").execute()
            return len(result.data) if hasattr(result, 'data') else len(formatted_videos)
        except Exception as e:
            print(f"[ERROR] Supabase save_videos error: {e}")
            return 0

    def save_comments(self, comments: List[Dict[str, Any]]):
        """
        Save comments to Supabase with deduplication
        """
        if not self.client or not comments:
            return 0
        
        formatted_comments = []
        for c in comments:
            formatted = {
                "comment_id": str(c.get("comment_id", "")),
                "video_id": str(c.get("video_id", "")),
                "author": c.get("author", ""),
                "text": c.get("text", ""),
                "likes": int(c.get("likes", 0)),
                "date": c.get("date"),
            }
            formatted_comments.append(formatted)

        try:
            result = self.client.table("comments").upsert(formatted_comments, on_conflict="comment_id").execute()
            return len(result.data) if hasattr(result, 'data') else len(formatted_comments)
        except Exception as e:
            print(f"[ERROR] Supabase save_comments error: {e}")
            return 0

    def get_all_videos(self) -> pd.DataFrame:
        """Fetch all videos from Supabase"""
        if not self.client:
            return pd.DataFrame()
        
        try:
            result = self.client.table("videos").select("*").order("publish_date", desc=True).execute()
            return pd.DataFrame(result.data) if result.data else pd.DataFrame()
        except Exception as e:
            print(f"[ERROR] Supabase get_all_videos error: {e}")
            return pd.DataFrame()

    def get_all_comments(self) -> pd.DataFrame:
        """Fetch all comments from Supabase"""
        if not self.client:
            return pd.DataFrame()
        
        try:
            result = self.client.table("comments").select("*").order("date", desc=True).execute()
            return pd.DataFrame(result.data) if result.data else pd.DataFrame()
        except Exception as e:
            print(f"[ERROR] Supabase get_all_comments error: {e}")
            return pd.DataFrame()
