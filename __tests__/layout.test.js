import {
  computeBarHeights,
  computeBarMargin,
  computeDelay,
  computeRowLayout,
  computeTicks,
  resolveColor,
  resolveSelectedIndex,
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
    expect(computeTicks([0, -3, NaN], 2)).toEqual([0, 0.5, 1]);
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
