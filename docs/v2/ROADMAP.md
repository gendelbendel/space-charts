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
| P1.A Readout takes names and units | #4, #5 | P0.2 | not started | est. +0.5 |
| P1.B Everyday and cosmic objects | #6, #7 | P0.2 | not started | est. +1 |
| P1.C Color output: P3, copy, share | #16, #17, #19 | P0.2 | not started | est. +1 |
| P1.D Heat it up, keyboard shortcuts | #1, #21 | P0.2 | not started | est. +1 |
| P2.A Chart: per-frequency, lines, energy split | #10, #11, #12 | P0.2 | not started | est. +2 |
| P2.B Scotopic vision | #15 | — | done 2026-10-25 | +0.6 |
| P3.A Compare two temperatures | #9 | P2.A | not started | est. +2 |
| P3.B HR diagram view | #13 | P1.B | not started | est. +2 |
| P3.C Daylight on another world | #8 | P3.B | not started | est. +2 |
| P3.D Orion in true color | #3 | P0.2 | not started | est. +1.5 |
| P4.A Guided tour | #14 | P1.B, P1.D | not started | est. +2 |
| P4.B Guess-the-temperature game | #2 | P0.2 | not started | own page |
| P5.A Per-star pages and preview images | #18 | P0.4, P1.B | not started | own pages |
| P5.B Embed page | #20 | P0.4 | not started | own page |

Feature numbers match the brainstorm list (reproduced at the end). The main page is 27.5 KB gzipped after Phase 0 (budget 40 KB, see D1); the remaining estimates add up to about 40 KB.

### Next up (updated 2026-10-25)

Phase 0 is done. P0.1, P0.2 and P0.4 are deployed; P0.3 (tests only, no page change) and P2.B (scotopic vision) are on `main`, not yet pushed.

- **Ready now, can run in parallel:** wave 2: P1.A, P1.B, P1.C, P1.D, P3.D, P4.B. P1.C and P1.D need D4 answered first (where the new controls go).
- **Starting a package:** run `npm install`, then `npm run snapshot:save` on the starting commit if the package should leave existing states looking the same. Baselines are local (`v2/.snapshots/`, gitignored), so every session saves its own. Finish with `npm run test:v2`, `npm run check:layout` and, where relevant, `npm run snapshot:compare`; add a snapshot state for any new control.
- **Known issue to fold into the next package that touches the chart (P2.A):** at 375×667 the chart legend gets only about 6 px of height and is clipped, with or without JS. It predates Phase 0.

## Decisions for the owner

Each has a recommendation; packages that need the answer say so. Record answers here.

**Answered (2026-10-25):** D1 and D2, as recommended: a 40 KB gzip budget for the main page, and Playwright as a dev dependency.

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

### P1.B Everyday and cosmic objects (#6, #7)

- New objects, each with a cited temperature in its `source`: warm-white LED (2,700 K), neutral (4,000 K), daylight (6,500 K, the D65 white point, which is worth a note), stove element, lava (basaltic, ~1,400 K), molten steel, a welding arc, lightning (~30,000 K), and the cosmic microwave background (2.72548 K, Fixsen 2009).
- A "When the universe turned transparent" card: about 3,000 K at recombination, 380,000 years after the Big Bang. The CMB today is that light, stretched by a factor of about 1,100.
- Group the list by `category` (Stars · Brown dwarfs · Everyday light · Cosmic), with headings. It's below the fold, so there's no first-screen risk.
- FAQ: "Why is a 2,700 K bulb called *warm* when it's colder?" and "What is the cosmic microwave background?"
- Note: the CMB is below the slider's 100 K floor, so the thumb pins at the left end. Check that the marks and track handle it.

### P1.C Color output: wide gamut, copy, share (#16, #17, #19)

