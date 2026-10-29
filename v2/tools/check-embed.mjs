// Checks the embed page (/embed/) at the iframe sizes it's made for: everything it shows fits
// in the frame without scrolling, in every mode, nothing moves when modes change or the slider
// moves (layout-stability.js, the same check the main page gets), the prerendered page (JS off) is
// laid out like the page after its script runs, and "Open full page" carries the URL state to /.
// Serves build/ itself, so run `npm run build:v2` first (`npm run check:embed` does).
//
//   node v2/tools/check-embed.mjs                       every size, Chromium
//   node v2/tools/check-embed.mjs --sizes 300x300,1000x700   any sizes
//   node v2/tools/check-embed.mjs --browser webkit
//
// Screenshots go to build/__shots/embed-*.png for review.
import { readFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { root, buildDir, serveBuild, launchBrowser, openPage } from "./harness.mjs";

const shotsDir = join(buildDir, "__shots");
const SIZES = [[300, 300], [400, 400], [800, 600]];
// Below this the chart's plot area is too short to read.
const MIN_CHART_PX = 100;
const HYDRATION_TOLERANCE_PX = 1;
const HYDRATION_BLOCKS = [".b-top", ".stage", ".readout-block", ".temp-big .unit", ".verdict", "#stageNote", "#fullPage", ".b-dock", "#slider", ".ticks", ".controls", ".viz", "#spectrum", ".chart-box", ".legend"];
// Everything the embed shows. Hidden ones (the mode buttons in the smallest frames) are skipped.
const SHOWN = [".stage", ".readout-block", "#fullPage", "#slider", ".ticks", ".controls", "#spectrum", ".chart-box", ".legend"];
// Modes the URL can set, each checked for fit at a cold, a middle and the hottest temperature.
const MODE_QUERIES = ["", "model=star", "model=simple&light=sun", "light=hue", "compare=1", "compare=1&light=hue&model=star"];
const FIT_TEMPERATURES = [100, 3600, 1000000];
const STATE_QUERY = "?t=3600&model=star&light=sun&compare=1";

const measureBlocks = selectors => Object.fromEntries(selectors.map(s => {
  const box = document.querySelector(s)?.getBoundingClientRect();
  return [s, box ? { top: box.top, h: box.height, left: box.left, w: box.width } : null];
}));
const describe = box => (box ? Object.entries(box).map(([k, v]) => `${k} ${Math.round(v * 10) / 10}`).join(" ") : "missing");
const moved = (a, b) => !a || !b ? a !== b : Object.keys(a).some(k => Math.abs(a[k] - b[k]) > HYDRATION_TOLERANCE_PX);

// Runs in the page: what spills out of the frame, and the chart's height.
function measureFit(shown) {
  const spills = [];
  for (const selector of shown) {
    const box = document.querySelector(selector)?.getBoundingClientRect();
    if (!box?.height) continue;
    if (box.bottom > innerHeight + 0.5 || box.right > innerWidth + 0.5 || box.top < -0.5 || box.left < -0.5) {
      spills.push(`${selector} at ${Math.round(box.left)},${Math.round(box.top)} to ${Math.round(box.right)},${Math.round(box.bottom)}`);
    }
  }
  // The link sits in the readout row's free end (compact tier), so it must clear the widest temperature.
  const link = document.getElementById("fullPage").getBoundingClientRect();
  for (const selector of ["#tempBig", ".verdict", ".stage"]) {
    const box = document.querySelector(selector).getBoundingClientRect();
    const overlap = Math.min(link.right, box.right) - Math.max(link.left, box.left) > 0.5 && Math.min(link.bottom, box.bottom) - Math.max(link.top, box.top) > 0.5;
    if (overlap) spills.push(`#fullPage overlaps ${selector}`);
  }
  const page = document.documentElement;
  if (page.scrollHeight > innerHeight) spills.push(`page scrolls ${page.scrollHeight - innerHeight} px down`);
  if (page.scrollWidth > innerWidth) spills.push(`page scrolls ${page.scrollWidth - innerWidth} px sideways`);
  return { spills, chart: document.querySelector(".chart-box").getBoundingClientRect().height };
}

const { values: args } = parseArgs({ options: { sizes: { type: "string" }, browser: { type: "string", default: "chromium" } } });
const sizes = args.sizes ? args.sizes.split(",").map(size => size.split("x").map(Number)) : SIZES;
if (sizes.some(size => size.length !== 2 || size.some(n => !(n > 0)))) throw new Error(`--sizes takes WxH,WxH (got ${args.sizes})`);
const server = await serveBuild();
const stabilityCheck = await readFile(join(root, "v2/tools/layout-stability.js"), "utf8");
await mkdir(shotsDir, { recursive: true });
const browser = await launchBrowser(args.browser);
const url = query => `${server.origin}/embed/${query}`;

let failures = 0;
for (const [width, height] of sizes) {
  const size = `${width}x${height}`;
  const problems = [];

  const staticPage = await openPage(browser, url(""), width, height, { javaScript: false });
  const beforeScript = await staticPage.evaluate(measureBlocks, HYDRATION_BLOCKS);
  await staticPage.screenshot({ path: join(shotsDir, `embed-${size}-no-js.png`) });
  await staticPage.close();

  const page = await openPage(browser, url(""), width, height);
  await page.screenshot({ path: join(shotsDir, `embed-${size}.png`) });
  const afterScript = await page.evaluate(measureBlocks, HYDRATION_BLOCKS);
  const hydrationMoves = HYDRATION_BLOCKS.filter(s => moved(beforeScript[s], afterScript[s])).map(s => `${s}: ${describe(beforeScript[s])} -> ${describe(afterScript[s])}`);
  if (hydrationMoves.length) problems.push(["moves when the script runs", hydrationMoves]);

  const stability = await page.evaluate(stabilityCheck);
  for (const key of ["shifts", "overlaps", "readoutOverflow"]) if (stability[key] !== "none") problems.push([key, stability[key]]);
  if (stability.overflowX > 0) problems.push(["horizontal scroll", `${stability.overflowX} px`]);
  if (page.errors.length) problems.push(["page errors", page.errors]);
  await page.close();

  // Fit in every mode the URL can ask for, at temperatures that make the longest text.
  const spills = {};
  let smallestChart = Infinity;
  for (const modes of MODE_QUERIES) {
    for (const T of FIT_TEMPERATURES) {
      const query = `?t=${T}${modes ? `&${modes}` : ""}`;
      const modePage = await openPage(browser, url(query), width, height);
      const fit = await modePage.evaluate(measureFit, SHOWN);
      if (fit.spills.length) spills[query] = fit.spills;
      smallestChart = Math.min(smallestChart, fit.chart);
      if (modePage.errors.length) problems.push([`page errors at ${query}`, modePage.errors]);
      if (T === 3600 && modes.startsWith("compare=1&")) await modePage.screenshot({ path: join(shotsDir, `embed-${size}-compare.png`) });
      await modePage.close();
    }
  }
  if (Object.keys(spills).length) problems.push(["doesn't fit the frame", spills]);
  if (smallestChart < MIN_CHART_PX) problems.push(["chart too short", `${Math.round(smallestChart)} px (minimum ${MIN_CHART_PX})`]);

  // "Open full page" opens / in the embed's state, and follows the slider.
  const linkPage = await openPage(browser, url(STATE_QUERY), width, height);
  const linkBefore = await linkPage.getAttribute("#fullPage", "href");
  await linkPage.evaluate(() => {
    const slider = document.getElementById("slider");
    slider.value = 700;
    slider.dispatchEvent(new Event("input"));
  });
  const linkAfter = await linkPage.getAttribute("#fullPage", "href");
  if (linkBefore !== `/${STATE_QUERY}`) problems.push(["full-page link", `${linkBefore}, expected /${STATE_QUERY}`]);
  if (!linkAfter.startsWith("/?t=") || linkAfter.includes("t=3600") || !linkAfter.endsWith("&model=star&light=sun&compare=1")) problems.push(["full-page link after sliding", `${linkAfter}`]);
  await linkPage.close();

  console.log(`${problems.length ? "FAIL" : "ok  "}  ${size.padEnd(8)} chart ≥ ${Math.round(smallestChart)} px`);
  for (const [what, detail] of problems) console.log(`      ${what}: ${JSON.stringify(detail, null, 2).replace(/\n/g, "\n      ")}`);
  failures += problems.length ? 1 : 0;
}

await browser.close();
server.close();
console.log(failures ? `\n${failures} of ${sizes.length} sizes failed (${args.browser}).` : `\nAll ${sizes.length} sizes passed (${args.browser}). Screenshots in build/__shots/embed-*.png.`);
process.exit(failures ? 1 : 0);
