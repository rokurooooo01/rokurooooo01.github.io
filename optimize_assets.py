"""Convert .gif stickers/badges to animated .webp (smaller files, far less CPU).

GIFs are expensive to decode and animate; animated WebP looks identical in
all modern browsers while cutting payload and battery/CPU usage.

Usage:
  python optimize_assets.py            # convert + report, leave HTML alone
  python optimize_assets.py --apply    # also rewrite images/*.gif refs to .webp

Only files that end up SMALLER keep their .webp twin (originals are never
deleted); the report shows each before/after size and a verdict.

Requires Pillow:  pip install -r requirements.txt
"""
import argparse
from pathlib import Path

from PIL import Image, ImageSequence

ROOT = Path(__file__).resolve().parent
IMAGES = ROOT / "images"


def convert_gif(src: Path) -> Path:
    dst = src.with_suffix(".webp")
    img = Image.open(src)
    frames, durations = [], []
    for frame in ImageSequence.Iterator(img):
        frames.append(frame.convert("RGBA").copy())
        durations.append(frame.info.get("duration", img.info.get("duration", 100)))
    loop = img.info.get("loop", 0)
    if len(frames) > 1:
        frames[0].save(
            dst, "WEBP",
            save_all=True, append_images=frames[1:],
            duration=durations, loop=loop, quality=85, method=6,
        )
    else:
        frames[0].save(dst, "WEBP", quality=85, method=6)
    return dst


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    args = ap.parse_args()

    results = []
    for src in sorted(IMAGES.glob("*.gif")):
        dst = convert_gif(src)
        old, new = src.stat().st_size, dst.stat().st_size
        ok = new < old
        results.append((src.name, old, new, ok))
        if not ok:
            dst.unlink(missing_ok=True)  # keep the gif, drop the bigger webp

    print(f"{'file':<22}{'gif':>10}{'webp':>10}{'delta':>10}  verdict")
    for name, old, new, ok in results:
        delta = (new - old) / old * 100
        verdict = "OK" if ok else "keep gif"
        print(f"{name:<22}{old:>10}{new:>10}{delta:>9.1f}%  {verdict}")

    won = sum(1 for _, _, _, ok in results if ok)
    print(f"\n{len(results)} converted — {won} smaller (webp kept), "
          f"{len(results) - won} bigger (reverted to gif).")

    if args.apply:
        changed = 0
        for page in ROOT.glob("*.html"):
            text = page.read_text(encoding="utf-8")
            new_text = text
            for name, _, _, ok in results:
                if ok:
                    new_text = new_text.replace(
                        f"images/{name}", f"images/{name[:-4]}.webp"
                    )
            if new_text != text:
                page.write_text(new_text, encoding="utf-8")
                changed += 1
        print(f"Rewrote references in {changed} html file(s).")


if __name__ == "__main__":
    main()