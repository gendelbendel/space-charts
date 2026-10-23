import { CIE1931_2DEG, CMF_START_NM, CMF_STEP_NM, CMF_ROWS } from "./data/cie1931.js";
import { HARRE_HELLER_2021 } from "./data/harre-heller-2021.js";

// Exact SI values since 2019, plus derived constants (CODATA 2018).
export const PHYS = {
  h: 6.62607015e-34,
  c: 299792458,
  k: 1.380649e-23,
  sigma: 5.670374419e-8,
  wien: 2.897771955e-3,
  Km: 683,
};

export const T_MIN = 100;
export const T_MAX = 100000;
export const T_INPUT_MAX = 1e6;
export const SUN_TEFF = 5772;
// Below this the visible spectrum underflows to zero in double precision. The
// hue stops changing long before that, so hue calculations clamp to it.
const HUE_T_FLOOR = 50;

// Approximate luminance thresholds (cd/m²) for a dark-adapted eye: below
// `absolute` nothing is seen, below `conesStart` only rods respond (no color),
// and above `fullColor` vision is fully photopic.
export const VISION = { absolute: 1e-6, conesStart: 1e-2, fullColor: 3 };

export const SIMPLE_BANDS = [
  { from: 620, to: 680 },
  { from: 500, to: 550 },
  { from: 430, to: 480 },
];

const SRGB_FROM_XYZ = [
  [3.2404542, -1.5371385, -0.4985314],
  [-0.969266, 1.8760108, 0.041556],
  [0.0556434, -0.2040259, 1.0572252],
];
const XYZ_FROM_SRGB = [
  [0.4124564, 0.3575761, 0.1804375],
  [0.2126729, 0.7151522, 0.072175],
  [0.0193339, 0.119192, 0.9503041],
];

const STAR_TABLE = HARRE_HELLER_2021.map(([spt, teff, logg, r, g, b, hex]) => ({ spt, teff, logg, linear: [r, g, b], hex }));
export const STAR_T_RANGE = [STAR_TABLE[0].teff, STAR_TABLE[STAR_TABLE.length - 1].teff];

/** Spectral radiance in W·m⁻²·sr⁻¹·m⁻¹ at a wavelength in nm. */
export function planck(nm, T) {
  if (!(nm > 0 && T > 0)) return 0;
  const m = nm * 1e-9;
  const x = (PHYS.h * PHYS.c) / (m * PHYS.k * T);
  if (x > 700) return 0;
  return (2 * PHYS.h * PHYS.c ** 2) / m ** 5 / Math.expm1(x);
}

export function trapezoid(f, a, b, n) {
  const dx = (b - a) / n;
  let sum = 0.5 * (f(a) + f(b));
  for (let i = 1; i < n; i++) sum += f(a + i * dx);
  return sum * dx;
}

export function cieXYZ(T) {
  let X = 0, Y = 0, Z = 0;
  const dl = CMF_STEP_NM * 1e-9;
  for (let i = 0; i < CMF_ROWS; i++) {
    const b = planck(CMF_START_NM + i * CMF_STEP_NM, T) * dl;
    X += b * CIE1931_2DEG[3 * i];
    Y += b * CIE1931_2DEG[3 * i + 1];
    Z += b * CIE1931_2DEG[3 * i + 2];
  }
  return [X, Y, Z];
}

/** Photopic surface luminance of a blackbody, in cd/m². */
export const luminance = T => PHYS.Km * cieXYZ(T)[1];
const SUN_LUMINANCE = luminance(SUN_TEFF);

export const wienPeakNm = T => (PHYS.wien / T) * 1e9;
export const radiantExitance = T => PHYS.sigma * T ** 4;
export function visibleFraction(T) {
  const visible = trapezoid(nm => planck(nm, T) * 1e-9, 380, 780, 80);
  return visible / (radiantExitance(T) / Math.PI);
}

const mul = (m, v) => m.map(r => r[0] * v[0] + r[1] * v[1] + r[2] * v[2]);
export const relLuminance = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
export const encodeSrgb = v => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
const decodeSrgb = v => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const clamp01 = v => Math.min(1, Math.max(0, v));
export const toHex = encoded => "#" + encoded.map(v => Math.round(255 * clamp01(v)).toString(16).padStart(2, "0")).join("");

export function linearSrgbToXy(linear) {
  const [X, Y, Z] = mul(XYZ_FROM_SRGB, linear);
  return { x: X / (X + Y + Z), y: Y / (X + Y + Z) };
}

