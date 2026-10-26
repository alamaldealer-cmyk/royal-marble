/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BALLS_PER_BLOCK, BRICK_HOLES, GRID_COLS, GRID_ROWS } from './constants';
import { GridCell, LevelData, MarbleColor } from './types';

/**
 * Creates the exact Level 35 layout from PDF Section 5 & 14:
 *
 * r0: . . ? ? . .
 * r1: . ? R P ? .
 * r2: ? Y C P W ?
 * r3: D3 ? P L ? L
 * r4: P O Y D3 K Y
 * r5: . L W K P . (exit row)
 */
export function getLevel35(): LevelData {
  // 6x6 grid
  const grid: GridCell[][] = Array.from({ length: GRID_ROWS }, () =>
    Array.from({ length: GRID_COLS }, () => ({ kind: 'wall' as const }))
  );

  // Helper to set cell
  const setCell = (r: number, c: number, cell: Partial<GridCell>) => {
    grid[r][c] = {
      kind: 'block',
      ...cell,
    } as GridCell;
  };

  // r0: . . ? ? . .
  setCell(0, 2, { kind: 'locked', color: 'cyan' });
  setCell(0, 3, { kind: 'locked', color: 'orange' });

  // r1: . ? R P ? .
  setCell(1, 1, { kind: 'locked', color: 'lime' });
  setCell(1, 2, { kind: 'block', color: 'red' });
  setCell(1, 3, { kind: 'block', color: 'purple' });
  setCell(1, 4, { kind: 'locked', color: 'pink' });

  // r2: ? Y C P W ?
  setCell(2, 0, { kind: 'locked', color: 'yellow' });
  setCell(2, 1, { kind: 'block', color: 'yellow' });
  setCell(2, 2, { kind: 'block', color: 'cyan' });
  setCell(2, 3, { kind: 'block', color: 'purple' });
  setCell(2, 4, { kind: 'block', color: 'ice' });
  setCell(2, 5, { kind: 'locked', color: 'red' });

  // r3: D3 ? P L ? L
  // Dispenser 1 at (3, 0)
  setCell(3, 0, {
    kind: 'dispenser',
    counter: 3,
    queue: ['purple', 'ice', 'cyan'],
  });
  setCell(3, 1, { kind: 'locked', color: 'purple' });
  setCell(3, 2, { kind: 'block', color: 'purple' });
  setCell(3, 3, { kind: 'block', color: 'lime' });
  setCell(3, 4, { kind: 'locked', color: 'yellow' });
  setCell(3, 5, { kind: 'block', color: 'lime' });

  // r4: P O Y D3 K Y
  setCell(4, 0, { kind: 'block', color: 'purple' });
  setCell(4, 1, { kind: 'block', color: 'orange' });
  setCell(4, 2, { kind: 'block', color: 'yellow' });
  // Dispenser 2 at (4, 3)
  setCell(4, 3, {
    kind: 'dispenser',
    counter: 3,
    queue: ['pink', 'lime', 'purple'],
  });
  setCell(4, 4, { kind: 'block', color: 'pink' });
  setCell(4, 5, { kind: 'block', color: 'yellow' });

  // r5: . L W K P .  (exit row)
  setCell(5, 1, { kind: 'block', color: 'lime' });
  setCell(5, 2, { kind: 'block', color: 'ice' });
  setCell(5, 3, { kind: 'block', color: 'pink' });
  setCell(5, 4, { kind: 'block', color: 'purple' });

  // Let's count all blocks of each color:
  // Visible blocks:
  // R: (1,2) = 1
  // P: (1,3), (2,3), (3,2), (4,0), (5,4) = 5
  // Y: (2,1), (4,2), (4,5) = 3
  // C: (2,2) = 1
  // W: (2,4), (5,2) = 2
  // L: (3,3), (3,5), (5,1) = 3
  // O: (4,1) = 1
  // K: (4,4), (5,3) = 2
  //
  // Locked tiles (8):
  // (0,2): cyan (+1) -> C: 2
  // (0,3): orange (+1) -> O: 2
  // (1,1): lime (+1) -> L: 4
  // (1,4): pink (+1) -> K: 3
  // (2,0): yellow (+1) -> Y: 4
  // (2,5): red (+1) -> R: 2
  // (3,1): purple (+1) -> P: 6
  // (3,4): yellow (+1) -> Y: 5
  //
  // Dispenser 1 queue (3): purple (+1), ice (+1), cyan (+1) -> P: 7, W: 3, C: 3
  // Dispenser 2 queue (3): pink (+1), lime (+1), purple (+1) -> K: 4, L: 5, P: 8
  //
  // Total blocks per color:
  // Purple (P): 8 blocks  => 8 * 3 = 24 bricks
  // Lime   (L): 5 blocks  => 5 * 3 = 15 bricks
  // Yellow (Y): 5 blocks  => 5 * 3 = 15 bricks
  // Pink   (K): 4 blocks  => 4 * 3 = 12 bricks
  // Cyan   (C): 3 blocks  => 3 * 3 =  9 bricks
  // Ice    (W): 3 blocks  => 3 * 3 =  9 bricks
  // Orange (O): 2 blocks  => 2 * 3 =  6 bricks
  // Red    (R): 2 blocks  => 2 * 3 =  6 bricks
  //
  // Total blocks = 8+5+5+4+3+3+2+2 = 32 blocks.
  // Total bricks = 32 * 3 = 96 bricks.
  // Distributed into 4 columns (24 bricks each).

  const columns: MarbleColor[][] = [
    // col 0 (24 bricks)
    [
      'purple', 'purple', 'lime', 'yellow', 'pink', 'purple', 'cyan', 'lime',
      'yellow', 'ice', 'purple', 'pink', 'orange', 'lime', 'yellow', 'purple',
      'red', 'cyan', 'purple', 'pink', 'ice', 'yellow', 'lime', 'purple',
    ],
    // col 1 (24 bricks)
    [
      'purple', 'lime', 'yellow', 'purple', 'cyan', 'purple', 'ice', 'orange',
      'purple', 'lime', 'yellow', 'pink', 'red', 'cyan', 'purple', 'lime',
      'yellow', 'pink', 'ice', 'purple', 'orange', 'yellow', 'pink', 'lime',
    ],
    // col 2 (24 bricks)
    [
      'lime', 'purple', 'cyan', 'yellow', 'pink', 'ice', 'red', 'purple',
      'lime', 'yellow', 'orange', 'purple', 'purple', 'cyan', 'lime', 'yellow',
      'ice', 'pink', 'purple', 'red', 'cyan', 'yellow', 'purple', 'lime',
    ],
    // col 3 (24 bricks)
    [
      'pink', 'yellow', 'purple', 'ice', 'lime', 'orange', 'purple', 'cyan',
      'pink', 'red', 'yellow', 'lime', 'purple', 'ice', 'pink', 'purple',
      'cyan', 'yellow', 'lime', 'orange', 'pink', 'purple', 'red', 'ice',
    ],
  ];

  return {
    levelNumber: 35,
    grid,
    columns,
    ballsPerBlock: BALLS_PER_BLOCK,
  };
}

