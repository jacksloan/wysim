# Chord Chart MVP — Design Spec

**Date:** 2026-08-15
**Status:** Approved design, pre-implementation

## Purpose

A static web tool for quickly building a printable guitar chord chart. The user
types chords one at a time (name + tabstring), watches them accumulate into a
letter-sized page, and downloads the page as a vector PDF. The defining quality
is speed of entry: keyboard-driven, instant feedback, CLI-like.

Reference visuals: `examples/lessons-guitar-chords-chart.jpg` and
`examples/printable-open-chord-chart.pdf` — full-page grids of labeled chord
diagrams.

## Scope

### In scope (MVP)

- Chord name input (freeform label, no music-theory validation)
- Tabstring input with live inline diagram preview while typing
- Page preview: chords laid into a 4-column grid on a letter-proportioned page
- Delete a chord via ✕ on hover
- PDF download (8.5x11, vector) via button and Cmd/Ctrl+S
- Persistence of the chord list in `localStorage`
- Single page, max 24 chords; adding a 25th shows a "page full" message

### Out of scope (MVP)

- Barre rendering (same-fret dots suffice), finger numbers, note names under
  strings, chord-name parsing or diagram generation from names
- Multiple pages, reordering, in-place editing, alternate tunings, page titles
- Any backend or build step for the app; instruments other than 6-string guitar

## Architecture

Static files, no bundler. `index.html` loads ES modules directly:

| File | Responsibility |
|------|----------------|
| `index.html` | Page shell, input bar, preview container, Tailwind via Play CDN |
| `src/parse.js` | Tabstring → chord model (pure) |
| `src/layout.js` | Fret-window/shift math and page grid positions (pure) |
| `src/draw.js` | Chord model → SVG element |
| `src/app.js` | DOM wiring, state, localStorage, PDF export |

Dev dependencies (pnpm): `vitest` for tests; `jspdf` + `svg2pdf.js` vendored or
loaded as modules for PDF export.

## Data model and parsing

A stored chord is `{ name: string, tab: string }`. `parse.js` handles grammar
only and produces:

```js
{ strings: [/* 6 entries, low E → high E: 'x' | 0 | fret number */] }
```

or a typed error (never a throw). `layout.js` then computes the fret window
from the strings array: `{ baseFret }` or a span error (see shift rule below).
The UI shows either kind of error inline under the input.

**Grammar** (case-insensitive):

- Compact form: exactly 6 characters, one per string, low E first.
  `x` = muted, `0`/`o` = open, `1`–`9` = fret. Example: `x32010`.
- Comma form: 6 comma-separated tokens for shapes using frets ≥ 10.
  Example: `x,9,7,8,9,9`.
- Anything else (wrong length, invalid characters, mixed junk) is an error.

**Fret window / shift rule** (`layout.js`): the diagram shows 5 fret rows. If
all fretted notes fit in frets 1–5, `baseFret = 1` and the nut is drawn thick.
Otherwise `baseFret = min fretted fret`, the nut is a normal line, and the
diagram is labeled `{baseFret}fr` beside the first fret row. If the fretted
span exceeds 5 frets, `layout.js` returns an error ("shape spans more than 5
frets"), shown inline like a parse error.

## Rendering

`draw.js` renders one chord model to SVG:

- Chord name centered on top; font size auto-shrinks for long names so the name
  never overflows the diagram width
- Marker row above the nut: ✕ for muted, ○ for open strings
- Grid: 6 vertical string lines, 5 fret rows; thick nut when `baseFret === 1`
- Filled dots at fretted positions; `Nfr` label when shifted

The same SVG output is used on screen and in the PDF — one drawing code path.

## Page layout and PDF

- Preview: a letter-proportioned (8.5:11) container div, 4-column grid, filling
  left→right, top→bottom. 24-chord capacity (4 × 6).
- Export: `jsPDF` document at 612×792 pt; each on-screen SVG converted with
  `svg2pdf.js` at the position computed by `layout.js`. Output is vector.
- Trigger: "Download PDF" button and Cmd/Ctrl+S (preventDefault on the
  browser's save dialog).

## Interaction and state

- Input bar: name field → Tab → tabstring field → Enter commits the chord,
  clears both fields, refocuses the name field
- A live mini diagram renders beside the inputs as the tabstring is typed;
  invalid input shows the error message instead
- Committing requires a valid tabstring; the name may be any non-empty string
- Each chord card in the preview shows ✕ on hover; clicking deletes it
- State: array of `{ name, tab }` serialized to `localStorage` on every
  change, restored on load
- All errors are inline text, never dialogs or alerts

## Error handling summary

| Condition | Behavior |
|-----------|----------|
| Invalid tabstring | Inline error under input, commit blocked |
| Shape spans > 5 frets | Same as invalid tabstring |
| Empty name | Commit blocked, focus name field |
| Page full (24 chords) | Inline "page full" message, commit blocked |
| Corrupt localStorage | Discard stored state, start empty |

## Testing

- `parse.js`: vitest unit tests — valid compact/comma forms, case handling,
  every error class
- `layout.js`: vitest unit tests — shift rule boundaries (fits/doesn't fit,
  span > 5), grid position math, 24-chord capacity
- `draw.js` and `app.js`: verified by eye in the browser for MVP; no DOM unit
  tests
