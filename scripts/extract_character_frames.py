"""Extract character animation frames from a grid sheet into uniform flipbook
frames.

Unlike the item-icon extractor (which tightly trims + centers each sprite on
its own square), flipbook frames must share ONE canvas size and a consistent
anchor so the character does not jitter between frames during playback. Here we
detect the grid, then place every frame on the same NxN canvas anchored
bottom-centre (a stable ground baseline for a ground creature).

Usage:
    py scripts/extract_character_frames.py <sheet> --out DIR --names a,b,c,d
        [--canvas 256] [--baseline 24] [--prefix Name]
"""

import argparse
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
ALPHA_THRESHOLD = 16
MIN_RUN = 4
MIN_GAP = 3


def runs(counts):
    spans = []
    i, n = 0, len(counts)
    while i < n:
        if counts[i] > 0:
            j = i
            while j < n and counts[j] > 0:
                j += 1
            spans.append([i, j])
            i = j
        else:
            i += 1
    merged = []
    for s in spans:
        if merged and s[0] - merged[-1][1] < MIN_GAP:
            merged[-1][1] = s[1]
        else:
            merged.append(s)
    return [(a, b) for a, b in merged if b - a >= MIN_RUN]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("sheet")
    ap.add_argument("--out", required=True)
    ap.add_argument("--names", required=True, help="comma separated frame labels in reading order")
    ap.add_argument("--canvas", type=int, default=256)
    ap.add_argument("--baseline", type=int, default=24, help="px from canvas bottom to the frame's lowest pixel")
    ap.add_argument("--prefix", default="")
    args = ap.parse_args()

    src = Path(args.sheet)
    if not src.is_absolute():
        src = ROOT / src
    out = Path(args.out)
    if not out.is_absolute():
        out = ROOT / out
    out.mkdir(parents=True, exist_ok=True)
    names = [n.strip() for n in args.names.split(",") if n.strip()]

    im = Image.open(src).convert("RGBA")
    px = im.split()[3].load()
    W, H = im.size

    # Detect grid cells in reading order (row-major).
    rows = runs([sum(1 for x in range(W) if px[x, y] > ALPHA_THRESHOLD) for y in range(H)])
    cells = []
    for (y0, y1) in rows:
        cols = runs([sum(1 for y in range(y0, y1) if px[x, y] > ALPHA_THRESHOLD) for x in range(W)])
        for (x0, x1) in cols:
            cells.append((x0, y0, x1, y1))

    print(f"{src.name}: detected {len(cells)} frames (expected {len(names)})")
    if len(cells) != len(names):
        raise SystemExit("Frame count mismatch - adjust thresholds before export.")

    # Tight content crops first, so we can confirm they all fit the canvas.
    crops = []
    for c in cells:
        cell = im.crop(c)
        crops.append(cell.crop(cell.getbbox()))
    maxw = max(cr.width for cr in crops)
    maxh = max(cr.height for cr in crops)
    print(f"max content footprint: {maxw}x{maxh}; canvas {args.canvas}x{args.canvas}, baseline {args.baseline}px")
    if maxw > args.canvas or maxh > args.canvas - args.baseline:
        raise SystemExit("Content does not fit the chosen canvas - increase --canvas.")

    C = args.canvas
    for crop, name in zip(crops, names):
        frame = Image.new("RGBA", (C, C), (0, 0, 0, 0))
        x = (C - crop.width) // 2                 # horizontal: centre
        y = C - args.baseline - crop.height       # vertical: bottom-anchored
        frame.paste(crop, (x, y), crop)
        fname = f"{args.prefix}{name}.png" if args.prefix else f"{name}.png"
        frame.save(out / fname)
        print(f"  {fname:28s} content {crop.width:3d}x{crop.height:3d} @ ({x},{y})")

    print(f"\nDone. {len(names)} uniform {C}x{C} frames -> {out}")


if __name__ == "__main__":
    main()
