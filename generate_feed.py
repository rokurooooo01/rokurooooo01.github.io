"""Generate feed.xml (RSS 2.0) from feed_items.json, appending recent tweets.

Curated site updates live in feed_items.json:
    { "title": ..., "link": ..., "date": ISO-8601, "description": ... }
Tweets from twitter_posts.json are appended automatically (same pattern as
the existing sync_tweets.py GitHub Action).

Usage:
  python generate_feed.py            # print the feed to stdout
  python generate_feed.py --write    # write feed.xml
"""
import json
import sys
from datetime import datetime, timezone
from html import escape
from pathlib import Path

BASE = "https://rokurooooo01.github.io"
MAX_ITEMS = 20

ROOT = Path(__file__).resolve().parent


def utc(value: str) -> str:
    dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S +0000")


def load(name):
    path = ROOT / name
    if not path.exists():
        return []
    return json.loads(path.read_text(encoding="utf-8"))


def build():
    items = []
    for it in load("feed_items.json"):
        items.append({
            "title": it.get("title", "Update"),
            "link": it.get("link", BASE + "/"),
            "date": utc(it.get("date", "2026-01-01T00:00:00Z")),
            "desc": it.get("description", ""),
        })
    for tw in load("twitter_posts.json"):
        first_line = tw.get("text", "").splitlines()[0][:80]
        items.append({
            "title": "post: " + first_line,
            "link": f"https://x.com/rokurooooo07/status/{tw.get('id', '')}",
            "date": utc(tw.get("created_at", "2026-01-01T00:00:00Z")),
            "desc": tw.get("text", ""),
        })

    items.sort(key=lambda e: e["date"], reverse=True)
    items = items[:MAX_ITEMS]

    def x(s):
        return escape(s, quote=True)

    body = "\n".join(
        "    <item>\n"
        f'      <title>{x(i["title"])}</title>\n'
        f'      <link>{x(i["link"])}</link>\n'
        f'      <guid isPermaLink="false">{x(i["link"]) + "#" + x(i["date"])}</guid>\n'
        f'      <pubDate>{x(i["date"])}</pubDate>\n'
        f'      <description>{x(i["desc"])}</description>\n'
        "    </item>"
        for i in items
    )
    now = datetime.now(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S +0000")
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n'
        "  <channel>\n"
        "    <title>rokurooooo</title>\n"
        f"    <link>{BASE}/</link>\n"
        "    <description>rokuro's website — math notes, daily log & site updates.</description>\n"
        "    <language>en</language>\n"
        f"    <lastBuildDate>{now}</lastBuildDate>\n"
        f'    <atom:link href="{BASE}/feed.xml" rel="self" type="application/rss+xml" />\n'
        f"{body}\n"
        "  </channel>\n"
        "</rss>\n"
    )


def main():
    xml = build()
    if "--write" in sys.argv:
        (ROOT / "feed.xml").write_text(xml, encoding="utf-8")
        print("Wrote feed.xml")
    else:
        print(xml)


if __name__ == "__main__":
    main()