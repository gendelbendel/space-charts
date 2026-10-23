# Blackbody v2 plan

## Status (2026-10-23)

v2 is built and is the default page. v1 is served at `/v1/`. Its only change is a banner link back to v2 that keeps the current `?temp=`.

| URL | What |
|---|---|
| `/` | v2. Layout B was chosen: everything that reacts to the slider shares the first screen |
| `/b`, `/b/` | redirect to `/` (layout A was removed) |
| `/v1/` | the original site, still driven by `?temp=` |

Old links keep working: `/?temp=5000` opens v2 at 5,000 K, and `/v1?temp=5000` opens v1.

Layout tiers (all in `v2/pages/index.html`), each checked for overflow and first-screen fit:

| Tier | Sizes checked | Arrangement |
|---|---|---|
| Phone | 320×568, 375×667, 390×844, 430×932 | Controls docked at the bottom. One visual per tab; tall phones show the chart and color map together (container query) |
| Tablet portrait | 768×1024 | Chart and color map side by side, controls docked |
| Short landscape | 667×375, 844×390, 932×430 | Readout and controls left, tabbed visuals right |
| Desktop | 1024×768, 1280×720, 1440×900, 1920×1080 | Controls left; chart and color map side by side at a shared, height-scaled size; stats and pipelines below |

