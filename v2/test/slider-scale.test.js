import { test } from "node:test";
import assert from "node:assert/strict";
import { SLIDER_KNOTS, makeScale } from "../src/slider-scale.js";
import { SPECTRAL_CLASSES } from "../src/data/objects.js";

const scale = makeScale(SLIDER_KNOTS);

test("the slider spans 100–100,000 K and passes through its knots", () => {
  assert.equal(scale.toFraction(100), 0);
  assert.equal(scale.toFraction(100000), 1);
  for (const [T, f] of SLIDER_KNOTS) assert.ok(Math.abs(scale.toFraction(T) - f) < 1e-12, `${T} K should sit at ${f}`);
});

// A non-monotonic mapping would make the thumb jump backwards while dragging.
test("the slider position only ever increases with temperature", () => {
  let previous = -1;
  for (let T = 100; T <= 100000; T *= 1.01) {
    const f = scale.toFraction(T);
    assert.ok(f > previous, `not increasing at ${T} K`);
    previous = f;
  }
});

test("slider positions convert back to the same temperature", () => {
  for (let s = 0; s <= 1000; s += 7) {
    const T = scale.toT(s / 1000);
    assert.ok(Math.abs(scale.toFraction(T) * 1000 - s) < 1e-6, `position ${s}`);
  }
});

test("out-of-range temperatures clamp to the ends of the bar", () => {
  assert.equal(scale.toFraction(10), 0);
  assert.equal(scale.toFraction(1e6), 1);
});

// The point of this scale (owner, 2026-10-25): the plain log slider gave a third
// of the bar to ≤1,000 K and a sixth to O stars, hiding the classes in between.
// If the knots change, these shares should still favor the stars people look at.
test("the cold end and O stars get a small share; M through A stars get half the bar", () => {
  const share = letter => {
    const [, lo, hi] = SPECTRAL_CLASSES.find(([l]) => l === letter);
    return scale.toFraction(Math.min(hi, 100000)) - scale.toFraction(Math.max(lo, 100));
  };
  assert.ok(scale.toFraction(1000) <= 0.1, "≤1,000 K should get at most 10%");
  assert.ok(share("O") <= 0.06, "O stars should get at most 6%");
  const stellar = ["M", "K", "G", "F", "A"].reduce((sum, l) => sum + share(l), 0);
  assert.ok(stellar >= 0.45, `M–A stars get ${stellar}`);
});
