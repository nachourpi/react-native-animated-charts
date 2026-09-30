# react-native-animated-charts

[![npm](https://img.shields.io/npm/v/react-native-animated-charts.svg)](https://www.npmjs.com/package/react-native-animated-charts)
[![CI](https://github.com/nachourpi/react-native-animated-charts/actions/workflows/ci.yml/badge.svg)](https://github.com/nachourpi/react-native-animated-charts/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/react-native-animated-charts.svg)](LICENSE)

An animated bar chart for React Native.

- **Runs on the UI thread** — bars animate with `transform` + `useNativeDriver`, so the JS thread can be busy and the animation stays smooth.
- **Zero dependencies** — just `react` and `react-native`. No SVG, no Reanimated, no Skia.
- **Tiny** — under 10 kB packed.
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
| `barRadius` | `number` | `25` | Radius of the bars' top corners. |
| `style` / `containerStyles` | `ViewStyle` | — | Styles for the container. `containerStyles` is kept for backwards compatibility. |
| `labelStyle` | `TextStyle` | — | Style for the labels above bars. |
| `xLabelStyle` | `TextStyle` | — | Style for the x-axis labels. |
| `animationDuration` | `number` | `300` | Duration in ms. |
| `animationDelay` | `'random' \| 'stagger' \| 'none' \| number` | `'random'` | Delay before each bar starts. A number means *ms × bar index*. |
| `easing` | `EasingFunction` | `Easing.out(Easing.cubic)` | Any function from React Native's `Easing`. |
| `respectReduceMotion` | `boolean` | `true` | Skip animations when the OS "Reduce motion" setting is on. |
| `onBarPress` | `({ index, value, label, xLabel }) => void` | — | Makes bars pressable. |
| `testID` | `string` | `'bar-chart'` | Bars get `${testID}-bar-${index}`. |

### Accessibility

Each bar exposes an accessibility label like `"Apr: $260"` (x-label + value label), and bars become buttons when `onBarPress` is set. Animations are disabled automatically when the user has "Reduce motion" enabled.

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

- Horizontal bars
- Grouped and stacked bars
- Y-axis with grid lines
- Negative values (bars below a baseline)
- Line chart

Ideas and PRs are welcome — open an [issue](https://github.com/nachourpi/react-native-animated-charts/issues).

## Development

```sh
npm install
npm test
```

## License

[MIT](LICENSE) © José Ignacio Urpi
