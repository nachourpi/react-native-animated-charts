import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import BarSlot from './BarSlot';
import {
  DEFAULT_HEIGHT,
  DEFAULT_PALETTE,
  H_AXIS_SPACE,
  H_VALUE_LABEL_SPACE,
  VALUE_LABEL_SPACE,
  X_LABEL_SPACE,
  Y_LABEL_HEIGHT,
  computeAutoHeight,
  computeBarMargin,
  computeBounds,
  computeDelay,
  computeRowLayout,
  computeSlot,
  computeTicks,
  normalizeSeries,
  resolveColor,
  resolveSelectedIndex,
  tooltipPlacement,
} from './layout';

const EMPTY = [];
const LEGEND_ESTIMATE = 24;
const defaultFormatValue = (v) => String(v);
const present = (x) => x != null && x !== '';

function useReduceMotion(respect) {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    if (!respect || !AccessibilityInfo || !AccessibilityInfo.isReduceMotionEnabled) return undefined;
    let mounted = true;
    Promise.resolve(AccessibilityInfo.isReduceMotionEnabled())
      .then((v) => mounted && setReduce(!!v))
      .catch(() => {});
    const sub =
      AccessibilityInfo.addEventListener &&
      AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => setReduce(!!v));
    return () => {
      mounted = false;
      if (sub && sub.remove) sub.remove();
    };
  }, [respect]);
  return respect && reduce;
}

