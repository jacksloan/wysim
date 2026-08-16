import { detect } from '../vendor/tonal-chord-detect.js';
import { parseTab } from './parse.js';

// Standard tuning open-string MIDI numbers, low E -> high E
const OPEN_MIDI = [40, 45, 50, 55, 59, 64];
// Sharp spellings by pitch class — guitarist convention
const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
// Longer detected names are exotic spellings a guitarist wouldn't write
// (e.g. "Gbmb6b9/D"); better to show no name than a baffling one.
const MAX_NAME_LENGTH = 8;

export function detectName(tab) {
  const parsed = parseTab(tab);
  if (!parsed.ok) return null;

  const notes = [];
  parsed.strings.forEach((s, i) => {
    if (typeof s !== 'number') return;
    const note = SHARP_NAMES[(OPEN_MIDI[i] + s) % 12];
    if (!notes.includes(note)) notes.push(note);
  });
  if (notes.length === 0) return null;

  const candidates = detect(notes, { assumePerfectFifth: true }).map(normalize);
  const best = candidates.find((name) => !name.includes('no5')) ?? candidates[0];
  if (!best || best.length > MAX_NAME_LENGTH) return null;
  return best;
}

// tonal spells major with a capital M ("CM", "CMadd9", "BbM/D");
// strip it after the root so names read like chart conventions.
function normalize(name) {
  return name.replace(/^([A-G][#b]*)M(?=$|\/|add)/, '$1');
}

export function storedToAutoName(stored) {
  try {
    const parsed = JSON.parse(stored);
    if (typeof parsed?.autoName === 'boolean') return parsed.autoName;
  } catch {
    // junk stored value: fall through to default
  }
  return true;
}
