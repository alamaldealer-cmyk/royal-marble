/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  BALL_RADIUS_BELT,
  BALL_SPACING,
  BELT_CAPACITY,
  BELT_GEOM,
  COLOR_CONFIG,
  THEME,
} from './constants';
import {
  ARC_LEN,
  SEG0_END,
  SEG1_END,
  SEG2_END,
  TOTAL_PATH_LEN,
  getBeltCoordinates,
} from './beltPath';
import { BeltBall, MarbleColor } from './types';

// Path tangent angle at distance s
export function getBeltTangentAngle(rawS: number): number {
  let s = rawS % TOTAL_PATH_LEN;
  if (s < 0) s += TOTAL_PATH_LEN;

  // Segment 0: Top lane (moving left from 243 to 57)
  if (s < SEG0_END) {
    return Math.PI; // pointing left
  }

  // Segment 1: Left U-turn around (57, 520) curving down
  if (s < SEG1_END) {
    const u = (s - SEG0_END) / ARC_LEN;
    const centerAngle = -Math.PI / 2 - u * Math.PI;
    return centerAngle - Math.PI / 2; // tangent
  }

  // Segment 2: Bottom lane (moving right from 57 to 243)
  if (s < SEG2_END) {
    return 0; // pointing right
  }

  // Segment 3: Right U-turn around (243, 520) curving up
  const u = (s - SEG2_END) / ARC_LEN;
  const centerAngle = Math.PI / 2 - u * Math.PI;
  return centerAngle - Math.PI / 2; // tangent
}

