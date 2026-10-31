// The color-map card's third view: white paper and three paints in this star's light, as a
// camera balanced for daylight records them and as an eye adapted to the star sees them. Built
// once; render() only recolors, so the white-balance button keeps its focus.
import { D65_WHITE, VISION, SUN_TEFF, blackbodyWhite, daylightScene, eyeLuminance } from "./physics.js";
import { state, update } from "./state.js";
import { $ } from "./dom.js";

const PANELS = [["camera", 8, "Camera"], ["eye", 166, "Your eye"]];
const WIDTH = 146, TOP = 34, HEIGHT = 228;
const SWATCH_Y = 186;

const panelHtml = ([key, x, label]) => {
  const swatches = [0, 1, 2].map(i => `<circle data-s="${i + 2}" cx="${x + 34 + i * 39}" cy="${SWATCH_Y}" r="15"/>`).join("");
  return `<text x="${x + WIDTH / 2}" y="22" class="lbl big" text-anchor="middle">${label}</text>
    <g data-panel="${key}"><rect data-s="1" x="${x}" y="${TOP}" width="${WIDTH}" height="${HEIGHT}" rx="6"/>
    <rect data-s="0" x="${x + 14}" y="${TOP + 16}" width="${WIDTH - 28}" height="${HEIGHT - 32}" rx="2"/>${swatches}</g>`;
};

const WHITES = { d65: ["D65", D65_WHITE], sun: ["the Sun", blackbodyWhite(SUN_TEFF)] };

// Cooler than this, a page lit by the object would look black whatever the camera did.
const tooDim = () => eyeLuminance(state.T) < VISION.fullColor;

export function renderDaylight() {
  const scene = tooDim() ? null : daylightScene(state.T, WHITES[state.white][1]);
  for (const panel of $("day").querySelectorAll("[data-panel]")) {
    for (const shape of panel.children) shape.style.fill = scene?.[panel.dataset.panel][shape.dataset.s] ?? "#000";
  }
  $("dayWhiteLabel").textContent = scene ? `Camera white: ${WHITES[state.white][0]}` : "Too dim to light a page";
  $("cieReadout").innerHTML = scene ? `Paper: camera ${scene.camera[0]}, eye ${scene.eye[0]}` : "";
}

export function initDaylight() {
  const svg = $("day");
  svg.innerHTML = `${PANELS.map(panelHtml).join("")}
    <g id="dayWhite" role="button" tabindex="0" aria-label="Switch the camera's white point"><rect x="8" y="272" width="304" height="40" rx="8"/>
    <text id="dayWhiteLabel" x="160" y="297" class="lbl big" text-anchor="middle"></text></g>`;
  const toggle = e => {
    if (e.type === "keydown" && e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    update({ white: state.white === "d65" ? "sun" : "d65" });
  };
  $("dayWhite").addEventListener("click", toggle);
  $("dayWhite").addEventListener("keydown", toggle);
}
