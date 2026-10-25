import {
  PHYS, SUN_TEFF, VISION, SIMPLE_BANDS, STAR_T_RANGE, MODELS,
  planck, luminance, wienPeakNm, radiantExitance, visibleFraction, relLuminance,
  displayColor, simpleHue, cieHue, starHue, encodeSrgb, toHex, linearSrgbToXy, parseTemperature,
} from "./physics.js";
import { CIE1931_2DEG, CMF_START_NM, CMF_STEP_NM, CMF_ROWS } from "./data/cie1931.js";
import { OBJECTS, SPECTRAL_CLASSES, CLASS_INFO } from "./data/objects.js";
import { SLIDER_KNOTS, makeScale } from "./slider-scale.js";
import { createSliderMarks, trackGradient, spectralClass, classRange } from "./slider-marks.js";

const MODEL_KEYS = Object.keys(MODELS);
const LIGHT_KEYS = ["hue", "eye", "sun"];
const SIMPLE_BAND_FILLS = ["rgba(255,80,80,.16)", "rgba(80,255,120,.14)", "rgba(90,140,255,.18)"];
const CMF_COLORS = ["#ff7a7a", "#7dff9a", "#7aa8ff"];

const $ = id => document.getElementById(id);

const query = new URLSearchParams(location.search);
const state = {
  T: parseTemperature(query.get("t") ?? query.get("temp")) ?? SUN_TEFF,
  model: MODEL_KEYS.includes(query.get("model")) ? query.get("model") : "cie",
  light: LIGHT_KEYS.includes(query.get("light")) ? query.get("light") : "eye",
  compare: query.get("compare") === "1",
  yscale: "lin",
  view: "spectrum",
};
const scale = makeScale(SLIDER_KNOTS);

// ---------- formatting ----------

const formatK = T => T.toLocaleString("en-US");
function formatWavelength(nm) {
  if (nm >= 1e6) return (nm / 1e6).toPrecision(3) + " mm";
  if (nm >= 1000) return (nm / 1000).toPrecision(3) + " µm";
  return nm.toPrecision(3) + " nm";
}
const SUPERSCRIPT = "⁰¹²³⁴⁵⁶⁷⁸⁹";
function formatSci(v, digits = 2) {
  if (v === 0) return "0";
  const [mantissa, e] = v.toExponential(digits).split("e");
  const exp = Number(e);
  if (exp >= -2 && exp <= 4) return Number(v.toPrecision(digits + 1)).toLocaleString("en-US");
  return `${mantissa}×10${String(exp).replace("-", "⁻").replace(/\d/g, d => SUPERSCRIPT[d])}`;
}
const formatTriple = values => values.map(v => v.toFixed(3)).join(", ");
const swatch = hex => `<span class="swatch" style="background:${hex}"></span>${hex}`;
const tToSlider = T => 1000 * scale.toFraction(T);
const sliderToT = s => Math.round(scale.toT(s / 1000));

function visibilityVerdict(Lv, peakNm) {
  const peak = formatWavelength(peakNm);
  if (Lv < VISION.absolute) return `<strong>Invisible.</strong> Its light peaks at ${peak}, far in the infrared.`;
  if (Lv < VISION.conesStart) return `<strong>A faint, colorless glow.</strong> Too dim for your cones; only rods see it.`;
  if (Lv < VISION.fullColor) return `<strong>Dim, washed-out color.</strong> Your cones are only partly responding.`;
  if (peakNm < 380) return `<strong>Blinding blue-white.</strong> Mostly ultraviolet light (peak ${peak}).`;
  if (peakNm > 780) return `<strong>Clearly visible,</strong> though most of its output is infrared (peak ${peak}).`;
  return `<strong>Clearly visible.</strong> Its peak (${peak}) is visible light.`;
}

const shownModels = () => (state.compare ? MODEL_KEYS : [state.model]);

// ---------- controls ----------

const slider = $("slider"), num = $("num");

function setTemperature(T) {
  if (T === null) return;
  state.T = T;
  render();
}

