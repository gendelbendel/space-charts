// The star: one disc per shown color model, its hex label and the one-line mode note.
import { VISION, MODELS, relLuminance, starHue, eyeLuminance } from "./physics.js";
import { screenColor, formatK } from "./format.js";
import { MODEL_KEYS, state, shownModels } from "./state.js";
import { $ } from "./dom.js";

// A disc painted in a screenColor(), with a glow that grows with its luminance. The game uses it too.
export function discPaint(color) {
  const glow = relLuminance(color.lin);
  return {
    background: `radial-gradient(circle, ${color.paint()} 0%, ${color.paint()} 55%, ${color.paint(0.82)} 100%)`,
    boxShadow: glow > 0.002 ? `0 0 ${30 + 70 * glow}px ${6 + 24 * glow}px ${color.paint(Math.min(0.55, glow))}` : "none",
  };
}

function discLook(T, model, caption, Lv) {
  const color = screenColor(T, model, state.light, state.wide);
  const noData = color.fallback && state.compare;
  return {
    ...(noData ? { background: "none", boxShadow: "none" } : discPaint(color)),
    invisible: noData || (state.light !== "hue" && eyeLuminance(T, Lv) < VISION.absolute),
    noData,
    caption,
    hex: noData ? "—" : color.hex,
  };
}

// What each disc shows (null when it's hidden): one per model, or A and B with a temperature
// pinned. The page applies these; the build bakes them into the HTML.
export function discLooks(Lv) {
  if (state.vs !== null) return [discLook(state.T, state.model, "A", Lv), discLook(state.vs, state.model, "B"), null];
  const models = shownModels();
  return MODEL_KEYS.map(model => (models.includes(model) ? discLook(state.T, model, state.compare ? MODELS[model].label : "", Lv) : null));
}

export const stageHex = looks => looks.filter(Boolean).map(look => look.hex).join(" · ");

export const discsHtml = looks => looks.map(look => look
  ? `<figure class="disc-wrap"><div class="disc${look.invisible ? " invisible" : ""}${look.noData ? " no-data" : ""}" style="background:${look.background};box-shadow:${look.boxShadow}"></div><figcaption>${look.caption}</figcaption></figure>`
  : `<figure class="disc-wrap" hidden><div class="disc"></div><figcaption></figcaption></figure>`).join("");

// Every mode has a one-line note, so the line is always there and switching modes never shifts the layout.
export function stageNote(Lv) {
  let note = "As seen by a dark-adapted eye.", warn = false;
  if (state.vs !== null) {
    note = `B is pinned at ${formatK(state.vs)} K.`;
  } else if (state.model === "star" && !state.compare && !starHue(state.T).available) {
    note = "No star data here; using CIE 1931.";
    warn = true;
  } else if (state.light === "hue") {
    warn = Lv < VISION.fullColor;
    note = warn ? "Tint only; it would look darker." : "Tint at full brightness.";
  } else if (state.light === "sun") {
    note = "Brightness relative to the Sun.";
  }
  return { note, warn };
}

// Created on the first render, replacing the baked copies.
let discs;
function createDiscs() {
  $("discs").replaceChildren();
  return MODEL_KEYS.map(() => {
    const figure = document.createElement("figure");
    figure.className = "disc-wrap";
    figure.innerHTML = `<div class="disc"></div><figcaption></figcaption>`;
    $("discs").appendChild(figure);
    return { figure, disc: figure.firstChild, caption: figure.lastChild };
  });
}

export function renderStage(Lv) {
  discs ??= createDiscs();
  $("stage").classList.toggle("comparing", state.compare);
  $("stage").classList.toggle("pinned", state.vs !== null);
  const looks = discLooks(Lv);
  looks.forEach((look, i) => {
    const { figure, disc, caption } = discs[i];
    figure.hidden = !look;
    if (!look) return;
    disc.style.background = look.background;
    disc.style.boxShadow = look.boxShadow;
    disc.classList.toggle("invisible", look.invisible);
    disc.classList.toggle("no-data", look.noData);
    caption.textContent = look.caption;
  });
  $("labelHex").textContent = stageHex(looks);

  const { note, warn } = stageNote(Lv);
  $("stageNote").textContent = note;
  $("stageNote").classList.toggle("warn", warn);
}
