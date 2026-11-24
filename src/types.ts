import type { JSX } from 'solid-js';
import type { RobotHeadModel, RobotHeadShape, RobotHeadState } from './domain-types';

export { robotHeadShapes, robotHeadStates } from './domain-types';

export type { RobotHeadModel, RobotHeadShape, RobotHeadState } from './domain-types';

type CanvasRef = HTMLCanvasElement | ((element: HTMLCanvasElement) => void) |
  { current: HTMLCanvasElement | undefined } | CanvasRef[];

/** Element attributes go on the size × size span; ref receives its canvas. */
export interface RobotHeadProps extends Omit<JSX.HTMLAttributes<HTMLSpanElement>, 'color' | 'ref'> {
  ref?: CanvasRef;
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
  /**
   * Show the antenna's stem and its light. Default `true`. Turn it off for
   * small sizes, such as avatars in a list: the knob on top stays, and the
   * head grows to fill the room the antenna took.
   */
  antenna?: boolean;
  floorShadow?: boolean;
  /** 0–1. Offsets blinks and glances across a row of heads. */
  seed?: number;
  /** React-compatible className alias; Solid's class prop also works. */
  className?: string;
}
