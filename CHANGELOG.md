# Changelog

## 1.1.0 — 2026-09-30

### Added
- `horizontal`: bars grow left to right, with category labels on the left and values at the end of each bar.
- Value axis with grid lines: `showYAxis`, `yTicks`, `formatYLabel`, `yLabelStyle`, `gridColor`. The scale is rounded up to a "nice" top value.
- Selection: `selectedIndex` highlights a bar and fades the rest (`dimOpacity`); the fade runs on the native driver.
- Tooltips: `showTooltip` shows a tooltip on the selected bar and makes bars tappable (uncontrolled unless `selectedIndex` is set). Customizable with `formatTooltip`, `tooltipStyle`, `tooltipTextStyle`.
- Bars expose a `selected` accessibility state.
- `computeTicks` is exported.

### Changed
- Releases are published from GitHub Actions with npm trusted publishing (OIDC) and provenance.

### Fixed
- The chart no longer recomputes bar sizes on every render when `dataY` is omitted.

## 1.0.0 — 2026-09-30

Rewrite with hooks. The core API (`dataY`, `labels`, `color`, `height`, `containerStyles`) is unchanged.

### Fixed
- `npm install` failed on current React Native projects because peer dependencies were pinned to `react ^16.9` / `react-native ^0.61`.
- Crash when `containerStyles` was not provided.
- Crash when `containerStyles` was a frozen object; the prop was also being mutated.
- All bars shared one module-level `Animated.Value`.
- Bars used random `key`s and remounted on every render.
- Updates to `labels` / `color` were ignored unless `dataY` changed.
- Value labels had a fixed width of 45 px and could be truncated.
- `NaN`, negative and non-numeric values produced broken bars.

### Added
- `xLabels` for the x-axis.
- Flexible height: the chart measures its container when `height` is omitted.
- `color` accepts a palette array or a function.
- `maxValue`, `showValues`, `formatValue`, `barRadius`, `labelStyle`, `xLabelStyle`, `style`.
- `animationDuration`, `animationDelay` (`random` | `stagger` | `none` | ms), `easing`.
- `onBarPress`.
- Accessibility labels, and support for the OS "Reduce motion" setting.
- TypeScript types.
- Test suite (Jest + React Native Testing Library) and CI.

## 0.0.5 — 2020-02-12
- Initial public release.
