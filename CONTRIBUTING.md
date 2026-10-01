# Contributing

Thanks for helping improve react-native-animated-charts! Bug reports, ideas and pull requests are all welcome.

## Reporting bugs and ideas

Open an [issue](https://github.com/nachourpi/react-native-animated-charts/issues/new/choose) and pick a template. For bugs, the most useful thing is a small `<BarChart />` example that reproduces the problem, the versions you use and, for animations or gestures, a screen recording.

## Pull requests

1. Fork the repo and create a branch from `master`.
2. `npm install`, then make your change.
3. Add or update tests in `__tests__/` and run `npm test`.
4. Document new props in `README.md` (props table and, if useful, a recipe) and type them in `src/index.d.ts`.
5. Add a line to `CHANGELOG.md` under "Unreleased".
6. Open the pull request and fill in the template.

For larger changes or new props, please open an issue first so we can agree on the API before you invest time in it.

Every pull request is reviewed by the maintainer, and CI must pass before it's merged. Releases to npm are made by the maintainer.

## Project guidelines

- **Zero runtime dependencies.** The package only uses `react` and `react-native`.
- **Animate on the UI thread.** Animations use `Animated` with `useNativeDriver: true`, so only `transform` and `opacity` are animated.
- **Pure logic lives in `src/layout.js`** (no React imports) and is unit-tested there.
- **No build step.** Plain JavaScript, transpiled by Metro in the app.
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `test:`, `chore:`).

## Code of conduct

Be kind and assume good intent. Harassment or disrespectful behavior isn't welcome here.
