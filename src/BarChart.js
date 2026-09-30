import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, StyleSheet, Text, View } from 'react-native';
import AnimatedBar from './AnimatedBar';
import {
  DEFAULT_HEIGHT,
  VALUE_LABEL_SPACE,
  X_LABEL_SPACE,
  computeBarHeights,
  computeBarMargin,
  computeDelay,
  resolveColor,
} from './layout';

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
  dataY = [],
  labels,
  xLabels,
  color = 'red',
  height,
  maxValue,
  containerStyles,
  style,
  barRadius = 25,
  showValues = false,
  formatValue = (v) => String(v),
  labelStyle,
  xLabelStyle,
  animationDuration = 300,
  animationDelay = 'random',
  easing,
  respectReduceMotion = true,
  onBarPress,
  testID = 'bar-chart',
}) {
  const [measuredHeight, setMeasuredHeight] = useState(null);
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

  const hasXLabels = Array.isArray(xLabels) && xLabels.length > 0;
  const plotHeight =
    totalHeight == null ? 0 : Math.max(0, totalHeight - VALUE_LABEL_SPACE - (hasXLabels ? X_LABEL_SPACE : 0));

  const barHeights = useMemo(() => computeBarHeights(dataY, plotHeight, maxValue), [dataY, plotHeight, maxValue]);
  const margin = computeBarMargin(dataY.length);
  const duration = reduceMotion ? 0 : animationDuration;

  const containerSizing = typeof height === 'number' ? { height: totalHeight } : hasOwnSize ? null : { height: DEFAULT_HEIGHT };

  return (
    <View testID={testID} onLayout={onLayout} style={[containerStyles, style, containerSizing, styles.container]}>
      {totalHeight != null && (
        <>
          <View
            style={[
              styles.plot,
              { height: plotHeight + VALUE_LABEL_SPACE, paddingTop: VALUE_LABEL_SPACE, paddingHorizontal: `${margin}%` },
            ]}
          >
            {barHeights.map((h, i) => {
              const value = dataY[i];
              const valueLabel =
                labels && labels[i] != null ? labels[i] : showValues ? formatValue(value, i) : null;
              const xl = hasXLabels ? xLabels[i] : undefined;
              return (
                <AnimatedBar
                  key={i}
                  testID={`${testID}-bar-${i}`}
                  barHeight={h}
                  plotHeight={plotHeight}
                  label={valueLabel}
                  color={resolveColor(color, value, i)}
                  margin={margin}
                  radius={barRadius}
                  duration={duration}
                  delay={duration === 0 ? 0 : computeDelay(animationDelay, i, dataY.length)}
                  easing={easing}
                  labelStyle={labelStyle}
                  accessibilityLabel={[xl, valueLabel != null ? valueLabel : formatValue(value, i)]
                    .filter((x) => x != null && x !== '')
                    .join(': ')}
                  onPress={onBarPress ? () => onBarPress({ index: i, value, label: valueLabel, xLabel: xl }) : undefined}
                />
              );
            })}
          </View>
          {hasXLabels && (
            <View style={[styles.xAxis, { paddingHorizontal: `${margin}%` }]}>
              {barHeights.map((_, i) => (
                <View key={i} style={[styles.xCell, { marginHorizontal: `${margin}%` }]}>
                  <Text numberOfLines={1} style={[styles.xLabel, xLabelStyle]}>
                    {xLabels[i] != null ? xLabels[i] : ''}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden' },
  plot: { flexDirection: 'row', alignItems: 'flex-end', overflow: 'hidden' },
  xAxis: { flexDirection: 'row', height: X_LABEL_SPACE, alignItems: 'center' },
  xCell: { flex: 1, alignItems: 'center' },
  xLabel: { color: 'grey', fontSize: 12 },
});
