/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MarbleColor } from './types';

// ==========================================
// TUNABLES SPECIFIED IN BLUEPRINT (PAGE 14-15)
// ==========================================
export const BASE_WIDTH = 296;
export const BASE_HEIGHT = 640;

export const BALLS_PER_BLOCK = 9;
export const BELT_SPEED = 120; // px/s
export const BELT_CAPACITY = 30; // exactly 30 ball slots
export const BALL_SPACING = 447.398 / BELT_CAPACITY; // ~14.913px center-to-center
export const GRAVITY = 1000; // px/s^2 down
export const NECK_WIDTH = 38; // px
export const BRICK_HOLES = 3;
export const MAX_WAITING_BALLS = 45; // Max balls in funnel before locking taps
export const RESUME_WAITING_BALLS = 40; // Funnel count must drop below 40 to resume taps

export const BALL_RADIUS_FUNNEL = 7;
export const BALL_RADIUS_BELT = 6;
export const MIN_DROP_INTERVAL_MS = 60; // Har column ke liye min 60ms gap

// ==========================================
// VISUAL COLORS (PAGE 4 & 15)
// ==========================================
export const COLOR_CONFIG: Record<
  MarbleColor,
  {
    name: string;
    hex: string;
    dark: string;
    border: string;
    highlight: string;
    dot: string;
  }
> = {
  purple: {
    name: 'Purple',
    hex: '#7B3FE4',
    dark: '#5821A8',
    border: '#44148B',
    highlight: '#B894FA',
    dot: '#612ABC',
  },
  pink: {
    name: 'Pink',
    hex: '#FF8FD6',
    dark: '#D757A7',
    border: '#AD2D7E',
    highlight: '#FFD3F0',
    dot: '#DB67B0',
  },
  ice: {
    name: 'Ice White',
    hex: '#E6F4FA',
    dark: '#A6C8DC',
    border: '#7FA9C2',
    highlight: '#FFFFFF',
    dot: '#BFDCEB',
  },
  yellow: {
    name: 'Yellow',
    hex: '#FFD21F',
    dark: '#C89D00',
    border: '#9C7800',
    highlight: '#FFE87D',
    dot: '#D6A600',
  },
  lime: {
    name: 'Lime',
    hex: '#A8F028',
    dark: '#73B80C',
    border: '#538A04',
    highlight: '#D9FBA4',
    dot: '#81C914',
  },
  cyan: {
    name: 'Cyan',
    hex: '#27C4F4',
    dark: '#0C94C0',
    border: '#086E8F',
    highlight: '#8CE4FD',
    dot: '#17A3D1',
  },
  orange: {
    name: 'Orange',
    hex: '#FF8A1F',
    dark: '#CF5F00',
    border: '#9E4400',
    highlight: '#FFC285',
    dot: '#DE6804',
  },
  red: {
    name: 'Red',
    hex: '#F23B5C',
    dark: '#B71C38',
    border: '#870F24',
    highlight: '#FA8EA2',
    dot: '#C92443',
  },
};

// UI and layout colors
export const THEME = {
  background: '#10011E',
  glassFill: 'rgba(255, 255, 255, 0.08)',
  glassBorder: '#E5C158',
  glassInnerRim: 'rgba(255, 240, 180, 0.45)',
  gridBoardBg: 'rgba(32, 8, 62, 0.55)',
  gridBoardOutline: '#E5C158',
  funnelFill: 'rgba(215, 225, 245, 0.18)',
  funnelBorder: '#E5C158',
  neckBorder: '#E5C158',
  beltHousingFill: '#240A42',
  beltHousingBorder: '#E5C158',
  beltRim: '#FFE494',
  beltTrack: '#4B3666',
  beltSlot: '#34224A',
  beltDivider: '#FFE8A3',
  lockedTile: '#4E3668',
  lockedTileBorder: '#35214D',
  dispenserBlue: '#5C38A6',
  dispenserBorder: '#E5C158',
  coinPill: '#3D156E',
  levelPill: '#3D156E',
  goldBorder: '#F5D061',
  powerUpGreen: '#2EB55A',
  powerUpBorder: '#D4AF37',
  badgeRed: '#E93D5A',
};

// ==========================================
// GRID CONFIGURATION (PAGE 5)
// ==========================================
export const GRID_COLS = 6;
export const GRID_ROWS = 6;
export const CELL_SIZE = 30;
export const CELL_RADIUS = 7;
export const CELL_PITCH_X = 35;
export const CELL_PITCH_Y = 33;
export const GRID_X_CENTERS = [60, 95, 130, 165, 200, 235];
export const GRID_Y_CENTERS = [250, 283, 318, 350, 383, 415];
export const EXIT_ROW = 5; // y=415

// Glass container bounds
export const GLASS_CONTAINER = {
  x: 8,
  y: 182,
  width: 272,
  height: 250, // bottom at 432
  topRadius: 32,
};

// Funnel geometry
export const FUNNEL = {
  leftWall: { x1: 12, y1: 438, x2: 128, y2: 487 },
  rightWall: { x1: 284, y1: 438, x2: 166, y2: 487 },
  neckX1: 128,
  neckX2: 166,
  neckY1: 487,
  neckY2: 497,
  feedX: 147,
  feedY: 508,
};

// Belt Stadium Path Geometry (PAGE 8)
export const BELT_GEOM = {
  topY: 508,
  bottomY: 532,
  leftCenterX: 57,
  rightCenterX: 243,
  centerRadius: 12, // centerY = 520
  straightLength: 186, // 243 - 57
  get arcLength() {
    return Math.PI * this.centerRadius; // ~37.7
  },
  get totalLength() {
    return 2 * this.straightLength + 2 * this.arcLength; // ~447.4
  },
};

// Brick Columns (PAGE 9)
export const BRICK_COLUMNS_X = [65, 120, 175, 230];
export const BRICK_WIDTH = 50;
export const BRICK_TOP_HEIGHT = 20;
export const BRICK_STACK_PITCH = 23;
export const BRICK_TOP_Y = 548;
export const BRICK_HOLE_OFFSETS = [-14, 0, 14];
export const BRICK_HOLE_DIAMETER = 12;
export const MATCH_X_TOLERANCE = 25; // |ball.x - col.x| <= 25
