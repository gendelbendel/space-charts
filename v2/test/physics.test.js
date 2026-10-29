import { test } from "node:test";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import {
  PHYS, planck, trapezoid, cieHue, simpleHue, starHue, displayColor, luminance,
  wienPeakNm, radiantExitance, parseTemperature, toKelvin, encodeSrgb, toHex,
  scotopicLuminance, eyeLuminance, VISION, linearP3ToXyz, xyzToLinearP3, displayColorP3, linearSrgbToXy, relLuminance,
  IAU_SUN, sphereLuminosity,
} from "../src/physics.js";
import { HARRE_HELLER_2021 } from "../src/data/harre-heller-2021.js";
import { CIE1931_2DEG, CMF_START_NM, CMF_STEP_NM, CMF_ROWS } from "../src/data/cie1931.js";
import { SCOTOPIC_V } from "../src/data/cie1951-scotopic.js";

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

// CIE's datasets are CSV files of wavelength followed by one or more values.
function readCieCsv(name) {
  const csv = readFileSync(new URL(`./data/${name}`, import.meta.url), "utf8");
  return new Map(csv.trim().split(/\r?\n/).map(line => {
    const [nm, ...values] = line.split(",").map(Number);
    return [nm, values];
  }));
}

// The embedded table was typed in, not downloaded. This compares every 5 nm row
// with CIE's official dataset (doi:10.25039/CIE.DS.xvudnb9b, CIE 018:2019 Table 6,
// 360–830 nm at 1 nm, CC BY-SA 4.0), committed unmodified in test/data with its
// metadata. The embedded values are the official ones rounded to six decimals, so
// no entry may be off by more than half a unit in the sixth decimal (diffed
// 2026-10-25: the largest gap is 4.9 × 10⁻⁷, x̄ at 780 nm).
test("the color matching table is CIE's official CSV, rounded to six decimals", () => {
  const official = readCieCsv("CIE_xyz_1931_2deg.csv");
  assert.equal(official.size, 471, "the official CSV covers 360–830 nm at 1 nm");
  assert.equal(CMF_START_NM + (CMF_ROWS - 1) * CMF_STEP_NM, 780);
  for (let i = 0; i < CMF_ROWS; i++) {
    const nm = CMF_START_NM + i * CMF_STEP_NM;
    official.get(nm).forEach((expected, k) => close(CIE1931_2DEG[3 * i + k], expected, 5e-7 + 1e-12, `${"xyz"[k]}̄ at ${nm} nm`));
  }
});

// The scotopic table was taken from CIE's official CSV (CIE 018:2019 Table 2,
// doi:10.25039/CIE.DS.gr6w4b5g, CC BY-SA 4.0), every 5 nm row, without rounding.
test("the scotopic V′(λ) table is CIE's official CSV at 5 nm", () => {
  const official = readCieCsv("CIE_sle_scotopic.csv");
  assert.equal(SCOTOPIC_V.length, CMF_ROWS, "same wavelength grid as the color matching table");
  for (let i = 0; i < CMF_ROWS; i++) {
    const nm = CMF_START_NM + i * CMF_STEP_NM;
    assert.equal(SCOTOPIC_V[i], official.get(nm)[0], `V′ at ${nm} nm`);
  }
  assert.equal(official.get(507)[0], 1, "V′ peaks at 507 nm");
});

// Rods (CIE 1951 V′) and cones (CIE 1924 V, which is ȳ) weight a spectrum
// differently, and the S/P ratio ρ = 1700∫E·V′ dλ / 683∫E·V dλ measures how.
// Crumey (2014, MNRAS 442, 2600, §1.3) evaluates it for blackbodies with the
// same CIE tables: ρ = 1.408 at 2,850 K (Blackwell's lamps, equivalent to CIE
// Illuminant A, the usual "S/P 1.41"), ρ(2850 K)/ρ(2360 K) = 1.220, and his Eq. 7
// fit, ρ = 5.738×10⁶/T² − 8.152×10³/T + 3.564, within about 1 % from 2,000 to
// 50,000 K (2.45 for a 6,500 K blackbody). A wrong K′m (1,700 lm/W), a shifted
// table or an nm/m slip in scotopicLuminance() breaks all three. We get 1.4096 at
// 2,850 K whether the official tables are used at 5 nm or 1 nm, 380–780 nm or
// 360–830 nm, so the 0.1 % gap to his 1.408 lies in his inputs (table edition or
// rounding), and that check allows ±0.002. The fit agrees with our integration
// to 0.01 % at 2,850, 6,500 and 30,000 K and within 1 % from 2,500 K up, but is
// 2.2 % off at 2,000 K, the bottom of its range, so that end isn't checked.
test("scotopic luminance gives Crumey's (2014) published S/P ratios", () => {
  const sp = T => scotopicLuminance(T) / luminance(T);
  close(sp(2850), 1.408, 2e-3, "S/P at 2,850 K");
  close(sp(2850) / sp(2360), 1.220, 1e-3, "S/P ratio of 2,850 K to 2,360 K");
  const eq7 = T => 5.738e6 / T ** 2 - 8.152e3 / T + 3.564;
  for (const T of [2500, 2856, 4000, 5772, 6500, 10000, 20000, 30000, 50000]) close(sp(T) / eq7(T), 1, 0.01, `S/P vs Eq. 7 at ${T} K`);
});