slider.addEventListener("input", () => setTemperature(sliderToT(+slider.value)));
// The big readout doubles as the text box: it shows "5,772" and edits as "5772".
// Typing doesn't re-render (that would reformat under the cursor); Enter or
// leaving the field applies the value, and Escape or junk reverts it.
num.addEventListener("focus", () => {
  num.value = state.T;
  sizeReadout(String(state.T));
  num.select();
});
num.addEventListener("input", () => sizeReadout(num.value));
num.addEventListener("keydown", e => {
  if (e.key === "Enter") num.blur();
  if (e.key === "Escape") {
    num.value = state.T;
    num.blur();
  }
});
num.addEventListener("change", () => setTemperature(parseTemperature(num.value.replace(/[\s,k]/gi, ""))));
num.addEventListener("blur", () => render());

// Sizes the text box to its contents. An invisible copy of the text inside the
// same label measures it with exactly the same font settings (tabular digits,
// letter spacing), which "ch" units and canvas measureText both get wrong.
const measure = document.createElement("span");
measure.className = "temp-measure";
measure.setAttribute("aria-hidden", "true");
$("tempBig").appendChild(measure);
function sizeReadout(text) {
  measure.textContent = text || "0";
  num.style.width = `${Math.ceil(measure.getBoundingClientRect().width) + 2}px`;
}
window.addEventListener("resize", () => sizeReadout(num.value));
$("compare").addEventListener("change", e => { state.compare = e.target.checked; render(); });
document.querySelectorAll(".seg[data-key]").forEach(group => {
  group.addEventListener("click", e => {
    const button = e.target.closest("button");
    if (!button) return;
    state[group.dataset.key] = button.dataset.v;
    render();
  });
});

const layoutSliderMarks = createSliderMarks({ classRow: $("classTicks"), markRow: $("markTicks"), scale, onPick: setTemperature });

let trackKey = "";
function paintTrack() {
  const key = state.model + state.light;
  if (key === trackKey) return;
  trackKey = key;
  slider.style.setProperty("--track", trackGradient(scale, T => displayColor(T, state.model, state.light).hex));
}

// ---------- spectral class info ----------

const classChip = $("classChip"), classInfo = $("classInfo");

function renderClassInfo() {
  const letter = spectralClass(state.T);
  classChip.textContent = `Class ${letter}`;
  if (classInfo.hidden) return;
  const info = CLASS_INFO[letter];
  classInfo.innerHTML = `
    <div class="ci-head"><strong>Class ${letter} · ${info.name}</strong><button type="button" class="ci-close" aria-label="Close">×</button></div>
    <p class="ci-range">${classRange(letter)}</p>
    <p>${info.about}</p>
    <p class="ci-examples">Examples: ${info.examples}</p>
    <p class="ci-foot">Classes describe stars and brown dwarfs. <a href="#faq-classes" data-open-faq>All classes</a></p>`;
}

function setClassInfoOpen(open) {
  classInfo.hidden = !open;
  classChip.setAttribute("aria-expanded", String(open));
  renderClassInfo();
}

classChip.addEventListener("click", () => setClassInfoOpen(classInfo.hidden));
classInfo.addEventListener("click", e => {
  if (e.target.closest(".ci-close")) setClassInfoOpen(false);
  const link = e.target.closest("[data-open-faq]");
  if (link) {
    setClassInfoOpen(false);
    $("faq-classes").open = true;
  }
});
document.addEventListener("click", e => {
  if (!classInfo.hidden && !classInfo.contains(e.target) && e.target !== classChip) setClassInfoOpen(false);
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && !classInfo.hidden) {
    setClassInfoOpen(false);
    classChip.focus();
  }
});

function buildClassList() {
  $("classList").innerHTML = SPECTRAL_CLASSES.map(([letter]) => {
    const info = CLASS_INFO[letter];
    return `<div><dt><span class="cl-letter">${letter}</span>${info.name} <span class="cl-range">${classRange(letter)}</span></dt><dd>${info.about} Examples: ${info.examples}.</dd></div>`;
  }).join("");
}

// ---------- star ----------

const discs = MODEL_KEYS.map(model => {
  const figure = document.createElement("figure");
  figure.className = "disc-wrap";
  figure.innerHTML = `<div class="disc"></div><figcaption></figcaption>`;
  $("discs").appendChild(figure);
  return { model, figure, disc: figure.firstChild, caption: figure.lastChild };
});

