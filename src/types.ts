import type { JSX } from 'solid-js';

const states = [
  'idle', 'thinking', 'searching', 'listening', 'speaking',
  'working', 'happy', 'error', 'sleeping',
] as const;

export type RobotHeadState = typeof states[number];

export const robotHeadStates: RobotHeadState[] = [...states];

export type RobotHeadModel = 'tv';

const geometries = ['rectangle', 'square', 'circle', 'hexagon'] as const;

export type RobotHeadShape = typeof geometries[number];

export const robotHeadShapes: RobotHeadShape[] = [...geometries];

/** Canvas attributes are forwarded to the underlying canvas. */
export interface RobotHeadProps extends Omit<JSX.CanvasHTMLAttributes<HTMLCanvasElement>, 'color'> {
  model?: RobotHeadModel;
  shape?: RobotHeadShape;
  state?: RobotHeadState;
  size?: number;
  color?: string;
  trimColor?: string;
  screenColor?: string;
  speed?: number;
  paused?: boolean;
  interactive?: boolean;
  floorShadow?: boolean;
  /** 0–1. Offsets blinks and glances across a row of heads. */
  seed?: number;
  /** React-compatible className alias; Solid's class prop also works. */
  className?: string;
}
