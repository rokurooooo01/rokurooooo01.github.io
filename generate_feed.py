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
import re
import sys
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from html import escape
from pathlib import Path

BASE = "https://rokurooooo01.github.io"
MAX_ITEMS = 20

ROOT = Path(__file__).resolve().parent


def parse_dt(value: str) -> datetime:
    """Parse ISO-8601 or RFC-2822 into an aware datetime (UTC fallback)."""
    value = (value or "").strip()
    if not value:
        return datetime(2026, 1, 1, tzinfo=timezone.utc)
    try:
        # RFC-2822 (already-formatted feed dates, e.g. from a previous run)
        return parsedate_to_datetime(value)
    except (TypeError, ValueError):
        pass
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return datetime(2026, 1, 1, tzinfo=timezone.utc)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def utc(value: str) -> str:
    return parse_dt(value).astimezone(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S +0000")


def load(name):
    path = ROOT / name
    if not path.exists():
        return []
    return json.loads(path.read_text(encoding="utf-8"))


def is_placeholder_tweet(tw: dict) -> bool:
    """Skip local test fixtures (ids 1830000000000000001..3) once real data lands."""
    tid = str(tw.get("id", ""))
    return tid.startswith("183000000000000000")


def build():
    items = []
    for it in load("feed_items.json"):
        raw_date = it.get("date", "2026-01-01T00:00:00Z")
        items.append({
            "title": it.get("title", "Update"),
            "link": it.get("link", BASE + "/"),
            "date": utc(raw_date),
            "sort_key": parse_dt(raw_date).astimezone(timezone.utc),
            "desc": it.get("description", ""),
        })
    tweets = load("twitter_posts.json")
    has_real = any(not is_placeholder_tweet(tw) for tw in tweets)
    for tw in tweets:
        if has_real and is_placeholder_tweet(tw):
            continue
        if not tw.get("id") or not tw.get("text"):
            continue
        raw_date = tw.get("created_at", "2026-01-01T00:00:00Z")
        first_line = tw.get("text", "").splitlines()[0][:80]
        items.append({
            "title": "post: " + first_line,
            "link": f"https://x.com/rokurooooo07/status/{tw.get('id', '')}",
            "date": utc(raw_date),
            "sort_key": parse_dt(raw_date).astimezone(timezone.utc),
            "desc": tw.get("text", ""),
        })

    # Sort by actual datetime, NOT by the RFC-2822 string
    # (string sort puts "Wed, 02 Sep" before "Sat, 19 Sep" — wrong).
    items.sort(key=lambda e: e["sort_key"], reverse=True)
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
    # Stability: keep the previous lastBuildDate when the items are unchanged,
    # so the scheduled workflow only commits (and redeploys Pages) on real
    # content changes instead of every timestamp refresh.
    now = datetime.now(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S +0000")
    try:
        old = (ROOT / "feed.xml").read_text(encoding="utf-8")
        old_items = "\n".join(re.findall(r"    <item>.*?</item>", old, re.DOTALL))
        if old_items.strip() == body.strip():
            m = re.search(r"<lastBuildDate>(.*?)</lastBuildDate>", old)
            if m:
                now = m.group(1)
    except OSError:
        pass
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n'
        "  <channel>\n"
        "    <title>rokurooooo</title>\n"
        f"    <link>{BASE}/</link>\n"
        "    <description>rokuro&apos;s website — math notes, daily log &amp; site updates.</description>\n"
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