import { parseTab } from './parse.js';
import { fretWindow, PAGE_CAPACITY } from './layout.js';

// capacity may be a number, or a function of ({ hasHeader }) so the caller
// can shrink the page when a title/subtitle band is present.
export function textToChords(text, capacity = PAGE_CAPACITY) {
  const errors = [];
  const candidates = [];
  let title = null;
  let subtitle = null;

  text.split('\n').forEach((raw, i) => {
    const line = raw.trim();
    if (line === '') return;
    const fail = (message) => errors.push({ line: i + 1, message });

    if (line.startsWith('##')) {
      if (subtitle !== null) return fail('Subtitle already set');
      subtitle = line.slice(2).trim();
      return;
    }
    if (line.startsWith('#')) {
      if (title !== null) return fail('Title already set');
      title = line.slice(1).trim();
      return;
    }

    const tokens = line.split(/\s+/);
    let name;
    let tab;
    if (tokens.length === 1) {
      // A bare tabstring renders as a nameless chord.
      [tab] = tokens;
      name = '';
    } else if (tokens.length === 2) {
      [name, tab] = tokens;
    } else {
      return fail('Expected "Name tabstring"');
    }

    const parsed = parseTab(tab);
    if (!parsed.ok) {
      // A lone token that isn't a tabstring is most likely a name missing
      // its tabstring, so report the shape of the line, not the grammar.
      return fail(name === '' ? 'Expected "Name tabstring"' : parsed.error);
    }
    const win = fretWindow(parsed.strings);
    if (!win.ok) return fail(win.error);

    candidates.push({ line: i + 1, name, tab });
  });

  const max = typeof capacity === 'function'
    ? capacity({ hasHeader: title !== null || subtitle !== null })
    : capacity;

  const chords = candidates.slice(0, max).map(({ name, tab }) => ({ name, tab }));
  if (candidates.length > max) {
    errors.push({ line: candidates[max].line, message: `Page full (${max} chords)` });
    errors.sort((a, b) => a.line - b.line);
  }

  return { chords, errors, title, subtitle };
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
