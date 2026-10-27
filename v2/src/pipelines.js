// "How the color was computed": each model's steps with live numbers.
import { PHYS, STAR_T_RANGE, MODELS, displayColor, simpleHue, cieHue, starHue, encodeSrgb, toHex } from "./physics.js";
import { formatK, formatSci, formatTriple, swatch } from "./format.js";
import { state, shownModels } from "./state.js";
import { $ } from "./dom.js";

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

export const pipelinesHtml = () => shownModels().map(pipelineHtml).join("");

export function renderPipelines() {
  // On phones the Numbers tab scrolls; rebuilding its steps mustn't send it back to the top.
  const panel = $("pipes").closest(".panel"), top = panel.scrollTop;
  $("pipes").innerHTML = pipelinesHtml();
  $("pipes").classList.toggle("multi", state.compare);
  panel.scrollTop = top;
}
