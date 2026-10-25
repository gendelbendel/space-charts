# WHY.md — rationale for non-obvious rules

Not loaded automatically — Claude Code only pulls this in when it actually reads the file (a normal Read, triggered by a pointer in `CLAUDE.md`/`.claude/rules/*.md`, or by Claude's own judgment that a rule is worth double-checking before relitigating it). Keep it that way: **never `@`-import this file** — `@import` loads at launch regardless of relevance (confirmed: https://code.claude.com/docs/en/memory — "imported files load at launch"), which defeats the entire point of splitting rationale out of `CLAUDE.md` in the first place.

## How to use this file

One `##` heading per non-obvious rule, matched by a `(Why: WHY.md#anchor-slug)` pointer wherever that rule is stated tersely in `CLAUDE.md` or a `.claude/rules/*.md` file. The anchor is GitHub's auto-generated heading slug: lowercase, spaces become hyphens, everything that isn't a letter/digit/hyphen/space is just deleted (not replaced with a space) — so a heading like `` `.foo/bar` and the baz fix `` slugs to `foobar-and-the-baz-fix`, not `foo-bar-and-the-baz-fix`. **Avoid backticks, slashes, and dots in headings you plan to anchor-link to** — plain words keep the slug predictable. Verify a new anchor actually resolves before shipping it (grep the computed slug against the heading, or just open the rendered file and click the link).

Each entry: what broke (or what was confirmed the hard way), how it was found, the fix, and why an alternative was rejected if one was tried first. Write it as an incident report, not a lecture — that's what makes a rule survive being questioned six months later instead of getting silently relitigated.

Not every entry is an incident. A product or design call the owner made ("timers keep an end time", "this feature is behind a flag") belongs here too, and is often the entry most likely to be relitigated. Attribute it: the owner, the date, and their words where they were specific (`(owner, 2026-10-09: "they close the tab and the timer is gone")`). That's what stops a later session from "improving" it back. Then say what it rules out and why.

## v1 is preserved as it stands

The 2023 Create React App site stays exactly as it was, served at `/v1/` (owner, 2026-10-22: "I want to preserve this project as it stands here, but I want to improve upon it as a /v2"). It has known bugs (cold temperatures render saturated red, no gamma, a NaN first chart point, a wrong star temperature), and they are deliberately left in place: v1 is the record of the original project, and v2 is where fixes go.

On 2026-10-24 the owner made v2 the default and asked for v1 to "link back to new v2, otherwise keep it unchanged". So the banner in `src/App.tsx` is the only allowed change. It carries the current `?temp=` across, because v2 understands that parameter. v1 builds with `PUBLIC_URL=/v1 BUILD_PATH=build/v1` rather than moving its source, so its GitHub links to `src/utils/math.ts` keep working.

## v2 has no framework and ships one file per page

The owner asked for v2 to "continue to load blisteringly fast" (2026-10-22). v1 shipped 236 KB of gzipped JavaScript plus about 60 KaTeX font files for one slider, one chart and a few equations: React, MUI, Emotion, Chart.js and KaTeX. v2 needs one slider driving about 400 Planck evaluations and an 81-sample integral, which takes well under a millisecond, so a framework buys nothing.

So v2 is plain JavaScript with a hand-drawn canvas chart, an SVG color map and native MathML. `build.mjs` inlines the CSS, partials and the esbuild bundle, so each page is one request (main page ~25 KB gzipped). Vite + TypeScript was the first plan and was dropped as more tooling than the code needed. Preact (~4 KB) is the escape hatch if the UI ever gets complicated.

## The math is checked against published values

The owner asked to "ensure that the math is correct" (2026-10-22). Tests compare against published numbers, never against the code's own earlier output, because a regression test against your own output just locks in whatever bug was there. The golden values:

- Planckian-locus chromaticities at 1,000 K, 2,856 K (CIE Illuminant A), 5,000 K and 10,000 K, matched to ±0.0005.
- An equal-energy spectrum maps to (1/3, 1/3), which checks the color-matching table's balance.
- π∫B dλ equals σT⁴ (Stefan–Boltzmann), which catches nm/m unit slips anywhere in `planck()`.
- Every row of the real-star table reproduces the paper's own hex code.

The CIE 1931 table in `v2/src/data/cie1931.js` was typed in from memory and then verified against the locus values above, which it matches to four decimals. It hasn't been diffed against CIE's official CSV (doi:10.25039/CIE.DS.xvudnb9b) yet; that's an open item in `docs/v2/PLAN.md`.

## Cold objects render black not red

v1 normalized every color to full brightness, so a 240 K object showed as `rgb(255,0,0)` (owner, 2026-10-22: "low temps just being red doesn't make sense; and they would likely simply just be invisible/black to our eyes"). v2 separates hue from brightness. The CIE pipeline gives absolute luminance (683 lm/W × Y, in cd/m²). The default "Your eye" mode maps it to visibility thresholds for a dark-adapted eye: black below about 10⁻⁶ cd/m², a colorless rod-only grey below 0.01, washed-out color below 3, and full color above that. That puts the Draper point (~798 K) at a faint grey, which matches the historical observation.

"Hue only" still exists for people who want the tint, and it shows a note when the real thing would look dark. The thresholds are approximate. The rod regime would be more accurate with the CIE 1951 scotopic curve; that's an open item.

## Real star colors get the gamma step

The "Real stars" model uses Table 5 of Harre & Heller (2021, *Astronomische Nachrichten*, arXiv:2101.06254). Their hex codes are the linear RGB values × 255, with no sRGB transfer function, which makes them oversaturated. Hollands, Gänsicke, Tremblay & Koester (2026, *RAS Techniques and Instruments*, doi:10.1093/rasti/rzag069) point this out. v2 takes the paper's linear columns and applies the transfer function. The pipeline panel shows both versions, so the correction is visible rather than silent.

Harre & Heller also used the CIE 2006 color-matching functions, while v2's blackbody model uses CIE 1931. Their own blackbody table differs from ours at the same temperature: at 3,000 K, their linear (1, 0.557, 0.202) against our (1, 0.477, 0.154). So part of the difference between "Real stars" and "CIE 1931" is the method, not the star. The FAQ says so. Don't "fix" this by mixing their values into the CIE 1931 pipeline.

The data file is generated from the paper's text by a script: 105 rows, checked by a test. Don't retype it.

## Nothing moves when modes change

**What broke** (owner, 2026-10-25: "clicking certain buttons like real stars and vs sun and hue causes shifting"): switching to Hue only, vs. Sun or Real stars added a note line under the verdict (+22 px). On desktop, the Real stars legend item wrapped to a second line (+24 px).

**Root cause**: measured by recording every block's top and height before and after each click. Sweeping the slider in every mode found three more: the phone temperature row wrapped at 100,000 K (+30 px), stat values like "1.84×10⁹ cd/m²" sometimes took two lines, and the color-map coordinates grew a third line on narrow cards.

**Fix**: the note line is always present (every mode has a one-line note, `nowrap` with ellipsis); the legend never wraps; the temperature row has a fixed height, with smaller type for long numbers; stat values and map coordinates reserve their second line; the verdict reserves three lines on phones.

**Why not reserve space only in modes that need it**: that was the first version (a `note-slot` class). It moved the layout at the moment you switched modes, which was exactly the complaint.

A follow-up fix shrank the temperature's type for long numbers so the row couldn't wrap. That read as the text jumping between three sizes at 10,000 K and 100,000 K (owner, 2026-10-25: "There are three sizes for the text and it causes shifting"), and the class badge slid sideways each time. The measurement had only checked heights, so it missed both. Now the readout has one type size per layout tier, sized to fit 1,000,000 K. The class badge leads the verdict line instead of sitting beside the number. The check also records left edges and the readout's computed type size. **Never scale type by content length.**

That fix fixed the readout row at 40 px. The text box inside it renders about 1.2× its type size, because browsers size inputs from the font's natural height and ignore line-height, so it spilled 7 px into the verdict line (owner, 2026-10-25: "Top text regressed, it overlaps"). It barely touched in Chrome, overlapped in Safari, and the movement check couldn't see it, since nothing moved. Now `.temp-big` and the input have an explicit `1.15em` height, tied to their own type size rather than a pixel row height. The check also tests that blocks don't overlap and that children stay inside their parents. Run against the old build, it flags the spill in all 198 states.

`v2/tools/layout-stability.js` repeats the measurement across every model, brightness mode and slider position, and `npm run check:layout` runs it at 12 sizes. Its first run at every size found a quarter-pixel shift at 667×375 that the by-hand checks had missed: the class chip was a fraction taller than a 13 px line, so a three-line verdict outgrew its reserved height.

## Everything the slider changes stays on one screen

On phones the original layout put the slider far from the chart (owner, 2026-10-24: "the user has to slide the slider, then scroll down to see how the chart changes. Same with color map being so far down"). Two layouts were built for comparison, and the owner picked the compact one ("Overall, I like /b route more"). It became the only layout; `/b` redirects to `/`.

So, at every size, the star, readout, chart, color map and controls share the first screen:

- **Phones:** controls docked at the bottom; visuals in tabs, or stacked when a container query says there's room.
- **Landscape phones:** two columns.
- **Desktop:** controls left, with the chart and color map side by side at a height that scales with the window.

The owner also asked for the spectrum to take less room and for the color map to fit better; the shared `--viz-h` height is that balance. On desktop, the star and chart heights scale together so the two columns end within a few pixels of each other. That was a fix for empty space left under the Compare checkbox (owner, 2026-10-24).

## Slider marks follow the thumb

**What broke** (owner, 2026-10-24: "Links like the sun don't match where they fit on the slider. The classes don't match either"): marks were positioned as a percentage of the whole slider row, which also contains the number box, and a range thumb's center never reaches the input's edges.

**Fix**: everything drawn along a slider uses `alongSlider(f)` = `14px + (100% − 28px) × f` (thumb inset: 13 px radius + 1 px border), and the scale's own `toFraction`. Labels are laid out in pixels with collision avoidance. The current class and the Sun win; lower-priority labels hide rather than overlap.

## The slider favors the temperatures where color changes

The slider started as a plain log scale from 100 K to 100,000 K. That gave a third of the bar to 1,000 K and below, where everything is black, and about a sixth to O stars (owner, 2026-10-25: "The slider for the 1000 K and under takes up a large chunk of the slider bar, which is all relatively useless and makes it so other classifications get hidden… Same with the top end, a good 10-15% of the bar is dedicated to O but not many stars even fit that classification"). The owner asked for three candidates to try. A temporary comparison page put them side by side, with the plain log scale as a reference:

| Scale | ≤1,000 K | M–A stars | O stars |
|---|---|---|---|
| Plain log | 33% | 21% | 17% |
| A, Gentle | 15% | 31% | 10% |
| B, Balanced | 8% | 51% | 5% |
| C, Star-focused | 4% | 72% | 4% |

The owner chose B (2026-10-25: "Go with scale B (Balanced) as the default"). Its knots are in `v2/src/slider-scale.js`: piecewise linear in log T, with most of the bar for 2,400–12,000 K. C was rejected as too extreme: it leaves almost no room for brown dwarfs, the Draper point or the cold end, where the "objects go black" behavior lives. A test pins the shares (≤1,000 K at most 10%, O at most 6%, M–A at least 45%), so a future tweak can't drift back toward plain log without noticing. The comparison page was deleted once the choice was made.

## The first screen is prerendered from the same builders

The roadmap's P0.4 (2026-10-25): the page should be complete before its script runs, and without it. `build.mjs` fills `{{name}}` slots in the partials with values from `v2/src/prerender.js`, which sets the shared `state` to the Sun and calls the same string builders the page uses (`discLooks`, `pipelinesHtml`, `objectsHtml`, `legendHtml`, `statsText`, …). A second, build-only copy of the markup was rejected: it would drift from what the script renders, and every drift is a jump when the script runs.

**Modules imported by the build must not touch the page when they load.** Listeners and element lookups go in an `init…()` function called from `app.js` (`initChart`, `initObjectsList`, `initFaq`), or happen lazily on the first render (the star's discs). `state.js` reads `location` only when it exists.

**What is baked, and what isn't.** The readout, class chip, verdict, star, hex, mode note, slider track and position, legend, stats, pipelines, objects list and FAQ class list are baked. The chart (a canvas) and the color map are not: the color map's SVG is 1.4 KB gzipped of pure graphics with no text worth having without JS, and both boxes are sized by CSS, so nothing moves when they draw. The slider's class letters and marks aren't baked either: their collision-hiding needs real text widths, and their row has a fixed height. The modes are always the defaults, so `aria-pressed`, `aria-selected` and the active panel are written statically in the partials. The prerender adds about 2.2 KB gzipped.

**`?t=` links start from the Sun.** The baked page is the Sun, and the first render switches to the URL's temperature. Measured in Chromium (2026-10-25), the inline script renders 20–30 ms before the first paint, so the Sun never shows. On a slow connection the browser could paint the top of the page before the script at the end arrives, so a brief Sun is possible there. Accepted rather than hiding the readout until the script runs, which would make every slow load worse to fix a rare one.

**What the hydration check found.** `npm run check:layout` loads each size with JavaScript off and on and fails if a block moves by more than 1 px (the script rounds the readout's width up to a whole pixel, which CSS can't match). Its first run found two things:

- The legend was filled by the chart code, so it was empty until the script ran and then pushed the chart down. It's baked now.
- At 768×1024 the chart's height depended on load history. The canvas was in the flow with `height: 100%` inside an auto-height box, and the script copies its laid-out height into its pixel height, which became its intrinsic height, which held the card at whatever height it first got (315 px when the legend was still empty, 297 px with it; a resize didn't settle it either). The canvas is now absolutely positioned inside its box, so the box's size comes from CSS alone. This is the one visible change from P0.4: at tablet size the chart and color map cards are 18 px shorter.

Before the script runs, the readout's text box gets its width from `field-sizing: content` plus 2 px for the caret (only while it has no inline style), so the "K" doesn't jump. Browsers without `field-sizing` show a wider box until the script runs.
