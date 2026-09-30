import {
  computeAutoHeight,
  computeBarHeights,
  computeBarMargin,
  computeBounds,
  computeSlot,
  computeDelay,
  computeOrder,
  computeRowLayout,
  computeTicks,
  resolveColor,
  normalizeSeries,
  resolveSelectedIndex,
  scrubIndex,
  segmentTiming,
  tooltipPlacement,
  uniqueKeys,
} from '../src/layout';

describe('computeBarHeights', () => {
  it('scales to the max value', () => {
    expect(computeBarHeights([10, 5, 0], 100)).toEqual([100, 50, 0]);
  });
  it('uses a fixed maxValue and clamps overflow', () => {
    expect(computeBarHeights([5, 20], 100, 10)).toEqual([50, 100]);
  });
  it('treats negatives / NaN / strings safely', () => {
    expect(computeBarHeights([-5, NaN, '4', null, 8], 80)).toEqual([0, 0, 40, 0, 80]);
  });
  it('handles empty and all-zero data', () => {
    expect(computeBarHeights([], 100)).toEqual([]);
    expect(computeBarHeights([0, 0], 100)).toEqual([0, 0]);
    expect(computeBarHeights(undefined, 100)).toEqual([]);
  });
});

describe('helpers', () => {
  it('margin keeps the 0.0.x formula', () => {
    expect(computeBarMargin(5)).toBe(5);
    expect(computeBarMargin(0)).toBe(25);
  });
  it('resolveColor supports string, palette and function', () => {
    expect(resolveColor('red', 1, 0)).toBe('red');
    expect(resolveColor(['a', 'b'], 1, 3)).toBe('b');
    expect(resolveColor((v) => (v > 2 ? 'hi' : 'lo'), 3, 0)).toBe('hi');
  });
  it('computeDelay modes', () => {
    expect(computeDelay('none', 3, 5)).toBe(0);
    expect(computeDelay('stagger', 3, 5)).toBe(180);
    expect(computeDelay(100, 2, 5)).toBe(200);
    const r = computeDelay('random', 0, 5);
    expect(r).toBeGreaterThanOrEqual(0);
    expect(r).toBeLessThanOrEqual(400);
  });
});

describe('computeTicks', () => {
  it('picks round steps and covers the max', () => {
    expect(computeTicks([120, 340, 90, 260, 410, 180], 4)).toEqual([0, 100, 200, 300, 400, 500]);
    expect(computeTicks([95, 40, 72], 4)).toEqual([0, 20, 40, 60, 80, 100]);
    expect(computeTicks([7], 4)).toEqual([0, 2, 4, 6, 8]);
  });
  it('handles decimals without float noise', () => {
    expect(computeTicks([0.3], 3)).toEqual([0, 0.1, 0.2, 0.3]);
  });
  it('splits a fixed maxValue into exactly `count` intervals', () => {
    expect(computeTicks([5, 9], 4, 100)).toEqual([0, 25, 50, 75, 100]);
  });
  it('survives empty / zero / invalid data and counts', () => {
    expect(computeTicks([], 4)).toEqual([0, 0.2, 0.4, 0.6, 0.8, 1]);
    expect(computeTicks([0, NaN, 'x'], 2)).toEqual([0, 0.5, 1]);
    expect(computeTicks([10], 0).length).toBeGreaterThan(1);
  });
});

describe('computeRowLayout', () => {
  it('splits height into slots with a gap', () => {
    expect(computeRowLayout(4, 200, 0.4)).toEqual({ slot: 50, thickness: 30, margin: 10 });
  });
  it('is safe with no bars / no height', () => {
    expect(computeRowLayout(0, 100).slot).toBe(100);
    expect(computeRowLayout(3, undefined)).toEqual({ slot: 0, thickness: 0, margin: 0 });
  });
});

