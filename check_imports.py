import sys
import os

# Simulate api/index.py path logic
sys.path.append(os.path.abspath(os.curdir))

try:
    from scraper import scrape_hashtag_sync, scrape_user_sync, scrape_search_sync
    print("Scraper imported successfully")
except Exception as e:
    print(f"Scraper Import Error: {e}")

try:
    from analysis import TikTokAnalyzer
    print("Analysis imported successfully")
except Exception as e:
    print(f"Analysis Import Error: {e}")

try:
    from sheets import SheetsManager
    print("Sheets imported successfully")
except Exception as e:
    print(f"Sheets Import Error: {e}")
