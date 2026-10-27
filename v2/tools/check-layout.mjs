// Runs layout-stability.js in a real browser at every layout tier's sizes, plus
// the checks it can't do from inside one viewport: everything the slider
// changes fits on the first screen, the desktop columns end together, and the
// prerendered page (JS off) is laid out exactly like the page after its script runs.
// Serves build/ itself, so run `npm run build:v2` first (`npm run check:layout` does).
//
//   node v2/tools/check-layout.mjs                      every size, Chromium
//   node v2/tools/check-layout.mjs --sizes 375x667,1440x900
//   node v2/tools/check-layout.mjs --browser webkit     needs `npx playwright install webkit`
//
// Screenshots of each size's first screen go to build/__shots/ for review.
import { readFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { root, buildDir, serveBuild, launchBrowser, openPage } from "./harness.mjs";

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
// Blocks that must sit in the same place before and after the script's first render, within
// 1 px: the script rounds the readout's width up to a whole pixel, which CSS can't match.
const HYDRATION_TOLERANCE_PX = 1;
const HYDRATION_BLOCKS = [".b-top", ".stage", ".readout-block", ".temp-big .unit", ".verdict", "#stageNote", ".b-dock", "#slider", ".ticks", ".controls", ".viz", "#spectrum", ".chart-box", ".legend", "#colormap", ".stats", "#how", "#stars", "#faq"];
const measureBlocks = selectors => Object.fromEntries(selectors.map(s => {
  const box = document.querySelector(s)?.getBoundingClientRect();
  return [s, box ? { top: box.top, h: box.height, left: box.left, w: box.width } : null];
}));
const describe = box => (box ? Object.entries(box).map(([k, v]) => `${k} ${Math.round(v * 10) / 10}`).join(" ") : "missing");
const moved = (a, b) => !a || !b ? a !== b : Object.keys(a).some(k => Math.abs(a[k] - b[k]) > HYDRATION_TOLERANCE_PX);

const { values: args } = parseArgs({ options: { sizes: { type: "string" }, browser: { type: "string", default: "chromium" } } });
const sizes = args.sizes ? SIZES.filter(([, w, h]) => args.sizes.split(",").includes(`${w}x${h}`)) : SIZES;
if (!sizes.length) throw new Error(`No known sizes in --sizes ${args.sizes}; pick from ${SIZES.map(([, w, h]) => `${w}x${h}`).join(", ")}`);
const server = await serveBuild();

const stabilityCheck = await readFile(join(root, "v2/tools/layout-stability.js"), "utf8");
await mkdir(shotsDir, { recursive: true });

const browser = await launchBrowser(args.browser);

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
  const staticPage = await openPage(browser, `${server.origin}/`, width, height, { javaScript: false });
  const beforeScript = await staticPage.evaluate(measureBlocks, HYDRATION_BLOCKS);
  await staticPage.screenshot({ path: join(shotsDir, `${size}-no-js.png`) });
  await staticPage.close();

  const page = await openPage(browser, `${server.origin}/`, width, height);
  await page.screenshot({ path: join(shotsDir, `${size}.png`) });
  const afterScript = await page.evaluate(measureBlocks, HYDRATION_BLOCKS);
  const hydrationMoves = HYDRATION_BLOCKS.filter(s => moved(beforeScript[s], afterScript[s])).map(s => `${s}: ${describe(beforeScript[s])} -> ${describe(afterScript[s])}`);

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
  if (hydrationMoves.length) problems.push(["moves when the script runs", hydrationMoves]);
  if (Object.keys(firstScreen.offScreen).length) problems.push(["off the first screen", firstScreen.offScreen]);
  if (tier === "desktop" && COLUMN_BALANCE_SIZES.includes(size) && Math.abs(firstScreen.columnGap) > COLUMN_BALANCE_TOLERANCE_PX) {
    problems.push(["columns don't end together", `.stats ends ${firstScreen.columnGap} px below .b-left (tolerance ±${COLUMN_BALANCE_TOLERANCE_PX})`]);
  }
  for (const key of ["shifts", "overlaps", "readoutOverflow", "panelScroll"]) if (stability[key] !== "none") problems.push([key, stability[key]]);
  if (stability.overflowX > 0) problems.push(["horizontal scroll", `${stability.overflowX} px`]);
  if (page.errors.length) problems.push(["page errors", page.errors]);

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
