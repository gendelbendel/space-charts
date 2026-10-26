// Moves the temperature by code: Play, and later the guided tour (P4.A). While it runs,
// `state.animating` is true and render() skips the HTML that doesn't need every frame. Any input
// (slider, readout, card, shortcut) goes through setTemperature(), which clears the flag, and
// with it the animation. stopAnimation() ends it and renders everything.
import { sliderScale } from "./slider-marks.js";
import { state, update } from "./state.js";

let run = 0;

export function stopAnimation() {
  run++;
  if (state.animating) update({ animating: false });
}

// Moves to T in `ms` at constant speed along the slider's weighted scale, so it lingers where
// color changes. With `steps` (for reduced motion), it jumps through that many evenly spaced
// stops instead, rounded to two significant figures, holding each for an equal share of `ms`.
// Resolves true on arrival (still animating, so a sequence can go on), false if stopped first.
export function animateTo(T, ms, steps = 0) {
  const id = ++run;
  const from = sliderScale.toFraction(state.T), to = sliderScale.toFraction(T);
  const start = performance.now();
  state.animating = true;
  return new Promise(resolve => {
    const frame = now => {
      if (id !== run || !state.animating) return resolve(false);
      const t = ms ? (now - start) / ms : 1;
      if (t >= 1) {
        if (!steps) update({ T });
        return resolve(true);
      }
      const at = sliderScale.toT(from + (to - from) * (steps ? Math.floor(t * steps) / (steps - 1) : t));
      const next = steps ? +at.toPrecision(2) : Math.round(at);
      if (next !== state.T) update({ T: next });
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
}
