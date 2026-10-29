// Wires the page together: every module renders from `state`, and any change
// goes through update() in state.js, which calls render() here.
import { luminance, wienPeakNm } from "./physics.js";
import { statsText } from "./format.js";
import { state, onUpdate, update, updateUrl } from "./state.js";
import { $ } from "./dom.js";
import { renderSlider, renderControls, renderTrack } from "./controls.js";
import { renderReadout } from "./readout.js";
import { renderStage } from "./stage.js";
import { renderPipelines } from "./pipelines.js";
import { drawChart, initChart } from "./chart.js";
import { drawCie } from "./cie-diagram.js";
import { renderObjects, initObjectsList } from "./objects-list.js";
import { renderOrion, initOrion } from "./orion.js";
import { initFaq } from "./faq.js";
import { initShare } from "./share.js";
import { initPlay, renderPlay } from "./play.js";
import { initKeys } from "./keys.js";

// ---------- visualization tabs (used by the compact layout) ----------

document.querySelectorAll("[data-tabs]").forEach(tabs => {
  tabs.addEventListener("click", e => {
    const button = e.target.closest("button[data-view]");
    if (!button) return;
    update({ view: button.dataset.view });
  });
});

function renderTabs() {
  document.querySelectorAll("[data-tabs] button").forEach(b => b.setAttribute("aria-selected", String(b.dataset.view === state.view)));
  document.querySelectorAll("[data-view-panel]").forEach(p => p.classList.toggle("active", p.dataset.viewPanel === state.view));
}

// ---------- stats ----------

function renderStats(Lv, peakNm) {
  for (const [id, text] of Object.entries(statsText(state.T, Lv, peakNm))) $(id).innerHTML = text;
}

// ---------- render ----------

function render() {
  const peakNm = wienPeakNm(state.T);
  const Lv = luminance(state.T);

  renderSlider();
  renderPlay();
  renderReadout(Lv, peakNm);
  renderControls();
  renderTabs();
  renderStats(Lv, peakNm);
  renderStage(Lv);
  renderTrack();
  drawChart();
  drawCie();
  renderOrion();
  // Rebuilding these took half of each frame during Play; they render once when it ends.
  if (!state.animating) {
    renderPipelines();
    renderObjects();
  }
  updateUrl();
}

// The HTML arrives prerendered for the default state (v2/src/prerender.js);
// this first render replaces it with the URL's state.
onUpdate(render);
initChart();
initObjectsList();
initOrion();
initFaq();
initShare();
initPlay();
initKeys();
matchMedia("(color-gamut: p3)").addEventListener("change", e => update({ wide: e.matches }));
render();
