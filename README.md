# robot-heads-solid

Animated robot heads for Solid. Four shapes, nine states, and the same Canvas 2D rendering engine as [Fayaz Ahmed's robot-heads](https://github.com/fayazara/robot-heads).

This is an independent Solid port of the MIT-licensed React project. The rendering, geometry, lighting, faces, and motion come from upstream. The component, playground, and build setup use Solid.

## Install

~~~sh
bun add robot-heads-solid@beta
~~~

The prepared next beta is `0.1.0-beta.3`; after its trusted-publisher release succeeds, the `beta` tag will resolve to it while `latest` remains on `0.1.0-beta.0` until a stable release. Use `@beta` explicitly. Tested with Solid 1.9.17. Solid 2 prerelease compatibility has not been verified; its current release candidate does not provide the Solid 1 `solid-js/web` and `solid-js/jsx-runtime` entry points used by the tested consumer toolchain. React, Three.js, and WebGL are not required.

## Releases

Releases publish from an annotated Git tag matching the version in the root `package.json` (for example, `vX.Y.Z-beta.N`). The tag must point to the `main` commit that introduced that package version. The release workflow runs anti-slop rule regression, lint, typecheck, build, browser E2E, and packed-consumer checks before publishing the exact verified tarball with npm provenance. Beta versions publish to the `beta` dist-tag; stable versions publish to `latest`. Versions are immutable and are never republished.
All package releases share one concurrency group, and the workflow requires a release version to be strictly newer than the version already on its target npm dist-tag. If tags are pushed close together, an older queued release fails rather than moving the channel backward.

One-time maintainer setup:

1. In npm package settings for `robot-heads-solid`, configure **Trusted Publishers** for GitHub Actions with repository owner `jhomra21`, repository `robot-heads-solid`, workflow filename `release.yml`, and GitHub environment `npm-publish`. Do not create or store an npm token.
2. In GitHub repository settings, create the `npm-publish` environment. Optionally require a reviewer to approve publication; do not add environment secrets.
3. Ensure GitHub Actions is allowed to run and protect the `v*` tag namespace so only release maintainers can create release tags.

For each release, merge the versioned package change to `main`, then create and push its matching tag:

~~~sh
git tag -a vX.Y.Z-beta.N -m "vX.Y.Z-beta.N"
git push origin vX.Y.Z-beta.N
~~~

Do not run `npm publish` locally. If npm Trusted Publishing is not configured or the workflow binding does not match, the publish job will fail without a token fallback.

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

The component forwards ordinary Solid canvas attributes, event handlers, styling, accessibility attributes, and a canvas ref. State and appearance props react to Solid signals.

### Shapes

'rectangle' (default), 'square', 'circle', 'hexagon'. Exported as `robotHeadShapes`.

### States

'idle', 'thinking', 'searching', 'listening', 'speaking', 'working', 'happy', 'error', 'sleeping'. Exported as `robotHeadStates`.

### Props

| Prop | Type | Default |
| --- | --- | --- |
| 'model' | 'tv' | 'tv' |
| 'shape' | 'RobotHeadShape' | 'rectangle' |
| 'state' | 'RobotHeadState' | 'idle' |
| 'size' | 'number' (px) | 160 |
| 'color' | 'string' | '#2b49a3' |
| 'trimColor' | 'string' | '#93a6c8' |
| 'screenColor' | 'string' | '#e8f2ff' |
| 'speed' | 'number' | 1 |
| 'paused' | 'boolean' | false |
| 'interactive' | 'boolean' | true |
| 'floorShadow' | 'boolean' | true |
| 'seed' | 'number' (0–1) | generated per instance |

Animations use one shared requestAnimationFrame loop and stop when the page is hidden or the canvas leaves the viewport. Disabled or reduced motion draws the resting pose. Invalid sizes and speeds fall back to defaults; positive sizes are clamped to 32–1024px and speeds to 8× to keep rendering and simulation work bounded. Interactive heads follow the pointer and respond to clicks. The canvas defaults to 'role="img"' and an accessible state label. Node SSR imports resolve to server-compiled ESM/CJS builds; the canvas is rendered as markup and drawn once mounted on the client.

## Development

~~~sh
bun install
bun run dev        # Solid playground
bun run lint       # Oxlint: anti-slop rules and classic complexity (max 20)
bun run typecheck
bun run build      # browser and SSR ES/CJS bundles and declarations
bun run check      # lint, library and playground checks
bun run e2e        # playground browser regressions, including all 36 shape/state combinations
bun run e2e:consumer # packed Solid 1 consumer: typecheck, browser and Node ESM/CJS SSR
~~~

The playground lives in 'site/'. The library is in 'src/'. To build the Cloudflare Worker playground, run 'bun run deploy' after configuring your Cloudflare account.

Lint uses the vendored rules in 'tools/oxlint/anti-slop/' plus Oxlint's native accumulating-spread and ESLint classic cyclomatic-complexity rules. Geometric shape names are explicitly allowed by the shape-name rule because shape is a real domain concept here; unrelated `*Shape` names remain forbidden. Legitimate TypeScript type predicates may use `typeof` to distinguish Solid's callback and style unions. Browser screenshots and pixel observations are saved under 'test-results/'.

For now, the playground loads Open Runde fonts from the upstream repository because the source font binaries could not be transferred through the available GitHub connection. The library itself does not require fonts or external assets.

## Attribution and licensing

Original design and Canvas renderer by [Fayaz Ahmed](https://github.com/fayazara/robot-heads), copyright © 2026 Fayaz Ahmed, licensed MIT. The original MIT license is preserved in [LICENSE](./LICENSE). Open Runde by Laurids Kern, licensed SIL OFL 1.1; see 'site/public/fonts/OFL.txt'. The Solid port is also distributed under MIT.
