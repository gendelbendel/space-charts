// The slider (with its painted track and marks), the segmented controls and the Compare checkbox.
import { displayColor } from "./physics.js";
import { SLIDER_KNOTS, makeScale } from "./slider-scale.js";
import { createSliderMarks, trackGradient } from "./slider-marks.js";
import { formatK } from "./format.js";
import { state, update, setTemperature } from "./state.js";
import { $ } from "./dom.js";

const scale = makeScale(SLIDER_KNOTS);
const tToSlider = T => 1000 * scale.toFraction(T);
const sliderToT = s => Math.round(scale.toT(s / 1000));

const slider = $("slider");
slider.addEventListener("input", () => setTemperature(sliderToT(+slider.value)));

$("compare").addEventListener("change", e => update({ compare: e.target.checked }));
document.querySelectorAll(".seg[data-key]").forEach(group => {
  group.addEventListener("click", e => {
    const button = e.target.closest("button");
    if (!button) return;
    update({ [group.dataset.key]: button.dataset.v });
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

export function renderSlider() {
  slider.value = tToSlider(state.T);
  slider.setAttribute("aria-valuetext", `${formatK(state.T)} kelvin`);
}

export function renderControls() {
  document.querySelectorAll(".seg[data-key]").forEach(group => {
    for (const b of group.querySelectorAll("button")) b.setAttribute("aria-pressed", String(b.dataset.v === state[group.dataset.key]));
  });
  $("compare").checked = state.compare;
}

export function renderTrack() {
  paintTrack();
  layoutSliderMarks(state.T);
}
