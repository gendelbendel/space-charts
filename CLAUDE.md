# CLAUDE.md

Instructions for Claude Code working in this repository. Read this first, every session.

Path-scoped detail lives in `.claude/rules/` (`physics.md`, `ui.md`, `deployment.md`, `v1.md`) and loads automatically when you touch matching files — you don't need to open these yourself. The rationale behind any non-obvious rule below is in `docs/WHY.md` (not auto-loaded — read it if about to second-guess or relitigate something). Cross-project conventions are in `docs/PARITY.md` (also not auto-loaded).

## What this project is

"What color is a star?": an interactive blackbody-radiation page. Pick a temperature and it shows the Planck spectrum, the color and brightness a human eye would actually see, where that color sits on the CIE 1931 chromaticity diagram, and the math behind it, with a reference list of stars and an FAQ. A hobby/education site by the owner (David). v2 is a ground-up rewrite at `/`. The original 2023 Create React App version is kept, untouched, at `/v1/`.

## The living context doc

`docs/v2/PLAN.md` holds the v2 plan: the audit of v1's bugs, the color models and their data sources, verified reference values, architecture, size budget and open questions. It's the source of truth for those decisions. This file is a summary and defers to it on conflict. Update its "Status" section when routes, layout tiers or open questions change.

`docs/v2/ROADMAP.md` is the build plan for the next 25 features, split into work packages a session can start from ("build package P1.A"). Tick its status table when a package lands, and record the owner's answers to its decisions there.

## Repo layout

```
src/, public/            v1 (CRA + React + MUI + Chart.js). Frozen. Built to build/v1.
v2/
  pages/index.html       the v2 page, served at /
  pages/play/index.html  the guess-the-temperature game, served at /play/ (src/game.js rules, src/game-page.js UI)
  pages/embed/index.html the iframe embed, served at /embed/: star, readout, slider and chart (src/embed-page.js)
  partials/*.html        shared HTML pieces, expanded at build (<!-- include: name -->)
  src/physics.js         Planck, CIE 1931 pipeline, real-star lookup, brightness model, input parsing
  src/prerender.js       bakes the first screen into the HTML at build time, from the same builders
  src/app.js             wires the UI modules: state.js (state, URL) -> render() -> controls, readout,
                         stage, chart, cie-diagram, hr-diagram, pipelines, objects-list, orion, faq, share (copy, share, toast),
                         play (Play button) and keys (shortcuts, `?` list); animate.js moves T by code; format.js is pure
  src/slider-scale.js    temperature <-> slider position (piecewise log, weighted toward 2,400–12,000 K)
  src/slider-marks.js    class letters and reference marks under a slider, collision-aware
  src/data/              cie1931.js, cie1951-scotopic.js, harre-heller-2021.js (generated), objects.js (stars, classes, marks)
  src/base.css           shared tokens and components; layout tiers live in pages/index.html
  build.mjs              builds each page into one self-contained HTML file in build/
  test/                  node --test golden tests (physics, slider scales), game rules
  tools/layout-stability.js  browser check: nothing moves, overlaps or spills when modes change
  tools/check-layout.mjs     runs that check with Playwright at every tier's sizes (npm run check:layout)
  tools/check-embed.mjs      the same for /embed/ at 300×300, 400×400 and 800×600 (npm run check:embed)
  tools/snapshot.mjs         before/after comparison of 210 page states (npm run snapshot:save / snapshot:compare)
vercel.json              redirects /v1 -> /v1/, /play -> /play/, /embed -> /embed/ and /b -> /
```

## Tech stack

v2: plain JavaScript (ES modules), no framework, no runtime dependencies, no web fonts. esbuild bundles and inlines each page's script; CSS and partials are inlined by `v2/build.mjs`. Math renders as native MathML. Tests use Node's built-in runner. v1: CRA 5, React 18, MUI, Chart.js, KaTeX, TypeScript. Package manager: npm (lockfile at root). Node 24 (`engines`). Hosting: Vercel, deploying from `main`. No database, no auth, no server code.

## Core rules

