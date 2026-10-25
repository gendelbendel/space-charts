// Pure text formatting, with no DOM access, so the build can use it too.
import { VISION, visibleFraction, radiantExitance, eyeLuminance } from "./physics.js";

export const formatK = T => T.toLocaleString("en-US");
export function formatWavelength(nm) {
  if (nm >= 1e6) return (nm / 1e6).toPrecision(3) + " mm";
  if (nm >= 1000) return (nm / 1000).toPrecision(3) + " µm";
  return nm.toPrecision(3) + " nm";
}
const SUPERSCRIPT = "⁰¹²³⁴⁵⁶⁷⁸⁹";
export function formatSci(v, digits = 2) {
  if (v === 0) return "0";
  const [mantissa, e] = v.toExponential(digits).split("e");
  const exp = Number(e);
  if (exp >= -2 && exp <= 4) return Number(v.toPrecision(digits + 1)).toLocaleString("en-US");
  return `${mantissa}×10${String(exp).replace("-", "⁻").replace(/\d/g, d => SUPERSCRIPT[d])}`;
}
export const formatTriple = values => values.map(v => v.toFixed(3)).join(", ");
export const swatch = hex => `<span class="swatch" style="background:${hex}"></span>${hex}`;

export function visibilityVerdict(T, Lv, peakNm) {
  const peak = formatWavelength(peakNm);
  if (eyeLuminance(T, Lv) < VISION.absolute) return `<strong>Invisible.</strong> Its light peaks at ${peak}, ${peakNm >= 1e6 ? "in microwaves" : "far in the infrared"}.`;
  if (Lv < VISION.conesStart) return `<strong>A faint, colorless glow.</strong> Too dim for your cones; only rods see it.`;
  if (Lv < VISION.fullColor) return `<strong>Dim, washed-out color.</strong> Your cones are only partly responding.`;
  if (peakNm < 380) return `<strong>Blinding blue-white.</strong> Mostly ultraviolet light (peak ${peak}).`;
  if (peakNm > 780) return `<strong>Clearly visible,</strong> though most of its output is infrared (peak ${peak}).`;
  return `<strong>Clearly visible.</strong> Its peak (${peak}) is visible light.`;
}

// The four stats under the chart, keyed by element id.
export function statsText(T, Lv, peakNm) {
  const vf = visibleFraction(T);
  return {
    sPeak: formatWavelength(peakNm),
    sVis: vf < 1e-4 ? formatSci(vf * 100) + " %" : (vf * 100).toFixed(vf < 0.1 ? 2 : 1) + " %",
    sLum: formatSci(Lv) + " cd/m²",
    sFlux: formatSci(radiantExitance(T)) + " W",
  };
}
