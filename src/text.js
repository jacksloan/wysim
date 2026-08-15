import { parseTab } from './parse.js';
import { fretWindow, PAGE_CAPACITY } from './layout.js';

export function textToChords(text) {
  const chords = [];
  const errors = [];
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
    if (chords.length >= PAGE_CAPACITY) return fail(`Page full (${PAGE_CAPACITY} chords)`);

    chords.push({ name, tab });
  });
  return { chords, errors };
}