1. **Never change v1's behavior.** Its only allowed edit is the banner linking back to v2. Don't upgrade, restyle or fix it. (Why: `docs/WHY.md#v1-is-preserved-as-it-stands`)
2. **v2 stays framework-free and ships each page as one file.** No runtime dependencies, no fonts, no chart library. `build.mjs` fails a page over its gzip budget (`BUDGETS_KB`; the main page is ~25 KB of a 40 KB budget). (Why: `docs/WHY.md#v2-has-no-framework-and-ships-one-file-per-page`)
3. **Physics changes need a golden test.** Compare against a published value, never against the code's own output. `npm run test:v2` must stay green. (Why: `docs/WHY.md#the-math-is-checked-against-published-values`)
4. **Cold objects render black or grey, never saturated red**, in the default "Your eye" mode. Brightness comes from real luminance. (Why: `docs/WHY.md#cold-objects-render-black-not-red`)
5. **Switching modes or dragging the slider must not move the layout.** Anything whose text changes gets a fixed or reserved height, and type never changes size with content length. Run `npm run check:layout` after UI changes. (Why: `docs/WHY.md#nothing-moves-when-modes-change`)
6. **The star, readout, chart, color map and controls share the first screen** at every size, so the effect of the slider is visible without scrolling. (Why: `docs/WHY.md#everything-the-slider-changes-stays-on-one-screen`)
7. **Never hand-edit generated files**: `v2/src/data/harre-heller-2021.js` (from the paper's text) and anything in `build/`.
8. **Commit and push only when the owner asks.** In this project the owner asks for commits straight on `main` and for pushes. Pushing `main` deploys to production, so never push unasked.
9. **Root-level markdown stays minimal**: only `README.md` and `CLAUDE.md` live at repo root — every other doc (`docs/WHY.md`, `docs/PARITY.md`, `docs/v2/PLAN.md`, anything else) lives under `docs/`. New docs follow the same rule.

## Running locally

```bash
npm install
npm run build:v2                              # v2 only, ~0.1 s -> build/
npm run build                                 # v1 (CRA, ~30 s) into build/v1, then v2
python3 -m http.server 4173 --directory build # or the "site" config in .claude/launch.json
```
`npm start` runs v1's CRA dev server (at `/`, not `/v1/`). v2 has no dev server: rebuild and reload. `build:v2` wipes `build/` except `build/v1`, so run the full `npm run build` once per clone, or `/v1/` 404s locally.

## Verifying changes

```bash
npm run test:v2    # physics + slider-scale golden tests, object data checks
npm run build:v2   # must build; fails if a page is over its gzip budget
npm run check:layout  # UI changes: Playwright runs the layout check at 12 sizes (~10 s)
npm run check:embed   # changes to /embed/ or anything it shares (partials, base.css, chart, readout)
npm run snapshot:compare  # refactors: must match a baseline saved before the change (~1 min)
npm run build      # before touching deploy config or v1
```
For UI changes, run `npm run check:layout`. At every size from 320×568 to 1920×1080 it checks that nothing moves, overlaps or spills across every mode and temperature, that the star, readout, chart, color map and controls fit on the first screen, and that the desktop columns end together. It saves a screenshot per size to `build/__shots/`; look at the ones your change affects. There is no light theme. For refactors and anything meant to look the same, run `npm run snapshot:save` before the change and `npm run snapshot:compare` after: 210 states (6 sizes × 35 URL and interaction states) must match pixel for pixel, including the chart canvas, URL and DOM. Judge layout from measurements (`getBoundingClientRect`, that check), not screenshots alone: browser-pane screenshots can come back scaled or stale, especially while the pane is hidden. Only Chrome has been tested; Safari renders form controls differently, so be conservative with input sizing.

## Known benign noise (don't chase these)

- Locally, `/_vercel/insights/script.js` 404s. It only exists on Vercel.
- `npm install` warns that esbuild's install script wasn't approved. esbuild still works (it ships platform binaries as optional dependencies).

## Sensitive / never commit

`.claude/settings.local.json` (per-machine Claude Code permissions). No secrets by design: no env vars, no API keys, no backend.

## Current status

Live on Vercel from `main` at https://space-charts.vercel.app: v2 at `/`, the game at `/play/`, v1 at `/v1/`. The `vercel.json` redirects (`/v1` → `/v1/`, `/b` → `/`, `/play` → `/play/`) keep the query string, verified on the live site on 2026-10-25 (`/play` on 2026-10-27). The slider uses the "Balanced" weighted scale the owner chose on 2026-10-25. Open items are listed in `docs/v2/PLAN.md` under "Open questions".