describe('resolveSelectedIndex', () => {
  it('prefers the controlled value, even null', () => {
    expect(resolveSelectedIndex(1, 2, 3)).toBe(1);
    expect(resolveSelectedIndex(null, 2, 3)).toBeNull();
    expect(resolveSelectedIndex(undefined, 2, 3)).toBe(2);
  });
  it('ignores out-of-range and non-integer indexes', () => {
    expect(resolveSelectedIndex(5, null, 3)).toBeNull();
    expect(resolveSelectedIndex(-1, null, 3)).toBeNull();
    expect(resolveSelectedIndex(1.5, null, 3)).toBeNull();
  });
});

describe('public exports', () => {
  it('exposes computeTicks from the package entry', () => {
    // eslint-disable-next-line global-require
    expect(require('../src').computeTicks([410], 4)).toEqual([0, 100, 200, 300, 400, 500]);
  });
});

describe('negative values', () => {
  it('ticks span below zero and always include 0', () => {
    expect(computeTicks([-120, 340], 4)).toEqual([-200, -100, 0, 100, 200, 300, 400]);
    expect(computeTicks([-30, -80], 4)).toEqual([-80, -60, -40, -20, 0]);
    expect(computeTicks([0, -3, NaN], 2)).toEqual([-4, -2, 0]);
  });
  it('fixed min/max split exactly', () => {
    expect(computeTicks([5], 4, 100, -100)).toEqual([-100, -50, 0, 50, 100]);
    expect(computeTicks([-50, 10], 2, undefined, -100)).toEqual([-100, -45, 10]);
  });
  it('bounds cover data, sums when stacked, and fixed ends', () => {
    expect(computeBounds([[3, -2], [1, 4]])).toEqual({ lo: -2, hi: 4 });
    expect(computeBounds([[3, -2], [1, 4]], { stacked: true })).toEqual({ lo: -2, hi: 5 });
    expect(computeBounds([[3]], { maxValue: 10, minValue: -5 })).toEqual({ lo: -5, hi: 10 });
    expect(computeBounds([[3]], { minValue: 5 })).toEqual({ lo: 0, hi: 3 });
    expect(computeBounds([[-4]])).toEqual({ lo: -4, hi: 0 });
    expect(computeBounds([[0]])).toEqual({ lo: 0, hi: 1 });
  });
});

describe('normalizeSeries', () => {
  it('turns dataY or series into a category × series matrix', () => {
    expect(normalizeSeries(null, [1, '2', NaN]).values).toEqual([[1], [2], [0]]);
    const r = normalizeSeries([{ data: [1, 2, 3] }, { data: [4] }, null]);
    expect(r.count).toBe(3);
    expect(r.values).toEqual([[1, 4, 0], [2, 0, 0], [3, 0, 0]]);
  });
});

describe('computeSlot', () => {
  const g = { lo: -20, hi: 50, posLength: 100, negLength: 40 };
  it('grouped: one bar per series on its own side', () => {
    const { bars, anchor } = computeSlot([30, -20, 10], g);
    expect(bars.map((b) => [b.pos, b.neg])).toEqual([[60, 0], [0, 40], [20, 0]]);
    expect(anchor).toEqual({ series: 0, side: 'pos', length: 60 });
  });
  it('grouped: anchors on the most negative bar when nothing is positive', () => {
    expect(computeSlot([-5, -20], g).anchor).toEqual({ series: 1, side: 'neg', length: 40 });
  });
  it('single series anchors by sign', () => {
    expect(computeSlot([-10], g).anchor).toEqual({ series: 0, side: 'neg', length: 20 });
    expect(computeSlot([0], g).anchor.side).toBe('pos');
  });
  it('stacked: cumulative ends per direction, radius only on the outer segments', () => {
    const { bars, anchor, total } = computeSlot([30, 20, -10], { ...g, stacked: true });
    expect(bars.map((b) => [b.pos, b.neg])).toEqual([[60, 0], [100, 0], [0, 20]]);
    expect(bars.map((b) => [b.posRadius, b.negRadius])).toEqual([[false, false], [true, false], [false, true]]);
    expect(anchor).toEqual({ series: 1, side: 'pos', length: 100 });
    expect(total).toBe(40);
  });
  it('stacked: anchors below the baseline when the total is negative', () => {
    expect(computeSlot([5, -20], { ...g, stacked: true }).anchor).toEqual({ series: 1, side: 'neg', length: 40 });
  });
  it('clamps values beyond fixed bounds and survives empty slots', () => {
    expect(computeSlot([500, -500], g).bars.map((b) => [b.pos, b.neg])).toEqual([[100, 0], [0, 40]]);
    expect(computeSlot([], g).bars).toEqual([]);
  });
});

