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