function renderStage(Lv) {
  const models = shownModels();
  $("stage").classList.toggle("comparing", state.compare);
  const hexes = [];
  for (const { model, figure, disc, caption } of discs) {
    figure.hidden = !models.includes(model);
    if (figure.hidden) continue;
    const color = displayColor(state.T, model, state.light);
    const noData = color.fallback && state.compare;
    const [r, g, b] = color.enc.map(v => Math.round(255 * v));
    const glow = noData ? 0 : relLuminance(color.lin);
    disc.style.background = noData ? "none" : `radial-gradient(circle, rgb(${r},${g},${b}) 0%, rgb(${r},${g},${b}) 55%, rgba(${r},${g},${b},.82) 100%)`;
    disc.style.boxShadow = glow > 0.002 ? `0 0 ${30 + 70 * glow}px ${6 + 24 * glow}px rgba(${r},${g},${b},${Math.min(0.55, glow)})` : "none";
    disc.classList.toggle("invisible", noData || (state.light !== "hue" && Lv < VISION.absolute));
    caption.textContent = state.compare ? `${MODELS[model].label}${noData ? " · no data" : ""}` : "";
    hexes.push(noData ? "—" : color.hex);
  }
  $("labelHex").textContent = hexes.join(" · ");

  // Every mode has a one-line note, so the line is always there and switching modes never shifts the layout.
  let note = "As seen by a dark-adapted eye.", warn = false;
  if (state.model === "star" && !state.compare && !starHue(state.T).available) {
    note = "No star data here; using CIE 1931.";
    warn = true;
  } else if (state.light === "hue") {
    warn = Lv < VISION.fullColor;
    note = warn ? "Tint only; it would look darker." : "Tint at full brightness.";
  } else if (state.light === "sun") {
    note = "Brightness relative to the Sun.";
  }
  $("stageNote").textContent = note;
  $("stageNote").classList.toggle("warn", warn);
}

// ---------- how the color was computed ----------

function pipelineHtml(model) {
  const T = state.T;
  const color = displayColor(T, model, state.light);
  const steps = [];
  let title = MODELS[model].label, sub = "";
  if (model === "simple") {
    const h = simpleHue(T);
    sub = "The original v1 method: three fixed bands, used directly as red, green and blue.";
    steps.push(
      ["Add up the spectrum in three bands", `R 620–680 nm = ${formatSci(h.bands[0])}<br>G 500–550 nm = ${formatSci(h.bands[1])}<br>B 430–480 nm = ${formatSci(h.bands[2])} W·m⁻²·sr⁻¹`],
      ["Divide each by the largest", formatTriple(h.encoded)],
      ["Use them directly as screen RGB (no gamma, no eye response)", h.encoded.map(v => Math.round(255 * v)).join(", ")],
    );
  } else if (model === "cie") {
    const h = cieHue(T);
    const [X, Y, Z] = h.xyz;
    sub = "Weight the visible spectrum by how human eyes respond, then convert to screen color.";
    steps.push(
      ["Weight the spectrum by x̄, ȳ, z̄ and add up 380–780 nm", `X = ${formatSci(X)}, Y = ${formatSci(Y)}, Z = ${formatSci(Z)}`],
      ["Luminance = 683 lm/W × Y", `${formatSci(PHYS.Km * Y)} cd/m²`],
      ["Chromaticity: x = X/(X+Y+Z), y = Y/(X+Y+Z)", `x = ${h.x.toFixed(4)}, y = ${h.y.toFixed(4)}`],
      ["Convert to linear sRGB with the standard matrix", formatTriple(h.raw) + (h.outOfGamut ? "<br>Outside the screen's gamut, so white is mixed in until nothing is negative." : "")],
      ["Apply the sRGB gamma curve", swatch(toHex(h.linear.map(encodeSrgb)))],
    );
  } else {
    const h = starHue(T);
    sub = "Colors computed from model spectra of real main-sequence stars (Harre & Heller 2021).";
    if (!h.available) {
      steps.push(["No data at this temperature", `The table covers ${formatK(STAR_T_RANGE[0])}–${formatK(STAR_T_RANGE[1])} K (M9.5 V to O1 V). ${state.compare ? "" : "The star shows the CIE 1931 blackbody color instead."}`]);
      return pipelineCard(title, sub, steps);
    }
    const row = r => `${r.spt} · ${formatK(r.teff)} K · log g ${r.logg} → ${formatTriple(r.linear)}`;
    steps.push(
      ["Look up the nearest model stars in the table", h.t === 0 ? row(h.below) : `${row(h.below)}<br>${row(h.above)}`],
      [h.t === 0 ? "Exact table row, no interpolation needed" : "Interpolate linearly in temperature", formatTriple(h.linear)],
      ["Apply the sRGB gamma curve. The paper skips this step, so its own codes look more saturated.", `${swatch(toHex(h.linear.map(encodeSrgb)))}<br>Paper-style, no gamma: ${swatch(toHex(h.linear))}`],
    );
  }
  steps.push(["Apply the brightness setting", swatch(color.fallback ? "—" : color.hex)]);
  return pipelineCard(title, sub, steps);
}

