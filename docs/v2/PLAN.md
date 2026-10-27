# Blackbody v2 plan

## Status (2026-10-25)

This section is current. Sections 1–8 below are the original plan from 2026-10-23, updated where the build changed it. Section 9 lists what's still open. New features are planned in `ROADMAP.md`; several of its packages close open questions here (3, 4, 6 and 7).

v2 is built and is the default page. v1 is served at `/v1/`. Its only change is a banner link back to v2 that keeps the current `?temp=`.

| URL | What |
|---|---|
| `/` | v2. Layout B was chosen: everything that reacts to the slider shares the first screen |
| `/b`, `/b/` | redirect to `/` (layout A was removed) |
| `/v1/` | the original site, still driven by `?temp=` |
| `/play/` | the guessing game (ROADMAP P4.B), its own page; `/play` redirects to it, and `?mode=` / `?score=` open a shared result as a challenge |

Old links keep working: `/?temp=5000` opens v2 at 5,000 K, and `/v1?temp=5000` opens v1. Production is https://space-charts.vercel.app. Verified on the live site (2026-10-25): `/v1?temp=3600` → `/v1/?temp=3600`, and `/b?t=4000` and `/b/?t=4000` → `/?t=4000`, all as 307 (temporary) redirects that keep the query string.

**Slider scale (decided, 2026-10-25):** the plain log slider spent a third of the bar below 1,000 K and about a sixth on O stars. Three weighted alternatives were compared on a temporary page, and the owner chose "Balanced": ≤1,000 K gets 8% of the bar, M–A stars 51% and O stars 5%. The knots are in `v2/src/slider-scale.js`, and the reasoning is in `docs/WHY.md`. You type temperatures into the big readout now; there's no separate number box.

Layout tiers (all in `v2/pages/index.html`), each checked for overflow and first-screen fit:

| Tier | Sizes checked | Arrangement |
|---|---|---|
| Phone | 320×568, 375×667, 390×844, 430×932 | Controls docked at the bottom. One visual per tab; tall phones show the chart and color map together (container query) |
| Tablet portrait | 768×1024 | Chart and color map side by side, controls docked |
| Short landscape | 667×375, 844×390, 932×430 | Readout and controls left, tabbed visuals right |
| Desktop | 1024×768, 1280×720, 1440×900, 1920×1080 | Controls left (column grows with the screen); chart and color map side by side at a shared, height-scaled size; stats under the chart; pipelines span the full width below |

