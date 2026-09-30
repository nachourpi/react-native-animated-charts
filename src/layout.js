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

/** Space (px) reserved at the end of horizontal bars for value labels / tooltips. */
export const H_VALUE_LABEL_SPACE = 56;
/** Height (px) of the value-axis row under horizontal charts. */
export const H_AXIS_SPACE = 18;
/** Line height (px) of y-axis labels; used to center them on grid lines. */
export const Y_LABEL_HEIGHT = 14;

const roundFloat = (n) => Number(n.toFixed(10));

/**
 * Evenly spaced, "nice" axis ticks starting at 0 (e.g. 0, 100, ..., 500).
 *
 * `count` is a target, like d3's ticks(): the result may have a few more or fewer
 * intervals so the step stays a round number (1, 2 or 5 × 10^k).
 * With `fixedMax` the scale is kept and split into exactly `count` intervals.
 *
 * @returns {number[]} ascending ticks; the last one is the top of the scale.
 */
export function computeTicks(data, count = 4, fixedMax) {
  const n = Math.max(1, Math.round(Number(count)) || 4);
  const fixed = toFinitePositive(fixedMax);
  if (fixed) return Array.from({ length: n + 1 }, (_, i) => roundFloat((fixed * i) / n));

  const values = Array.isArray(data) ? data.map(toFinitePositive) : [];
  const max = values.length ? Math.max(...values) : 0;
  const top = max > 0 ? max : 1;

  const raw = top / n;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const err = raw / mag;
  const step = mag * (err >= Math.sqrt(50) ? 10 : err >= Math.sqrt(10) ? 5 : err >= Math.sqrt(2) ? 2 : 1);
  const intervals = Math.max(1, Math.ceil(roundFloat(top / step)));
  return Array.from({ length: intervals + 1 }, (_, i) => roundFloat(i * step));
}

/**
 * Vertical layout of horizontal bars: each bar gets an equal slot and
 * `gapRatio` of the slot is left empty (split above and below the bar).
 */
export function computeRowLayout(count, height, gapRatio = 0.4) {
  const n = count > 0 ? count : 1;
  const slot = Math.max(0, height || 0) / n;
  const gap = slot * Math.min(0.9, Math.max(0, gapRatio));
  return { slot, thickness: slot - gap, margin: gap / 2 };
}

/**
 * Selected bar index, honoring controlled (`selectedIndex` prop) over internal state.
 * Returns null when nothing is selected or the index is out of range.
 */
export function resolveSelectedIndex(controlled, internal, count) {
  const idx = controlled !== undefined ? controlled : internal;
  return Number.isInteger(idx) && idx >= 0 && idx < count ? idx : null;
}
