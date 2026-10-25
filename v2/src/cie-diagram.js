// The CIE 1931 chromaticity diagram, with the blackbody (and real-star) point.
import { cieHue, starHue, displayColor, linearSrgbToXy } from "./physics.js";
import { CIE1931_2DEG, CMF_START_NM, CMF_STEP_NM, CMF_ROWS } from "./data/cie1931.js";
import { state, shownModels } from "./state.js";
import { $ } from "./dom.js";

const BOX = { x0: 34, y0: 300, s: 340 };
const sx = x => BOX.x0 + x * BOX.s;
const sy = y => BOX.y0 - y * BOX.s;
let cieBase = "";

function buildCieBase() {
  const spectral = [];
  for (let i = 0; i < CMF_ROWS && CMF_START_NM + i * CMF_STEP_NM <= 700; i++) {
    const X = CIE1931_2DEG[3 * i], Y = CIE1931_2DEG[3 * i + 1], Z = CIE1931_2DEG[3 * i + 2];
    spectral.push(`${sx(X / (X + Y + Z)).toFixed(1)},${sy(Y / (X + Y + Z)).toFixed(1)}`);
  }
  const locus = [];
  for (let i = 0; i <= 80; i++) {
    const h = cieHue(600 * (100000 / 600) ** (i / 80));
    locus.push(`${sx(h.x).toFixed(1)},${sy(h.y).toFixed(1)}`);
  }
  const gamut = [[0.64, 0.33], [0.3, 0.6], [0.15, 0.06]].map(([x, y]) => `${sx(x)},${sy(y)}`).join(" ");
  const labels = [[1000, "1,000 K", 4, -6], [2000, "2,000", 4, -6], [4000, "4,000", 6, 14], [10000, "10,000", 0, 16]]
    .map(([T, text, dx, dy]) => {
      const h = cieHue(T);
      return `<circle cx="${sx(h.x)}" cy="${sy(h.y)}" r="2" fill="#8b91a5"/><text x="${sx(h.x) + dx}" y="${sy(h.y) + dy}" class="lbl">${text}</text>`;
    }).join("");
  let grid = "";
  for (let v = 0; v <= 0.8001; v += 0.2) {
    grid += `<line x1="${sx(v)}" y1="${sy(0)}" x2="${sx(v)}" y2="${sy(0.85)}" class="grid"/><text x="${sx(v)}" y="${sy(0) + 14}" class="lbl" text-anchor="middle">${v.toFixed(1)}</text>`;
    grid += `<line x1="${sx(0)}" y1="${sy(v)}" x2="${sx(0.8)}" y2="${sy(v)}" class="grid"/><text x="${sx(0) - 6}" y="${sy(v) + 3}" class="lbl" text-anchor="end">${v.toFixed(1)}</text>`;
  }
  cieBase = `${grid}
    <polygon points="${spectral.join(" ")}" fill="rgba(255,255,255,.04)" stroke="rgba(255,255,255,.35)"/>
    <polygon points="${gamut}" fill="none" stroke="rgba(156,196,255,.5)" stroke-dasharray="3 3"/>
    <text x="${sx(0.3) + 6}" y="${sy(0.6)}" class="lbl" fill="rgba(156,196,255,.85)">sRGB screen gamut</text>
    <text x="${sx(0.05)}" y="${sy(0.83)}" class="lbl">Visible colors (spectral locus)</text>
    <polyline points="${locus.join(" ")}" fill="none" stroke="#ffc58a" stroke-width="1.5"/>
    <circle cx="${sx(0.3127)}" cy="${sy(0.329)}" r="2.5" fill="#fff"/>
    <text x="${sx(0.3127) - 6}" y="${sy(0.329) - 6}" class="lbl" text-anchor="end">D65 white</text>
    ${labels}`;
}

// The diagram's SVG content and the readout under it.
export function cieMarkup() {
  if (!cieBase) buildCieBase();
  const h = cieHue(state.T);
  const star = starHue(state.T);
  const showStar = star.available && shownModels().includes("star");
  let marks = `<circle cx="${sx(h.x)}" cy="${sy(h.y)}" r="7" fill="${displayColor(state.T, "cie", "hue").hex}" stroke="#fff" stroke-width="2"/>`;
  let readout = `Blackbody: x ${h.x.toFixed(3)}, y ${h.y.toFixed(3)}`;
  if (showStar) {
    const s = linearSrgbToXy(star.linear);
    marks += `<circle cx="${sx(s.x)}" cy="${sy(s.y)}" r="9" fill="none" stroke="#9cc4ff" stroke-width="2" stroke-dasharray="3 2"/>`;
    readout += `<br>Star (ring): x ${s.x.toFixed(3)}, y ${s.y.toFixed(3)}`;
  }
  return { svg: `${cieBase}${marks}`, readout };
}

export function drawCie() {
  const { svg, readout } = cieMarkup();
  $("cie").innerHTML = svg;
  $("cieReadout").innerHTML = readout;
}
