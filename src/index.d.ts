import * as React from 'react';
import { EasingFunction, StyleProp, TextStyle, ViewStyle } from 'react-native';

export type BarColor = string | string[] | ((value: number, index: number) => string);

export interface BarPressEvent {
  index: number;
  value: number;
  label: string | null;
  xLabel?: string;
}

export interface BarChartProps {
  /** Values to plot. Negative / non-numeric values render as 0. */
  dataY: number[];
  /** Labels shown above each bar (overrides `showValues`). */
  labels?: Array<string | null | undefined>;
  /** Labels shown under each bar (x-axis). */
  xLabels?: Array<string | null | undefined>;
  /** Single color, a palette cycled per bar, or a function. Default: `'red'`. */
  color?: BarColor;
  /** Fixed height in px. If omitted, uses the container's height/flex, or 200. */
  height?: number;
  /** Fixed top of the scale. Defaults to the max of `dataY`. */
  maxValue?: number;
  /** Container styles (legacy name). */
  containerStyles?: StyleProp<ViewStyle>;
  /** Alias of `containerStyles`. */
  style?: StyleProp<ViewStyle>;
  /**
   * Draw bars left-to-right. `xLabels` become category labels on the left and value
   * labels / tooltips sit at the end of each bar. Default false.
   */
  horizontal?: boolean;
  /** Radius of the bars' outer corners (top when vertical, right when horizontal). Default 25. */
  barRadius?: number;
  /** Show the formatted value above bars when `labels` is not given. */
  showValues?: boolean;
  formatValue?: (value: number, index: number) => string;
  labelStyle?: StyleProp<TextStyle>;
  xLabelStyle?: StyleProp<TextStyle>;
  /**
   * Show the value axis with grid lines (on the left, or at the bottom when `horizontal`).
   * The scale is rounded up to the last "nice" tick unless `maxValue` is set.
   */
  showYAxis?: boolean;
  /** Approximate number of intervals on the value axis (exact when `maxValue` is set). Default 4. */
  yTicks?: number;
  /** Formats axis labels. Defaults to `formatValue`. */
  formatYLabel?: (value: number, index: number) => string;
  yLabelStyle?: StyleProp<TextStyle>;
  /** Color of the grid lines. Default `'#e3e3e3'`. */
  gridColor?: string;
  /**
   * Highlighted bar (controlled). Other bars are dimmed to `dimOpacity`.
   * Pass `null` for no selection.
   */
  selectedIndex?: number | null;
  /**
   * Show a tooltip over the selected bar. Without `selectedIndex`, tapping a bar
   * selects it and tapping it again clears the selection.
   */
  showTooltip?: boolean;
  /** Tooltip text. Default: `"<xLabel>: <formatValue(value)>"`. */
  formatTooltip?: (event: BarPressEvent) => string;
  tooltipStyle?: StyleProp<ViewStyle>;
  tooltipTextStyle?: StyleProp<TextStyle>;
  /** Opacity of the non-selected bars while one is selected. Default 0.35. */
  dimOpacity?: number;
  /** Animation duration in ms. Default 300. */
  animationDuration?: number;
  /** `'random'` (default, 0.0.x behaviour), `'stagger'`, `'none'`, or ms per bar index. */
  animationDelay?: 'random' | 'stagger' | 'none' | number;
  easing?: EasingFunction;
  /** Skip animations when the OS "reduce motion" setting is on. Default true. */
  respectReduceMotion?: boolean;
  onBarPress?: (event: BarPressEvent) => void;
  testID?: string;
}

export declare const BarChart: React.FC<BarChartProps>;
export declare function computeBarHeights(data: number[], plotHeight: number, maxValue?: number): number[];
/** "Nice" axis ticks from 0 to the top of the scale, as used by `showYAxis`. */
export declare function computeTicks(data: number[], count?: number, maxValue?: number): number[];
export default BarChart;
