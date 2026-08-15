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
  showError('');
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