function pipelineCard(title, sub, steps) {
  const items = steps.map(([what, value]) => `<li><div>${what}<div class="v">${value}</div></div></li>`).join("");
  return `<div class="pipe-card"><h3>${title}</h3><p class="sub">${sub}</p><ol class="pipe">${items}</ol></div>`;
}

function renderPipelines() {
  $("pipes").innerHTML = shownModels().map(pipelineHtml).join("");
  $("pipes").classList.toggle("multi", state.compare);
}

// ---------- spectrum chart ----------

const canvas = $("chart"), tip = $("tip");
let chartGeom = null;

function wavelengthColor(nm, alpha) {
  let r = 0, g = 0, b = 0;
  if (nm < 440) { r = (440 - nm) / 60; b = 1; }
  else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
  else if (nm < 510) { g = 1; b = (510 - nm) / 20; }
  else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
  else if (nm < 645) { r = 1; g = (645 - nm) / 65; }
  else r = 1;
  const edge = nm < 420 ? 0.3 + (0.7 * (nm - 380)) / 40 : nm > 700 ? 0.3 + (0.7 * (780 - nm)) / 80 : 1;
  return `rgba(${Math.round(255 * r * edge)},${Math.round(255 * g * edge)},${Math.round(255 * b * edge)},${alpha})`;
}

