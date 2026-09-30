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
});
