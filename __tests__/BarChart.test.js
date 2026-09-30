import React from 'react';
import { StyleSheet } from 'react-native';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { BarChart } from '../src';

jest.useFakeTimers();

describe('BarChart', () => {
  it('renders without containerStyles (crashed in 0.0.x)', async () => {
    await render(<BarChart dataY={[1, 2, 3]} labels={['a', 'b', 'c']} />);
    expect(screen.getByText('a')).toBeTruthy();
    expect(StyleSheet.flatten(screen.getByTestId('bar-chart').props.style).height).toBe(200);
  });

  it('does not mutate frozen style objects (crashed in 0.0.x)', async () => {
    const frozen = Object.freeze({ width: 300 });
    await render(<BarChart dataY={[1, 2]} containerStyles={frozen} height={150} />);
    expect(frozen).toEqual({ width: 300 });
  });

  it('updates labels even when dataY is the same array (ignored in 0.0.x)', async () => {
    const data = [1, 2, 3];
    await render(<BarChart dataY={data} labels={['a', 'b', 'c']} />);
    await screen.rerender(<BarChart dataY={data} labels={['x', 'y', 'z']} />);
    expect(screen.getByText('x')).toBeTruthy();
    expect(screen.queryByText('a')).toBeNull();
  });

  it('renders x-axis labels', async () => {
    await render(<BarChart dataY={[1, 2]} xLabels={['Jan', 'Feb']} />);
    expect(screen.getByText('Jan')).toBeTruthy();
    expect(screen.getByText('Feb')).toBeTruthy();
  });

  it('shows formatted values when showValues is set', async () => {
    await render(<BarChart dataY={[1500, 20]} showValues formatValue={(v) => `$${v}`} />);
    expect(screen.getByText('$1500')).toBeTruthy();
  });

  it('keeps bar instances stable across updates (no remount)', async () => {
    await render(<BarChart dataY={[1, 2]} />);
    const before = screen.getByTestId('bar-chart-bar-0');
    await screen.rerender(<BarChart dataY={[5, 1]} />);
    expect(screen.getByTestId('bar-chart-bar-0')).toBe(before);
  });

  it('applies palette colors per bar', async () => {
    await render(<BarChart dataY={[1, 2, 3]} color={['#111', '#222']} />);
    const c = (i) => StyleSheet.flatten(screen.getByTestId(`bar-chart-bar-${i}`).props.style).backgroundColor;
    expect([c(0), c(1), c(2)]).toEqual(['#111', '#222', '#111']);
  });

  it('calls onBarPress with index and value', async () => {
    const onBarPress = jest.fn();
    await render(<BarChart dataY={[4, 8]} xLabels={['a', 'b']} onBarPress={onBarPress} />);
    await fireEvent.press(screen.getByLabelText('b: 8'));
    expect(onBarPress).toHaveBeenCalledWith(expect.objectContaining({ index: 1, value: 8, xLabel: 'b' }));
  });

  it('measures height from layout when using flex', async () => {
    await render(<BarChart dataY={[1, 2]} style={{ flex: 1 }} labels={['a', 'b']} />);
    expect(screen.queryByText('a')).toBeNull(); // waits for layout
    await fireEvent(screen.getByTestId('bar-chart'), 'layout', { nativeEvent: { layout: { height: 300 } } });
    expect(screen.getByText('a')).toBeTruthy();
  });

  it('handles empty data', async () => {
    await render(<BarChart dataY={[]} />);
    expect(screen.getByTestId('bar-chart')).toBeTruthy();
  });

  it('does not recompute bars on re-render without dataY', async () => {
    await render(<BarChart />);
    await screen.rerender(<BarChart />);
    expect(screen.getByTestId('bar-chart')).toBeTruthy();
  });
});

const layoutTrack = (w, id = 'bar-chart-plot') =>
  fireEvent(screen.getByTestId(id), 'layout', { nativeEvent: { layout: { width: w, height: 100 } } });
const styleOf = (id) => StyleSheet.flatten(screen.getByTestId(id).props.style);