function drawChart() {
  const W = canvas.clientWidth, H = canvas.clientHeight;
  if (!W || !H) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);

  const T = state.T, logY = state.yscale === "log", narrow = W < 480;
  const peak = wienPeakNm(T);
  const lo = Math.max(1, Math.min(250, peak / 5)), hi = Math.max(1100, peak * 8);
  const pad = { l: narrow ? 50 : 64, r: 10, t: 14, b: 30 };
  const pw = W - pad.l - pad.r, ph = H - pad.t - pad.b, base = pad.t + ph;
  const xOf = nm => pad.l + (Math.log(nm / lo) / Math.log(hi / lo)) * pw;
  const nmOf = x => lo * (hi / lo) ** ((x - pad.l) / pw);
  const yMax = planck(Math.min(Math.max(peak, lo), hi), T) * 1e-9 * 1.08;
  const yMinLog = yMax * 1e-12;
  const yOf = v => logY
    ? pad.t + ph * (1 - (Math.log10(Math.max(v, yMinLog)) - Math.log10(yMinLog)) / (Math.log10(yMax) - Math.log10(yMinLog)))
    : pad.t + ph * (1 - v / yMax);
  chartGeom = { xOf, nmOf, yOf, pad, pw, T };

  ctx.font = "11px ui-monospace, Menlo, monospace";
  ctx.strokeStyle = "rgba(255,255,255,.07)";
  ctx.fillStyle = "#8b91a5";
  ctx.lineWidth = 1;
  const xSteps = narrow ? [1] : [1, 2, 5];
  for (const decade of [1, 10, 100, 1000, 1e4, 1e5, 1e6]) for (const m of xSteps) {
    const nm = decade * m;
    if (nm < lo || nm > hi) continue;
    const x = xOf(nm);
    ctx.beginPath(); ctx.moveTo(x, pad.t); ctx.lineTo(x, base); ctx.stroke();
    ctx.textAlign = "center";
    ctx.fillText(nm >= 1000 ? `${nm / 1000} µm` : `${nm} nm`, x, H - 10);
  }
  ctx.textAlign = "right";
  const top = yMax / 1.08;
  const yTicks = logY ? [0, 3, 6, 9, 12].map(k => top / 10 ** k) : [0.25, 0.5, 0.75, 1].map(f => top * f);
  for (const v of yTicks) {
    const y = yOf(v);
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(pad.l + pw, y); ctx.stroke();
    ctx.fillText(v.toExponential(narrow ? 0 : 1), pad.l - 6, y + 4);
  }

  const N = 360, points = [];
  for (let i = 0; i <= N; i++) {
    const nm = lo * (hi / lo) ** (i / N);
    points.push([xOf(nm), yOf(planck(nm, T) * 1e-9)]);
  }
  const traceArea = () => {
    ctx.beginPath();
    ctx.moveTo(points[0][0], base);
    for (const [x, y] of points) ctx.lineTo(x, y);
    ctx.lineTo(points[N][0], base);
    ctx.closePath();
  };

  ctx.fillStyle = "rgba(255,255,255,.05)";
  traceArea(); ctx.fill();
  const v0 = xOf(380), v1 = xOf(780);
  const rainbow = ctx.createLinearGradient(v0, 0, v1, 0);
  for (let nm = 380; nm <= 780; nm += 20) rainbow.addColorStop((xOf(nm) - v0) / (v1 - v0), wavelengthColor(nm, 0.85));
  ctx.save();
  ctx.beginPath(); ctx.rect(v0, pad.t, v1 - v0, ph); ctx.clip();
  ctx.fillStyle = rainbow; traceArea(); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,.035)"; ctx.fillRect(v0, pad.t, v1 - v0, ph);
  ctx.restore();

  const models = shownModels();
  if (models.includes("simple")) {
    SIMPLE_BANDS.forEach(({ from, to }, i) => {
      ctx.fillStyle = SIMPLE_BAND_FILLS[i];
      ctx.fillRect(xOf(from), pad.t, xOf(to) - xOf(from), ph);
    });
  }
  if (models.includes("cie")) {
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.2;
    for (let k = 0; k < 3; k++) {
      ctx.strokeStyle = CMF_COLORS[k];
      ctx.beginPath();
      for (let i = 0; i < CMF_ROWS; i++) {
        const x = xOf(CMF_START_NM + i * CMF_STEP_NM), y = base - (CIE1931_2DEG[3 * i + k] / 1.8) * ph * 0.9;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  ctx.strokeStyle = "#f3f4f8";
  ctx.lineWidth = 2;
  ctx.beginPath();
  points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();

  const px = xOf(peak), flip = px > W - 120;
  ctx.setLineDash([2, 4]);
  ctx.strokeStyle = "rgba(255,197,138,.8)";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(px, pad.t); ctx.lineTo(px, base); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#ffc58a";
  ctx.textAlign = flip ? "right" : "left";
  ctx.fillText(`peak ${formatWavelength(peak)}`, px + (flip ? -6 : 6), pad.t + 12);

  const legend = [["#f3f4f8", "Planck curve"], ["linear-gradient(90deg,#8040ff,#00f,#0ff,#0f0,#ff0,#f00)", "Visible light"]];
  if (models.includes("simple")) legend.push(["rgba(255,255,255,.35)", "Simple's bands"]);
  if (models.includes("cie")) legend.push([`linear-gradient(90deg,${CMF_COLORS[0]} 33%,${CMF_COLORS[1]} 33% 66%,${CMF_COLORS[2]} 66%)`, "x̄ ȳ z̄ eye response"]);
  if (models.includes("star")) legend.push(["transparent", "Real stars use model spectra"]);
  $("legend").innerHTML = legend.map(([c, t]) => `<span><i style="background:${c}"></i>${t}</span>`).join("");
}

canvas.addEventListener("pointermove", e => {
  if (!chartGeom) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const { nmOf, yOf, pad, pw, T } = chartGeom;
  if (x < pad.l || x > pad.l + pw) { tip.hidden = true; return; }
  const nm = nmOf(x), v = planck(nm, T) * 1e-9;
  tip.hidden = false;
  tip.textContent = `${formatWavelength(nm)} · ${v.toExponential(3)} W·m⁻²·sr⁻¹·nm⁻¹`;
  tip.style.left = Math.max(4, Math.min(x + 12, rect.width - tip.offsetWidth - 4)) + "px";
  tip.style.top = Math.max(4, yOf(v) - 34) + "px";
});
canvas.addEventListener("pointerleave", () => (tip.hidden = true));
new ResizeObserver(() => drawChart()).observe(canvas);

// ---------- chromaticity diagram ----------

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

function drawCie() {
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
  $("cie").innerHTML = `${cieBase}${marks}`;
  $("cieReadout").innerHTML = readout;
}

// ---------- objects ----------

function renderObjects() {
  $("objects").innerHTML = OBJECTS.map(([name, type, T, note], i) => {
    const hex = displayColor(T, state.model, state.light).hex;
    const current = T === state.T ? ' aria-current="true"' : "";
    return `<li><button type="button" data-i="${i}"${current}>
      <span class="dot" style="background:${hex}"></span>
      <span class="obj-main"><span class="obj-name">${name}</span><span class="obj-meta">${type} · ${formatK(T)} K</span>${note ? `<span class="obj-note">${note}</span>` : ""}</span>
    </button></li>`;
  }).join("");
}

$("objects").addEventListener("click", e => {
  const button = e.target.closest("button[data-i]");
  if (!button) return;
  setTemperature(OBJECTS[+button.dataset.i][2]);
  const anchor = document.querySelector("[data-scroll-anchor]") ?? document.body;
  anchor.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
});

// ---------- FAQ ----------

$("faqSearch").addEventListener("input", e => {
  const q = e.target.value.trim().toLowerCase();
  document.querySelectorAll("#faq details").forEach(d => (d.hidden = !!q && !d.textContent.toLowerCase().includes(q)));
  document.querySelectorAll(".faq-group").forEach(g => (g.hidden = !g.querySelector("details:not([hidden])")));
  $("faqEmpty").hidden = !!document.querySelector("#faq details:not([hidden])");
});

// ---------- visualization tabs (used by the compact layout) ----------

document.querySelectorAll("[data-tabs]").forEach(tabs => {
  tabs.addEventListener("click", e => {
    const button = e.target.closest("button[data-view]");
    if (!button) return;
    state.view = button.dataset.view;
    render();
  });
});

// ---------- URL ----------

let urlTimer;
function updateUrl() {
  clearTimeout(urlTimer);
  urlTimer = setTimeout(() => {
    const p = new URLSearchParams({ t: state.T });
    if (state.model !== "cie") p.set("model", state.model);
    if (state.light !== "eye") p.set("light", state.light);
    if (state.compare) p.set("compare", "1");
    try {
      history.replaceState(null, "", "?" + p);
    } catch {
      // Opaque origins (file:// previews) reject URL updates.
    }
  }, 150);
}

// ---------- render ----------

function render() {
  const T = state.T;
  const peakNm = wienPeakNm(T);
  const Lv = luminance(T);

  slider.value = tToSlider(T);
  slider.setAttribute("aria-valuetext", `${formatK(T)} kelvin`);
  if (document.activeElement !== num) {
    num.value = formatK(T);
    sizeReadout(num.value);
  }
  renderClassInfo();
  $("verdict").innerHTML = visibilityVerdict(Lv, peakNm);

  document.querySelectorAll(".seg[data-key]").forEach(group => {
    for (const b of group.querySelectorAll("button")) b.setAttribute("aria-pressed", String(b.dataset.v === state[group.dataset.key]));
  });
  document.querySelectorAll("[data-tabs] button").forEach(b => b.setAttribute("aria-selected", String(b.dataset.view === state.view)));
  document.querySelectorAll("[data-view-panel]").forEach(p => p.classList.toggle("active", p.dataset.viewPanel === state.view));
  $("compare").checked = state.compare;

  $("sPeak").textContent = formatWavelength(peakNm);
  const vf = visibleFraction(T);
  $("sVis").textContent = vf < 1e-4 ? formatSci(vf * 100) + " %" : (vf * 100).toFixed(vf < 0.1 ? 2 : 1) + " %";
  $("sLum").textContent = formatSci(Lv) + " cd/m²";
  $("sFlux").textContent = formatSci(radiantExitance(T)) + " W";

  renderStage(Lv);
  paintTrack();
  layoutSliderMarks(T);
  renderPipelines();
  drawChart();
  drawCie();
  renderObjects();
  updateUrl();
}

buildClassList();
buildCieBase();
render();