- **P3 / wide gamut:** add `linearSrgb → display-p3` (or emit `color(xyz-d65 X Y Z)` directly, per `PLAN.md` §2.2 step 5) for the disc, the chips and the slider track when `matchMedia("(color-gamut: p3)")` matches. The sRGB gamut mapping stays as the fallback.
  - **Golden test:** the published XYZ→Display P3 matrix (SMPTE EG 432-1 primaries, D65): P3 red (1, 0, 0) → xy (0.680, 0.320), and D65 white → (1, 1, 1).
  - FAQ "Is the color on my screen exactly right?" gains a line about wide-gamut screens.
- **Copy color:** a small button copies the current hex. A long-press or menu offers `rgb()` and CSS `color(xyz-d65 …)`. Add a "Copy all as CSS variables" link at the bottom of the objects list.
- **Share:** `navigator.share` where it exists, otherwise copy the URL, with a short "Link copied" toast that doesn't move the layout.
- Placement per D4: icon buttons in the readout row, at every tier.

### P1.D Heat it up, keyboard shortcuts (#1, #21)

- **Play:** a button at the slider's left end sweeps from 300 K to 40,000 K in about 12 s, at constant speed in slider position (so it uses the weighted scale and lingers where color changes). Any slider, readout or card input stops it. With `prefers-reduced-motion`, it steps through about 8 stops with a pause at each instead of animating.
- Check `render()` holds 60 fps while playing. It currently rebuilds the pipelines and objects HTML on every call; skip those while playing if needed, and render them once at the end.
- The animation helper (`animateTo(T, ms)`) goes in its own module, because P4.A reuses it.
- **Shortcuts:** ←/→ step by class, Shift+←/→ fine-step, letters O–Y jump to a class, S = Sun, M / B cycle color model and brightness, C = compare, P = play, `?` opens a small shortcut list. Ignore them while focus is in a text field.

## Phase 2: chart and physics depth

### P2.A Chart: per-frequency axis, absorption lines, energy split (#10, #11, #12)

All three edit `chart.js` and the stats, so they're one package.

- **Per-frequency toggle (#11):** plot B_ν against frequency (or against wavelength with the per-Hz density) and move the peak marker to Wien's frequency law. Explain in the FAQ why the peak moves: the Sun peaks near 502 nm per nm but near 880 nm per Hz.
  - **Golden tests:** ν_peak = 5.879 × 10¹⁰ Hz/K × T (CODATA); ∫B_ν dν = σT⁴/π.
- **Absorption lines (#12):** labeled ticks for the strongest lines per class. Balmer (Hα 656.3, Hβ 486.1, Hγ 434.0 nm) is strongest in A stars; Ca II H & K (396.8, 393.4) and Na D (589.0/589.6) in G and K; TiO bands in M. Wavelengths come from NIST ASD. They're labeled as illustrative (the chart is still a blackbody). Show them by default only when the "Real stars" model is on, or behind a legend toggle.
- **Energy split (#10):** the "Visible light" stat becomes a UV / visible / IR bar with percentages.
  - **Golden test:** the published blackbody fraction F(0→λT): λT = 2,897.77 µm·K gives 0.2501, and λT = 5,000 µm·K gives 0.6337 (standard radiation tables).
- `check:layout` at every tier: the chart header gains a toggle, and the stats row must not change height.

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

## Phase 4: guided experiences

### P4.A Guided tour (#14)

- "Take the tour" button below the readout (or in the header on phones). About 7 steps, each animating to a temperature with P1.D's `animateTo` and showing a short caption in the verdict area: You (invisible) → Draper point → candle → bulb → the Sun → Rigel → past 30,000 K ("brighter, not bluer") → the CMB.
- Captions sit in a fixed-height overlay, so nothing moves. Esc or any input exits.
- Last, because it showcases features from every earlier wave.

### P4.B Guess-the-temperature game (#2)

- Its own page `/play/` (D8), using the physics and stage modules. Two modes: "Guess the temperature" (show a disc, place it on the slider, score by how far off you are in slider position, not kelvin) and "Which is hotter?" (two discs).
- 10 rounds, with the score kept in `localStorage` (wrapped in try/catch) and a share link for the result.
- Links from the main page header and the FAQ. Its own size budget (~15 KB).

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
