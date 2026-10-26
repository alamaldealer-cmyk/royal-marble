/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  BALLS_PER_BLOCK,
  BELT_CAPACITY,
  BRICK_COLUMNS_X,
  BRICK_HOLES,
  EXIT_ROW,
  GRID_COLS,
  GRID_ROWS,
  MATCH_X_TOLERANCE,
  MAX_WAITING_BALLS,
  MIN_DROP_INTERVAL_MS,
  RESUME_WAITING_BALLS,
} from './constants';
import { BrickColumn, GridCell, LevelData, MarbleColor } from './types';

/**
 * Funnel backlog hysteresis rule:
 * If waiting balls in funnel reach >= 45, taps are blocked.
 * Taps remain blocked until waiting balls drop strictly below 40.
 */
export function shouldBlockBlockTap(
  waitingBallsCount: number,
  currentlyLocked: boolean
): boolean {
  if (waitingBallsCount >= MAX_WAITING_BALLS) {
    return true;
  }
  if (currentlyLocked) {
    return waitingBallsCount >= RESUME_WAITING_BALLS;
  }
  return false;
}

/**
 * Exposed (tappable) check:
 * A block is tappable if:
 * 1. It is a block (not empty, locked, dispenser, or wall)
 * 2. It is in row 5 (exit row, open funnel below) OR
 * 3. At least one of its 4 orthogonal neighbors is an 'empty' cell inside the mask.
 * (Note: cells with kind 'wall' outside the mask do NOT count as empty).
 */
export function isExposed(grid: GridCell[][], r: number, c: number): boolean {
  if (r < 0 || r >= GRID_ROWS || c < 0 || c >= GRID_COLS) return false;
  const cell = grid[r][c];
  if (!cell || cell.kind !== 'block') return false;

  // Exit row is open to funnel below
  if (r === EXIT_ROW) return true;

  const neighbors = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];

  return neighbors.some(([dr, dc]) => {
    const nr = r + dr;
    const nc = c + dc;
    if (nr < 0 || nr >= GRID_ROWS || nc < 0 || nc >= GRID_COLS) return false;
    return grid[nr][nc].kind === 'empty';
  });
}

/**
 * Grid update after tap or block removal:
 * 1. Revealing locked tiles that now touch an empty cell.
 * 2. Dispenser drop: if cell directly below (r+1, c) is empty and counter > 0,
 *    drop next block into (r+1, c) and counter--.
 * 3. Detecting blocks that newly became exposed.
 */
export interface GridUpdateResult {
  revealedCells: { r: number; c: number; color: MarbleColor }[];
  dispensedCells: { r: number; c: number; color: MarbleColor; dispenserR: number; dispenserC: number }[];
  newlyExposed: { r: number; c: number }[];
}

export function updateGridAfterChange(grid: GridCell[][]): GridUpdateResult {
  const result: GridUpdateResult = {
    revealedCells: [],
    dispensedCells: [],
    newlyExposed: [],
  };

  // 1. Reveal locked tiles adjacent to any empty cell
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const cell = grid[r][c];
      if (cell.kind === 'locked') {
        const hasEmptyNeighbor = [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ].some(([dr, dc]) => {
          const nr = r + dr;
          const nc = c + dc;
          if (nr < 0 || nr >= GRID_ROWS || nc < 0 || nc >= GRID_COLS) return false;
          return grid[nr][nc].kind === 'empty';
        });

        if (hasEmptyNeighbor) {
          // Reveal locked cell into a normal block
          cell.kind = 'block';
          cell.animState = 'revealing';
          cell.animTimer = 0;
          result.revealedCells.push({ r, c, color: cell.color! });
        }
      }
    }
  }

  // 2. Check dispensers (if empty below and counter > 0, slide block in)
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const cell = grid[r][c];
      if (cell.kind === 'dispenser' && cell.counter && cell.counter > 0) {
        const belowR = r + 1;
        if (belowR < GRID_ROWS && grid[belowR][c].kind === 'empty') {
          const nextColor = cell.queue?.shift() || 'purple';
          cell.counter--;
          grid[belowR][c] = {
            kind: 'block',
            color: nextColor,
            animState: 'dispensing',
            animTimer: 0,
            offsetY: -33, // slide in from above
          };
          result.dispensedCells.push({
            r: belowR,
            c,
            color: nextColor,
            dispenserR: r,
            dispenserC: c,
          });
        }
      }
    }
  }

  // 3. Newly exposed check
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      if (grid[r][c].kind === 'block' && isExposed(grid, r, c)) {
        result.newlyExposed.push({ r, c });
      }
    }
  }

  return result;
}

