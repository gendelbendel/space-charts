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

let urlTimer;
export function updateUrl() {
  clearTimeout(urlTimer);
  urlTimer = setTimeout(() => {
    const p = new URLSearchParams({ t: state.T });
    if (state.model !== "cie") p.set("model", state.model);
    if (state.light !== "eye") p.set("light", state.light);
    if (state.compare) p.set("compare", "1");
    try {
      history.replaceState(null, "", "?" + p);
    } catch {
      // Opaque origins (file:// previews) reject URL updates.
    }
  }, 150);
}
