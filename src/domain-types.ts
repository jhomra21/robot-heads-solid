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
