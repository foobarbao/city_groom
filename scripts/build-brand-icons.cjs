/**
 * @file Generates the favicon and home-screen icons of both apps from the
 * CityPal mark (`packages/ui/brand/citypal-mark.svg`, docs/DESIGN.md
 * "Brand"), into `apps/customer/public/` and `apps/portal/public/`. Run it
 * again after changing the mark; the generated files are committed, so
 * builds do not need it.
 *
 * Needs Playwright and its Chromium (used to rasterise the SVG), which are
 * not project dependencies:
 *
 *     npm install -g playwright && npx playwright install chromium
 *     NODE_PATH="$(npm root -g)" node scripts/build-brand-icons.cjs
 *
 * Outputs, per app:
 * - `favicon.svg`: the mark as is (rounded tile);
 * - `apple-touch-icon.png` (180 px), `icon-192.png`, `icon-512.png`: square,
 *   full-bleed tile, since iOS and Android launchers cut their own shape;
 * - `icon-maskable-512.png`: the drawing shrunk into the central 80 % "safe
 *   zone" of maskable icons (https://web.dev/articles/maskable-icon).
 */
const {
  copyFileSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} = require("node:fs");
const { join } = require("node:path");
const { chromium } = require("playwright");

const root = join(__dirname, "..");
const source = join(root, "packages/ui/brand/citypal-mark.svg");
const targets = ["apps/customer/public", "apps/portal/public"].map((dir) =>
  join(root, dir),
);

const mark = readFileSync(source, "utf8");
const square = mark.replace('rx="16"', 'rx="0"');
// Everything but the tile shrinks to 80 % around the centre (32, 32).
const maskable = square
  .replace(
    /(<rect [^>]*\/>)/,
    '$1<g transform="translate(6.4 6.4) scale(0.8)">',
  )
  .replace("</svg>", "</g></svg>");

const pngs = [
  { name: "apple-touch-icon.png", svg: square, size: 180 },
  { name: "icon-192.png", svg: square, size: 192 },
  { name: "icon-512.png", svg: square, size: 512 },
  { name: "icon-maskable-512.png", svg: maskable, size: 512 },
];

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const { name, svg, size } of pngs) {
    await page.setViewportSize({ width: size, height: size });
    const sized = svg.replace(
      "<svg ",
      `<svg width="${size}" height="${size}" `,
    );
    await page.setContent(`<body style="margin:0">${sized}</body>`);
    const png = await page.locator("svg").screenshot({ omitBackground: true });
    for (const dir of targets) {
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, name), png);
    }
  }
  await browser.close();
  for (const dir of targets) copyFileSync(source, join(dir, "favicon.svg"));
  console.log(`Icons written to ${targets.join(", ")}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
