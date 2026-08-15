# Chord Chart MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A static web page where a user rapidly enters guitar chords (name + tabstring), sees them accumulate on a letter-sized page preview, and downloads the page as a vector PDF.

**Architecture:** No build step. `index.html` loads ES modules directly; pure logic (`parse.js`, `layout.js`) is unit-tested with vitest, DOM/SVG code (`draw.js`, `app.js`) is verified in the browser. One SVG drawing path serves both the on-screen preview and the PDF export (jsPDF + svg2pdf.js, vendored UMD builds).

**Tech Stack:** Vanilla JS ES modules, Tailwind Play CDN, vitest (dev only), jsPDF + svg2pdf.js (vendored), pnpm.

**Spec:** `docs/superpowers/specs/2026-08-15-chord-chart-mvp-design.md`

## Global Constraints

- No bundler and no build step for the app; the site must work served as static files (`python3 -m http.server 8000` from repo root).
- Browser libraries are vendored UMD files in `vendor/`, loaded via `<script>` tags — never bare-specifier imports in browser code.
- Package manager is pnpm (pinned `pnpm@10.33.0` in package.json).
- Page geometry: US Letter, 612×792 pt, 36 pt margins, 4 columns × 6 rows, capacity 24 chords, cell 135×120 pt.
- Diagram shows exactly 5 fret rows; 6 strings (guitar only), low E first in all string arrays.
- localStorage key: `chord-chart-v1`.
- Errors are values (`{ ok: false, error }`), never thrown; the UI shows them as inline text, never dialogs/alerts.
- Commit after every task; test-first for all pure logic.

---

### Task 1: Tabstring parser (`parse.js`) + test infrastructure

**Files:**
- Modify: `package.json` (scripts, devDependencies via pnpm)
- Create: `src/parse.js`
- Test: `tests/parse.test.js`
- Modify: `CLAUDE.md` (Commands section)

**Interfaces:**
- Consumes: nothing.
- Produces: `parseTab(tab: string) -> { ok: true, strings: Array<'x' | number> } | { ok: false, error: string }`. `strings` always has exactly 6 entries, low E → high E; `0` means open, `'x'` muted, `1..24` a fret number.

- [ ] **Step 1: Install vitest and set the test script**

```bash
pnpm add -D vitest
```

Then edit `package.json` scripts to:

```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest",
  "dev": "python3 -m http.server 8000"
}
```

- [ ] **Step 2: Write the failing tests**

Create `tests/parse.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { parseTab } from '../src/parse.js';

describe('parseTab', () => {
  it('parses the compact form', () => {
    expect(parseTab('x32010')).toEqual({ ok: true, strings: ['x', 3, 2, 0, 1, 0] });
  });

  it('accepts case variants and o for open', () => {
    expect(parseTab('XoO219')).toEqual({ ok: true, strings: ['x', 0, 0, 2, 1, 9] });
  });

  it('parses the comma form with frets >= 10', () => {
    expect(parseTab('x,9,7,8,9,12')).toEqual({ ok: true, strings: ['x', 9, 7, 8, 9, 12] });
  });

  it('allows whitespace around comma tokens and the whole input', () => {
    expect(parseTab(' x, 9, 7, 8, 9, 9 ')).toEqual({ ok: true, strings: ['x', 9, 7, 8, 9, 9] });
  });

  it('rejects empty input', () => {
    expect(parseTab('').ok).toBe(false);
    expect(parseTab('   ').ok).toBe(false);
  });

  it('rejects wrong string counts', () => {
    expect(parseTab('x3201')).toEqual({ ok: false, error: 'Expected 6 strings (low E to high E)' });
    expect(parseTab('x320100').ok).toBe(false);
    expect(parseTab('x,9,7').ok).toBe(false);
  });

  it('rejects invalid characters', () => {
    expect(parseTab('x32a10')).toEqual({ ok: false, error: 'Invalid string value "a"' });
    expect(parseTab('x,9,7,8,9,h').ok).toBe(false);
  });

  it('rejects frets above 24', () => {
    expect(parseTab('x,25,7,8,9,9')).toEqual({ ok: false, error: 'Fret 25 is out of range (max 24)' });
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm test`
Expected: FAIL — cannot resolve `../src/parse.js`.

- [ ] **Step 4: Write the implementation**

Create `src/parse.js`:

