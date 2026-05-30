"""Resize + optimize generated Castaway Cove background layers into web JPGs.

Source PNGs are produced by the image generator (1536x1024). We downscale to a
mobile-friendly width and save progressive, optimized JPGs (no alpha needed -
these are opaque layers; depth/feathering is done with CSS masks at runtime).

Run from the project root with the `py` launcher:
    py scripts/optimize_backgrounds.py
"""

from __future__ import annotations

import os
from PIL import Image

ASSETS = os.path.join(
    os.path.expanduser("~"),
    ".cursor",
    "projects",
    "c-Users-Brand-Documents-Code-Projects-TapForBrainrots-WithPacks",
    "assets",
)
OUT_DIR = os.path.join("src", "assets", "backgrounds", "castaway_cove")

# (source raw png, output jpg, target width px, jpeg quality)
LAYERS = [
    ("cove_sky_raw.png", "sky.jpg", 1080, 82),
    ("cove_scene_raw.png", "scene.jpg", 1080, 84),
    ("cove_foreground_raw.png", "foreground.jpg", 1080, 84),
]


def optimize() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)
    for src_name, out_name, width, quality in LAYERS:
        src = os.path.join(ASSETS, src_name)
        img = Image.open(src).convert("RGB")
        w, h = img.size
        height = round(h * (width / w))
        img = img.resize((width, height), Image.LANCZOS)
        out = os.path.join(OUT_DIR, out_name)
        img.save(out, "JPEG", quality=quality, optimize=True, progressive=True)
        kb = os.path.getsize(out) / 1024
        print(f"{out_name}: {width}x{height}  {kb:.0f} KB")


if __name__ == "__main__":
    optimize()
