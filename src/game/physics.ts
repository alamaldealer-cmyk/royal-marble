/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  BALL_RADIUS_FUNNEL,
  GRAVITY,
  NECK_WIDTH,
} from './constants';
import { FunnelBall, MarbleColor } from './types';

export interface FunnelBoundarySegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  nx: number;
  ny: number;
  length: number;
}

export class FunnelPhysics {
  public balls: FunnelBall[] = [];
  private nextId = 1;
  private walls: FunnelBoundarySegment[] = [];

  constructor() {
    this.initWalls();
  }

  private initWalls() {
    // Exact coordinates from layout blueprint:
    // Left vertical container wall: (14, 182) -> (14, 432)
    // Left funnel slope: (14, 432) -> (128, 487)
    // Left neck vertical wall: (128, 487) -> (128, 497)
    // Right neck vertical wall: (166, 497) -> (166, 487)
    // Right funnel slope: (166, 487) -> (282, 432)
    // Right vertical container wall: (282, 432) -> (282, 182)

    const rawSegments = [
      { x1: 24, y1: 180, x2: 24, y2: 440 },
      { x1: 24, y1: 440, x2: 127, y2: 488 },
      { x1: 127, y1: 488, x2: 127, y2: 506 },
      { x1: 168, y1: 506, x2: 168, y2: 488 },
      { x1: 168, y1: 488, x2: 271, y2: 440 },
      { x1: 271, y1: 440, x2: 271, y2: 180 },
    ];

    this.walls = rawSegments.map((s) => {
      const dx = s.x2 - s.x1;
      const dy = s.y2 - s.y1;
      const length = Math.hypot(dx, dy);
      // Inward normal (facing into the funnel)
      const nx = -dy / length;
      const ny = dx / length;
      return { ...s, nx, ny, length };
    });
  }

  spawnBurst(centerX: number, centerY: number, color: MarbleColor, count: number) {
    for (let i = 0; i < count; i++) {
      // Delay / slight staggered position within 8px radius
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 8;
      const px = centerX + Math.cos(angle) * dist;
      const py = centerY + Math.sin(angle) * dist;

      // Random speed 60-140 px/s with downward bias
      const speed = 60 + Math.random() * 80;
      const spreadAngle = Math.PI * 0.15 + Math.random() * Math.PI * 0.7; // downward cone
      const vx = Math.cos(spreadAngle) * speed * (Math.random() > 0.5 ? 1 : -1);
      const vy = Math.sin(spreadAngle) * speed + 30; // downward push

      this.balls.push({
        id: this.nextId++,
        color,
        x: px,
        y: py,
        vx,
        vy,
        radius: BALL_RADIUS_FUNNEL,
      });
    }
  }

  update(dt: number, gateOpen: boolean): FunnelBall | null {
    // Sub-stepping for ultra-stable soft circle collisions
    const subSteps = 4;
    const subDt = Math.min(dt, 0.05) / subSteps;
    const restitution = 0.3;
    const friction = 0.02;

    let ballToFeed: FunnelBall | null = null;

    for (let step = 0; step < subSteps; step++) {
      // 1. Integrate forces & velocity
      for (const b of this.balls) {
        b.vy += GRAVITY * subDt;
        // Small air drag
        b.vx *= 1 - 0.01 * subDt;
        b.vy *= 1 - 0.01 * subDt;

        b.x += b.vx * subDt;
        b.y += b.vy * subDt;
      }

      // 2. Ball-Wall Collisions
      for (const b of this.balls) {
        for (const wall of this.walls) {
          // Project point onto line segment
          const dx = b.x - wall.x1;
          const dy = b.y - wall.y1;
          const segDx = wall.x2 - wall.x1;
          const segDy = wall.y2 - wall.y1;

          let t = (dx * segDx + dy * segDy) / (wall.length * wall.length);
          t = Math.max(0, Math.min(1, t));

          const closestX = wall.x1 + t * segDx;
          const closestY = wall.y1 + t * segDy;

          const distX = b.x - closestX;
          const distY = b.y - closestY;
          const distance = Math.hypot(distX, distY);

          if (distance < b.radius) {
            // Push outside wall
            const overlap = b.radius - distance;
            let normalX = distX / (distance || 1);
            let normalY = distY / (distance || 1);

            // If normal is zero or ambiguous, use precomputed inward normal
            if (distance < 0.001) {
              normalX = wall.nx;
              normalY = wall.ny;
            }

            b.x += normalX * overlap;
            b.y += normalY * overlap;

            // Reflect velocity with restitution and friction
            const dot = b.vx * normalX + b.vy * normalY;
            if (dot < 0) {
              b.vx = (b.vx - (1 + restitution) * dot * normalX) * (1 - friction);
              b.vy = (b.vy - (1 + restitution) * dot * normalY) * (1 - friction);
            }
          }
        }

        // Invisible gate at neck bottom (y=495, x in 128..166)
        if (!gateOpen) {
          if (b.y + b.radius >= 495 && b.x >= 128 && b.x <= 166) {
            b.y = 495 - b.radius;
            if (b.vy > 0) b.vy = -b.vy * 0.2;
          }
        }
      }

      // 3. Ball-Ball soft collisions (Relaxation)
      const count = this.balls.length;
      for (let i = 0; i < count; i++) {
        const b1 = this.balls[i];
        for (let j = i + 1; j < count; j++) {
          const b2 = this.balls[j];
          const dx = b2.x - b1.x;
          const dy = b2.y - b1.y;
          const distSq = dx * dx + dy * dy;
          const minDist = b1.radius + b2.radius;

          if (distSq < minDist * minDist && distSq > 0.0001) {
            const dist = Math.sqrt(distSq);
            const overlap = 0.5 * (minDist - dist);
            const nx = dx / dist;
            const ny = dy / dist;

            // Positional shift
            b1.x -= nx * overlap;
            b1.y -= ny * overlap;
            b2.x += nx * overlap;
            b2.y += ny * overlap;

            // Velocity impulse
            const dvx = b2.vx - b1.vx;
            const dvy = b2.vy - b1.vy;
            const normalVel = dvx * nx + dvy * ny;

            if (normalVel < 0) {
              const impulse = -(1 + restitution) * normalVel * 0.5;
              b1.vx -= nx * impulse;
              b1.vy -= ny * impulse;
              b2.vx += nx * impulse;
              b2.vy += ny * impulse;
            }
          }
        }
      }
    }

    // 4. Check if gate is open and a ball is in the neck exit zone (y >= 492)
    if (gateOpen && !ballToFeed) {
      // Find the lowest ball in the neck
      let lowestIndex = -1;
      let lowestY = 0;

      for (let i = 0; i < this.balls.length; i++) {
        const b = this.balls[i];
        if (b.x >= 126 && b.x <= 168 && b.y >= 485) {
          if (b.y > lowestY) {
            lowestY = b.y;
            lowestIndex = i;
          }
        }
      }

      if (lowestIndex !== -1 && lowestY >= 488) {
        ballToFeed = this.balls.splice(lowestIndex, 1)[0];
      }
    }

    return ballToFeed;
  }
}