// The eye's luminance is the rods' (scotopic) below the cone threshold and the
// cones' (photopic) once color is fully seen, so the rod-only "grey glow" range
// uses scotopic luminance and bright light is unchanged.
test("the eye uses scotopic luminance in the rod-only range and photopic in full color", () => {
  for (const T of [650, 700, 798]) {
    assert.ok(luminance(T) < VISION.conesStart, `${T} K is rod-only`);
    assert.equal(eyeLuminance(T), scotopicLuminance(T), `${T} K`);
  }
  for (const T of [1500, 5772]) assert.equal(eyeLuminance(T), luminance(T), `${T} K`);
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

// IAU 2015 Resolution B3 defines nominal solar values: R☉ = 6.957 × 10⁸ m,
// T☉ = 5,772 K and L☉ = 3.828 × 10²⁶ W, chosen to be consistent through
// L = 4πR²σT⁴. A slip in the formula (R instead of R², a missing 4π) or in σ fails here.
test("a sphere of the IAU nominal solar radius at 5,772 K radiates the IAU nominal solar luminosity", () => {
  assert.equal(IAU_SUN.R, 6.957e8);
  assert.equal(IAU_SUN.L, 3.828e26);
  close(sphereLuminosity(6.957e8, 5772) / 3.828e26, 1, 1e-3, "L / L☉");
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

// P1.A: the readout takes °C and °F. The conversions are the SI definitions
// (T/K = t/°C + 273.15) and the Fahrenheit scale's fixed points: water freezes
// at 0 °C = 32 °F = 273.15 K and boils at 100 °C = 212 °F = 373.15 K, and the
// two scales cross at −40. parseTemperature then rounds to whole kelvin at
// 100 K and above (decision D5), so it is checked separately from the exact value.
test("Celsius and Fahrenheit convert exactly to kelvin", () => {
  const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} vs ${expected}`);
  near(toKelvin(0, "c"), 273.15);
  near(toKelvin(32, "f"), 273.15);
  near(toKelvin(100, "c"), 373.15);
  near(toKelvin(212, "f"), 373.15);
  near(toKelvin(-40, "c"), 233.15);
  near(toKelvin(-40, "f"), 233.15);
  near(toKelvin(-459.67, "f"), 0);
  assert.equal(parseTemperature("0 °C"), 273);
  assert.equal(parseTemperature("100 °C"), 373);
  assert.equal(parseTemperature("-40 °C"), parseTemperature("-40 °F"));
  assert.equal(parseTemperature("−40 °F"), 233);
});

test("parseTemperature reads units the way people type them", () => {
  for (const [text, K] of [["5772", 5772], ["5,772 K", 5772], ["5772k", 5772], ["1 234k", 1234], [" 5772 kelvin ", 5772],
    ["1200 °C", 1473], ["1200C", 1473], ["1200 celsius", 1473], ["1200 degrees C", 1473],
    ["2000 F", 1366], ["2000°f", 1366], ["-40 °F", 233], ["−40 F", 233]]) {
    assert.equal(parseTemperature(text), K, text);
  }
  for (const bad of ["1200 °", "12 00 x", "°C", "5772 KK", "1,2,3 G"]) assert.equal(parseTemperature(bad), null, bad);
});

test("parseTemperature rejects anything at or below absolute zero", () => {
  for (const bad of ["−300 C", "-300 C", "-273.15 C", "-459.67 F", "-500 F", "0 K", "-1 K", "0.0001"]) assert.equal(parseTemperature(bad), null, bad);
  assert.equal(parseTemperature("-273 C"), 0.15);
});

// Decision D5: up to 3 decimals below 100 K (the CMB is 2.72548 K, Fixsen 2009), whole kelvin above.
test("parseTemperature keeps 3 decimals below 100 K and whole kelvin above", () => {
  assert.equal(parseTemperature("2.72548"), 2.725);
  assert.equal(parseTemperature("0.5"), 0.5);
  assert.equal(parseTemperature("99.9994"), 99.999);
  assert.equal(parseTemperature("100.4"), 100);
  assert.equal(parseTemperature("273.15"), 273);
});

test("parseTemperature looks up object names and aliases", () => {
  for (const [text, K] of [["Sun", 5772], ["sun", 5772], ["The Sun", 5772], ["VEGA", 9600], ["bulb", 2700], ["light bulb", 2700],
    ["candle", 1850], ["Candle flame", 1850], ["wise 0855", 285], ["WISE 0855-0714", 285], ["wise 0855−0714", 285],
    ["wise-0350-5658", 325], ["Sírius A", 9940], ["sirius", 9940], ["proxima", 3042], ["you", 310]]) {
    assert.equal(parseTemperature(text), K, text);
  }
  // Too short or shared by several objects: "wise" fits two brown dwarfs.
  for (const bad of ["wise", "al", "the", "pluto"]) assert.equal(parseTemperature(bad), null, bad);
});

test("every display color is a valid hex code across the whole range", () => {
  for (let T = 1; T <= 1e6; T *= 1.37) {
    for (const model of ["simple", "cie", "star"]) for (const light of ["hue", "eye", "sun"]) {
      assert.match(displayColor(T, model, light).hex, /^#[0-9a-f]{6}$/, `${model}/${light} at ${T}`);
    }
  }
  assert.ok(PHYS.Km === 683);
});

// Display P3 is defined by SMPTE EG 432-1's primaries with the D65 white point
// (CSS Color 4 uses the same). If the matrices were mistyped or inverted, the
// primaries would land somewhere else and white would come out tinted.
const chromaticity = ([X, Y, Z]) => [X / (X + Y + Z), Y / (X + Y + Z)];
test("the Display P3 matrices reproduce the published P3 primaries and D65 white", () => {
  for (const [name, rgb, x, y] of [["red", [1, 0, 0], 0.68, 0.32], ["green", [0, 1, 0], 0.265, 0.69], ["blue", [0, 0, 1], 0.15, 0.06], ["white", [1, 1, 1], 0.3127, 0.329]]) {
    const [cx, cy] = chromaticity(linearP3ToXyz(rgb));
    close(cx, x, 1e-4, `${name} x`);
    close(cy, y, 1e-4, `${name} y`);
  }
  const d65 = [0.3127 / 0.329, 1, (1 - 0.3127 - 0.329) / 0.329];
  for (const v of xyzToLinearP3(d65)) close(v, 1, 1e-4, "D65 white in P3");
  for (const v of xyzToLinearP3(linearP3ToXyz([0.2, 0.5, 0.9])).map((v, i) => v - [0.2, 0.5, 0.9][i])) close(v, 0, 1e-6, "round trip");
});

// At 1,500 K the blackbody lies outside sRGB, so the sRGB color needs white mixed
// in and drifts off the locus. P3 is wide enough to show the published locus
// chromaticity (0.5857, 0.3931) itself, at the same luminance.
test("wide-gamut colors keep the published locus chromaticity that sRGB can't reach", () => {
  assert.ok(cieHue(1500).outOfGamut, "1,500 K is outside sRGB");
  const p3 = displayColorP3(1500, "cie", "hue");
  const [x, y] = chromaticity(p3.xyz);
  close(x, 0.5857, 5e-4, "P3 x at 1,500 K");
  close(y, 0.3931, 5e-4, "P3 y at 1,500 K");
  assert.ok(linearSrgbToXy(displayColor(1500, "cie", "hue").lin).x < 0.575, "sRGB is paler");
  close(p3.xyz[1], relLuminance(displayColor(1500, "cie", "hue").lin), 1e-3, "same luminance");
});

test("inside sRGB, wide-gamut screens get exactly the sRGB color", () => {
  for (const [T, model, light] of [[5772, "cie", "eye"], [3600, "star", "sun"], [1200, "simple", "hue"], [20000, "cie", "hue"]]) {
    const srgb = displayColor(T, model, light).lin;
    const p3 = displayColorP3(T, model, light);
    const a = linearSrgbToXy(srgb), [x, y] = chromaticity(p3.xyz);
    close(x, a.x, 1e-6, `x, ${model}/${light} at ${T} K`);
    close(y, a.y, 1e-6, `y, ${model}/${light} at ${T} K`);
    close(p3.xyz[1], relLuminance(srgb), 1e-4, `luminance, ${model}/${light} at ${T} K`);
  }
});

test("wide-gamut colors stay inside P3 and cold objects stay black", () => {
  for (let T = 100; T <= 1e6; T *= 1.37) {
    for (const light of ["hue", "eye", "sun"]) {
      for (const v of displayColorP3(T, "cie", light).lin) assert.ok(v > -5e-4 && v < 1 + 5e-4, `${light} at ${T}`);
    }
  }
  assert.deepEqual(displayColorP3(310, "cie", "eye").enc.map(v => Math.round(255 * v)), [0, 0, 0]);
});
