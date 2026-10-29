# v2 roadmap: the next 25 features

Written 2026-10-25. The owner asked for all 25 ideas from the brainstorm, built over several sessions. This doc is the build plan: what goes in which work package, in what order, and what can run in parallel. `PLAN.md` stays the source of truth for physics, color models and architecture; this doc only covers new work.

**How to use it.** Each work package below is written as a brief a fresh session can start from: "Read `docs/v2/ROADMAP.md` and build package P1.A." When a package lands, tick it in the status table and note its size cost. If a package changes a decision recorded in `PLAN.md` or `docs/WHY.md`, update those too.

## Status

| Package | Features | Depends on | Status | Gzip cost |
|---|---|---|---|---|
| P0.1 Automated checks | #23, #24 | — | done 2026-10-25 | 0 |
| P0.2 Split `app.js`, object records | (enabler) | P0.1 | done 2026-10-25 | +0.3 |
| P0.3 CIE table vs. official CSV | #25 | — | done 2026-10-25 | 0 |
| P0.4 Prerender the first screen | #22 | P0.2 | done 2026-10-25 | +2.2 |
| P1.A Readout takes names and units | #4, #5 | P0.2 | done 2026-10-25 | +0.4 |
| P1.B Everyday and cosmic objects | #6, #7 | P0.2 | done 2026-10-25 | +2.7 |
| P1.C Color output: P3, copy, share | #16, #17, #19 | P0.2 | done 2026-10-25 | +1.8 |
| P1.D Heat it up, keyboard shortcuts | #1, #21 | P0.2 | done 2026-10-25 | +1.2 |
| P2.A Chart: per-frequency, lines, energy split | #10, #11, #12 | P0.2 | done 2026-10-29 | +1.8 |
| P2.B Scotopic vision | #15 | — | done 2026-10-25 | +0.6 |
| P3.A Compare two temperatures | #9 | P2.A | not started | est. +2 |
| P3.B HR diagram view | #13 | P1.B | done 2026-10-29 | +1.6 |
| P3.C Daylight on another world | #8 | P3.B | not started | est. +2 |
| P3.D Orion in true color | #3 | P0.2 | done 2026-10-26 | +1.5 |
| P4.A Guided tour | #14 | P1.B, P1.D | not started | est. +2 |
| P4.B Guess-the-temperature game | #2 | P0.2 | done 2026-10-26 | own page, 17.7 (budget 20); main page +0.16 for its links |
| P5.A Per-star pages and preview images | #18 | P0.4, P1.B | not started | own pages |
| P5.B Embed page | #20 | P0.4 | done 2026-10-29 | own page, 21.7 (budget 22); main page +0.4 for its FAQ entry |

Feature numbers match the brainstorm list (reproduced at the end). The main page is 27.5 KB gzipped after Phase 0 (budget 40 KB, see D1); the remaining estimates add up to about 40 KB.

### Next up (updated 2026-10-29)

Wave 3 (P2.A, P3.B, P5.B) is merged on `main`, not yet pushed. The main page is 39.5 KB gzipped (40,443 bytes), `/play/` 18.7 KB of 20, `/embed/` 21.7 KB of 22. Measured together, the three packages added 3.7 KB to the main page.

- **Budget:** 0.5 KB of the main page's 40 KB is left. The remaining main-page packages (P3.A, P3.C, P4.A) are estimated at about 2 KB each, so none of them fits without trimming or a new D1 answer.
- **Wave 4 (P3.A, P3.C, P5.A) needs answers first:** D1 (raise the budget or trim), D6 (star page URLs) and D7 (preview images).
- **Starting a package:** run `npm install`, then `npm run snapshot:save` on the starting commit if the package should leave existing states looking the same. Baselines are local (`v2/.snapshots/`, gitignored), so every session saves its own. Finish with `npm run test:v2`, `npm run check:layout`, `npm run check:embed` if it touches a shared partial, `base.css`, `chart.js` or `readout.js`, and, where relevant, `npm run snapshot:compare`; add a snapshot state for any new control.
- **Known issues found while merging wave 3:**
  - `check:layout --browser webkit` now runs (the harness no longer asks WebKit for clipboard permissions). It fails at the 8 phone, tablet and short-landscape sizes, the same way on the commit before wave 3: with "Show all three" on, the three discs shift sideways as the slider sweeps. Desktop sizes and `check:embed --browser webkit` pass.
  - On phones the Per Hz chart's legend is wider than the card and cut off until swiped (375 and 390 px wide, and 600 px tablet width).
  - On phones the HR diagram is about 150 px square, with labels around 5 px, like the color map's.
  - P2.A's TiO band heads (476.1, 495.4, 516.7, 615.9, 705.4 nm) are cited to Gray & Corbally 2009 but weren't checked against the book. P3.B's L and R values come from Wikipedia infoboxes and the papers they cite, not each paper's tables; Zeta Puppis's L is the least certain, and Bellatrix's R is computed from its L and T.

## Decisions for the owner

Each has a recommendation; packages that need the answer say so. Record answers here.

**Answered (2026-10-25):** D1 and D2, as recommended: a 40 KB gzip budget for the main page, and Playwright as a dev dependency. Later the same day, D4, D5 and D8, also as recommended: new controls go where the D4 row says, typed temperatures take up to 3 decimals below 100 K, and the game and embed are their own pages. **Answered (2026-10-29):** D3, as recommended: a small switcher in the color-map card (Color map / HR diagram, with room for Daylight later); phone tabs stay Spectrum / Map / Numbers, with the switcher inside Map. Still open: D6, D7.

