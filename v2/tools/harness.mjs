// Shared by the browser checks: serves build/ on a free port and opens pages in Playwright.
import { chromium, webkit } from "playwright";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

export const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const buildDir = join(root, "build");

const CONTENT_TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".ico": "image/x-icon", ".webp": "image/webp", ".png": "image/png", ".txt": "text/plain" };

export async function serveBuild() {
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
  return { origin: `http://127.0.0.1:${server.address().port}`, close: () => server.close() };
}

export async function launchBrowser(name = "chromium") {
  const engine = { chromium, webkit }[name];
  if (!engine) throw new Error(`--browser must be chromium or webkit`);
  try {
    return await engine.launch();
  } catch (error) {
    console.error(`Couldn't start ${name}. Install it with: npx playwright install ${name}\n${error.message.split("\n")[0]}`);
    process.exit(1);
  }
}

// Opens `url` at the given viewport size. Page errors are collected in `page.errors`.
export async function openPage(browser, url, width, height, { javaScript = true, reducedMotion = "no-preference" } = {}) {
  // Clipboard access lets the copy and share buttons succeed, as they do for a person clicking them.
  // WebKit rejects these permission names, so it runs without them.
  const permissions = browser.browserType().name() === "chromium" ? ["clipboard-read", "clipboard-write"] : [];
  const page = await browser.newPage({ viewport: { width, height }, javaScriptEnabled: javaScript, reducedMotion, permissions });
  page.errors = [];
  page.on("pageerror", error => page.errors.push(error.message));
  // The Vercel analytics script only exists on Vercel.
  await page.route("**/_vercel/**", route => route.fulfill({ status: 200, contentType: "text/javascript", body: "" }));
  await page.goto(url);
  return page;
}
