"""
Google Sheets integration module for storing TikTok data
"""
import gspread
from oauth2client.service_account import ServiceAccountCredentials
import pandas as pd
from datetime import datetime
import os


class SheetsManager:
    def __init__(self, credentials_file='credentials.json', sheet_name='TikTok Analytics', sheet_url='https://docs.google.com/spreadsheets/d/1dirtUrGwr-r3sfpocamL1N8xkwJEk1xn8lcMfrU_bI0/edit?usp=sharing'):
        """
        Initialize Google Sheets connection
        
        Args:
            credentials_file: Path to Google service account credentials JSON
            sheet_name: Name of the Google Sheet to use (fallback)
            sheet_url: Direct URL to the Google Sheet (preferred)
        """
        self.sheet_name = sheet_name
        self.sheet_url = sheet_url
        self.credentials_file = credentials_file
        self.client = None
        self.sheet = None
        self.worksheet = None
        
    def connect(self):
        """Establish connection to Google Sheets"""
        try:
            scope = [
                'https://spreadsheets.google.com/feeds',
                'https://www.googleapis.com/auth/drive'
            ]
            
            # Use credentials from environment variable if available (for Vercel/Railway)
            creds_json = os.environ.get("GOOGLE_CREDENTIALS")
            if creds_json:
                print("[INFO] Using credentials from GOOGLE_CREDENTIALS environment variable")
                import json
                creds_dict = json.loads(creds_json)
                creds = ServiceAccountCredentials.from_json_keyfile_dict(creds_dict, scope)
            elif os.path.exists(self.credentials_file):
                print(f"[INFO] Using credentials from file: {self.credentials_file}")
                creds = ServiceAccountCredentials.from_json_keyfile_name(
                    self.credentials_file, scope
                )
            else:
                print(f"[WARN] Credentials not found (env GOOGLE_CREDENTIALS or file {self.credentials_file})")
                return False
                
            self.client = gspread.authorize(creds)
            
            # Try to open by URL first (most reliable), then by name
            try:
                if self.sheet_url:
                    print(f"[INFO] Opening sheet by URL: {self.sheet_url}")
                    self.sheet = self.client.open_by_url(self.sheet_url)
                else:
                    self.sheet = self.client.open(self.sheet_name)
            except gspread.SpreadsheetNotFound:
                if self.sheet_url:
                     print(f"[WARN] Could not find sheet with URL. Checking by name...")
                
                try:
                    self.sheet = self.client.open(self.sheet_name)
                except gspread.SpreadsheetNotFound:
                    print(f"Creating new spreadsheet: {self.sheet_name}")
                    self.sheet = self.client.create(self.sheet_name)
                    self.sheet.share('', perm_type='anyone', role='reader')
            
            # Get or create worksheet (Videos)
            try:
                self.worksheet = self.sheet.sheet1
                if self.worksheet.title.lower() != 'data':
                     try: self.worksheet.update_title('Videos')
                     except: pass
            except:
                self.worksheet = self.sheet.add_worksheet(title="Videos", rows="1000", cols="20")
            
            # Initialize headers if empty
            if not self.worksheet.row_values(1):
                headers = [
                    'timestamp', 'video_id', 'video_url', 'caption', 'author',
                    'likes', 'comments', 'shares', 'saves', 'views', 'publish_date',
                    'hashtags', 'mentions', 'thumbnail_url'
                ]
                self.worksheet.append_row(headers)

            # Get or create Comments worksheet
            try:
                self.comments_sheet = self.sheet.worksheet("Comments")
            except:
                self.comments_sheet = self.sheet.add_worksheet(title="Comments", rows="1000", cols="8")
                # Headers for comments
                self.comments_sheet.append_row([
                    'scraped_at', 'video_id', 'comment_id', 'author', 
                    'text', 'likes', 'date'
                ])
            
            print(f"[INFO] Connected to Google Sheets: {self.sheet_name}")
            return True
            
        except Exception as e:
            print(f"[ERROR] Error connecting to Google Sheets: {e}")
            return False
    
    def get_existing_video_ids(self):
        """Get list of existing video IDs to avoid duplicates"""
        try:
            if not self.worksheet:
                return set()
            video_ids = self.worksheet.col_values(2)[1:]  # Skip header
            return set(video_ids)
        except Exception as e:
            print(f"Error getting existing video IDs: {e}")
            return set()
    
    def append_comments(self, comments_list):
        """
        Append comments to the separate Comments sheet
        """
        if not self.comments_sheet or not comments_list:
            return 0
        
        try:
            # We don't check for duplicate comments strictly here to save API calls/time, 
            # but ideally we would. For now, just append.
            # Convert list of dicts to list of lists
            rows = []
            timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            
            for c in comments_list:
                rows.append([
                    timestamp,
                    c.get('video_id', ''),
                    c.get('comment_id', ''),
                    c.get('author', ''),
                    c.get('text', ''),
                    c.get('likes', 0),
                    c.get('date', '')
                ])
            
            if rows:
                self.comments_sheet.append_rows(rows)
                print(f"[INFO] Added {len(rows)} comments to Sheets")
            
            return len(rows)
        except Exception as e:
            print(f"[ERROR] Error appending comments: {e}")
            return 0

    def append_data(self, data_list):
        """
        Append new TikTok data to sheet, avoiding duplicates
        
        Args:
            data_list: List of dictionaries containing TikTok video data
        
        Returns:
            Number of new rows added
        """
        if not self.worksheet:
            print("Not connected to Google Sheets")
            return 0
        
        try:
            existing_ids = self.get_existing_video_ids()
            new_rows = 0
            
            for data in data_list:
                video_id = str(data.get('video_id', ''))
                
                # Skip if already exists
                if video_id in existing_ids:
                    continue
                
                row = [
                    datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    video_id,
                    data.get('video_url', ''),
                    data.get('caption', ''),
                    data.get('author', ''),
                    data.get('likes', 0),
                    data.get('comments', 0),
                    data.get('shares', 0),
                    data.get('saves', 0),
                    data.get('views', 0),
                    data.get('publish_date', ''),
                    data.get('hashtags', ''),
                    data.get('mentions', ''),
                    data.get('thumbnail_url', '')
                ]
                
                self.worksheet.append_row(row)
                existing_ids.add(video_id)
                new_rows += 1
            
            print(f"[INFO] Added {new_rows} new rows to Google Sheets")
            return new_rows
            
        except Exception as e:
            print(f"[ERROR] Error appending data: {e}")
            return 0
    
    def get_all_data(self):
        """
        Retrieve all data from sheet as pandas DataFrame
        
        Returns:
            pandas DataFrame with all data
        """
        try:
            if not self.worksheet:
                return pd.DataFrame()
            
            data = self.worksheet.get_all_records()
            df = pd.DataFrame(data)
            
            # Convert numeric columns
            numeric_cols = ['likes', 'comments', 'shares', 'saves', 'views']
            for col in numeric_cols:
                if col in df.columns:
                    df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
            
            # Convert date columns
            if 'publish_date' in df.columns:
                df['publish_date'] = pd.to_datetime(df['publish_date'], errors='coerce')
            if 'timestamp' in df.columns:
                df['timestamp'] = pd.to_datetime(df['timestamp'], errors='coerce')
            
            return df
            
        except Exception as e:
            print(f"Error retrieving data: {e}")
            return pd.DataFrame()
    def get_all_comments(self):
        """
        Retrieve all comment data from the Comments sheet as pandas DataFrame
        
        Returns:
            pandas DataFrame with all comments
        """
        try:
            if not self.comments_sheet:
                return pd.DataFrame()
            
            data = self.comments_sheet.get_all_records()
            df = pd.DataFrame(data)
            
            # Convert numeric columns
            if 'likes' in df.columns:
                df['likes'] = pd.to_numeric(df['likes'], errors='coerce').fillna(0)
            
            # Convert date columns
            if 'date' in df.columns:
                df['date'] = pd.to_datetime(df['date'], errors='coerce')
            if 'scraped_at' in df.columns:
                df['scraped_at'] = pd.to_datetime(df['scraped_at'], errors='coerce')
            
            return df
            
        except Exception as e:
            print(f"Error retrieving comments: {e}")
            return pd.DataFrame()
    
    def get_sheet_url(self):
        """Get the URL of the Google Sheet"""
        if self.sheet:
            return self.sheet.url
        return None
