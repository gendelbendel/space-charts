import { test } from "node:test";
import assert from "node:assert/strict";
import { OBJECTS } from "../src/data/objects.js";
import { MAIN_HEAD, starDescription, starHead, starTitle, sitemapXml } from "../src/star-pages.js";

const betelgeuse = OBJECTS.find(o => o.slug === "betelgeuse");

// The roadmap's example title, and the two URLs a link unfurler and a search engine read.
test("a star page names its star and points at its own URL and image", () => {
  assert.equal(starTitle(betelgeuse), "What color is Betelgeuse?");
  const head = starHead(betelgeuse);
  assert.equal(head.ogImage, "https://space-charts.vercel.app/og/betelgeuse.jpg");
  assert.match(head.headLinks, /<link rel="canonical" href="https:\/\/space-charts\.vercel\.app\/stars\/betelgeuse\/">/);
  assert.equal(head.htmlAttrs, ' data-t="3600"');
});

// The page reads this attribute instead of a query string. The CMB is the one object
// whose temperature the URL parser would round, so it must reach the page exact.
test("a star page carries the object's exact temperature", () => {
  assert.equal(starHead(OBJECTS.find(o => o.slug === "cmb")).htmlAttrs, ' data-t="2.72548"');
});

test("titles and descriptions are unique, fit search results and are safe in an attribute", () => {
  assert.equal(new Set(OBJECTS.map(starTitle)).size, OBJECTS.length, "duplicate title");
  assert.equal(new Set(OBJECTS.map(starDescription)).size, OBJECTS.length, "duplicate description");
  for (const o of OBJECTS) {
    const { title, description } = starHead(o);
    assert.ok(title.length <= 60, `${o.slug}: title is ${title.length} characters`);
    assert.doesNotMatch(title + description, /"|</, `${o.slug}: unescaped text`);
  }
});

test("the sitemap lists the main page, the game and every object, and not the embed", () => {
  const urls = [...sitemapXml().matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
  assert.equal(urls.length, OBJECTS.length + 2);
  assert.ok(urls.includes("https://space-charts.vercel.app/") && urls.includes("https://space-charts.vercel.app/play/"));
  assert.ok(urls.includes("https://space-charts.vercel.app/stars/betelgeuse/"));
  assert.ok(!urls.some(url => url.includes("/embed")));
});

test("the main page keeps its own head", () => {
  assert.equal(MAIN_HEAD.title, "What Color Is a Star?");
  assert.equal(MAIN_HEAD.htmlAttrs, "");
});
