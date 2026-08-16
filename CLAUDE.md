# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

The MVP is implemented (static app in `index.html` + `src/` with vitest tests in `tests/`), and the binding spec is `docs/superpowers/specs/2026-08-15-chord-chart-mvp-design.md` (implementation plan in `docs/superpowers/plans/2026-08-15-chord-chart-mvp.md`).

## What this project is

A tool to quickly create guitar chord chart diagrams, outputting a PDF for 8.5x11 paper. Key requirements from `docs/superpowers/specs/2026-08-15-chord-chart-mvp-design.md` (original idea sketch in `plan.md`):

- **Interface**: a single textarea, one chord per line as `Name<space>tabstring` (e.g. `Am7 x02010`; `X`/`x` = muted, `O`/`o`/`0` = open, digits = frets). The page re-renders live from the text, which is the single source of truth. It should feel snappy and developer-friendly, like a good CLI.
- **Architecture**: a single `index.html`, no framework. Tailwind CSS for styling. Web components are allowed where they help abstract reusable parts.
- **Output**: PDF sized for 8.5x11 paper, drawn with whichever PDF library is best for simple lines/shapes, with a live PDF preview rendering the output.

## Commands

Package manager is **pnpm** (pinned via `packageManager` in `package.json`).

- `pnpm test` — run unit tests (vitest) for the pure logic in `src/parse.js`, `src/layout.js`, and `src/text.js`
- `pnpm test:watch` — vitest in watch mode
- `pnpm dev` — serve the static app at http://localhost:8000 (no build step)

## Repository layout

- `plan.md` — the original idea sketch (the binding spec is in `docs/superpowers/specs/`).
- `examples/`, `conchord/` — **local-only, gitignored** reference material (may be absent in fresh clones): third-party chord chart images, and a copy of the [conchord](https://github.com/sitandr/conchord) Typst package whose diagram conventions (tabstring format, thick nut, fret labels, name auto-scaling) informed the renderer. Both were scrubbed from git history before publishing; never commit them.
