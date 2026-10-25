import { test } from "node:test";
import assert from "node:assert/strict";
import { OBJECTS, CATEGORIES } from "../src/data/objects.js";
import { wienPeakNm } from "../src/physics.js";

// Slugs become URLs (/stars/<slug>/, roadmap P5.A), so they must be unique and
// safe to use as a path segment without escaping.
test("object slugs are unique, lowercase and URL-safe", () => {
  const slugs = OBJECTS.map(o => o.slug);
  assert.equal(new Set(slugs).size, slugs.length, "duplicate slug");
  for (const slug of slugs) assert.match(slug, /^[a-z0-9]+(-[a-z0-9]+)*$/, `bad slug "${slug}"`);
});

test("every object has a known category and a usable temperature", () => {
  for (const o of OBJECTS) {
    assert.ok(CATEGORIES.some(([c]) => c === o.category), `${o.name}: unknown category "${o.category}"`);
    assert.ok(Number.isFinite(o.T) && o.T > 0, `${o.name}: bad temperature`);
    assert.equal(typeof o.note, "string", `${o.name}: note must be a string ("" for none)`);
  }
});

// The list shows one heading per category, so an empty category would leave a
// heading with nothing under it.
test("every category has objects", () => {
  for (const [category, heading] of CATEGORIES) assert.ok(OBJECTS.some(o => o.category === category), `no objects under "${heading}"`);
});

const bySlug = slug => OBJECTS.find(o => o.slug === slug);

// Fixsen 2009 (ApJ 707, 916) measured the CMB at 2.72548 ± 0.00057 K; its
// spectrum peaks at 1.063 mm per unit wavelength.
test("the CMB is Fixsen's temperature and peaks at 1.063 mm", () => {
  assert.equal(bySlug("cmb").T, 2.72548);
  assert.ok(Math.abs(wienPeakNm(bySlug("cmb").T) / 1e6 - 1.063) < 0.0005);
});

// The "When the universe turned transparent" card says ~3,000 K, stretched by
// ~1,100 into today's CMB. Planck 2018 (results VI, Table 2) puts last
// scattering at z* = 1089.92, so the light then was T_CMB × (1 + z*) ≈ 2,976 K.
test("the recombination card matches the CMB stretched by Planck 2018's redshift", () => {
  const atRecombination = bySlug("cmb").T * (1 + 1089.92);
  assert.ok(Math.abs(bySlug("recombination").T / atRecombination - 1) < 0.02);
  assert.equal(Math.round((1 + 1089.92) / 100) * 100, 1100);
});
