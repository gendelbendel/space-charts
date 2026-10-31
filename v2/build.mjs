// Builds v2 into ../build as fully self-contained pages: partials are expanded,
// CSS and the bundled app script are inlined, so each page is one request.
// v1 lives in build/v1 (built separately by react-scripts) and is left alone.
import { build, transform } from "esbuild";
import { appendFile, readFile, writeFile, mkdir, readdir, rm, copyFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { SUN_TEFF } from "./src/physics.js";
import { OBJECTS } from "./src/data/objects.js";
import { prerender } from "./src/prerender.js";
import { MAIN_HEAD, SITE, starHead, sitemapXml } from "./src/star-pages.js";

const root = dirname(fileURLToPath(import.meta.url));
const ogDir = join(root, "og");
const out = join(root, "..", "build");
const publicDir = join(root, "..", "public");
const PUBLIC_ASSETS = ["favicon.ico", "preview.webp", "robots.txt"];
// Gzipped size limit per page, in KB. Every page needs an entry; the build
// fails when one is missing or over. Raise a budget only on the owner's say-so.
// The game and the embed reuse base.css (4.9 KB) and the physics and object modules (~10 KB). The embed
// also carries the chart (1.5 KB), so it gets 24. Star pages are the main page plus a few head tags,
// so one rule covers them all, at the main page's budget.
const STAR_PAGES = "stars/<slug>/index.html";
const BUDGETS_KB = { "index.html": 46, "play/index.html": 20, "embed/index.html": 24, [STAR_PAGES]: 46 };

async function listPages(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map(e => (e.isDirectory() ? listPages(join(dir, e.name)) : e.name.endsWith(".html") ? [join(dir, e.name)] : [])));
  return nested.flat();
}

async function expandIncludes(html) {
  const pattern = /<!-- include: ([\w-]+) -->/g;
  const names = [...new Set([...html.matchAll(pattern)].map(m => m[1]))];
  const partials = Object.fromEntries(await Promise.all(names.map(async n => [n, await readFile(join(root, "partials", `${n}.html`), "utf8")])));
  return html.replace(pattern, (_, name) => partials[name].trimEnd());
}

// Fills each {{name}} with the prerendered value. A name with no value fails the build.
function fillPrerender(html, values) {
  return html.replace(/\{\{(\w+)\}\}/g, (_, name) => {
    if (!(name in values)) throw new Error(`No prerendered value for {{${name}}}`);
    return values[name];
  });
}

async function inlineCss(html) {
  const pattern = /\/\* inline: ([\w./-]+) \*\//g;
  const files = await Promise.all([...html.matchAll(pattern)].map(m => readFile(join(root, m[1]), "utf8")));
  let i = 0;
  return html.replace(pattern, () => files[i++]);
}

// Every star page repeats the main page's CSS, so each distinct block is minified once.
const minifiedCss = new Map();
async function minifyCss(html) {
  const blocks = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)];
  for (const [whole, css] of blocks) {
    if (!minifiedCss.has(css)) minifiedCss.set(css, (await transform(css, { loader: "css", minify: true })).code.trim());
    html = html.replace(whole, () => `<style>${minifiedCss.get(css)}</style>`);
  }
  return html;
}

async function bundleScript(entry) {
  const result = await build({
    entryPoints: [join(root, entry)],
    bundle: true,
    minify: true,
    format: "iife",
    target: "es2020",
    write: false,
    legalComments: "none",
  });
  return result.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
}

async function cleanOutput() {
  await mkdir(out, { recursive: true });
  for (const entry of await readdir(out)) {
    if (entry !== "v1") await rm(join(out, entry), { recursive: true, force: true });
  }
}

const scripts = new Map();
async function inlineScripts(html) {
  const pattern = /<!-- inline-script: ([\w./-]+) -->/g;
  for (const [, entry] of html.matchAll(pattern)) {
    if (!scripts.has(entry)) scripts.set(entry, await bundleScript(entry));
  }
  return html.replace(pattern, (_, entry) => `<script>${scripts.get(entry)}</script>`);
}

const gzipKbOf = html => gzipSync(html, { level: 9 }).length / 1024;

async function buildPage(template, values, name) {
  let html = await readFile(template, "utf8");
  html = await expandIncludes(html);
  html = fillPrerender(html, values);
  html = await inlineCss(html);
  html = await minifyCss(html);
  html = await inlineScripts(html);
  const target = join(out, name);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, html);
  return html;
}

await cleanOutput();
const pagesDir = join(root, "pages");
const overBudget = [];
const checkBudget = (name, rule, gzipKb) => {
  const budget = BUDGETS_KB[rule];
  if (budget === undefined) overBudget.push(`${name} has no size budget; add one to BUDGETS_KB in v2/build.mjs`);
  else if (gzipKb > budget) overBudget.push(`${name} is ${gzipKb.toFixed(1)} KB gzipped, over its ${budget} KB budget`);
  return budget ?? "none";
};
const report = (path, html, gzipKb, budget) => console.log(`${path.padEnd(22)} ${(html.length / 1024).toFixed(1).padStart(6)} KB  ${gzipKb.toFixed(1).padStart(5)} KB gzip  (budget ${budget})`);

for (const page of await listPages(pagesDir)) {
  const name = relative(pagesDir, page);
  const html = await buildPage(page, { ...MAIN_HEAD, ...prerender(SUN_TEFF) }, name);
  const gzipKb = gzipKbOf(html);
  report(`build/${name}`, html, gzipKb, checkBudget(name, name, gzipKb));
}

const images = new Set(await readdir(ogDir).catch(() => []));
const missingImages = OBJECTS.filter(o => !images.has(`${o.slug}.jpg`)).map(o => o.slug);
if (missingImages.length) {
  console.error(`No preview image for ${missingImages.join(", ")}; run \`npm run og\` and commit v2/og/.`);
  process.exit(1);
}
let largest = { html: "", gzipKb: 0 };
for (const o of OBJECTS) {
  const name = `stars/${o.slug}/index.html`;
  const html = await buildPage(join(pagesDir, "index.html"), { ...starHead(o), ...prerender(o.T) }, name);
  const gzipKb = gzipKbOf(html);
  checkBudget(name, STAR_PAGES, gzipKb);
  if (gzipKb > largest.gzipKb) largest = { html, gzipKb };
}
report(`build/stars/ (${OBJECTS.length} pages, largest)`, largest.html, largest.gzipKb, BUDGETS_KB[STAR_PAGES]);
await mkdir(join(out, "og"));
await Promise.all([...images].map(name => copyFile(join(ogDir, name), join(out, "og", name))));
await writeFile(join(out, "sitemap.xml"), sitemapXml());
await Promise.all(PUBLIC_ASSETS.map(name => copyFile(join(publicDir, name), join(out, name))));
// robots.txt comes from v1's folder, which stays as it is, so the sitemap line is added here.
await appendFile(join(out, "robots.txt"), `Sitemap: ${SITE}/sitemap.xml\n`);
if (overBudget.length) {
  console.error(overBudget.map(line => `Size budget: ${line}`).join("\n"));
  process.exit(1);
}
