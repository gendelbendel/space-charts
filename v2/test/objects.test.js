import { test } from "node:test";
import assert from "node:assert/strict";
import { OBJECTS } from "../src/data/objects.js";

// Slugs become URLs (/stars/<slug>/, roadmap P5.A), so they must be unique and
// safe to use as a path segment without escaping.
test("object slugs are unique, lowercase and URL-safe", () => {
  const slugs = OBJECTS.map(o => o.slug);
  assert.equal(new Set(slugs).size, slugs.length, "duplicate slug");
  for (const slug of slugs) assert.match(slug, /^[a-z0-9]+(-[a-z0-9]+)*$/, `bad slug "${slug}"`);
});

test("every object has a known category and a usable temperature", () => {
  for (const o of OBJECTS) {
    assert.ok(["star", "brown-dwarf", "everyday"].includes(o.category), `${o.name}: unknown category "${o.category}"`);
    assert.ok(Number.isFinite(o.T) && o.T > 0, `${o.name}: bad temperature`);
    assert.equal(typeof o.note, "string", `${o.name}: note must be a string ("" for none)`);
  }
});
