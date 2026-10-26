// Keyboard shortcuts, listed in the dialog that `?` opens. Ignored while typing in a text field.
import { SUN_TEFF } from "./physics.js";
import { SPECTRAL_CLASSES } from "./data/objects.js";
import { sliderScale, classMidpoint, tToSlider, sliderToT } from "./slider-marks.js";
import { state, update, setTemperature, MODEL_KEYS, LIGHT_KEYS } from "./state.js";
import { togglePlay } from "./play.js";
import { $ } from "./dom.js";

const next = (keys, current) => keys[(keys.indexOf(current) + 1) % keys.length];

export function initKeys() {
  // Coldest first, the same temperatures the class letters under the slider jump to.
  const classes = Object.fromEntries(SPECTRAL_CLASSES.map(([letter]) => [letter, classMidpoint(letter, sliderScale)]));
  const midpoints = Object.values(classes);
  const dialog = $("keys");
  dialog.addEventListener("click", e => e.target === dialog && dialog.close());

  const actions = {
    m: () => update({ model: next(MODEL_KEYS, state.model) }),
    b: () => update({ light: next(LIGHT_KEYS, state.light) }),
    s: () => setTemperature(SUN_TEFF),
    c: () => update({ compare: !state.compare }),
    p: togglePlay,
    "?": () => (dialog.open ? dialog.close() : dialog.showModal()),
    // Shift moves one slider position; otherwise to the next class's midpoint.
    ArrowRight: shift => setTemperature(shift ? sliderToT(tToSlider(state.T) + 1) : midpoints.find(T => T > state.T) ?? null),
    ArrowLeft: shift => setTemperature(shift ? sliderToT(tToSlider(state.T) - 1) : midpoints.findLast(T => T < state.T) ?? null),
  };

  // Letters jump to their class, except lowercase m and b, which cycle the modes (Shift+M and Shift+B are the classes).
  document.addEventListener("keydown", e => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.target.matches("input:not([type=range], [type=checkbox]), textarea, [contenteditable]")) return;
    // The focused slider keeps its own arrow keys.
    if (e.target.id === "slider" && e.key.startsWith("Arrow")) return;
    const jump = e.key !== "m" && e.key !== "b" && classes[e.key.toUpperCase()];
    const action = jump ? () => setTemperature(jump) : actions[e.key] ?? actions[e.key.toLowerCase()];
    if (!action) return;
    e.preventDefault();
    action(e.shiftKey);
  });
}
