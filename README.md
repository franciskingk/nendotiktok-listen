# 📊 TikTok Social Listening & Analytics Dashboard

A complete Python web application for scraping TikTok data and visualizing interactive analytics with sentiment analysis, engagement metrics, and trend tracking.

## ✨ Features

### 🔍 Data Scraping
- Scrape TikTok videos by hashtag or username
- Extract comprehensive video data:
  - Video ID, URL, caption
  - Author information
  - Engagement metrics (likes, comments, shares, views)
  - Publish date
  - Hashtags and mentions

### 💾 Data Storage
- Automatic Google Sheets integration
- Duplicate prevention using video IDs
- Timestamped data entries
- Auto-create sheets if they don't exist

### 📈 Analytics
- **Sentiment Analysis**: TextBlob and VADER sentiment scoring
- **Engagement Rate**: Calculated engagement metrics
- **Word Frequency**: Extract trending words from captions
- **Time Series**: Aggregate data by hour/day/week

### 📊 Interactive Visualizations
- Views over time (line chart)
- Engagement metrics over time (multi-line chart)
- Sentiment distribution (pie chart)
- Top posts by engagement (bar chart)
- Sentiment score trends
- Word cloud from captions
- Top words and authors tables

### 🎨 Modern UI
- Clean Streamlit interface
- Sidebar filters for hashtag/username input
- Date range filtering
- Refresh scrape button
- Gradient styling and modern design

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

After installing, you need to install Playwright browsers:

```bash
playwright install
```

### 2. Set Up Google Sheets (Optional but Recommended)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google Sheets API and Google Drive API
4. Create a Service Account
5. Download the credentials JSON file
6. Rename it to `credentials.json` and place it in the project directory

### 3. Run the Application

```bash
streamlit run app.py
```

The dashboard will open in your browser at `http://localhost:8501`

## 📁 Project Structure

```
tiktok-analytics/
├── app.py              # Main Streamlit dashboard
├── scraper.py          # TikTok scraping module
├── analysis.py         # Analytics and sentiment analysis
├── sheets.py           # Google Sheets integration
├── requirements.txt    # Python dependencies
├── credentials.json    # Google Service Account credentials (not included)
└── README.md          # This file
```

## 🎯 Usage

### Scraping Data

1. **By Hashtag**:
   - Select "Hashtag" in the sidebar
   - Enter hashtag without # (e.g., "viral")
   - Choose number of videos (10-100)
   - Click "🔄 Scrape New Data"

2. **By Username**:
   - Select "Username" in the sidebar
   - Enter username without @ (e.g., "username")
   - Choose number of videos (10-100)
   - Click "🔄 Scrape New Data"

### Viewing Analytics

1. Click "📥 Load Data from Sheets" to load all stored data
2. Use date range filter to focus on specific time periods
3. Explore interactive charts and metrics
4. View raw data in the expandable table

### Key Metrics

- **Total Videos**: Number of videos in dataset
- **Total Views**: Sum of all video views
- **Total Likes**: Sum of all likes
- **Avg Engagement**: Average engagement rate across all videos

## 🔧 Customization

### Change Sentiment Analysis Method

In `app.py`, modify the sentiment analysis method:

```python
df = analyzer.add_sentiment_analysis(df, method='vader')  # or 'textblob'
```

### Adjust Time Aggregation

In `app.py`, change the frequency for time series:

```python
time_agg = analyzer.aggregate_by_time(df, freq='D')  # 'H' for hour, 'D' for day, 'W' for week
```

### Customize Google Sheet Name

In `sheets.py` or when initializing:

```python
sheets = SheetsManager(sheet_name='My Custom Sheet Name')
```

## 📊 Analytics Explained

### Engagement Rate
```
Engagement Rate = (Likes + Comments + Shares) / Views × 100
```

### Sentiment Analysis
- **VADER**: Best for social media text, returns compound score (-1 to +1)
- **TextBlob**: General purpose, returns polarity (-1 to +1) and subjectivity (0 to 1)

### Sentiment Categories
- **Positive**: Score > 0.05
- **Neutral**: Score between -0.05 and 0.05
- **Negative**: Score < -0.05

## ⚠️ Important Notes

### TikTok API Limitations
- TikTok doesn't have an official public API
- This app uses unofficial scraping methods via TikTokApi
- Scraping may be rate-limited or blocked
- Use responsibly and respect TikTok's terms of service

### Google Sheets
- Without Google Sheets credentials, data won't persist between sessions
- You can still use the app for one-time analysis
- Data will be stored in memory only

### Playwright
- First-time setup requires installing browser binaries
- Run `playwright install` after pip install
- Requires ~300MB of disk space for browsers

## 🛠️ Troubleshooting

### "TikTok API initialization failed"
- Ensure Playwright is installed: `playwright install`
- Check your internet connection
- TikTok may be blocking automated access

### "Google Sheets not connected"
- Verify `credentials.json` exists in project directory
- Check that Google Sheets API is enabled
- Ensure service account has proper permissions

### "No data found"
- Try a different hashtag or username
- Reduce the number of videos requested
- Check if the account/hashtag exists on TikTok

## 📦 Dependencies

- **streamlit**: Web dashboard framework
- **plotly**: Interactive visualizations
- **pandas**: Data manipulation
- **TikTokApi**: TikTok scraping
- **playwright**: Browser automation
- **gspread**: Google Sheets integration
- **textblob**: Sentiment analysis
- **vaderSentiment**: Social media sentiment analysis
- **wordcloud**: Word cloud generation
- **matplotlib**: Plotting library

## 🔮 Future Enhancements

- [ ] Scheduled automated scraping
- [ ] Email/Slack notifications
- [ ] Competitor analysis
- [ ] Hashtag recommendations
- [ ] Export to CSV/Excel
- [ ] Multi-account tracking
- [ ] Advanced filtering options
- [ ] Custom date range presets

## 📄 License

This project is for educational purposes. Please respect TikTok's terms of service and use responsibly.

## 🤝 Contributing

Feel free to fork, modify, and submit pull requests!

---

**Made with ❤️ for social media analytics**
