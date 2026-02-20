"""
TikTok Social Listening & Analytics Dashboard
Main Streamlit application
"""
import streamlit as st
import plotly.express as px
import plotly.graph_objects as go
from wordcloud import WordCloud
import matplotlib.pyplot as plt
import pandas as pd
from datetime import datetime, timedelta
import os

from scraper import scrape_hashtag_sync, scrape_user_sync
from analysis import TikTokAnalyzer
from sheets import SheetsManager


# Page configuration
st.set_page_config(
    page_title="TikTok Analytics Dashboard",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Standard Streamlit styling (Plain)
st.markdown("""
<style>
    .main-header {
        font-size: 2.5rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
    }
</style>
""", unsafe_allow_html=True)



# Initialize session state
if 'data_loaded' not in st.session_state:
    st.session_state.data_loaded = False
if 'df' not in st.session_state:
    st.session_state.df = pd.DataFrame()
if 'df_comments' not in st.session_state:
    st.session_state.df_comments = pd.DataFrame()
if 'df_comments_filtered' not in st.session_state:
    st.session_state.df_comments_filtered = pd.DataFrame()


@st.cache_resource
def get_sheets_manager():
    """Initialize and cache Google Sheets manager"""
    manager = SheetsManager()
    manager.connect()
    return manager


@st.cache_resource
def get_analyzer():
    """Initialize and cache analyzer"""
    return TikTokAnalyzer()


def create_wordcloud(text_data):
    """Generate word cloud from text data"""
    if not text_data:
        return None
    
    wordcloud = WordCloud(
        width=800,
        height=400,
        background_color='white',
        colormap='viridis',
        max_words=50
    ).generate(text_data)
    
    fig, ax = plt.subplots(figsize=(10, 5))
    ax.imshow(wordcloud, interpolation='bilinear')
    ax.axis('off')
    plt.tight_layout(pad=0)
    
    return fig



 def main():
     # Header
     st.markdown('<h1 class="main-header">📊 TikTok Social Listening Dashboard</h1>', unsafe_allow_html=True)
    st.markdown("Track hashtags, analyze sentiment, and discover insights from TikTok content")
    
    # Sidebar
    st.sidebar.title("🎯 Filters & Controls")
    
    # Connection Status
    if not os.path.exists("credentials.json"):
        st.sidebar.error("❌ Google Sheets: Disconnected")
        st.sidebar.caption("Missing `credentials.json`. Data will be temporary.")
    else:
        st.sidebar.success("✅ Google Sheets: File Found")
    
    # Scraping controls
    st.sidebar.header("Data Collection")
    
    # Apify Token Input
    apify_token = st.sidebar.text_input("Apify API Token", type="password", help="Get your token from https://console.apify.com/account/integrations")
    if not apify_token:
        st.sidebar.warning("⚠️ Apify Token required")
    
    scrape_type = st.sidebar.radio("Scrape by:", ["Hashtag", "Username", "Keyword/Search"])
    
    if scrape_type == "Hashtag":
        search_input = st.sidebar.text_input("Enter hashtag (without #)", placeholder="viral")
    elif scrape_type == "Username":
        search_input = st.sidebar.text_input("Enter username (without @)", placeholder="username")
    else:
        search_input = st.sidebar.text_input("Enter keyword (treated as hashtag)", placeholder="tiktok analytics")
    
    # Date limit for scraping
    use_date_limit = st.sidebar.checkbox("Limit by Date (Stop if older)")
    since_date = None
    if use_date_limit:
        since_date_input = st.sidebar.date_input("Scrape videos since:", 
                                                value=datetime.now().date() - timedelta(days=7),
                                                max_value=datetime.now().date())
        since_date = datetime.combine(since_date_input, datetime.min.time())
    
    # Count limit
    no_limit = st.sidebar.checkbox("No Video Limit")
    if no_limit:
        video_count = None
        st.sidebar.caption("⚠️ Might consume many Apify credits.")
    else:
        video_count = st.sidebar.number_input("Max videos to scrape", min_value=10, max_value=10000, value=50, step=10)
    
    # Comments Scraping (Now for all modes)
    st.sidebar.subheader("💬 Comments")
    scrape_comments = st.sidebar.checkbox("Scrape Comments for each video")
    comments_limit = 0
    if scrape_comments:
        comments_limit = st.sidebar.number_input("Max comments per video", min_value=10, max_value=2000, value=50)
    
    if st.sidebar.button("🔄 Scrape New Data", use_container_width=True):
        if not apify_token:
            st.sidebar.error("Please enter your Apify API Token first!")
        elif search_input:
            with st.spinner(f"Running Apify Actor for '{search_input}'..."):
                try:
                    # Determine scraper function
                    results = []
                    if scrape_type == "Hashtag":
                        results = scrape_hashtag_sync(search_input, video_count, since_date, apify_token, comments_limit if scrape_comments else 0)
                    elif scrape_type == "Username":
                        # Pass comment limits
                        results = scrape_user_sync(search_input, video_count, since_date, apify_token, comments_limit if scrape_comments else 0)
                    else:
                        from scraper import scrape_search_sync
                        results = scrape_search_sync(search_input, video_count, since_date, apify_token, comments_limit if scrape_comments else 0)
                    
                    if results:
                        # Extract comments if any
                        all_comments = []
                        for video in results:
                            if 'scraped_comments' in video:
                                all_comments.extend(video['scraped_comments'])
                                # Remove from video dict before saving to main sheet to keep it clean
                                del video['scraped_comments']

                        # Save to Google Sheets
                        sheets = get_sheets_manager()
                        if sheets.worksheet:
                            new_rows = sheets.append_data(results)
                            msg = f"✅ Scraped {len(results)} videos"
                            
                            if all_comments:
                                new_comments = sheets.append_comments(all_comments)
                                msg += f" and {new_comments} comments"
                            
                            st.sidebar.success(msg)
                        else:
                            st.sidebar.warning("⚠️ Google Sheets not connected. Data not saved.")
                            if st.session_state.df.empty:
                                st.session_state.df = pd.DataFrame(results)
                            else:
                                st.session_state.df = pd.concat([st.session_state.df, pd.DataFrame(results)], ignore_index=True)
                        
                        # Update session state immediately so UI refreshes without manual load
                        new_df = pd.DataFrame(results)
                        analyzer = get_analyzer()
                        new_df = analyzer.calculate_engagement_rate(new_df)
                        new_df = analyzer.add_sentiment_analysis(new_df, method='vader')
                        
                        if st.session_state.df.empty:
                            st.session_state.df = new_df
                        else:
                            st.session_state.df = pd.concat([st.session_state.df, new_df], ignore_index=True).drop_duplicates('video_id')
                        
                        if all_comments:
                            new_c_df = pd.DataFrame(all_comments)
                            new_c_df = analyzer.add_sentiment_analysis(new_c_df, method='vader', text_column='text')
                            if st.session_state.df_comments.empty:
                                st.session_state.df_comments = new_c_df
                            else:
                                st.session_state.df_comments = pd.concat([st.session_state.df_comments, new_c_df], ignore_index=True).drop_duplicates('comment_id')
                            st.session_state.df_comments_filtered = st.session_state.df_comments
                        
                        st.session_state.data_loaded = True
                        
                    else:
                        st.sidebar.error("No data found or Apify run failed. Check your token and credits.")
                        
                except Exception as e:
                    st.sidebar.error(f"Error scraping: {str(e)}")
        else:
            st.sidebar.warning("Please enter a search term")
    
    st.sidebar.divider()
    
    # Load data from Google Sheets
    if st.sidebar.button("📥 Load Data from Sheets", use_container_width=True):
        with st.spinner("Loading data from Google Sheets..."):
            sheets = get_sheets_manager()
            df = sheets.get_all_data()
            
            if not df.empty:
                # Add analytics
                analyzer = get_analyzer()
                df = analyzer.calculate_engagement_rate(df)
                df = analyzer.add_sentiment_analysis(df, method='vader')
                
                st.session_state.df = df
                
                # Load comments
                df_comments = sheets.get_all_comments()
                if not df_comments.empty:
                    df_comments = analyzer.add_sentiment_analysis(df_comments, method='vader', text_column='text')
                st.session_state.df_comments = df_comments
                st.session_state.df_comments_filtered = df_comments # Initialize
                
                st.session_state.data_loaded = True
                st.sidebar.success(f"✅ Loaded {len(df)} videos and {len(df_comments)} comments")
            else:
                st.sidebar.warning("No data found in Google Sheets")
    
    # Date range filter
    if st.session_state.data_loaded and not st.session_state.df.empty:
        st.sidebar.header("📅 Date Range")
        
        df = st.session_state.df
        
        if 'publish_date' in df.columns:
            # Ensure publish_date is datetime
            df['publish_date'] = pd.to_datetime(df['publish_date'], errors='coerce')
            
            # Drop rows with invalid dates if any
            df = df.dropna(subset=['publish_date'])
            
            if not df.empty:
                min_date = df['publish_date'].min().date()
                max_date = df['publish_date'].max().date()
                
                date_range = st.sidebar.date_input(
                    "Select date range",
                    value=(min_date, max_date),
                    min_value=min_date,
                    max_value=max_date
                )
            
            if len(date_range) == 2:
                mask = (df['publish_date'].dt.date >= date_range[0]) & (df['publish_date'].dt.date <= date_range[1])
                df = df[mask]
                
                # Also filter comments if they exist
                if not st.session_state.df_comments.empty:
                    df_c = st.session_state.df_comments
                    if 'date' in df_c.columns:
                        mask_c = (df_c['date'].dt.date >= date_range[0]) & (df_c['date'].dt.date <= date_range[1])
                        st.session_state.df_comments_filtered = df_c[mask_c]
                    else:
                        st.session_state.df_comments_filtered = df_c
                else:
                    st.session_state.df_comments_filtered = pd.DataFrame()
    
    # Main content
    if st.session_state.data_loaded and not st.session_state.df.empty:
        df = st.session_state.df
        analyzer = get_analyzer()
        
        # Ensure analytics are calculated (for both fresh scrapes and loaded data)
        if 'engagement_rate' not in df.columns:
            df = analyzer.calculate_engagement_rate(df)
        if 'sentiment' not in df.columns or 'sentiment_score' not in df.columns:
            df = analyzer.add_sentiment_analysis(df, method='vader')
        
        # Update session state with enriched data
        st.session_state.df = df
        
        # Key metrics
        col1, col2, col3, col4, col5 = st.columns(5)
        
        with col1:
            st.metric("Total Videos", f"{len(df):,}")
        with col2:
            st.metric("Total Views", f"{df['views'].sum():,.0f}")
        with col3:
            st.metric("Total Likes", f"{df['likes'].sum():,.0f}")
        with col4:
            st.metric("Total Shares", f"{df['shares'].sum():,.0f}")
        with col5:
            # Check if saves exist in the dataset
            saves_sum = df['saves'].sum() if 'saves' in df.columns else 0
            st.metric("Total Saves", f"{saves_sum:,.0f}")
        
        # New row for averages
        acol1, acol2, acol3 = st.columns(3)
        with acol1:
            st.metric("Avg Engagement", f"{df['engagement_rate'].mean():.2f}%")
        with acol2:
            st.metric("Total Comments", f"{df['comments'].sum():,.0f}")
        with acol3:
            # Comment data count
            c_count = len(st.session_state.df_comments_filtered) if not st.session_state.df_comments_filtered.empty else 0
            st.metric("Scraped Comments", f"{c_count:,}")
        
        st.divider()
        
        # Top Content Gallery
        st.subheader("🔥 Top Trending Videos")
        top_videos = df.sort_values('views', ascending=False).head(4)
        
        vid_cols = st.columns(4)
        for idx, (_, row) in enumerate(top_videos.iterrows()):
            with vid_cols[idx]:
                st.markdown(f"**@{row['author']}**")
                # Clean caption for display
                caption_preview = (row['caption'][:50] + '...') if len(row['caption']) > 50 else row['caption']
                st.caption(f"{caption_preview}")
                
                # Metric Badge
                st.markdown(f"""
                <div style="background: rgba(255,255,255,0.1); padding: 5px; border-radius: 5px; font-size: 0.8em; margin-bottom: 5px;">
                    👁️ {row['views']:,} | ❤️ {row['likes']:,} | 💬 {row['comments']:,} | Mood: {row['sentiment']}
                </div>
                """, unsafe_allow_html=True)
                
                st.markdown(f"[🎥 Watch Video]({row['video_url']})")

        st.divider()

        # Advanced Interactive Charts
        col1, col2 = st.columns([2, 1])
        
        with col1:
            st.subheader("🗺️ Engagement Landscape")
            # Bubble Chart: X=Time, Y=Views, Size=Likes+Comments, Color=Sentiment
            
            # Normalize size for bubbles
            df['total_engagement'] = df['likes'] + df['comments'] + df['shares']
            
            fig = px.scatter(
                df,
                x='publish_date',
                y='views',
                size='total_engagement',
                color='sentiment',
                hover_data=['author', 'caption', 'video_url'],
                title='Content Performance Timeline (Bubble Size = Engagement)',
                color_discrete_map={'positive': '#00CC96', 'neutral': '#AB63FA', 'negative': '#EF553B'},
                render_mode='webgl'
            )
            
            fig.update_layout(
                plot_bgcolor='rgba(0,0,0,0)',
                paper_bgcolor='rgba(0,0,0,0)',
                xaxis=dict(showgrid=False, title="Publish Date"),
                yaxis=dict(showgrid=True, title="Views"),
                hovermode='closest'
            )
            st.plotly_chart(fig, use_container_width=True)
            
        with col2:
            st.subheader("🎯 Sentiment Distribution")
            sentiment_counts = df['sentiment'].value_counts().reset_index()
            sentiment_counts.columns = ['sentiment', 'count']
            
            fig_pie = px.pie(
                sentiment_counts, 
                values='count', 
                names='sentiment',
                color='sentiment',
                color_discrete_map={'positive': '#00CC96', 'neutral': '#AB63FA', 'negative': '#EF553B'},
                hole=0.4
            )
            fig_pie.update_layout(
                paper_bgcolor='rgba(0,0,0,0)',
                legend=dict(orientation="h", yanchor="bottom", y=-0.1, xanchor="center", x=0.5)
            )
            st.plotly_chart(fig_pie, use_container_width=True)


        st.subheader("⚡ Engagement Breakdown")
        col1, col2 = st.columns([2, 1])
        with col1:
            # Stacked Bar of interactions
            time_agg = analyzer.aggregate_by_time(df, freq='D')
            if not time_agg.empty:
                fig_bar = go.Figure(data=[
                    go.Bar(name='Likes', x=time_agg['publish_date'], y=time_agg['likes'], marker_color='#667eea'),
                    go.Bar(name='Comments', x=time_agg['publish_date'], y=time_agg['comments'], marker_color='#764ba2'),
                    go.Bar(name='Shares', x=time_agg['publish_date'], y=time_agg['shares'], marker_color='#f093fb')
                ])
                if 'saves' in time_agg.columns:
                     fig_bar.add_trace(go.Bar(name='Saves', x=time_agg['publish_date'], y=time_agg['saves'], marker_color='#ffcc00'))

                fig_bar.update_layout(
                    barmode='stack',
                    plot_bgcolor='rgba(0,0,0,0)',
                    paper_bgcolor='rgba(0,0,0,0)',
                    legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1)
                )
                st.plotly_chart(fig_bar, use_container_width=True)
        
        with col2:
             # Additional stats or info
             st.info("The chart on the left shows daily engagement totals. You can hover over bars to see breakdown by type.")

        # Word cloud & Authors
        col1, col2 = st.columns(2)
        with col1:
            st.subheader("☁️ Trending Keywords")
            all_captions = ' '.join(df['caption'].dropna().astype(str))
            if all_captions:
                wordcloud_fig = create_wordcloud(all_captions)
                if wordcloud_fig:
                    st.pyplot(wordcloud_fig, use_container_width=True)
                    
        with col2:
             st.subheader("🏆 Influencer Leaderboard")
             author_stats = df.groupby('author').agg({
                'video_id': 'count',
                'views': 'sum',
                'engagement_rate': 'mean'
            }).round(2).sort_values('views', ascending=False).head(8)
             
             # Display as a styled dataframe with bars
             st.dataframe(
                 author_stats,
                 column_config={
                     "engagement_rate": st.column_config.ProgressColumn(
                         "Engagement %",
                         format="%.2f%%",
                         min_value=0,
                         max_value=100,
                     ),
                     "views": st.column_config.NumberColumn(
                         "Total Views",
                         format="%d ⭐"
                     )
                 },
                 use_container_width=True
             )

        # Interactive Data Table with Links
        st.subheader("📋 Detailed Content Log")
        st.markdown("Click any URL to open the video/comment.")
        
        # Prepare display copy
        display_df = df.copy()
        
        # Configure columns for clickable links
        st.dataframe(
            display_df[[
                'publish_date', 'author', 'caption', 'video_url', 
                'views', 'likes', 'comments', 'engagement_rate', 'sentiment'
            ]],
            column_config={
                "video_url": st.column_config.LinkColumn(
                    "Video Link",
                    display_text="Watch Video 🔗"
                ),
                "author": st.column_config.TextColumn("Creator"),
                "publish_date": st.column_config.DatetimeColumn("Posted", format="D MMM YYYY, HH:mm"),
                "views": st.column_config.NumberColumn("Views", format="%d"),
                "engagement_rate": st.column_config.NumberColumn("Eng. Rate", format="%.2f%%"),
                "sentiment": st.column_config.TextColumn("Mood")
            },
            hide_index=True,
            use_container_width=True
        )

        # COMMENTS SECTION
        st.divider()
        st.header("💬 Detailed Comment Analysis")
        
        df_c = st.session_state.df_comments_filtered
        
        if not df_c.empty:
            ccol1, ccol2 = st.columns([1, 2])
            
            with ccol1:
                st.subheader("Comment Sentiment")
                c_sentiment_counts = df_c['sentiment'].value_counts().reset_index()
                c_sentiment_counts.columns = ['sentiment', 'count']
                
                fig_c_pie = px.pie(
                    c_sentiment_counts,
                    values='count',
                    names='sentiment',
                    color='sentiment',
                    color_discrete_map={'positive': '#00CC96', 'neutral': '#AB63FA', 'negative': '#EF553B'},
                    hole=0.4
                )
                fig_c_pie.update_layout(
                    paper_bgcolor='rgba(0,0,0,0)',
                    font_color='white',
                    showlegend=True,
                    legend=dict(orientation="h", yanchor="bottom", y=-0.1, xanchor="center", x=0.5)
                )
                st.plotly_chart(fig_c_pie, use_container_width=True)
                
                # Sentiment Score Distribution
                fig_c_hist = px.histogram(
                    df_c, 
                    x='sentiment_score',
                    nbins=20,
                    color_discrete_sequence=['#764ba2'],
                    title="Comment Sentiment Score Distribution"
                )
                fig_c_hist.update_layout(paper_bgcolor='rgba(0,0,0,0)', font_color='white')
                st.plotly_chart(fig_c_hist, use_container_width=True)
            
            with ccol2:
                st.subheader("Trending Comment Keywords")
                comment_text = ' '.join(df_c['text'].dropna().astype(str))
                if comment_text:
                    c_wordcloud = create_wordcloud(comment_text)
                    if c_wordcloud:
                        st.pyplot(c_wordcloud, use_container_width=True)
                
                st.subheader("Top Liked Comments")
                top_comments = df_c.sort_values('likes', ascending=False).head(10)
                st.dataframe(
                    top_comments[['author', 'text', 'likes', 'date', 'sentiment']],
                    column_config={
                        "date": st.column_config.DatetimeColumn("Date", format="D MMM, HH:mm"),
                        "likes": st.column_config.NumberColumn("Likes", format="%d ❤️"),
                        "sentiment": st.column_config.TextColumn("Sentiment")
                    },
                    hide_index=True,
                    use_container_width=True
                )
            
            st.subheader("Raw Comment Feed")
            st.dataframe(
                df_c[['date', 'author', 'text', 'likes', 'sentiment', 'video_id']],
                column_config={
                    "date": st.column_config.DatetimeColumn("Date", format="D MMM YY, HH:mm"),
                    "video_id": st.column_config.TextColumn("Video ID")
                },
                hide_index=True,
                use_container_width=True
            )
        else:
            st.info("No comment data available for the selected period. Ensure you scrape with 'Scrape Comments' enabled.")
        
    else:
        # Welcome screen
        st.info("👋 Welcome! Use the sidebar to scrape TikTok data or load existing data from Google Sheets.")
        
        col1, col2, col3 = st.columns(3)
        
        with col1:
            st.markdown("### 🔍 Scrape Data")
            st.write("Search by hashtag or username to collect TikTok videos")
        
        with col2:
            st.markdown("### 📊 Analyze")
            st.write("Get sentiment analysis, engagement metrics, and trends")
        
        with col3:
            st.markdown("### 💾 Store")
            st.write("Automatically save to Google Sheets for persistence")
    
    # Footer
    st.divider()
    sheets = get_sheets_manager()
    if sheets.get_sheet_url():
        st.info(f"📊 Data stored in: [{sheets.sheet_name}]({sheets.get_sheet_url()})")


if __name__ == "__main__":
    main()
