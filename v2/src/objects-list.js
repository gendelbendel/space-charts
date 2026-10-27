// "Stars and other hot things": cards that load a temperature.
import { MODELS, displayColor } from "./physics.js";
import { OBJECTS, CATEGORIES } from "./data/objects.js";
import { formatK, screenColor } from "./format.js";
import { state, setTemperature } from "./state.js";
import { copyText } from "./share.js";
import { $, scrollToFirstScreen } from "./dom.js";

const objectHtml = ({ name, type, T, note }, i) => {
  const color = screenColor(T, state.model, state.light, state.wide).paint();
  const current = T === state.T ? ' aria-current="true"' : "";
  return `<li><button type="button" data-i="${i}"${current}>
      <span class="dot" style="background:${color}"></span>
      <span class="obj-main"><span class="obj-name">${name}</span><span class="obj-meta">${type} · ${formatK(T)} K</span>${note ? `<span class="obj-note">${note}</span>` : ""}</span>
    </button></li>`;
};

// One heading and grid per category, coldest first within each.
export const objectsHtml = () => CATEGORIES.map(([category, heading]) => {
  const items = OBJECTS.map((o, i) => [o, i]).filter(([o]) => o.category === category).sort(([a], [b]) => a.T - b.T);
  return `<h3 class="obj-group">${heading}<span>${items.length}</span></h3><ul class="objects">${items.map(([o, i]) => objectHtml(o, i)).join("")}</ul>`;
}).join("");

// Updates the prerendered cards in place, so a row scrolled sideways stays where it is.
export function renderObjects() {
  for (const button of $("objects").querySelectorAll("button[data-i]")) {
    const { T } = OBJECTS[button.dataset.i];
    button.firstElementChild.style.background = screenColor(T, state.model, state.light, state.wide).paint();
    if (T === state.T) button.setAttribute("aria-current", "true");
    else button.removeAttribute("aria-current");
  }
}

// Every object's sRGB color in the current model and brightness, coldest first.
export const cssVariables = (model, light) => `/* What color is a star? ${MODELS[model].label}, light=${light} */
:root {
${[...OBJECTS].sort((a, b) => a.T - b.T).map(o => `  --${o.slug}: ${displayColor(o.T, model, light).hex};`).join("\n")}
}
`;

export function initObjectsList() {
  $("objects").addEventListener("click", e => {
    const button = e.target.closest("button[data-i]");
    if (!button) return;
    setTemperature(OBJECTS[+button.dataset.i].T);
    scrollToFirstScreen();
  });
  $("copyVars").addEventListener("click", () => copyText(cssVariables(state.model, state.light), `Copied ${OBJECTS.length} colors`));
}
