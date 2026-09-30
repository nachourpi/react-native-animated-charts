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
  /** Top corner radius of bars. Default 25. */
  barRadius?: number;
  /** Show the formatted value above bars when `labels` is not given. */
  showValues?: boolean;
  formatValue?: (value: number, index: number) => string;
  labelStyle?: StyleProp<TextStyle>;
  xLabelStyle?: StyleProp<TextStyle>;
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
export default BarChart;
