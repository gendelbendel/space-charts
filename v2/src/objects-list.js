// "Stars and other hot things": cards that load a temperature.
import { displayColor } from "./physics.js";
import { OBJECTS, CATEGORIES } from "./data/objects.js";
import { formatK } from "./format.js";
import { state, setTemperature } from "./state.js";
import { $ } from "./dom.js";

const objectHtml = ({ name, type, T, note }, i) => {
  const hex = displayColor(T, state.model, state.light).hex;
  const current = T === state.T ? ' aria-current="true"' : "";
  return `<li><button type="button" data-i="${i}"${current}>
      <span class="dot" style="background:${hex}"></span>
      <span class="obj-main"><span class="obj-name">${name}</span><span class="obj-meta">${type} · ${formatK(T)} K</span>${note ? `<span class="obj-note">${note}</span>` : ""}</span>
    </button></li>`;
};

// One heading and grid per category, coldest first within each.
export const objectsHtml = () => CATEGORIES.map(([category, heading]) => {
  const items = OBJECTS.map((o, i) => [o, i]).filter(([o]) => o.category === category).sort(([a], [b]) => a.T - b.T);
  return `<h3 class="obj-group">${heading}</h3><ul class="objects">${items.map(([o, i]) => objectHtml(o, i)).join("")}</ul>`;
}).join("");

export function renderObjects() {
  $("objects").innerHTML = objectsHtml();
}

export const initObjectsList = () => $("objects").addEventListener("click", e => {
  const button = e.target.closest("button[data-i]");
  if (!button) return;
  setTemperature(OBJECTS[+button.dataset.i].T);
  const anchor = document.querySelector("[data-scroll-anchor]") ?? document.body;
  anchor.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
});
