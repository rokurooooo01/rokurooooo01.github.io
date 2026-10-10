"""Generate sitemap.xml from the HTML pages actually in this folder.

Usage:
  python build_sitemap.py            # print the sitemap to stdout
  python build_sitemap.py --write    # write sitemap.xml

Changefreq/priority heuristics:
  index/today/twitter -> frequent; math hub -> weekly; the rest -> monthly.
  404.html and *-print.html are excluded (not indexable content).
"""
import sys
from pathlib import Path

BASE = "https://rokurooooo01.github.io"
ROOT = Path(__file__).resolve().parent

EXCLUDE = {"404.html", "foundational-mathematics-print.html"}

WEEKLY = {"mathematics.html", "foundational-mathematics.html", "fyp.html"}
DAILY = {"index.html", "today.html", "twitter.html"}


def entry(page: str) -> str:
    if page == "index.html":
        loc, priority = BASE + "/", "1.0"
    else:
        loc, priority = f"{BASE}/{page}", ("0.9" if page in WEEKLY else "0.7")
    if page in DAILY:
        changefreq = "daily"
    elif page in WEEKLY:
        changefreq = "weekly"
    else:
        changefreq = "monthly"
    # Stability: no <lastmod> — it refreshed to today's date on every run,
    # which made the scheduled workflow commit (and redeploy Pages) daily
    # even when nothing changed. changefreq/priority carry the signal.
    return (
        "  <url>\n"
        f"    <loc>{loc}</loc>\n"
        f"    <changefreq>{changefreq}</changefreq>\n"
        f"    <priority>{priority}</priority>\n"
        "  </url>"
    )


def build() -> str:
    pages = sorted(
        p.name for p in ROOT.glob("*.html")
        if p.name not in EXCLUDE and not p.name.startswith("_")
    )
    # index first, then the rest alphabetically
    pages.sort(key=lambda n: (n != "index.html", n))
    body = "\n".join(entry(p) for p in pages)
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f"{body}\n"
        "</urlset>\n"
    )


def main():
    xml = build()
    if "--write" in sys.argv:
        (ROOT / "sitemap.xml").write_text(xml, encoding="utf-8")
        print("Wrote sitemap.xml")
    else:
        print(xml)


if __name__ == "__main__":
    main()
