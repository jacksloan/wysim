import { parseTab } from './parse.js';
import { fretWindow, PAGE_CAPACITY } from './layout.js';

export function textToChords(text, capacity = PAGE_CAPACITY) {
  const chords = [];
  const errors = [];
  let pageFull = false;
  text.split('\n').forEach((raw, i) => {
    const line = raw.trim();
    if (line === '') return;
    const fail = (message) => errors.push({ line: i + 1, message });

    const tokens = line.split(/\s+/);
    if (tokens.length !== 2) return fail('Expected "Name tabstring"');
    const [name, tab] = tokens;

    const parsed = parseTab(tab);
    if (!parsed.ok) return fail(parsed.error);
    const win = fretWindow(parsed.strings);
    if (!win.ok) return fail(win.error);
    if (chords.length >= capacity) {
      if (!pageFull) {
        fail(`Page full (${capacity} chords)`);
        pageFull = true;
      }
      return;
    }

    chords.push({ name, tab });
  });
  return { chords, errors };
}

// Converts a stored value into editor text, migrating the legacy JSON
// array format ([{name, tab}, ...]) the app used before the textarea UI.
export function storedToText(stored) {
  if (stored === null) return '';
  try {
    const parsed = JSON.parse(stored);
    if (
      Array.isArray(parsed) &&
      parsed.every((c) => typeof c?.name === 'string' && typeof c?.tab === 'string')
    ) {
      return parsed.map((c) => `${c.name} ${c.tab}`).join('\n');
    }
  } catch {
    // not JSON: already plain text
  }
  return stored;
}
