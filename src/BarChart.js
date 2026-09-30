import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, StyleSheet, Text, View } from 'react-native';
import AnimatedBar from './AnimatedBar';
import {
  DEFAULT_HEIGHT,
  H_AXIS_SPACE,
  H_VALUE_LABEL_SPACE,
  VALUE_LABEL_SPACE,
  X_LABEL_SPACE,
  Y_LABEL_HEIGHT,
  computeBarHeights,
  computeBarMargin,
  computeDelay,
  computeRowLayout,
  computeTicks,
  resolveColor,
  resolveSelectedIndex,
} from './layout';

const EMPTY = [];
const defaultFormatValue = (v) => String(v);

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
  labels,
  xLabels,
  color = 'red',
  height,
  maxValue,
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
  selectedIndex,
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
  const [internalSelected, setInternalSelected] = useState(null);
  const reduceMotion = useReduceMotion(respectReduceMotion);

  const flatStyle = StyleSheet.flatten([containerStyles, style]) || {};
  const hasOwnSize = flatStyle.height != null || flatStyle.flex != null || flatStyle.flexGrow != null;

  // Priority: `height` prop > measured layout (flex / style height) > DEFAULT_HEIGHT.
  const totalHeight =
    typeof height === 'number' && height > 0
      ? Math.round(height)
      : hasOwnSize
        ? measuredHeight
        : DEFAULT_HEIGHT;

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

  const count = dataY.length;
  const hasXLabels = Array.isArray(xLabels) && xLabels.length > 0;
  const ticks = useMemo(
    () => (showYAxis ? computeTicks(dataY, yTicks, maxValue) : null),
    [showYAxis, dataY, yTicks, maxValue]
  );
  const scaleMax = ticks ? ticks[ticks.length - 1] : maxValue;
  const formatTick = formatYLabel || formatValue;

  const selected = resolveSelectedIndex(selectedIndex, internalSelected, count);
  const duration = reduceMotion ? 0 : animationDuration;
  const pressable = !!onBarPress || showTooltip;

  // --- geometry -------------------------------------------------------------
  let plotLength = 0;
  let rowsHeight = 0;
  let rowLayout = null;
  let labelSpace = 0;
  let margin = 0;
  if (totalHeight != null) {
    if (horizontal) {
      const hasEndLabels = !!labels || showValues || showTooltip;
      labelSpace = hasEndLabels ? H_VALUE_LABEL_SPACE : showYAxis ? 16 : 0;
      rowsHeight = Math.max(0, totalHeight - (showYAxis ? H_AXIS_SPACE : 0));
      rowLayout = computeRowLayout(count, rowsHeight);
      plotLength = trackWidth == null ? 0 : Math.max(0, trackWidth - labelSpace);
    } else {
      plotLength = Math.max(0, totalHeight - VALUE_LABEL_SPACE - (hasXLabels ? X_LABEL_SPACE : 0));
      margin = computeBarMargin(count);
    }
  }
  const barLengths = useMemo(() => computeBarHeights(dataY, plotLength, scaleMax), [dataY, plotLength, scaleMax]);

  // --- bars -----------------------------------------------------------------
  const renderBar = (len, i) => {
    const value = dataY[i];
    const valueLabel = labels && labels[i] != null ? labels[i] : showValues ? formatValue(value, i) : null;
    const xl = hasXLabels ? xLabels[i] : undefined;
    const event = { index: i, value, label: valueLabel, xLabel: xl };
    const isSelected = selected === i;
    const tooltip =
      showTooltip && isSelected
        ? formatTooltip
          ? formatTooltip(event)
          : [xl, formatValue(value, i)].filter((x) => x != null && x !== '').join(': ')
        : null;
    return (
      <AnimatedBar
        key={i}
        horizontal={horizontal}
        testID={`${testID}-bar-${i}`}
        barLength={len}
        plotLength={plotLength}
        thickness={rowLayout ? rowLayout.thickness : undefined}
        margin={rowLayout ? rowLayout.margin : margin}
        labelSpace={labelSpace}
        label={valueLabel}
        tooltip={tooltip}
        color={resolveColor(color, value, i)}
        radius={barRadius}
        duration={duration}
        delay={duration === 0 ? 0 : computeDelay(animationDelay, i, count)}
        easing={easing}
        dimmed={selected != null && !isSelected}
        dimOpacity={dimOpacity}
        selected={isSelected}
        labelStyle={labelStyle}
        tooltipStyle={tooltipStyle}
        tooltipTextStyle={tooltipTextStyle}
        accessibilityLabel={[xl, valueLabel != null ? valueLabel : formatValue(value, i)]
          .filter((x) => x != null && x !== '')
          .join(': ')}
        onPress={
          pressable
            ? () => {
                if (showTooltip && selectedIndex === undefined) {
                  setInternalSelected((prev) => (prev === i ? null : i));
                }
                if (onBarPress) onBarPress(event);
              }
            : undefined
        }
      />
    );
  };

  const gridLine = (t, i, vertical) => {
    const ratio = scaleMax > 0 ? t / scaleMax : 0;
    const pos = vertical
      ? { left: Math.min(plotLength * ratio, plotLength - StyleSheet.hairlineWidth), top: 0, bottom: 0, width: StyleSheet.hairlineWidth }
      : { top: Math.min(VALUE_LABEL_SPACE + plotLength * (1 - ratio), VALUE_LABEL_SPACE + plotLength - StyleSheet.hairlineWidth), left: 0, right: 0, height: StyleSheet.hairlineWidth };
    return <View key={i} testID={`${testID}-grid-${i}`} style={[styles.gridLine, pos, { backgroundColor: gridColor }]} />;
  };

  // --- layouts --------------------------------------------------------------
  let body = null;
  if (totalHeight != null && horizontal) {
    body = (
      <View style={styles.hBody}>
        {hasXLabels && (
          <View style={[styles.catColumn, { paddingBottom: showYAxis ? H_AXIS_SPACE : 0 }]}>
            {dataY.map((_, i) => (
              <View key={i} style={[styles.catCell, { height: rowLayout.slot }]}>
                <Text numberOfLines={1} style={[styles.xLabel, xLabelStyle]}>
                  {xLabels[i] != null ? xLabels[i] : ''}
                </Text>
              </View>
            ))}
          </View>
        )}
        <View style={styles.track} testID={`${testID}-plot`} onLayout={onTrackLayout}>
          <View style={{ height: rowsHeight }}>
            {trackWidth != null && ticks && ticks.map((t, i) => gridLine(t, i, true))}
            {trackWidth != null && barLengths.map(renderBar)}
          </View>
          {trackWidth != null && ticks && (
            <View testID={`${testID}-y-axis`} style={{ height: H_AXIS_SPACE }}>
              {ticks.map((t, i) => (
                <Text
                  key={i}
                  numberOfLines={1}
                  style={[styles.yLabel, styles.hTick, { left: (scaleMax > 0 ? (plotLength * t) / scaleMax : 0) - 30 }, yLabelStyle]}
                >
                  {formatTick(t, i)}
                </Text>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  } else if (totalHeight != null) {
    body = (
      <View style={styles.vBody}>
        {ticks && (
          <View
            testID={`${testID}-y-axis`}
            style={[styles.yAxis, { marginTop: VALUE_LABEL_SPACE - Y_LABEL_HEIGHT / 2, height: plotLength + Y_LABEL_HEIGHT }]}
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
            {ticks && ticks.map((t, i) => gridLine(t, i, false))}
            <View
              style={[
                styles.plot,
                { height: plotLength + VALUE_LABEL_SPACE, paddingTop: VALUE_LABEL_SPACE, paddingHorizontal: `${margin}%` },
              ]}
            >
              {barLengths.map(renderBar)}
            </View>
          </View>
          {hasXLabels && (
            <View style={[styles.xAxis, { paddingHorizontal: `${margin}%` }]}>
              {barLengths.map((_, i) => (
                <View key={i} style={[styles.xCell, { marginHorizontal: `${margin}%` }]}>
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

  const containerSizing = typeof height === 'number' ? { height: totalHeight } : hasOwnSize ? null : { height: DEFAULT_HEIGHT };

  return (
    <View testID={testID} onLayout={onLayout} style={[containerStyles, style, containerSizing, styles.container]}>
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden' },
  vBody: { flex: 1, flexDirection: 'row' },
  vMain: { flex: 1 },
  plot: { flexDirection: 'row', alignItems: 'flex-end', overflow: 'hidden' },
  xAxis: { flexDirection: 'row', height: X_LABEL_SPACE, alignItems: 'center' },
  xCell: { flex: 1, alignItems: 'center' },
  xLabel: { color: 'grey', fontSize: 12 },
  yAxis: { justifyContent: 'space-between', alignItems: 'flex-end', paddingRight: 6 },
  yCell: { height: Y_LABEL_HEIGHT, justifyContent: 'center' },
  yLabel: { color: 'grey', fontSize: 11, lineHeight: Y_LABEL_HEIGHT },
  gridLine: { position: 'absolute' },
  hBody: { flex: 1, flexDirection: 'row' },
  catColumn: { paddingRight: 6 },
  catCell: { justifyContent: 'center', alignItems: 'flex-end' },
  track: { flex: 1 },
  hTick: { position: 'absolute', top: 2, width: 60, textAlign: 'center' },
});
