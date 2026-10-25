# PARITY.md — cross-project conventions

## How this file works

`space-charts` adopted the shared `CLAUDE.md`/`docs/{WHY,PARITY}.md`/`.claude/rules/` template from `~/.claude/templates/` on 2026-10-25, set up with the `/new-project` skill after the v2 rewrite. This file tracks how it matches or departs from the shared baseline that the owner's other projects (`humble-dave-strikes-again`, `keptful`, `vsaa-stop-finder`, `uma-toolkit`, `dave-as-gif`, `davecipes`, `rage-against-the-retreat`) also follow. Reference it by plain text from `CLAUDE.md`, never `@import`. Keep it self-contained, so it works for someone without the template. Record real differences as they emerge, and don't invent any.

## The mechanism this whole template is built around

Confirmed against https://code.claude.com/docs/en/memory — read that page before assuming otherwise, it changes:
- **`CLAUDE.md`**: loaded in full, every session. Target under 200 lines — this is real, official Anthropic guidance, not a third-party estimate. (The "40KB" figure sometimes quoted alongside it is a misattribution of a different file's limit — `MEMORY.md`/auto-memory, not `CLAUDE.md`. `CLAUDE.md`'s actual hard cap is 4 MiB.)
- **`@path` imports**: load in full, at launch, unconditionally — same context cost as pasting the content directly into `CLAUDE.md`. Splitting into imports helps organize a file; it does **not** reduce what's loaded. Use `@import` only for small, genuinely universal content (a short `AGENTS.md` version-drift warning is the canonical case) — never for a file whose whole point is to *not* load every session.
- **`.claude/rules/*.md` with `paths:` frontmatter**: loads only when Claude reads a file matching one of the glob patterns. This is the actual on-demand mechanism for path-scoped detail — deployment config, a specific API's gotchas, a data model's transition rules. A rules file *without* `paths:` behaves exactly like an `@import` (always loaded) — the frontmatter is what makes it conditional.
- **A plain file reference** (mentioned by name/path in `CLAUDE.md`, no `@`): loads only when Claude actually reads it, via a normal Read — either because `CLAUDE.md` told it to for a specific task, or because Claude's own judgment decided it was relevant. This is the right mechanism for a living/status doc, a rationale library (`docs/WHY.md`), or this file.
- **Skills**: load only on invocation or Claude's own relevance judgment — the most deferred mechanism. Right fit for an occasional multi-step procedure, wrong fit for reference material someone needs to read passively.

The official, third-party-unaffiliated tool for auditing an existing `CLAUDE.md` for size/redundancy is **`/doctor`** — it proposes trims, keeping "pitfalls, rationale, and conventions that differ from tool defaults" and cutting content Claude can already derive from the codebase. Prefer it over third-party plugins claiming to do the same thing (real examples exist — e.g. `claudelint`/`/optimize-cc-md` — but they're unaffiliated with Anthropic and unvetted; `/doctor` is the one built into Claude Code itself).

## Target architecture (recap)

- `CLAUDE.md`: terse, imperative, universal rules only. Under 200 lines. Non-obvious rules end with `(Why: docs/WHY.md#anchor)` instead of inlining the story. Stays at repo root, alongside `README.md` — the only two markdown files that do.
- `docs/WHY.md`: the incident-annotated rationale library. Not imported, not a rules file — read on demand. Don't delete the "why" when compressing `CLAUDE.md`; relocate it here instead. This was independently identified as the single most valuable trait shared by all three source projects — preserve it, don't trade it away for a smaller `CLAUDE.md`.
- `.claude/rules/*.md`: one topic per file, `paths:` frontmatter mandatory, terse rule-register content.
- Living/status doc, if the project needs one: plain reference from `CLAUDE.md`, not imported, lives under `docs/`. Shape can vary by project size (one chronological doc, or split status/decisions/testing/deployment docs) — the shape doesn't matter as much as *not* auto-loading it.

## What this project does differently, and why

Matches the shared baseline. Stack is closest to `rage-against-the-retreat`'s (static prerendered page, no database, no auth, no secrets, Vercel), with some of `uma-toolkit`'s shape (all computation client-side against static data files). Differences:

- **No framework at all.** v2 is plain JavaScript, bundled and inlined by esbuild into one HTML file per page. No Next.js, React, Tailwind or web fonts, because load speed is the point (`docs/WHY.md#v2-has-no-framework-and-ships-one-file-per-page`). Every sibling uses Next.js or Expo.
- **Two apps in one repo, one of them frozen.** The 2023 Create React App site lives at the repo root (`src/`, `public/`) and is served unchanged at `/v1/`; v2 lives in `v2/`. No sibling keeps a frozen predecessor (`docs/WHY.md#v1-is-preserved-as-it-stands`).
- **npm, not pnpm.** Inherited from v1's lockfile; switching would only churn the frozen app.
- **Tests use Node's built-in runner (`node --test`), not Vitest.** v2 has no framework to integrate with, and the tests are pure functions against published reference values.
- **Dark only, no light theme.** A black background is the only honest way to show an object that emits no visible light, so the page sets `color-scheme: dark` deliberately. Siblings with a UI support light and dark.
- **Node is pinned to 24.x in `package.json` `engines`** (pre-existing, for Vercel builds of v1's CRA toolchain), rather than left to Vercel's default.
- **No `.env.example`.** There are no env vars.
- **Commits go straight to `main`, at the owner's request.** The baseline is a local branch per piece of work, merged only when the owner says. Here the owner has asked for each change to be committed to `main` and pushed. It's still only when asked, and pushing `main` still deploys.

## Shared baseline (converged on by all three source projects)

- CLAUDE.md stays terse and universal, under ~200 lines. Path-scoped detail lives in `.claude/rules/*.md` with `paths:` frontmatter. Narrative rationale lives in a non-imported `docs/WHY.md`.
- Root-level markdown stays minimal: only `README.md` and `CLAUDE.md` live at repo root. Every other doc — `WHY.md`, `PARITY.md`, a living/status doc, testing/deployment/spec docs, non-doc reference assets like a design prototype — lives under `docs/`.
- Generated files are never hand-edited — fix the generator and re-run it.
- Verify, don't assume: check installed dependency versions against training data; guard every field from an unofficial/undocumented API regardless of declared type; prefer live verification (curl, a direct query, a real re-fetch) over a mocked test for anything mocking structurally can't prove.
- If deploying to Vercel: Node version pinned and synced everywhere it's declared (or deliberately left to Vercel's current default if there's no Dockerfile to keep in sync), long-running routes chunked rather than trusting `maxDuration` alone, never `runtime = 'edge'` on a route touching a DB connection pool.
- Git: work on a local branch named for the work (`feature/…`, `fix/…`, `docs/…`) and never push it. Merge to `main`, push `main`, and delete the local branch only when the owner says. Pushing `main` usually deploys, so it's the owner's call. No enforced commit-message convention by default.
- If the project has a design mockup (e.g. under `docs/design-mockup/`), it always matches the live site: a UI change updates its boards in the same piece of work, and new features are designed on current boards, never stale ones. Capture boards from the running site rather than redrawing them, against demo data that uses every display feature (amounts and units, sections, every status), or the boards look broken when the layout is fine.
