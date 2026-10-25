// The star: one disc per shown color model, its hex label and the one-line mode note.
import { VISION, MODELS, displayColor, relLuminance, starHue } from "./physics.js";
import { MODEL_KEYS, state, shownModels } from "./state.js";
import { $ } from "./dom.js";

const discs = MODEL_KEYS.map(model => {
  const figure = document.createElement("figure");
  figure.className = "disc-wrap";
  figure.innerHTML = `<div class="disc"></div><figcaption></figcaption>`;
  $("discs").appendChild(figure);
  return { model, figure, disc: figure.firstChild, caption: figure.lastChild };
});

export function renderStage(Lv) {
  const models = shownModels();
  $("stage").classList.toggle("comparing", state.compare);
  const hexes = [];
  for (const { model, figure, disc, caption } of discs) {
    figure.hidden = !models.includes(model);
    if (figure.hidden) continue;
    const color = displayColor(state.T, model, state.light);
    const noData = color.fallback && state.compare;
    const [r, g, b] = color.enc.map(v => Math.round(255 * v));
    const glow = noData ? 0 : relLuminance(color.lin);
    disc.style.background = noData ? "none" : `radial-gradient(circle, rgb(${r},${g},${b}) 0%, rgb(${r},${g},${b}) 55%, rgba(${r},${g},${b},.82) 100%)`;
    disc.style.boxShadow = glow > 0.002 ? `0 0 ${30 + 70 * glow}px ${6 + 24 * glow}px rgba(${r},${g},${b},${Math.min(0.55, glow)})` : "none";
    disc.classList.toggle("invisible", noData || (state.light !== "hue" && Lv < VISION.absolute));
    caption.textContent = state.compare ? `${MODELS[model].label}${noData ? " · no data" : ""}` : "";
    hexes.push(noData ? "—" : color.hex);
  }
  $("labelHex").textContent = hexes.join(" · ");

  // Every mode has a one-line note, so the line is always there and switching modes never shifts the layout.
  let note = "As seen by a dark-adapted eye.", warn = false;
  if (state.model === "star" && !state.compare && !starHue(state.T).available) {
    note = "No star data here; using CIE 1931.";
    warn = true;
  } else if (state.light === "hue") {
    warn = Lv < VISION.fullColor;
    note = warn ? "Tint only; it would look darker." : "Tint at full brightness.";
  } else if (state.light === "sun") {
    note = "Brightness relative to the Sun.";
  }
  $("stageNote").textContent = note;
  $("stageNote").classList.toggle("warn", warn);
}