- Source: `v2/src` (physics, UI, CSS), `v2/src/data` (CIE table, star table, objects), `v2/partials` (shared HTML), `v2/pages` (the two layouts).
- Build: `npm run build` builds v1 into `build/v1` (CRA with `PUBLIC_URL=/v1`), then v2 into `build/`. `npm run build:v2` rebuilds only v2 (about 0.1 s).
- Tests: `npm run test:v2` (15 physics tests, Node's built-in runner).
- Each v2 page is a single self-contained HTML file of about 21 KB gzipped.

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

### 2.1 What it looks like

Under the slider (in the bottom dock on phones, in layout B):

```
Color model   [ Simple (v1) | CIE 1931 (accurate) ]
Brightness    [ Hue only | Your eye | Next to the Sun ]
Compare       [x] Split the star: Simple on the left, CIE on the right
```

I used a segmented control rather than a single checkbox because it names both options, it has room for a third model later, and it tells first-time visitors that there's a choice at all. A checkbox labeled "Use accurate color (CIE 1931)" would also work if you'd rather keep it minimal.

Switching the model changes four things together:

1. **The star**, and the color gradient painted along the slider track.
2. **The chart overlay.** Simple shades its three R/G/B bands, so you can see the gaps it skips. CIE draws the x̄, ȳ, z̄ curves over the spectrum, so you can see what's being weighted.
3. **The "How this color was computed" panel**, which shows each step of the active pipeline with live numbers: band integrals → normalize → bytes for Simple; X, Y, Z → luminance → (x, y) → linear sRGB → gamut map → gamma → hex for CIE.
4. **Compare mode**, which splits the disc in half so the difference is obvious. At 1,200 K, Simple gives `#ff0801` (pure red) and CIE gives `#ff4f00` (red-orange).

The CIE chromaticity diagram, with the spectral locus, sRGB triangle, Planckian locus and current point, is always visible, because it's the clearest answer to "why no green stars?"

### 2.2 How each model works

**Simple (v1, kept as is so it can be compared):**
`R, G, B = ∫ B_λ over 620–680 / 500–550 / 430–480 nm → divide by max → use as sRGB bytes`

**CIE 1931 (accurate):**

1. `X = ∫ B_λ(T) x̄(λ) dλ`, and the same for Y (ȳ) and Z (z̄), over 380–780 nm at 5 nm steps (81 samples).
2. Luminance `L_v = 683 lm/W × Y`, in cd/m². This is what makes brightness handling possible.
3. Chromaticity `x = X/(X+Y+Z)`, `y = Y/(X+Y+Z)`.
4. Linear sRGB = IEC 61966-2-1 matrix × XYZ (D65 white).
5. Gamut mapping. Below about 1,500 K the chromaticity is outside sRGB, so the matrix gives negative channels. Adding equal RGB (white) until the minimum is 0 keeps the hue and slightly desaturates. A better option for v2 is to also emit `color(xyz-d65 X Y Z)` in CSS, so wide-gamut (P3) screens show the deeper red natively. All current browsers support it.
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
| CIE 1931 2° color matching functions (x̄ȳz̄), 380–780 nm at 5 nm | **Yes** | 81 rows, about 2 KB | CIE official dataset, [doi:10.25039/CIE.DS.xvudnb9b](https://doi.org/10.25039/CIE.DS.xvudnb9b). v2 embeds this table (`v2/src/data/cie1931.js`), and it matches the reference locus values above. Before release, diff it against the downloaded official CSV. |
| sRGB matrix and transfer function | **Yes** | 9 numbers | IEC 61966-2-1 |
| CODATA 2018 exact constants (h, c, k_B) plus σ and Wien's b | **Yes** | 5 numbers | NIST CODATA |
| Visual thresholds (absolute threshold, cone onset, full color) | **Yes**, for brightness | 3 numbers | Standard vision-science ranges (photopic / mesopic / scotopic). They're approximate, and the FAQ says so. |
| CIE 1951 scotopic luminosity V′(λ) | Recommended | 81 rows | CIE. Rods barely respond to deep red, so the "grey glow" threshold is more accurate with scotopic luminance than with the photopic Y v2 uses today. |
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
  src/app.js           UI controller shared by both layouts
  src/base.css         shared styles
  src/data/            cie1931.js, harre-heller-2021.js, objects.js
  partials/            shared HTML: controls, stage, chart, FAQ, …
  pages/index.html     the page  -> /
  build.mjs            expands partials, inlines CSS, bundles JS with esbuild
  test/                physics golden tests (node --test)
```

I chose plain JavaScript with esbuild over Vite + TypeScript. The code is small, the only build step is bundling and inlining, and esbuild is the only new dependency. Adding TypeScript later (with JSDoc or `.ts` plus esbuild) is easy if you want it.

### Build and deploy (Vercel)

- `npm run build` = `build:v1` (`PUBLIC_URL=/v1 BUILD_PATH=build/v1 react-scripts build`) then `build:v2` (`node v2/build.mjs`, which clears `build/` except `build/v1`).
- `vercel.json` redirects `/v1` → `/v1/` (so the directory index is served) and `/b` → `/`. Needs checking on a Vercel preview deploy before merging (see open questions).
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
| JS (gzipped) | ≤ 15 KB | 236 KB | ~11 KB inline |
| Total transfer, first load | ≤ 40 KB | ~300 KB + fonts | ~21 KB |
| Requests | ≤ 3 | 10+ | 1 |
| LCP (Moto G4, 4G) | < 1.0 s | — | — |
| Lighthouse performance and accessibility | 100 / 100 | — | — |

Add a `size-limit` (or plain `gzip -c | wc -c`) check plus a Lighthouse CI run on the Vercel preview.

---

## 5. New design

Both layouts are built. Layout A is described below. Layout B arranges the same pieces so the star, chart and controls share one screen: on phones there are tabs for Spectrum, Color map and Numbers and a dock pinned to the bottom; on desktop it uses three columns. In summary:

- **Dark, observatory-style UI.** This is functional, not just aesthetic: a black background is the only honest way to show a star that is black.
- **Hero:** the star on the left, with glow and size that follow luminance. A large temperature readout, spectral-class chip and plain-language verdict on the right.
- **Logarithmic slider (100–100,000 K)**, with the track painted in the actual computed colors, spectral class labels (Y T L M K G F B A O), and clickable reference marks (You, Draper point, Sun, Rigel). There's also a number box for exact values, including ones beyond the slider's range.
- **Stats row:** peak wavelength (Wien), share of output that's visible light, surface luminance and power per m² (Stefan–Boltzmann).
- **Spectrum chart:** log wavelength axis with an adaptive range, so the peak and the visible band are always on screen. A rainbow fill under the visible part, a peak marker, a linear/log toggle for the y-axis, a hover readout, and the model-specific overlay.
- **"How this color was computed"** pipeline card next to the **CIE chromaticity diagram**.
- **Stars and other hot things:** a list of tappable cards that sets the temperature (v1 todo #1) and stacks cleanly on phones, with familiar reference points (you, a candle, a light bulb, the Draper point) as well as stars.
- **Shareable URLs:** `?t=5772&model=simple&light=sun&compare=1`. v1's `?temp=` still works.
- Accessible: native controls, `aria-valuetext="5,772 kelvin"`, visible focus, `prefers-reduced-motion`, works at 375 px with no horizontal scroll.

---

## 6. FAQ

The full copy is in `v2/partials/faq.html`. Answers stay collapsed until tapped, including after a search. It has a search box and five groups:

- **The basics:** What am I looking at? · What is a blackbody, and are stars really one? · Why kelvin, not "degrees Kelvin"? · How do I use it?
- **The color:** Simple vs. CIE · Why do cold objects go black instead of deep red? · Why no green stars? · Why no purple stars? · Why does the color stop changing above ~20,000 K? · Isn't the Sun yellow? · Why do most stars look white at night? · Is the color on my screen exactly right?
- **The chart:** What do the units mean? · Why does the peak move (Wien's law)? · Why a log axis?
- **The math:** Planck's law with exact constants · How the CIE color is calculated · How hot is too hot or too cold? · Where to report a bug
- **About:** Who made this · Why it's so fast

Compared with v1, it drops the "Libraries" and "Todos" entries, fixes "it's" → "its", corrects the claims about cool stars, and answers the questions people actually ask.

---

## 7. Testing

`v2/test/physics.test.ts` with golden values:

- Planckian locus (x, y) at 1,000 K, 2,856 K, 5,000 K and 10,000 K within ±0.0005 (the table above).
- Equal-energy spectrum → (1/3, 1/3).
- Wien peak: 5,772 K → 502.0 nm.
- Stefan–Boltzmann: π ∫ B_λ dλ = σT⁴ within 0.1% (catches unit mistakes).
- Brightness modes: 310 K → `#000000` in "Your eye", 798 K → achromatic (R = G = B).
- Input robustness: `?t=abc`, `?t=0`, `?t=-5` and `?t=1e9` all give a valid, clamped state with no NaN anywhere.
- Simple model: output matches v1's function byte for byte (it's preserved, so it should).

Plus a Playwright smoke test: load `/v2/?t=3600`, move the slider, toggle the model, and check there are no console errors.

---

## 8. Milestones

1. **Freeze v1.** Tag `v1.0.0`. Optionally commit the built output.
2. **Physics core and tests.** Done (`v2/src/physics.js`, 15 tests). Still to do: download the official CIE CSV and diff it against the embedded table, and add the scotopic V′(λ) table.
3. **Static shell.** Done: two layouts, FAQ with MathML, v2 at `/` and v1 at `/v1/`. Still to do: a size budget check in CI.
4. **Interactive layer.** Done, including the three-model Compare view and the real-star model.
5. **Prerender the default state.** Lighthouse CI.
6. **Content pass.** Cite every star temperature, proofread the FAQ, and add a per-temperature OG image (optional).
7. **Launch.** Link v1 → v2 with a small banner. Later, swap so v2 is at `/`.

## 9. Open questions

0. **Vercel routing:** the redirects in `vercel.json` and directory-index serving were tested locally with a static server, not yet on Vercel. Check `/`, `/b`, `/v1`, `/v1/?temp=3600` and `/?temp=3600` on a preview deploy, including that the redirects keep the query string.
1. **"NASA's version":** did you mean a specific page? If not, CIE 1931 plus the real-star model covers it.
2. **White point:** the default is D65, so 6,500 K is white and the Sun looks faintly peach. Some astronomy sites adapt to the Sun so it shows as pure white. That could be a small setting, or just an FAQ entry (v2 has the FAQ entry).
3. **Pollux and Altair temperatures:** sources disagree. Altair isn't even one temperature, because its poles and equator differ by ~1,600 K. Pick a source per star and cite it.
4. **Eventually move v2 to `/`?** The plan assumes yes, with v1 kept at `/v1/`.
