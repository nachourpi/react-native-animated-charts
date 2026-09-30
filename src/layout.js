/**
 * Pure helpers (no React / RN imports) so they can be unit-tested in isolation.
 */

export const DEFAULT_HEIGHT = 200;
export const VALUE_LABEL_SPACE = 24;
export const X_LABEL_SPACE = 22;

const toFinitePositive = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

/**
 * Converts raw data into bar heights (in px) for a plot area.
 *
 * @param {number[]} data raw values. Negative / non-numeric values are treated as 0.
 * @param {number} plotHeight available height (px) for the tallest bar.
 * @param {number} [maxValue] optional fixed scale. Defaults to max(data).
 * @returns {number[]} bar heights in px, each in [0, plotHeight].
 */
export function computeBarHeights(data, plotHeight, maxValue) {
  if (!Array.isArray(data) || data.length === 0) return [];
  const values = data.map(toFinitePositive);
  const scale = toFinitePositive(maxValue) || Math.max(...values) || 1;
  const h = Math.max(0, plotHeight || 0);
  return values.map((v) => Math.min(h, Math.round((v / scale) * h)));
}

/**
 * Horizontal margin (in %) applied on each side of every bar.
 * Kept compatible with 0.0.x: 100 / (n * 4).
 */
export function computeBarMargin(count) {
  const n = count > 0 ? count : 1;
  return Math.max(0.05, 100 / (n * 4));
}

export function resolveColor(color, value, index) {
  if (typeof color === 'function') return color(value, index);
  if (Array.isArray(color)) return color.length ? color[index % color.length] : undefined;
  return color;
}

/** Delay (ms) before a bar starts animating. */
export function computeDelay(mode, index, count, stagger = 60) {
  if (typeof mode === 'number') return mode * index;
  switch (mode) {
    case 'none':
      return 0;
    case 'stagger':
      return index * stagger;
    case 'random':
    default:
      return Math.round(Math.random() * Math.min(400, 80 * Math.max(count, 1)));
  }
}