```js
export function parseTab(tab) {
  const trimmed = tab.trim();
  if (trimmed === '') return err('Enter a tabstring like x32010');

  const tokens = trimmed.includes(',')
    ? trimmed.split(',').map((t) => t.trim())
    : [...trimmed];

  if (tokens.length !== 6) return err('Expected 6 strings (low E to high E)');

  const strings = [];
  for (const token of tokens) {
    const lower = token.toLowerCase();
    if (lower === 'x') { strings.push('x'); continue; }
    if (lower === '0' || lower === 'o') { strings.push(0); continue; }
    if (/^[1-9][0-9]?$/.test(lower)) {
      const fret = Number(lower);
      if (fret > 24) return err(`Fret ${fret} is out of range (max 24)`);
      strings.push(fret);
      continue;
    }
    return err(`Invalid string value "${token}"`);
  }
  return { ok: true, strings };
}

function err(error) {
  return { ok: false, error };
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test`
Expected: PASS, 8 tests.

- [ ] **Step 6: Update CLAUDE.md Commands section**

Replace the "Commands" section body in `CLAUDE.md` with:

```markdown
Package manager is **pnpm** (pinned via `packageManager` in `package.json`).

- `pnpm test` — run unit tests (vitest) for the pure logic in `src/parse.js` and `src/layout.js`
- `pnpm test:watch` — vitest in watch mode
- `pnpm dev` — serve the static app at http://localhost:8000 (no build step)
```

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-lock.yaml src/parse.js tests/parse.test.js CLAUDE.md
git commit -m "feat: tabstring parser with vitest setup"
```

---

### Task 2: Fret window / shift rule (`layout.js`)

**Files:**
- Create: `src/layout.js`
- Test: `tests/layout.test.js`

**Interfaces:**
- Consumes: the `strings` array shape produced by `parseTab` (Task 1).
- Produces: `fretWindow(strings: Array<'x' | number>) -> { ok: true, baseFret: number } | { ok: false, error: string }`. `baseFret` is 1 for unshifted shapes (thick nut), otherwise the lowest fretted fret.

- [ ] **Step 1: Write the failing tests**

Create `tests/layout.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { fretWindow } from '../src/layout.js';

