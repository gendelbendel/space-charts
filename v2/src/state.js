import { MODELS, SUN_TEFF, parseTemperature } from "./physics.js";
import { OBJECTS } from "./data/objects.js";
import { MAIN_TITLE, starTitle } from "./star-pages.js";

export const MODEL_KEYS = Object.keys(MODELS);
export const LIGHT_KEYS = ["hue", "eye", "sun"];

const objectAt = path => OBJECTS.find(o => path === `/stars/${o.slug}/`);

// Reads the page state from a query string and path: a star page (/stars/<slug>/) starts at its
// object's temperature, unless `t` says otherwise. v1's `?temp=` still works.
export function readState(search, path = "") {
  const query = new URLSearchParams(search);
  const vs = parseTemperature(query.get("vs"));
  const t = parseTemperature(query.get("t") ?? query.get("temp"));
  const page = t === null ? objectAt(path) : undefined;
  return {
    T: t ?? page?.T ?? SUN_TEFF,
    // The object whose page this is (its slug) while the page shows it, else null.
    object: page?.slug ?? null,
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
    // The color-map card's view: "cie" (the color map), "hr" (the HR diagram) or "day" (daylight).
    map: "cie",
    // The white a camera is balanced to in the Daylight view: "d65" or "sun".
    white: "d65",
    // True while Play (animate.js) moves the temperature.
    animating: false,
  };
}

// The build has no `location`; it sets this state itself before prerendering.
export const state = readState(globalThis.location?.search ?? "", globalThis.location?.pathname);
export const shownModels = () => (state.compare ? MODEL_KEYS : [state.model]);

// Modules change state through update(); app.js registers render() as the listener.
let rerender = () => {};
export const onUpdate = fn => (rerender = fn);
export function update(patch) {
  // A new temperature leaves the object's page, unless the patch names the object.
  Object.assign(state, "T" in patch ? { object: null, ...patch } : patch);
  rerender();
}
// For input (slider, readout, cards, shortcuts), so it also stops any animation. Picking an object
// (a card, a dot on the HR diagram or Orion) passes its slug, which moves the address to its page.
export function setTemperature(T, object = null) {
  if (T === null) return;
  update({ T, object, animating: false });
}

export const setCompare = compare => update({ compare, vs: null });
export const togglePin = () => update(state.vs === null ? { vs: state.T, compare: false } : { vs: null });

function stateParams(withT) {
  const p = new URLSearchParams(withT ? { t: state.T } : {});
  if (state.model !== "cie") p.set("model", state.model);
  if (state.light !== "eye") p.set("light", state.light);
  if (state.compare) p.set("compare", "1");
  if (state.vs !== null) p.set("vs", state.vs);
  return p;
}
// The query string that reopens this page (the embed) in its current state.
export const stateQuery = () => "?" + stateParams(true);
// The site's address for the current state: the object's own page, or the main page at T.
export function stateUrl() {
  const query = stateParams(!state.object).toString();
  return (state.object ? `/stars/${state.object}/` : "/") + (query ? "?" + query : "");
}

// The main page and the star pages are one page at different addresses; the embed keeps its own.
const onSitePage = () => /^\/(stars\/[\w-]+\/)?$/.test(location.pathname);
let urlTimer;
export function updateUrl() {
  clearTimeout(urlTimer);
  urlTimer = setTimeout(() => {
    const site = onSitePage();
    const url = site ? stateUrl() : stateQuery();
    try {
      // A new page (another object, or leaving one) gets a history entry, so Back returns to it.
      if (new URL(url, location.href).pathname === location.pathname) history.replaceState(null, "", url);
      else history.pushState(null, "", url);
    } catch {
      // Opaque origins (file:// previews) reject URL updates.
    }
    if (site) document.title = state.object ? starTitle(OBJECTS.find(o => o.slug === state.object)) : MAIN_TITLE;
  }, 150);
}

// Back and Forward between pages restore that page's temperature and modes.
globalThis.addEventListener?.("popstate", () => {
  const { T, object, model, light, compare, vs } = readState(location.search, location.pathname);
  update({ T, object, model, light, compare, vs, animating: false });
});
