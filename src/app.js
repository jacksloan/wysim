import { parseTab } from './parse.js';
import { fretWindow, cellRect } from './layout.js';
import { drawChord } from './draw.js';
import { textToChords } from './text.js';

const STORAGE_KEY = 'chord-chart-v1';
const SHOWN_ERRORS = 3;

const editor = document.getElementById('editor');
const errorLine = document.getElementById('error');
const page = document.getElementById('page');
const downloadButton = document.getElementById('download');

let chords = [];

editor.value = loadText();
render();

editor.addEventListener('input', render);
downloadButton.addEventListener('click', downloadPdf);
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
    e.preventDefault();
    downloadPdf();
  }
});

// Migrates the pre-text-interface JSON array format on first load.
function loadText() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === null) return '';
  try {
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((c) => typeof c?.name === 'string' && typeof c?.tab === 'string')
        .map((c) => `${c.name} ${c.tab}`)
        .join('\n');
    }
  } catch {
    // not JSON: already plain text
  }
  return stored;
}

function render() {
  const result = textToChords(editor.value);
  chords = result.chords;
  localStorage.setItem(STORAGE_KEY, editor.value);

  const shown = result.errors
    .slice(0, SHOWN_ERRORS)
    .map((e) => `Line ${e.line}: ${e.message}`);
  const hidden = result.errors.length - shown.length;
  errorLine.textContent = hidden > 0 ? `${shown.join(' · ')} (+${hidden} more)` : shown.join(' · ');

  page.replaceChildren();
  for (const chord of chords) {
    const svg = chordSvg(chord);
    svg.setAttribute('width', '135');
    svg.setAttribute('height', '120');
    page.append(svg);
  }
}

function chordSvg({ name, tab }) {
  const { strings } = parseTab(tab);
  const { baseFret } = fretWindow(strings);
  return drawChord(name, strings, baseFret);
}

async function downloadPdf() {
  const jspdfGlobal = window.jspdf;
  if (!jspdfGlobal) { showError('PDF library failed to load'); return; }
  const { jsPDF } = jspdfGlobal;
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  if (typeof doc.svg !== 'function') { showError('PDF library failed to load'); return; }
  for (const [index, chord] of chords.entries()) {
    const { x, y, width, height } = cellRect(index);
    await doc.svg(chordSvg(chord), { x, y, width, height });
  }
  doc.save('chord-chart.pdf');
}

function showError(message) {
  errorLine.textContent = message;
}
