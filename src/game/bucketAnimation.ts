/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MarbleColor, Brick } from './types';

export const BUCKET_CELL_SIZE = 192;

export const BUCKET_COLOR_ROWS: Record<MarbleColor, number> = {
  pink: 0,   // bright pink / magenta (Row 0)
  ice: 1,    // ice (Row 1)
  yellow: 2, // yellow (Row 2)
  lime: 3,   // green / lime (Row 3)
  cyan: 4,   // cyan (Row 4)
  orange: 5, // orange (Row 5)
  red: 6,    // red (Row 6)
  purple: 7, // royal purple (Row 7)
};

export const ANIM_DURATIONS = {
  activate: 4 / 12, // 0.333s
  hit_1: 4 / 14,    // 0.2857s
  hit_2: 4 / 14,    // 0.2857s
  hit_3: 4 / 14,    // 0.2857s
  hold_full: 0.15,  // 0.150s hold before vanish
  vanish: 8 / 14,   // 0.5714s
};

/**
 * Returns the column frame index (0..24) in the spritesheet for a bucket
 */
export function getBucketFrameIndex(brick: Brick): number {
  const { animState, animTimer = 0, filled } = brick;

  if (animState === 'activate') {
    const idx = 1 + Math.min(3, Math.floor(animTimer * 12));
    return idx; // 1, 2, 3, 4
  }

  if (animState === 'hit_1') {
    const idx = 5 + Math.min(3, Math.floor(animTimer * 14));
    return idx; // 5, 6, 7, 8
  }

  if (animState === 'hit_2') {
    const idx = 9 + Math.min(3, Math.floor(animTimer * 14));
    return idx; // 9, 10, 11, 12
  }

  if (animState === 'hit_3') {
    const idx = 13 + Math.min(3, Math.floor(animTimer * 14));
    return idx; // 13, 14, 15, 16
  }

  if (animState === 'hold_full') {
    return 16;
  }

  if (animState === 'vanish') {
    const idx = 17 + Math.min(7, Math.floor(animTimer * 14));
    return idx; // 17..24
  }

  // Resting states (active_0, active_1, active_2, full)
  if (filled <= 0) return 4;
  if (filled === 1) return 8;
  if (filled === 2) return 12;
  return 16;
}

/**
 * Draws a bucket frame from the spritesheet
 */
export function drawBucketCell(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  color: MarbleColor,
  frameCol: number,
  cellCenterX: number,
  cellCenterY: number,
  width: number,
  height: number,
  alpha = 1.0
) {
  const rowIndex = BUCKET_COLOR_ROWS[color] ?? 0;
  const sx = frameCol * BUCKET_CELL_SIZE;
  const sy = rowIndex * BUCKET_CELL_SIZE;

  ctx.save();
  if (alpha < 1.0) {
    ctx.globalAlpha *= alpha;
  }

  ctx.drawImage(
    img,
    sx,
    sy,
    BUCKET_CELL_SIZE,
    BUCKET_CELL_SIZE,
    cellCenterX - width / 2,
    cellCenterY - height / 2,
    width,
    height
  );

  ctx.restore();
}