describe('fretWindow', () => {
  it('keeps an open chord at base fret 1', () => {
    expect(fretWindow(['x', 3, 2, 0, 1, 0])).toEqual({ ok: true, baseFret: 1 });
  });

  it('keeps an all-open/muted shape at base fret 1', () => {
    expect(fretWindow(['x', 0, 0, 0, 0, 'x'])).toEqual({ ok: true, baseFret: 1 });
  });

  it('keeps a shape fitting frets 1-5 at base fret 1', () => {
    expect(fretWindow([1, 3, 5, 'x', 'x', 'x'])).toEqual({ ok: true, baseFret: 1 });
  });

  it('shifts to the lowest fretted fret when the shape exceeds fret 5', () => {
    expect(fretWindow(['x', 9, 7, 8, 9, 9])).toEqual({ ok: true, baseFret: 7 });
  });

  it('allows a span of exactly 5 frets', () => {
    expect(fretWindow([3, 'x', 'x', 'x', 'x', 7])).toEqual({ ok: true, baseFret: 3 });
  });

  it('errors when the span exceeds 5 frets', () => {
    expect(fretWindow([2, 'x', 'x', 'x', 'x', 7]))
      .toEqual({ ok: false, error: 'Shape spans more than 5 frets' });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test`
Expected: FAIL — cannot resolve `../src/layout.js`. (Task 1 tests still pass.)

- [ ] **Step 3: Write the implementation**

Create `src/layout.js`:

```js
const SHOWN_FRETS = 5;

export function fretWindow(strings) {
  const fretted = strings.filter((s) => typeof s === 'number' && s > 0);
  if (fretted.length === 0) return { ok: true, baseFret: 1 };

  const min = Math.min(...fretted);
  const max = Math.max(...fretted);
  if (max - min + 1 > SHOWN_FRETS) {
    return { ok: false, error: 'Shape spans more than 5 frets' };
  }
  if (max <= SHOWN_FRETS) return { ok: true, baseFret: 1 };
  return { ok: true, baseFret: min };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test`
Expected: PASS, 14 tests total.

- [ ] **Step 5: Commit**

```bash
git add src/layout.js tests/layout.test.js
git commit -m "feat: fret window and shift rule"
```

---

### Task 3: Page grid math (`layout.js`)

**Files:**
- Modify: `src/layout.js` (append)
- Test: `tests/layout.test.js` (append)

**Interfaces:**
- Consumes: nothing new.
- Produces: `PAGE_CAPACITY: 24`, `PAGE: { width: 612, height: 792, margin: 36 }`, `CELL: { width: 135, height: 120 }`, and `cellRect(index: number) -> { x, y, width, height }` in pt, filling left→right then top→bottom.

- [ ] **Step 1: Write the failing tests**

Append to `tests/layout.test.js` (add `cellRect`, `PAGE_CAPACITY` to the existing import from `../src/layout.js`):

```js
describe('cellRect', () => {
  it('places the first chord at the top-left margin', () => {
    expect(cellRect(0)).toEqual({ x: 36, y: 36, width: 135, height: 120 });
  });

  it('fills left to right along a row', () => {
    expect(cellRect(1)).toEqual({ x: 171, y: 36, width: 135, height: 120 });
  });

  it('wraps to a new row after 4 columns', () => {
    expect(cellRect(4)).toEqual({ x: 36, y: 156, width: 135, height: 120 });
  });

  it('places the last cell at the bottom-right', () => {
    expect(cellRect(23)).toEqual({ x: 441, y: 636, width: 135, height: 120 });
  });

  it('has a capacity of 24 chords', () => {
    expect(PAGE_CAPACITY).toBe(24);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test`
Expected: FAIL — `cellRect` is not exported.

- [ ] **Step 3: Write the implementation**

Append to `src/layout.js`:

```js
export const COLUMNS = 4;
export const ROWS = 6;
export const PAGE_CAPACITY = COLUMNS * ROWS;

export const PAGE = { width: 612, height: 792, margin: 36 };
export const CELL = {
  width: (PAGE.width - 2 * PAGE.margin) / COLUMNS,
  height: (PAGE.height - 2 * PAGE.margin) / ROWS,
};

export function cellRect(index) {
  const col = index % COLUMNS;
  const row = Math.floor(index / COLUMNS);
  return {
    x: PAGE.margin + col * CELL.width,
    y: PAGE.margin + row * CELL.height,
    width: CELL.width,
    height: CELL.height,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test`
Expected: PASS, 19 tests total.

- [ ] **Step 5: Commit**

```bash
git add src/layout.js tests/layout.test.js
git commit -m "feat: page grid math for letter-size 4x6 layout"
```

---

### Task 4: Chord diagram SVG renderer (`draw.js`) + page shell (`index.html`)

**Files:**
- Create: `src/draw.js`
- Create: `index.html`

**Interfaces:**
- Consumes: `strings` array shape (Task 1), `baseFret` (Task 2).
- Produces: `drawChord(name: string, strings: Array<'x' | number>, baseFret: number) -> SVGElement` with `viewBox="0 0 135 120"` and no width/height attributes (callers size it). `index.html` element ids used by Task 5: `name`, `tab`, `live-preview`, `error`, `page`, `download`.

No unit tests — this task is verified by eye in the browser (per spec).

- [ ] **Step 1: Write the renderer**

Create `src/draw.js`:

```js
const NS = 'http://www.w3.org/2000/svg';
const FONT = 'Helvetica, Arial, sans-serif';

// Grid geometry inside the 135x120 viewBox
const LEFT = 30;
const RIGHT = 105;
const TOP = 32;
const BOTTOM = 107;
const STRING_GAP = (RIGHT - LEFT) / 5; // 15
const FRET_GAP = (BOTTOM - TOP) / 5;   // 15

export function drawChord(name, strings, baseFret) {
  const svg = el('svg', { viewBox: '0 0 135 120', xmlns: NS });

  // Chord name, auto-shrunk so long names stay inside the diagram width
  const fontSize = Math.max(7, 13 - Math.max(0, name.length - 6));
  svg.append(el('text', {
    x: 67.5, y: 16, 'text-anchor': 'middle', 'font-size': fontSize,
    'font-weight': 'bold', 'font-family': FONT,
  }, name));

  // Marker row: drawn shapes, not text glyphs, so the PDF export stays font-safe
  strings.forEach((s, i) => {
    const x = LEFT + i * STRING_GAP;
    const y = 26;
    if (s === 'x') {
      svg.append(el('line', { x1: x - 3, y1: y - 3, x2: x + 3, y2: y + 3, stroke: 'black', 'stroke-width': 1.2 }));
      svg.append(el('line', { x1: x - 3, y1: y + 3, x2: x + 3, y2: y - 3, stroke: 'black', 'stroke-width': 1.2 }));
    } else if (s === 0) {
      svg.append(el('circle', { cx: x, cy: y, r: 3.5, fill: 'none', stroke: 'black', 'stroke-width': 1.2 }));
    }
  });

  if (baseFret === 1) {
    svg.append(el('rect', { x: LEFT - 1, y: TOP - 3, width: RIGHT - LEFT + 2, height: 3, fill: 'black' }));
  } else {
    svg.append(el('text', {
      x: LEFT - 5, y: TOP + FRET_GAP / 2 + 3, 'text-anchor': 'end',
      'font-size': 9, 'font-family': FONT,
    }, `${baseFret}fr`));
  }

  for (let i = 0; i <= 5; i++) {
    const y = TOP + i * FRET_GAP;
    svg.append(el('line', { x1: LEFT, y1: y, x2: RIGHT, y2: y, stroke: 'black', 'stroke-width': 1 }));
  }
  for (let i = 0; i < 6; i++) {
    const x = LEFT + i * STRING_GAP;
    svg.append(el('line', { x1: x, y1: TOP, x2: x, y2: BOTTOM, stroke: 'black', 'stroke-width': 1 }));
  }

  strings.forEach((s, i) => {
    if (typeof s !== 'number' || s === 0) return;
    const x = LEFT + i * STRING_GAP;
    const y = TOP + (s - baseFret) * FRET_GAP + FRET_GAP / 2;
    svg.append(el('circle', { cx: x, cy: y, r: 5, fill: 'black' }));
  });

  return svg;
}

function el(tag, attrs, textContent) {
  const node = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  if (textContent !== undefined) node.textContent = textContent;
  return node;
}
```

- [ ] **Step 2: Write the page shell with a temporary demo script**

Create `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Chord Chart</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 min-h-screen">
  <main class="max-w-4xl mx-auto p-6 space-y-4">
    <header class="flex items-end gap-3">
      <div>
        <label for="name" class="block text-xs font-medium text-gray-500">Chord name</label>
        <input id="name" autocomplete="off" autofocus
               class="w-32 rounded border border-gray-300 font-mono px-2 py-1" placeholder="Am7">
      </div>
      <div>
        <label for="tab" class="block text-xs font-medium text-gray-500">Strings (low E &rarr; high E)</label>
        <input id="tab" autocomplete="off"
               class="w-40 rounded border border-gray-300 font-mono px-2 py-1" placeholder="x02010">
      </div>
      <div id="live-preview" class="w-16 h-16"></div>
      <button id="download"
              class="ml-auto bg-blue-600 hover:bg-blue-700 text-white rounded px-3 py-1.5 text-sm font-medium">
        Download PDF
      </button>
    </header>
    <p id="error" class="text-sm text-red-600 h-5"></p>
    <div id="page" class="bg-white shadow mx-auto grid grid-cols-4 content-start box-content"
         style="width: 540px; height: 720px; padding: 36px;"></div>
  </main>
  <!-- TEMPORARY demo render; replaced by src/app.js in the next task -->
  <script type="module">
    import { drawChord } from './src/draw.js';
    const page = document.getElementById('page');
    const demos = [
      ['C', ['x', 3, 2, 0, 1, 0], 1],
      ['Em', [0, 2, 2, 0, 0, 0], 1],
      ['F#m/C#', ['x', 9, 7, 8, 9, 9], 7],
    ];
    for (const [name, strings, baseFret] of demos) {
      const svg = drawChord(name, strings, baseFret);
      svg.setAttribute('width', '135');
      svg.setAttribute('height', '120');
      page.append(svg);
    }
  </script>
</body>
</html>
```

- [ ] **Step 3: Verify in the browser**

Run: `pnpm dev`, open http://localhost:8000.
Check: three diagrams in the top row of a white letter-proportioned page — C (thick nut, ✕ on low E, ○ markers, three dots), Em (thick nut, two dots), F#m/C# (no thick nut, "7fr" label left of the first fret row, dots within rows 1–3, smaller name text). No console errors.

- [ ] **Step 4: Commit**

```bash
git add src/draw.js index.html
git commit -m "feat: chord diagram SVG renderer and page shell"
```

---

### Task 5: App wiring — inputs, live preview, page state, localStorage (`app.js`)

**Files:**
- Create: `src/app.js`
- Modify: `index.html` (replace the temporary demo script)

**Interfaces:**
- Consumes: `parseTab` (Task 1), `fretWindow`, `PAGE_CAPACITY` (Tasks 2–3), `drawChord` (Task 4), element ids from `index.html` (Task 4).
- Produces: working entry loop and persisted state; `chordSvg({ name, tab }) -> SVGElement` used again by Task 6's PDF export. Stored state: JSON array of `{ name, tab }` under localStorage key `chord-chart-v1`.

- [ ] **Step 1: Write the app module**

Create `src/app.js`:

```js
import { parseTab } from './parse.js';
import { fretWindow, PAGE_CAPACITY, cellRect } from './layout.js';
import { drawChord } from './draw.js';

const STORAGE_KEY = 'chord-chart-v1';

const nameInput = document.getElementById('name');
const tabInput = document.getElementById('tab');
const livePreview = document.getElementById('live-preview');
const errorLine = document.getElementById('error');
const page = document.getElementById('page');
const downloadButton = document.getElementById('download');

let chords = loadChords();
renderPage();

nameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') tabInput.focus();
});
tabInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') commit();
});
tabInput.addEventListener('input', renderLivePreview);
downloadButton.addEventListener('click', downloadPdf);
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
    e.preventDefault();
    downloadPdf();
  }
});

function loadChords() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(stored) && stored.length <= PAGE_CAPACITY && stored.every(isValidChord)) {
      return stored;
    }
  } catch {
    // corrupt stored state: fall through and start empty
  }
  return [];
}

function isValidChord(c) {
  if (typeof c?.name !== 'string' || c.name.trim() === '' || typeof c?.tab !== 'string') return false;
  const parsed = parseTab(c.tab);
  return parsed.ok && fretWindow(parsed.strings).ok;
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chords));
}

