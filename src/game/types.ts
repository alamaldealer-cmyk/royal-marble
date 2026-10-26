/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type MarbleColor =
  | 'purple'
  | 'pink'
  | 'ice'
  | 'yellow'
  | 'lime'
  | 'cyan'
  | 'orange'
  | 'red';

export type CellKind = 'empty' | 'block' | 'locked' | 'dispenser' | 'wall';

export interface GridCell {
  kind: CellKind;
  color?: MarbleColor; // for block, or hidden color for locked
  counter?: number; // for dispenser (e.g. 3)
  queue?: MarbleColor[]; // dispenser's upcoming blocks
  // Visual animation states
  animState?: 'idle' | 'pressed' | 'bursting' | 'revealing' | 'dispensing' | 'popBounced' | 'blocked';
  animTimer?: number; // 0 to 1
  scaleX?: number;
  scaleY?: number;
  offsetY?: number;
}

export interface Brick {
  color: MarbleColor;
  filled: number; // 0..3
  inFlight: number; // balls currently flying to this brick
  animState?: 'idle' | 'completing';
  animTimer?: number;
}

export interface BrickColumn {
  x: number;
  bricks: Brick[];
  lastDropTime: number; // to enforce min 60ms gap between drops
  shiftOffsetY: number; // for smooth slide up overshoot animation
}

export interface BeltBall {
  id: number;
  color: MarbleColor;
  slotIndex: number; // 0..29
  s: number; // distance along stadium path [0..PATH_LEN)
  scale: number; // for feed squash / transition
}

export interface FunnelBall {
  id: number;
  color: MarbleColor;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export interface DroppingBall {
  id: number;
  color: MarbleColor;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  progress: number; // 0..1
  duration: number; // e.g. 0.18s
  colIndex: number;
  holeIndex: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  shape: 'star' | 'circle' | 'sparkle';
}

export interface LevelData {
  levelNumber: number;
  grid: GridCell[][]; // 6x6
  columns: MarbleColor[][]; // 4 stacks of bricks (index 0 is top)
  ballsPerBlock: number;
}

export interface GameStats {
  score: number;
  coins: number;
  level: number;
  powerups: {
    magnet: number;
    shuffle: number;
    gumball: number;
  };
}