describe('horizontal', () => {
  it('renders category labels and waits for the track width to draw bars', async () => {
    await render(<BarChart horizontal dataY={[3, 6]} xLabels={['Go', 'Rust']} showValues height={120} />);
    expect(screen.getByText('Go')).toBeTruthy();
    expect(screen.queryByTestId('bar-chart-bar-0')).toBeNull();
    await layoutTrack(300);
    expect(screen.getByText('6')).toBeTruthy();
    // bars span the track minus the space reserved for value labels
    expect(styleOf('bar-chart-bar-1').width).toBe(300 - 56);
  });

  it('splits the height into rows', async () => {
    await render(<BarChart horizontal dataY={[1, 2, 3, 4]} height={200} />);
    await layoutTrack(200);
    const row = StyleSheet.flatten(screen.getByLabelText('1').props.style);
    expect(row).toEqual(expect.objectContaining({ height: 30, marginVertical: 10 }));
  });

  it('keeps colors, press and accessibility', async () => {
    const onBarPress = jest.fn();
    await render(<BarChart horizontal dataY={[4, 8]} xLabels={['a', 'b']} color={['#111', '#222']} onBarPress={onBarPress} />);
    await layoutTrack(250);
    expect(styleOf('bar-chart-bar-1').backgroundColor).toBe('#222');
    await fireEvent.press(screen.getByLabelText('b: 8'));
    expect(onBarPress).toHaveBeenCalledWith(expect.objectContaining({ index: 1, value: 8 }));
  });

  it('draws the value axis at the bottom with vertical grid lines', async () => {
    await render(<BarChart horizontal dataY={[120, 410]} showYAxis height={150} />);
    await layoutTrack(316);
    expect(screen.getByText('500')).toBeTruthy();
    expect(styleOf('bar-chart-grid-5').left).toBeCloseTo(300 - StyleSheet.hairlineWidth);
    expect(styleOf('bar-chart-grid-1').left).toBe(60);
  });
});

describe('y axis', () => {
  it('renders nice ticks and one grid line per tick', async () => {
    await render(<BarChart dataY={[120, 340, 410]} showYAxis height={224} />);
    ['0', '100', '200', '300', '400', '500'].forEach((t) => expect(screen.getByText(t)).toBeTruthy());
    expect(screen.getByTestId('bar-chart-grid-5')).toBeTruthy();
    expect(screen.queryByTestId('bar-chart-grid-6')).toBeNull();
    // plot = 224 - 24 → 200px; tick 100 of 500 sits 160px below the plot top
    expect(styleOf('bar-chart-grid-1').top).toBe(24 + 160);
  });

  it('uses formatYLabel, falling back to formatValue', async () => {
    await render(<BarChart dataY={[40, 80]} showYAxis maxValue={100} yTicks={2} formatValue={(v) => `${v}%`} />);
    expect(screen.getByText('50%')).toBeTruthy();
    await screen.rerender(<BarChart dataY={[40, 80]} showYAxis maxValue={100} yTicks={2} formatYLabel={(v) => `<${v}>`} />);
    expect(screen.getByText('<100>')).toBeTruthy();
  });

  it('renders nothing extra when showYAxis is off', async () => {
    await render(<BarChart dataY={[1, 2]} />);
    expect(screen.queryByTestId('bar-chart-y-axis')).toBeNull();
    expect(screen.queryByTestId('bar-chart-grid-0')).toBeNull();
  });
});

