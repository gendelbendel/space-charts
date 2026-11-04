// The slider (with its painted track and marks), the segmented controls, the Compare checkbox, Pin and
// the phone's sheet of mode controls.
import { createSliderMarks, sliderScale, tToSlider, sliderToT, sliderTrack } from "./slider-marks.js";
import { formatK } from "./format.js";
import { state, update, setCompare, setTemperature, togglePin } from "./state.js";
import { $ } from "./dom.js";

const slider = $("slider");
slider.addEventListener("input", () => setTemperature(sliderToT(+slider.value)));

$("compare").addEventListener("change", e => setCompare(e.target.checked));
$("pin").addEventListener("click", togglePin);
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

// Phones fold the color model, brightness and Compare models into a sheet over the visuals, opened by
// the button at the slider's right end (the dock is then just the slider). A tap outside or Esc closes it.
export function initModesSheet() {
  const dock = slider.closest(".b-dock"), button = $("modes");
  const setOpen = open => {
    dock.classList.toggle("open", open);
    button.setAttribute("aria-expanded", String(open));
  };
  button.addEventListener("click", () => setOpen(!dock.classList.contains("open")));
  document.addEventListener("click", e => dock.contains(e.target) || setOpen(false));
  document.addEventListener("keydown", e => {
    if (e.key !== "Escape" || !dock.classList.contains("open")) return;
    // Focus inside the sheet would be lost as it hides; it goes back to the button that opened it.
    if ($("controls").contains(document.activeElement)) button.focus();
    setOpen(false);
  });
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
  $("pin").setAttribute("aria-pressed", String(state.vs !== null));
}

export function renderTrack() {
  paintTrack();
  layoutSliderMarks(state.T);
}
