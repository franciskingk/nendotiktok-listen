"""
Analytics module for TikTok data analysis
"""
import pandas as pd
from textblob import TextBlob
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from collections import Counter
import re


class TikTokAnalyzer:
    def __init__(self):
        """Initialize analyzer with sentiment tools"""
        self.vader = SentimentIntensityAnalyzer()
    
    def calculate_engagement_rate(self, df):
        """
        Calculate engagement rate for each video
        Engagement Rate = (Likes + Comments + Shares) / Views * 100
        
        Args:
            df: DataFrame with TikTok data
            
        Returns:
            DataFrame with engagement_rate column added
        """
        if df.empty:
            return df
        
        df = df.copy()
        
        # Calculate engagement rate
        df['engagement_rate'] = (
            (df['likes'] + df['comments'] + df['shares']) / 
            df['views'].replace(0, 1) * 100
        ).round(2)
        
        return df
    
    def analyze_sentiment_textblob(self, text):
        """
        Analyze sentiment using TextBlob
        
        Returns:
            Dictionary with polarity and subjectivity
        """
        if not text or pd.isna(text):
            return {'polarity': 0, 'subjectivity': 0, 'sentiment': 'neutral'}
        
        try:
            blob = TextBlob(str(text))
            polarity = blob.sentiment.polarity
            
            if polarity > 0.1:
                sentiment = 'positive'
            elif polarity < -0.1:
                sentiment = 'negative'
            else:
                sentiment = 'neutral'
            
            return {
                'polarity': round(polarity, 3),
                'subjectivity': round(blob.sentiment.subjectivity, 3),
                'sentiment': sentiment
            }
        except:
            return {'polarity': 0, 'subjectivity': 0, 'sentiment': 'neutral'}
    
    def analyze_sentiment_vader(self, text):
        """
        Analyze sentiment using VADER
        
        Returns:
            Dictionary with compound score and sentiment label
        """
        if not text or pd.isna(text):
            return {'compound': 0, 'sentiment': 'neutral'}
        
        try:
            scores = self.vader.polarity_scores(str(text))
            compound = scores['compound']
            
            if compound >= 0.05:
                sentiment = 'positive'
            elif compound <= -0.05:
                sentiment = 'negative'
            else:
                sentiment = 'neutral'
            
            return {
                'compound': round(compound, 3),
                'sentiment': sentiment
            }
        except:
            return {'compound': 0, 'sentiment': 'neutral'}
    
    def add_sentiment_analysis(self, df, method='vader', text_column='caption'):
        """
        Add sentiment analysis to DataFrame
        
        Args:
            df: DataFrame with text column
            method: 'vader' or 'textblob'
            text_column: Name of column containing text to analyze
            
        Returns:
            DataFrame with sentiment columns added
        """
        if df.empty or text_column not in df.columns:
            return df
        
        df = df.copy()
        
        if method == 'vader':
            sentiments = df[text_column].apply(self.analyze_sentiment_vader)
            df['sentiment_score'] = sentiments.apply(lambda x: x['compound'])
            df['sentiment_score'] = sentiments.apply(lambda x: x['compound'])
            df['sentiment'] = sentiments.apply(lambda x: x['sentiment'])
        else:
            sentiments = df[text_column].apply(self.analyze_sentiment_textblob)
            df['sentiment_score'] = sentiments.apply(lambda x: x['polarity'])
            df['sentiment'] = sentiments.apply(lambda x: x['sentiment'])
        
        return df
    
    def extract_word_frequency(self, df, top_n=20):
        """
        Extract most common words from captions
        
        Args:
            df: DataFrame with caption column
            top_n: Number of top words to return
            
        Returns:
            List of tuples (word, count)
        """
        if df.empty or 'caption' not in df.columns:
            return []
        
        # Combine all captions
        all_text = ' '.join(df['caption'].dropna().astype(str))
        
        # Remove hashtags, mentions, URLs, and special characters
        all_text = re.sub(r'#\w+', '', all_text)
        all_text = re.sub(r'@\w+', '', all_text)
        all_text = re.sub(r'http\S+', '', all_text)
        all_text = re.sub(r'[^\w\s]', '', all_text)
        
        # Convert to lowercase and split
        words = all_text.lower().split()
        
        # Remove common stop words
        stop_words = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
            'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
            'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that',
            'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my',
            'your', 'his', 'her', 'its', 'our', 'their'
        }
        
        words = [w for w in words if w not in stop_words and len(w) > 2]
        
        # Count frequency
        word_counts = Counter(words)
        
        return word_counts.most_common(top_n)
    
    def aggregate_by_time(self, df, freq='D'):
        """
        Aggregate metrics by time period
        
        Args:
            df: DataFrame with publish_date column
            freq: Pandas frequency string ('H' for hour, 'D' for day, 'W' for week)
            
        Returns:
            DataFrame aggregated by time period
        """
        if df.empty or 'publish_date' not in df.columns:
            return pd.DataFrame()
        
        df = df.copy()
        
        # Ensure publish_date is datetime
        df['publish_date'] = pd.to_datetime(df['publish_date'], errors='coerce')
        df = df.dropna(subset=['publish_date'])
        
        if df.empty:
            return pd.DataFrame()
        
        # Set index and resample
        df_time = df.set_index('publish_date')
        
        aggregated = df_time.resample(freq).agg({
            'video_id': 'count',
            'views': 'sum',
            'likes': 'sum',
            'comments': 'sum',
            'shares': 'sum',
            'saves': 'sum' if 'saves' in df_time.columns else 'max' # max is a safe fallback if column missing
        }).rename(columns={'video_id': 'video_count'})
        
        if 'saves' not in df_time.columns:
            aggregated = aggregated.drop(columns=['saves'], errors='ignore')
        
        return aggregated.reset_index()
    
    def get_top_posts(self, df, metric='engagement_rate', top_n=10):
        """
        Get top performing posts by specified metric
        
        Args:
            df: DataFrame with TikTok data
            metric: Column name to sort by
            top_n: Number of top posts to return
            
        Returns:
            DataFrame with top posts
        """
        if df.empty or metric not in df.columns:
            return pd.DataFrame()
        
        return df.nlargest(top_n, metric)
    
    def get_sentiment_distribution(self, df):
        """
        Get distribution of sentiment categories
        
        Returns:
            Dictionary with sentiment counts
        """
        if df.empty or 'sentiment' not in df.columns:
            return {'positive': 0, 'neutral': 0, 'negative': 0}
        
        sentiment_counts = df['sentiment'].value_counts().to_dict()
        
        # Ensure all categories are present
        return {
            'positive': sentiment_counts.get('positive', 0),
            'neutral': sentiment_counts.get('neutral', 0),
            'negative': sentiment_counts.get('negative', 0)
        }
