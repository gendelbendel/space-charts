// The embed page (/embed/): the star, readout, slider and chart in an iframe, from the main page's
// modules. It reads the same URL parameters, and its "Open full page" link carries them to /.
import { luminance, wienPeakNm } from "./physics.js";
import { state, onUpdate, updateUrl, stateQuery } from "./state.js";
import { $ } from "./dom.js";
import { renderSlider, renderControls, renderTrack } from "./controls.js";
import { renderReadout } from "./readout.js";
import { renderStage } from "./stage.js";
import { drawChart, initChart } from "./chart.js";
import { initPlay, renderPlay } from "./play.js";

const fullPageUrl = (hash = "") => `/${stateQuery()}${hash}`;

// The class popup's "All classes" link points at the main page's FAQ, which this page doesn't have.
$("classInfo").addEventListener("click", e => {
  const link = e.target.closest("[data-open-faq]");
  if (!link) return;
  link.href = fullPageUrl("#faq-classes");
  link.target = "_blank";
}, { capture: true });

function render() {
  const peakNm = wienPeakNm(state.T);
  const Lv = luminance(state.T);
  renderSlider();
  renderPlay();
  renderReadout(Lv, peakNm);
  renderControls();
  renderStage(Lv);
  renderTrack();
  drawChart();
  $("fullPage").href = fullPageUrl();
  updateUrl();
}

// The HTML arrives prerendered for the default state; this first render replaces it with the URL's.
onUpdate(render);
initChart();
initPlay();
render();
