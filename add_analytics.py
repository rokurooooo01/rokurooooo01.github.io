"""Idempotent: add the js/analytics.js loader to every page that already
uses the Vercel Insights script (so the Umami loader sits right next to it).

Run:  python add_analytics.py
"""
from pathlib import Path

TAG = '<script defer src="js/analytics.js"></script>'
MARKER = '<script defer src="/_vercel/insights/script.js"></script>'

for p in sorted(Path(".").glob("*.html")):
    text = p.read_text(encoding="utf-8")
    if TAG in text:
        print(f"  unchanged: {p.name}")
        continue
    if MARKER in text:
        text = text.replace(MARKER, TAG + "\n    " + MARKER)
        p.write_text(text, encoding="utf-8")
        print(f"  updated: {p.name}")
    else:
        print(f"  skip (no marker): {p.name}")