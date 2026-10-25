// Runs layout-stability.js in a real browser at every layout tier's sizes, plus
// the two checks it can't do from inside one viewport: everything the slider
// changes fits on the first screen, and the desktop columns end together.
// Serves build/ itself, so run `npm run build:v2` first (`npm run check:layout` does).
//
//   node v2/tools/check-layout.mjs                      every size, Chromium
//   node v2/tools/check-layout.mjs --sizes 375x667,1440x900
//   node v2/tools/check-layout.mjs --browser webkit     needs `npx playwright install webkit`
//
// Screenshots of each size's first screen go to build/__shots/ for review.
import { chromium, webkit } from "playwright";
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const buildDir = join(root, "build");
const shotsDir = join(buildDir, "__shots");

const SIZES = [
  ["phone", 320, 568], ["phone", 375, 667], ["phone", 390, 844], ["phone", 430, 932],
  ["tablet", 768, 1024],
  ["short", 667, 375], ["short", 844, 390], ["short", 932, 430],
  ["desktop", 1024, 768], ["desktop", 1280, 720], ["desktop", 1440, 900], ["desktop", 1920, 1080],
];
// The left column (star, readout, controls) and the chart column's stats should
// end at the same height on desktop (`--stage-h` and `--viz-h` scale together).
const COLUMN_BALANCE_SIZES = ["1024x768", "1280x720", "1440x900"];
const COLUMN_BALANCE_TOLERANCE_PX = 20;

const { values: args } = parseArgs({ options: { sizes: { type: "string" }, browser: { type: "string", default: "chromium" } } });
const sizes = args.sizes ? SIZES.filter(([, w, h]) => args.sizes.split(",").includes(`${w}x${h}`)) : SIZES;
if (!sizes.length) throw new Error(`No known sizes in --sizes ${args.sizes}; pick from ${SIZES.map(([, w, h]) => `${w}x${h}`).join(", ")}`);
const engine = { chromium, webkit }[args.browser];
if (!engine) throw new Error(`--browser must be chromium or webkit`);

const CONTENT_TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".ico": "image/x-icon", ".webp": "image/webp", ".png": "image/png", ".txt": "text/plain" };
const server = createServer(async (req, res) => {
  let path = normalize(decodeURIComponent(new URL(req.url, "http://localhost").pathname));
  if (path.endsWith("/")) path += "index.html";
  try {
    const body = await readFile(join(buildDir, path));
    res.writeHead(200, { "content-type": CONTENT_TYPES[extname(path)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;

const stabilityCheck = await readFile(join(root, "v2/tools/layout-stability.js"), "utf8");
await mkdir(shotsDir, { recursive: true });

let browser;
try {
  browser = await engine.launch();
} catch (error) {
  console.error(`Couldn't start ${args.browser}. Install it with: npx playwright install ${args.browser}\n${error.message.split("\n")[0]}`);
  process.exit(1);
}

// One broken rule usually fails in most of the ~200 states; show a few.
function abbreviate(detail, keep = 4) {
  if (Array.isArray(detail) && detail.length > keep) return [...detail.slice(0, keep), `… and ${detail.length - keep} more`];
  if (detail && typeof detail === "object" && !Array.isArray(detail)) {
    const entries = Object.entries(detail);
    if (entries.length > keep) return Object.fromEntries([...entries.slice(0, keep), ["…", `and ${entries.length - keep} more states`]]);
  }
  return detail;
}

let failures = 0;
for (const [tier, width, height] of sizes) {
  const size = `${width}x${height}`;
  const page = await browser.newPage({ viewport: { width, height } });
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  // The Vercel analytics script only exists on Vercel.
  await page.route("**/_vercel/**", route => route.fulfill({ status: 200, contentType: "text/javascript", body: "" }));
  await page.goto(`${origin}/`);
  await page.screenshot({ path: join(shotsDir, `${size}.png`) });

  const firstScreen = await page.evaluate(() => {
    // Whatever the tier shows of these must end inside the first screen.
    // Hidden ones (the inactive tab on phones) have no height and are skipped.
    const offScreen = {};
    for (const selector of [".stage", ".readout-block", "#slider", ".controls", "#spectrum", "#colormap"]) {
      const box = document.querySelector(selector)?.getBoundingClientRect();
      if (box?.height && box.bottom > innerHeight + 0.5) offScreen[selector] = `ends at ${Math.round(box.bottom)}, screen is ${innerHeight}`;
    }
    const left = document.querySelector(".b-left").getBoundingClientRect();
    const stats = document.querySelector(".stats").getBoundingClientRect();
    return { offScreen, columnGap: Math.round(stats.bottom - left.bottom) };
  });
  const stability = await page.evaluate(stabilityCheck);

  const problems = [];
  if (Object.keys(firstScreen.offScreen).length) problems.push(["off the first screen", firstScreen.offScreen]);
  if (tier === "desktop" && COLUMN_BALANCE_SIZES.includes(size) && Math.abs(firstScreen.columnGap) > COLUMN_BALANCE_TOLERANCE_PX) {
    problems.push(["columns don't end together", `.stats ends ${firstScreen.columnGap} px below .b-left (tolerance ±${COLUMN_BALANCE_TOLERANCE_PX})`]);
  }
  for (const key of ["shifts", "overlaps", "readoutOverflow"]) if (stability[key] !== "none") problems.push([key, stability[key]]);
  if (stability.overflowX > 0) problems.push(["horizontal scroll", `${stability.overflowX} px`]);
  if (pageErrors.length) problems.push(["page errors", pageErrors]);

  const balance = COLUMN_BALANCE_SIZES.includes(size) ? `  columns ${firstScreen.columnGap >= 0 ? "+" : ""}${firstScreen.columnGap} px` : "";
  console.log(`${problems.length ? "FAIL" : "ok  "}  ${tier.padEnd(7)} ${size.padEnd(9)}${balance}`);
  for (const [what, detail] of problems) console.log(`      ${what}: ${JSON.stringify(abbreviate(detail), null, 2).replace(/\n/g, "\n      ")}`);
  failures += problems.length ? 1 : 0;
  await page.close();
}

await browser.close();
server.close();
console.log(failures ? `\n${failures} of ${sizes.length} sizes failed (${args.browser}).` : `\nAll ${sizes.length} sizes passed (${args.browser}). Screenshots in build/__shots/.`);
process.exit(failures ? 1 : 0);
