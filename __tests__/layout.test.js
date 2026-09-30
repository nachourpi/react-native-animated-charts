import { computeBarHeights, computeBarMargin, computeDelay, resolveColor } from '../src/layout';

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
