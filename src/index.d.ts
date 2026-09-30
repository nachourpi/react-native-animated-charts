import * as React from 'react';
import { EasingFunction, StyleProp, TextStyle, ViewStyle } from 'react-native';

export type BarColor = string | string[] | ((value: number, index: number) => string);

export interface BarPressEvent {
  /** Category index. */
  index: number;
  /** The bar's value; with `series`, the sum of all series for this category. */
  value: number;
  /** One value per series (a single item without `series`). */
  values: number[];
  label: string | null;
  xLabel?: string;
}

export interface BarSeries {
  /** One value per category. Missing / non-numeric values count as 0. */
  data: number[];
  /** Shown in the legend and tooltip. */
  name?: string;
  /** Series color: a string, a palette cycled per category, or a function. */
  color?: BarColor;
}

export interface BarChartProps {
  /** Values to plot. Negative values are drawn below a baseline; non-numeric values count as 0. */
  dataY?: number[];
  /**
   * Several series per category: side by side (grouped) or on top of each other with `stacked`.
   * When set, `dataY` is ignored.
   */
  series?: BarSeries[];
  /** Stack `series` instead of grouping them. Positive and negative values stack separately. */
  stacked?: boolean;
  /** Labels shown above each bar (overrides `showValues`). */
  labels?: Array<string | null | undefined>;
  /** Labels shown under each bar (x-axis). */
  xLabels?: Array<string | null | undefined>;
  /** Single color, a palette cycled per bar, or a function. Default: `'red'`. */
  color?: BarColor;
  /**
   * Fixed height in px (labels and legend included). If omitted, uses the container's
   * height/flex; otherwise 200 for vertical charts, or sized from the number of bars when horizontal.
   */
  height?: number;
  /** Fixed top of the scale (> 0). Defaults to the largest value (or stack). */
  maxValue?: number;
  /** Fixed bottom of the scale (< 0). Defaults to the smallest value, or 0 when nothing is negative. */
  minValue?: number;
  /** Container styles (legacy name). */
  containerStyles?: StyleProp<ViewStyle>;
  /** Alias of `containerStyles`. */
  style?: StyleProp<ViewStyle>;
  /**
   * Draw bars left-to-right. `xLabels` become category labels on the left and value
   * labels / tooltips sit at the end of each bar. Default false.
   */
  horizontal?: boolean;
  /** Radius of the bars' outer corners (the end away from the baseline). Default 25. */
  barRadius?: number;
  /** Show the formatted value above bars when `labels` is not given. */
  showValues?: boolean;
  /** Formats values for labels, tooltips and accessibility. `seriesIndex` is set for per-series values. */
  formatValue?: (value: number, index: number, seriesIndex?: number) => string;
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
  /** Color of the zero line drawn when the scale goes below 0. Default `'#9e9e9e'`. */
  baselineColor?: string;
  /** Legend for `series`. Default: shown when any series has a `name`. */
  showLegend?: boolean;
  legendStyle?: StyleProp<ViewStyle>;
  legendTextStyle?: StyleProp<TextStyle>;
  /**
   * Highlighted bar (controlled). Other bars are dimmed to `dimOpacity`.
   * Pass `null` for no selection.
   */
  selectedIndex?: number | null;
  /**
   * Called when the user selects a bar (its index) or clears the selection (`null`):
   * tapping the selected bar again, or the chart outside the bars. Also makes bars selectable
   * without `showTooltip`. With `selectedIndex`, update it from here.
   */
  onSelectionChange?: (index: number | null) => void;
  /**
   * Show a tooltip over the selected bar. Without `selectedIndex`, tapping a bar
   * selects it; tapping it again or the chart outside the bars clears the selection.
   */
  showTooltip?: boolean;
  /** Tooltip text (may contain `\n`). Default: `"<xLabel>: <value>"`, or one line per series. */
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
