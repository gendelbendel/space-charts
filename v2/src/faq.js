// FAQ search, and the class list inside the "letters" answer.
import { SPECTRAL_CLASSES, CLASS_INFO } from "./data/objects.js";
import { classRange } from "./slider-marks.js";
import { $ } from "./dom.js";

export const classListHtml = () => SPECTRAL_CLASSES.map(([letter]) => {
  const info = CLASS_INFO[letter];
  return `<div><dt><span class="cl-letter">${letter}</span>${info.name} <span class="cl-range">${classRange(letter)}</span></dt><dd>${info.about} Examples: ${info.examples}.</dd></div>`;
}).join("");

export function initFaq() {
  $("classList").innerHTML = classListHtml();
  $("faqSearch").addEventListener("input", e => {
    const q = e.target.value.trim().toLowerCase();
    document.querySelectorAll("#faq details").forEach(d => (d.hidden = !!q && !d.textContent.toLowerCase().includes(q)));
    document.querySelectorAll(".faq-group").forEach(g => (g.hidden = !g.querySelector("details:not([hidden])")));
    $("faqEmpty").hidden = !!document.querySelector("#faq details:not([hidden])");
  });
}
