# robot-heads-solid

Animated robot heads for Solid. Four shapes and nine states, drawn with Canvas 2D. This is an independent Solid port of [Fayaz Ahmed's robot-heads](https://github.com/fayazara/robot-heads). The MIT-licensed design, geometry, lighting, faces, and motion come from upstream.

## Install

~~~sh
bun add robot-heads-solid
~~~

Requires Solid 1.9+. Solid 2 is not supported by this release. React, Three.js, and WebGL are not required.

## Usage

~~~tsx
import { createSignal } from 'solid-js';
import { RobotHead } from 'robot-heads-solid';

function Example() {
  const [state, setState] = createSignal<'idle' | 'thinking' | 'working'>('idle');

  return (
    <>
      <RobotHead
        state={state()}
        shape="rectangle"
        size={160}
        color="#2b49a3"
        trimColor="#93a6c8"
        screenColor="#e8f2ff"
        speed={1}
        interactive
        floorShadow
      />
      <button onClick={() => setState('thinking')}>Think</button>
    </>
  );
}
~~~

State and appearance props update when Solid signals change. The component forwards Solid canvas attributes, event handlers, styles, accessibility attributes, and a canvas ref. It also accepts `className`.

### Shapes

`rectangle` (default), `square`, `circle`, `hexagon`. The `robotHeadShapes` array and `RobotHeadShape` type are exported.

### States

`idle`, `thinking`, `searching`, `listening`, `speaking`, `working`, `happy`, `error`, `sleeping`. The `robotHeadStates` array and `RobotHeadState` type are exported.

### Props

| Prop | Type | Default |
| --- | --- | --- |
| `model` | `'tv'` | `'tv'` |
| `shape` | `RobotHeadShape` | `'rectangle'` |
| `state` | `RobotHeadState` | `'idle'` |
| `size` | `number` (px) | `160` |
| `color` | `string` | `'#2b49a3'` |
| `trimColor` | `string` | `'#93a6c8'` |
| `screenColor` | `string` | `'#e8f2ff'` |
| `speed` | `number` | `1` |
| `paused` | `boolean` | `false` |
| `interactive` | `boolean` | `true` |
| `floorShadow` | `boolean` | `true` |
| `seed` | `number` (0–1) | generated per instance |

The `model` prop currently accepts only `'tv'`. Invalid sizes and speeds fall back to their defaults. Positive sizes are clamped to 32–1024px and speeds to 8×.

The canvas defaults to `role="img"` and an accessible label for its state. Heads share one animation loop. Animations pause when the page is hidden, and heads outside the viewport stop animating. `paused`, speed `0`, or the reduced-motion preference draws the resting pose. Interactive heads follow the pointer and respond to clicks.

Node imports resolve to server-compiled ESM or CommonJS builds. Server rendering outputs canvas markup; the component draws on the canvas after it mounts in the browser.

## Releases

Releases publish from an annotated Git tag matching the version in the root `package.json` (for example, `vX.Y.Z-beta.N`). The tag must point to the `main` commit that introduced that package version. The release workflow runs anti-slop rule regression, lint, typecheck, build, browser E2E, and packed-consumer checks before publishing the exact verified tarball with npm provenance. Beta versions publish to the `beta` dist-tag; stable versions publish to `latest`. Versions are immutable and are never republished.

All package releases share one concurrency group, and the workflow requires a release version to be strictly newer than the version already on its target npm dist-tag. If tags are pushed close together, an older queued release fails rather than moving the channel backward.

One-time maintainer setup:

1. In npm package settings for `robot-heads-solid`, configure **Trusted Publishers** for GitHub Actions with repository owner `jhomra21`, repository `robot-heads-solid`, workflow filename `release.yml`, and GitHub environment `npm-publish`. Do not create or store an npm token.
2. In GitHub repository settings, create the `npm-publish` environment. Optionally require a reviewer to approve publication; do not add environment secrets.
3. Ensure GitHub Actions is allowed to run and protect the `v*` tag namespace so only release maintainers can create release tags.

For each release, merge the versioned package change to `main`, then create and push its matching tag:

~~~sh
git tag -a vX.Y.Z -m "vX.Y.Z"
git push origin vX.Y.Z
~~~

Do not run `npm publish` locally. If npm Trusted Publishing is not configured or the workflow binding does not match, the publish job fails without a token fallback.

## Development

~~~sh
bun install
bun run dev         # Solid playground
bun run lint        # Oxlint: anti-slop and classic complexity rules
bun run typecheck
bun run build       # Browser and SSR ES/CJS bundles and declarations
bun run check       # Lint, library and playground checks
bun run e2e         # Playground browser checks, including all 36 shape/state combinations
bun run e2e:consumer # Packed Solid 1 consumer: typecheck, browser and Node ESM/CJS SSR
~~~

The playground lives in `site/`. The library is in `src/`. To build the Cloudflare Worker playground, run `bun run deploy` after configuring your Cloudflare account.

Lint uses the vendored rules in `tools/oxlint/anti-slop/` plus Oxlint's native accumulating-spread and ESLint classic cyclomatic-complexity rules. Geometric shape names are allowed by the shape-name rule. Legitimate TypeScript type predicates may use `typeof` to distinguish Solid's callback and style unions. Browser screenshots and pixel observations are saved under `test-results/`.

The playground loads Open Runde fonts from the upstream repository because the font binaries could not be transferred through the available GitHub connection. The library does not require fonts or external assets.

## Attribution and licensing

Original design and Canvas renderer by [Fayaz Ahmed](https://github.com/fayazara/robot-heads), copyright © 2026 Fayaz Ahmed, licensed MIT. The original MIT license is preserved in [LICENSE](./LICENSE). Open Runde by Laurids Kern, licensed SIL OFL 1.1; see [`site/public/fonts/OFL.txt`](./site/public/fonts/OFL.txt). The Solid port is also distributed under MIT.
