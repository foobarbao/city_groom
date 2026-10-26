"""Generate the icons of the installable web app from the CityPal logo.

The logo chosen by the project owner on 2026-10-26 (a heart-shaped padlock
made of locker compartments around the city, with a cargo bike) is kept at
full resolution in ``docs/brand/citypal-logo.jpg``, on a white background.
This script crops it to the drawing, then writes to ``public/icons/``:

- ``icon-192.png`` and ``icon-512.png``: the logo on white, used by the
  manifest and as favicon;
- ``icon-maskable-512.png``: smaller logo inside the circular safe zone, for
  Android launchers that cut icons into circles or rounded squares;
- ``apple-touch-icon.png``: 180 px icon read by iOS for the home screen.

Usage, from ``apps/customer`` (requires Pillow: ``pip install pillow``)::

    python3 scripts/make_icons.py
"""

from pathlib import Path

from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[3]
LOGO = ROOT / "docs" / "brand" / "citypal-logo.jpg"
OUT = Path(__file__).resolve().parents[1] / "public" / "icons"
WHITE = (255, 255, 255)

# (file name, size in px, share of the icon height taken by the logo).
# Maskable icons keep their content in the central circle of 80 % diameter
# (https://web.dev/articles/maskable-icon), hence a smaller logo.
ICONS = [
    ("icon-192.png", 192, 0.84),
    ("icon-512.png", 512, 0.84),
    ("icon-maskable-512.png", 512, 0.60),
    ("apple-touch-icon.png", 180, 0.80),
]


def crop_to_drawing(image: Image.Image) -> Image.Image:
    """Crop the white margins around the logo (JPEG noise below 40 ignored)."""
    background = Image.new("RGB", image.size, WHITE)
    mask = (
        ImageChops.difference(image, background).convert("L").point(lambda v: 255 if v > 40 else 0)
    )
    box = mask.getbbox()
    if box is None:
        raise SystemExit(f"{LOGO} looks empty")
    return image.crop(box)


def render(logo: Image.Image, size: int, share: float) -> Image.Image:
    """Centre the logo on a white square, its height being ``share`` of the side."""
    height = round(size * share)
    width = round(logo.width * height / logo.height)
    icon = Image.new("RGB", (size, size), WHITE)
    icon.paste(
        logo.resize((width, height), Image.Resampling.LANCZOS),
        ((size - width) // 2, (size - height) // 2),
    )
    return icon


def main() -> None:
    """Write every icon of ``ICONS`` to ``public/icons/``."""
    logo = crop_to_drawing(Image.open(LOGO).convert("RGB"))
    OUT.mkdir(parents=True, exist_ok=True)
    for name, size, share in ICONS:
        render(logo, size, share).save(OUT / name, optimize=True)
        print(f"{name}: {size} px")


if __name__ == "__main__":
    main()