| # | Decision | Needed by | Recommendation |
|---|---|---|---|
| D1 | **Size budget.** All of this pushes the main page from ~25 KB to ~40 KB gzipped, past the 15 KB JS budget in `PLAN.md` §4. | P0.1 | Set the main page's budget to 40 KB gzipped and enforce it. Keep the game, the embed and the star pages as separate pages so they don't count against it. |
| D2 | **Playwright as a dev dependency**, to run `layout-stability.js` automatically. The repo has no CI today. | P0.1 | Yes, dev-only (v2 stays dependency-free at runtime). Run it from an npm script; add a GitHub Action later if wanted. |
| D3 | **Where new visuals go on the first screen.** HR diagram (#13) and daylight (#8) need a slot. The phone already has tabs; desktop shows chart and color map side by side. | P3.B | The color-map card gets a small switcher: Color map / HR diagram / Daylight. Phone tabs stay Spectrum / Map / Numbers, with the switcher inside Map. No new columns. |
| D4 | **Where new controls go.** Play (#1), pin-to-compare (#9), copy and share (#17, #19), per-frequency (#11). | P1.C, P1.D | Play sits at the slider's left end. Copy and share are icon buttons in the readout row. Per-frequency joins the Linear/Log toggle as a second toggle in the chart header. Pin goes next to the readout. |
| D5 | **Decimal temperatures.** The CMB is 2.725 K, but input is rounded to whole kelvin. | P1.A | Allow up to 3 decimals below 100 K, whole numbers above. The slider stays at 100 K minimum; colder values are typed or picked from cards. |
| D6 | **Star page URLs.** | P5.A | `/stars/betelgeuse/`, each a prerendered copy of the main page with its own title, description and preview image. `?t=` links keep working. |
| D7 | **Preview images.** OG images must be PNG or JPEG, and there's no server to render them. | P5.A | Generate them locally with Playwright (`npm run og`) and commit them under `v2/og/`, not `public/` (v1 would ship them). About 40 images at ~30 KB each. |
| D8 | **Game and embed: own pages or modes?** | P4.B, P5.B | Own pages (`/play/`, `/embed/`), built from the same modules and partials. They stay small and don't affect the main page's layout. |

## How the work is ordered

1. **Foundations first.** Today every feature would edit the 573-line `app.js` and verify layout by hand at nine sizes. P0.1 automates the checks and P0.2 splits the controller into modules, so later packages are smaller, can run in parallel, and verify themselves.
2. **Group by file, not by idea.** Features that touch the same module go in one package (all three chart features are P2.A), so two sessions never edit the same code.
3. **Below the fold before the first screen.** Anything that adds to the first screen has to fit every layout tier without moving anything (CLAUDE.md rules 5 and 6). Those packages are fewer and later; below-the-fold ones (Orion, objects, game) can start any time.
4. **Physics packages start with the golden test.** Every new formula is checked against a published value before UI is built on it (listed per package).
5. **Measure size per package.** The build prints gzip size; after P0.1 it fails over budget. Record each package's cost in the status table.

### Parallel tracks

Packages in the same row can run in separate worktree sessions at once. Each one merges into `main` locally when done (the owner commits on `main`); a still-running session then syncs with `main` before it finishes. Pushing stays the owner's call.

| Wave | Run together | Notes |
|---|---|---|
| 1 | P0.1 → P0.2 → P0.4 (one session, in order) · P0.3 · P2.B | P0.3 and P2.B touch only data and tests. |
| 2 | P1.A · P1.B · P1.C · P1.D · P3.D · P4.B | Up to three at a time is easier to review. P1.A and P1.C both edit `physics.js`, but different functions. |
| 3 | P2.A · P3.B · P5.B | |
| 4 | P3.A · P3.C · P5.A | P3.A needs P2.A's chart overlay; P3.C reuses P3.B's view switcher. |
| 5 | P4.A | The tour visits features from every earlier wave. |

About 18 sessions in total, or 5 waves if run in parallel.

### Files many packages touch

| File | Touched by | How to avoid conflicts |
|---|---|---|
| `v2/src/app.js` | almost everything | P0.2 splits it into modules first |
| `v2/src/physics.js` | P1.A, P1.C, P2.A, P2.B, P3.B, P3.C | Add new functions; don't reorder existing ones |
| `v2/src/data/objects.js` | P1.A, P1.B, P3.B, P3.D, P5.A | P0.2 changes rows to records once, so new fields don't touch every row |
| `v2/pages/index.html` (layout tiers) | P1.C, P1.D, P3.A, P3.B | Waves keep these apart |
| `v2/partials/faq.html` | most packages add an entry | Append inside the right group; conflicts are trivial |

---

## Phase 0: foundations

### P0.1 Automated checks (#23, #24)

- `npm run check:size`, or a check at the end of `build.mjs`, that fails when a page passes its budget (D1). Budgets live in one table in `build.mjs`.
- `npm run check:layout`: Playwright builds the site, serves `build/`, and runs `v2/tools/layout-stability.js` at the sizes in CLAUDE.md (375×667, 430×932, 768×1024, 667×375, 1440×900, plus 320×568 and 1024×768). It fails on any shift, overlap or spill, and saves screenshots to `build/__shots/` for review. It also re-measures `.b-left` against `.stats` at 1024×768, 1280×720 and 1440×900 (the desktop balance rule in `ui.md`).
- Update CLAUDE.md "Verifying changes" and `.claude/rules/ui.md` to point at the new scripts.
- **Done when:** both scripts pass on today's `main`, and deliberately breaking a fixed height makes `check:layout` fail.
- **Done (2026-10-25).** The budget is `BUDGETS_KB` in `build.mjs` (no separate `check:size`). `npm run check:layout` takes about 10 s for 12 sizes. Its first run found and fixed a quarter-pixel verdict shift at 667×375. WebKit is supported (`--browser webkit`) but its browser isn't installed or tried yet; doing that would be a cheap first look at `PLAN.md` open question 2 (Safari).

### P0.2 Split `app.js` into modules; objects become records

No behavior change. Suggested modules: `state.js` (state, URL read/write), `format.js` (pure formatters and `visibilityVerdict`, importable from Node), `stage.js`, `readout.js`, `chart.js`, `cie-diagram.js`, `pipelines.js`, `objects-list.js`, `faq.js`, with `app.js` as a thin `render()` wiring them together. Rendering helpers that produce markup return strings, so P0.4 can call them at build time.

- `OBJECTS` changes from tuples to records: `{ slug, name, aliases, category, type, T, note, source }`. Optional later fields (`luminosity`, `radius`) are added by the packages that need them.
- `ui.md` says `app.js` is the only controller. Update it to "`app.js` wires the modules; state lives in `state.js`".
- **Done when:** `check:layout` passes, the built page looks identical at every tier (compare P0.1's screenshots before and after), the URL round-trips, and the gzip size hasn't grown by more than 0.2 KB.
- **Done (2026-10-25).** Modules as suggested, plus `dom.js` (the `$` helper) and stats and view tabs kept in `app.js`. State changes go through `update()` / `setTemperature()` in `state.js`, and `readState(search)` parses a query string without touching `location` (for P0.4). Objects are records with `slug` and `category` (`star`, `brown-dwarf`, `everyday`); a test keeps slugs unique and URL-safe. Verified against a baseline of 108 states (6 sizes × 18 states: URL variants, tabs, log axis, class chip, FAQ search, slider, typed input, card click, chart hover): every full-page screenshot, canvas, URL and DOM (minus the script) is identical. That comparison is now a reusable check: `npm run snapshot:save` / `snapshot:compare` (`v2/tools/snapshot.mjs`), with the browser setup shared with `check:layout` in `v2/tools/harness.mjs`. Size: the split costs ~0.07 KB; the new slug and category data ~0.2 KB, so 24.7 → 25.1 KB, slightly over the 0.2 KB target because of data later packages need.

### P0.3 CIE table vs. CIE's official CSV (#25)

- Download CIE 1931 2° from doi:10.25039/CIE.DS.xvudnb9b, check its license, and add a test that compares every 5 nm row of `v2/src/data/cie1931.js` with it. If the license doesn't allow committing the CSV, commit a script that downloads it and diffs it, and record the result in `PLAN.md`.
- Closes `PLAN.md` open question 3.
- **Done (2026-10-25).** The CSV is CC BY-SA 4.0, so it's committed unmodified, with CIE's metadata file (license and DOI), in `v2/test/data/`. Every embedded value is the official one rounded to six decimals (largest gap 4.9 × 10⁻⁷, x̄ at 780 nm), so the table stays as it is and the test allows half a unit in the sixth decimal. Changing one entry by 2 × 10⁻⁶ fails it. No change to the page. Afterwards the owner asked for CC BY-SA attribution: the FAQ "How is the CIE 1931 color calculated?" credits both CIE datasets (this one and P2.B's) with DOIs and the license.

### P0.4 Prerender the first screen (#22)

- `build.mjs` imports `physics.js` and the string-returning helpers from P0.2, then bakes the Sun's state into the HTML: readout, verdict, class chip, disc color, stats, objects list and pipeline panel. The canvas chart and the CIE dot draw when JS runs; reserve their space so nothing moves.
- `app.js` hydrates: on load it renders the URL's state over the baked one. A `?t=` link briefly shows the Sun first; accept that, or hide the changing parts until the first render when `?t=` is present. Decide while building and record it in `docs/WHY.md`.
- Use `npm run snapshot:save` before and `snapshot:compare` after: with JS on, every state should still match (the baked markup is replaced by the same render).
- **Done when:** with JS disabled, the page shows the Sun's full readout; with JS, `check:layout` passes and the first render causes no shift.
- **Done (2026-10-25).** `{{name}}` slots in the partials, filled by `build.mjs` from `v2/src/prerender.js`; `check:layout` now also compares the page with JS off and on. The color map and the slider's labels aren't baked (see `docs/WHY.md#the-first-screen-is-prerendered-from-the-same-builders`). `?t=` links: the script renders before the first paint in Chromium, so the Sun never shows; accepted for slow connections. Snapshot against P0.2: identical everywhere except 768×1024, where the chart and color map cards are 18 px shorter after fixing a canvas feedback loop the new check found. P5.A can call `prerender(T)` per star.

## Phase 1: quick wins

### P1.A The readout takes names and units (#4, #5)

- `parseTemperature` accepts "5772", "5,772 K", "1200 °C", "1200C", "2000 F" and "-40 °F", plus object names and aliases ("sun", "vega", "bulb", "candle") from `OBJECTS`. Names match case-insensitively, ignoring accents and dashes, so "wise 0855" works. Celsius and Fahrenheit convert exactly (+273.15; (F − 32) × 5/9 + 273.15), and anything at or below absolute zero is rejected.
- Decimals below 100 K, per D5.
- Change `inputmode="numeric"` to `"text"` so phones show letters, and update the `aria-label` and the FAQ "How do I use it?" answer.
- **Golden tests:** 0 °C → 273.15 K, −40 °C = −40 °F → 233.15 K, 100 °C → 373.15 K, "−300 C" → rejected, "Sun" → 5,772.
- **Done (2026-10-25).** `parseTemperature` tries a quantity (digit groups split by commas or spaces, "°", "deg"/"degrees", K/C/F or the spelled-out scale; a bare "°" is rejected), then `objectTemperature`: an exact match on any object's name, slug or `aliases`, else a unique prefix of 3+ characters. `nameKey` drops case, accents, punctuation and a leading "the", so "the sun", "Sírius" and "wise 0855" work, and records P1.B adds are matched without code changes ("wise" alone is ambiguous and rejected). Only the bulb needed aliases ("Bulb", "Light bulb"). The exact conversion is `toKelvin` (tested at 273.15, 233.15 and 373.15 K); `parseTemperature` then rounds per D5, so "0 °C" applies as 273 K. While a unit or name is typed, the "K" is hidden (it keeps its space), and the box stops growing at the width of "1,000,000" and scrolls inside. `formatWavelength` gained metres, since peaks below 1 K are now reachable. `?t=` goes through the same parser, so `?t=sun` and `?t=2.725` work and are written back in kelvin. Snapshot states `typed-celsius` and `typed-name` added; against the starting commit all 108 existing states match pixel for pixel, and the DOM differs only in the new `inputmode`, `aria-label` and FAQ text. Main page 28.3 → 28.7 KB gzipped.

### P1.B Everyday and cosmic objects (#6, #7)

- New objects, each with a cited temperature in its `source`: warm-white LED (2,700 K), neutral (4,000 K), daylight (6,500 K, the D65 white point, which is worth a note), stove element, lava (basaltic, ~1,400 K), molten steel, a welding arc, lightning (~30,000 K), and the cosmic microwave background (2.72548 K, Fixsen 2009).
- A "When the universe turned transparent" card: about 3,000 K at recombination, 380,000 years after the Big Bang. The CMB today is that light, stretched by a factor of about 1,100.
- Group the list by `category` (Stars · Brown dwarfs · Everyday light · Cosmic), with headings. It's below the fold, so there's no first-screen risk.
- FAQ: "Why is a 2,700 K bulb called *warm* when it's colder?" and "What is the cosmic microwave background?"
- Note: the CMB is below the slider's 100 K floor, so the thumb pins at the left end. Check that the marks and track handle it.
- **Done (2026-10-25).** Ten new records appended to `OBJECTS` (existing rows untouched): warm-white and neutral LEDs (ANSI C78.377), daylight D65 (noted as ~6,504 K and not a blackbody), stove element 1,140 K, basaltic lava 1,440 K (USGS, 1,170 °C), molten steel 1,920 K, a TIG welding arc 20,000 K, lightning 30,000 K (NWS), the recombination card at 3,000 K and the CMB at 2.72548 K, each with `source` and a few `aliases` for P1.A. New category `cosmic`; `CATEGORIES` in `objects.js` holds the list headings, and the list renders one heading and grid per category, coldest first. Golden tests: the CMB peaks at 1.063 mm, and the recombination card matches T_CMB × (1 + z*) with Planck 2018's z* = 1089.92. At 2.7 K the slider thumb pins at 0, the marks and track are unchanged and nothing errors; two fixes for temperatures below 100 K only: the chart's x axis gets one tick per decade (it spans 4.5 decades, and labels overlapped) and labels in mm, and the verdict says "in microwaves" for peaks past 1 mm. Until P1.A lands, `?t=2.72548` reloads as 3 K (the card click sets the exact value). The snapshot's card state now clicks Betelgeuse by name (the grouped list changed button order), and a `cmb-card` state was added (114 states). Snapshot against the starting commit: canvas, URL and focus identical everywhere; the DOM differs only inside the objects list and the FAQ. Size: 28.3 → 31.0 KB, over the +1 estimate: ~0.8 KB is the prerendered cards, ~0.7 KB the FAQ answers, the rest the records in the script (~0.4 KB of it citations). With the remaining estimates the main page would pass 40 KB, so later packages need to watch size.

### P1.C Color output: wide gamut, copy, share (#16, #17, #19)

- **P3 / wide gamut:** add `linearSrgb → display-p3` (or emit `color(xyz-d65 X Y Z)` directly, per `PLAN.md` §2.2 step 5) for the disc, the chips and the slider track when `matchMedia("(color-gamut: p3)")` matches. The sRGB gamut mapping stays as the fallback.
  - **Golden test:** the published XYZ→Display P3 matrix (SMPTE EG 432-1 primaries, D65): P3 red (1, 0, 0) → xy (0.680, 0.320), and D65 white → (1, 1, 1).
  - FAQ "Is the color on my screen exactly right?" gains a line about wide-gamut screens.
- **Copy color:** a small button copies the current hex. A long-press or menu offers `rgb()` and CSS `color(xyz-d65 …)`. Add a "Copy all as CSS variables" link at the bottom of the objects list.
- **Share:** `navigator.share` where it exists, otherwise copy the URL, with a short "Link copied" toast that doesn't move the layout.
- Placement per D4: icon buttons in the readout row, at every tier.
- **Done (2026-10-25).** `physics.js` gained `displayColorP3` (plus the P3 matrices, `xyzToLinearP3` and `linearP3ToXyz`): the same white-mixing gamut map done in Display P3, at the sRGB color's luminance unless a P3 channel would pass 1. It differs from `displayColor` only for colors outside sRGB, so in-gamut colors match on both kinds of screen. sRGB holds the blackbody hue only down to 1,901 K (the FAQ and `physics.md` said 1,500 K; corrected), P3 down to 813 K. Golden tests: the P3 primaries (0.680, 0.320), (0.265, 0.690), (0.150, 0.060) and D65 → (1, 1, 1) to 1e-4, and at 1,500 K the P3 color is the published locus point (0.5857, 0.3931) at the sRGB color's luminance. `state.wide` follows `matchMedia("(color-gamut: p3)")` (live, so moving a window between screens re-renders); `screenColor(...).paint(alpha)` in `format.js` gives `color(display-p3 …)` or the sRGB value for the disc and glow, object dots and slider track. Copy and share live in the new `share.js`: the copy button sits at the end of the readout row with share beside it, stacked into the row's height on phones and short landscape (beside "1,000,000 K" there are only 31–39 px). A tap copies the hex; holding the button (450 ms, mouse or touch) or ↓ opens Hex / RGB / XYZ (`color(xyz-d65 …)` of the P3 color, the deepest the page computes). Share uses `navigator.share`, otherwise copies the `stateQuery()` URL; a fixed toast confirms ("Copied #ff4f00", "Link copied", "Couldn't copy"). "Copy all as CSS variables" under the objects list copies every object as `--slug: #hex` in the current model and brightness. The snapshot harness now grants clipboard permission; new states `copy`, `copy-menu`, `share`, `copy-variables`, `wide-gamut`, `wide-gamut-compare` (162 states; wide gamut is emulated through CDP). Against the starting commit, all 126 old states keep canvas, URL and focus; screenshots differ only in the buttons' box and below the new link under the objects list (35 px shift), apart from the sticky dock's blurred backdrop in one full-page shot. Size: 31.1 → 32.9 KB, over the +1.2 KB cap the owner set; the hold-for-more menu with the XYZ math it needs is ~0.6 KB of it. The owner chose to keep everything at +1.8 KB.

### P1.D Heat it up, keyboard shortcuts (#1, #21)

- **Play:** a button at the slider's left end sweeps from 300 K to 40,000 K in about 12 s, at constant speed in slider position (so it uses the weighted scale and lingers where color changes). Any slider, readout or card input stops it. With `prefers-reduced-motion`, it steps through about 8 stops with a pause at each instead of animating.
- Check `render()` holds 60 fps while playing. It currently rebuilds the pipelines and objects HTML on every call; skip those while playing if needed, and render them once at the end.
- The animation helper (`animateTo(T, ms)`) goes in its own module, because P4.A reuses it.
- **Shortcuts:** ←/→ step by class, Shift+←/→ fine-step, letters O–Y jump to a class, S = Sun, M / B cycle color model and brightness, C = compare, P = play, `?` opens a small shortcut list. Ignore them while focus is in a text field.
- **Done (2026-10-25).** `animate.js` exports `animateTo(T, ms, steps)` and `stopAnimation()`: constant speed along the slider's weighted scale, resolving true on arrival (still animating, so P4.A can chain steps and captions) or false if stopped; with `steps` it jumps through that many evenly spaced stops rounded to two significant figures instead, holding each for an equal share of `ms`. The new `state.animating` flag is the only switch: `setTemperature()` (slider, readout, cards, slider letters and marks, shortcuts) clears it, which stops the animation, and pressing the slider's thumb stops it too. Model, brightness, compare and tabs leave Play running. `play.js` owns the button: a 26 px circle (the thumb's size) absolutely placed in the slider block's new 34 px left padding, so the slider row keeps its exact height (a grid version lost the 0.8 px line-box gap under the slider and nudged the controls up 1 px); `aria-pressed` swaps ▶ for ■. With reduced motion it steps 300, 1,800, 3,000, 4,300, 6,300, 9,000, 14,000, 40,000 K, 1.5 s each. Measured with Playwright (rAF callbacks timed, frame intervals counted, 12 s sweep): full render held 60 fps on the dev Mac (2.5 ms of script per frame) but dropped to ~48 fps at 4× CPU throttle on desktop sizes (134 of 720 frames late). `render()` now skips the pipelines and objects HTML while animating (they render once at the end): 1.2–1.6 ms per frame, and 4.5–4.8 ms with 60 fps at 4× throttle at 375×667, 1440×900 and 1920×1080 (at most 1 late frame, the first). Shortcuts are in `keys.js`; the `?` list is a modal `<dialog>` (`partials/keys.html`; Escape, `?` or a backdrop click closes it). **B and M clash** (brightness and model vs. the B and M classes): lowercase m and b cycle the modes, Shift+B and Shift+M jump to the classes, every other class letter works with or without Shift. ←/→ go to the next class midpoint (the temperatures the slider letters jump to); Shift+←/→ move one slider position. Ignored in text and search fields and with Ctrl, Alt or Cmd; the focused slider keeps its own arrow keys. New snapshot states `play`, `play-stopped`, `shortcut-list`, `shortcut-keys` (186 states). Against the starting commit, all 162 old states keep canvas, URL, focus and DOM (once the button, the dialog and the tick labels' `left` are set aside), and every screenshot difference sits inside the 61 px slider block: the button, and the class and mark labels re-placed along the 34 px shorter slider (at some sizes one more label hides, e.g. Y or Betelgeuse at 1024×768). Size: 32.9 → 34.0 KB (+1,203 bytes, 1.17 KB, under the 1.2 KB cap after folding the reduced-motion pauses into `animateTo` and trimming the dialog).

## Phase 2: chart and physics depth

### P2.A Chart: per-frequency axis, absorption lines, energy split (#10, #11, #12)

All three edit `chart.js` and the stats, so they're one package.

- **Per-frequency toggle (#11):** plot B_ν against frequency (or against wavelength with the per-Hz density) and move the peak marker to Wien's frequency law. Explain in the FAQ why the peak moves: the Sun peaks near 502 nm per nm but near 880 nm per Hz.
  - **Golden tests:** ν_peak = 5.879 × 10¹⁰ Hz/K × T (CODATA); ∫B_ν dν = σT⁴/π.
- **Absorption lines (#12):** labeled ticks for the strongest lines per class. Balmer (Hα 656.3, Hβ 486.1, Hγ 434.0 nm) is strongest in A stars; Ca II H & K (396.8, 393.4) and Na D (589.0/589.6) in G and K; TiO bands in M. Wavelengths come from NIST ASD. They're labeled as illustrative (the chart is still a blackbody). Show them by default only when the "Real stars" model is on, or behind a legend toggle.
- **Energy split (#10):** the "Visible light" stat becomes a UV / visible / IR bar with percentages.
  - **Golden test:** the published blackbody fraction F(0→λT): λT = 2,897.77 µm·K gives 0.2501, and λT = 5,000 µm·K gives 0.6337 (standard radiation tables).
- `check:layout` at every tier: the chart header gains a toggle, and the stats row must not change height.
- **Done (2026-10-29).** **Per Hz:** a Per nm / Per Hz toggle (`state.axis`, not in the URL, like Linear/Log) sits beside Linear/Log. Per Hz plots `planckPerHz` (B_ν = B_λ λ²/c) against the same log-wavelength axis, so the visible band, overlays and lines stay put and the x range never rescales; the peak marker moves to `wienPeakHz` (CODATA b′ = 5.878925757 × 10¹⁰ Hz/K; the Sun: 883 nm). The subtitle's unit and the hover readout follow it. The header is now a grid: title and both switches on one row, the subtitle full width below with two lines reserved. On phones and in short landscape the subtitle is hidden too (the h2 already was) and the switches take the header's two ends; at 320 px they fit with ~50 px to spare. Tablet's chart `min-height` went 300 → 292.25 px so the card row keeps its exact height. **Lines:** `data/lines.js` holds Hα/Hβ/Hγ (B, A, F), Ca II H & K (F, G, K), Na D (G, K, M) from NIST ASD air wavelengths, and five TiO band heads (M; TiO isn't in the ASD, cited to Gray & Corbally 2009: worth a check). They're dark notches through the fill, labeled along the bottom in two staggered rows (one on the shortest charts). A "Lines" switch leads the legend (`state.lines`: null follows the model, on for Real stars); while on it reads "Lines, illustrative". The legend keeps focus on it across re-renders. **Energy split:** the Visible light stat is now "UV · visible · IR", a three-segment bar (380 and 780 nm cuts, `energySplit` from the series form of the blackbody fraction `blackbodyFraction(λT)`) with percentages under it, inside the same two reserved lines. Small shares round to "0%" (the old stat's 10⁻⁷³ % precision is gone). **Known issue fixed:** the legend was a flex item with `overflow-x: auto`, so its min-height was 0 and it shrank; it's `flex: none` now. **Tests:** ν_peak = 5.879 × 10¹⁰ Hz/K × T and B_ν's maximum there; ∫B_ν dν = σT⁴/π at 1,000 and 5,772 K; F(0→λT) = 0.2501 at 2,897.77 and 0.6337 at 5,000 µm·K (Incropera's blackbody radiation function table); the split's visible share matches a direct 380–780 nm integration. Two FAQ entries (why the peak moves per Hz; what the lines are), plus units and test notes. New snapshot states `per-hz`, `per-hz-log`, `lines-star`, `lines-toggle`, `lines-off` (240 states); `layout-stability.js` also sweeps Per Hz with lines on and off. **Size:** 35.80 → 37.55 KB (+1,807 bytes, 1.76 KB of the 2.0 KB cap); the play page 18.2 → 18.5 KB from the shared CSS.

### P2.B Scotopic vision (#15)

- Add the CIE 1951 scotopic V′(λ) table (380–780 nm, 5 nm) and use scotopic luminance (1,700 lm/W × ∫B V′ dλ) for the rod-only "grey glow" range in `applyBrightness`.
  - **Golden test:** published S/P ratios: CIE Illuminant A ≈ 1.41, a 6,500 K blackbody ≈ 2.2–2.5 (cite the source used).
  - Re-check the existing tests: 310 K → `#000000` and 798 K achromatic.
- Closes `PLAN.md` open question 4. Physics only, no UI, so it can run alongside anything.
- **Done (2026-10-25).** V′(λ) comes from CIE's official CSV (CIE 018:2019 Table 2, CC BY-SA 4.0), committed in `v2/test/data/` and matched exactly at 5 nm. `scotopicLuminance(T)` and `eyeLuminance(T)` are new in `physics.js`. In "Your eye" mode, brightness follows the eye's luminance: scotopic below `conesStart`, photopic from `fullColor`, mixed in between. Saturation still follows photopic luminance. The S/P golden test uses Crumey (2014, MNRAS 442, 2600, §1.3): 1.408 at 2,850 K (we get 1.4096, ±0.002 allowed), ρ(2850)/ρ(2360) = 1.220, and his Eq. 7 fit within 1 % from 2,500 to 50,000 K (6,500 K: 2.445). His fit is 2.2 % off at 2,000 K, the bottom of its range, so that end isn't tested. The roadmap's ≈2.2–2.5 at 6,500 K holds. One small UI-module change: the verdict and the disc's invisible flag compare the absolute threshold with `eyeLuminance` (`visibilityVerdict` now takes `T`), so they match the disc. Only "Your eye" colors from 631 to 999 K changed (Draper point `#3c3c3c` → `#292929`, threshold ~607 → 652 K), and the 310 K and 798 K tests still pass. FAQ "Why do cold objects go black" and "How do I know the math is right?" mention it. `check:layout` passes; `snapshot:compare` differs only in those colors, the cold end of the slider track and the FAQ text.

## Phase 3: new visuals

### P3.A Compare two temperatures (#9)

- A "Pin" button (D4) pins the current temperature as B. The stage shows A and B discs, the chart draws B as a dashed second curve on a shared axis, and the stats show the ratios: total power (T_A/T_B)⁴, peak shift, and visible share.
- The existing "Compare: show all three" compares models; this compares temperatures. They can't both be on (pinning turns model-compare off, and the other way round). Rename the label to "Compare models" to keep them apart.
- URL: `&vs=9940`.
- **Golden test:** the power ratio uses `radiantExitance`, already tested against σT⁴.

### P3.B HR diagram view (#13)

- Add `luminosity` (L☉) and `radius` (R☉) to star records, each cited (SIMBAD or the primary paper; the same sourcing as `PLAN.md` open question 5).
- A small SVG Hertzsprung–Russell diagram (log T reversed on x, log L on y) with every star as a colored dot, the main sequence as a band, and a cursor line at the current temperature. Tap a dot to load it.
- It goes in the color-map card's switcher (D3).
- **Golden test:** L = 4πR²σT⁴ with IAU 2015 nominal values: R☉ = 6.957 × 10⁸ m and T = 5,772 K give 3.828 × 10²⁶ W (IAU nominal L☉) within 0.1%.
- **Done (2026-10-29).** All 18 star records have `L` and `R` (solar units), cited per star in the comment above `OBJECTS` (Torres 2015, Joyce 2020, Soubiran 2024, Schiller & Przybilla 2008, Monnier 2012, Ribas 2017 and others). The values were read from Wikipedia's infoboxes and the primary papers they cite, not checked against each paper's tables. Fast rotators (Altair, Vega, Zeta Puppis, Alnilam) get the mean of polar and equatorial radii; Bellatrix has no measured radius I could trust, so its R comes from its cited L and T. `physics.js` gained `IAU_SUN` and `sphereLuminosity(R, T)`. `hr-diagram.js` builds the SVG once at init (not prerendered: it starts hidden) in the color map's 320-unit square: log T reversed from 50,000 to 2,600 K, log L from 10⁻³·⁵ to 10⁷ (the top decade is empty so the compact tiers' readout fits there), Pecaut & Mamajek's mean dwarf sequence (Mamajek's table, 2022.04.16) as a ±0.35 dex band, six labelled stars, a dashed cursor at the current T. Render recolors the dots in place (so a focused dot keeps focus), moves the cursor and marks the current star. Dots are `role=button` groups with a 9-unit hit circle; click, Enter or Space loads the star. The readout shows the star's L and R, or "A Sun-sized star: … L☉" from `sphereLuminosity`. The switcher is `state.map` ("cie" / "hr", not in the URL) through the generic `.seg[data-key]` handler. Layout: both headings sit in one grid cell (the hidden one keeps its space), the switcher is a 30 px row above the diagram (desktop svg heights trimmed by 36 px, which mostly comes out of the square's slack), and in the smallest phone `viz` (320×568) it stacks vertically beside the square instead. Golden tests: the IAU identity (within 0.1%), every star's L and R against the cited values, L ≈ R²(T/T☉)⁴ within a factor of 2, and the band holds the class V stars and lies below every giant and supergiant tested. `layout-stability.js` switches to the HR view, sweeps the slider and taps every star against the color map's boxes, and checks panel scroll in both views; snapshot states `hr-view` and `hr-dot` added (222 states). Snapshot against fd65825: canvas, URL, focus and page errors identical in all 210 old states, DOM identical outside the color-map card, and changed pixels only inside it, apart from a few pixels of run-to-run noise at 375×667 (a different set of states each run). Size: main page 35.78 → 37.42 KB gzipped (+1,671 bytes); `/play/` 18.21 → 18.38 KB (+179 bytes, the L and R fields).

### P3.C Daylight on another world (#8)

- "Daylight here": a white sheet of paper, or a simple flat landscape, lit by this star, shown twice: as a camera set to daylight would see it, and as your eye would after adapting (Bradford chromatic adaptation to the star's white).
- It makes the point that under Proxima Centauri, paper would look orange for a few minutes and then white.
- This is also where the white-point setting goes (`PLAN.md` open question 6: D65 vs. Sun-adapted).
- **Golden test:** Bradford matrices and an adaptation example from Lindbloom's published tables (D65 → A).
- Third tab in the switcher from P3.B.

### P3.D Orion in true color (#3)

- A below-the-fold section "Orion, in true color": Betelgeuse, Rigel, Bellatrix, Saiph and the belt (Alnitak, Alnilam, Mintaka) at their real positions, colored with the current model and brightness, sized by apparent magnitude. Tap a star to load it.
- Add the five stars not already in `OBJECTS` as records, each cited.
- Pure SVG, recolored by `render()`. No first-screen impact.
- **Done (2026-10-26).** A card "Orion, in true color" after the objects list: the seven stars at their J2000 positions (SIMBAD), north up and east left, with the figure's lines, each dot's area proportional to its V-band flux, and a short paragraph on why only Betelgeuse looks orange. The five new records: Bellatrix 22,570 K (Gies & Lambert 1992), Saiph 26,700 K, Alnitak 31,000 K, Alnilam 27,100 K and Mintaka 30,300 K (all de Burgos et al. 2024, IACOB X); they also appear in the objects list and the readout takes their names. The map is baked at build time by `orionHtml()` in `v2/src/orion.js` (positions live in `ORION` in `objects.js`, which only the build reads, so esbuild drops them from the script); at runtime `renderOrion()` only recolors the dots and marks the current star, and a tap loads it and scrolls back to the first screen like a card does (`scrollToFirstScreen()` in `dom.js`, now shared). The stars are HTML buttons over an SVG of the lines, so they're focusable and keyboard-usable. Golden tests: positions and V match SIMBAD and temperatures their papers; Betelgeuse is up and left of Rigel, and every map distance is within 0.5% of the great-circle separation; dot areas follow Pogson's 5 magnitudes = 100×. Snapshot states `orion-click` and `orion-focus` added (198 states). Snapshot against `main` (a91020d): canvas, URL, focus and page errors identical in all 186 existing states; screenshots and DOM differ only from the first new star card down (the five new cards, the Orion card, and the "Copy all as CSS variables" toast now counting 34 colors). One exception: at 768×1024 `wide-gamut-compare` differs by at most 2/255 under the translucent docked controls, rendering noise from the taller page. Main page 34.0 → 35.5 KB gzipped: about 1 KB is HTML and CSS (the prerendered map, its styles and the five new cards), 0.4 KB the records and recoloring in the script.

## Phase 4: guided experiences

### P4.A Guided tour (#14)

- "Take the tour" button below the readout (or in the header on phones). About 7 steps, each animating to a temperature with P1.D's `animateTo` and showing a short caption in the verdict area: You (invisible) → Draper point → candle → bulb → the Sun → Rigel → past 30,000 K ("brighter, not bluer") → the CMB.
- Captions sit in a fixed-height overlay, so nothing moves. Esc or any input exits.
- Last, because it showcases features from every earlier wave.

### P4.B Guess-the-temperature game (#2)

- Its own page `/play/` (D8), using the physics and stage modules. Two modes: "Guess the temperature" (show a disc, place it on the slider, score by how far off you are in slider position, not kelvin) and "Which is hotter?" (two discs).
- 10 rounds, with the score kept in `localStorage` (wrapped in try/catch) and a share link for the result.
- Links from the main page header and the FAQ. Its own size budget (~15 KB).
- **Done (2026-10-26).** `/play/` is `v2/pages/play/index.html`, titled "How hot is it?". The rules are in `game.js` (pure, tested in `test/game.test.js`) and the UI in `game-page.js`. It reuses `stage.js` (a new `discPaint`, split out of `discLooks` with identical output), the slider marks, `share.js` and `base.css`. Rounds use real objects (the 24 in `OBJECTS` between 1,000 and 45,000 K) in CIE 1931 at "Your eye" brightness, so every reveal teaches a real temperature. Guess: within 1% of the slider scores 100, a quarter of the slider away scores 0. Hotter: pairs start 0.3–0.6 of the slider apart and close to 0.05–0.1 by round 10, with no ties. The game slider is neutral grey, since a colored track would give the answer away. Best score and games played per mode are kept in `localStorage` (`space-charts:play`). Share sends `/play/?mode=…&score=…`, which opens as a challenge ("To beat 700" plus a line in the first prompt) without adding a row. No new physics. **Size:** 17.7 KB gzipped against a new 20 KB budget. The roadmap's ~15 KB was too low: `base.css` (4.9 KB) and the shared physics and object modules (including the Harre–Heller table that `MODELS` pulls in) make up ~15 KB, and the game's own code is ~2.5 KB. **Main page:** a "Game" header link (below 360 px the header's "Original version" link hides so the two fit; the footer still links v1) and a FAQ entry "Is there a game?" under The basics: 34.0 → 34.2 KB (34.015 → 34.172). Snapshots: all 186 states differ, as expected from the header link. With the link and FAQ entry removed, every DOM matches; canvas, URL and focus are unchanged; outside the header, pixels match above the FAQ except a 2/255 blur difference in two 768×1024 compare states, where the page grew 52 px under the translucent docked controls. `vercel.json` redirects `/play` → `/play/`, same as `/v1` (not yet checked on Vercel). Locally `python3 -m http.server` redirects `/play?mode=guess` → `/play/?mode=guess`. Checked with Playwright at 320×568, 375×667, 768×1024, 667×375, 844×390, 1024×768 and 1440×900: the round (star, slider, result, button) fits on the first screen, nothing moves between prompt, reveal, game end and mode switch, nothing overflows, a full game plays in each mode, and a challenge link opens in its mode.

## Phase 5: distribution

### P5.A Per-star pages and preview images (#18)

- `build.mjs` generates `/stars/<slug>/index.html` for every object, using P0.4's prerender with that object's temperature, a page title like "What color is Betelgeuse?", a description from its note, a canonical URL, and `og:image`.
- `npm run og` (Playwright, run locally per D7) renders a 1200×630 card per object (disc, name, temperature) into `v2/og/`. `build.mjs` copies it into `build/og/`.
- Add `sitemap.xml`. Cards in the objects list link to their page (while still setting the temperature in place on click).
- Verify on a Vercel preview: the `/stars/...` paths, and the preview images in a link unfurler.

### P5.B Embed page (#20)

- `/embed/`: star, readout, slider and chart only, no header, FAQ or objects, with a "Open full page" link. It takes the same URL parameters.
- An "Embed" snippet (iframe code) in the FAQ "Who made this?" answer, or a new FAQ entry for teachers.
- Its own size budget.
- **Done (2026-10-29).** `/embed/` is `v2/pages/embed/index.html` with `src/embed-page.js`, built from the main page's stage, readout, controls and spectrum partials and modules (no header, tabs, color map, stats, objects, FAQ or shortcuts). It reads the same URL parameters; "Open full page ↗" (new tab) links to `/` with the current state and follows the slider, and the class popup's "All classes" link opens the main page's FAQ. The copy and share buttons hide. Two tiers: compact (star beside the readout, then slider, mode buttons and chart; under 380 px tall or 340 px wide the mode buttons and reference marks hide, so the URL sets the modes) and wide (≥ 640×500: star, readout and controls left, chart with its Linear/Log toggle and legend right). With all three models, the compact star column stacks the discs. `npm run check:embed` (`v2/tools/check-embed.mjs`) runs `layout-stability.js` (now tolerant of the main page's blocks being absent) at 300×300, 400×400 and 800×600, checks the JS-off page matches, that every block fits the frame in six URL mode sets × three temperatures with the chart ≥ 100 px tall (110, 122 and 470 px at the three sizes), and the full-page link. Snapshots gained 4 embed states (24 at 6 sizes). `vercel.json` redirects `/embed` → `/embed/` (not checked on Vercel). No new physics. **Size:** 20.6 KB gzipped against a 22 KB budget: as with the game, `base.css` and the physics and object modules are ~15 KB, and the chart adds ~1.5 KB, so 20 was too tight. **Main page:** a FAQ entry "Can I embed this in my own page?" under About, with the iframe snippet (a new `.snippet` style in `base.css`), and a null guard in `readout.js` for pages without the FAQ: 35.79 → 36.19 KB gzipped (+411 bytes). Snapshots: all 210 existing states differ in screenshot and DOM; with the new entry removed every DOM matches, canvas, URL and focus are unchanged, and pixels match above the FAQ except 1/255 antialiasing differences (the header's pill link at 375×667 and 667×375, the docked controls' blur at 768×1024, where the page grew under them).

---

## The 25 features

| # | Feature | Package |
|---|---|---|
| 1 | "Heat it up" play button | P1.D |
| 2 | Guess-the-temperature game | P4.B |
| 3 | Orion in true color | P3.D |
| 4 | Type names into the readout | P1.A |
| 5 | °C and °F input | P1.A |
| 6 | Everyday light sources | P1.B |
| 7 | Cosmic microwave background and recombination | P1.B |
| 8 | Daylight on another world | P3.C |
| 9 | Compare two temperatures | P3.A |
| 10 | UV / visible / IR split | P2.A |
| 11 | Per-frequency chart | P2.A |
| 12 | Absorption lines | P2.A |
| 13 | HR diagram | P3.B |
| 14 | Guided tour | P4.A |
| 15 | Scotopic vision | P2.B |
| 16 | Wide-gamut color | P1.C |
| 17 | Copy color | P1.C |
| 18 | Per-star pages and preview images | P5.A |
| 19 | Share button | P1.C |
| 20 | Embed page | P5.B |
| 21 | Keyboard shortcuts | P1.D |
| 22 | Prerender the first screen | P0.4 |
| 23 | Fail the build over budget | P0.1 |
| 24 | Automated layout check | P0.1 |
| 25 | CIE table vs. official CSV | P0.3 |
