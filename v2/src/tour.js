// The guided tour: eight stops from your own invisible glow to the Big Bang's afterglow. Each stop
// moves there with animateTo (or jumps, with reduced motion) and then loads its object as a card
// does, so the address, title and history follow. Its caption covers the verdict line, which keeps
// its reserved height. The tour holds state.animating the whole way, so any input that sets a
// temperature ends it; so do Esc, a shortcut (keys.js) and the Tour button.
import { OBJECTS } from "./data/objects.js";
import { animateTo, stopAnimation } from "./animate.js";
import { state, update } from "./state.js";
import { $, scrollToFirstScreen } from "./dom.js";

const STOPS = [
  ["you", "You glow too, but all in infrared, near 9 µm. To an eye, 310 K is black."],
  ["draper-point", "798 K, the Draper point: hot things start to glow, a faint grey before any red."],
  ["candle-flame", "A candle flame's soot, 1,850 K: orange, yet 99% of its light is infrared."],
  ["incandescent-bulb", "A bulb filament, 2,700 K: warm white, and still 92% infrared."],
  ["sun", "The Sun, 5,772 K: white, not yellow. Its spectrum peaks in blue-green."],
  ["rigel", "Rigel, 12,100 K: blue-white, and over half its light is now ultraviolet."],
  ["zeta-puppis", "Zeta Puppis, 40,000 K. Past 30,000 K, stars get brighter, not bluer."],
  ["cmb", "The Big Bang's afterglow: light that left at 3,000 K, stretched to 2.725 K."],
];
const MOVE_MS = 2500, HOLD_MS = 4000;

let run = 0, caption, buttons;
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

async function tour() {
  stopAnimation();
  const id = ++run;
  update({ animating: true, touring: true });
  scrollToFirstScreen();
  const jump = matchMedia("(prefers-reduced-motion: reduce)").matches;
  for (const [i, [slug, text]] of STOPS.entries()) {
    caption.innerHTML = `<b>${i + 1}/${STOPS.length}</b> ${text}`;
    const { T } = OBJECTS.find(o => o.slug === slug);
    if (!jump && !(await animateTo(T, MOVE_MS))) return;
    update({ T, object: slug });
    await wait(HOLD_MS);
    if (id !== run || !state.animating) return;
  }
  stopAnimation();
}

export const stopTour = () => state.touring && stopAnimation();
export const toggleTour = () => (state.touring ? stopAnimation() : tour());

export function initTour() {
  buttons = document.querySelectorAll("[data-tour]");
  for (const b of buttons) b.addEventListener("click", toggleTour);
  caption = document.createElement("span");
  caption.className = "tour-caption";
  caption.setAttribute("aria-live", "polite");
  $("verdict").parentElement.append(caption);
  $("num").addEventListener("input", stopTour);
  document.addEventListener("keydown", e => e.key === "Escape" && stopTour());
}

export function renderTour() {
  if (state.touring && !state.animating) {
    state.touring = false;
    run++;
  }
  const on = !!state.touring;
  caption.parentElement.classList.toggle("touring", on);
  for (const b of buttons) b.setAttribute("aria-pressed", String(on));
}
