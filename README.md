# robot-heads-solid

Animated 3D robot heads for Solid. Glossy, TV-headed bots with an LED-matrix face that shows what your agent is doing: thinking, searching, listening, speaking and more. Choose from four shapes, with a springy antenna, knob ears and a light on top that changes with the state.

Drawn on a 2D canvas: no WebGL or runtime dependencies.

**[Playground →](https://robot-heads-solid.jhonra121.workers.dev)**

## Install

```sh
bun add robot-heads-solid
```

Solid 1.9+ is supported by the default entry point. Solid 2 is still a prerelease and has a separate, explicitly selected entry point: `robot-heads-solid/solid2`. Do not mix the two entry points in one application. Solid 2 apps need both `solid-js` and `@solidjs/web` at matching versions. Solid 2 support is verified against `2.0.0-rc.14`; it is opt-in prerelease support, not a claim of compatibility with a stable Solid 2 release.

## Quick start

```tsx
import { RobotHead } from 'robot-heads-solid';

function Agent(props: { status: 'idle' | 'thinking' | 'speaking' }) {
  return <RobotHead state={props.status} size={160} />;
}
```

### Solid 2 prerelease

Install matching Solid 2 prerelease packages and use the separate entry point:

```sh
bun add solid-js@2.0.0-rc.14 @solidjs/web@2.0.0-rc.14 robot-heads-solid
```

```tsx
import { render } from '@solidjs/web';
import { RobotHead } from 'robot-heads-solid/solid2';

render(() => <RobotHead state="thinking" />, document.getElementById('root')!);
```

The default `robot-heads-solid` entry remains the Solid 1.9 build. Configure the Solid 2 JSX runtime as `jsxImportSource: "@solidjs/web"` and use the Solid 2 Vite integration (`@solidjs/vite-plugin`); the Solid 1 `vite-plugin-solid` compiler does not target Solid 2. The library's Solid 2 entry has been checked for client rendering, server rendering, hydration and early-event replay.

## Shapes

One head, four outlines. Every shape has the same screen, ears, antenna, screws and back panel, and moves the same way.

```tsx
<RobotHead shape="rectangle" />  {/* the classic TV (default) */}
<RobotHead shape="square" />
<RobotHead shape="circle" />     {/* a porthole */}
<RobotHead shape="hexagon" />    {/* a nut, flat on top */}
```

The list is exported as `robotHeadShapes`.

## States

Each state has its own face on the screen, its own motion and its own antenna light. Switching states plays a short glitch and cross-fade, and the head eases into its new pose.

| State | Screen | Motion |
|---|---|---|
| `idle` | block eyes that blink and glance | looks around, hops now and then |
| `thinking` | heavy-lidded eyes looking up, three pulsing dots | head tilted up, switching sides; amber light pulses |
| `searching` | darting eyes, a beam sweeping the whole screen | head sweeps side to side; cyan beacon |
| `listening` | alert eyes over a live equaliser | head cocked, small nods; steady green light |
| `speaking` | a mouth that moves with the words | bobs as it talks |
| `working` | focused eyes looking down, a progress bar | busy bobbing, a hop with a spin now and then |
| `happy` | `^ ^` eyes and a smile | bouncy hops |
| `error` | red `X X` eyes | shakes its head; red light blinks |
| `sleeping` | closed eyes and rising z's | head drooped, slow breathing; light off |

The list is exported as `robotHeadStates`.

## Props

```tsx
<RobotHead
  model="tv"                // only "tv" is supported
  shape="rectangle"         // rectangle, square, circle or hexagon
  state="idle"              // what it is doing (above)
  size={160}                // px
  color="#2b49a3"           // the shell
  trimColor="#93a6c8"       // the ears and the antenna's collar
  screenColor="#e8f2ff"     // the LEDs
  speed={1}                 // multiplier on every animation
  paused={false}            // hold the state's still pose
  interactive               // follow the pointer, hop and spin on a click
  floorShadow               // the soft shadow under the head
  seed={0.3}                // 0–1, desyncs blinks and glances in a row of heads
/>
```

Any other canvas attribute (`class`, `className`, `style`, `onClick`, `aria-label`, ...) is passed through to the `<canvas>`, and a `ref` reaches it too. State and appearance props update when Solid signals change. Invalid sizes and speeds fall back to their defaults. Positive sizes are clamped to 32–1024px and speeds to 8×.

## Behaviour

- **Pointer play.** With `interactive` on (the default), the head and eyes follow a nearby pointer, and a click makes it hop with a full spin and a happy face.
- **Reduced motion.** With `prefers-reduced-motion: reduce`, `paused`, or a speed of `0`, the still pose of the state is drawn instead of the animation.
- **Accessible by default.** The canvas has `role="img"` and an `aria-label` naming the state ("Robot, thinking"); pass your own `aria-label` to override it.
- **Cheap to run many.** Every head on the page shares one animation loop, which sleeps while the tab is hidden, and heads of the same shape and size share their baked textures.

## How it is drawn

The head is real geometry: a shell with a rolled edge, its outline a convex polygon of corner centres grown by a corner radius, so one builder makes every shape. Knob ears and the antenna collar are lathed and built once as quad meshes. Each frame, the head turns with the pose and is projected, back faces are culled, and every quad is lit by a small studio model: a key light, a fill, a sky dome, a softbox and the key's window caught as clear-coat reflections with Fresnel, a cool back light rimming the silhouette, and a filmic tone curve.

The flat front and back are plates drawn in their own plane with baked relief: the lip rolling into the screen hole, the rubber gasket, the shadow the lip casts onto the glass, screws, and vents on the back. The glass sits a little behind the bezel, so it slides against it as the head turns. The LED matrix covers the whole screen, with the face centred on it. The LEDs are drawn crisp, then bloomed from a one-pixel-per-LED image scaled up smooth. The antenna is a damped spring that whips when the head hops, lands or tilts, topped with a frosted bulb lit from inside.

## Development

The library is in `src/`; the Solid playground is in `site/` and runs against the library source.

```sh
bun install
bun run setup:solid2 # installs the isolated Solid 2 compiler/runtime toolchain
bun run dev          # the playground
bun run build        # the library, to dist/
bun run typecheck    # installs the isolated Solid 2 toolchain if needed
bun run build:site   # build the library and playground (including Solid 2)
bun run deploy       # build everything and deploy the playground Worker
```

```
src/              the library
  RobotHead.tsx   the component
  tv/             geometry, lighting, faces, motion and renderer
site/             the playground (Vite + Cloudflare Worker)
```

Release and npm publishing instructions are in [docs/releases.md](docs/releases.md).

## License

[MIT](LICENSE) © [Fayaz Ahmed](https://x.com/fayazara). This is a Solid port by [jhomra21](https://github.com/jhomra21) of [Fayaz Ahmed's React library](https://github.com/fayazara/robot-heads).

The playground uses Open Runde by Laurids Kern under the SIL Open Font License 1.1 (`site/public/fonts/OFL.txt`). The font is not part of the npm package.
