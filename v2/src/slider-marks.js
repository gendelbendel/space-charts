import { T_MIN, T_MAX } from "./physics.js";
import { SPECTRAL_CLASSES, CLASS_INFO, SLIDER_MARKS } from "./data/objects.js";

// The range thumb's center travels from THUMB_INSET to width − THUMB_INSET, so
// everything drawn along a slider uses the same mapping.
export const THUMB_INSET = 14;
export const alongSlider = f => `calc(${THUMB_INSET}px + (100% - ${2 * THUMB_INSET}px) * ${f})`;

const formatK = T => T.toLocaleString("en-US");
export const spectralClass = T => SPECTRAL_CLASSES.find(([, lo, hi]) => T >= lo && T < hi)[0];
export function classRange(letter) {
  const [, lo, hi] = SPECTRAL_CLASSES.find(([l]) => l === letter);
  if (lo === 0) return `below ${formatK(hi)} K`;
  if (hi === Infinity) return `above ${formatK(lo)} K`;
  return `${formatK(lo)}–${formatK(hi)} K`;
}

// The visual middle of a class's band on a given scale, and the temperature there.
const classBand = (letter, scale) => {
  const [, lo, hi] = SPECTRAL_CLASSES.find(([l]) => l === letter);
  return [scale.toFraction(Math.max(lo, T_MIN)), scale.toFraction(Math.min(hi, T_MAX))];
};
export function classMidpoint(letter, scale) {
  const [a, b] = classBand(letter, scale);
  return Math.round(scale.toT((a + b) / 2) / 10) * 10;
}

/**
 * Fills a slider's tick rows: class boundaries and letters in `classRow`,
 * reference marks in `markRow`. `onPick(T)` is called when one is clicked.
 * Returns a `layout(currentT)` function to call on every render.
 */
export function createSliderMarks({ classRow, markRow, scale, onPick }) {
  const boundaries = [...new Set(SPECTRAL_CLASSES.flatMap(([, lo, hi]) => [lo, hi]))].filter(T => T > T_MIN && T < T_MAX);
  for (const T of boundaries) {
    const line = document.createElement("i");
    line.style.left = alongSlider(scale.toFraction(T));
    classRow.appendChild(line);
  }
  for (const [letter] of SPECTRAL_CLASSES) {
    const [a, b] = classBand(letter, scale);
    const label = document.createElement("button");
    label.type = "button";
    label.textContent = letter;
    label.title = `Class ${letter}: ${CLASS_INFO[letter].name.toLowerCase()}, ${classRange(letter)}`;
    label.setAttribute("aria-label", `Jump to class ${letter}, ${CLASS_INFO[letter].name.toLowerCase()}`);
    label.addEventListener("click", () => onPick(classMidpoint(letter, scale)));
    label.dataset.cls = letter;
    label.dataset.f = (a + b) / 2;
    label.dataset.width = b - a;
    classRow.appendChild(label);
  }
  for (const [name, T] of SLIDER_MARKS) {
    const mark = document.createElement("button");
    mark.type = "button";
    mark.textContent = name;
    mark.dataset.f = scale.toFraction(T);
    mark.setAttribute("aria-label", `Set temperature to ${name}, ${formatK(T)} K`);
    mark.addEventListener("click", () => onPick(T));
    markRow.appendChild(mark);
  }

  let currentT = null;
  const layout = T => {
    if (T !== undefined) currentT = T;
    const current = currentT === null ? null : spectralClass(currentT);
    const classLabels = [...classRow.querySelectorAll("button")];
    for (const label of classLabels) label.classList.toggle("current", label.dataset.cls === current);
    classLabels.sort((a, b) => (b.dataset.cls === current) - (a.dataset.cls === current) || b.dataset.width - a.dataset.width);
    placeWithoutOverlap(classRow, classLabels);
    placeWithoutOverlap(markRow, [...markRow.querySelectorAll("button")]);
  };
  new ResizeObserver(() => layout()).observe(classRow);
  return layout;
}

// Places labels in priority order and hides any that would overlap one already placed.
function placeWithoutOverlap(row, labels) {
  const width = row.clientWidth;
  if (!width) return;
  const placed = [];
  for (const label of labels) {
    label.hidden = false;
    const w = label.offsetWidth;
    const center = THUMB_INSET + (width - 2 * THUMB_INSET) * +label.dataset.f;
    const left = Math.min(Math.max(center - w / 2, 0), width - w);
    const fits = placed.every(([a, b]) => left + w + 6 <= a || left >= b + 6);
    label.hidden = !fits;
    if (fits) {
      label.style.left = left + "px";
      placed.push([left, left + w]);
    }
  }
}

/** Paints a slider's track with the display color at each position. */
export function trackGradient(scale, colorAt) {
  const stops = [];
  for (let s = 0; s <= 1000; s += 25) stops.push(`${colorAt(scale.toT(s / 1000))} ${alongSlider(s / 1000)}`);
  return `linear-gradient(90deg, ${stops.join(",")})`;
}
