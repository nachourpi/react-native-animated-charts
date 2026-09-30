import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import BarSlot from './BarSlot';
import {
  DEFAULT_HEIGHT,
  DEFAULT_PALETTE,
  H_AXIS_SPACE,
  SKELETON_PATTERN,
  H_VALUE_LABEL_SPACE,
  VALUE_LABEL_SPACE,
  X_LABEL_SPACE,
  Y_LABEL_HEIGHT,
  computeAutoHeight,
  computeBarMargin,
  computeBounds,
  computeDelay,
  computeOrder,
  computeRowLayout,
  computeSlot,
  computeTicks,
  normalizeSeries,
  resolveColor,
  resolveSelectedIndex,
  scrubIndex,
  tooltipPlacement,
  uniqueKeys,
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
  sort,
  ids,
  maxBars,
  scrub = false,
  loading = false,
  skeletonColor = '#e6e6e9',
  testID = 'bar-chart',
}) {
  const [measuredHeight, setMeasuredHeight] = useState(null);
  const [trackWidth, setTrackWidth] = useState(null);
  const [legendHeight, setLegendHeight] = useState(null);
  const [internalSelected, setInternalSelected] = useState(null);
  const reduceMotion = useReduceMotion(respectReduceMotion);

  // --- data -----------------------------------------------------------------
  const hasSeries = Array.isArray(series) && series.length > 0;
  const hasXLabels = Array.isArray(xLabels) && xLabels.length > 0;
  const norm = useMemo(() => normalizeSeries(hasSeries ? series : null, dataY), [hasSeries, series, dataY]);
  // While loading, placeholder bars stand in for the data (one per known category, else 6).
  const skeletonCount = norm.count || (hasXLabels ? xLabels.length : 6);
  const skeleton = useMemo(
    () =>
      loading
        ? { list: [{}], count: skeletonCount, values: Array.from({ length: skeletonCount }, (_, i) => [SKELETON_PATTERN[i % SKELETON_PATTERN.length]]) }
        : null,
    [loading, skeletonCount]
  );
  const { list, count, values } = skeleton || norm;
  const multi = hasSeries && !loading;
  const k = list.length;
  const stack = multi && stacked;
  const legendOn = hasSeries && (showLegend != null ? showLegend : norm.list.some((s) => s && present(s.name)));
  const seriesName = (s) => (norm.list[s] && present(norm.list[s].name) ? norm.list[s].name : `Series ${s + 1}`);

  const colorOfSeries = (s, value, i) => {
    const item = norm.list[s];
    if (item && item.color != null) return resolveColor(item.color, value, i);
    const palette = Array.isArray(color) && color.length ? color : DEFAULT_PALETTE;
    return palette[s % palette.length];
  };
  const seriesColor = (s, value, i) => {
    if (loading) return skeletonColor;
    if (!multi) return resolveColor(color, value, i);
    return colorOfSeries(s, value, i);
  };

  // --- ordering (sort / race) ---------------------------------------------------
  // Sorting stays on while loading (placeholders in their original order, same keys), so the
  // data grows from the placeholders and then slides into its ranking.
  const sortOn = sort === 'asc' || sort === 'desc';
  const visibleCount = sortOn && maxBars > 0 ? Math.min(count, Math.floor(maxBars)) : count;
  const keys = useMemo(
    () =>
      sortOn
        ? uniqueKeys(values.map((_, i) => (ids && ids[i] != null ? ids[i] : hasXLabels && xLabels[i] != null ? xLabels[i] : i)))
        : null,
    [sortOn, values, ids, hasXLabels, xLabels]
  );
  const order = useMemo(
    () =>
      sortOn
        ? loading
          ? values.map((_, i) => i)
          : computeOrder(values.map((v) => v.reduce((a, x) => a + x, 0)), sort)
        : null,
    [sortOn, loading, values, sort]
  );
  const rank = useMemo(() => {
    if (!order) return null;
    const r = [];
    order.forEach((idx, pos) => {
      r[idx] = pos;
    });
    return r;
  }, [order]);

  // --- scale ----------------------------------------------------------------
  const bounds = useMemo(
    () => (loading ? { lo: 0, hi: 1 } : computeBounds(values, { stacked: stack, maxValue, minValue })),
    [loading, values, stack, maxValue, minValue]
  );
  const ticks = useMemo(
    () => (showYAxis && !loading ? computeTicks([bounds.lo, bounds.hi], yTicks, maxValue, minValue) : null),
    [showYAxis, loading, bounds, yTicks, maxValue, minValue]
  );
  const lo = ticks ? ticks[0] : bounds.lo;
  const hi = ticks ? ticks[ticks.length - 1] : bounds.hi;
  const hasNeg = lo < 0;
  const formatTick = formatYLabel || formatValue;

  // --- selection --------------------------------------------------------------
  const selected = resolveSelectedIndex(selectedIndex, internalSelected, count);
  const scrubOn = scrub && !loading && count > 0;
  const selectable = !loading && (showTooltip || !!onSelectionChange || scrub);
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
    ? computeAutoHeight(visibleCount, { seriesCount: k, stacked: stack, extra: axisH + legendH })
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
  const hasEndLabels = !loading && (!!labels || showValues || showTooltip);
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
      const row = computeRowLayout(visibleCount, rowsHeight);
      L = trackWidth == null ? 0 : Math.max(0, trackWidth - labelLeft - labelRight);
      const N = hi - lo > 0 ? Math.round((L * -lo) / (hi - lo)) : 0;
      geometry = { labelTop: 0, labelBottom: 0, labelLeft, labelRight, P: L - N, N, thickness: row.thickness, margin: row.margin };
    } else {
      const labelTop = VALUE_LABEL_SPACE;
      const labelBottom = hasNeg ? VALUE_LABEL_SPACE : 0;
      L = Math.max(0, chartHeight - labelTop - labelBottom - (hasXLabels ? X_LABEL_SPACE : 0));
      const N = hi - lo > 0 ? Math.round((L * -lo) / (hi - lo)) : 0;
      geometry = { labelTop, labelBottom, labelLeft: 0, labelRight: 0, P: L - N, N, margin: computeBarMargin(visibleCount) };
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
  const renderSlot = (slot, i, geo = geometry) => {
    const vals = values[i];
    const xl = hasXLabels ? xLabels[i] : undefined;
    const value = multi ? slot.total : dataY[i];
    const fixedLabel = !loading && labels && labels[i] != null ? labels[i] : null;
    const { anchor } = slot;

    // Value labels: per bar when grouped with showValues, otherwise one per slot on the anchor.
    const slotLabels = vals.map(() => null);
    if (fixedLabel != null) slotLabels[anchor.series] = { side: anchor.side, text: fixedLabel };
    else if (loading) {
      // placeholders carry no labels
    } else if (showValues && multi && !stack) {
      vals.forEach((v, s) => {
        slotLabels[s] = { side: v < 0 ? 'neg' : 'pos', text: formatValue(v, i, s) };
      });
    } else if (showValues && k) slotLabels[anchor.series] = { side: anchor.side, text: formatValue(value, i) };
    const labelText = fixedLabel != null ? fixedLabel : !loading && showValues && (!multi || stack) ? formatValue(value, i) : null;

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
            regionLength: anchor.side === 'pos' ? geo.P : geo.N,
            extraSpace: anchor.side === 'pos' ? geo.labelTop : geo.labelBottom + (hasXLabels ? X_LABEL_SPACE : 0),
            lines: tooltip.split('\n').length,
          })
        : null;

    const a11yValue = multi
      ? vals.map((v, s) => `${seriesName(s)} ${formatValue(v, i, s)}`).join(', ')
      : labelText != null
        ? labelText
        : formatValue(value, i);
    const accessibilityLabel = [xl, multi && fixedLabel != null ? fixedLabel : a11yValue].filter(present).join(': ');
    const pressable = !loading && (!!onBarPress || selectable);

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
        geometry={geo}
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
        accessibilityLabel={loading ? undefined : accessibilityLabel}
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

  // --- category positions (sort) ----------------------------------------------
  // Slot pitch along the category axis: rows for horizontal, columns (from the measured
  // plot width) for vertical. `pad` is the empty space before the first slot.
  const row = geometry && horizontal ? computeRowLayout(visibleCount, rowsHeight) : null;
  const pad = !horizontal && geometry && trackWidth != null ? (geometry.margin / 100) * trackWidth : 0;
  const pitch = horizontal
    ? row && row.slot
    : trackWidth != null && visibleCount > 0
      ? (trackWidth - 2 * pad) / visibleCount
      : null;

  // One position value per category key, shared by its bar and its label so both slide together.
  const positions = useRef(new Map()).current;
  const canPlace = sortOn && pitch != null && (!horizontal || trackWidth != null);
  if (canPlace) {
    keys.forEach((key, i) => {
      if (!positions.has(key)) positions.set(key, new Animated.Value(rank[i] * pitch));
    });
  }
  const placeSignature = canPlace ? keys.map((key, i) => `${key}:${rank[i] * pitch}`).join('|') : '';
  useEffect(() => {
    if (!canPlace) return undefined;
    const live = new Set(keys);
    Array.from(positions.keys()).forEach((key) => {
      if (!live.has(key)) positions.delete(key);
    });
    const anims = keys.map((key, i) =>
      Animated.timing(positions.get(key), {
        toValue: rank[i] * pitch,
        duration,
        easing: easing || Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeSignature, duration]);
  const slide = (key) => (horizontal ? [{ translateY: positions.get(key) }] : [{ translateX: positions.get(key) }]);

  // --- scrub ------------------------------------------------------------------------
  const plotRef = useRef(null);
  const scrubState = useRef({ start: null, origin: { x: 0, y: 0 }, last: null, index: undefined }).current;
  const scrubTo = (ne) => {
    scrubState.last = { pageX: ne.pageX, pageY: ne.pageY };
    const along = horizontal ? ne.pageY - scrubState.origin.y : ne.pageX - scrubState.origin.x;
    const r = scrubIndex(along, { offset: horizontal ? 0 : pad, pitch, count: visibleCount });
    if (r == null) return;
    const i = order ? order[r] : r;
    if (i === scrubState.index) return;
    scrubState.index = i;
    if (i !== selected) changeSelection(i);
  };
  const scrubProps = scrubOn
    ? {
        ref: plotRef,
        onStartShouldSetResponderCapture: (e) => {
          scrubState.start = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
          return false;
        },
        // Take over only for drags along the category axis, so a parent ScrollView still scrolls.
        onMoveShouldSetResponderCapture: (e) => {
          const st = scrubState.start;
          if (!st) return false;
          const dx = Math.abs(e.nativeEvent.pageX - st.x);
          const dy = Math.abs(e.nativeEvent.pageY - st.y);
          const along = horizontal ? dy : dx;
          return along > 6 && along > (horizontal ? dx : dy);
        },
        onResponderGrant: (e) => {
          scrubState.index = undefined;
          const node = plotRef.current;
          if (node && typeof node.measure === 'function') {
            node.measure((x, y, w, h, pageX, pageY) => {
              if (typeof pageX !== 'number') return;
              scrubState.origin = { x: pageX, y: pageY };
              if (scrubState.last) scrubTo(scrubState.last);
            });
          }
          scrubTo(e.nativeEvent);
        },
        onResponderMove: (e) => scrubTo(e.nativeEvent),
        onResponderTerminationRequest: () => false,
        onResponderRelease: () => {
          scrubState.start = null;
        },
        onResponderTerminate: () => {
          scrubState.start = null;
        },
      }
    : null;

  // --- loading pulse ------------------------------------------------------------------
  const pulse = useRef(new Animated.Value(1)).current;
  const pulsing = loading && !reduceMotion;
  useEffect(() => {
    if (!pulsing) {
      const settle = Animated.timing(pulse, { toValue: 1, duration: 150, useNativeDriver: true });
      settle.start();
      return () => settle.stop();
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.45, duration: 750, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 750, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulsing, pulse]);

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
  const labelText = (i) => (hasXLabels && xLabels[i] != null ? xLabels[i] : '');
  let body = null;
  if (geometry && horizontal) {
    const placed = canPlace;
    body = (
      <View style={styles.hBody}>
        {hasXLabels &&
          (sortOn ? (
            <View style={[styles.catColumnSorted, { paddingBottom: axisH }]}>
              <View style={[styles.clip, { height: rowsHeight }]}>
                {/* Invisible copies size the column; the visible labels slide with their bars. */}
                <View style={styles.sizer}>
                  {values.map((_, i) => (
                    <Text key={i} numberOfLines={1} style={[styles.xLabel, styles.sizerText, xLabelStyle]}>
                      {labelText(i)}
                    </Text>
                  ))}
                </View>
                {placed &&
                  keys.map((key, i) => (
                    <Animated.View key={key} style={[styles.catSlide, { height: row.slot, transform: slide(key) }]}>
                      <Text numberOfLines={1} style={[styles.xLabel, xLabelStyle]}>
                        {labelText(i)}
                      </Text>
                    </Animated.View>
                  ))}
              </View>
            </View>
          ) : (
            <View style={[styles.catColumn, { paddingBottom: axisH }]}>
              {values.map((_, i) => (
                <View key={i} style={[styles.catCell, { height: row.slot }]}>
                  <Text numberOfLines={1} style={[styles.xLabel, xLabelStyle]}>
                    {labelText(i)}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        <View style={styles.track} testID={`${testID}-plot`} onLayout={onTrackLayout} {...scrubProps}>
          <View style={[{ height: rowsHeight }, sortOn && styles.clip]}>
            {trackWidth != null && lines(true)}
            {trackWidth != null &&
              (sortOn
                ? placed &&
                  keys.map((key, i) => (
                    <Animated.View
                      key={key}
                      testID={`${testID}-slide-${i}`}
                      style={[styles.rowSlide, { height: row.slot, transform: slide(key) }, selected === i && styles.raised]}
                    >
                      {renderSlot(slots[i], i)}
                    </Animated.View>
                  ))
                : slots.map((slot, i) => renderSlot(slot, i)))}
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
    // Sorted columns are absolutely placed, so they carry their own px size and no margin.
    const colGeo = sortOn ? { ...g, margin: 0 } : g;
    const colLeft = 2 * pad;
    const colWidth = pitch != null ? Math.max(0, pitch - 2 * pad) : 0;
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
          <View testID={`${testID}-plot`} onLayout={onTrackLayout} {...scrubProps}>
            {lines(false)}
            <View
              style={[
                styles.plot,
                { height: g.labelTop + L + g.labelBottom, paddingHorizontal: sortOn ? 0 : `${g.margin}%` },
                sortOn && styles.clipX,
              ]}
            >
              {sortOn
                ? canPlace &&
                  keys.map((key, i) => (
                    <Animated.View
                      key={key}
                      testID={`${testID}-slide-${i}`}
                      style={[styles.colSlide, { left: colLeft, width: colWidth, transform: slide(key) }, selected === i && styles.raised]}
                    >
                      {renderSlot(slots[i], i, colGeo)}
                    </Animated.View>
                  ))
                : slots.map((slot, i) => renderSlot(slot, i))}
            </View>
          </View>
          {hasXLabels &&
            (sortOn ? (
              <View style={[styles.xAxis, styles.clipX]}>
                {canPlace &&
                  keys.map((key, i) => (
                    <Animated.View key={key} style={[styles.xSlide, { left: colLeft, width: colWidth, transform: slide(key) }]}>
                      <Text numberOfLines={1} style={[styles.xLabel, xLabelStyle]}>
                        {labelText(i)}
                      </Text>
                    </Animated.View>
                  ))}
              </View>
            ) : (
              <View style={[styles.xAxis, { paddingHorizontal: `${g.margin}%` }]}>
                {values.map((_, i) => (
                  <View key={i} style={[styles.xCell, { marginHorizontal: `${g.margin}%` }]}>
                    <Text numberOfLines={1} style={[styles.xLabel, xLabelStyle]}>
                      {labelText(i)}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
        </View>
      </View>
    );
  }

  const legend = legendOn ? (
    <View testID={`${testID}-legend`} onLayout={onLegendLayout} style={[styles.legend, legendStyle]}>
      {norm.list.map((s, i) => (
        <View key={i} style={styles.legendItem}>
          <View style={[styles.swatch, { backgroundColor: colorOfSeries(i, norm.values[0] ? norm.values[0][i] : 0, 0) }]} />
          <Text style={[styles.legendText, legendTextStyle]}>{seriesName(i)}</Text>
        </View>
      ))}
    </View>
  ) : null;

  const containerSizing =
    typeof height === 'number' ? { height: totalHeight } : hasOwnSize ? null : { height: fallbackHeight };
  const rootProps = { testID, onLayout, style: [containerStyles, style, containerSizing, styles.container] };
  if (loading) {
    Object.assign(rootProps, { accessible: true, accessibilityLabel: 'Loading chart', accessibilityState: { busy: true } });
  }
  const content = (
    <>
      <Animated.View style={[styles.fill, { opacity: pulse }]}>{body}</Animated.View>
      {legend}
    </>
  );

  // Selectable charts always render a Pressable root (disabled while nothing is selected):
  // switching the root element type would remount every bar. Tapping the chart outside
  // the bars clears the selection.
  if (selectable) {
    return (
      <Pressable
        {...rootProps}
        accessible={rootProps.accessible || false}
        disabled={selected == null}
        onPress={() => changeSelection(null)}
      >
        {content}
      </Pressable>
    );
  }
  return <View {...rootProps}>{content}</View>;
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden' },
  fill: { flex: 1 },
  clip: { overflow: 'hidden' },
  clipX: { overflow: 'hidden' },
  raised: { zIndex: 1 },
  rowSlide: { position: 'absolute', left: 0, right: 0, top: 0 },
  colSlide: { position: 'absolute', top: 0, bottom: 0 },
  xSlide: { position: 'absolute', top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  catColumnSorted: {},
  sizer: { height: 0, overflow: 'hidden' },
  sizerText: { marginRight: 6 },
  catSlide: { position: 'absolute', left: 0, right: 6, top: 0, justifyContent: 'center', alignItems: 'flex-end' },
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
