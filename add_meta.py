"""Add consistent SEO / social-sharing meta tags to every page. Idempotent.

Adds the tags this site was missing (canonical URL, RSS alternate link,
og:site_name, og:image, Twitter cards) and fills in missing og:title /
og:type / og:url / og:description when a page lacks them.

Run:  python add_meta.py
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BASE = "https://rokurooooo01.github.io"
SITE_NAME = "rokurooooo"
OG_IMAGE = f"{BASE}/images/og-cover.png"

PAGES = [
    "index.html", "about.html", "mathematics.html", "arithmetic.html",
    "number-system.html", "limits-and-continuity.html",
    "differential-equations.html", "why-mathematics.html", "topics.html",
    "favorites.html", "mood-gallery.html", "today.html", "twitter.html",
]


def grab(text, pattern):
    m = re.search(pattern, text, re.DOTALL)
    if not m:
        return None
    return m.group(1) if m.groups() else m.group(0)


def has(text, pattern):
    return re.search(pattern, text, re.DOTALL) is not None


def process(page: str) -> bool:
    path = ROOT / page
    if not path.exists():
        print(f"  skip (missing): {page}")
        return False
    text = path.read_text(encoding="utf-8")

    if 'rel="canonical"' in text:
        print(f"  unchanged: {page}")
        return False

    url = BASE if page == "index.html" else f"{BASE}/{page}"
    title = grab(text, r"<title>([^<]+)</title>") or SITE_NAME
    og_title = grab(text, r'property="og:title"\s+content="([^"]+)"') or title
    og_title = og_title.rstrip("'")
    og_desc = (
        grab(text, r'property="og:description"\s+content="([^"]+)"')
        or grab(text, r'name="description"\s+content="([^"]+)"')
        or "Personal homepage."
    )

    lines = [
        f'<link rel="canonical" href="{url}" />',
        f'<link rel="alternate" type="application/rss+xml" title="RSS" href="{BASE}/feed.xml" />',
        f'<meta property="og:site_name" content="{SITE_NAME}" />',
        f'<meta property="og:image" content="{OG_IMAGE}" />',
        '<meta name="twitter:card" content="summary" />',
        f'<meta name="twitter:title" content="{og_title}" />',
        f'<meta name="twitter:description" content="{og_desc}" />',
        f'<meta name="twitter:image" content="{OG_IMAGE}" />',
    ]
    if not has(text, r'property="og:title"'):
        lines += [
            f'<meta property="og:title" content="{og_title}" />',
            '<meta property="og:type" content="website" />',
            f'<meta property="og:url" content="{url}" />',
        ]
    if not has(text, r'property="og:description"'):
        lines.append(f'<meta property="og:description" content="{og_desc}" />')

    marker = '<link rel="icon"'
    if marker not in text:
        marker = '<link rel="stylesheet"'

    idx = text.index(marker)
    line_start = text.rfind("\n", 0, idx) + 1
    line_end = text.find("\n", idx)
    if line_end == -1:
        line_end = len(text)
    indent = text[line_start:idx]
    line = text[line_start:line_end]  # full marker line, original indent kept
    pre, post = text[:line_start], text[line_end:]

    inserted = "\n".join(indent + ln for ln in lines)
    text = pre + inserted + "\n" + line + post

    path.write_text(text, encoding="utf-8")
    print(f"  updated: {page}")
    return True


def main():
    print(f"Adding meta tags under {ROOT}")
    for page in PAGES:
        process(page)


if __name__ == "__main__":
    main()