import os
import requests
import json
from datetime import datetime

# Configuration
BEARER_TOKEN = os.getenv('X_BEARER_TOKEN')
USER_ID = '1284301732143484929D'  # You will need to replace this with your actual numeric X User ID
OUTPUT_FILE = 'twitter_posts.json'

def get_user_id(username):
    url = f"https://api.twitter.com/2/users/by/username/{username}"
    headers = {"Authorization": f"Bearer {BEARER_TOKEN}"}
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        return response.json()['data']['id']
    else:
        print(f"Error fetching user ID: {response.text}")
        return None

def fetch_tweets():
    # Using User ID to get tweets
    url = f"https://api.twitter.com/2/users/{USER_ID}/tweets"
    params = {
        "max_results": 10,
        "tweet.fields": "created_at,public_metrics",
        "expansions": "author_id"
    }
    headers = {"Authorization": f"Bearer {BEARER_TOKEN}"}
    
    response = requests.get(url, headers=headers, params=params)
    if response.status_code == 200:
        return response.json().get('data', [])
    else:
        print(f"Error fetching tweets: {response.text}")
        return []

def main():
    if not BEARER_TOKEN:
        print("X_BEARER_TOKEN not found in environment variables")
        return

    print("Fetching tweets...")
    tweets = fetch_tweets()
    
    if tweets:
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(tweets, f, indent=4, ensure_ascii=False)
        print(f"Successfully saved {len(tweets)} tweets to {OUTPUT_FILE}")
    else:
        print("No tweets found or error occurred.")

if __name__ == "__main__":
    main()
