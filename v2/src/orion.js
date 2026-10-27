// "Orion, in true color": the constellation's brightest stars at their real
// positions, colored like the star at the top. The build bakes the map; the page
// only recolors it, so the positions never reach the script.
import { OBJECTS, ORION } from "./data/objects.js";
import { screenColor } from "./format.js";
import { state, setTemperature } from "./state.js";
import { $, scrollToFirstScreen } from "./dom.js";

// Degrees from the map's center, with north up and east to the left, as the sky
// looks from the northern hemisphere. Over Orion's 17° this is within 0.5% of
// true angular distances.
const CENTER = { ra: 83.7, dec: -1.1 };
export const skyPosition = ({ ra, dec }) => [(CENTER.ra - ra) * Math.cos((dec * Math.PI) / 180), CENTER.dec - dec];

// A dot's area is proportional to the light that reaches us: 5 magnitudes is 100 times (Pogson).
export const dotDiameter = V => 12 * 10 ** (-0.2 * V);

const FIGURE = [["betelgeuse", "bellatrix"], ["betelgeuse", "alnitak"], ["bellatrix", "mintaka"], ["alnitak", "alnilam"], ["alnilam", "mintaka"], ["alnitak", "saiph"], ["mintaka", "rigel"]];
// The map spans 16° by 20° around the center (the .sky box's aspect ratio).
const W = 16, H = 20;

export function orionHtml() {
  const at = slug => skyPosition(ORION.find(s => s.slug === slug)).map(v => v.toFixed(2));
  const lines = FIGURE.map(([a, b]) => {
    const [[x1, y1], [x2, y2]] = [at(a), at(b)];
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  }).join("");
  const stars = ORION.map(star => {
    const { name, T } = OBJECTS.find(o => o.slug === star.slug);
    const [x, y] = skyPosition(star);
    const size = dotDiameter(star.V).toFixed(1);
    const color = screenColor(T, state.model, state.light, state.wide).paint();
    return `<button type="button" class="${star.label}" data-t="${T}" style="left:${((x / W + 0.5) * 100).toFixed(2)}%;top:${((y / H + 0.5) * 100).toFixed(2)}%;color:${color}"><i style="width:${size}px;height:${size}px"></i><span>${name}</span></button>`;
  }).join("");
  return `<svg viewBox="${-W / 2} ${-H / 2} ${W} ${H}" aria-hidden="true">${lines}</svg>${stars}`;
}

export function renderOrion() {
  for (const star of $("orion").querySelectorAll("button")) {
    const T = +star.dataset.t;
    star.style.color = screenColor(T, state.model, state.light, state.wide).paint();
    star.ariaCurrent = T === state.T ? "true" : null;
  }
}

export function initOrion() {
  $("orion").addEventListener("click", e => {
    const star = e.target.closest("button");
    if (!star) return;
    setTemperature(+star.dataset.t);
    scrollToFirstScreen();
  });
}
