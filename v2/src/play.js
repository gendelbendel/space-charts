// "Heat it up": the Play button at the slider's left end sweeps 300 K → 40,000 K in 12 s,
// or with reduced motion steps through 8 stops, 1.5 s each.
import { animateTo, stopAnimation } from "./animate.js";
import { state, update } from "./state.js";
import { $ } from "./dom.js";

async function play() {
  update({ T: 300, animating: true });
  if (await animateTo(40000, 12000, matchMedia("(prefers-reduced-motion: reduce)").matches ? 8 : 0)) stopAnimation();
}

export const togglePlay = () => (state.animating ? stopAnimation() : play());

export function initPlay() {
  $("play").addEventListener("click", togglePlay);
  // Grabbing the thumb stops it before the thumb can move out from under the pointer.
  $("slider").addEventListener("pointerdown", stopAnimation);
}

export function renderPlay() {
  $("play").setAttribute("aria-pressed", String(state.animating));
}
