import { test } from "node:test";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import {
  PHYS, planck, trapezoid, cieHue, simpleHue, starHue, displayColor, luminance,
  wienPeakNm, radiantExitance, parseTemperature, encodeSrgb, toHex,
} from "../src/physics.js";
import { HARRE_HELLER_2021 } from "../src/data/harre-heller-2021.js";
import { CIE1931_2DEG, CMF_START_NM, CMF_STEP_NM, CMF_ROWS } from "../src/data/cie1931.js";

const close = (actual, expected, tol, msg) =>
  assert.ok(Math.abs(actual - expected) <= tol, `${msg}: expected ${expected} ± ${tol}, got ${actual}`);

// Published Planckian-locus chromaticities (CIE 1931 2°). If the embedded color
// matching table or the integration were wrong, these would drift in the third decimal.
test("blackbody chromaticity matches the published Planckian locus", () => {
  for (const [T, x, y] of [[1000, 0.6528, 0.3444], [2856, 0.4476, 0.4074], [5000, 0.3451, 0.3516], [10000, 0.2807, 0.2884]]) {
    const hue = cieHue(T);
    close(hue.x, x, 5e-4, `x at ${T} K`);
    close(hue.y, y, 5e-4, `y at ${T} K`);
  }
});

test("the color matching table is balanced: an equal-energy spectrum is white (1/3, 1/3)", () => {
  const sums = [0, 1, 2].map(k => CIE1931_2DEG.filter((_, i) => i % 3 === k).reduce((a, b) => a + b));
  const total = sums[0] + sums[1] + sums[2];
  close(sums[0] / total, 1 / 3, 2e-4, "x");
  close(sums[1] / total, 1 / 3, 2e-4, "y");
});

// The embedded table was typed in, not downloaded. This compares every 5 nm row
// with CIE's official dataset (doi:10.25039/CIE.DS.xvudnb9b, CIE 018:2019 Table 6,
// 360–830 nm at 1 nm, CC BY-SA 4.0), committed unmodified in test/data with its
// metadata. The embedded values are the official ones rounded to six decimals, so
// no entry may be off by more than half a unit in the sixth decimal (diffed
// 2026-10-25: the largest gap is 4.9 × 10⁻⁷, x̄ at 780 nm).
test("the color matching table is CIE's official CSV, rounded to six decimals", () => {
  const csv = readFileSync(new URL("./data/CIE_xyz_1931_2deg.csv", import.meta.url), "utf8");
  const official = new Map(csv.trim().split(/\r?\n/).map(line => {
    const [nm, ...xyz] = line.split(",").map(Number);
    return [nm, xyz];
  }));
  assert.equal(official.size, 471, "the official CSV covers 360–830 nm at 1 nm");
  assert.equal(CMF_START_NM + (CMF_ROWS - 1) * CMF_STEP_NM, 780);
  for (let i = 0; i < CMF_ROWS; i++) {
    const nm = CMF_START_NM + i * CMF_STEP_NM;
    official.get(nm).forEach((expected, k) => close(CIE1931_2DEG[3 * i + k], expected, 5e-7 + 1e-12, `${"xyz"[k]}̄ at ${nm} nm`));
  }
});

test("Wien's law puts the Sun's peak near 502 nm", () => {
  close(wienPeakNm(5772), 502.04, 0.01, "peak");
});

// Integrating Planck's law over all wavelengths and solid angle must give σT⁴.
// This catches unit mistakes (nm vs m) anywhere in planck().
test("Planck's law integrates to the Stefan–Boltzmann law", () => {
  const T = 5772;
  const integral = Math.PI * trapezoid(nm => planck(nm, T) * 1e-9, 10, 1e6, 200000);
  close(integral / radiantExitance(T), 1, 1e-4, "ratio");
});

// v1 evaluated planck(0) as ∞/∞ = NaN on every chart.
test("planck() returns 0, not NaN, at zero or negative inputs", () => {
  assert.equal(planck(0, 5772), 0);
  assert.equal(planck(500, 0), 0);
  assert.equal(planck(-1, 5772), 0);
});

test("the Sun's surface luminance is about 1.8 × 10⁹ cd/m²", () => {
  close(luminance(5772) / 1e9, 1.84, 0.02, "luminance");
});

