// The spectrum chart: Planck curve on a log wavelength axis, the visible band, model overlays and a hover readout.
import { SIMPLE_BANDS, planck, wienPeakNm } from "./physics.js";
import { CIE1931_2DEG, CMF_START_NM, CMF_STEP_NM, CMF_ROWS } from "./data/cie1931.js";
import { formatWavelength } from "./format.js";
import { state, shownModels } from "./state.js";
import { $ } from "./dom.js";

const SIMPLE_BAND_FILLS = ["rgba(255,80,80,.16)", "rgba(80,255,120,.14)", "rgba(90,140,255,.18)"];
const CMF_COLORS = ["#ff7a7a", "#7dff9a", "#7aa8ff"];

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

export function drawChart() {
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
