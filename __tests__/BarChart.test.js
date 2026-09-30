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

