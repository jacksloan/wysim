import { describe, it, expect } from 'vitest';
import { fretWindow, cellRect, PAGE_CAPACITY, gridFor, storedToDensity } from '../src/layout.js';

describe('fretWindow', () => {
  it('keeps an open chord at base fret 1', () => {
    expect(fretWindow(['x', 3, 2, 0, 1, 0])).toEqual({ ok: true, baseFret: 1 });
  });

  it('keeps an all-open/muted shape at base fret 1', () => {
    expect(fretWindow(['x', 0, 0, 0, 0, 'x'])).toEqual({ ok: true, baseFret: 1 });
  });

  it('keeps a shape fitting frets 1-5 at base fret 1', () => {
    expect(fretWindow([1, 3, 5, 'x', 'x', 'x'])).toEqual({ ok: true, baseFret: 1 });
  });

  it('shifts to the lowest fretted fret when the shape exceeds fret 5', () => {
    expect(fretWindow(['x', 9, 7, 8, 9, 9])).toEqual({ ok: true, baseFret: 7 });
  });

  it('allows a span of exactly 5 frets', () => {
    expect(fretWindow([3, 'x', 'x', 'x', 'x', 7])).toEqual({ ok: true, baseFret: 3 });
  });

  it('errors when the span exceeds 5 frets', () => {
    expect(fretWindow([2, 'x', 'x', 'x', 'x', 7]))
      .toEqual({ ok: false, error: 'Shape spans more than 5 frets' });
  });
});

describe('cellRect', () => {
  it('places the first chord at the top-left margin', () => {
    expect(cellRect(0)).toEqual({ x: 36, y: 36, width: 135, height: 120 });
  });

  it('fills left to right along a row', () => {
    expect(cellRect(1)).toEqual({ x: 171, y: 36, width: 135, height: 120 });
  });

  it('wraps to a new row after 4 columns', () => {
    expect(cellRect(4)).toEqual({ x: 36, y: 156, width: 135, height: 120 });
  });

  it('places the last cell at the bottom-right', () => {
    expect(cellRect(23)).toEqual({ x: 441, y: 636, width: 135, height: 120 });
  });

  it('has a capacity of 24 chords', () => {
    expect(PAGE_CAPACITY).toBe(24);
  });
});

describe('gridFor', () => {
  it('normal matches the original 4x6 layout', () => {
    const grid = gridFor('normal');
    expect(grid.columns).toBe(4);
    expect(grid.rows).toBe(6);
    expect(grid.capacity).toBe(24);
    expect(grid.cell).toEqual({ width: 135, height: 120 });
    expect(grid.cellRect(0)).toEqual({ x: 36, y: 36, width: 135, height: 120 });
    expect(grid.cellRect(23)).toEqual({ x: 441, y: 636, width: 135, height: 120 });
  });

  it('compact fits 5 per row, 7 rows, 35 chords', () => {
    const grid = gridFor('compact');
    expect(grid.columns).toBe(5);
    expect(grid.rows).toBe(7);
    expect(grid.capacity).toBe(35);
    expect(grid.cell).toEqual({ width: 108, height: 96 });
    expect(grid.cellRect(5)).toEqual({ x: 36, y: 132, width: 108, height: 96 });
  });

  it('spacious fits 3 per row, 4 rows, 12 chords', () => {
    const grid = gridFor('spacious');
    expect(grid.columns).toBe(3);
    expect(grid.rows).toBe(4);
    expect(grid.capacity).toBe(12);
    expect(grid.cell).toEqual({ width: 180, height: 160 });
    expect(grid.cellRect(11)).toEqual({ x: 396, y: 516, width: 180, height: 160 });
  });

  it('falls back to normal for an unknown density', () => {
    expect(gridFor('bogus').columns).toBe(4);
  });
});

describe('gridFor with a header band', () => {
  it('normal loses one row to the header', () => {
    const grid = gridFor('normal', { header: true });
    expect(grid.rows).toBe(5);
    expect(grid.capacity).toBe(20);
    expect(grid.cell).toEqual({ width: 135, height: 120 });
    expect(grid.cellRect(0)).toEqual({ x: 36, y: 92, width: 135, height: 120 });
  });

  it('compact loses one row to the header', () => {
    const grid = gridFor('compact', { header: true });
    expect(grid.rows).toBe(6);
    expect(grid.capacity).toBe(30);
    expect(grid.cellRect(0).y).toBe(92);
  });

  it('spacious keeps all four rows under the header', () => {
    const grid = gridFor('spacious', { header: true });
    expect(grid.rows).toBe(4);
    expect(grid.capacity).toBe(12);
    expect(grid.cellRect(0).y).toBe(92);
  });

  it('no header option matches the plain call', () => {
    const a = gridFor('normal', { header: false });
    const b = gridFor('normal');
    expect([a.columns, a.rows, a.capacity, a.cell, a.cellRect(0)])
      .toEqual([b.columns, b.rows, b.capacity, b.cell, b.cellRect(0)]);
  });
});

describe('storedToDensity', () => {
  it('reads a stored density', () => {
    expect(storedToDensity('{"density":"compact"}')).toBe('compact');
    expect(storedToDensity('{"density":"spacious"}')).toBe('spacious');
  });

  it('falls back to normal for null, junk, or unknown values', () => {
    expect(storedToDensity(null)).toBe('normal');
    expect(storedToDensity('garbage')).toBe('normal');
    expect(storedToDensity('{"density":"huge"}')).toBe('normal');
    expect(storedToDensity('{}')).toBe('normal');
  });
});
