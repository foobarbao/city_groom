/**
 * @file Generates the favicon, home-screen icons and menu marks of both apps
 * from the CityPal logo (docs/DESIGN.md "Brand"). Run it again after changing
 * the logo; the generated files are committed, so builds do not need it.
 *
 * Sources: `packages/ui/brand/citypal-logo-light.jpg` (white background) and
 * `citypal-logo-dark.jpg` (near-black background), 1024 px, chosen by the
 * project owner on 2026-10-26. Each is cropped to its drawing, then centred
 * on its own background colour.
 *
 * Needs Playwright and its Chromium (used to crop and resize on a canvas),
 * which are not project dependencies:
 *
 *     npm install -g playwright && npx playwright install chromium
 *     NODE_PATH="$(npm root -g)" node scripts/build-brand-icons.cjs
 *
 * Outputs, per app (`apps/customer/public/`, `apps/portal/public/`), from the
 * light logo:
 * - `favicon.png` (64 px), `apple-touch-icon.png` (180 px), `icon-192.png`,
 *   `icon-512.png`: square, since iOS and Android launchers cut their own
 *   shape;
 * - `icon-maskable-512.png`: the drawing shrunk into the central 80 % "safe
 *   zone" of maskable icons (https://web.dev/articles/maskable-icon).
 *
 * And `packages/ui/brand/citypal-mark-{light,dark}.png` (96 px, three times
 * the menu size for sharp screens), shown by the `BrandMark` component.
 */
const { readFileSync, writeFileSync } = require("node:fs");
const { join } = require("node:path");
const { chromium } = require("playwright");

const root = join(__dirname, "..");
const brand = join(root, "packages/ui/brand");
const apps = ["apps/customer/public", "apps/portal/public"].map((dir) =>
  join(root, dir),
);

// [file, size in px, share of the side taken by the drawing's height]
const appIcons = [
  ["favicon.png", 64, 0.92],
  ["apple-touch-icon.png", 180, 0.8],
  ["icon-192.png", 192, 0.84],
  ["icon-512.png", 512, 0.84],
  ["icon-maskable-512.png", 512, 0.6],
];

/** Crops the logo `dataUrl` to its drawing and centres it in `size` px. */
async function render(page, dataUrl, size, share) {
  const base64 = await page.evaluate(
    async ({ dataUrl, size, share }) => {
      const img = new Image();
      img.src = dataUrl;
      await img.decode();
      const src = document.createElement("canvas");
      src.width = img.width;
      src.height = img.height;
      const ctx = src.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const { data } = ctx.getImageData(0, 0, img.width, img.height);
      // The background is the corner colour; JPEG noise below 40 is ignored.
      const bg = [data[0], data[1], data[2]];
      let [left, top, right, bottom] = [img.width, img.height, 0, 0];
      for (let y = 0; y < img.height; y++)
        for (let x = 0; x < img.width; x++) {
          const i = (y * img.width + x) * 4;
          const diff = Math.max(
            Math.abs(data[i] - bg[0]),
            Math.abs(data[i + 1] - bg[1]),
            Math.abs(data[i + 2] - bg[2]),
          );
          if (diff > 40) {
            left = Math.min(left, x);
            right = Math.max(right, x);
            top = Math.min(top, y);
            bottom = Math.max(bottom, y);
          }
        }
      const width = right - left + 1;
      const height = bottom - top + 1;
      const out = document.createElement("canvas");
      out.width = out.height = size;
      const o = out.getContext("2d");
      o.fillStyle = `rgb(${bg.join(",")})`;
      o.fillRect(0, 0, size, size);
      o.imageSmoothingQuality = "high";
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
    { dataUrl, size, share },
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
  for (const [name, size, share] of appIcons) {
    const png = await render(page, light, size, share);
    for (const dir of apps) writeFileSync(join(dir, name), png);
  }
  for (const [variant, source] of [
    ["light", light],
    ["dark", dark],
  ])
    writeFileSync(
      join(brand, `citypal-mark-${variant}.png`),
      await render(page, source, 96, 0.84),
    );
  await browser.close();
  console.log(`Icons written to ${apps.join(", ")} and ${brand}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
