# robot-heads-solid

Animated robot heads for Solid. Four shapes, nine states, and the same Canvas 2D rendering engine as [Fayaz Ahmed's robot-heads](https://github.com/fayazara/robot-heads).

This is an independent Solid port of the MIT-licensed React project. The rendering, geometry, lighting, faces, and motion come from upstream. The component, playground, and build setup use Solid.

## Install

~~~sh
bun add robot-heads-solid
~~~

Requires Solid 1.9+ or a compatible Solid 2 prerelease. React, Three.js, and WebGL are not required.

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

Animations use one shared requestAnimationFrame loop and stop when the page is hidden. Disabled or reduced motion draws the resting pose. Interactive heads follow the pointer and respond to clicks. The canvas defaults to 'role="img"' and an accessible state label.

## Development

~~~sh
bun install
bun run dev        # Solid playground
bun run typecheck
bun run build      # library ES/CJS bundles and declarations
bun run check      # library and playground checks
~~~

The playground lives in 'site/'. The library is in 'src/'. To build the Cloudflare Worker playground, run 'bun run deploy' after configuring your Cloudflare account.

For now, the playground loads Open Runde fonts from the upstream repository because the source font binaries could not be transferred through the available GitHub connection. The library itself does not require fonts or external assets.

## Attribution and licensing

Original design and Canvas renderer by [Fayaz Ahmed](https://github.com/fayazara/robot-heads), copyright © 2026 Fayaz Ahmed, licensed MIT. The original MIT license is preserved in [LICENSE](./LICENSE). Open Runde by Laurids Kern, licensed SIL OFL 1.1; see 'site/public/fonts/OFL.txt'. The Solid port is also distributed under MIT.
