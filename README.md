# react-native-animated-charts

[![npm](https://img.shields.io/npm/v/react-native-animated-charts.svg)](https://www.npmjs.com/package/react-native-animated-charts)
[![CI](https://github.com/nachourpi/react-native-animated-charts/actions/workflows/ci.yml/badge.svg)](https://github.com/nachourpi/react-native-animated-charts/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/react-native-animated-charts.svg)](LICENSE)

An animated bar chart for React Native.

- **Runs on the UI thread** — bars animate with `transform` + `useNativeDriver`, so the JS thread can be busy and the animation stays smooth.
- **Zero dependencies** — just `react` and `react-native`. No SVG, no Reanimated, no Skia.
- **Small** — about 13 kB packed (docs included), no build step.
- **TypeScript types** included.
- Works on iOS, Android and React Native Web.

<p align="center">
  <img src="https://raw.githubusercontent.com/nachourpi/react-native-animated-charts/master/demo.gif" width="452" alt="Animated bar chart demo">
</p>

## Installation

```sh
npm install react-native-animated-charts
# or
yarn add react-native-animated-charts
```

Requires React Native `>= 0.64` and React `>= 17`. Nothing to link, no native code.

## Quick start

```jsx
import React, { useState } from 'react';
import { Button, View } from 'react-native';
import { BarChart } from 'react-native-animated-charts';

export default function SalesChart() {
  const [data, setData] = useState([120, 340, 90, 260, 410, 180]);

  return (
    <View style={{ padding: 16 }}>
      <BarChart
        dataY={data}
        xLabels={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']}
        showValues
        formatValue={(v) => `$${v}`}
        color={['#4f7cbd', '#7fa7e0']}
        barRadius={6}
        height={240}
        animationDelay="stagger"
        onBarPress={({ xLabel, value }) => console.log(xLabel, value)}
      />
      <Button
        title="Shuffle"
        onPress={() => setData(data.map(() => Math.round(Math.random() * 500)))}
      />
    </View>
  );
}
```

Whenever `dataY` changes, every bar animates from its current height to the new one.

## Recipes

**Fill the available space (flex height)**

```jsx
<View style={{ flex: 1 }}>
  <BarChart dataY={data} style={{ flex: 1 }} />
</View>
```

If you don't pass `height`, the chart measures itself when its style has a `height` or `flex`; otherwise it defaults to 200 px.

**Color by value**

```jsx
<BarChart
  dataY={[95, 40, 72, 15]}
  maxValue={100}
  color={(v) => (v >= 70 ? '#3aa76d' : v >= 30 ? '#e0a526' : '#d9534f')}
  showValues
  formatValue={(v) => `${v}%`}
/>
```

**Fixed scale** — pass `maxValue` so charts with different data share the same scale (e.g. percentages, or comparing two charts side by side).

**Y axis with grid lines**

```jsx
<BarChart
  dataY={[120, 340, 90, 260, 410, 180]}
  xLabels={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']}
  showYAxis
  formatValue={(v) => `$${v}`}
/>
```

The scale is rounded up to a "nice" top value (here `$0 … $500` in steps of 100). `yTicks` is a target, so the step always stays a round number; with `maxValue` the axis is split into exactly `yTicks` intervals. Axis labels use `formatValue` unless you pass `formatYLabel`.

**Horizontal bars**

```jsx
<BarChart
  horizontal
  dataY={[82, 64, 45, 30]}
  xLabels={['JavaScript', 'Python', 'Go', 'Rust']}
  showValues
  formatValue={(v) => `${v}%`}
  maxValue={100}
  height={200}
/>
```

`xLabels` are drawn as category labels on the left, values sit at the end of each bar and, with `showYAxis`, the value axis goes along the bottom. Bars fill the width of the chart, and the height is split evenly between them.

**Tap a bar to highlight it**

```jsx
<BarChart dataY={data} xLabels={months} showTooltip formatValue={(v) => `$${v}`} />
```

Tapping a bar selects it: the other bars fade to `dimOpacity` and a tooltip (`"Apr: $260"`) appears on the selected one; tapping it again clears the selection. To control the selection yourself, pass `selectedIndex` and update it from `onBarPress`:

```jsx
const [selected, setSelected] = useState(null);

<BarChart
  dataY={data}
  selectedIndex={selected}
  showTooltip
  onBarPress={({ index }) => setSelected(index === selected ? null : index)}
/>
```

`selectedIndex` also works without `showTooltip`, to just highlight a bar.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `dataY` | `number[]` | **required** | Values to plot. Negative or non-numeric values are drawn as `0`. |
| `labels` | `string[]` | — | Text shown above each bar. Takes precedence over `showValues`. |
| `xLabels` | `string[]` | — | Text shown under each bar (x-axis). |
| `showValues` | `boolean` | `false` | Show `formatValue(value)` above bars when `labels` is not set. |
| `formatValue` | `(value, index) => string` | `String` | Formats values for `showValues` and accessibility labels. |
| `color` | `string \| string[] \| (value, index) => string` | `'red'` | One color, a palette cycled across bars, or a function. |
| `height` | `number` | measured / `200` | Fixed height in px (labels included). |
| `maxValue` | `number` | `max(dataY)` | Top of the scale. Values above it are clamped. |
| `horizontal` | `boolean` | `false` | Draw bars left to right. See [Horizontal bars](#recipes). |
| `barRadius` | `number` | `25` | Radius of the bars' outer corners (top, or right when horizontal). |
| `style` / `containerStyles` | `ViewStyle` | — | Styles for the container. `containerStyles` is kept for backwards compatibility. |
| `labelStyle` | `TextStyle` | — | Style for the labels above bars. |
| `xLabelStyle` | `TextStyle` | — | Style for the x-axis labels. |
| `showYAxis` | `boolean` | `false` | Value axis with grid lines (left, or bottom when horizontal). |
| `yTicks` | `number` | `4` | Target number of axis intervals (exact when `maxValue` is set). |
| `formatYLabel` | `(value, index) => string` | `formatValue` | Formats axis labels. |
| `yLabelStyle` | `TextStyle` | — | Style for the axis labels. |
| `gridColor` | `string` | `'#e3e3e3'` | Color of the grid lines. |
| `selectedIndex` | `number \| null` | — | Highlighted bar (controlled). The rest fade to `dimOpacity`. |
| `showTooltip` | `boolean` | `false` | Tooltip on the selected bar. Makes bars tappable; uncontrolled unless `selectedIndex` is set. |
| `formatTooltip` | `({ index, value, label, xLabel }) => string` | `"xLabel: value"` | Tooltip text. |
| `tooltipStyle` / `tooltipTextStyle` | `ViewStyle` / `TextStyle` | — | Tooltip bubble and text styles. |
| `dimOpacity` | `number` | `0.35` | Opacity of non-selected bars while one is selected. |
| `animationDuration` | `number` | `300` | Duration in ms. |
| `animationDelay` | `'random' \| 'stagger' \| 'none' \| number` | `'random'` | Delay before each bar starts. A number means *ms × bar index*. |
| `easing` | `EasingFunction` | `Easing.out(Easing.cubic)` | Any function from React Native's `Easing`. |
| `respectReduceMotion` | `boolean` | `true` | Skip animations when the OS "Reduce motion" setting is on. |
| `onBarPress` | `({ index, value, label, xLabel }) => void` | — | Makes bars pressable. |
| `testID` | `string` | `'bar-chart'` | Bars get `${testID}-bar-${index}`. |

### Accessibility

Each bar exposes an accessibility label like `"Apr: $260"` (x-label + value label) and a `selected` accessibility state, and bars become buttons when `onBarPress` or `showTooltip` is set. Animations are disabled automatically when the user has "Reduce motion" enabled.

## Migrating from 0.0.x

1.0 is a rewrite with the same core API, so most code keeps working unchanged.

- **Peer dependencies** now accept modern versions (`react >= 17`, `react-native >= 0.64`). 0.0.x declared `react-native ^0.61`, which made `npm install` fail on current projects without `--legacy-peer-deps`.
- `containerStyles` is **optional** now (it used to crash when missing) and is no longer mutated.
- `height` is optional; the chart can size itself with flex.
- Bars grow from zero on mount and then animate from their current height on updates.
- Changes to `labels` or `color` are now rendered even if `dataY` is the same array.
- Bars only round their top corners.

See [CHANGELOG.md](CHANGELOG.md) for the full list.

## Roadmap

- Grouped and stacked bars
- Negative values (bars below a baseline)
- Line chart

Ideas and PRs are welcome — open an [issue](https://github.com/nachourpi/react-native-animated-charts/issues).

## Development

```sh
npm install
npm test
```

### Releasing

Releases are published to npm by GitHub Actions ([`publish.yml`](.github/workflows/publish.yml)) using
[trusted publishing](https://docs.npmjs.com/trusted-publishers), so there is no npm token stored in the repo and
every version ships with a signed [provenance](https://docs.npmjs.com/generating-provenance-statements) statement.

1. Update `CHANGELOG.md`.
2. `npm version <patch|minor|major>` (bumps `package.json` and creates the `vX.Y.Z` tag).
3. `git push --follow-tags`.

The workflow checks that the tag matches `package.json`, runs the tests and publishes.
Pre-release versions (e.g. `1.2.0-beta.0`) are published under the `next` dist-tag.

## License

[MIT](LICENSE) © José Ignacio Urpi
