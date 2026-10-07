"""Fail CI when an internal link or #anchor target is broken.

Usage:  python check_links.py
Checks every *.html (except 404.html) for:
  - href="some-page.html" that has no such file
  - href="page.html#frag" / href="#frag" where #frag has no id="frag"
External http(s) links, mailto:, data:, and javascript: are skipped.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
HREF = re.compile(r'href="([^"]+)"')
ID = re.compile(r'id="([^"]+)"')


def main() -> int:
    pages = sorted(p for p in ROOT.glob("*.html") if p.name != "404.html")
    ids = {}
    for page in pages:
        text = page.read_text(encoding="utf-8")
        ids[page.name] = set(ID.findall(text))

    errors = []
    for page in pages:
        text = page.read_text(encoding="utf-8")
        for href in HREF.findall(text):
            if not href or href.startswith(("http", "mailto:", "data:", "javascript:", "feed.xml", "#__")):
                continue
            if href.startswith("#"):
                if href[1:] not in ids[page.name]:
                    errors.append(f"{page.name}: missing anchor {href}")
                continue
            target, _, frag = href.partition("#")
            if not target or target.startswith(("http", "//")):
                continue
            target = target.split("?")[0]
            if not target.endswith((".html", ".xml", ".pdf", ".png", ".jpg", ".svg", ".webp", ".gif", ".css", ".js")):
                continue
            if target.endswith(".html") and target not in ids:
                errors.append(f"{page.name}: missing page {href}")
            elif frag and target.endswith(".html") and frag not in ids.get(target, set()):
                errors.append(f"{page.name}: {target} has no #{frag}")

    if errors:
        print("Broken links found:")
        for e in errors:
            print("  -", e)
        return 1
    print(f"OK: {len(pages)} pages, links resolve.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