- Source: `v2/src` (physics, state, one module per UI part wired by `app.js`, slider scale and marks, CSS), `v2/src/data` (CIE table, star table, objects and classes), `v2/partials` (shared HTML), `v2/pages/index.html` (the page and its layout tiers).
- Build: `npm run build` builds v1 into `build/v1` (CRA with `PUBLIC_URL=/v1`), then v2 into `build/`. `npm run build:v2` rebuilds only v2 (about 0.1 s).
- Tests: `npm run test:v2`: 22 tests (15 physics, 5 slider scale, 2 object data), Node's built-in runner. UI: `npm run check:layout` runs `v2/tools/layout-stability.js` in Playwright at 12 sizes, checking for movement, overlaps and spills across every mode and temperature, plus first-screen fit and desktop column balance.
- The page is a single self-contained HTML file of about 27.5 KB gzipped, with the first screen prerendered for the Sun (`v2/src/prerender.js`). The build fails over 40 KB (owner's decision D1 in `ROADMAP.md`).

---

## 1. What's wrong with v1

Every number below was checked by running the code.

### Math and physics bugs

| # | Problem | Where | Effect |
|---|---|---|---|
| 1 | **Cool temperatures render as saturated red.** Colors are normalized so the brightest channel is always 255, and brightness is never considered. | `normalizeSpectralIntensityRGB` in `src/utils/space-colors.ts` | 240 K shows `rgb(255,0,0)`. A real 240 K object is invisible. This is the main known issue. |
| 2 | **The color model isn't colorimetry.** It uses three fixed bands (R 620–680, G 500–550, B 430–480 nm), ignores the 480–500 and 550–620 nm gaps, and has no eye-response weighting. | same | Cool stars come out too red and hot stars too blue. 3,600 K (Betelgeuse) gives `#ff8f5b` where CIE gives `#ffca91`. 10,000 K gives `#8fc3ff` where CIE gives `#cdd9ff`. |
| 3 | **No gamma correction.** Linear values are written straight into sRGB. | same | Midtones are too dark and too saturated. This was already on the v1 todo list. |
| 4 | **The chart's first point is NaN.** The range starts at 0 nm, and `planck(0)` is ∞/∞. | `BlackbodyRadiation.tsx` `getData` | One broken point on every chart. |
| 5 | **The fixed 0–1,000 nm range** hides the peak below about 2,900 K. | same | At 240 K the chart is a flat line with no peak. At 3,000 K the peak is cut off. |
| 6 | **Bad input becomes NaN.** `?temp=abc` gives `parseInt` NaN, which gets past the clamp because NaN comparisons are false. Clearing the number box sets the temperature to 0 until blur. | `App.tsx`, `InputSlider.tsx` | NaN color and an empty chart. |
| 7 | **Rounded constants** (h = 6.626e-34, c = 2.998e8, k = 1.381e-23). | `src/utils/constants.ts` | Small error (~0.03%), but since 2019 these values are exact, so v2 should use the exact ones. |
| 8 | **Units are per meter of wavelength**, so the y-axis shows values like 2.6e13. | chart | Correct but unfriendly. Per nm is the convention in visualizations. |
| 9 | **The slider stops at 20,000 K and is linear.** O stars reach 30,000–50,000 K, and 230–2,000 K (where everything interesting happens visually) is about 9% of the track. | `constants.ts` | Hard to explore the range that matters. |
| 10 | Chart title says "degrees Kelvin". | chart | The unit is "kelvin", with no "degrees". |

### Data errors in the star table

| Object | v1 | Corrected | Note |
|---|---|---|---|
| WISE 0350−5658 | **1,600 K** | ~325 K | Wrong by about 5×. It's a Y dwarf; published estimates run 310–390 K. |
| WISE 0855−0714 | 240 K | ~285 K | JWST-era estimates are 250–285 K. |
| The Sun | 5,700 K | 5,772 K | IAU 2015 nominal value. |
| Procyon A | 6,580 K | 6,530 K | |
| Pollux | 4,800 K | 4,586 K | Sources vary; needs a citation (see open questions). |

Brown dwarfs aren't stars, so v2 labels them as brown dwarfs.

### Performance

The v1 production bundle is **236 KB of gzipped JS** (781 KB raw), plus 5 KB of CSS and about 60 KaTeX font files. Most of that is MUI, Emotion, Chart.js and KaTeX, all for one slider, one chart and a few equations. Create React App is also deprecated, and `react-scripts` 5 won't keep building forever.

---

## 2. Color model toggle: Simple vs. accurate

### A note on "NASA's version"

As far as I could find, NASA doesn't publish its own star-color algorithm. The accurate, standard method is **CIE 1931 colorimetry**: integrate the Planck spectrum against the CIE color matching functions, then convert to sRGB. Scientific references and careful visualizations use it, including Mitchell Charity's widely cited blackbody color table and the University of Colorado JILA star-color pages. If you had a specific NASA page in mind, send it over and I'll compare.

There's a third tier worth knowing about: real stars aren't perfect blackbodies, and Harre & Heller (2021), "Digital color codes of stars" (*Astronomische Nachrichten*), computed colors from model stellar atmospheres. That could be an optional third model later (see §2.4).

### 2.1 What it looks like (as built)

Three segmented controls and a checkbox, in the bottom dock on phones and in the left column on desktop:

```
Color model   [ Simple | CIE 1931 | Real stars ]
Brightness    [ Hue only | Your eye | vs. Sun ]
Compare       [x] Show all three
```

The first plan was a single checkbox (simple vs. accurate). A segmented control names every option and had room for the third model when it arrived.

Switching the model changes:

1. **The star**, and the color gradient painted along the slider track.
2. **The chart overlay.** Simple shades its three R/G/B bands, so you can see the gaps it skips. CIE draws the x̄, ȳ, z̄ curves. Real stars draws nothing, because its colors come from model spectra, not this curve.
3. **The "How the color was computed" panel**, which shows each step with live numbers.
4. **The color map.** Real stars adds a dashed ring for the model star next to the blackbody point.

**Compare** shows three stars side by side (Simple, CIE 1931, Real stars), all three pipelines, and both overlays. Outside 2,300–55,000 K the Real stars disc shows "no data".

The CIE chromaticity diagram is always visible, because it's the clearest answer to "why no green stars?"

### 2.2 How each model works

**Simple (v1, kept as is so it can be compared):**
`R, G, B = ∫ B_λ over 620–680 / 500–550 / 430–480 nm → divide by max → use as sRGB bytes`

**CIE 1931 (accurate):**

1. `X = ∫ B_λ(T) x̄(λ) dλ`, and the same for Y (ȳ) and Z (z̄), over 380–780 nm at 5 nm steps (81 samples).
2. Luminance `L_v = 683 lm/W × Y`, in cd/m². This is what makes brightness handling possible.
3. Chromaticity `x = X/(X+Y+Z)`, `y = Y/(X+Y+Z)`.
4. Linear sRGB = IEC 61966-2-1 matrix × XYZ (D65 white).
5. Gamut mapping. Below about 1,900 K the chromaticity is outside sRGB, so the matrix gives negative channels. Adding equal RGB (white) until the minimum is 0 keeps the hue and slightly desaturates. Wide-gamut screens get the same mapping done in Display P3 instead (`displayColorP3`, roadmap P1.C), emitted as `color(display-p3 …)`, which keeps the true hue down to about 810 K.
6. Apply brightness (§3), then the sRGB transfer curve, then hex.

**Verified against published reference values.** The 5 nm table reproduces the Planckian locus to four decimal places:

| T | v2 computes (x, y) | Reference | |
|---|---|---|---|
| Equal-energy white | 0.3333, 0.3333 | 0.3333, 0.3333 | ✓ |
| 1,000 K | 0.6527, 0.3445 | 0.6528, 0.3444 | ✓ |
| 2,856 K (CIE Illuminant A) | 0.4475, 0.4074 | 0.4476, 0.4074 | ✓ |
| 5,000 K | 0.3451, 0.3516 | 0.3451, 0.3516 | ✓ |
| 10,000 K | 0.2807, 0.2884 | 0.2807, 0.2884 | ✓ |
| Sun surface luminance | 1.84 × 10⁹ cd/m² | ~1.6 × 10⁹ (real Sun) | ✓ (a blackbody should be a bit higher) |

These become unit tests (§6).

### 2.3 Data needed

| Data | Required? | Size | Source |
|---|---|---|---|
| CIE 1931 2° color matching functions (x̄ȳz̄), 380–780 nm at 5 nm | **Yes** | 81 rows, about 2 KB | CIE official dataset, [doi:10.25039/CIE.DS.xvudnb9b](https://doi.org/10.25039/CIE.DS.xvudnb9b). v2 embeds this table (`v2/src/data/cie1931.js`), and it matches the reference locus values above. Diffed 2026-10-25: it is the official CSV rounded to six decimals. The CSV (CC BY-SA 4.0) is in `v2/test/data/`, and a test checks every row. |
| sRGB matrix and transfer function | **Yes** | 9 numbers | IEC 61966-2-1 |
| CODATA 2018 exact constants (h, c, k_B) plus σ and Wien's b | **Yes** | 5 numbers | NIST CODATA |
| Visual thresholds (absolute threshold, cone onset, full color) | **Yes**, for brightness | 3 numbers | Standard vision-science ranges (photopic / mesopic / scotopic). They're approximate, and the FAQ says so. |
| CIE 1951 scotopic luminosity V′(λ) | **Yes**, for brightness | 81 rows | CIE 018:2019 Table 2, [doi:10.25039/CIE.DS.gr6w4b5g](https://doi.org/10.25039/CIE.DS.gr6w4b5g) (CC BY-SA 4.0), embedded at 5 nm in `v2/src/data/cie1951-scotopic.js` and checked against the official CSV in `v2/test/data/`. Rods barely respond to deep red, so the "grey glow" range uses scotopic luminance (1,700 lm/W × ∫B·V′ dλ). |
| Star catalog with sourced T_eff and spectral types | **Yes** | ~20 rows | SIMBAD and the primary papers. One citation per row. |
| Harre & Heller model-atmosphere colors | Optional (third model) | Table by T_eff and log g | Paper supplement. Check the license before bundling. |
| CIE 1964 10° observer | Optional | 81 rows | Only for matching Charity's table, which uses 10°. |

### 2.4 Third model: real stars (implemented)

The **Real stars** option uses Table 5 of Harre & Heller (2021), "Digital color codes of stars" (*Astronomische Nachrichten*, doi:10.1002/asna.202113868, arXiv:2101.06254). It has 105 solar-metallicity main-sequence stars from M9.5 V (2,300 K) to O1 V (55,000 K), computed from PHOENIX (≤ 15,000 K) and TLUSTY (≥ 16,000 K) model atmospheres. The table is in `v2/src/data/harre-heller-2021.js`, generated directly from the paper's text so nothing was retyped by hand. A test checks every row's hex code against its linear values.

How it works: the page interpolates the table's linear RGB linearly in temperature, then applies the sRGB gamma curve. Outside 2,300–55,000 K the single-model view falls back to CIE 1931 with a note, and Compare shows "no data".

Three caveats, all explained in the FAQ:

1. **The paper skipped the sRGB transfer function.** Its hex codes are just the linear values × 255, which makes them oversaturated. Hollands, Gänsicke, Tremblay & Koester (2026), "Any colour you like: the diverse chromaticities of white dwarfs" (*RAS Techniques and Instruments* 5, rzag069, doi:10.1093/rasti/rzag069, arXiv:2610.18966) point this out. v2 applies gamma, and the pipeline panel shows both versions.
2. **Different color matching functions.** Harre & Heller used the CIE 2006 2° XYZ functions; the blackbody model here uses CIE 1931. Their own blackbody table differs from ours at the same temperature (at 3,000 K, their linear (1, 0.557, 0.202) vs. our (1, 0.477, 0.154)). So part of the Real stars vs. CIE 1931 gap comes from the method, not the star.
3. **The two studies disagree on the size of the effect.** Harre & Heller call the difference from a blackbody "substantial" (for example, M dwarfs look orange). Hollands et al. (2026) say atmospheric opacities cause only "minor deviations" for main-sequence stars.

**Newer research since 2021.** Hollands et al. (2026) is the most relevant follow-up: CIE 1931, D65 sRGB, the proper transfer function, and synthetic and observed white dwarf spectra. Their worked solar example (5,800 K model, display (255, 241, 236)) agrees closely with our CIE 1931 blackbody at 5,772 K, which gives (255, 241, 234). Their data is available on request only, so there's no table to add yet. If they publish a main-sequence grid with the transfer function applied, it would be a natural replacement or fourth model.

**Possible improvement.** Spec2Col.py (Harre & Heller's code) works on any spectrum. Running the PHOENIX grid through CIE 1931 with gamma would give a Real stars table on exactly the same footing as the blackbody model, which removes caveat 2.

---

## 3. Handling extreme temperatures (cold should look black)

The fix is to **separate hue from brightness.** CIE gives an absolute luminance, so the page knows how bright something is, not just its tint. There are three brightness modes:

| Mode | What it shows | 310 K | 798 K | 1,000 K | 3,600 K | 10,000 K |
|---|---|---|---|---|---|---|
| **Your eye** (default) | How it looks to a dark-adapted eye looking at the surface. Below about 10⁻⁶ cd/m² it's black. Between 10⁻⁶ and 0.01 it's a grey rod-only glow. Between 0.01 and 3 it's dim, washed-out color. Above 3 it's full color. | black, "Invisible" | dark grey, "colorless glow" | dull red-orange | full orange | full blue-white |
| **Hue only** | The tint at full brightness, like v1 but correct, with a note when the real thing would look dark | deep red + warning | red + warning | red-orange | orange | blue-white |
| **Next to the Sun** | One exposure for every temperature, with the Sun's surface as the reference. Cool stars fade and hot stars blow out to white. | black | black | black | dim orange (6.7% of the Sun) | overexposed white |

The verdict line under the temperature reads out the physics in plain words ("Invisible. Its light peaks at 9.35 µm, far in the infrared"). The star table and slider track use "Your eye", so the cold end of the slider literally fades to black.

At the hot end: chromaticity converges on about (0.240, 0.235), a pale sky blue. The UI says that past about 30,000 K things get brighter but not bluer, and the FAQ explains why.

---

## 4. Architecture

### Repo layout (as built)

```
src/, public/          v1, unchanged (CRA). Built to build/v1 and served at /v1/.
v2/
  src/physics.js       Planck, CIE pipeline, real-star lookup, brightness, parsing
  src/app.js           wires the UI modules and calls render()
  src/state.js         page state, URL read/write, update()
  src/format.js        pure formatters and the verdict text (Node-importable)
  src/prerender.js     bakes the first screen into the HTML at build time
  src/*.js             one module per UI part: controls, readout, stage, chart,
                       cie-diagram, pipelines, objects-list, faq
  src/slider-scale.js  temperature <-> slider position (weighted piecewise log)
  src/slider-marks.js  class letters and reference marks under the slider
  src/base.css         shared styles (layout tiers live in pages/index.html)
  src/data/            cie1931.js, cie1951-scotopic.js, harre-heller-2021.js (generated), objects.js
  partials/            HTML pieces: controls, stage, readout, chart, FAQ, …
  pages/index.html     the page  -> /
  pages/play/index.html  the guessing game -> /play/ (game.js: rules; game-page.js: UI)
  build.mjs            expands partials, inlines CSS, bundles JS with esbuild
  test/                golden tests: physics, slider scale (node --test)
  tools/               layout-stability.js (browser check), check-layout.mjs (runs it with Playwright),
                       snapshot.mjs (before/after comparison), harness.mjs (shared browser setup)
```

I chose plain JavaScript with esbuild over Vite + TypeScript. The code is small, the only build step is bundling and inlining, and esbuild is the only new dependency. Adding TypeScript later (with JSDoc or `.ts` plus esbuild) is easy if you want it.

### Build and deploy (Vercel)

- `npm run build` = `build:v1` (`PUBLIC_URL=/v1 BUILD_PATH=build/v1 react-scripts build`) then `build:v2` (`node v2/build.mjs`, which clears `build/` except `build/v1`).
- `vercel.json` redirects `/v1` → `/v1/` (so the directory index is served) and `/b` → `/`, keeping the query string (verified on the live site, 2026-10-25). `/play` → `/play/` uses the same kind of redirect (added 2026-10-26, not yet checked on the live site).
- To freeze v1 for good, tag the commit (`v1.0.0`) and optionally commit the built `build/v1` output, so it never has to compile again.

### Why no framework

The interactive part is one slider driving about 400 Planck evaluations and one 81-sample integral, which takes well under 1 ms. React, MUI and Chart.js cost about 230 KB to manage that. Vanilla TS with a ~150-line canvas chart is smaller, and keeping it fast takes no effort. If it ever gets complicated, Preact (4 KB) is the escape hatch.

### Choices that keep it fast

- **Prerender the default state.** At build time, compute the Sun (or the `?t=` default) and bake the color, verdict and stats into the HTML, so the first paint is complete before JS runs.
- **Math as MathML.** It's native in every current browser. That means no KaTeX, no 60 font files and no JS for equations.
- **System font stack**, no web fonts.
- **Inline critical CSS.** One small module script, `type="module"`, deferred.
- **No layout shift.** Chart and star have fixed aspect boxes.
- Vercel Analytics script stays deferred, as in v1.

### Performance budget, enforced in CI

| Metric | Budget | v1 today | v2 today |
|---|---|---|---|
| JS (gzipped) | ≤ 15 KB | 236 KB | ~12 KB inline |
| Total transfer, first load | ≤ 40 KB | ~300 KB + fonts | ~25 KB |
| Requests | ≤ 3 | 10+ | 1 |
| LCP (Moto G4, 4G) | < 1.0 s | — | — |
| Lighthouse performance and accessibility | 100 / 100 | — | — |

`build.mjs` fails the build when a page is over its gzip budget (`BUDGETS_KB`: 40 KB for the main page since 2026-10-25, which replaces the JS-only budget above). Lighthouse CI is still an open item (section 9).

---

## 5. Design (as built)

Two layouts were built for comparison, and the owner chose the compact one (2026-10-24). It's the only layout now. The layout tiers are in the Status table above.

- **Dark, observatory-style UI.** This is functional, not just aesthetic: a black background is the only honest way to show an object that emits no visible light. There's no light theme.
- **Top block:** the star (glow follows luminance), then the temperature. The temperature is also the text box: click it and type. Below it, the verdict line, which leads with the spectral-class badge (tap it for a short explainer), and a one-line mode note.
- **Weighted log slider (100–100,000 K)** that favors 2,400–12,000 K, on its own full-width row. The track is painted in the actual computed colors, with class letters (tap to jump) and reference marks (Sun, You, Draper, Rigel, Betelgeuse, Zeta Puppis). Overlapping labels hide by priority.
- **Stats:** peak wavelength (Wien), share of output that's visible light, surface luminance and power per m² (Stefan–Boltzmann).
- **Spectrum chart:** log wavelength axis with an adaptive range, so the peak and the visible band are always on screen. A rainbow fill under the visible part, a peak marker, a linear/log y-axis toggle, a hover readout, and the model overlay.
- **CIE chromaticity diagram** and the **"How the color was computed"** pipelines.
- **Stars and other hot things:** tappable cards that set the temperature, with familiar reference points (you, a candle, a light bulb, the Draper point) as well as stars.
- **Shareable URLs:** `?t=5772&model=simple&light=sun&compare=1`. v1's `?temp=` still works.
- **Stable layout:** nothing moves, overlaps or changes type size when modes or temperatures change (`docs/WHY.md`).
- Accessible: native controls, `aria-valuetext="5,772 kelvin"`, visible focus, `prefers-reduced-motion`, no horizontal scroll at 320 px.

---

## 6. FAQ

The full copy is in `v2/partials/faq.html`. Answers stay collapsed until tapped, including after a search. It has a search box and five groups:

- **The basics:** What am I looking at? · What is a blackbody, and are stars really one? · What do the letters O, B, A, F, G, K, M, L, T and Y mean? · Why kelvin, not "degrees Kelvin"? · How do I use it?
- **The color models:** Simple vs. CIE 1931 vs. Real stars · Where the Real stars data comes from · Do real stars really look different from blackbodies? · Why cold objects go black instead of deep red · No green stars · No purple stars · Why the color stops changing above ~20,000 K · Isn't the Sun yellow? · Why most stars look white at night · Is the color on my screen exactly right?
- **The chart:** What the units mean · Why the peak moves (Wien's law) · Why a log axis?
- **The math:** Planck's law with exact constants · How the CIE 1931 color is calculated · How do I know the math is right? · How hot is too hot, or too cold? · Where to report a bug
- **About:** Who made this · Why it's so fast

The class list in the "letters" answer is generated from `CLASS_INFO` in `v2/src/data/objects.js`, so edit it there.

Compared with v1, it drops the "Libraries" and "Todos" entries, fixes "it's" → "its", corrects the claims about cool stars, and answers the questions people actually ask.

---

## 7. Testing

`npm run test:v2` runs `v2/test/*.test.js` with Node's built-in runner:

- **`physics.test.js`:**
  - Planckian locus (x, y) at 1,000 K, 2,856 K, 5,000 K and 10,000 K within ±0.0005.
  - Equal-energy spectrum → (1/3, 1/3), and Wien peak at 5,772 K → 502.0 nm.
  - Stefan–Boltzmann: π∫B dλ = σT⁴, and `planck()` never returns NaN.
  - Cold objects: 310 K → `#000000` and 798 K achromatic in "Your eye".
  - The hot limit is ≈ (0.240, 0.235).
  - The Simple model matches v1's output byte for byte.
  - Real-star table: every row's hex matches its linear values; interpolation; gamma; fallback outside 2,300–55,000 K.
  - `parseTemperature` rejects junk, and every display color is valid hex across 1 K–1,000,000 K.
- **`slider-scale.test.js`:** the mapping spans the bar, never runs backwards, and round-trips. ≤1,000 K gets at most 10% of the bar, O stars at most 6%, and M–A stars at least 45%.
- **UI:** `v2/tools/layout-stability.js`, run in the browser at several sizes. It checks for movement, overlap and containment across every model, brightness mode and slider position, plus a typed 1,000,000 K.

`npm run check:layout` runs it automatically with Playwright (a dev dependency) at 12 sizes, and adds first-screen fit and desktop column balance. It runs locally; there's no CI service yet.

---

## 8. Milestones

1. **Freeze v1.** Done in practice: only the link back to v2 changed. Not yet tagged (`v1.0.0`).
2. **Physics core and tests.** Done.
3. **Static shell.** Done: one page, FAQ with MathML, v2 at `/` and v1 at `/v1/`.
4. **Interactive layer.** Done: three color models, Compare, weighted slider, editable readout, class info.
5. **Prerender the default state, and Lighthouse CI.** Prerender done (2026-10-25, roadmap P0.4). Lighthouse CI not started.
6. **Content pass.** Partly done: star temperatures corrected and cited in notes; FAQ rewritten. Per-temperature OG image not started.
7. **Launch.** Done (2026-10-24): v2 at `/`, v1 at `/v1/` with a banner back.

## 9. Open questions

1. ~~**Vercel routing**~~ Resolved 2026-10-25. Verified on the live site (2026-10-25): `/v1?temp=3600` → `/v1/?temp=3600`, and `/b?t=4000` and `/b/?t=4000` → `/?t=4000`, all as 307 (temporary) redirects that keep the query string.
2. **Real devices and Safari:** everything was checked in Chrome at emulated sizes. Safari sizes form controls differently. The readout's text box overlap (fixed 2026-10-25) is the kind of bug that shows up there first. A cheap first look: `npx playwright install webkit`, then `node v2/tools/check-layout.mjs --browser webkit` (not tried yet).
3. ~~**CIE table**~~ Resolved 2026-10-25 (roadmap P0.3). Every entry of `v2/src/data/cie1931.js` is CIE's official value (doi:10.25039/CIE.DS.xvudnb9b) rounded to six decimals; the largest gap is 4.9 × 10⁻⁷ (x̄ at 780 nm). The CSV is CC BY-SA 4.0, so it's committed unmodified with its metadata in `v2/test/data/`, and `physics.test.js` compares every 5 nm row with it.
4. ~~**Scotopic vision**~~ Resolved 2026-10-25 (roadmap P2.B). "Your eye" brightness now follows `eyeLuminance(T)`: scotopic (CIE 1951 V′) luminance in the rod-only range, photopic once the cones fully respond, mixed in between. The absolute threshold is compared with it too. Checked against Crumey's (2014) published S/P ratios. See `docs/WHY.md#cold-objects-render-black-not-red`.
5. **Star temperatures:** Pollux and Altair sources disagree (Altair's poles and equator differ by ~1,600 K). Pick and cite a source per star.
6. **White point:** D65, so 6,500 K is white and the Sun is faintly peach. A Sun-adapted option could be a setting; for now it's an FAQ entry.
7. **Performance guardrails:** the size check is done (2026-10-25). Lighthouse CI on Vercel previews is still open.
8. **Tag v1:** `git tag v1.0.0` on the last commit before v2, if the owner wants it.
9. **"NASA's version":** the owner mentioned it on 2026-10-22. No NASA-specific method was found; CIE 1931 plus the Real stars model covers it unless the owner had a specific page in mind.
10. **Legend clipped on small phones:** at 375×667 the chart legend gets about 6 px of height and is cut off, with or without JS (found 2026-10-25, predates the prerender). Planned for roadmap P2.A, which reworks the chart.
