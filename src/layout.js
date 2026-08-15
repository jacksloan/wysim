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

export const COLUMNS = 4;
export const ROWS = 6;
export const PAGE_CAPACITY = COLUMNS * ROWS;

export const PAGE = { width: 612, height: 792, margin: 36 };
export const CELL = {
  width: (PAGE.width - 2 * PAGE.margin) / COLUMNS,
  height: (PAGE.height - 2 * PAGE.margin) / ROWS,
};

export const DENSITIES = {
  compact: { columns: 5 },
  normal: { columns: 4 },
  spacious: { columns: 3 },
};

export function gridFor(density) {
  const { columns } = DENSITIES[density] ?? DENSITIES.normal;
  const width = (PAGE.width - 2 * PAGE.margin) / columns;
  const height = width * (CELL.height / CELL.width);
  const rows = Math.floor((PAGE.height - 2 * PAGE.margin) / height);
  return {
    columns,
    rows,
    capacity: columns * rows,
    cell: { width, height },
    cellRect(index) {
      const col = index % columns;
      const row = Math.floor(index / columns);
      return {
        x: PAGE.margin + col * width,
        y: PAGE.margin + row * height,
        width,
        height,
      };
    },
  };
}

export function storedToDensity(stored) {
  try {
    const parsed = JSON.parse(stored);
    if (typeof parsed?.density === 'string' && parsed.density in DENSITIES) {
      return parsed.density;
    }
  } catch {
    // junk stored value: fall through to default
  }
  return 'normal';
}

export function cellRect(index) {
  const col = index % COLUMNS;
  const row = Math.floor(index / COLUMNS);
  return {
    x: PAGE.margin + col * CELL.width,
    y: PAGE.margin + row * CELL.height,
    width: CELL.width,
    height: CELL.height,
  };
}
