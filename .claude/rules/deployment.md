---
paths:
  - "vercel.json"
  - "package.json"
  - "v2/build.mjs"
  - "public/**"
---

# Build and deployment (Vercel)

- Vercel deploys `main` (GitHub `gendelbendel/space-charts`) using the Create React App preset: `npm run build`, output `build/`. Pushing `main` ships, so it's the owner's call.
- `npm run build` = `build:v1` (`PUBLIC_URL=/v1 BUILD_PATH=build/v1 react-scripts build`) then `build:v2` (`node v2/build.mjs`). `build.mjs` wipes `build/` except `build/v1`, so either order works, but keep v1 first.
- `build.mjs` builds every `v2/pages/**/index.html` to the same path under `build/`, expanding `<!-- include: x -->`, filling `{{name}}` slots from `v2/src/prerender.js` (a slot with no value fails the build), then `/* inline: path */` and `<!-- inline-script: path -->`. A new page is just a new folder under `v2/pages/`.
- It also copies `favicon.ico`, `preview.webp` and `robots.txt` from `public/` (v1's folder) to the root. Don't add v2-only assets to `public/`; v1 would ship them too.
- `vercel.json` redirects `/v1` → `/v1/` (directory index) and `/b` → `/` as 307s that keep the query string (verified on the live site, 2026-10-25: `/v1?temp=3600` → `/v1/?temp=3600`). `/play` → `/play/` (the game) and `/embed` → `/embed/` are the same kind of redirect; a new page folder needs one too. Production is https://space-charts.vercel.app.
- Node is pinned to 24.x in `engines` (CRA's toolchain on Vercel). Keep it in sync if it changes.
- esbuild is the only dev dependency v2 adds, pinned exactly. Don't add runtime dependencies to v2. (Why: `docs/WHY.md#v2-has-no-framework-and-ships-one-file-per-page`)
- Vercel Analytics: both v1 and v2 include `/_vercel/insights/script.js` (deferred). It 404s locally; that's expected.
