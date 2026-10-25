---
paths:
  - "v2/pages/**"
  - "v2/partials/**"
  - "v2/src/app.js"
  - "v2/src/base.css"
  - "v2/src/slider-scale.js"
  - "v2/src/slider-marks.js"
  - "v2/tools/**"
---

# UI

- Layout tiers live in `v2/pages/index.html`: **phone** (<600px: docked controls, tabbed visuals, stacked when the `viz` container is ≥430px tall), **tablet** (600–899px and >520px tall), **short landscape** (≤520px tall, ≥600px wide), **desktop** (≥900px and >520px tall; 900–1199px stacks the stats full width). Shared components go in `base.css`. (Why: `docs/WHY.md#everything-the-slider-changes-stays-on-one-screen`)
- Nothing may change size when a mode, model or temperature changes: give changing text a fixed height, a reserved line count, or `nowrap` with ellipsis. Text inputs ignore line-height; give them an explicit height in `em`. Verify with `npm run check:layout`: it builds, then runs `v2/tools/layout-stability.js` (movement, overlap, containment) in Playwright at 12 sizes across the four tiers, and adds first-screen and desktop column-balance checks (`--sizes 375x667,1440x900` to narrow it, `--browser webkit` after `npx playwright install webkit`). To run the stability check by hand in a browser: `cp v2/tools/layout-stability.js build/__layout-check.js`, then in the page run `eval(await (await fetch('/__layout-check.js')).text())`. `build/` is never committed. (Why: `docs/WHY.md#nothing-moves-when-modes-change`)
- The big temperature is also the text box (`#num` inside `#tempBig`): it shows "5,772", edits as "5772", and applies on Enter or blur (Escape and junk revert). Its type size is fixed per tier and sized for 1,000,000 K; never scale type by content length. Its width comes from the hidden `.temp-measure` mirror span. The class badge leads the verdict line, not the number's row.
- Desktop column balance: `--stage-h` and `--viz-h` scale together so the left column and the chart column end together. `check:layout` fails if `.b-left` and `.stats` end more than 20 px apart at 1024×768, 1280×720 or 1440×900.
- The slider's mapping is `SLIDER_KNOTS` in `slider-scale.js`, chosen by the owner, and a test pins how much of the bar each range gets. (Why: `docs/WHY.md#the-slider-favors-the-temperatures-where-color-changes`)
- Anything drawn along a slider uses `alongSlider()` and the scale's `toFraction`, never a raw percentage of the row. Labels go through `createSliderMarks`, which hides colliding labels by priority. (Why: `docs/WHY.md#slider-marks-follow-the-thumb`)
- `app.js` is the only controller: state → `render()` → DOM. Bundled as an IIFE, so nothing is global; in the browser console, drive the page through the DOM (set `#slider.value` and dispatch `input`), not by calling its functions.
- The page reads `?t=` (and v1's `?temp=`), `model`, `light` and `compare`, and writes back via `history.replaceState` (wrapped in try/catch for `file://` previews). Keep old links working.
- Dark only. Colors come from the `:root` tokens in `base.css`. No raw colors in components, except star and spectrum colors computed by the physics.
- Partials are expanded at build time. An element ID used by `app.js` must appear exactly once per page.
- FAQ answers stay collapsed until tapped, including after a search.
- Never play sound while testing (owner's global rule). The page has no audio today; keep it that way unless asked.
