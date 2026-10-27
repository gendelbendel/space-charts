// Proves a change looks and behaves exactly as before. Save a baseline from the
// current build, make the change, rebuild and compare: every state's full-page
// screenshot, chart canvas, URL, focused element and DOM (minus the bundled script,
// so code-only refactors compare clean) must match.
//
//   npm run snapshot:save      build, then save a baseline to v2/.snapshots/ (gitignored)
//   npm run snapshot:compare   build, then compare against it; exits 1 on any difference
//   node v2/tools/snapshot.mjs compare --sizes 375x667,1440x900
//
// Save on the commit before your change. Differences are written next to the
// baseline as <size>-<state>.after.png / .after.html for side-by-side review.
import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { root, serveBuild, launchBrowser, openPage } from "./harness.mjs";

const dir = join(root, "v2", ".snapshots");
const SIZES = [[375, 667], [430, 932], [667, 375], [768, 1024], [1024, 768], [1440, 900]];

// The share button's fallback (copy the link) on every machine, whether or not this browser has a share sheet.
const withoutShareSheet = page => page.evaluate(() => delete Navigator.prototype.share);
// Playwright can't emulate a P3 screen, but Chrome's DevTools protocol can; the page re-renders on the change.
const asWideGamut = async page => {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setEmulatedMedia", { features: [{ name: "color-gamut", value: "p3" }] });
};
const clickTab = view => async page => {
  const tab = page.locator(`[data-tabs] [data-view=${view}]`);
  if (await tab.isVisible()) await tab.click();
};
// [name, query, optional action]. Covers URL parsing, every control and the main interactions.
const STATES = [
  ["sun", "?t=5772"],
  ["cold", "?t=100"],
  ["you", "?t=310"],
  ["draper", "?t=798"],
  ["betelgeuse-star", "?t=3600&model=star"],
  ["sirius-simple-sun", "?t=9940&model=simple&light=sun"],
  ["hot-compare-hue", "?t=40000&compare=1&light=hue"],
  ["v1-link", "?temp=4500"],
  ["junk", "?t=abc&model=nope"],
  ["map-tab", "?t=6500", clickTab("map")],
  ["numbers-tab", "?t=2000", clickTab("numbers")],
  ["log-axis", "?t=3000", page => page.locator(".seg[data-key=yscale] [data-v=log]").first().click()],
  ["class-chip", "?t=12100", page => page.locator("#classChip").click()],
  ["faq-search", "?t=5772", page => page.fill("#faqSearch", "green")],
  ["slider", "?t=5772", page => page.evaluate(() => {
    const slider = document.getElementById("slider");
    slider.value = 333;
    slider.dispatchEvent(new Event("input"));
  })],
  ["typed", "?t=5772", async page => {
    await page.click("#num");
    await page.fill("#num", "1 234k");
    await page.press("#num", "Enter");
  }],
  ["typed-celsius", "?t=5772", async page => {
    await page.click("#num");
    await page.fill("#num", "1200 °C");
  }],
  ["typed-name", "?t=5772", async page => {
    await page.click("#num");
    await page.fill("#num", "wise 0855");
    await page.press("#num", "Enter");
  }],
  ["card", "?t=5772", page => page.locator("#objects button", { hasText: "Betelgeuse" }).click()],
  ["cmb-card", "?t=5772", page => page.locator("#objects button", { hasText: "Cosmic microwave background" }).click()],
  ["orion-click", "?t=5772", page => page.locator("#orion button", { hasText: "Mintaka" }).click()],
  ["orion-focus", "?t=3600&light=sun", page => page.focus("#orion button")],
  ["copy", "?t=1200", page => page.click("#copyColor")],
  ["copy-menu", "?t=1200", async page => {
    await page.focus("#copyColor");
    await page.keyboard.press("ArrowDown");
  }],
  ["share", "?t=3600&model=star", async page => {
    await withoutShareSheet(page);
    await page.click("#shareLink");
  }],
  ["copy-variables", "?t=5772&light=hue", page => page.click("#copyVars")],
  ["wide-gamut", "?t=1200&light=hue", asWideGamut],
  ["wide-gamut-compare", "?t=1000&compare=1", asWideGamut],
  // Snapshots run with reduced motion, so Play steps: it holds 300 K for 1.5 s, then 1,800 K.
  ["play", "?t=5772", page => page.click("#play")],
  ["play-stopped", "?t=5772", async page => {
    await page.click("#play");
    await page.waitForTimeout(2200);
    await page.keyboard.press("p");
  }],
  ["shortcut-list", "?t=5772", async page => {
    await page.keyboard.press("?");
    await page.waitForTimeout(1500); // Chrome flashes an overlay scrollbar on the dialog as it opens
  }],
  ["shortcut-keys", "?t=5772", async page => {
    for (const key of ["ArrowRight", "Shift+M", "m", "b", "c"]) await page.keyboard.press(key);
  }],
  ["chart-hover", "?t=5772", async page => {
    const box = await page.locator("#chart").boundingBox();
    if (box) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  }],
];