export class ConveyorBeltRenderer {
  private spriteSheet: HTMLImageElement | null = null;
  private spriteLoaded = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const img = new Image();
      img.src = '/src/assets/images/belt_spritesheet_1793010580934.jpg';
      img.onload = () => {
        this.spriteLoaded = true;
      };
      this.spriteSheet = img;
    }
  }

  /**
   * Renders the complete animated conveyor belt assembly:
   * - Housing brackets & drive motor
   * - Moving link treads along stadium path
   * - Rotating sprockets at left and right U-turns
   * - Moving 30 ball sockets with balls nested directly at (0, 0)
   * - Directional chevrons & shimmer
   */
  render(
    ctx: CanvasRenderingContext2D,
    scrollDistance: number,
    currentTime: number,
    balls: BeltBall[] = []
  ) {
    ctx.save();

    // 1. Housing Base: x: 20..272, y: 490..548 (width 256, height 58, radius 22)
    this.renderHousing(ctx);

    // 2. Track Capsule: x: 28..268, y: 498..542 (width 240, height 44, radius 22)
    this.renderTrackCapsule(ctx);

    // 3. Rotating Left & Right Sprockets
    const leftRotAngle = -(scrollDistance / BELT_GEOM.centerRadius);
    const rightRotAngle = -(scrollDistance / BELT_GEOM.centerRadius);
    this.renderSprocket(ctx, BELT_GEOM.leftCenterX, 520, leftRotAngle, '#2A5D88', '#E6A817');
    this.renderSprocket(ctx, BELT_GEOM.rightCenterX, 520, rightRotAngle, '#2A5D88', '#E6A817');

    // 4. Moving Link Treads (Rubber & metal ribs spaced every 7.5px along path)
    this.renderMovingTreads(ctx, scrollDistance);

    // 5. Center Divider Rail
    this.renderDividerRail(ctx);

    // 6. Moving Ball Sockets & Locked Nested Marbles (100% exact alignment)
    this.renderMovingBallSockets(ctx, scrollDistance, balls);

    // 7. Subtle Flow Chevrons (<< on top lane, >> on bottom lane)
    this.renderFlowChevrons(ctx, scrollDistance);

    // 8. Metallic Shimmer Highlight
    this.renderTrackShimmer(ctx, currentTime);

    ctx.restore();
  }

  private renderHousing(ctx: CanvasRenderingContext2D) {
    const grad = ctx.createLinearGradient(20, 490, 20, 548);
    grad.addColorStop(0, '#B8C6E2');
    grad.addColorStop(0.3, '#CAD5ED');
    grad.addColorStop(0.7, '#A5B5D6');
    grad.addColorStop(1, '#8D9EBF');
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.roundRect(20, 490, 256, 58, 22);
    ctx.fill();

    ctx.strokeStyle = THEME.beltHousingBorder;
    ctx.lineWidth = 3.5;
    ctx.stroke();

    const bolts = [
      { x: 30, y: 498 },
      { x: 266, y: 498 },
      { x: 30, y: 540 },
      { x: 266, y: 540 },
      { x: 148, y: 494 },
    ];

    for (const bolt of bolts) {
      ctx.fillStyle = '#6E7F9B';
      ctx.beginPath();
      ctx.arc(bolt.x, bolt.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#435168';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(bolt.x - 1, bolt.y - 1, 1, 1);
    }
  }

  private renderTrackCapsule(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = THEME.beltTrack;
    ctx.beginPath();
    ctx.roundRect(28, 498, 240, 44, 22);
    ctx.fill();

    ctx.strokeStyle = THEME.beltRim;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  private renderSprocket(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    rotAngle: number,
    baseColor: string,
    accentColor: string
  ) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotAngle);

    const radius = 13;
    const teethCount = 8;

    ctx.fillStyle = baseColor;
    for (let i = 0; i < teethCount; i++) {
      const angle = (i * Math.PI * 2) / teethCount;
      ctx.save();
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.roundRect(-2.5, -radius - 2.5, 5, 5, 1);
      ctx.fill();
      ctx.restore();
    }

    const gearGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, radius);
    gearGrad.addColorStop(0, '#5382B2');
    gearGrad.addColorStop(0.7, '#2F5982');
    gearGrad.addColorStop(1, '#1A3C5E');
    ctx.fillStyle = gearGrad;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0E243A';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.65, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#CBD6E2';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#435168';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#2A3644';
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      const x = 2 * Math.cos(a);
      const y = 2 * Math.sin(a);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  private renderMovingTreads(ctx: CanvasRenderingContext2D, scrollDistance: number) {
    ctx.save();

    const treadPitch = 7.5;
    const treadCount = Math.floor(TOTAL_PATH_LEN / treadPitch);

    for (let i = 0; i < treadCount; i++) {
      const s = (i * treadPitch + scrollDistance) % TOTAL_PATH_LEN;
      const coords = getBeltCoordinates(s);
      const angle = getBeltTangentAngle(s);

      ctx.save();
      ctx.translate(coords.x, coords.y);
      ctx.rotate(angle);

      ctx.fillStyle = '#4D4D5C';
      ctx.fillRect(-1.5, -9, 3, 18);

      ctx.fillStyle = '#8E8E9E';
      ctx.fillRect(-0.5, -8, 1, 16);

      ctx.fillStyle = '#C2C2D0';
      ctx.fillRect(-1, -7.5, 2, 2);
      ctx.fillRect(-1, 5.5, 2, 2);

      ctx.restore();
    }

    ctx.restore();
  }

  private renderDividerRail(ctx: CanvasRenderingContext2D) {
    ctx.save();

    const barGrad = ctx.createLinearGradient(55, 518, 55, 523);
    barGrad.addColorStop(0, '#FFFFFF');
    barGrad.addColorStop(0.5, '#E1E4F2');
    barGrad.addColorStop(1, '#B0B6CE');
    ctx.fillStyle = barGrad;

    ctx.beginPath();
    ctx.roundRect(55, 518, 186, 5, 2.5);
    ctx.fill();

    ctx.strokeStyle = '#828AA6';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#5A627B';
    for (let x = 65; x <= 235; x += 22) {
      ctx.beginPath();
      ctx.arc(x, 520.5, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private renderMovingBallSockets(
    ctx: CanvasRenderingContext2D,
    scrollDistance: number,
    balls: BeltBall[]
  ) {
    ctx.save();

    // Exactly 30 ball capacity slots distributed evenly along the path
    const socketCount = BELT_CAPACITY; // 30
    const spacing = TOTAL_PATH_LEN / socketCount; // ~14.913px

    // Map each ball by slotIndex for O(1) lookup
    const ballBySlot = new Map<number, BeltBall>();
    for (const b of balls) {
      ballBySlot.set(b.slotIndex, b);
    }

    for (let i = 0; i < socketCount; i++) {
      const s = (i * spacing + scrollDistance) % TOTAL_PATH_LEN;
      const coords = getBeltCoordinates(s);
      const angle = getBeltTangentAngle(s);

      ctx.save();
      // Translate to the EXACT socket center
      ctx.translate(coords.x, coords.y);
      ctx.rotate(angle);

      // (A) Socket Concave Base: Crater radius 6.5px (snugly embraces 6px ball)
      ctx.fillStyle = '#22222E';
      ctx.beginPath();
      ctx.arc(0, 0, 6.5, 0, Math.PI * 2);
      ctx.fill();

      // Deep crater rim border
      ctx.strokeStyle = '#14141E';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Inner shadow depth
      const innerGrad = ctx.createRadialGradient(0, -1, 1, 0, 0, 6);
      innerGrad.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
      innerGrad.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
      ctx.fillStyle = innerGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();

      // Lower rim bevel highlight
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0.5, 6, Math.PI * 0.2, Math.PI * 0.8);
      ctx.stroke();

      // (B) IF A BALL IS IN THIS SLOT, DRAW IT AT THE EXACT SAME (0, 0) CENTER!
      const ball = ballBySlot.get(i);
      if (ball) {
        this.drawGlossyMarble(ctx, 0, 0, BALL_RADIUS_BELT, ball.color, ball.scale);
      }

      ctx.restore();
    }

    ctx.restore();
  }

  private drawGlossyMarble(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    color: MarbleColor,
    scale: number = 1.0
  ) {
    ctx.save();
    ctx.translate(x, y);
    if (scale !== 1.0) ctx.scale(scale, scale);

    const config = COLOR_CONFIG[color];

    const grad = ctx.createRadialGradient(
      -radius * 0.35,
      -radius * 0.35,
      radius * 0.1,
      0,
      0,
      radius
    );
    grad.addColorStop(0, config.highlight);
    grad.addColorStop(0.5, config.hex);
    grad.addColorStop(1, config.dark);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = config.border;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.beginPath();
    ctx.arc(-radius * 0.35, -radius * 0.35, radius * 0.28, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderFlowChevrons(ctx: CanvasRenderingContext2D, scrollDistance: number) {
    ctx.save();
    const topOffset = (scrollDistance * 0.7) % 40;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let x = 230 - topOffset; x > 65; x -= 40) {
      ctx.fillText('◀', x, 508);
    }

    const bottomOffset = (scrollDistance * 0.7) % 40;
    for (let x = 70 + bottomOffset; x < 235; x += 40) {
      ctx.fillText('▶', x, 532);
    }

    ctx.restore();
  }

  private renderTrackShimmer(ctx: CanvasRenderingContext2D, currentTime: number) {
    ctx.save();
    const phase = (currentTime * 0.0004) % 1;
    const shimmerX = 50 + phase * 200;

    const shimGrad = ctx.createLinearGradient(shimmerX - 25, 498, shimmerX + 25, 498);
    shimGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    shimGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.22)');
    shimGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = shimGrad;
    ctx.fillRect(shimmerX - 25, 498, 50, 44);
    ctx.restore();
  }
}

export const conveyorRenderer = new ConveyorBeltRenderer();
