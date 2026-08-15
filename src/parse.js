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