/**
 * Creates Level 1 (a friendly, quick intro level to learn mechanics)
 */
export function getLevel1(): LevelData {
  const grid: GridCell[][] = Array.from({ length: GRID_ROWS }, () =>
    Array.from({ length: GRID_COLS }, () => ({ kind: 'wall' as const }))
  );

  // A 4-block beginner level
  grid[4][2] = { kind: 'block', color: 'purple' };
  grid[4][3] = { kind: 'block', color: 'pink' };
  grid[5][2] = { kind: 'block', color: 'lime' };
  grid[5][3] = { kind: 'block', color: 'yellow' };

  // 1 block of each = 3 bricks each
  const columns: MarbleColor[][] = [
    ['lime', 'purple', 'pink'],
    ['yellow', 'lime', 'purple'],
    ['purple', 'yellow', 'lime'],
    ['pink', 'pink', 'yellow'],
  ];

  return {
    levelNumber: 1,
    grid,
    columns,
    ballsPerBlock: BALLS_PER_BLOCK,
  };
}

/**
 * Procedural solvable level generator
 */
export function generateSolvableLevel(levelNum: number): LevelData {
  if (levelNum === 35) return getLevel35();
  if (levelNum === 1) return getLevel1();

  const colors: MarbleColor[] = ['purple', 'pink', 'ice', 'yellow', 'lime', 'cyan'];
  if (levelNum > 10) colors.push('orange');
  if (levelNum > 20) colors.push('red');

  const grid: GridCell[][] = Array.from({ length: GRID_ROWS }, () =>
    Array.from({ length: GRID_COLS }, () => ({ kind: 'wall' as const }))
  );

  // Standard pyramid mask
  const mask = [
    [0, 0, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 0],
    [1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 0],
  ];

  const colorCounts: Record<MarbleColor, number> = {
    purple: 0,
    pink: 0,
    ice: 0,
    yellow: 0,
    lime: 0,
    cyan: 0,
    orange: 0,
    red: 0,
  };

  let totalPlacedBlocks = 0;

  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      if (!mask[r][c]) continue;

      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      // Randomly decide if locked or normal
      const isLocked = r <= 2 && Math.random() < 0.35;
      grid[r][c] = {
        kind: isLocked ? 'locked' : 'block',
        color: randomColor,
      };
      colorCounts[randomColor]++;
      totalPlacedBlocks++;
    }
  }

  // Create brick columns satisfying (blocks * 3 == bricks)
  const brickList: MarbleColor[] = [];
  for (const c of colors) {
    const numBricks = colorCounts[c] * (BALLS_PER_BLOCK / BRICK_HOLES);
    for (let i = 0; i < numBricks; i++) {
      brickList.push(c);
    }
  }

  // Shuffle brick list
  for (let i = brickList.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [brickList[i], brickList[j]] = [brickList[j], brickList[i]];
  }

  // Distribute into 4 columns evenly
  const columns: MarbleColor[][] = [[], [], [], []];
  brickList.forEach((brickColor, idx) => {
    columns[idx % 4].push(brickColor);
  });

  return {
    levelNumber: levelNum,
    grid,
    columns,
    ballsPerBlock: BALLS_PER_BLOCK,
  };
}
