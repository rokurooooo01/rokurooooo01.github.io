import os
import json
import urllib.request
import urllib.parse
from datetime import datetime

# Configuration
BEARER_TOKEN = os.getenv('X_BEARER_TOKEN')
USERNAME = 'rokurooooo07'
OUTPUT_FILE = 'twitter_posts.json'

def make_request(url, params=None):
    if params:
        query_string = urllib.parse.urlencode(params)
        url = f"{url}?{query_string}"
    
    req = urllib.request.Request(url)
    req.add_header("Authorization", f"Bearer {BEARER_TOKEN}")
    
    try:
        with urllib.request.urlopen(req) as response:
            if response.status == 200:
                data = response.read().decode('utf-8')
                return json.loads(data)
    except Exception as e:
        print(f"Request error for {url}: {e}")
    return None

def get_user_id(username):
    url = f"https://api.twitter.com/2/users/by/username/{username}"
    res = make_request(url)
    if res and 'data' in res:
        return res['data']['id']
    return None

def fetch_tweets(user_id):
    url = f"https://api.twitter.com/2/users/{user_id}/tweets"
    params = {
        "max_results": 10,
        "tweet.fields": "created_at,public_metrics",
        "exclude": "retweets,replies"
    }
    res = make_request(url, params)
    if res and 'data' in res:
        return res['data']
    return []

def main():
    if not BEARER_TOKEN:
        print("X_BEARER_TOKEN not found in environment variables. Skipping sync.")
        return

    print(f"Fetching User ID for @{USERNAME}...")
    user_id = get_user_id(USERNAME)
    if not user_id:
        print(f"Could not resolve User ID for @{USERNAME}")
        return

    print(f"Fetching tweets for User ID {user_id}...")
    tweets = fetch_tweets(user_id)
    
    if tweets:
        formatted_tweets = []
        for tweet in tweets:
            formatted_tweets.append({
                "id": tweet.get("id"),
                "text": tweet.get("text"),
                "created_at": tweet.get("created_at")
            })
        
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(formatted_tweets, f, indent=4, ensure_ascii=False)
        print(f"Successfully saved {len(formatted_tweets)} tweets to {OUTPUT_FILE}")
    else:
        print("No tweets found or error occurred.")

if __name__ == "__main__":
    main()
