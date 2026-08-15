import { describe, it, expect } from 'vitest';
import { fretWindow, cellRect, PAGE_CAPACITY } from '../src/layout.js';

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
