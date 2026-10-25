// Builds v2 into ../build as fully self-contained pages: partials are expanded,
// CSS and the bundled app script are inlined, so each page is one request.
// v1 lives in build/v1 (built separately by react-scripts) and is left alone.
import { build, transform } from "esbuild";
import { readFile, writeFile, mkdir, readdir, rm, copyFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const out = join(root, "..", "build");
const publicDir = join(root, "..", "public");
const PUBLIC_ASSETS = ["favicon.ico", "preview.webp", "robots.txt"];
// Gzipped size limit per page, in KB. Every page needs an entry; the build
// fails when one is missing or over. Raise a budget only on the owner's say-so.
const BUDGETS_KB = { "index.html": 40 };

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

async function inlineCss(html) {
  const pattern = /\/\* inline: ([\w./-]+) \*\//g;
  const files = await Promise.all([...html.matchAll(pattern)].map(m => readFile(join(root, m[1]), "utf8")));
  let i = 0;
  return html.replace(pattern, () => files[i++]);
}

async function minifyCss(html) {
  const blocks = [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)];
  for (const [whole, css] of blocks) {
    const { code } = await transform(css, { loader: "css", minify: true });
    html = html.replace(whole, () => `<style>${code.trim()}</style>`);
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

await cleanOutput();
const pagesDir = join(root, "pages");
const overBudget = [];
for (const page of await listPages(pagesDir)) {
  let html = await readFile(page, "utf8");
  html = await expandIncludes(html);
  html = await inlineCss(html);
  html = await minifyCss(html);
  html = await inlineScripts(html);
  const target = join(out, relative(pagesDir, page));
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, html);
  const name = relative(pagesDir, page);
  const gzipKb = gzipSync(html, { level: 9 }).length / 1024;
  const budget = BUDGETS_KB[name];
  console.log(`${relative(join(root, ".."), target).padEnd(22)} ${(html.length / 1024).toFixed(1).padStart(6)} KB  ${gzipKb.toFixed(1).padStart(5)} KB gzip  (budget ${budget ?? "none"})`);
  if (budget === undefined) overBudget.push(`${name} has no size budget; add one to BUDGETS_KB in v2/build.mjs`);
  else if (gzipKb > budget) overBudget.push(`${name} is ${gzipKb.toFixed(1)} KB gzipped, over its ${budget} KB budget`);
}
await Promise.all(PUBLIC_ASSETS.map(name => copyFile(join(publicDir, name), join(out, name))));
if (overBudget.length) {
  console.error(overBudget.map(line => `Size budget: ${line}`).join("\n"));
  process.exit(1);
}