/**
 * Handles tap on cell. Returns true if cell was tapped and popped.
 */
export function tapCell(grid: GridCell[][], r: number, c: number): { tapped: boolean; color?: MarbleColor } {
  if (!isExposed(grid, r, c)) {
    return { tapped: false };
  }

  const cell = grid[r][c];
  const color = cell.color;
  // Mark as empty
  grid[r][c] = { kind: 'empty' };

  return { tapped: true, color };
}

/**
 * Matches a bottom lane ball to brick columns:
 * - Ball must be within |ball.x - col.x| <= 25
 * - col top brick must match ball color
 * - (filled + inFlight) < 3
 * - Minimum 60ms gap between drops per column
 */
export function tryMatchBeltBall(
  ballX: number,
  ballColor: MarbleColor,
  columns: BrickColumn[],
  nowMs: number
): { matchedColIndex: number; targetHoleIndex: number } | null {
  for (let i = 0; i < columns.length; i++) {
    const col = columns[i];
    const colX = BRICK_COLUMNS_X[i];

    if (Math.abs(ballX - colX) <= MATCH_X_TOLERANCE) {
      if (col.bricks.length === 0) continue;
      const topBrick = col.bricks[0];

      if (topBrick.color === ballColor) {
        const capacityUsed = topBrick.filled + topBrick.inFlight;
        if (capacityUsed < BRICK_HOLES) {
          if (nowMs - col.lastDropTime >= MIN_DROP_INTERVAL_MS) {
            col.lastDropTime = nowMs;
            const targetHoleIndex = capacityUsed;
            topBrick.inFlight++;
            return { matchedColIndex: i, targetHoleIndex };
          }
        }
      }
    }
  }

  return null;
}

/**
 * Validates level solvability:
 * For every color: (number of blocks of that color * 9) == (number of bricks of that color * 3)
 */
export function validateLevelSolvability(level: LevelData): {
  isSolvable: boolean;
  blockCounts: Record<string, number>;
  brickCounts: Record<string, number>;
  mismatches: string[];
} {
  const blockCounts: Record<string, number> = {};
  const brickCounts: Record<string, number> = {};

  // Count blocks in grid
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const cell = level.grid[r][c];
      if (cell.kind === 'block' && cell.color) {
        blockCounts[cell.color] = (blockCounts[cell.color] || 0) + 1;
      } else if (cell.kind === 'locked' && cell.color) {
        blockCounts[cell.color] = (blockCounts[cell.color] || 0) + 1;
      } else if (cell.kind === 'dispenser' && cell.queue) {
        for (const col of cell.queue) {
          blockCounts[col] = (blockCounts[col] || 0) + 1;
        }
      }
    }
  }

  // Count bricks in columns
  for (const col of level.columns) {
    for (const bColor of col) {
      brickCounts[bColor] = (brickCounts[bColor] || 0) + 1;
    }
  }

  const mismatches: string[] = [];
  const allColors = new Set([...Object.keys(blockCounts), ...Object.keys(brickCounts)]);

  for (const c of allColors) {
    const blocks = blockCounts[c] || 0;
    const bricks = brickCounts[c] || 0;
    const expectedBalls = blocks * BALLS_PER_BLOCK;
    const requiredBalls = bricks * BRICK_HOLES;
    if (expectedBalls !== requiredBalls) {
      mismatches.push(
        `${c}: ${blocks} blocks (${expectedBalls} balls) vs ${bricks} bricks (${requiredBalls} holes)`
      );
    }
  }

  return {
    isSolvable: mismatches.length === 0,
    blockCounts,
    brickCounts,
    mismatches,
  };
}

/**
 * Check win condition:
 * All brick columns are completely empty (all bricks matched and popped).
 */
export function isLevelWon(columns: BrickColumn[]): boolean {
  return columns.every((col) => col.bricks.length === 0);
}

/**
 * Check lose condition:
 * Belt is full, funnel has waiting balls, and no belt ball matches any active top brick.
 */
export function isLevelStalled(
  beltBallCount: number,
  funnelBallCount: number,
  beltBalls: { color: MarbleColor }[],
  columns: BrickColumn[]
): boolean {
  if (beltBallCount < BELT_CAPACITY - 2) return false;
  if (funnelBallCount === 0) return false;

  const topColors = new Set(
    columns
      .filter((col) => col.bricks.length > 0 && col.bricks[0].filled + col.bricks[0].inFlight < BRICK_HOLES)
      .map((col) => col.bricks[0].color)
  );

  // If no belt ball can match any top brick
  const hasMatchableBall = beltBalls.some((b) => topColors.has(b.color));
  return !hasMatchableBall;
}
