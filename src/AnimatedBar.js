import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { VALUE_LABEL_SPACE } from './layout';

/**
 * One bar. The bar is a full-length view translated along its axis (Y for vertical,
 * X for horizontal) and dimmed with `opacity`, so every animation only touches
 * native-driver-compatible props and runs on the UI thread.
 */
export default function AnimatedBar({
  horizontal = false,
  barLength,
  plotLength,
  thickness,
  labelSpace = 0,
  label,
  tooltip,
  color,
  margin,
  radius,
  duration,
  delay,
  easing,
  dimmed = false,
  dimOpacity = 0.35,
  selected = false,
  labelStyle,
  tooltipStyle,
  tooltipTextStyle,
  onPress,
  accessibilityLabel,
  testID,
}) {
  // Start collapsed so bars grow on first mount (bar hidden past the axis origin).
  const collapsed = horizontal ? -plotLength : plotLength;
  const target = horizontal ? barLength - plotLength : plotLength - barLength;
  const offset = useRef(new Animated.Value(collapsed)).current;
  const opacity = useRef(new Animated.Value(dimmed ? dimOpacity : 1)).current;

  useEffect(() => {
    const anim = Animated.timing(offset, {
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
  }, [target, duration, offset]);

  useEffect(() => {
    const anim = Animated.timing(opacity, {
      toValue: dimmed ? dimOpacity : 1,
      duration: Math.min(duration, 200),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [dimmed, dimOpacity, duration, opacity]);

  const hasLabel = label != null && label !== '';
  const endContent =
    tooltip != null ? (
      <View testID={testID && `${testID}-tooltip`} style={[styles.tooltip, tooltipStyle]}>
        <Text numberOfLines={1} style={[styles.tooltipText, tooltipTextStyle]}>
          {tooltip}
        </Text>
      </View>
    ) : hasLabel ? (
      <Text numberOfLines={1} style={[styles.label, horizontal && styles.hLabel, labelStyle]}>
        {label}
      </Text>
    ) : null;

  const transform = horizontal ? [{ translateX: offset }] : [{ translateY: offset }];
  let content;
  let slotStyle;

  if (horizontal) {
    slotStyle = [styles.row, { height: thickness, marginVertical: margin }];
    content = (
      <>
        <View style={[styles.hClip, { width: plotLength }]}>
          <Animated.View
            testID={testID}
            style={[
              styles.hBar,
              {
                width: plotLength,
                backgroundColor: color,
                borderTopRightRadius: radius,
                borderBottomRightRadius: radius,
                opacity,
                transform,
              },
            ]}
          />
        </View>
        {endContent ? (
          <Animated.View
            style={[
              styles.hLabelWrap,
              tooltip != null && barLength > plotLength / 2
                ? // Long bar: tooltip goes inside, right-aligned to the bar end, so it never clips.
                  { left: 0, width: plotLength, alignItems: 'flex-end', paddingLeft: 0, paddingRight: 4 }
                : { left: plotLength, width: tooltip != null ? Math.max(labelSpace, plotLength) : labelSpace },
              { opacity: tooltip != null ? 1 : opacity, transform },
            ]}
          >
            {endContent}
          </Animated.View>
        ) : null}
      </>
    );
  } else {
    slotStyle = [styles.column, { marginHorizontal: `${margin}%` }];
    content = (
      <Animated.View
        testID={testID}
        style={[
          styles.bar,
          {
            height: plotLength,
            backgroundColor: color,
            borderTopLeftRadius: radius,
            borderTopRightRadius: radius,
            opacity,
            transform,
          },
        ]}
      >
        {endContent ? <View style={styles.labelWrap}>{endContent}</View> : null}
      </Animated.View>
    );
  }

  // The selected bar is raised so its tooltip is drawn above neighbouring bars.
  if (selected) slotStyle.push(styles.raised);
  const a11y = { accessibilityLabel, accessibilityState: { selected } };
  if (onPress) {
    return (
      <Pressable style={slotStyle} onPress={onPress} accessibilityRole="button" {...a11y}>
        {content}
      </Pressable>
    );
  }
  return (
    <View style={slotStyle} accessible {...a11y}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  column: { flex: 1, justifyContent: 'flex-end' },
  bar: { width: '100%', alignItems: 'center' },
  labelWrap: {
    position: 'absolute',
    top: -VALUE_LABEL_SPACE,
    left: -60,
    right: -60,
    height: VALUE_LABEL_SPACE,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  label: { fontWeight: '700', color: 'grey', fontSize: 16 },
  row: { flexDirection: 'row', alignItems: 'stretch' },
  hClip: { overflow: 'hidden' },
  hBar: { height: '100%' },
  hLabelWrap: {
    position: 'absolute',
    top: -VALUE_LABEL_SPACE,
    bottom: -VALUE_LABEL_SPACE,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 6,
    pointerEvents: 'none',
  },
  hLabel: { fontSize: 13 },
  raised: { zIndex: 1 },
  tooltip: {
    backgroundColor: '#222',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tooltipText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
