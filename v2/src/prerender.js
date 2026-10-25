// Build-time rendering of the first screen, so the page is complete before its
// script runs (and without it). build.mjs fills each `{{name}}` in the page with
// the value of the same name. Values come from the same builders the page uses,
// and the page's first render replaces them, so nothing changes when JS runs.
//
// Only the temperature varies: the modes are the defaults, which the partials
// mark statically (aria-pressed, aria-selected, the active panel). The chart
// (a canvas) and the color map (1.4 KB gzipped of pure graphics) draw when JS
// runs; their boxes are sized by CSS, so nothing moves when they appear.
// `npm run check:layout` checks that with the script turned off.
import { luminance, wienPeakNm } from "./physics.js";
import { formatK, visibilityVerdict, statsText } from "./format.js";
import { state, readState } from "./state.js";
import { spectralClass, tToSlider, sliderTrack } from "./slider-marks.js";
import { discLooks, discsHtml, stageHex, stageNote } from "./stage.js";
import { pipelinesHtml } from "./pipelines.js";
import { legendHtml } from "./chart.js";
import { objectsHtml } from "./objects-list.js";
import { classListHtml } from "./faq.js";

export function prerender(T) {
  Object.assign(state, readState(`?t=${T}`));
  const peakNm = wienPeakNm(T);
  const Lv = luminance(T);
  const looks = discLooks(Lv);
  const note = stageNote(Lv);
  return {
    readout: formatK(T),
    sliderValue: String(tToSlider(T)),
    sliderValueText: `${formatK(T)} kelvin`,
    sliderTrack: sliderTrack(state.model, state.light),
    classChip: `Class ${spectralClass(T)}`,
    verdict: visibilityVerdict(T, Lv, peakNm),
    discs: discsHtml(looks),
    labelHex: stageHex(looks),
    stageNote: note.note,
    stageNoteClass: note.warn ? "stage-note warn" : "stage-note",
    ...statsText(T, Lv, peakNm),
    legend: legendHtml(),
    pipes: pipelinesHtml(),
    objects: objectsHtml(),
    classList: classListHtml(),
  };
}
