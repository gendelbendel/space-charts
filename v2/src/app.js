// Wires the page together: every module renders from `state`, and any change
// goes through update() in state.js, which calls render() here.
import { luminance, wienPeakNm, radiantExitance, visibleFraction } from "./physics.js";
import { formatWavelength, formatSci } from "./format.js";
import { state, onUpdate, update, updateUrl } from "./state.js";
import { $ } from "./dom.js";
import { renderSlider, renderControls, renderTrack } from "./controls.js";
import { renderReadout } from "./readout.js";
import { renderStage } from "./stage.js";
import { renderPipelines } from "./pipelines.js";
import { drawChart } from "./chart.js";
import { buildCieBase, drawCie } from "./cie-diagram.js";
import { renderObjects } from "./objects-list.js";
import { buildClassList } from "./faq.js";

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
  const T = state.T;
  $("sPeak").textContent = formatWavelength(peakNm);
  const vf = visibleFraction(T);
  $("sVis").textContent = vf < 1e-4 ? formatSci(vf * 100) + " %" : (vf * 100).toFixed(vf < 0.1 ? 2 : 1) + " %";
  $("sLum").textContent = formatSci(Lv) + " cd/m²";
  $("sFlux").textContent = formatSci(radiantExitance(T)) + " W";
}

// ---------- render ----------

function render() {
  const peakNm = wienPeakNm(state.T);
  const Lv = luminance(state.T);

  renderSlider();
  renderReadout(Lv, peakNm);
  renderControls();
  renderTabs();
  renderStats(Lv, peakNm);
  renderStage(Lv);
  renderTrack();
  renderPipelines();
  drawChart();
  drawCie();
  renderObjects();
  updateUrl();
}

onUpdate(render);
buildClassList();
buildCieBase();
render();
