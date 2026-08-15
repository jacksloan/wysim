# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

The MVP is implemented (static app in `index.html` + `src/` with vitest tests in `tests/`), and the binding spec is `docs/superpowers/specs/2026-08-15-chord-chart-mvp-design.md` (implementation plan in `docs/superpowers/plans/2026-08-15-chord-chart-mvp.md`).

## What this project is

A tool to quickly create guitar chord chart diagrams, outputting a PDF for 8.5x11 paper. Key requirements from `docs/superpowers/specs/2026-08-15-chord-chart-mvp-design.md` (original idea sketch in `plan.md`):

- **Interface**: two text inputs — a user-defined chord name, and a strings input where `X` = muted string, `O` = open string, and a number marks the fret the shape starts on. It should feel snappy and developer-friendly, like a good CLI.
- **Architecture**: a single `index.html`, no framework. Tailwind CSS for styling. Web components are allowed where they help abstract reusable parts.
- **Output**: PDF sized for 8.5x11 paper, drawn with whichever PDF library is best for simple lines/shapes, with a live PDF preview rendering the output.

## Commands

Package manager is **pnpm** (pinned via `packageManager` in `package.json`).

- `pnpm test` — run unit tests (vitest) for the pure logic in `src/parse.js` and `src/layout.js`
- `pnpm test:watch` — vitest in watch mode
- `pnpm dev` — serve the static app at http://localhost:8000 (no build step)

## Repository layout

- `plan.md` — the project spec. The source of truth for requirements.
- `examples/` — reference images of chord charts (a JPG and a PDF) to consult for the visual style of the diagrams before building.
- `conchord/` — a vendored copy of the third-party [conchord](https://github.com/sitandr/conchord) Typst package (v0.4.0), included as **reference material only**. It is written in Typst, not JavaScript, and is not part of the app. It's useful for its chord-diagram conventions: the compact tabstring format (e.g. `x32010` — `x` muted, `0` open, digits = frets, comma-separated above fret 9), barre placement logic ("shadow barre"), thick nut for open-position chords, fret-number labels for shifted shapes, and chord-name auto-scaling. See `conchord/chords/draw-chord.typ` for the diagram-drawing logic.