/** v1's method: three fixed bands used directly as 8-bit sRGB, with no gamma step. */
export function simpleHue(T) {
  const f = nm => planck(nm, Math.max(T, HUE_T_FLOOR));
  const bands = SIMPLE_BANDS.map(({ from, to }) => trapezoid(f, from, to, 10));
  const max = Math.max(...bands);
  const encoded = bands.map(v => (max > 0 ? v / max : 0));
  // Decoding v1's bytes back to linear keeps the displayed hue identical to v1.
  return { available: true, bands, encoded, linear: encoded.map(decodeSrgb) };
}

export function cieHue(T) {
  const xyz = cieXYZ(Math.max(T, HUE_T_FLOOR));
  const [X, Y, Z] = xyz;
  const sum = X + Y + Z;
  const raw = mul(SRGB_FROM_XYZ, [X / Y, 1, Z / Y]);
  const min = Math.min(...raw);
  const outOfGamut = min < 0;
  // Out-of-gamut colors get white mixed in until no channel is negative, which keeps the hue.
  const inGamut = outOfGamut ? raw.map(v => v - min) : raw;
  const max = Math.max(...inGamut);
  return { available: true, xyz, x: X / sum, y: Y / sum, raw, outOfGamut, linear: inGamut.map(v => v / max) };
}

/** Colors from model stellar spectra (Harre & Heller 2021), interpolated linearly in temperature. */
export function starHue(T) {
  const [lo, hi] = STAR_T_RANGE;
  if (!(T >= lo && T <= hi)) return { available: false, range: STAR_T_RANGE };
  let i = STAR_TABLE.findIndex(row => row.teff >= T);
  if (STAR_TABLE[i].teff === T) return { available: true, below: STAR_TABLE[i], above: STAR_TABLE[i], t: 0, linear: STAR_TABLE[i].linear };
  const below = STAR_TABLE[i - 1], above = STAR_TABLE[i];
  const t = (T - below.teff) / (above.teff - below.teff);
  const mixed = below.linear.map((v, k) => v + (above.linear[k] - v) * t);
  const max = Math.max(...mixed);
  return { available: true, below, above, t, linear: mixed.map(v => v / max) };
}

export const MODELS = {
  simple: { label: "Simple (v1)", hue: simpleHue },
  cie: { label: "CIE 1931", hue: cieHue },
  star: { label: "Real stars", hue: starHue },
};

export function brightnessFor(T, mode) {
  const Lv = luminance(T);
  if (mode === "hue") return { scale: 1, saturation: 1, Lv };
  if (mode === "sun") {
    const relative = Lv / SUN_LUMINANCE;
    return { scale: 1 - Math.exp(-2 * relative), saturation: 1, Lv, overexpose: true };
  }
  const logL = Math.log10(Math.max(Lv, 1e-300));
  const lo = Math.log10(VISION.absolute), hi = Math.log10(VISION.fullColor), cones = Math.log10(VISION.conesStart);
  return {
    scale: clamp01((logL - lo) / (hi - lo)) ** 3,
    saturation: clamp01((logL - cones) / (hi - cones)),
    Lv,
  };
}

// Gives the hue the requested display luminance. Past full brightness it mixes
// toward white instead of clipping, which is how an overexposed light looks.
export function applyBrightness(linearHue, { scale, saturation, overexpose }) {
  const hueY = relLuminance(linearHue);
  if (!(hueY > 0)) return [0, 0, 0];
  const c = linearHue.map(v => hueY + (v - hueY) * saturation);
  const target = overexpose ? scale : hueY * scale;
  if (target <= hueY) return c.map(v => (v * target) / hueY);
  const t = (target - hueY) / (1 - hueY);
  return c.map(v => v + (1 - v) * t);
}

/**
 * The on-screen color for a temperature. When the chosen model has no data at
 * this temperature (real stars outside 2,300–55,000 K), `fallback` is true and
 * the CIE blackbody color is used.
 */
export function displayColor(T, model, light) {
  let hue = MODELS[model].hue(T);
  const fallback = !hue.available;
  if (fallback) hue = cieHue(T);
  const lin = applyBrightness(hue.linear, brightnessFor(T, light));
  const enc = lin.map(encodeSrgb);
  return { hex: toHex(enc), enc, lin, hue, fallback };
}

/** Parses a user-supplied temperature. Returns null for anything unusable. */
export function parseTemperature(value) {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const T = Math.round(Number(value));
  if (!Number.isFinite(T) || T < 1) return null;
  return Math.min(T, T_INPUT_MAX);
}
