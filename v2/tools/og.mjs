// Renders each object's 1200×630 preview card into v2/og/, for link unfurlers: OG images
// must be files, and there's no server to draw them. Run `npm run og` after adding an
// object or changing its name or temperature, and commit the result; build.mjs copies
// v2/og/ into build/og/ and fails if an object has no card.
import { mkdir, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { luminance } from "../src/physics.js";
import { OBJECTS } from "../src/data/objects.js";
import { formatK } from "../src/format.js";
import { state, readState } from "../src/state.js";
import { discLooks } from "../src/stage.js";
import { root, launchBrowser } from "./harness.mjs";

const outDir = join(root, "v2", "og");
const baseCss = await readFile(join(root, "v2/src/base.css"), "utf8");

const cardHtml = o => {
  Object.assign(state, readState(""), { T: o.T });
  const [look] = discLooks(luminance(o.T)).filter(Boolean);
  return `<!doctype html><style>${baseCss}
    body { width: 1200px; height: 630px; box-sizing: border-box; padding: 64px 72px; display: grid; grid-template-columns: 340px 1fr; gap: 88px; align-items: center; overflow: hidden; }
    .disc { width: 340px; }
    h1 { margin: 0; font-size: 64px; line-height: 1.1; letter-spacing: -.01em; }
    .temp { margin: 18px 0 0; font: 600 44px var(--mono); }
    .type { margin: 10px 0 0; font-size: 28px; color: var(--muted); }
    .site { margin: 40px 0 0; font-size: 24px; color: var(--muted); }
  </style>
  <div class="disc${look.invisible ? " invisible" : ""}" style="background:${look.background};box-shadow:${look.boxShadow}"></div>
  <div><h1>${o.name}</h1><p class="temp">${formatK(o.T)} K</p><p class="type">${o.type}</p><p class="site">What color is a star?</p></div>`;
};

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });
const browser = await launchBrowser();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const o of OBJECTS) {
  await page.setContent(cardHtml(o));
  await page.screenshot({ path: join(outDir, `${o.slug}.jpg`), type: "jpeg", quality: 82 });
}
await browser.close();
console.log(`Rendered ${OBJECTS.length} cards to v2/og/.`);
