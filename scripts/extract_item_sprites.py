"""Extract individual item sprites from a 5x4 item sheet.

Uses alpha projection profiles to find the real gaps between items (robust to
an uneven grid), trims each item to its tight alpha bounding box, then centers
it on a 1:1 transparent square with slight padding.

Usage:
    py scripts/extract_item_sprites.py <sheet> [--out DIR] [--names a,b,c,...]

If --names is omitted a built-in mapping is chosen from the sheet filename.
"""

import argparse
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_OUT = ROOT / "Available Assets" / "Icons" / "Items"

# Row-major names (5 cols x 4 rows) per known sheet.
NAME_SETS = {
    "T_ItemSheet_Uncut": [
        "fishing_rod", "tin_can", "driftwood", "rope_coil", "old_boot",
        "bait_bucket", "seashell", "fish_hook", "pearl", "compass",
        "lantern", "coral", "message_in_bottle", "goblet", "pirate_hat",
        "treasure_map", "spyglass", "pirate_hook", "ornate_key", "cutlass",
    ],
    "T_ItemSheet_Grasslands": [
        "grass_tuft", "pebble", "twig_bundle", "clover", "mushroom",
        "acorn", "berries", "honeycomb", "snail_shell", "cattails",
        "fern", "herb_pouch", "firefly_jar", "wooden_flute", "antler_amulet",
        "mossy_key", "wooden_medallion", "clover_emblem", "emerald_staff",
        "emerald_scepter",
    ],
}

ALPHA_THRESHOLD = 16   # alpha above this counts as "content"
MIN_RUN = 4            # min consecutive content lines to count as a band/segment
MIN_GAP = 3            # min consecutive empty lines to split bands/segments
PAD_RATIO = 0.06       # padding as a fraction of the longest side
MIN_PAD = 6


def runs(counts, threshold):
    active = [c > threshold for c in counts]
    spans = []
    i, n = 0, len(active)
    while i < n:
        if active[i]:
            j = i
            while j < n and active[j]:
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
    return [(s, e) for s, e in merged if e - s >= MIN_RUN]


def col_counts(px, x0, x1, y0, y1):
    return [sum(1 for y in range(y0, y1) if px[x, y] > ALPHA_THRESHOLD)
            for x in range(x0, x1)]


def row_counts(px, x0, x1, y0, y1):
    return [sum(1 for x in range(x0, x1) if px[x, y] > ALPHA_THRESHOLD)
            for y in range(y0, y1)]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("sheet", help="path to the item sheet PNG")
    ap.add_argument("--out", default=str(DEFAULT_OUT))
    ap.add_argument("--names", default=None, help="comma separated id list")
    args = ap.parse_args()

    src = Path(args.sheet)
    if not src.is_absolute():
        src = ROOT / src
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    if args.names:
        names = [n.strip() for n in args.names.split(",") if n.strip()]
    else:
        names = NAME_SETS.get(src.stem)
        if names is None:
            raise SystemExit(f"No built-in names for '{src.stem}'; pass --names.")

    im = Image.open(src).convert("RGBA")
    px = im.split()[3].load()
    W, H = im.size

    bands = runs(row_counts(px, 0, W, 0, H), 0)
    print(f"{src.name}: {len(bands)} row bands")

    boxes = []
    for (by0, by1) in bands:
        cols = runs(col_counts(px, 0, W, by0, by1), 0)
        print(f"  band {by0}-{by1}: {len(cols)} columns")
        for (bx0, bx1) in cols:
            boxes.append((bx0, by0, bx1, by1))

    print(f"Total cells: {len(boxes)} (expected {len(names)})")
    if len(boxes) != len(names):
        raise SystemExit("Cell count mismatch - adjust thresholds before export.")

    for (x0, y0, x1, y1), name in zip(boxes, names):
        cell = im.crop((x0, y0, x1, y1))
        item = cell.crop(cell.getbbox())
        w, h = item.size
        side = max(w, h)
        pad = max(MIN_PAD, round(side * PAD_RATIO))
        canvas = side + pad * 2
        sprite = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))
        sprite.paste(item, ((canvas - w) // 2, (canvas - h) // 2), item)
        sprite.save(out / f"{name}.png")
        print(f"  {name:18s} {w:3d}x{h:3d} -> {canvas}x{canvas}")

    print(f"\nDone. {len(names)} sprites -> {out}")


if __name__ == "__main__":
    main()
