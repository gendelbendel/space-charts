import { CIE1931_2DEG, CMF_START_NM, CMF_STEP_NM, CMF_ROWS } from "./data/cie1931.js";
import { HARRE_HELLER_2021 } from "./data/harre-heller-2021.js";
import { SCOTOPIC_V } from "./data/cie1951-scotopic.js";
import { OBJECTS } from "./data/objects.js";

// Exact SI values since 2019, plus derived constants (CODATA 2018).
export const PHYS = {
  h: 6.62607015e-34,
  c: 299792458,
  k: 1.380649e-23,
  sigma: 5.670374419e-8,
  wien: 2.897771955e-3,
  Km: 683,
  KmScotopic: 1700,
};

export const T_MIN = 100;
export const T_MAX = 100000;
export const T_INPUT_MAX = 1e6;
export const SUN_TEFF = 5772;
// Below this the visible spectrum underflows to zero in double precision. The
// hue stops changing long before that, so hue calculations clamp to it.
const HUE_T_FLOOR = 50;

// Approximate luminance thresholds (cd/m²) for a dark-adapted eye: below
// `absolute` (a rod threshold, compared with eyeLuminance) nothing is seen,
// below `conesStart` only rods respond (no color), and above `fullColor`
// vision is fully photopic.
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

/** Scotopic (rod) luminance of a blackbody, in scotopic cd/m². */
export function scotopicLuminance(T) {
  let sum = 0;
  for (let i = 0; i < CMF_ROWS; i++) sum += planck(CMF_START_NM + i * CMF_STEP_NM, T) * SCOTOPIC_V[i];
  return PHYS.KmScotopic * sum * CMF_STEP_NM * 1e-9;
}

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

// Where L sits between lo and hi on a log scale, from 0 to 1.
const logPosition = (L, lo, hi) => clamp01(Math.log10(Math.max(L, 1e-300) / lo) / Math.log10(hi / lo));
// How far the cones have taken over from the rods: 0 below `conesStart`, 1 from `fullColor`.
const coneShare = Lv => logPosition(Lv, VISION.conesStart, VISION.fullColor);

/**
 * The luminance a dark-adapted eye responds to, in cd/m²: scotopic while only
 * rods see, photopic once the cones fully respond, and a mix in between (the
 * form of CIE 191:2010's mesopic model, simplified). Rods barely see deep red,
 * so a dim red-hot glow is fainter to the eye than its photopic luminance says.
 */
export function eyeLuminance(T, Lv = luminance(T)) {
  const m = coneShare(Lv);
  return m === 1 ? Lv : m * Lv + (1 - m) * scotopicLuminance(T);
}

export function brightnessFor(T, mode) {
  const Lv = luminance(T);
  if (mode === "hue") return { scale: 1, saturation: 1, Lv };
  if (mode === "sun") {
    const relative = Lv / SUN_LUMINANCE;
    return { scale: 1 - Math.exp(-2 * relative), saturation: 1, Lv, overexpose: true };
  }
  return {
    scale: logPosition(eyeLuminance(T, Lv), VISION.absolute, VISION.fullColor) ** 3,
    saturation: coneShare(Lv),
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

// Display P3 (CSS `display-p3`): the P3 primaries of SMPTE EG 432-1 with a D65
// white and the sRGB transfer function. Most phones and laptops can show it.
const XYZ_FROM_P3 = [
  [0.4865709, 0.2656677, 0.1982173],
  [0.2289746, 0.6917385, 0.0792869],
  [0, 0.0451134, 1.0439444],
];
const P3_FROM_XYZ = [
  [2.4934969, -0.9313836, -0.4027108],
  [-0.829489, 1.7626641, 0.0236247],
  [0.0358458, -0.0761724, 0.9568845],
];
export const linearP3ToXyz = v => mul(XYZ_FROM_P3, v);
export const xyzToLinearP3 = xyz => mul(P3_FROM_XYZ, xyz);

/**
 * The on-screen color for a wide-gamut screen, as linear and encoded Display P3,
 * plus its XYZ. Where the hue fits in sRGB this is displayColor's color exactly.
 * Colder than about 1,900 K the CIE hue is outside sRGB; P3 holds more of it, so
 * less white is mixed in and the red stays deeper. The luminance stays the sRGB
 * color's unless a P3 channel would pass 1.
 */
export function displayColorP3(T, model, light) {
  const color = displayColor(T, model, light);
  let hue = color.hue.linear;
  if (color.hue.outOfGamut) {
    const [X, Y, Z] = color.hue.xyz;
    const raw = xyzToLinearP3([X / Y, 1, Z / Y]);
    // P3 needs less white than sRGB; mixing it in adds 1 to every channel, in either space, and 1 to the luminance.
    const min = Math.min(0, ...raw);
    const k = Math.min(relLuminance(hue) / (1 - min), 1 / (Math.max(...raw) - min));
    hue = color.hue.raw.map(v => (v - min) * k);
  }
  const xyz = mul(XYZ_FROM_SRGB, applyBrightness(hue, brightnessFor(T, light)));
  const lin = xyzToLinearP3(xyz);
  return { lin, enc: lin.map(encodeSrgb), xyz };
}

/**
 * Parses a user-supplied temperature: kelvin, °C or °F ("1200 °C", "-40F"), or an
 * object's name or alias ("Vega", "bulb"). Returns kelvin, to 3 decimals below
 * 100 K and whole above (decision D5), or null for anything unusable.
 */
export function parseTemperature(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  if (text === "") return null;
  const K = parseQuantity(text) ?? objectTemperature(text);
  if (K === null || !(K > 0)) return null;
  const T = K < 100 ? Math.round(K * 1000) / 1000 : Math.round(K);
  return T > 0 ? Math.min(T, T_INPUT_MAX) : null;
}

export const toKelvin = (value, unit) => (unit === "c" ? value + 273.15 : unit === "f" ? ((value - 32) * 5) / 9 + 273.15 : value);

// "5,772 K", "1 234k", "1200 °C", "−40 degrees F", "1e5". Digit groups may be split by commas or spaces.
// A bare degree sign ("1200 °") names no scale, so it is rejected.
const QUANTITY = /^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)\s*(°|º|˚|deg(?:rees?)?)?\s*(k|kelvins?|c|celsius|centigrade|f|fahrenheit)?$/i;
function parseQuantity(text) {
  const match = text.replace(/[−–]/g, "-").replace(/(\d)[\s,_](?=\d)/g, "$1").match(QUANTITY);
  if (!match || (match[2] && !match[3])) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? toKelvin(value, (match[3] ?? "k")[0].toLowerCase()) : null;
}

// Names compare without case, accents, punctuation or a leading "the", so
// "wise 0855−0714", "WISE 0855-0714" and "the sun" all match.
export const nameKey = name => name.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase().replace(/^the\s+/, "").replace(/[^\p{L}\p{N}]/gu, "");

/** An object's T by name, slug or alias; failing that, by a unique prefix of 3+ characters ("wise 0855"). */
export function objectTemperature(text) {
  const key = nameKey(text);
  if (!key) return null;
  const keysOf = o => [o.name, o.slug, ...(o.aliases ?? [])].map(nameKey);
  const exact = OBJECTS.find(o => keysOf(o).includes(key));
  if (exact) return exact.T;
  if (key.length < 3) return null;
  const prefixed = OBJECTS.filter(o => keysOf(o).some(k => k.startsWith(key)));
  return prefixed.length === 1 ? prefixed[0].T : null;
}
