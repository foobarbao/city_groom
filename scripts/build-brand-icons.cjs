/**
 * @file Generates the favicon, home-screen icons and menu marks of both apps
 * from the CityPal logo (docs/DESIGN.md "Brand"). Run it again after changing
 * the logo; the generated files are committed, so builds do not need it.
 *
 * Sources: `packages/ui/brand/citypal-logo-light.jpg` (white background) and
 * `citypal-logo-dark.jpg` (near-black background), 1024 px, chosen by the
 * project owner on 2026-10-26. Each is cut out (transparent background) and
 * cropped to its drawing.
 *
 * Needs Playwright and its Chromium (used to crop and resize on a canvas),
 * which are not project dependencies:
 *
 *     npm install -g playwright && npx playwright install chromium
 *     NODE_PATH="$(npm root -g)" node scripts/build-brand-icons.cjs
 *
 * Outputs, per app (`apps/customer/public/`, `apps/portal/public/`), from the
 * light logo, the drawing filling the height:
 * - `favicon.png` (64 px), `icon-192.png`, `icon-512.png`: transparent;
 * - `apple-touch-icon.png` (180 px) and `icon-maskable-512.png`: on white
 *   (see `appIcons`).
 *
 * And `packages/ui/brand/citypal-mark-{light,dark}.png` (132 px, three times
 * the menu size for sharp screens, transparent), shown by `BrandMark`.
 */
const { readFileSync, writeFileSync } = require("node:fs");
const { join } = require("node:path");
const { chromium } = require("playwright");

const root = join(__dirname, "..");
const brand = join(root, "packages/ui/brand");
const apps = ["apps/customer/public", "apps/portal/public"].map((dir) =>
  join(root, dir),
);

// [file, size in px, share of the side taken by the drawing's height,
//  transparent background (else white)]
// iOS paints transparent pixels of its home-screen icon black, and maskable
// icons must fill their square, so those two keep a white background; the
// others are cut out to sit on any background.
const appIcons = [
  ["favicon.png", 64, 1, true],
  ["apple-touch-icon.png", 180, 0.94, false],
  ["icon-192.png", 192, 1, true],
  ["icon-512.png", 512, 1, true],
  // Fits the central 80 % circle of maskable icons
  // (https://web.dev/articles/maskable-icon).
  ["icon-maskable-512.png", 512, 0.74, false],
];

/**
 * Crops the logo `dataUrl` to its drawing and centres it in `size` px.
 *
 * The logo's background (its corner colour: white or near-black) is cut out:
 * each pixel's opacity grows with its distance to that colour, and its colour
 * is corrected so that edges keep no white or black halo. The gaps between
 * the heart's compartments become transparent too, so they take the colour
 * of whatever is behind, as in the original drawing. With `transparent`
 * false, the result is laid on white.
 */
async function render(page, dataUrl, size, share, transparent) {
  const base64 = await page.evaluate(
    async ({ dataUrl, size, share, transparent }) => {
      const img = new Image();
      img.src = dataUrl;
      await img.decode();
      const src = document.createElement("canvas");
      src.width = img.width;
      src.height = img.height;
      const ctx = src.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const pixels = ctx.getImageData(0, 0, img.width, img.height);
      const data = pixels.data;
      const bg = [data[0], data[1], data[2]];
      // Below LOW the pixel is background (JPEG noise), above HIGH drawing.
      const LOW = 24;
      const HIGH = 72;
      let [left, top, right, bottom] = [img.width, img.height, 0, 0];
      for (let y = 0; y < img.height; y++)
        for (let x = 0; x < img.width; x++) {
          const i = (y * img.width + x) * 4;
          const diff = Math.max(
            Math.abs(data[i] - bg[0]),
            Math.abs(data[i + 1] - bg[1]),
            Math.abs(data[i + 2] - bg[2]),
          );
          const alpha = Math.min(1, Math.max(0, (diff - LOW) / (HIGH - LOW)));
          if (alpha > 0) {
            // Undo the blend with the background: c = a·colour + (1 − a)·bg.
            for (let c = 0; c < 3; c++)
              data[i + c] = Math.min(
                255,
                Math.max(0, (data[i + c] - (1 - alpha) * bg[c]) / alpha),
              );
            left = Math.min(left, x);
            right = Math.max(right, x);
            top = Math.min(top, y);
            bottom = Math.max(bottom, y);
          }
          data[i + 3] = Math.round(alpha * 255);
        }
      ctx.putImageData(pixels, 0, 0);
      const width = right - left + 1;
      const height = bottom - top + 1;
      const out = document.createElement("canvas");
      out.width = out.height = size;
      const o = out.getContext("2d");
      if (!transparent) {
        o.fillStyle = "#ffffff";
        o.fillRect(0, 0, size, size);
      }
      o.imageSmoothingQuality = "high";
      // The drawing is taller than wide: its height sets the scale.
      const drawnHeight = size * share;
      const drawnWidth = (width * drawnHeight) / height;
      o.drawImage(
        src,
        left,
        top,
        width,
        height,
        (size - drawnWidth) / 2,
        (size - drawnHeight) / 2,
        drawnWidth,
        drawnHeight,
      );
      return out.toDataURL("image/png").split(",")[1];
    },
    { dataUrl, size, share, transparent },
  );
  return Buffer.from(base64, "base64");
}

async function main() {
  const logo = (name) =>
    `data:image/jpeg;base64,${readFileSync(join(brand, name)).toString("base64")}`;
  const light = logo("citypal-logo-light.jpg");
  const dark = logo("citypal-logo-dark.jpg");
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const [name, size, share, transparent] of appIcons) {
    const png = await render(page, light, size, share, transparent);
    for (const dir of apps) writeFileSync(join(dir, name), png);
  }
  for (const [variant, source] of [
    ["light", light],
    ["dark", dark],
  ])
    writeFileSync(
      join(brand, `citypal-mark-${variant}.png`),
      await render(page, source, 132, 1, true),
    );
  await browser.close();
  console.log(`Icons written to ${apps.join(", ")} and ${brand}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
