import { MODELS, SUN_TEFF, parseTemperature } from "./physics.js";

export const MODEL_KEYS = Object.keys(MODELS);
const LIGHT_KEYS = ["hue", "eye", "sun"];

// Reads the page state from a query string. v1's `?temp=` still works.
export function readState(search) {
  const query = new URLSearchParams(search);
  return {
    T: parseTemperature(query.get("t") ?? query.get("temp")) ?? SUN_TEFF,
    model: MODEL_KEYS.includes(query.get("model")) ? query.get("model") : "cie",
    light: LIGHT_KEYS.includes(query.get("light")) ? query.get("light") : "eye",
    compare: query.get("compare") === "1",
    // Wide-gamut (P3) screens get deeper reds below ~1,900 K. The build has no screen, so it's sRGB.
    wide: globalThis.matchMedia?.("(color-gamut: p3)").matches === true,
    yscale: "lin",
    view: "spectrum",
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
export function setTemperature(T) {
  if (T === null) return;
  update({ T });
}

// The query string that reopens the page in its current state.
export function stateQuery() {
  const p = new URLSearchParams({ t: state.T });
  if (state.model !== "cie") p.set("model", state.model);
  if (state.light !== "eye") p.set("light", state.light);
  if (state.compare) p.set("compare", "1");
  return "?" + p;
}

let urlTimer;
export function updateUrl() {
  clearTimeout(urlTimer);
  urlTimer = setTimeout(() => {
    try {
      history.replaceState(null, "", stateQuery());
    } catch {
      // Opaque origins (file:// previews) reject URL updates.
    }
  }, 150);
}
