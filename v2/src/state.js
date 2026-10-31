import { MODELS, SUN_TEFF, parseTemperature } from "./physics.js";

export const MODEL_KEYS = Object.keys(MODELS);
export const LIGHT_KEYS = ["hue", "eye", "sun"];

// A star page (/stars/<slug>/) names its temperature on <html>; other pages start at the Sun.
const pageT = globalThis.document?.documentElement.dataset.t;

// Reads the page state from a query string. v1's `?temp=` still works.
export function readState(search) {
  const query = new URLSearchParams(search);
  const vs = parseTemperature(query.get("vs"));
  return {
    T: parseTemperature(query.get("t") ?? query.get("temp")) ?? (+pageT || SUN_TEFF),
    model: MODEL_KEYS.includes(query.get("model")) ? query.get("model") : "cie",
    light: LIGHT_KEYS.includes(query.get("light")) ? query.get("light") : "eye",
    compare: query.get("compare") === "1" && vs === null,
    // The pinned temperature B, compared with T as A. Never on together with `compare`.
    vs,
    // Wide-gamut (P3) screens get deeper reds below ~1,900 K. The build has no screen, so it's sRGB.
    wide: globalThis.matchMedia?.("(color-gamut: p3)").matches === true,
    yscale: "lin",
    // Spectral radiance per nm of wavelength, or per Hz of frequency.
    axis: "nm",
    // The chart's absorption lines: null follows the model (on for Real stars), true or false once switched.
    lines: null,
    view: "spectrum",
    // The color-map card's view: "cie" (the color map) or "hr" (the HR diagram).
    map: "cie",
    // True while Play (animate.js) moves the temperature.
    animating: false,
  };
}

// The build has no `location`; it sets this state itself before prerendering.
export const state = readState(globalThis.location?.search ?? "");
export const shownModels = () => (state.compare ? MODEL_KEYS : [state.model]);

// Modules change state through update(); app.js registers render() as the listener.
let rerender = () => {};
export const onUpdate = fn => (rerender = fn);
export function update(patch) {
  Object.assign(state, patch);
  rerender();
}
// For input (slider, readout, cards, shortcuts), so it also stops any animation.
export function setTemperature(T) {
  if (T === null) return;
  update({ T, animating: false });
}

export const setCompare = compare => update({ compare, vs: null });
export const togglePin = () => update(state.vs === null ? { vs: state.T, compare: false } : { vs: null });

// The query string that reopens the page in its current state. A star page in its own state needs none.
export function stateQuery() {
  const p = new URLSearchParams({ t: state.T });
  if (state.model !== "cie") p.set("model", state.model);
  if (state.light !== "eye") p.set("light", state.light);
  if (state.compare) p.set("compare", "1");
  if (state.vs !== null) p.set("vs", state.vs);
  const query = "?" + p;
  return query === `?t=${pageT}` ? "" : query;
}

let urlTimer;
export function updateUrl() {
  clearTimeout(urlTimer);
  urlTimer = setTimeout(() => {
    try {
      history.replaceState(null, "", stateQuery() || location.pathname);
    } catch {
      // Opaque origins (file:// previews) reject URL updates.
    }
  }, 150);
}