export function chordSvg({ name, tab }) {
  const { strings } = parseTab(tab);
  const { baseFret } = fretWindow(strings);
  return drawChord(name, strings, baseFret);
}

function validateInput() {
  const parsed = parseTab(tabInput.value);
  if (!parsed.ok) return parsed;
  const win = fretWindow(parsed.strings);
  if (!win.ok) return win;
  return { ok: true, strings: parsed.strings, baseFret: win.baseFret };
}

function renderLivePreview() {
  livePreview.replaceChildren();
  showError('');
  if (tabInput.value.trim() === '') return;
  const result = validateInput();
  if (!result.ok) { showError(result.error); return; }
  const svg = drawChord(nameInput.value.trim() || '?', result.strings, result.baseFret);
  svg.setAttribute('width', '64');
  svg.setAttribute('height', '57');
  livePreview.append(svg);
}

function commit() {
  const name = nameInput.value.trim();
  if (!name) { showError('Enter a chord name'); nameInput.focus(); return; }
  const result = validateInput();
  if (!result.ok) { showError(result.error); return; }
  if (chords.length >= PAGE_CAPACITY) { showError(`Page full (${PAGE_CAPACITY} chords)`); return; }

  chords.push({ name, tab: tabInput.value.trim() });
  save();
  renderPage();
  nameInput.value = '';
  tabInput.value = '';
  livePreview.replaceChildren();
  showError('');
  nameInput.focus();
}

