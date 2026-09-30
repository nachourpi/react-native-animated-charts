import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { VALUE_LABEL_SPACE } from './layout';

/**
 * One bar. The bar is a full-height view translated down on the Y axis, so the
 * animation only touches `transform` and can run on the native (UI) thread.
 */
export default function AnimatedBar({
  barHeight,
  plotHeight,
  label,
  color,
  margin,
  radius,
  duration,
  delay,
  easing,
  labelStyle,
  onPress,
  accessibilityLabel,
  testID,
}) {
  // Start collapsed (translateY = plotHeight) so bars grow on first mount.
  const translateY = useRef(new Animated.Value(plotHeight)).current;
  const target = plotHeight - barHeight;

  useEffect(() => {
    const anim = Animated.timing(translateY, {
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
  }, [target, duration, translateY]);

  const bar = (
    <Animated.View
      testID={testID}
      style={[
        styles.bar,
        {
          height: plotHeight,
          backgroundColor: color,
          borderTopLeftRadius: radius,
          borderTopRightRadius: radius,
          transform: [{ translateY }],
        },
      ]}
    >
      {label != null && label !== '' ? (
        <View style={styles.labelWrap}>
          <Text numberOfLines={1} style={[styles.label, labelStyle]}>
            {label}
          </Text>
        </View>
      ) : null}
    </Animated.View>
  );

  const columnStyle = [styles.column, { marginHorizontal: `${margin}%` }];

  if (onPress) {
    return (
      <Pressable
        style={columnStyle}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        {bar}
      </Pressable>
    );
  }
  return (
    <View style={columnStyle} accessible accessibilityLabel={accessibilityLabel}>
      {bar}
    </View>
  );
}

const styles = StyleSheet.create({
  column: { flex: 1, justifyContent: 'flex-end' },
  bar: { width: '100%', alignItems: 'center' },
  labelWrap: {
    position: 'absolute',
    top: -VALUE_LABEL_SPACE,
    left: -40,
    right: -40,
    height: VALUE_LABEL_SPACE,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  label: { fontWeight: '700', color: 'grey', fontSize: 16 },
});
