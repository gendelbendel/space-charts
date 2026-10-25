// The big temperature (also the text box), the verdict line and the spectral class chip.
import { parseTemperature } from "./physics.js";
import { CLASS_INFO } from "./data/objects.js";
import { spectralClass, classRange } from "./slider-marks.js";
import { formatK, visibilityVerdict } from "./format.js";
import { state, update, setTemperature } from "./state.js";
import { $ } from "./dom.js";

const num = $("num"), tempBig = $("tempBig");

// The big readout doubles as the text box: it shows "5,772" and edits as "5772".
// Typing doesn't re-render (that would reformat under the cursor); Enter or
// leaving the field applies the value, and Escape or junk reverts it.
num.addEventListener("focus", () => {
  num.value = state.T;
  sizeReadout(String(state.T));
  num.select();
});
// A typed unit or name ("1200 °C", "Vega") replaces the "K", which keeps its space.
num.addEventListener("input", () => {
  sizeReadout(num.value);
  tempBig.classList.toggle("typed-unit", /[^\d\s.,+\-−]/.test(num.value));
});
num.addEventListener("keydown", e => {
  if (e.key === "Enter") num.blur();
  if (e.key === "Escape") {
    num.value = state.T;
    num.blur();
  }
});
num.addEventListener("change", () => setTemperature(parseTemperature(num.value)));
num.addEventListener("blur", () => update({}));

// Sizes the text box to its contents, up to the width of "1,000,000" (longer
// names scroll inside the box). An invisible copy of the text inside the
// same label measures it with exactly the same font settings (tabular digits,
// letter spacing), which "ch" units and canvas measureText both get wrong.
const measure = document.createElement("span");
measure.className = "temp-measure";
measure.setAttribute("aria-hidden", "true");
tempBig.appendChild(measure);
const measureWidth = text => {
  measure.textContent = text;
  return measure.getBoundingClientRect().width;
};
function sizeReadout(text) {
  const cap = measureWidth("1,000,000");
  const width = Math.min(measureWidth(text || "0"), cap);
  num.style.width = `${Math.ceil(width) + 2}px`;
}
window.addEventListener("resize", () => sizeReadout(num.value));

// ---------- spectral class info ----------

const classChip = $("classChip"), classInfo = $("classInfo");

function renderClassInfo() {
  const letter = spectralClass(state.T);
  classChip.textContent = `Class ${letter}`;
  if (classInfo.hidden) return;
  const info = CLASS_INFO[letter];
  classInfo.innerHTML = `
    <div class="ci-head"><strong>Class ${letter} · ${info.name}</strong><button type="button" class="ci-close" aria-label="Close">×</button></div>
    <p class="ci-range">${classRange(letter)}</p>
    <p>${info.about}</p>
    <p class="ci-examples">Examples: ${info.examples}</p>
    <p class="ci-foot">Classes describe stars and brown dwarfs. <a href="#faq-classes" data-open-faq>All classes</a></p>`;
}

function setClassInfoOpen(open) {
  classInfo.hidden = !open;
  classChip.setAttribute("aria-expanded", String(open));
  renderClassInfo();
}

classChip.addEventListener("click", () => setClassInfoOpen(classInfo.hidden));
classInfo.addEventListener("click", e => {
  if (e.target.closest(".ci-close")) setClassInfoOpen(false);
  const link = e.target.closest("[data-open-faq]");
  if (link) {
    setClassInfoOpen(false);
    $("faq-classes").open = true;
  }
});
document.addEventListener("click", e => {
  if (!classInfo.hidden && !classInfo.contains(e.target) && e.target !== classChip) setClassInfoOpen(false);
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && !classInfo.hidden) {
    setClassInfoOpen(false);
    classChip.focus();
  }
});

export function renderReadout(Lv, peakNm) {
  if (document.activeElement !== num) {
    tempBig.classList.remove("typed-unit");
    num.value = formatK(state.T);
    sizeReadout(num.value);
  }
  renderClassInfo();
  $("verdict").innerHTML = visibilityVerdict(state.T, Lv, peakNm);
}