describe('selection and tooltip', () => {
  it('highlights a controlled selectedIndex', async () => {
    await render(<BarChart dataY={[1, 2, 3]} selectedIndex={1} />);
    expect(screen.getByLabelText('2').props.accessibilityState).toEqual({ selected: true });
    expect(screen.getByLabelText('1').props.accessibilityState).toEqual({ selected: false });
  });

  it('toggles a tooltip on press when showTooltip is set (uncontrolled)', async () => {
    await render(<BarChart dataY={[4, 8]} xLabels={['a', 'b']} showTooltip formatValue={(v) => `$${v}`} />);
    expect(screen.queryByTestId('bar-chart-bar-1-tooltip')).toBeNull();
    await fireEvent.press(screen.getByLabelText('b: $8'));
    expect(screen.getByText('b: $8')).toBeTruthy();
    expect(screen.getByLabelText('b: $8').props.accessibilityState).toEqual({ selected: true });
    await fireEvent.press(screen.getByLabelText('b: $8'));
    expect(screen.queryByTestId('bar-chart-bar-1-tooltip')).toBeNull();
  });

  it('moves the tooltip when another bar is pressed and calls onBarPress', async () => {
    const onBarPress = jest.fn();
    await render(<BarChart dataY={[4, 8]} showTooltip onBarPress={onBarPress} />);
    await fireEvent.press(screen.getByLabelText('4'));
    await fireEvent.press(screen.getByLabelText('8'));
    expect(screen.queryByTestId('bar-chart-bar-0-tooltip')).toBeNull();
    expect(screen.getByTestId('bar-chart-bar-1-tooltip')).toBeTruthy();
    expect(onBarPress).toHaveBeenCalledTimes(2);
  });

  it('shows the tooltip for a controlled selection and ignores taps', async () => {
    await render(
      <BarChart dataY={[4, 8]} showTooltip selectedIndex={0} formatTooltip={({ value, index }) => `#${index}=${value}`} />
    );
    expect(screen.getByText('#0=4')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('8'));
    expect(screen.getByText('#0=4')).toBeTruthy();
  });

  it('shows the tooltip instead of the value label on the selected bar', async () => {
    await render(<BarChart dataY={[4, 8]} labels={['four', 'eight']} showTooltip selectedIndex={1} />);
    expect(screen.queryByText('eight')).toBeNull();
    expect(screen.getByText('four')).toBeTruthy();
  });

  it('works in horizontal mode', async () => {
    await render(<BarChart horizontal dataY={[4, 8]} showTooltip selectedIndex={1} />);
    await layoutTrack(300);
    expect(screen.getByTestId('bar-chart-bar-1-tooltip')).toBeTruthy();
  });

  it('bars are not pressable without onBarPress or showTooltip', async () => {
    await render(<BarChart dataY={[4, 8]} />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});


describe('negative values', () => {
  it('draws negative bars below a baseline with their labels', async () => {
    // height 248 = 24 (labels above) + 200 plot + 24 (labels below) → 100px each side of 0
    await render(<BarChart dataY={[50, -50]} showValues height={248} />);
    expect(screen.getByText('-50')).toBeTruthy();
    expect(styleOf('bar-chart-bar-1-neg').height).toBe(100);
    expect(styleOf('bar-chart-bar-0').height).toBe(100);
    expect(styleOf('bar-chart-baseline').top).toBe(124);
  });

  it('rounds only the outer corners of negative bars', async () => {
    await render(<BarChart dataY={[5, -5]} barRadius={8} />);
    const neg = styleOf('bar-chart-bar-1-neg');
    expect(neg.borderBottomLeftRadius).toBe(8);
    expect(neg.borderTopLeftRadius).toBeUndefined();
  });

  it('adds nothing below zero when every value is positive', async () => {
    await render(<BarChart dataY={[1, 2]} />);
    expect(screen.queryByTestId('bar-chart-baseline')).toBeNull();
    expect(screen.queryByTestId('bar-chart-bar-0-neg')).toBeNull();
  });

  it('a bar changing sign keeps its old color while it retracts', async () => {
    const color = (v) => (v < 0 ? 'red' : 'green');
    await render(<BarChart dataY={[10, 5]} color={color} />);
    await screen.rerender(<BarChart dataY={[-10, 5]} color={color} />);
    expect(styleOf('bar-chart-bar-0').backgroundColor).toBe('green'); // shrinking positive side
    expect(styleOf('bar-chart-bar-0-neg').backgroundColor).toBe('red'); // growing negative side
  });

  it('hidden segments stay parked on the baseline when the scale changes', async () => {
    await render(<BarChart dataY={[12, -8]} height={248} />);
    await screen.rerender(<BarChart dataY={[12, 30]} height={248} />);
    // bar 1 had no positive part: it must still be fully hidden (offset 0 from the baseline)
    // even though the positive region just got taller.
    const s = styleOf('bar-chart-bar-1');
    expect(s.top).toBe('100%');
    expect(s.transform).toEqual([{ translateY: 0 }]);
  });

  it('puts negative ticks on the axis', async () => {
    await render(<BarChart dataY={[-120, 340]} showYAxis />);
    ['-200', '0', '400'].forEach((t) => expect(screen.getByText(t)).toBeTruthy());
  });

  it('works horizontally, with negatives growing to the left', async () => {
    await render(<BarChart horizontal dataY={[40, -20]} xLabels={['a', 'b']} showValues />);
    await layoutTrack(412); // 412 - 56 left - 56 right = 300 → 200 positive, 100 negative
    expect(styleOf('bar-chart-bar-0').width).toBe(200);
    expect(styleOf('bar-chart-bar-1-neg').width).toBe(100);
    expect(styleOf('bar-chart-baseline').left).toBe(56 + 100);
  });

  it('honors minValue', async () => {
    await render(<BarChart dataY={[10]} minValue={-10} height={248} />);
    expect(styleOf('bar-chart-baseline').top).toBe(124);
  });
});

describe('series', () => {
  const series = [
    { name: 'Sales', data: [10, 30], color: '#111' },
    { name: 'Costs', data: [5, -8], color: '#222' },
  ];

  it('grouped: one bar per series, a legend and per-series a11y', async () => {
    await render(<BarChart series={series} xLabels={['Jan', 'Feb']} />);
    expect(styleOf('bar-chart-bar-0-s0').backgroundColor).toBe('#111');
    expect(styleOf('bar-chart-bar-1-s1-neg').backgroundColor).toBe('#222');
    expect(screen.getByTestId('bar-chart-legend')).toBeTruthy();
    expect(screen.getByText('Sales')).toBeTruthy();
    expect(screen.getByLabelText('Feb: Sales 30, Costs -8')).toBeTruthy();
  });

  it('grouped showValues labels every bar and passes the series index', async () => {
    await render(<BarChart series={series} showValues formatValue={(v, i, s) => `${s}:${v}`} />);
    ['0:10', '1:5', '0:30', '1:-8'].forEach((t) => expect(screen.getByText(t)).toBeTruthy());
  });

  it('falls back to a palette, and hides the legend when asked', async () => {
    await render(<BarChart series={[{ data: [1] }, { data: [2] }]} color={['#aaa', '#bbb']} showLegend={false} />);
    expect(styleOf('bar-chart-bar-0-s1').backgroundColor).toBe('#bbb');
    expect(screen.queryByTestId('bar-chart-legend')).toBeNull();
  });

  it('shows the legend automatically only when series have names', async () => {
    await render(<BarChart series={[{ data: [1] }, { data: [2] }]} />);
    expect(screen.queryByTestId('bar-chart-legend')).toBeNull();
  });

  it('stacked: total label and radius only on the top segment', async () => {
    await render(<BarChart series={series} stacked showValues barRadius={6} />);
    expect(screen.getByText('15')).toBeTruthy(); // 10 + 5
    expect(screen.getByText('22')).toBeTruthy(); // 30 - 8
    expect(screen.queryByText('10')).toBeNull();
    expect(styleOf('bar-chart-bar-0-s1').borderTopLeftRadius).toBe(6);
    expect(styleOf('bar-chart-bar-0-s0').borderTopLeftRadius).toBe(0);
  });

  it('reports every series value on press', async () => {
    const onBarPress = jest.fn();
    await render(<BarChart series={series} stacked xLabels={['Jan', 'Feb']} onBarPress={onBarPress} />);
    await fireEvent.press(screen.getByLabelText('Feb: Sales 30, Costs -8'));
    expect(onBarPress).toHaveBeenCalledWith(expect.objectContaining({ index: 1, value: 22, values: [30, -8], xLabel: 'Feb' }));
  });

  it('multi-line tooltip with one row per series', async () => {
    await render(<BarChart series={series} xLabels={['Jan', 'Feb']} showTooltip selectedIndex={0} />);
    expect(screen.getByText('Jan\nSales: 10\nCosts: 5')).toBeTruthy();
  });
});

describe('closing the tooltip', () => {
  it('tapping the chart outside the bars clears the selection', async () => {
    await render(<BarChart dataY={[4, 8]} showTooltip />);
    await fireEvent.press(screen.getByLabelText('8'));
    expect(screen.getByTestId('bar-chart-bar-1-tooltip')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('bar-chart'));
    expect(screen.queryByTestId('bar-chart-bar-1-tooltip')).toBeNull();
  });

  it('onSelectionChange reports bar taps and background taps (controlled)', async () => {
    const onSelectionChange = jest.fn();
    await render(<BarChart dataY={[4, 8]} showTooltip selectedIndex={1} onSelectionChange={onSelectionChange} />);
    await fireEvent.press(screen.getByLabelText('4'));
    expect(onSelectionChange).toHaveBeenLastCalledWith(0);
    await fireEvent.press(screen.getByLabelText('8'));
    expect(onSelectionChange).toHaveBeenLastCalledWith(null);
    await fireEvent.press(screen.getByTestId('bar-chart'));
    expect(onSelectionChange).toHaveBeenCalledTimes(3);
    // still controlled: the tooltip stays where the parent put it
    expect(screen.getByTestId('bar-chart-bar-1-tooltip')).toBeTruthy();
  });

  it('onSelectionChange alone makes bars selectable without a tooltip', async () => {
    const onSelectionChange = jest.fn();
    await render(<BarChart dataY={[4, 8]} onSelectionChange={onSelectionChange} />);
    await fireEvent.press(screen.getByLabelText('8'));
    expect(onSelectionChange).toHaveBeenCalledWith(1);
    expect(screen.getByLabelText('8').props.accessibilityState).toEqual({ selected: true });
    expect(screen.queryByTestId('bar-chart-bar-1-tooltip')).toBeNull();
  });
});

describe('horizontal auto height', () => {
  const heightOf = () => StyleSheet.flatten(screen.getByTestId('bar-chart').props.style).height;

  it('sizes itself from the number of bars', async () => {
    await render(<BarChart horizontal dataY={Array.from({ length: 15 }, (_, i) => i)} />);
    expect(heightOf()).toBe(15 * 32);
  });

  it('leaves room for grouped series, the axis and the legend', async () => {
    await render(<BarChart horizontal showYAxis series={[{ name: 'a', data: [1, 2] }, { name: 'b', data: [3, 4] }]} />);
    expect(heightOf()).toBe(2 * 36 + 18 + 24);
  });

  it('still honors height and flex, and vertical charts keep 200', async () => {
    await render(<BarChart horizontal dataY={[1, 2, 3]} height={90} />);
    expect(heightOf()).toBe(90);
    await screen.rerender(<BarChart dataY={[1, 2, 3]} />);
    expect(heightOf()).toBe(200);
  });
});
