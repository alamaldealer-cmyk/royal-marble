/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BELT_GEOM } from './constants';

export const STRAIGHT_LEN = BELT_GEOM.straightLength; // 186
export const ARC_LEN = Math.PI * BELT_GEOM.centerRadius; // ~37.699
export const TOTAL_PATH_LEN = 2 * STRAIGHT_LEN + 2 * ARC_LEN; // ~447.398

// Segment milestones
export const SEG0_END = STRAIGHT_LEN; // 186
export const SEG1_END = SEG0_END + ARC_LEN; // ~223.7
export const SEG2_END = SEG1_END + STRAIGHT_LEN; // ~409.7
export const SEG3_END = TOTAL_PATH_LEN; // ~447.4

// Top lane feed point at x=147 (since x goes 243 -> 57 on top lane)
export const FEED_POINT_S = 243 - 147; // 96.0

/**
 * Returns (x, y) coordinates for distance s along the belt loop [0, TOTAL_PATH_LEN)
 */
export function getBeltCoordinates(rawS: number): { x: number; y: number; isBottomLane: boolean } {
  let s = rawS % TOTAL_PATH_LEN;
  if (s < 0) s += TOTAL_PATH_LEN;

  // Segment 0: Top lane (x: 243 -> 57, y: 508)
  if (s < SEG0_END) {
    const x = 243 - s;
    return { x, y: BELT_GEOM.topY, isBottomLane: false };
  }

  // Segment 1: Left U-turn around (57, 520) from y=508 down to y=532
  if (s < SEG1_END) {
    const u = (s - SEG0_END) / ARC_LEN; // 0..1
    const angle = -Math.PI / 2 - u * Math.PI;
    const x = BELT_GEOM.leftCenterX + BELT_GEOM.centerRadius * Math.cos(angle);
    const y = 520 + BELT_GEOM.centerRadius * Math.sin(angle);
    return { x, y, isBottomLane: false };
  }

  // Segment 2: Bottom lane (x: 57 -> 243, y: 532)
  if (s < SEG2_END) {
    const d = s - SEG1_END;
    const x = 57 + d;
    return { x, y: BELT_GEOM.bottomY, isBottomLane: true };
  }

  // Segment 3: Right U-turn around (243, 520) from y=532 up to y=508
  const u = (s - SEG2_END) / ARC_LEN; // 0..1
  const angle = Math.PI / 2 - u * Math.PI;
  const x = BELT_GEOM.rightCenterX + BELT_GEOM.centerRadius * Math.cos(angle);
  const y = 520 + BELT_GEOM.centerRadius * Math.sin(angle);
  return { x, y, isBottomLane: false };
}

/**
 * Checks whether s is on the bottom lane
 */
export function isSOnBottomLane(rawS: number): boolean {
  let s = rawS % TOTAL_PATH_LEN;
  if (s < 0) s += TOTAL_PATH_LEN;
  return s >= SEG1_END && s <= SEG2_END;
}

/**
 * Shortest circular distance between two belt s positions
 */
export function circularDistance(s1: number, s2: number): number {
  const diff = Math.abs((s1 % TOTAL_PATH_LEN) - (s2 % TOTAL_PATH_LEN));
  return Math.min(diff, TOTAL_PATH_LEN - diff);
}
