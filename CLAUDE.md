# CLAUDE.md

Instructions for Claude Code working in this repository. Read this first, every session.

Path-scoped detail lives in `.claude/rules/` (`physics.md`, `ui.md`, `deployment.md`, `v1.md`) and loads automatically when you touch matching files — you don't need to open these yourself. The rationale behind any non-obvious rule below is in `docs/WHY.md` (not auto-loaded — read it if about to second-guess or relitigate something). Cross-project conventions are in `docs/PARITY.md` (also not auto-loaded).

## What this project is

"What color is a star?": an interactive blackbody-radiation page. Pick a temperature and it shows the Planck spectrum, the color and brightness a human eye would actually see, where that color sits on the CIE 1931 chromaticity diagram, and the math behind it, with a reference list of stars and an FAQ. A hobby/education site by the owner (David). v2 is a ground-up rewrite at `/`. The original 2023 Create React App version is kept, untouched, at `/v1/`.

## The living context doc

`docs/v2/PLAN.md` holds the v2 plan: the audit of v1's bugs, the color models and their data sources, verified reference values, architecture, size budget and open questions. It's the source of truth for those decisions. This file is a summary and defers to it on conflict. Update its "Status" section when routes, layout tiers or open questions change.

## Repo layout

```
src/, public/            v1 (CRA + React + MUI + Chart.js). Frozen. Built to build/v1.
v2/
  pages/index.html       the v2 page, served at /
  partials/*.html        shared HTML pieces, expanded at build (<!-- include: name -->)
  src/physics.js         Planck, CIE 1931 pipeline, real-star lookup, brightness model, input parsing
  src/app.js             the page's UI controller (state, render, chart, color map, FAQ search)
  src/slider-scale.js    temperature <-> slider position (piecewise log, weighted toward 2,400–12,000 K)
  src/slider-marks.js    class letters and reference marks under a slider, collision-aware
  src/data/              cie1931.js, harre-heller-2021.js (generated), objects.js (stars, classes, marks)
  src/base.css           shared tokens and components; layout tiers live in pages/index.html
  build.mjs              builds each page into one self-contained HTML file in build/
  test/                  node --test golden tests (physics, slider scales)
  tools/layout-stability.js  paste-in browser check that nothing moves when modes change
vercel.json              redirects /v1 -> /v1/ and /b -> /
```

## Tech stack

v2: plain JavaScript (ES modules), no framework, no runtime dependencies, no web fonts. esbuild bundles and inlines each page's script; CSS and partials are inlined by `v2/build.mjs`. Math renders as native MathML. Tests use Node's built-in runner. v1: CRA 5, React 18, MUI, Chart.js, KaTeX, TypeScript. Package manager: npm (lockfile at root). Node 24 (`engines`). Hosting: Vercel, deploying from `main`. No database, no auth, no server code.

## Core rules

1. **Never change v1's behavior.** Its only allowed edit is the banner linking back to v2. Don't upgrade, restyle or fix it. (Why: `docs/WHY.md#v1-is-preserved-as-it-stands`)
2. **v2 stays framework-free and ships each page as one file.** No runtime dependencies, no fonts, no chart library. Check the gzip size `build.mjs` prints; the main page is ~25 KB. (Why: `docs/WHY.md#v2-has-no-framework-and-ships-one-file-per-page`)
3. **Physics changes need a golden test.** Compare against a published value, never against the code's own output. `npm run test:v2` must stay green. (Why: `docs/WHY.md#the-math-is-checked-against-published-values`)
4. **Cold objects render black or grey, never saturated red**, in the default "Your eye" mode. Brightness comes from real luminance. (Why: `docs/WHY.md#cold-objects-render-black-not-red`)
5. **Switching modes or dragging the slider must not move the layout.** Anything whose text changes gets a fixed or reserved height, and type never changes size with content length. Run `v2/tools/layout-stability.js` after UI changes. (Why: `docs/WHY.md#nothing-moves-when-modes-change`)
6. **The star, readout, chart, color map and controls share the first screen** at every size, so the effect of the slider is visible without scrolling. (Why: `docs/WHY.md#everything-the-slider-changes-stays-on-one-screen`)
7. **Never hand-edit generated files**: `v2/src/data/harre-heller-2021.js` (from the paper's text) and anything in `build/`.
8. **Root-level markdown stays minimal**: only `README.md` and `CLAUDE.md` live at repo root — every other doc (`docs/WHY.md`, `docs/PARITY.md`, `docs/v2/PLAN.md`, anything else) lives under `docs/`. New docs follow the same rule.

## Running locally

```bash
npm install
npm run build:v2                              # v2 only, ~0.1 s -> build/
npm run build                                 # v1 (CRA, ~30 s) into build/v1, then v2
python3 -m http.server 4173 --directory build # or the "site" config in .claude/launch.json
```
`npm start` runs v1's CRA dev server (at `/`, not `/v1/`). v2 has no dev server: rebuild and reload.

## Verifying changes

```bash
npm run test:v2    # physics + slider-scale golden tests
npm run build:v2   # must build; note the gzip sizes it prints
npm run build      # before touching deploy config or v1
```
For UI changes, check the page in the browser at 375px, a tall phone (430×932), tablet (768×1024), a landscape phone (667×375) and desktop (1440×900). There is no light theme. Run `v2/tools/layout-stability.js` at a few of those sizes (see `.claude/rules/ui.md` for the one-liner) and confirm it reports no shifts and no overlaps.

## Known benign noise (don't chase these)

- Locally, `/_vercel/insights/script.js` 404s. It only exists on Vercel.
- `npm install` warns that esbuild's install script wasn't approved. esbuild still works (it ships platform binaries as optional dependencies).
- `?t=abc` stays in the address bar until the first slider move. The page already fell back to 5,772 K.

## Sensitive / never commit

`.claude/settings.local.json` (per-machine Claude Code permissions). No secrets by design: no env vars, no API keys, no backend.

## Current status

Live on Vercel from `main`: v2 at `/`, v1 at `/v1/`. Not yet verified on the deployed site: the `vercel.json` redirects and whether they keep `?temp=`. The slider uses the "Balanced" weighted scale the owner chose on 2026-10-25. Open items are listed in `docs/v2/PLAN.md`.
