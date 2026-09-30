import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { VALUE_LABEL_SPACE, segmentTiming } from './layout';

const TOOLTIP_BOX = 200; // generous box the tooltip is aligned inside; never clips it
const CLIP_PAD = 60; // extra room beside a bar for its value label

/**
 * One segment: a full-length view parked just past the baseline (hidden) and translated
 * by its length, so only its end shows inside the clipped region. Offset 0 always means
 * "hidden", whatever the region size, and only `transform` is animated (native driver).
 */
function Segment({ value, horizontal, side, regionLength, length, color, radius, label, labelSpace, labelStyle, duration, delay, easing, testID }) {
  const R = regionLength;
  const key = `${horizontal ? 'h' : 'v'}${side}`;
  const target = SIGN[key] * length;

  useEffect(() => {
    const anim = Animated.timing(value, {
      toValue: target,
      duration,
      delay,
      easing: easing || Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
    // `delay` is intentionally not a dependency: a new random delay must not retrigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration, value]);

  const r = radius || 0;
  const shape = {
    vpos: { height: R, borderTopLeftRadius: r, borderTopRightRadius: r },
    vneg: { height: R, borderBottomLeftRadius: r, borderBottomRightRadius: r },
    hpos: { width: R, borderTopRightRadius: r, borderBottomRightRadius: r },
    hneg: { width: R, borderTopLeftRadius: r, borderBottomLeftRadius: r },
  }[key];
  const transform = horizontal ? [{ translateX: value }] : [{ translateY: value }];

  return (
    <Animated.View testID={testID} style={[PARK[key], shape, { backgroundColor: color, transform }]}>
      {label != null && label !== '' ? (
        <View pointerEvents="none" style={[LABEL_PLACE[key], horizontal && { width: labelSpace }]}>
          <Text numberOfLines={1} style={[styles.label, horizontal && styles.hLabel, labelStyle]}>
            {label}
          </Text>
        </View>
      ) : null}
    </Animated.View>
  );
}

/**
 * One category: a positive region above/right of the baseline and a negative one
 * below/left, each clipped, holding one segment per series (side by side when
 * grouped, overlapping when stacked). Dimming is applied to the whole slot so
 * overlapping stacked segments fade as one layer.
 */
export default function BarSlot({
  horizontal,
  stacked,
  geometry,
  bars,
  colors,
  labels,
  anchor,
  tooltip,
  tooltipStyle,
  tooltipTextStyle,
  radius,
  duration,
  delay,
  easing,
  dimmed,
  dimOpacity,
  selected,
  labelStyle,
  onPress,
  accessibilityLabel,
  segmentTestID,
  tooltipTestID,
  testID,
}) {
  const { P, N, labelTop, labelBottom, labelLeft, labelRight, thickness, margin } = geometry;
  const k = bars.length;

  // Two animated values per series (positive / negative segment), created lazily and kept stable.
  const valuesRef = useRef([]);
  const values = valuesRef.current;
  for (let s = values.length / 2; s < k; s++) {
    values.push(new Animated.Value(0), new Animated.Value(0));
  }

  // Previous lengths, to sequence sign changes (see segmentTiming).
  const prevBars = useRef(null);
  useEffect(() => {
    prevBars.current = bars;
  });

  const opacity = useRef(new Animated.Value(dimmed ? dimOpacity : 1)).current;
  useEffect(() => {
    const anim = Animated.timing(opacity, {
      toValue: dimmed ? dimOpacity : 1,
      duration: Math.min(duration, 200),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [dimmed, dimOpacity, duration, opacity]);

  // A segment that is retracting to 0 keeps its last color, so a bar that changes sign
  // doesn't flash the new color while it's still on the old side of the baseline.
  const lastColors = useRef({});
  const segColor = (s, side) => {
    const key = `${side}${s}`;
    if (bars[s][side] > 0 || lastColors.current[key] == null) lastColors.current[key] = colors[s];
    return lastColors.current[key];
  };

  const seg = (s, side) => {
    const timing = segmentTiming(prevBars.current && prevBars.current[s], bars[s], side, duration, delay);
    return (
    <Segment
      key={`${side}${s}`}
      value={values[2 * s + (side === 'neg' ? 1 : 0)]}
      horizontal={horizontal}
      side={side}
      regionLength={side === 'pos' ? P : N}
      length={bars[s][side]}
      color={segColor(s, side)}
      radius={(side === 'pos' ? bars[s].posRadius : bars[s].negRadius) ? radius : 0}
      label={tooltip == null && labels[s] && labels[s].side === side ? labels[s].text : null}
      labelSpace={side === 'pos' ? labelRight : labelLeft}
      labelStyle={labelStyle}
      duration={timing.duration}
      delay={timing.delay}
      easing={easing}
      testID={segmentTestID(s, side)}
    />
    );
  };

  const order = Array.from({ length: k }, (_, s) => s);
  // Painter's order for stacks: outer (cumulative) segments first, inner ones on top.
  const drawOrder = stacked ? order.slice().reverse() : order;
  const cell = (side, s) => (
    <View key={s} style={[styles.fill, k > 1 && (horizontal ? styles.hGap : styles.vGap)]}>
      {seg(s, side)}
    </View>
  );
  const region = (side) =>
    stacked ? <View style={styles.fill}>{drawOrder.map((s) => seg(s, side))}</View> : order.map((s) => cell(side, s));

  // Regions clip bars along the value axis. Across it, the clip box is widened (negative
  // margin + equal padding) so value labels wider than a bar aren't cut off.
  const clip = [styles.region, horizontal ? styles.hClipPad : styles.vClipPad];
  const posRegion = (
    <View style={[clip, horizontal ? { width: P + labelRight } : { height: labelTop + P }, !stacked && (horizontal ? styles.hStackCol : styles.vRow)]}>
      {region('pos')}
    </View>
  );
  const negSize = horizontal ? labelLeft + N : N + labelBottom;
  const negRegion =
    negSize > 0 ? (
      <View style={[clip, horizontal ? { width: negSize } : { height: negSize }, !stacked && (horizontal ? styles.hStackCol : styles.vRow)]}>
        {region('neg')}
      </View>
    ) : null;

  let overlay = null;
  if (tooltip != null && k > 0) {
    const { series: as, side, placement } = anchor;
    const v = values[2 * as + (side === 'neg' ? 1 : 0)];
    const inside = placement === 'inside';
    let box;
    if (horizontal) {
      const W = Math.max(100, labelLeft + N + P + labelRight);
      const base = labelLeft + N; // baseline x; the bar end is at base + v
      const toRight = side === 'pos' ? !inside : inside;
      box = toRight
        ? { left: base, width: W, alignItems: 'flex-start', paddingLeft: inside ? 4 : 6 }
        : { left: base - W, width: W, alignItems: 'flex-end', paddingRight: inside ? 4 : 6 };
      box = [styles.hTipBox, box, { transform: [{ translateX: v }] }];
    } else {
      const H = TOOLTIP_BOX;
      const base = labelTop + P; // baseline y; the bar end is at base + v
      const below = side === 'pos' ? inside : !inside;
      box = below
        ? { top: base, justifyContent: 'flex-start', paddingTop: 4 }
        : { top: base - H, justifyContent: 'flex-end', paddingBottom: 4 };
      box = [styles.vTipBox, { height: H }, box, { transform: [{ translateY: v }] }];
    }
    overlay = (
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Animated.View style={box}>
          <View testID={tooltipTestID} style={[styles.tooltip, tooltipStyle]}>
            <Text style={[styles.tooltipText, tooltipTextStyle]}>{tooltip}</Text>
          </View>
        </Animated.View>
      </View>
    );
  }

  const slotStyle = horizontal
    ? [styles.row, { height: thickness, marginVertical: margin }]
    : [styles.column, { marginHorizontal: `${margin}%` }];
  if (selected) slotStyle.push(styles.raised);

  const content = (
    <>
      {/* Not touchable: the widened clip boxes overlap neighbours, taps must hit the slot itself. */}
      <Animated.View pointerEvents="none" style={[horizontal ? styles.hInner : styles.vInner, { opacity }]}>
        {horizontal ? negRegion : posRegion}
        {horizontal ? posRegion : negRegion}
      </Animated.View>
      {overlay}
    </>
  );
  const a11y = { accessibilityLabel, accessibilityState: { selected: !!selected } };
  if (onPress) {
    return (
      <Pressable testID={testID} style={slotStyle} onPress={onPress} accessibilityRole="button" {...a11y}>
        {content}
      </Pressable>
    );
  }
  return (
    <View testID={testID} style={slotStyle} accessible {...a11y}>
      {content}
    </View>
  );
}

// Where a segment is parked (hidden, touching the baseline) and which way it moves out.
const PARK = {
  vpos: { position: 'absolute', left: 0, right: 0, top: '100%' },
  vneg: { position: 'absolute', left: 0, right: 0, bottom: '100%' },
  hpos: { position: 'absolute', top: 0, bottom: 0, right: '100%' },
  hneg: { position: 'absolute', top: 0, bottom: 0, left: '100%' },
};
const SIGN = { vpos: -1, vneg: 1, hpos: 1, hneg: -1 };
const LABEL_BASE = { position: 'absolute', alignItems: 'center', justifyContent: 'center' };
const LABEL_PLACE = {
  vpos: { ...LABEL_BASE, top: -VALUE_LABEL_SPACE, left: -60, right: -60, height: VALUE_LABEL_SPACE },
  vneg: { ...LABEL_BASE, top: '100%', left: -60, right: -60, height: VALUE_LABEL_SPACE },
  hpos: { ...LABEL_BASE, left: '100%', top: -20, bottom: -20, alignItems: 'flex-start', paddingLeft: 6 },
  hneg: { ...LABEL_BASE, right: '100%', top: -20, bottom: -20, alignItems: 'flex-end', paddingRight: 6 },
};

const styles = StyleSheet.create({
  column: { flex: 1 },
  row: {},
  raised: { zIndex: 1 },
  vInner: { flex: 1 },
  hInner: { flex: 1, flexDirection: 'row' },
  region: { overflow: 'hidden' },
  vClipPad: { marginHorizontal: -CLIP_PAD, paddingHorizontal: CLIP_PAD },
  hClipPad: { marginVertical: -20, paddingVertical: 20 },
  vRow: { flexDirection: 'row' },
  hStackCol: { flexDirection: 'column' },
  fill: { flex: 1 },
  vGap: { marginHorizontal: 1 },
  hGap: { marginVertical: 1 },
  label: { fontWeight: '700', color: 'grey', fontSize: 16 },
  hLabel: { fontSize: 13 },
  vTipBox: { position: 'absolute', left: -100, right: -100, alignItems: 'center' },
  hTipBox: { position: 'absolute', top: -100, bottom: -100, justifyContent: 'center' },
  tooltip: { backgroundColor: '#222', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  tooltipText: { color: '#fff', fontSize: 12, fontWeight: '600', lineHeight: 16 },
});
