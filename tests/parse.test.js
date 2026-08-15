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
