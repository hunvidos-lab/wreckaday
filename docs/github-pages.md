# GitHub Pages preview

Public preview: https://hunvidos-lab.github.io/wreckaday/

The gallery contains the three everyday-betrayal photographs, with captions
underneath. Source lives on the `feat/local-launcher-key-console` branch;
GitHub Pages serves the generated web export from the root of `gh-pages`.

Build from the repository root:

```sh
EXPO_NO_DOTENV=1 WRECKADAY_WEB_BASE_URL=/wreckaday EXPO_PUBLIC_API_URL=https://hunvidos-lab.github.io/wreckaday/api pnpm --filter mobile exec expo export --platform web --max-workers 1
node scripts/check-console-release.cjs
node scripts/prepare-pages.cjs
```

Publish the contents of `apps/mobile/dist/` to `gh-pages`, preserving its
`.nojekyll` file. The Pages source is `gh-pages`, directory `/`.
`prepare-pages.cjs` creates HTML entry points for top-level routes so direct
links and refreshes work on GitHub Pages. Legacy dynamic redirects fall back
through `404.html`.

The base URL applies only when its build environment variable is set, so local
and native builds retain their existing configuration. The export explicitly
disables dotenv loading. Provider credentials and the local development key
console are excluded from the published web build.

This is the static app preview. GitHub Pages does not run the Python API; live
generation remains unavailable there. No model inference is performed by the
build or deployment.
