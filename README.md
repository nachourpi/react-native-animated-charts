# react-native-animated-charts

[![npm](https://img.shields.io/npm/v/react-native-animated-charts.svg)](https://www.npmjs.com/package/react-native-animated-charts)
[![CI](https://github.com/nachourpi/react-native-animated-charts/actions/workflows/ci.yml/badge.svg)](https://github.com/nachourpi/react-native-animated-charts/actions/workflows/ci.yml)
![dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)
![types](https://img.shields.io/badge/types-TypeScript-blue)
[![license](https://img.shields.io/npm/l/react-native-animated-charts.svg)](LICENSE)

**Bar charts for React Native that move — and that your users can move.**

Most chart libraries draw numbers. This one lets people *touch* them: drag a bar to set a goal, scrub across a month, watch live data stream in or a ranking reshuffle — all animated on the UI thread, with zero dependencies.

<p align="center">
  <img src="https://raw.githubusercontent.com/nachourpi/react-native-animated-charts/master/demo.gif" width="452" alt="Animated bar chart demo: bar chart race, negative values, grouped and stacked series">
</p>

## Why this one?

- **Interactive, not just animated.** Drag bars to edit values, scrub with a finger, tap for tooltips. Charts become inputs: budgets, goals, plans, polls.
- **Smooth where it matters.** Bars move with `transform` + `useNativeDriver`, so animations run on the UI thread and stay fluid while your JS is busy.
- **Zero dependencies.** Just `react` and `react-native` — no SVG, no Skia, no Reanimated, nothing to link. Works in Expo Go, on iOS, Android and the web.
- **Understands changing data.** Bars keep their identity across updates: rankings reshuffle (bar chart race), live readings slide in and out, values that change sign cross the baseline.
- **Accessible.** Every bar has a label, editable bars are adjustable with VoiceOver / TalkBack, and "Reduce motion" is respected.
- **Small and typed.** Plain JS, no build step, TypeScript types included.

<table>
  <tr>
    <td align="center" width="33%"><img src="https://raw.githubusercontent.com/nachourpi/react-native-animated-charts/master/docs/gifs/plan-vs-actual.gif" width="260" alt="Plan vs actual"><br><b>Plan vs. actual</b></td>
    <td align="center" width="33%"><img src="https://raw.githubusercontent.com/nachourpi/react-native-animated-charts/master/docs/gifs/drag-to-edit.gif" width="260" alt="Drag to edit"><br><b>Drag to edit</b></td>
    <td align="center" width="33%"><img src="https://raw.githubusercontent.com/nachourpi/react-native-animated-charts/master/docs/gifs/live-stream.gif" width="260" alt="Live stream"><br><b>Live data</b></td>
  </tr>
  <tr>
    <td align="center" width="33%"><img src="https://raw.githubusercontent.com/nachourpi/react-native-animated-charts/master/docs/gifs/bar-chart-race.gif" width="260" alt="Bar chart race"><br><b>Bar chart race</b></td>
    <td align="center" width="33%"><img src="https://raw.githubusercontent.com/nachourpi/react-native-animated-charts/master/docs/gifs/scrub.gif" width="260" alt="Scrub"><br><b>Scrub</b></td>
    <td align="center" width="33%">…plus negative values, grouped &amp; stacked series, axes, horizontal bars, tooltips and loading skeletons.</td>
  </tr>
</table>

## Installation

```sh
npm install react-native-animated-charts
# or
yarn add react-native-animated-charts
```

Requires React Native `>= 0.64` and React `>= 17`. Nothing to link, no native code.

## Quick start

```jsx
import { BarChart } from 'react-native-animated-charts';

<BarChart
  dataY={[120, 340, 90, 260, 410, 180]}
  xLabels={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']}
  showValues
  formatValue={(v) => `$${v}`}
  color="#4f7cbd"
  barRadius={6}
/>
```

Change `dataY` and every bar animates from its current height to the new one. That's it — everything below is opt-in.

## Drag to edit

<p align="center"><img src="https://raw.githubusercontent.com/nachourpi/react-native-animated-charts/master/docs/gifs/drag-to-edit.gif" width="380" alt="Dragging bars to change a budget split"></p>

```jsx
const [split, setSplit] = useState([40, 25, 20, 15]);

<BarChart
  dataY={split}
  xLabels={['Rent', 'Food', 'Fun', 'Save']}
  editable
  step={5}
  maxValue={60}
  onChange={setSplit}
  showValues
  formatValue={(v) => `${v}%`}
/>
```

Drag a bar up or down (left or right on horizontal charts) and its value follows your finger, snapped to `step`, with a live tooltip. The chart is controlled like a `TextInput`: update `dataY` in `onChange`, and save in `onChangeEnd`. Pass a function to `editable` to choose which bars can move. The scale stays still while dragging, so set `maxValue` to give users room to go higher. Screen-reader users can adjust the same bars with swipe up / down.

## Plan vs. actual

The two ideas together: the past streams in as real data, the future is a plan you drag. When time moves on, today's plan becomes a real bar and everything slides one slot to the left.

<p align="center"><img src="https://raw.githubusercontent.com/nachourpi/react-native-animated-charts/master/docs/gifs/plan-vs-actual.gif" width="400" alt="Actual sleep vs. planned sleep, with draggable planned bars and time moving on"></p>

```jsx
function SleepPlan({ days, actual, plan, onPlanChange }) {
  // days: ids of the visible days (e.g. dates), actual: past values, plan: today + future
  const today = actual.length;
  return (
    <BarChart
      ids={days}
      dataY={[...actual, ...plan]}
      xLabels={days.map(weekdayName)} // e.g. "Mon", "Tue"…
      editable={(i) => i >= today}
      onChange={(values) => onPlanChange(values.slice(today))}
      step={0.5}
      maxValue={10}
      marker={{ at: today, label: 'Today' }}
      color={(v, i) => (i < today ? '#4f7cbd' : '#3aa76d')}
      editableStyle={{ opacity: 0.55 }}
      formatValue={(v) => `${v}h`}
      showYAxis
    />
  );
}
```

Works for any "how did it go / what's next" screen: budgets, step goals, sales targets, energy schedules.

## Live data

<p align="center"><img src="https://raw.githubusercontent.com/nachourpi/react-native-animated-charts/master/docs/gifs/live-stream.gif" width="380" alt="Live heart-rate readings sliding in"></p>

```jsx
<BarChart dataY={readings.map((r) => r.bpm)} ids={readings.map((r) => r.time)} maxValue={120} />
```

Give each value an id (a timestamp works) and keep a window of the latest readings: new bars slide in from the edge and old ones slide out, instead of the whole chart jumping. Everything moves on the native driver, so it stays smooth even when readings arrive fast.

## Bar chart race

<p align="center"><img src="https://raw.githubusercontent.com/nachourpi/react-native-animated-charts/master/docs/gifs/bar-chart-race.gif" width="380" alt="Most loved languages bar chart race"></p>

```jsx
<BarChart
  horizontal
  sort="desc"
  maxBars={7}
  loading={!frame}
  dataY={frame?.values ?? []}
  xLabels={languages}
  showValues
/>
```

With `sort`, bars are ordered by value and slide to their new place (with their labels) whenever the ranking changes, while their lengths animate too. Categories are followed by `ids` (or `xLabels`), so the data can come in any order. `maxBars` shows only the top N: the rest slide in and out from the edge. Update the data about every `animationDuration` ms for a continuous race. Works with vertical charts and `series` (sorted by total) too.

## Scrub and tooltips

<p align="center"><img src="https://raw.githubusercontent.com/nachourpi/react-native-animated-charts/master/docs/gifs/scrub.gif" width="380" alt="Scrubbing across monthly revenue bars"></p>

```jsx
<BarChart dataY={revenue} xLabels={months} scrub showTooltip onSelectionChange={() => Haptics.selectionAsync()} />
```

Drag along the bars and the selection (and tooltip) follows the finger, like in finance apps; taps still work. Only drags along the bars are taken, so a parent `ScrollView` keeps scrolling. The chart has no dependencies, so haptics are up to you: hook them to `onSelectionChange` (the example uses `expo-haptics`).

**Tap a bar to highlight it**

```jsx
<BarChart dataY={data} xLabels={months} showTooltip formatValue={(v) => `$${v}`} />
```

Tapping a bar selects it: the other bars fade to `dimOpacity` and a tooltip (`"Apr: $260"`) appears on the selected one. Tapping it again, or tapping the chart anywhere outside the bars, clears the selection. To control the selection yourself, pass `selectedIndex` and `onSelectionChange`:

```jsx
const [selected, setSelected] = useState(null);

<BarChart dataY={data} selectedIndex={selected} onSelectionChange={setSelected} showTooltip />
```

`onSelectionChange` alone (without `showTooltip`) makes bars selectable with just the highlight. To also close the tooltip when the user taps elsewhere on the screen, set `selectedIndex` back to `null` from that screen's own handler (e.g. a `Pressable` wrapping it, or when scrolling starts).

## Loading state

```jsx
<BarChart loading={!data} dataY={data ?? []} xLabels={months} />
```

While `loading`, the chart shows pulsing placeholder bars (one per `xLabels` item, or 6) in `skeletonColor`, with no labels or interaction. When `loading` turns false, the bars grow from the placeholders to the real values — no layout jump, no spinner.

## More recipes

**Negative values**

```jsx
<BarChart
  dataY={[12, -8, 20, -15, 6]}
  showValues
  formatValue={(v) => `${v}%`}
  color={(v) => (v < 0 ? '#d9534f' : '#3aa76d')}
/>
```

Negative values are drawn below a baseline (a zero line, colored with `baselineColor`). The scale always includes 0; pass `minValue` / `maxValue` to fix either end. When a bar changes sign, it first shrinks to zero and then grows on the other side.

**Grouped series**

```jsx
<BarChart
  series={[
    { name: 'Sales', data: [120, 200, 150, 280] },
    { name: 'Costs', data: [80, 110, 130, 150], color: '#e07a3a' },
  ]}
  xLabels={['Q1', 'Q2', 'Q3', 'Q4']}
  showYAxis
  showTooltip
/>
```

Each category gets one bar per series, and a legend is shown when the series have a `name`. Series without a `color` take it from `color` (if it's a palette) or from a built-in palette. The tooltip lists every series, and `formatValue` receives the series index as its third argument.

**Stacked series**

```jsx
<BarChart
  stacked
  showValues
  series={[
    { name: 'iOS', data: [40, 55, 30, 70] },
    { name: 'Android', data: [30, 45, 50, 40] },
    { name: 'Refunds', data: [-10, -5, -20, -8] },
  ]}
  xLabels={['W1', 'W2', 'W3', 'W4']}
/>
```

Positive values stack upwards and negative values downwards; `showValues` shows the total of each stack.

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

`xLabels` are drawn as category labels on the left, values sit at the end of each bar and, with `showYAxis`, the value axis goes along the bottom. Bars fill the width of the chart. Without `height` (or a flex / height style) the chart sizes itself from the number of bars, so a long list doesn't get squeezed. Negative values, `series` and `stacked` work the same way as in vertical charts.

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
| `dataY` | `number[]` | — | Values to plot. Negative values are drawn below a baseline; non-numeric values count as `0`. |
| `series` | `{ data, name?, color? }[]` | — | Several values per category. Replaces `dataY`. See [Grouped series](#recipes). |
| `stacked` | `boolean` | `false` | Stack `series` instead of drawing them side by side. |
| `labels` | `string[]` | — | Text shown above each bar. Takes precedence over `showValues`. |
| `xLabels` | `string[]` | — | Text shown under each bar (x-axis). |
| `showValues` | `boolean` | `false` | Show `formatValue(value)` above bars when `labels` is not set. |
| `formatValue` | `(value, index, seriesIndex?) => string` | `String` | Formats values for labels, tooltips and accessibility labels. |
| `color` | `string \| string[] \| (value, index) => string` | `'red'` | One color, a palette cycled across bars, or a function. |
| `height` | `number` | measured / `200` / auto | Fixed height in px (labels and legend included). Horizontal charts size themselves from the number of bars. |
| `maxValue` | `number` | largest value | Top of the scale. Values above it are clamped. |
| `minValue` | `number` | smallest value, or `0` | Bottom of the scale (must be negative). Values below it are clamped. |
| `horizontal` | `boolean` | `false` | Draw bars left to right. See [Horizontal bars](#recipes). |
| `barRadius` | `number` | `25` | Radius of the bars' outer corners (the end away from the baseline). |
| `style` / `containerStyles` | `ViewStyle` | — | Styles for the container. `containerStyles` is kept for backwards compatibility. |
| `labelStyle` | `TextStyle` | — | Style for the labels above bars. |
| `xLabelStyle` | `TextStyle` | — | Style for the x-axis labels. |
| `showYAxis` | `boolean` | `false` | Value axis with grid lines (left, or bottom when horizontal). |
| `yTicks` | `number` | `4` | Target number of axis intervals (exact when `maxValue` is set). |
| `formatYLabel` | `(value, index) => string` | `formatValue` | Formats axis labels. |
| `yLabelStyle` | `TextStyle` | — | Style for the axis labels. |
| `gridColor` | `string` | `'#e3e3e3'` | Color of the grid lines. |
| `baselineColor` | `string` | `'#9e9e9e'` | Color of the zero line shown when the scale goes below 0. |
| `showLegend` | `boolean` | when series have names | Legend under the chart for `series`. |
| `legendStyle` / `legendTextStyle` | `ViewStyle` / `TextStyle` | — | Legend container and text styles. |
| `selectedIndex` | `number \| null` | — | Highlighted bar (controlled). The rest fade to `dimOpacity`. |
| `onSelectionChange` | `(index \| null) => void` | — | Called when a bar is selected or the selection is cleared. Makes bars selectable. |
| `showTooltip` | `boolean` | `false` | Tooltip on the selected bar. Makes bars tappable; tapping outside the bars closes it. Uncontrolled unless `selectedIndex` is set. |
| `formatTooltip` | `({ index, value, values, label, xLabel }) => string` | `"xLabel: value"` | Tooltip text. May contain `\n`. |
| `tooltipStyle` / `tooltipTextStyle` | `ViewStyle` / `TextStyle` | — | Tooltip bubble and text styles. |
| `dimOpacity` | `number` | `0.35` | Opacity of non-selected bars while one is selected. |
| `sort` | `'desc' \| 'asc'` | — | Order bars by value; they slide to their new place when the ranking changes. |
| `ids` | `(string \| number)[]` | `xLabels` | Identity of each bar. With `sort` it follows bars across rankings; on its own it turns the chart into a stream (bars slide in and out). |
| `maxBars` | `number` | — | With `sort`, show only the first N bars. |
| `scrub` | `boolean` | `false` | Drag along the bars to select the one under the finger. |
| `loading` | `boolean` | `false` | Pulsing placeholder bars; the data grows from them. |
| `skeletonColor` | `string` | `'#e6e6e9'` | Color of the placeholder bars. |
| `editable` | `boolean \| (index) => boolean` | `false` | Drag bars to change their values (all bars, or the ones the function allows). |
| `step` | `number` | — | Snap edited values to this step. |
| `onChange` | `(values, index) => void` | — | Called while a bar is dragged, with the new values. The chart is controlled: update `dataY` from here. |
| `onChangeEnd` | `(values, index) => void` | — | Called when the drag ends (e.g. to save). |
| `editableStyle` | `ViewStyle` | — | Extra style for editable bars (e.g. `{ opacity: 0.55 }` for "planned"). |
| `marker` | `{ at, label?, color?, labelStyle? }` | — | Dashed line before bar `at` (e.g. "Today"). |
| `animationDuration` | `number` | `300` | Duration in ms. |
| `animationDelay` | `'random' \| 'stagger' \| 'none' \| number` | `'random'` | Delay before each bar starts. A number means *ms × bar index*. |
| `easing` | `EasingFunction` | `Easing.out(Easing.cubic)` | Any function from React Native's `Easing`. |
| `respectReduceMotion` | `boolean` | `true` | Skip animations when the OS "Reduce motion" setting is on. |
| `onBarPress` | `({ index, value, values, label, xLabel }) => void` | — | Makes bars pressable. With `series`, `value` is the category total and `values` has one item per series. |
| `testID` | `string` | `'bar-chart'` | Bars get `${testID}-bar-${index}`. |

### Accessibility

Each bar exposes an accessibility label like `"Apr: $260"` (x-label + value label; with `series`, `"Q1: Sales 120, Costs 80"`) and a `selected` accessibility state. Bars become buttons when `onBarPress`, `onSelectionChange`, `showTooltip` or `scrub` is set, and editable bars are *adjustable*: screen-reader users swipe up / down to change them by one `step`. While `loading`, the chart is announced as busy. Animations are disabled automatically when the user has "Reduce motion" enabled.

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

- Example app (Expo) and a Snack
- More ways to touch data: drag-to-reorder, range selection
- Line chart

Ideas and PRs are welcome — see [Contributing](#contributing).

## Contributing

Bug reports, ideas and pull requests are welcome! Open an [issue](https://github.com/nachourpi/react-native-animated-charts/issues/new/choose) or read [CONTRIBUTING.md](CONTRIBUTING.md) before sending a pull request.

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