describe('tooltipPlacement', () => {
  it('vertical: outside when the tooltip fits past the bar end', () => {
    expect(tooltipPlacement({ length: 190, regionLength: 200, extraSpace: 24 })).toBe('outside');
    expect(tooltipPlacement({ length: 200, regionLength: 200, extraSpace: 24, lines: 3 })).toBe('inside');
  });
  it('horizontal: inside for bars longer than half the region', () => {
    expect(tooltipPlacement({ horizontal: true, length: 160, regionLength: 300 })).toBe('inside');
    expect(tooltipPlacement({ horizontal: true, length: 100, regionLength: 300 })).toBe('outside');
  });
});

describe('computeAutoHeight', () => {
  it('grows with the number of categories and grouped series', () => {
    expect(computeAutoHeight(5)).toBe(160);
    expect(computeAutoHeight(15)).toBe(480);
    expect(computeAutoHeight(5, { seriesCount: 3 })).toBe(240);
    expect(computeAutoHeight(5, { seriesCount: 3, stacked: true, extra: 18 })).toBe(178);
    expect(computeAutoHeight(0)).toBe(40);
  });
});

describe('segmentTiming', () => {
  it('keeps timing when the sign does not change', () => {
    expect(segmentTiming({ pos: 10, neg: 0 }, { pos: 50, neg: 0 }, 'pos', 300, 40)).toEqual({ duration: 300, delay: 40 });
    expect(segmentTiming(null, { pos: 50, neg: 0 }, 'pos', 300, 0)).toEqual({ duration: 300, delay: 0 });
  });
  it('shrinks the old side first, then grows the new one', () => {
    const prev = { pos: 40, neg: 0 };
    const next = { pos: 0, neg: 20 };
    expect(segmentTiming(prev, next, 'pos', 300, 40)).toEqual({ duration: 150, delay: 40 });
    expect(segmentTiming(prev, next, 'neg', 300, 40)).toEqual({ duration: 150, delay: 190 });
  });
  it('does nothing special without animation', () => {
    expect(segmentTiming({ pos: 40, neg: 0 }, { pos: 0, neg: 20 }, 'neg', 0, 0)).toEqual({ duration: 0, delay: 0 });
  });
});

describe('computeOrder', () => {
  it('sorts descending by default and ascending on request', () => {
    expect(computeOrder([3, 9, 1])).toEqual([1, 0, 2]);
    expect(computeOrder([3, 9, 1], 'asc')).toEqual([2, 0, 1]);
  });
  it('is stable on ties and tolerates bad values', () => {
    expect(computeOrder([5, 5, 7, 5])).toEqual([2, 0, 1, 3]);
    expect(computeOrder([NaN, -2, 'x'])).toEqual([0, 2, 1]);
  });
});

describe('uniqueKeys', () => {
  it('keeps ids and disambiguates repeats and blanks', () => {
    expect(uniqueKeys(['a', 'b', 'a', null, 3])).toEqual(['a', 'b', 'a#2', '#3', '3']);
  });
});

describe('scrubIndex', () => {
  it('maps a position to a slot, clamped', () => {
    const g = { offset: 10, pitch: 50, count: 4 };
    expect(scrubIndex(12, g)).toBe(0);
    expect(scrubIndex(61, g)).toBe(1);
    expect(scrubIndex(-40, g)).toBe(0);
    expect(scrubIndex(900, g)).toBe(3);
  });
  it('returns null without bars or size', () => {
    expect(scrubIndex(5, { pitch: 0, count: 3 })).toBeNull();
    expect(scrubIndex(5, { pitch: 10, count: 0 })).toBeNull();
  });
});