const { positionals: [mode], values: args } = parseArgs({ allowPositionals: true, options: { sizes: { type: "string" } } });
if (!["save", "compare"].includes(mode)) throw new Error("Usage: snapshot.mjs <save|compare> [--sizes 375x667,...]");
const sizes = args.sizes ? SIZES.filter(([w, h]) => args.sizes.split(",").includes(`${w}x${h}`)) : SIZES;

const hash = data => createHash("sha256").update(data).digest("hex").slice(0, 16);
const resultsFile = join(dir, "results.json");
let baseline = {};
if (mode === "save") {
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
} else {
  try {
    baseline = JSON.parse(await readFile(resultsFile, "utf8"));
  } catch {
    console.error("No baseline. Run `npm run snapshot:save` on the commit before your change.");
    process.exit(1);
  }
}

const server = await serveBuild();
const browser = await launchBrowser();
const results = {};
const differences = [];
for (const [width, height] of sizes) {
  for (const [name, query, act] of STATES) {
    // Reduced motion turns transitions off, so a capture never lands mid-transition.
    const page = await openPage(browser, `${server.origin}/${query}`, width, height, { reducedMotion: "reduce" });
    if (act) await act(page);
    await page.waitForTimeout(250); // the URL is written back after 150 ms
    const dom = await page.evaluate(() => ({
      html: document.body.innerHTML.replace(/<script>[\s\S]*?<\/script>/g, ""),
      canvas: document.getElementById("chart").toDataURL(),
      url: location.search,
      focus: document.activeElement?.id ?? "",
    }));
    const shot = await page.screenshot({ fullPage: true });
    const key = `${width}x${height}-${name}`;
    const result = { screenshot: hash(shot), canvas: hash(dom.canvas), html: hash(dom.html), url: dom.url, focus: dom.focus, errors: page.errors.length };
    results[key] = result;
    if (mode === "save") {
      await writeFile(join(dir, `${key}.png`), shot);
      await writeFile(join(dir, `${key}.html`), dom.html);
    } else if (baseline[key]) {
      const changed = Object.keys(result).filter(k => result[k] !== baseline[key][k]);
      if (changed.length) {
        differences.push(`${key}: ${changed.map(k => (k === "url" || k === "focus" ? `${k} ${baseline[key][k] || "(none)"} -> ${result[k] || "(none)"}` : k)).join(", ")}`);
        await writeFile(join(dir, `${key}.after.png`), shot);
        await writeFile(join(dir, `${key}.after.html`), dom.html);
      }
    } else {
      differences.push(`${key}: not in the baseline`);
    }
    await page.close();
  }
}
await browser.close();
server.close();

const count = Object.keys(results).length;
if (mode === "save") {
  await writeFile(resultsFile, JSON.stringify(results, null, 1));
  const withErrors = Object.entries(results).filter(([, r]) => r.errors).map(([key]) => key);
  console.log(`Saved ${count} states to v2/.snapshots/.${withErrors.length ? ` Page errors in: ${withErrors.join(", ")}` : ""}`);
} else if (differences.length) {
  console.log(differences.join("\n"));
  console.log(`\n${differences.length} of ${count} states differ. Compare the .after.png/.after.html files in v2/.snapshots/ with the originals.`);
  process.exit(1);
} else {
  console.log(`All ${count} states match the baseline.`);
}
