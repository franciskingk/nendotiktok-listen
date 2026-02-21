import asyncio
import os
import sys

# Add root to path
sys.path.append(os.path.abspath(os.curdir))

from scraper import TikTokScraper

async def test():
    token = os.environ.get("APIFY_TOKEN")
    if not token:
        print("No APIFY_TOKEN found")
        return
    
    scraper = TikTokScraper(token)
    try:
        print("Starting test scrape...")
        # Just a tiny search to see if it works
        results = await scraper.scrape_search("test", count=1)
        print(f"Success! Found {len(results)} results")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test())
