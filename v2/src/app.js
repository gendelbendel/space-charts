// Wires the page together: every module renders from `state`, and any change
// goes through update() in state.js, which calls render() here.
import { luminance, wienPeakNm } from "./physics.js";
import { statsText } from "./format.js";
import { state, onUpdate, update, updateUrl } from "./state.js";
import { $ } from "./dom.js";
import { renderSlider, renderControls, renderTrack, initModesSheet } from "./controls.js";
import { renderReadout } from "./readout.js";
import { renderStage } from "./stage.js";
import { renderPipelines } from "./pipelines.js";
import { drawChart, initChart } from "./chart.js";
import { drawCie } from "./cie-diagram.js";
import { renderHr, initHr } from "./hr-diagram.js";
import { renderDaylight, initDaylight } from "./daylight.js";
import { renderObjects, initObjectsList } from "./objects-list.js";
import { renderOrion, initOrion } from "./orion.js";
import { initFaq } from "./faq.js";
import { initShare } from "./share.js";
import { initPlay, renderPlay } from "./play.js";
import { initKeys } from "./keys.js";
import { initTour, renderTour } from "./tour.js";

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
  for (const [id, text] of Object.entries(statsText(state.T, Lv, peakNm, state.vs))) $(id).innerHTML = text;
}

// ---------- first-screen height ----------

// The phone, tablet and short-landscape tiers fit the first screen to 100svh. Firefox on iOS hides
// its toolbar by resizing the whole page, so every viewport unit (svh too) changed as you scrolled
// and the chart grew and shrank with it (owner's recording, 2026-11-04). The height is measured
// once and kept until the width changes (a rotation) or the height changes by more than a toolbar
// does (a resized window).
function pinScreenHeight() {
  let width = 0, height = 0;
  const measure = () => {
    const probe = document.createElement("div");
    probe.style.cssText = "position:fixed;top:0;height:100svh;visibility:hidden";
    document.body.append(probe);
    const h = probe.offsetHeight;
    probe.remove();
    if (innerWidth === width && Math.abs(h - height) < 150) return;
    width = innerWidth;
    height = h;
    document.documentElement.style.setProperty("--screen-h", `${h}px`);
  };
  measure();
  addEventListener("resize", measure);
}

// ---------- render ----------

function render() {
  const peakNm = wienPeakNm(state.T);
  const Lv = luminance(state.T);

  renderSlider();
  renderPlay();
  renderTour();
  renderReadout(Lv, peakNm);
  renderControls();
  renderTabs();
  renderStats(Lv, peakNm);
  renderStage(Lv);
  renderTrack();
  drawChart();
  $("colormap").dataset.map = state.map;
  if (state.map === "hr") renderHr();
  else if (state.map === "day") renderDaylight();
  else drawCie();
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
pinScreenHeight();
onUpdate(render);
initChart();
initObjectsList();
initOrion();
initHr();
initDaylight();
initFaq();
initShare();
initPlay();
initTour();
initModesSheet();
initKeys();
matchMedia("(color-gamut: p3)").addEventListener("change", e => update({ wide: e.matches }));
render();