// The main v1 complaint: cold objects rendered as saturated red. In "Your eye"
// mode a 310 K body must be black, and the Draper point (~798 K) a colorless grey.
test("cold objects go black or grey instead of red", () => {
  assert.equal(displayColor(310, "cie", "eye").hex, "#000000");
  const [r, g, b] = displayColor(798, "cie", "eye").hex.match(/\w\w/g);
  assert.ok(r === g && g === b, "798 K should be achromatic");
  assert.notEqual(displayColor(798, "cie", "eye").hex, "#000000");
});

test("hot blackbodies converge on pale blue near (0.240, 0.235)", () => {
  const hue = cieHue(1e6);
  close(hue.x, 0.240, 2e-3, "x");
  close(hue.y, 0.235, 2e-3, "y");
});

test("the simple model reproduces v1's output byte for byte", () => {
  const v1Rgb = T => {
    const h = 6.626e-34, c = 2.998e8, k = 1.381e-23;
    const p = nm => { const l = nm * 1e-9; return (2 * h * c ** 2) / l ** 5 / (Math.exp((h * c) / (l * k * T)) - 1); };
    const bands = [[620, 680], [500, 550], [430, 480]].map(([a, b]) => trapezoid(p, a, b, 10));
    const max = Math.max(...bands);
    return bands.map(v => Math.round((255 * v) / max));
  };
  for (const T of [1200, 3600, 5772, 9940, 20000]) {
    const ours = simpleHue(T).encoded.map(v => Math.round(255 * v));
    assert.deepEqual(ours, v1Rgb(T), `at ${T} K`);
  }
});

test("the real-star table loads in full and in temperature order", () => {
  assert.equal(HARRE_HELLER_2021.length, 105);
  const temps = HARRE_HELLER_2021.map(row => row[1]);
  assert.deepEqual(temps, [...temps].sort((a, b) => a - b));
});

// The paper's hex codes are linear × 255. Recomputing them from the linear
// columns confirms the table was transcribed correctly.
test("the paper's hex codes equal its linear values × 255 (no gamma)", () => {
  for (const [spt, , , r, g, b, hex] of HARRE_HELLER_2021) {
    const recomputed = "#" + [r, g, b].map(v => Math.round(255 * v).toString(16).padStart(2, "0")).join("");
    const diff = recomputed.slice(1).match(/\w\w/g).map((p, i) => Math.abs(parseInt(p, 16) - parseInt(hex.slice(1 + 2 * i, 3 + 2 * i), 16)));
    assert.ok(Math.max(...diff) <= 1, `${spt}: ${recomputed} vs ${hex}`);
  }
});

test("real-star colors hit table rows exactly, interpolate between them, and apply gamma", () => {
  const g2v = starHue(5800);
  assert.deepEqual(g2v.linear, [1.0, 0.931, 0.905]);
  assert.equal(toHex(g2v.linear.map(encodeSrgb)), "#fff7f4");
  const between = starHue(5750);
  close(between.linear[2], (0.878 + 0.905) / 2, 1e-9, "blue halfway between G4V and G2V");
});

test("real-star model falls back to CIE outside 2,300–55,000 K", () => {
  assert.equal(starHue(2299).available, false);
  assert.equal(starHue(60000).available, false);
  const out = displayColor(1500, "star", "hue");
  assert.equal(out.fallback, true);
  assert.equal(out.hex, displayColor(1500, "cie", "hue").hex);
});

// v1 let ?temp=abc through as NaN because NaN fails every comparison.
test("parseTemperature rejects junk and clamps huge values", () => {
  for (const bad of ["abc", "", null, undefined, "0", "-5", "NaN", "Infinity"]) assert.equal(parseTemperature(bad), null, String(bad));
  assert.equal(parseTemperature("5772"), 5772);
  assert.equal(parseTemperature("5772.6"), 5773);
  assert.equal(parseTemperature("1e9"), 1e6);
});

test("every display color is a valid hex code across the whole range", () => {
  for (let T = 1; T <= 1e6; T *= 1.37) {
    for (const model of ["simple", "cie", "star"]) for (const light of ["hue", "eye", "sun"]) {
      assert.match(displayColor(T, model, light).hex, /^#[0-9a-f]{6}$/, `${model}/${light} at ${T}`);
    }
  }
  assert.ok(PHYS.Km === 683);
});
