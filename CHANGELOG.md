# Changelog

## 1.3.0 — 2026-10-01

### Added
- `sort` (`'desc'` / `'asc'`): bars are ordered by value and slide to their new place, labels included, when the ranking changes ("bar chart race"). Categories are followed by `ids` (default `xLabels`); `maxBars` shows only the top N. Works vertically, horizontally and with `series` (by total).
- `scrub`: drag along the bars to select the one under the finger. Only drags along the bars are taken, so parent ScrollViews keep scrolling.
- `loading` / `skeletonColor`: pulsing placeholder bars; the data grows from them when it arrives. The chart is announced as busy meanwhile.

### Fixed
- Selecting a bar remounted the whole chart (1.2.0), so every bar grew again from zero.

## 1.2.0 — 2026-09-30

### Added
- Negative values are drawn below a baseline (zero line, `baselineColor`), in vertical and horizontal charts, with axis ticks below 0. New `minValue` to fix the bottom of the scale.
- `series`: several values per category, drawn side by side (grouped) with a legend (`showLegend`, `legendStyle`, `legendTextStyle`).
- `stacked`: stacks `series`; positive and negative values stack separately and `showValues` shows each stack's total.
- `onSelectionChange(index | null)`: selection callback for controlled and uncontrolled charts; on its own it makes bars selectable without a tooltip.
- Multi-line tooltips (one line per series); `formatTooltip` may return `\n`.
- `onBarPress` / `formatTooltip` events include `values` (one per series). `formatValue` receives the series index.

### Changed
- **Negative values are no longer drawn as 0.** Charts whose data has negative values now show them below a baseline; clamp them to 0 yourself (`data.map((v) => Math.max(0, v))`) to keep the old look.
- Tapping the chart outside the bars closes the tooltip.
- Horizontal charts without `height` size themselves from the number of bars instead of a fixed 200 px.
- When a bar changes sign it first shrinks to 0 and then grows on the other side, keeping its old color while it retracts.
- Selection dimming fades each category as one layer, so stacked segments don't show through each other.
- Value labels wider than their bar are no longer clipped.
- New demo GIF.

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
