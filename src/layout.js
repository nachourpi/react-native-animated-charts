/**
 * Pure helpers (no React / RN imports) so they can be unit-tested in isolation.
 */

export const DEFAULT_HEIGHT = 200;
export const VALUE_LABEL_SPACE = 24;
export const X_LABEL_SPACE = 22;

/** Any value → finite number (NaN, null, strings that aren't numbers → 0). */
export const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

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
 * Evenly spaced, "nice" axis ticks that always include 0 (e.g. -200, 0, 200, 400).
 *
 * `count` is a target, like d3's ticks(): the result may have a few more or fewer
 * intervals so the step stays a round number (1, 2 or 5 × 10^k).
 * With a fixed `maxValue` and/or `minValue` the scale is kept and split into
 * exactly `count` intervals.
 *
 * @param {number[]} data values (or just the [min, max] bounds) to cover.
 * @returns {number[]} ascending ticks; first and last are the ends of the scale.
 */
export function computeTicks(data, count = 4, fixedMax, fixedMin) {
  const n = Math.max(1, Math.round(Number(count)) || 4);
  const values = Array.isArray(data) ? data.map(toNumber) : [];
  const fMax = toFinitePositive(fixedMax) || null;
  const fMin = Number.isFinite(Number(fixedMin)) && Number(fixedMin) < 0 ? Number(fixedMin) : null;
  let hi = fMax != null ? fMax : Math.max(0, ...values);
  const lo = fMin != null ? fMin : Math.min(0, ...values);

  if (fMax != null || fMin != null) {
    if (hi <= lo) hi = lo + 1;
    return Array.from({ length: n + 1 }, (_, i) => roundFloat(lo + ((hi - lo) * i) / n));
  }

  if (hi === lo) hi = 1;
  const raw = (hi - lo) / n;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const err = raw / mag;
  const step = mag * (err >= Math.sqrt(50) ? 10 : err >= Math.sqrt(10) ? 5 : err >= Math.sqrt(2) ? 2 : 1);
  const first = Math.floor(roundFloat(lo / step));
  const last = Math.max(first + 1, Math.ceil(roundFloat(hi / step)));
  return Array.from({ length: last - first + 1 }, (_, i) => roundFloat((first + i) * step));
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

export const DEFAULT_PALETTE = ['#4f7cbd', '#e07a3a', '#3aa76d', '#8e6fd1', '#d9534f', '#e0a526'];
/** Default slot size (px) per category when a horizontal chart sizes itself. */
export const H_AUTO_SLOT = 32;

/**
 * Normalizes `series` (or the single `dataY` array) into a category × series matrix.
 * @returns {{ list: object[], count: number, values: number[][] }}
 */
export function normalizeSeries(series, dataY) {
  const list = Array.isArray(series) && series.length ? series : [{ data: dataY }];
  const lengths = list.map((s) => (s && Array.isArray(s.data) ? s.data.length : 0));
  const count = Math.max(0, ...lengths);
  const values = Array.from({ length: count }, (_, i) => list.map((s) => toNumber(s && s.data ? s.data[i] : 0)));
  return { list, count, values };
}

/**
 * Ends of the value scale: always spans 0, grows to cover the data (sums when stacked),
 * and honors fixed `maxValue` (> 0) / `minValue` (< 0).
 * @returns {{ lo: number, hi: number }} lo <= 0 < hi
 */
export function computeBounds(values, { stacked = false, maxValue, minValue } = {}) {
  let dataHi = 0;
  let dataLo = 0;
  (values || []).forEach((vals) => {
    const pos = stacked ? vals.reduce((a, v) => a + Math.max(0, v), 0) : Math.max(0, ...vals);
    const neg = stacked ? vals.reduce((a, v) => a + Math.min(0, v), 0) : Math.min(0, ...vals);
    dataHi = Math.max(dataHi, pos);
    dataLo = Math.min(dataLo, neg);
  });
  const fMax = toFinitePositive(maxValue);
  const fMin = Number(minValue);
  const hi = fMax || dataHi;
  const lo = Number.isFinite(fMin) && fMin < 0 ? fMin : dataLo;
  return { lo, hi: hi > 0 || lo < 0 ? hi : 1 };
}

/**
 * Pixel geometry of one category (slot).
 *
 * `posLength` / `negLength` are the px lengths of the regions above / below the baseline.
 * Every series gets a positive and a negative segment (one of them 0) so a bar can change
 * sign smoothly. When stacked, each non-empty segment spans from the baseline to its cumulative
 * end and is drawn behind the previous series (painter's order), so segments never overlap visually.
 *
 * @returns {{ bars: {pos:number,neg:number,posRadius:boolean,negRadius:boolean}[],
 *             anchor: {series:number, side:'pos'|'neg', length:number}, total:number }}
 */
export function computeSlot(vals, { stacked = false, lo, hi, posLength, negLength }) {
  const P = Math.max(0, posLength || 0);
  const N = Math.max(0, negLength || 0);
  const scalePos = (v) => (hi > 0 ? Math.round(Math.min(P, (v / hi) * P)) : 0);
  const scaleNeg = (v) => (lo < 0 && v < 0 ? Math.round(Math.min(N, (v / lo) * N)) : 0);
  const total = vals.reduce((a, v) => a + v, 0);
  if (!vals.length) return { bars: [], anchor: { series: 0, side: 'pos', length: 0 }, total };
  let bars;
  let anchor;

  if (stacked) {
    let cp = 0;
    let cn = 0;
    let lastPos = -1;
    let lastNeg = -1;
    bars = vals.map((v, s) => {
      if (v > 0) {
        cp += v;
        lastPos = s;
      } else if (v < 0) {
        cn += v;
        lastNeg = s;
      }
      // A series that adds nothing in a direction draws nothing there: a segment sharing the
      // outer end but with square corners would peek out behind the rounded top one.
      return { pos: v > 0 ? scalePos(cp) : 0, neg: v < 0 ? scaleNeg(cn) : 0 };
    });
    bars.forEach((b, s) => {
      b.posRadius = s === lastPos;
      b.negRadius = s === lastNeg;
    });
    anchor = total >= 0 || lastNeg < 0 ? { series: Math.max(0, lastPos), side: 'pos' } : { series: lastNeg, side: 'neg' };
  } else {
    bars = vals.map((v) => ({
      pos: v > 0 ? scalePos(v) : 0,
      neg: v < 0 ? scaleNeg(v) : 0,
      posRadius: true,
      negRadius: true,
    }));
    if (vals.length === 1) {
      anchor = { series: 0, side: vals[0] < 0 ? 'neg' : 'pos' };
    } else {
      const best = (side) => bars.reduce((b, bar, s) => (bar[side] > bars[b][side] ? s : b), 0);
      const p = best('pos');
      const n = best('neg');
      anchor = bars[p].pos > 0 || !(bars[n].neg > 0) ? { series: p, side: 'pos' } : { series: n, side: 'neg' };
    }
  }
  anchor.length = bars[anchor.series][anchor.side];
  return { bars, anchor, total };
}

/**
 * Where to draw a tooltip relative to its bar end: 'outside' (beyond the end) when it fits,
 * otherwise 'inside' (over the bar). Vertical charts check the free space above/below the
 * end; horizontal ones use half the region since the tooltip width isn't known up front.
 */
export function tooltipPlacement({ horizontal, length, regionLength, extraSpace = 0, lines = 1 }) {
  if (horizontal) return length > regionLength / 2 ? 'inside' : 'outside';
  const free = extraSpace + regionLength - length;
  return free >= lines * 16 + 6 ? 'outside' : 'inside';
}

/** Height (px) a horizontal chart gives itself when no height / flex is set. */
export function computeAutoHeight(count, { seriesCount = 1, stacked = false, extra = 0 } = {}) {
  const perSlot = stacked || seriesCount <= 1 ? H_AUTO_SLOT : Math.max(H_AUTO_SLOT, 12 * seriesCount + 12);
  return Math.max(40, Math.round(count * perSlot + extra));
}

/**
 * Animation timing for one segment. When a bar changes sign, the old side first shrinks to 0
 * (first half) and then the new side grows (second half), so the bar end crosses the baseline
 * instead of both sides animating at once.
 */
export function segmentTiming(prev, next, side, duration, delay) {
  const other = side === 'pos' ? 'neg' : 'pos';
  const crossing = prev && ((prev[other] > 0 && next[side] > 0) || (prev[side] > 0 && next[other] > 0));
  if (!crossing || !(duration > 0)) return { duration, delay };
  const half = Math.round(duration / 2);
  return next[side] > 0 ? { duration: half, delay: delay + half } : { duration: half, delay };
}

/** Relative heights (0–1) of the placeholder bars shown while `loading`. */
export const SKELETON_PATTERN = [0.55, 0.8, 0.45, 0.95, 0.65, 0.35, 0.75, 0.5];

/**
 * Category indexes in display order for `sort`: by metric, 'desc' (largest first) or 'asc'.
 * Stable: ties keep their original order.
 */
export function computeOrder(metrics, direction = 'desc') {
  const dir = direction === 'asc' ? 1 : -1;
  return metrics
    .map((m, i) => [toNumber(m), i])
    .sort((a, b) => (a[0] === b[0] ? a[1] - b[1] : dir * (a[0] - b[0])))
    .map(([, i]) => i);
}

/** Stable React keys from ids that may repeat or be missing (repeats get a `#n` suffix). */
export function uniqueKeys(ids) {
  const seen = {};
  return ids.map((id, i) => {
    const base = id == null || id === '' ? `#${i}` : String(id);
    seen[base] = (seen[base] || 0) + 1;
    return seen[base] > 1 ? `${base}#${seen[base]}` : base;
  });
}

/**
 * Bar slot under a finger position along the category axis (px from the plot start),
 * clamped to [0, count - 1]. `offset` is the empty space before the first slot.
 */
export function scrubIndex(position, { offset = 0, pitch, count }) {
  if (!(count > 0) || !(pitch > 0)) return null;
  const i = Math.floor((position - offset) / pitch);
  return Math.min(count - 1, Math.max(0, i));
}
