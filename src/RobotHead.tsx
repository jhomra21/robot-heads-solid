import { createEffect, createSignal, createUniqueId, onCleanup, onMount, splitProps } from 'solid-js';
import type { JSX } from 'solid-js';
import type { RobotHeadProps, RobotHeadShape, RobotHeadState } from './types';
import { getShape } from './tv/geometry';
import { RobotSim, restPose } from './tv/sim';
import { RobotRenderer, type Palette } from './tv/render';
import { linear } from './tv/light';
import { parseColor } from './color';
import { subscribe, pointer } from './ticker';

export const robotHeadShapes: RobotHeadShape[] = ['rectangle', 'square', 'circle', 'hexagon'];

export const robotHeadStates: RobotHeadState[] = [
  'idle', 'thinking', 'searching', 'listening', 'speaking', 'working', 'happy', 'error', 'sleeping',
];

function hashSeed(id: string): number {
  let h = 2166136261;

  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);

  return ((h >>> 0) % 1000) / 1000;
}

function palette(color: string, trim: string, screen: string): Palette {
  const shell = parseColor(color) ?? [48, 80, 172];
  const metal = parseColor(trim) ?? [150, 168, 200];
  const led = parseColor(screen) ?? [232, 242, 255];

  return {
    shell: { albedo: linear(shell), f0: 0.05, metal: 0.15, spec: 0.55, shininess: 70, rim: 0.9 },
    trim: { albedo: linear(metal), f0: 0.2, metal: 0.65, spec: 0.8, shininess: 45, rim: 0.7 },
    led,
  };
}

const validState = (value: RobotHeadState | undefined): RobotHeadState =>
  value && robotHeadStates.includes(value) ? value : 'idle';

const validShape = (value: RobotHeadShape | undefined): RobotHeadShape =>
  value && robotHeadShapes.includes(value) ? value : 'rectangle';

function isClickCallback(handler: RobotHeadProps['onClick']): handler is JSX.EventHandler<HTMLCanvasElement, MouseEvent> {
  return typeof handler === 'function';
}

function isRefCallback(ref: RobotHeadProps['ref']): ref is (element: HTMLCanvasElement) => void {
  return typeof ref === 'function';
}

function isMutableRef(ref: unknown): ref is { current: unknown } {
  return ref !== null && typeof ref === 'object' && 'current' in ref;
}

function isStyleText(style: RobotHeadProps['style']): style is string {
  return typeof style === 'string';
}

/** An animated TV-headed robot, rendered on a 2D canvas. */
export function RobotHead(props: RobotHeadProps): JSX.Element {
  const id = createUniqueId();

  const [local, rest] = splitProps(props, [
    'model', 'shape', 'state', 'size', 'color', 'trimColor', 'screenColor',
    'speed', 'paused', 'interactive', 'floorShadow', 'seed',
    'class', 'className', 'style', 'onClick', 'aria-label', 'ref',
  ]);

  let canvas!: HTMLCanvasElement;
  let renderer: RobotRenderer | undefined;

  const sim = new RobotSim(
    Math.min(1, Math.max(0, local.seed ?? hashSeed(id))),
    validState(local.state),
  );

  const [reduceMotion, setReduceMotion] = createSignal(false);
  onMount(() => {
    if (typeof matchMedia === 'undefined') return;
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(query.matches);
    const changed = () => setReduceMotion(query.matches);
    query.addEventListener('change', changed);
    onCleanup(() => query.removeEventListener('change', changed));
  });

  createEffect(() => {
    const state = validState(local.state);
    const shape = getShape(validShape(local.shape));
    const size = local.size ?? 160;

    const colors = palette(
      local.color ?? '#2b49a3',
      local.trimColor ?? '#93a6c8',
      local.screenColor ?? '#e8f2ff',
    );

    const speed = local.speed ?? 1;
    const interactive = local.interactive ?? true;
    const floorShadow = local.floorShadow ?? true;
    const still = (local.paused ?? false) || !(speed > 0) || reduceMotion();

    sim.setState(state);

    const paint = (animated: boolean) => {
      if (!canvas) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const pixels = Math.round(size * dpr);

      if (canvas.width !== pixels || canvas.height !== pixels) {
        canvas.width = pixels;
        canvas.height = pixels;
      }

      const ctx = canvas.getContext('2d');

      if (!ctx) return;
      renderer ??= new RobotRenderer();
      renderer.draw(
        ctx, pixels,
        animated ? sim.pose : restPose(state),
        animated ? sim : null,
        state, shape, colors, { floorShadow },
      );
    };

    if (still) {
      paint(false);

      return;
    }

    const unsubscribe = subscribe((dt) => {
      if (interactive && Number.isFinite(pointer.x)) {
        const rect = canvas.getBoundingClientRect();
        const dx = pointer.x - (rect.left + rect.width / 2);
        const dy = pointer.y - (rect.top + rect.height * 0.56);
        sim.pointer = Math.hypot(dx, dy) < 700 ? { x: dx, y: dy } : null;
      } else {
        sim.pointer = null;
      }

      sim.update(dt * speed);
      paint(true);
    });

    onCleanup(unsubscribe);
  });

  const handleClick: JSX.EventHandler<HTMLCanvasElement, MouseEvent> = (event) => {
    if ((local.interactive ?? true) && !(local.paused ?? false) && (local.speed ?? 1) > 0 && !reduceMotion()) {
      sim.poke();
    }

    const handler = local.onClick;

    if (isClickCallback(handler)) handler(event);
    else if (Array.isArray(handler)) handler[0](handler[1], event);
  };

  const setRef = (element: HTMLCanvasElement) => {
    canvas = element;
    const ref = local.ref;

    if (isRefCallback(ref)) ref(element);
    else if (isMutableRef(ref)) {
      ref.current = element;
    }
  };

  return (
    <canvas
      ref={setRef}
      role="img"
      aria-label={local['aria-label'] ?? `Robot, ${validState(local.state)}`}
      class={local.class ?? local.className}
      style={isStyleText(local.style)
        ? `width:${local.size ?? 160}px;height:${local.size ?? 160}px;display:block;cursor:${local.interactive === false ? 'auto' : 'pointer'};${local.style}`
        : {
            width: `${local.size ?? 160}px`,
            height: `${local.size ?? 160}px`,
            display: 'block',
            cursor: local.interactive === false ? undefined : 'pointer',
            ...local.style,
          }}
      onClick={handleClick}
      {...rest}
    />
  );
}
