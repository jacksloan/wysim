# WYSIM (What You See Is Music)

A fast, text-driven guitar chord chart generator. Type chords as plain text, watch the chart build live, and download a print-ready PDF — no accounts, no build step, no framework.

## Chord Charts

Each line of the editor is one chord: an optional name, a space, and a tabstring (low E → high E). Lines starting with `#` and `##` set the chart's title and subtitle.

```
# Campfire Set
## Week 3 — open chords
Am7 x02010
Bm7 x24232
F#m/C# x,9,7,8,9,9
x02210
```

- `x`/`X` — muted string
- `0`/`o`/`O` — open string
- `1`–`9` — fret number; use the comma form (`x,9,7,8,9,9`) for shapes at fret 10 and above
- Shapes above the 5th fret shift automatically and get a fret label (e.g. `7fr`)
- A line that is just a tabstring renders the diagram with no name
- `# Title` / `## Subtitle` render centered at the top of the page (the grid gives up one row to make room). Because `#` starts a title line, a chord name can't begin with `#` — write `sharp5 x13454x` style names instead

The page preview re-renders as you type. Invalid lines are skipped and reported inline with their line number; valid lines always render. Your chart persists in the browser between visits.

### Density

The gear button (hover the preview, upper right) opens chart settings with three densities:

| Density  | Chords per row | Page capacity |
|----------|----------------|---------------|
| Compact  | 5              | 35            |
| Normal   | 4              | 24            |
| Spacious | 3              | 12            |

### PDF export

The download button (hover the preview, lower right) or **Cmd/Ctrl+S** saves `wysim-chord-chart.pdf` — a vector 8.5×11" page that matches the preview exactly. Diagrams and text stay crisp at any zoom.

## Running it

It's a static site. Serve the repo root with any file server and open it:

```sh
pnpm dev   # http://localhost:8000
```

## Development

```sh
pnpm install     # dev dependencies (vitest)
pnpm test        # unit tests for the pure logic
pnpm test:watch
```

The app is plain ES modules with no bundler: `src/parse.js` (tabstring grammar) → `src/layout.js` (fret windows and page geometry) → `src/draw.js` (SVG diagrams) → `src/app.js` (UI wiring). One drawing path renders both the on-screen preview and the PDF (via vendored [jsPDF](https://github.com/parallax/jsPDF) + [svg2pdf.js](https://github.com/yWorks/svg2pdf.js)). Design docs live in `docs/superpowers/specs/`.

## License

MIT — see [LICENSE](LICENSE).
