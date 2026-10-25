import type { CloudTerm } from '../api/research';

export type PlacedWord = { text: string; value: number; cx: number; cy: number; size: number; width: number; height: number; color: string };
export type Measure = (text: string, size: number) => number;

/** Small words use the sans face (easier to read), larger ones the serif used for headings across the site. */
export const fontFor = (size: number) => size < 22
  ? { family: '"DM Sans", system-ui, sans-serif', weight: 500 }
  : { family: '"DM Serif Display", Georgia, serif', weight: 400 };

const BIG_COLORS = ['#b8324a', '#40232b', '#d9573f', '#c4455c'];
const SMALL_COLORS = ['#40232b', '#7a2f3f', '#b8324a'];
const PAD = 3;

/**
 * Places words on a spiral from the centre outwards, biggest first, skipping any spot that
 * overlaps an earlier word or leaves the canvas. Words that cannot fit are dropped.
 */
export function layoutCloud(terms: CloudTerm[], width: number, height: number, measure: Measure): PlacedWord[] {
  if (!terms.length || width < 120 || height < 120) return [];
  const sorted = [...terms].sort((a, b) => b.value - a.value);
  const max = sorted[0].value;
  const min = sorted[sorted.length - 1].value;
  const maxSize = Math.min(72, width * 0.085);
  const minSize = width < 520 ? 12 : 13;
  const placed: PlacedWord[] = [];
  const centreX = width / 2;
  const centreY = height / 2;
  const squash = Math.min(1, (height / width) * 1.35);

  sorted.forEach((term, index) => {
    const ratio = max === min ? 1 : (term.value - min) / (max - min);
    let size = minSize + Math.pow(ratio, 0.65) * (maxSize - minSize);
    while (size >= minSize) {
      const boxWidth = measure(term.text, size) + PAD * 2;
      const boxHeight = size * 1.05 + PAD * 2;
      let angle = 0;
      let radius = 0;
      let found: { x: number; y: number } | null = null;
      for (let step = 0; step < 9000 && radius < width * 0.62; step++) {
        const x = centreX + radius * Math.cos(angle);
        const y = centreY + radius * Math.sin(angle) * squash;
        const inside = x - boxWidth / 2 >= 0 && x + boxWidth / 2 <= width && y - boxHeight / 2 >= 0 && y + boxHeight / 2 <= height;
        if (inside && !placed.some(other => Math.abs(x - other.cx) < (boxWidth + other.width) / 2 && Math.abs(y - other.cy) < (boxHeight + other.height) / 2)) {
          found = { x, y };
          break;
        }
        angle += 5 / Math.max(radius, 6);
        radius = 3 * angle;
      }
      if (found) {
        const palette = size >= 26 ? BIG_COLORS : SMALL_COLORS;
        placed.push({ text: term.text, value: term.value, cx: found.x, cy: found.y, size, width: boxWidth, height: boxHeight, color: palette[index % palette.length] });
        break;
      }
      size *= 0.86;
    }
  });
  return placed;
}

/** Canvas-based text measurer (browser only). */
export function createMeasurer(): Measure {
  const context = document.createElement('canvas').getContext('2d');
  return (text, size) => {
    if (!context) return text.length * size * 0.52;
    const font = fontFor(size);
    context.font = `${font.weight} ${size}px ${font.family}`;
    return context.measureText(text).width;
  };
}
