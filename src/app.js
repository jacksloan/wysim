import { parseTab } from './parse.js';
import { fretWindow, gridFor, storedToDensity } from './layout.js';
import { drawChord } from './draw.js';
import { textToChords, storedToText } from './text.js';

const STORAGE_KEY = 'chord-chart-v1';
const SETTINGS_KEY = 'chord-chart-settings-v1';
const SHOWN_ERRORS = 3;

const editor = document.getElementById('editor');
const errorLine = document.getElementById('error');
const page = document.getElementById('page');
const downloadButton = document.getElementById('download');
const settingsButton = document.getElementById('settings');
const settingsDialog = document.getElementById('settings-dialog');

let chords = [];
let density = storedToDensity(localStorage.getItem(SETTINGS_KEY));

editor.value = storedToText(localStorage.getItem(STORAGE_KEY));
render();

editor.addEventListener('input', render);
downloadButton.addEventListener('click', downloadPdf);
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
    e.preventDefault();
    downloadPdf();
  }
});

settingsButton.addEventListener('click', () => {
  settingsDialog.querySelector(`input[name="density"][value="${density}"]`).checked = true;
  settingsDialog.showModal();
});
settingsDialog.addEventListener('change', (e) => {
  if (e.target.name !== 'density') return;
  density = e.target.value;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ density }));
  render();
});
settingsDialog.addEventListener('click', (e) => {
  // Only a backdrop click targets the <dialog> itself; clicks inside land on the form.
  if (e.target === settingsDialog) settingsDialog.close();
});

function render() {
  const grid = gridFor(density);
  const result = textToChords(editor.value, grid.capacity);
  chords = result.chords;
  localStorage.setItem(STORAGE_KEY, editor.value);

  const shown = result.errors
    .slice(0, SHOWN_ERRORS)
    .map((e) => `Line ${e.line}: ${e.message}`);
  const hidden = result.errors.length - shown.length;
  errorLine.textContent = hidden > 0 ? `${shown.join(' · ')} (+${hidden} more)` : shown.join(' · ');

  page.style.gridTemplateColumns = `repeat(${grid.columns}, 1fr)`;
  page.replaceChildren();
  for (const chord of chords) {
    const svg = chordSvg(chord);
    svg.setAttribute('width', String(grid.cell.width));
    svg.setAttribute('height', String(grid.cell.height));
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
  const grid = gridFor(density);
  for (const [index, chord] of chords.entries()) {
    const { x, y, width, height } = grid.cellRect(index);
    await doc.svg(chordSvg(chord), { x, y, width, height });
  }
  doc.save('chord-chart.pdf');
}

function showError(message) {
  errorLine.textContent = message;
}