export default function BarChart({
  dataY = EMPTY,
  series,
  stacked = false,
  labels,
  xLabels,
  color = 'red',
  height,
  maxValue,
  minValue,
  containerStyles,
  style,
  horizontal = false,
  barRadius = 25,
  showValues = false,
  formatValue = defaultFormatValue,
  labelStyle,
  xLabelStyle,
  showYAxis = false,
  yTicks = 4,
  formatYLabel,
  yLabelStyle,
  gridColor = '#e3e3e3',
  baselineColor = '#9e9e9e',
  showLegend,
  legendStyle,
  legendTextStyle,
  selectedIndex,
  onSelectionChange,
  showTooltip = false,
  formatTooltip,
  tooltipStyle,
  tooltipTextStyle,
  dimOpacity = 0.35,
  animationDuration = 300,
  animationDelay = 'random',
  easing,
  respectReduceMotion = true,
  onBarPress,
  testID = 'bar-chart',
}) {
  const [measuredHeight, setMeasuredHeight] = useState(null);
  const [trackWidth, setTrackWidth] = useState(null);
  const [legendHeight, setLegendHeight] = useState(null);
  const [internalSelected, setInternalSelected] = useState(null);
  const reduceMotion = useReduceMotion(respectReduceMotion);

  // --- data -----------------------------------------------------------------
  const multi = Array.isArray(series) && series.length > 0;
  const { list, count, values } = useMemo(() => normalizeSeries(multi ? series : null, dataY), [multi, series, dataY]);
  const k = list.length;
  const stack = multi && stacked;
  const legendOn = multi && (showLegend != null ? showLegend : list.some((s) => s && present(s.name)));
  const hasXLabels = Array.isArray(xLabels) && xLabels.length > 0;
  const seriesName = (s) => (list[s] && present(list[s].name) ? list[s].name : `Series ${s + 1}`);
  const rawValue = (i, s) => (multi ? values[i][s] : dataY[i]);

  const seriesColor = (s, value, i) => {
    if (!multi) return resolveColor(color, value, i);
    if (list[s] && list[s].color != null) return resolveColor(list[s].color, value, i);
    const palette = Array.isArray(color) && color.length ? color : DEFAULT_PALETTE;
    return palette[s % palette.length];
  };

  // --- scale ----------------------------------------------------------------
  const bounds = useMemo(() => computeBounds(values, { stacked: stack, maxValue, minValue }), [values, stack, maxValue, minValue]);
  const ticks = useMemo(
    () => (showYAxis ? computeTicks([bounds.lo, bounds.hi], yTicks, maxValue, minValue) : null),
    [showYAxis, bounds, yTicks, maxValue, minValue]
  );
  const lo = ticks ? ticks[0] : bounds.lo;
  const hi = ticks ? ticks[ticks.length - 1] : bounds.hi;
  const hasNeg = lo < 0;
  const formatTick = formatYLabel || formatValue;

  // --- selection --------------------------------------------------------------
  const selected = resolveSelectedIndex(selectedIndex, internalSelected, count);
  const selectable = showTooltip || !!onSelectionChange;
  const changeSelection = (next) => {
    if (selectedIndex === undefined) setInternalSelected(next);
    if (onSelectionChange) onSelectionChange(next);
  };
  const duration = reduceMotion ? 0 : animationDuration;

  // --- size -------------------------------------------------------------------
  const flatStyle = StyleSheet.flatten([containerStyles, style]) || {};
  const hasOwnSize = flatStyle.height != null || flatStyle.flex != null || flatStyle.flexGrow != null;
  const legendH = legendOn ? (legendHeight != null ? legendHeight : LEGEND_ESTIMATE) : 0;
  const axisH = horizontal && showYAxis ? H_AXIS_SPACE : 0;
  const fallbackHeight = horizontal
    ? computeAutoHeight(count, { seriesCount: k, stacked: stack, extra: axisH + legendH })
    : DEFAULT_HEIGHT;
  // Priority: `height` prop > measured layout (flex / style height) > default (auto for horizontal).
  const totalHeight =
    typeof height === 'number' && height > 0 ? Math.round(height) : hasOwnSize ? measuredHeight : fallbackHeight;

  const onLayout = useCallback(
    (e) => {
      const h = Math.round(e.nativeEvent.layout.height);
      if (h !== measuredHeight) setMeasuredHeight(h);
    },
    [measuredHeight]
  );
  const onTrackLayout = useCallback((e) => {
    const w = Math.round(e.nativeEvent.layout.width);
    setTrackWidth((prev) => (prev === w ? prev : w));
  }, []);
  const onLegendLayout = useCallback((e) => {
    const h = Math.round(e.nativeEvent.layout.height);
    setLegendHeight((prev) => (prev === h ? prev : h));
  }, []);

  // --- geometry ---------------------------------------------------------------
  const hasEndLabels = !!labels || showValues || showTooltip;
  let geometry = null;
  let rowsHeight = 0;
  let L = 0;
  if (totalHeight != null) {
    const chartHeight = Math.max(0, totalHeight - legendH);
    if (horizontal) {
      const side = hasEndLabels ? H_VALUE_LABEL_SPACE : showYAxis ? 16 : 0;
      const labelRight = side;
      const labelLeft = hasNeg ? side : 0;
      rowsHeight = Math.max(0, chartHeight - axisH);
      const row = computeRowLayout(count, rowsHeight);
      L = trackWidth == null ? 0 : Math.max(0, trackWidth - labelLeft - labelRight);
      const N = hi - lo > 0 ? Math.round((L * -lo) / (hi - lo)) : 0;
      geometry = { labelTop: 0, labelBottom: 0, labelLeft, labelRight, P: L - N, N, thickness: row.thickness, margin: row.margin };
    } else {
      const labelTop = VALUE_LABEL_SPACE;
      const labelBottom = hasNeg ? VALUE_LABEL_SPACE : 0;
      L = Math.max(0, chartHeight - labelTop - labelBottom - (hasXLabels ? X_LABEL_SPACE : 0));
      const N = hi - lo > 0 ? Math.round((L * -lo) / (hi - lo)) : 0;
      geometry = { labelTop, labelBottom, labelLeft: 0, labelRight: 0, P: L - N, N, margin: computeBarMargin(count) };
    }
  }

  const slots = useMemo(
    () =>
      geometry
        ? values.map((vals) => computeSlot(vals, { stacked: stack, lo, hi, posLength: geometry.P, negLength: geometry.N }))
        : EMPTY,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [values, stack, lo, hi, geometry && geometry.P, geometry && geometry.N]
  );

  // --- slots ------------------------------------------------------------------
  const renderSlot = (slot, i) => {
    const vals = values[i];
    const xl = hasXLabels ? xLabels[i] : undefined;
    const value = multi ? slot.total : dataY[i];
    const fixedLabel = labels && labels[i] != null ? labels[i] : null;
    const { anchor } = slot;

    // Value labels: per bar when grouped with showValues, otherwise one per slot on the anchor.
    const slotLabels = vals.map(() => null);
    if (fixedLabel != null) slotLabels[anchor.series] = { side: anchor.side, text: fixedLabel };
    else if (showValues && multi && !stack) {
      vals.forEach((v, s) => {
        slotLabels[s] = { side: v < 0 ? 'neg' : 'pos', text: formatValue(v, i, s) };
      });
    } else if (showValues && k) slotLabels[anchor.series] = { side: anchor.side, text: formatValue(value, i) };
    const labelText = fixedLabel != null ? fixedLabel : showValues && (!multi || stack) ? formatValue(value, i) : null;

    const event = { index: i, value, values: vals.slice(), label: labelText, xLabel: xl };
    const isSelected = selected === i;
    let tooltip = null;
    if (showTooltip && isSelected) {
      if (formatTooltip) tooltip = String(formatTooltip(event));
      else if (multi) tooltip = [xl, ...vals.map((v, s) => `${seriesName(s)}: ${formatValue(v, i, s)}`)].filter(present).join('\n');
      else tooltip = [xl, formatValue(value, i)].filter(present).join(': ');
    }
    const placement =
      tooltip != null
        ? tooltipPlacement({
            horizontal,
            length: anchor.length,
            regionLength: anchor.side === 'pos' ? geometry.P : geometry.N,
            extraSpace: anchor.side === 'pos' ? geometry.labelTop : geometry.labelBottom + (hasXLabels ? X_LABEL_SPACE : 0),
            lines: tooltip.split('\n').length,
          })
        : null;

    const a11yValue = multi
      ? vals.map((v, s) => `${seriesName(s)} ${formatValue(v, i, s)}`).join(', ')
      : labelText != null
        ? labelText
        : formatValue(value, i);
    const accessibilityLabel = [xl, multi && fixedLabel != null ? fixedLabel : a11yValue].filter(present).join(': ');
    const pressable = !!onBarPress || selectable;

    return (
      <BarSlot
        key={i}
        testID={multi ? `${testID}-bar-${i}` : `${testID}-slot-${i}`}
        tooltipTestID={`${testID}-bar-${i}-tooltip`}
        segmentTestID={(s, side) =>
          multi ? `${testID}-bar-${i}-s${s}${side === 'neg' ? '-neg' : ''}` : `${testID}-bar-${i}${side === 'neg' ? '-neg' : ''}`
        }
        horizontal={horizontal}
        stacked={stack}
        geometry={geometry}
        bars={slot.bars}
        colors={vals.map((v, s) => seriesColor(s, multi ? v : dataY[i], i))}
        labels={slotLabels}
        anchor={{ ...anchor, placement }}
        tooltip={tooltip}
        tooltipStyle={tooltipStyle}
        tooltipTextStyle={tooltipTextStyle}
        radius={barRadius}
        duration={duration}
        delay={duration === 0 ? 0 : computeDelay(animationDelay, i, count)}
        easing={easing}
        dimmed={selected != null && !isSelected}
        dimOpacity={dimOpacity}
        selected={isSelected}
        labelStyle={labelStyle}
        accessibilityLabel={accessibilityLabel}
        onPress={
          pressable
            ? () => {
                if (selectable) changeSelection(isSelected ? null : i);
                if (onBarPress) onBarPress(event);
              }
            : undefined
        }
      />
    );
  };

  const ratio = (t) => (hi - lo > 0 ? (t - lo) / (hi - lo) : 0);
  const hair = StyleSheet.hairlineWidth;
  const line = (key, pos, vertical, lineColor, id) => (
    <View
      key={key}
      testID={id}
      style={[
        styles.line,
        vertical ? { left: pos, top: 0, bottom: 0, width: hair } : { top: pos, left: 0, right: 0, height: hair },
        { backgroundColor: lineColor },
      ]}
    />
  );
  const lines = (vertical) => {
    const g = geometry;
    const at = (t) =>
      vertical ? Math.min(g.labelLeft + ratio(t) * L, g.labelLeft + L - hair) : Math.min(g.labelTop + (1 - ratio(t)) * L, g.labelTop + L - hair);
    const out = ticks ? ticks.map((t, i) => line(`g${i}`, at(t), vertical, gridColor, `${testID}-grid-${i}`)) : [];
    if (hasNeg) out.push(line('base', at(0), vertical, baselineColor, `${testID}-baseline`));
    return out;
  };

  // --- layouts ----------------------------------------------------------------
  let body = null;
  if (geometry && horizontal) {
    const row = computeRowLayout(count, rowsHeight);
    body = (
      <View style={styles.hBody}>
        {hasXLabels && (
          <View style={[styles.catColumn, { paddingBottom: axisH }]}>
            {values.map((_, i) => (
              <View key={i} style={[styles.catCell, { height: row.slot }]}>
                <Text numberOfLines={1} style={[styles.xLabel, xLabelStyle]}>
                  {xLabels[i] != null ? xLabels[i] : ''}
                </Text>
              </View>
            ))}
          </View>
        )}
        <View style={styles.track} testID={`${testID}-plot`} onLayout={onTrackLayout}>
          <View style={{ height: rowsHeight }}>
            {trackWidth != null && lines(true)}
            {trackWidth != null && slots.map(renderSlot)}
          </View>
          {trackWidth != null && ticks && (
            <View testID={`${testID}-y-axis`} style={{ height: H_AXIS_SPACE }}>
              {ticks.map((t, i) => (
                <Text
                  key={i}
                  numberOfLines={1}
                  style={[styles.yLabel, styles.hTick, { left: geometry.labelLeft + ratio(t) * L - 30 }, yLabelStyle]}
                >
                  {formatTick(t, i)}
                </Text>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  } else if (geometry) {
    const g = geometry;
    body = (
      <View style={styles.vBody}>
        {ticks && (
          <View
            testID={`${testID}-y-axis`}
            style={[styles.yAxis, { marginTop: g.labelTop - Y_LABEL_HEIGHT / 2, height: L + Y_LABEL_HEIGHT }]}
          >
            {ticks
              .map((t, i) => (
                <View key={i} style={styles.yCell}>
                  <Text numberOfLines={1} style={[styles.yLabel, yLabelStyle]}>
                    {formatTick(t, i)}
                  </Text>
                </View>
              ))
              .reverse()}
          </View>
        )}
        <View style={styles.vMain}>
          <View>
            {lines(false)}
            <View style={[styles.plot, { height: g.labelTop + L + g.labelBottom, paddingHorizontal: `${g.margin}%` }]}>
              {slots.map(renderSlot)}
            </View>
          </View>
          {hasXLabels && (
            <View style={[styles.xAxis, { paddingHorizontal: `${g.margin}%` }]}>
              {values.map((_, i) => (
                <View key={i} style={[styles.xCell, { marginHorizontal: `${g.margin}%` }]}>
                  <Text numberOfLines={1} style={[styles.xLabel, xLabelStyle]}>
                    {xLabels[i] != null ? xLabels[i] : ''}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  }

  const legend = legendOn ? (
    <View testID={`${testID}-legend`} onLayout={onLegendLayout} style={[styles.legend, legendStyle]}>
      {list.map((s, i) => (
        <View key={i} style={styles.legendItem}>
          <View style={[styles.swatch, { backgroundColor: seriesColor(i, values[0] ? values[0][i] : 0, 0) }]} />
          <Text style={[styles.legendText, legendTextStyle]}>{seriesName(i)}</Text>
        </View>
      ))}
    </View>
  ) : null;

  const containerSizing =
    typeof height === 'number' ? { height: totalHeight } : hasOwnSize ? null : { height: fallbackHeight };
  const rootProps = { testID, onLayout, style: [containerStyles, style, containerSizing, styles.container] };
  const content = (
    <>
      {body}
      {legend}
    </>
  );

  // With a tooltip open, tapping anywhere on the chart that isn't a bar clears the selection.
  if (selectable && selected != null) {
    return (
      <Pressable {...rootProps} accessible={false} onPress={() => changeSelection(null)}>
        {content}
      </Pressable>
    );
  }
  return <View {...rootProps}>{content}</View>;
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden' },
  vBody: { flex: 1, flexDirection: 'row' },
  vMain: { flex: 1 },
  plot: { flexDirection: 'row' },
  xAxis: { flexDirection: 'row', height: X_LABEL_SPACE, alignItems: 'center' },
  xCell: { flex: 1, alignItems: 'center' },
  xLabel: { color: 'grey', fontSize: 12 },
  yAxis: { justifyContent: 'space-between', alignItems: 'flex-end', paddingRight: 6 },
  yCell: { height: Y_LABEL_HEIGHT, justifyContent: 'center' },
  yLabel: { color: 'grey', fontSize: 11, lineHeight: Y_LABEL_HEIGHT },
  line: { position: 'absolute' },
  hBody: { flex: 1, flexDirection: 'row' },
  catColumn: { paddingRight: 6 },
  catCell: { justifyContent: 'center', alignItems: 'flex-end' },
  track: { flex: 1 },
  hTick: { position: 'absolute', top: 2, width: 60, textAlign: 'center' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', paddingTop: 6 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 8, marginBottom: 2 },
  swatch: { width: 10, height: 10, borderRadius: 3, marginRight: 5 },
  legendText: { color: '#555', fontSize: 12 },
});
