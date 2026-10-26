// The slider (with its painted track and marks), the segmented controls and the Compare checkbox.
import { createSliderMarks, sliderScale, tToSlider, sliderToT, sliderTrack } from "./slider-marks.js";
import { formatK } from "./format.js";
import { state, update, setTemperature } from "./state.js";
import { $ } from "./dom.js";

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

const layoutSliderMarks = createSliderMarks({ classRow: $("classTicks"), markRow: $("markTicks"), scale: sliderScale, onPick: setTemperature });

let trackKey = "";
function paintTrack() {
  const key = state.model + state.light + state.wide;
  if (key === trackKey) return;
  trackKey = key;
  slider.style.setProperty("--track", sliderTrack(state.model, state.light, state.wide));
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
