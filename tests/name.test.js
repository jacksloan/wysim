import { describe, it, expect } from 'vitest';
import { detectName, storedToAutoName } from '../src/name.js';

describe('detectName', () => {
  it('names common open chords', () => {
    expect(detectName('x02210')).toBe('Am');
    expect(detectName('x32010')).toBe('C');
    expect(detectName('320003')).toBe('G');
    expect(detectName('022100')).toBe('E');
    expect(detectName('xx0231')).toBe('Dm');
  });

  it('names sevenths and extensions', () => {
    expect(detectName('x02010')).toBe('Am7');
    expect(detectName('xx0212')).toBe('D7');
    expect(detectName('x32030')).toBe('Cadd9');
    expect(detectName('xx3210')).toBe('Fmaj7');
    expect(detectName('x02200')).toBe('Asus2');
  });

  it('names barres the same at any fret', () => {
    expect(detectName('x,10,12,12,12,10')).toBe('G');
    expect(detectName('133211')).toBe('F');
  });

  it('names power chords and fifthless voicings', () => {
    expect(detectName('577xxx')).toBe('A5');
    expect(detectName('5x565x')).toBe('A7');
  });

  it('prefers the conventional name over a no5 spelling', () => {
    expect(detectName('x32310')).toBe('C7');
  });

  it('returns null instead of a garbage jazz name', () => {
    expect(detectName('x54035')).toBe(null);
  });

  it('returns null when there are no sounding notes', () => {
    expect(detectName('xxxxxx')).toBe(null);
  });

  it('returns null for an invalid tabstring', () => {
    expect(detectName('abc')).toBe(null);
  });
});

describe('storedToAutoName', () => {
  it('reads a stored boolean', () => {
    expect(storedToAutoName('{"autoName":false}')).toBe(false);
    expect(storedToAutoName('{"density":"compact","autoName":true}')).toBe(true);
  });

  it('defaults to true for null, junk, or missing key', () => {
    expect(storedToAutoName(null)).toBe(true);
    expect(storedToAutoName('garbage')).toBe(true);
    expect(storedToAutoName('{"density":"normal"}')).toBe(true);
  });
});
