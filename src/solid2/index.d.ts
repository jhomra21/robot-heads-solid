import type { JSX } from '@solidjs/web';

export type RobotHeadState =
  | 'idle'
  | 'thinking'
  | 'searching'
  | 'listening'
  | 'speaking'
  | 'working'
  | 'happy'
  | 'error'
  | 'sleeping';

export declare const robotHeadStates: RobotHeadState[];

export type RobotHeadModel = 'tv';

export type RobotHeadShape = 'rectangle' | 'square' | 'circle' | 'hexagon';

export declare const robotHeadShapes: RobotHeadShape[];

type CanvasRef = JSX.Ref<HTMLCanvasElement>;

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

export declare function RobotHead(props: RobotHeadProps): JSX.Element;