function removeChord(index) {
  chords.splice(index, 1);
  save();
  renderPage();
}

function renderPage() {
  page.replaceChildren();
  chords.forEach((chord, index) => {
    const cell = document.createElement('div');
    cell.className = 'relative group';
    const svg = chordSvg(chord);
    svg.setAttribute('width', '135');
    svg.setAttribute('height', '120');
    const remove = document.createElement('button');
    remove.textContent = '✕';
    remove.title = `Remove ${chord.name}`;
    remove.className =
      'absolute top-0 right-0 hidden group-hover:block text-gray-400 hover:text-red-600 text-xs px-1';
    remove.addEventListener('click', () => removeChord(index));
    cell.append(svg, remove);
    page.append(cell);
  });
}

function showError(message) {
  errorLine.textContent = message;
}

async function downloadPdf() {
  // Wired fully in the PDF export task; jsPDF is not loaded yet.
  if (!window.jspdf) { showError('PDF export not wired up yet'); return; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  for (const [index, chord] of chords.entries()) {
    const { x, y, width, height } = cellRect(index);
    await doc.svg(chordSvg(chord), { x, y, width, height });
  }
  doc.save('chord-chart.pdf');
}
```

- [ ] **Step 2: Swap the demo script for the app module**

In `index.html`, replace the entire temporary `<script type="module">…</script>` block (including the TEMPORARY comment) with:

```html
<script type="module" src="src/app.js"></script>
```

- [ ] **Step 3: Verify the entry loop in the browser**

Run: `pnpm dev`, open http://localhost:8000. Check each:

1. Type `Am` → Enter (focus jumps to tabstring field) → type `x02210`; a live mini-diagram appears while typing; Enter commits it to the page and focus returns to the name field with both fields cleared.
2. Add `F#m/C#` with `x,9,7,8,9,9` — shifted diagram with `7fr` label.
3. Type an invalid tabstring (`x3201`) — inline red error, Enter does not commit.
4. Commit with an empty name — "Enter a chord name" error, focus moves to name field.
5. Hover a chord on the page — ✕ appears; click removes it.
6. Reload the page — chords are still there (localStorage).
7. In devtools: `localStorage.setItem('chord-chart-v1', 'garbage')`, reload — app starts empty, no console error.
8. Click Download PDF — shows "PDF export not wired up yet" inline (expected until the next task).

- [ ] **Step 4: Commit**

```bash
git add src/app.js index.html
git commit -m "feat: entry loop, live preview, delete, and localStorage state"
```

---

### Task 6: PDF export (vendored jsPDF + svg2pdf.js)

**Files:**
- Modify: `package.json` (devDependencies via pnpm)
- Create: `vendor/jspdf.umd.min.js`, `vendor/svg2pdf.umd.min.js` (copied from node_modules)
- Modify: `index.html` (script tags)

**Interfaces:**
- Consumes: `downloadPdf` in `src/app.js` (Task 5) already calls `window.jspdf.jsPDF` and `doc.svg(element, { x, y, width, height })`; this task only makes those globals exist.
- Produces: `chord-chart.pdf` download — vector, 612×792 pt letter page.

- [ ] **Step 1: Install and vendor the libraries**

```bash
pnpm add -D jspdf svg2pdf.js
mkdir -p vendor
cp node_modules/jspdf/dist/jspdf.umd.min.js vendor/
cp node_modules/svg2pdf.js/dist/svg2pdf.umd.min.js vendor/
```

(If a `dist` filename differs in the installed version, run `ls node_modules/jspdf/dist node_modules/svg2pdf.js/dist` and copy the UMD min build; keep the `vendor/` filenames above.)

- [ ] **Step 2: Load them in `index.html`**

Add to `<head>`, after the Tailwind script tag:

```html
  <script src="vendor/jspdf.umd.min.js"></script>
  <script src="vendor/svg2pdf.umd.min.js"></script>
```

- [ ] **Step 3: Verify the export in the browser**

Run: `pnpm dev`, open http://localhost:8000. With at least 5 chords on the page (so a second row exists — include one shifted chord like `x,9,7,8,9,9` and one with a long name), check:

1. Click Download PDF → `chord-chart.pdf` downloads.
2. Cmd+S (or Ctrl+S) → same download; the browser's save-page dialog does NOT appear.
3. Open the PDF: letter-sized page, diagrams positioned like the preview (4 per row, top-left start), lines/dots crisp when zoomed far in (vector, not raster), names and `7fr` label render as text, ✕/○ markers visible.
4. Console shows no errors during export.

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml vendor/ index.html
git commit -m "feat: vector PDF export via vendored jsPDF and svg2pdf"
```

---

## Verification checklist (whole plan)

- `pnpm test` green: parse grammar (compact, comma, case, whitespace, errors), fret window boundaries, grid math.
- Browser loop: name → Tab/Enter → tabstring → Enter → diagram on page → focus back on name.
- Persistence across reload; corrupt storage starts clean.
- 24-chord capacity enforced with inline "Page full (24 chords)" message.
- PDF matches preview and is vector.
