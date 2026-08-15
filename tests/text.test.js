import { describe, it, expect } from 'vitest';
import { textToChords, storedToText } from '../src/text.js';

describe('textToChords', () => {
  it('parses one chord per line as "Name tabstring"', () => {
    expect(textToChords('Am7 5X5555\nBm7 7X7777')).toEqual({
      chords: [
        { name: 'Am7', tab: '5X5555' },
        { name: 'Bm7', tab: '7X7777' },
      ],
      errors: [],
    });
  });

  it('accepts comma-form tabstrings as a single token', () => {
    expect(textToChords('F#m/C# x,9,7,8,9,9')).toEqual({
      chords: [{ name: 'F#m/C#', tab: 'x,9,7,8,9,9' }],
      errors: [],
    });
  });

  it('ignores blank lines and surrounding whitespace', () => {
    expect(textToChords('\n  Am x02210  \n\n')).toEqual({
      chords: [{ name: 'Am', tab: 'x02210' }],
      errors: [],
    });
  });

  it('returns an empty result for empty text', () => {
    expect(textToChords('')).toEqual({ chords: [], errors: [] });
  });

  it('reports a line with the wrong number of tokens', () => {
    expect(textToChords('Am')).toEqual({
      chords: [],
      errors: [{ line: 1, message: 'Expected "Name tabstring"' }],
    });
    expect(textToChords('A minor x02210').errors).toEqual([
      { line: 1, message: 'Expected "Name tabstring"' },
    ]);
  });

  it('reports tabstring grammar errors with the line number', () => {
    expect(textToChords('Am x02210\nC x3201')).toEqual({
      chords: [{ name: 'Am', tab: 'x02210' }],
      errors: [{ line: 2, message: 'Expected 6 strings (low E to high E)' }],
    });
  });

  it('reports span errors with the line number', () => {
    expect(textToChords('Bad 2xxxx7')).toEqual({
      chords: [],
      errors: [{ line: 1, message: 'Shape spans more than 5 frets' }],
    });
  });

  it('keeps valid lines when other lines are invalid', () => {
    const result = textToChords('Am x02210\noops\nC x32010');
    expect(result.chords).toEqual([
      { name: 'Am', tab: 'x02210' },
      { name: 'C', tab: 'x32010' },
    ]);
    expect(result.errors).toEqual([
      { line: 2, message: 'Expected "Name tabstring"' },
    ]);
  });

  it('skips chords past capacity with a page-full error', () => {
    const lines = Array.from({ length: 25 }, (_, i) => `C${i} x32010`);
    const result = textToChords(lines.join('\n'));
    expect(result.chords).toHaveLength(24);
    expect(result.chords[23]).toEqual({ name: 'C23', tab: 'x32010' });
    expect(result.errors).toEqual([
      { line: 25, message: 'Page full (24 chords)' },
    ]);
  });

  it('reports a single page-full error no matter how many lines overflow', () => {
    const lines = Array.from({ length: 27 }, (_, i) => `C${i} x32010`);
    const result = textToChords(lines.join('\n'));
    expect(result.chords).toHaveLength(24);
    expect(result.errors).toEqual([
      { line: 25, message: 'Page full (24 chords)' },
    ]);
  });

  it('respects a custom capacity', () => {
    const result = textToChords('Am x02210\nC x32010\nG 320003', 2);
    expect(result.chords).toHaveLength(2);
    expect(result.errors).toEqual([
      { line: 3, message: 'Page full (2 chords)' },
    ]);
  });
});

describe('storedToText', () => {
  it('converts the legacy JSON array format to text lines', () => {
    const legacy = JSON.stringify([
      { name: 'Am', tab: 'x02210' },
      { name: 'G', tab: '320003' },
    ]);
    expect(storedToText(legacy)).toBe('Am x02210\nG 320003');
  });

  it('returns plain text unchanged', () => {
    expect(storedToText('Am x02210\nG 320003')).toBe('Am x02210\nG 320003');
  });

  it('returns empty string for null (nothing stored)', () => {
    expect(storedToText(null)).toBe('');
  });

  it('falls back to raw text when a JSON array has malformed entries', () => {
    expect(storedToText('["foo"]')).toBe('["foo"]');
    expect(storedToText('[{"name":"Am"}]')).toBe('[{"name":"Am"}]');
  });

  it('falls back to raw text for JSON that is not an array', () => {
    expect(storedToText('{"name":"Am"}')).toBe('{"name":"Am"}');
  });
});
