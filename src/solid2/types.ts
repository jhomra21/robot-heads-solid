import type { JSX } from '@solidjs/web';
import type { RobotHeadModel, RobotHeadShape, RobotHeadState } from '../domain-types';

export { robotHeadShapes, robotHeadStates } from '../domain-types';

export type { RobotHeadModel, RobotHeadShape, RobotHeadState } from '../domain-types';

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
