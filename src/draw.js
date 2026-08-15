const NS = 'http://www.w3.org/2000/svg';
const FONT = 'Helvetica, Arial, sans-serif';

// Grid geometry inside the 135x120 viewBox
const LEFT = 30;
const RIGHT = 105;
const TOP = 32;
const BOTTOM = 107;
const STRING_GAP = (RIGHT - LEFT) / 5; // 15
const FRET_GAP = (BOTTOM - TOP) / 5;   // 15

export function drawChord(name, strings, baseFret) {
  const svg = el('svg', { viewBox: '0 0 135 120', xmlns: NS });

  // Chord name, auto-shrunk so long names stay inside the diagram width
  const fontSize = Math.max(7, 13 - Math.max(0, name.length - 6));
  svg.append(el('text', {
    x: 67.5, y: 16, 'text-anchor': 'middle', 'font-size': fontSize,
    'font-weight': 'bold', 'font-family': FONT,
  }, name));

  // Marker row: drawn shapes, not text glyphs, so the PDF export stays font-safe
  strings.forEach((s, i) => {
    const x = LEFT + i * STRING_GAP;
    const y = 26;
    if (s === 'x') {
      svg.append(el('line', { x1: x - 3, y1: y - 3, x2: x + 3, y2: y + 3, stroke: 'black', 'stroke-width': 1.2 }));
      svg.append(el('line', { x1: x - 3, y1: y + 3, x2: x + 3, y2: y - 3, stroke: 'black', 'stroke-width': 1.2 }));
    } else if (s === 0) {
      svg.append(el('circle', { cx: x, cy: y, r: 3.5, fill: 'none', stroke: 'black', 'stroke-width': 1.2 }));
    }
  });

  if (baseFret === 1) {
    svg.append(el('rect', { x: LEFT - 1, y: TOP - 3, width: RIGHT - LEFT + 2, height: 3, fill: 'black' }));
  } else {
    svg.append(el('text', {
      x: LEFT - 5, y: TOP + FRET_GAP / 2 + 3, 'text-anchor': 'end',
      'font-size': 9, 'font-family': FONT,
    }, `${baseFret}fr`));
  }

  for (let i = 0; i <= 5; i++) {
    const y = TOP + i * FRET_GAP;
    svg.append(el('line', { x1: LEFT, y1: y, x2: RIGHT, y2: y, stroke: 'black', 'stroke-width': 1 }));
  }
  for (let i = 0; i < 6; i++) {
    const x = LEFT + i * STRING_GAP;
    svg.append(el('line', { x1: x, y1: TOP, x2: x, y2: BOTTOM, stroke: 'black', 'stroke-width': 1 }));
  }

  strings.forEach((s, i) => {
    if (typeof s !== 'number' || s === 0) return;
    const x = LEFT + i * STRING_GAP;
    const y = TOP + (s - baseFret) * FRET_GAP + FRET_GAP / 2;
    svg.append(el('circle', { cx: x, cy: y, r: 5, fill: 'black' }));
  });

  return svg;
}

function el(tag, attrs, textContent) {
  const node = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  if (textContent !== undefined) node.textContent = textContent;
  return node;
}
