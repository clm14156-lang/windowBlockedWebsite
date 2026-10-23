"""Optimize supplied source artwork without modifying the original files."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
ASSETS.mkdir(exist_ok=True)
SOURCES = {
    "首页_背景.png": "hero-bg.webp",
    "网站第三页背景.png": "mountains-bg.webp",
    "网站第四页.png": "statistics-bg.webp",
    "第五页_背景.png": "pricing-bg.webp",
    "第六页_背景.png": "faq-bg.webp",
    "最后一页素材.png": "closing-bg.webp",
    "第三页_背景.png": "windows-desktop.webp",
    "网站第二页01.png": "app-start.webp",
    "网站第二页02.png": "app-blocklist.webp",
}
for source, target in SOURCES.items():
    artwork = Image.open(ROOT / "sc" / source)
    artwork.save(ASSETS / target, "WEBP", quality=90, method=6)
# The focus window uses the complete user-supplied assets/focus_scene01.png
# directly. Do not crop it or regenerate it from the old software screenshot.
print(f"Prepared {len(SOURCES)} assets in {ASSETS}; focus_scene01.png is preserved unchanged")
