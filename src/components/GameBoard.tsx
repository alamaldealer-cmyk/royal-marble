/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  BALL_RADIUS_BELT,
  BALL_RADIUS_FUNNEL,
  BALL_SPACING,
  BALLS_PER_BLOCK,
  BASE_HEIGHT,
  BASE_WIDTH,
  BELT_CAPACITY,
  BELT_SPEED,
  BRICK_COLUMNS_X,
  BRICK_HOLE_OFFSETS,
  BRICK_HOLES,
  BRICK_STACK_PITCH,
  BRICK_TOP_HEIGHT,
  BRICK_TOP_Y,
  BRICK_WIDTH,
  CELL_RADIUS,
  CELL_SIZE,
  COLOR_CONFIG,
  FUNNEL,
  GLASS_CONTAINER,
  GRID_COLS,
  GRID_ROWS,
  GRID_X_CENTERS,
  GRID_Y_CENTERS,
  THEME,
} from '../game/constants';
import {
  FEED_POINT_S,
  TOTAL_PATH_LEN,
  circularDistance,
  getBeltCoordinates,
  isSOnBottomLane,
} from '../game/beltPath';
import { getLevel1, getLevel35, generateSolvableLevel } from '../game/levels';
import { FunnelPhysics } from '../game/physics';
import {
  isExposed,
  isLevelWon,
  shouldBlockBlockTap,
  tapCell,
  tryMatchBeltBall,
  updateGridAfterChange,
} from '../game/rules';
import { conveyorRenderer } from '../game/conveyorRenderer';
import { sounds } from '../game/sound';
import {
  BeltBall,
  BrickColumn,
  DroppingBall,
  GridCell,
  LevelData,
  MarbleColor,
  Particle,
} from '../game/types';
import bgImageSrc from '../assets/images/royal_marble_frame.png';

interface GameBoardProps {
  levelNumber?: number;
}

export const GameBoard: React.FC<GameBoardProps> = ({ levelNumber = 35 }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // High-level game state
  const [currentLevel, setCurrentLevel] = useState<number>(levelNumber);
  const [score, setScore] = useState<number>(0);
  const [coins, setCoins] = useState<number>(2450);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [soundMuted, setSoundMuted] = useState<boolean>(false);
  const [powerupCounts, setPowerupCounts] = useState({
    magnet: 1,
    shuffle: 1,
    gumball: 1,
  });

  // Current canvas viewport scale & offset in CSS pixels
  const viewTransformRef = useRef({ scale: 1, offsetX: 0, offsetY: 0 });

  // Game references for requestAnimationFrame loop
  const levelDataRef = useRef<LevelData>(getLevel35());
  const gridRef = useRef<GridCell[][]>([]);
  const columnsRef = useRef<BrickColumn[]>([]);
  const physicsRef = useRef<FunnelPhysics>(new FunnelPhysics());
  const beltBallsRef = useRef<BeltBall[]>([]);
  const droppingBallsRef = useRef<DroppingBall[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const nextDropIdRef = useRef<number>(5000);
  const beltScrollDistanceRef = useRef<number>(0);
  const backlogLockedRef = useRef<boolean>(false);
  const warningTimerRef = useRef<number>(0);
  const bgImgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = bgImageSrc;
    bgImgRef.current = img;
  }, []);

  // Initialize level
  const initLevel = useCallback((lvl: number) => {
    let data: LevelData;
    if (lvl === 35) {
      data = getLevel35();
    } else if (lvl === 1) {
      data = getLevel1();
    } else {
      data = generateSolvableLevel(lvl);
    }

    levelDataRef.current = data;
    gridRef.current = data.grid.map((row) =>
      row.map((cell) => ({
        ...cell,
        animState: 'idle',
        animTimer: 0,
        scaleX: 1,
        scaleY: 1,
        offsetY: 0,
      }))
    );

    // Initial check for exposed states
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        if (gridRef.current[r][c].kind === 'block' && isExposed(gridRef.current, r, c)) {
          gridRef.current[r][c].animState = 'popBounced';
          gridRef.current[r][c].animTimer = 1;
        }
      }
    }

    // Build brick columns
    columnsRef.current = data.columns.map((colColors, i) => ({
      x: BRICK_COLUMNS_X[i],
      bricks: colColors.map((color) => ({
        color,
        filled: 0,
        inFlight: 0,
        animState: 'idle',
        animTimer: 0,
      })),
      lastDropTime: 0,
      shiftOffsetY: 0,
    }));

    physicsRef.current = new FunnelPhysics();
    beltBallsRef.current = [];
    droppingBallsRef.current = [];
    particlesRef.current = [];
    setGameState('playing');
  }, []);

  useEffect(() => {
    initLevel(currentLevel);
  }, [currentLevel, initLevel]);

  // Audio toggle
  const toggleSound = () => {
    sounds.enabled = !sounds.enabled;
    setSoundMuted(!sounds.enabled);
  };

  // Restart level
  const handleRestart = () => {
    sounds.playTap();
    initLevel(currentLevel);
  };

  // Next level
  const handleNextLevel = () => {
    sounds.playTap();
    const nextLvl = currentLevel === 1 ? 35 : currentLevel + 1;
    setCurrentLevel(nextLvl);
  };

  // Power-up 1: Magnet
  const useMagnet = () => {
    if (powerupCounts.magnet <= 0 || gameState !== 'playing') return;
    setPowerupCounts((p) => ({ ...p, magnet: p.magnet - 1 }));
    sounds.playPowerup();

    const topColors = new Map<MarbleColor, number>();
    columnsRef.current.forEach((col, idx) => {
      if (col.bricks.length > 0) {
        topColors.set(col.bricks[0].color, idx);
      }
    });

    const remainingBeltBalls: BeltBall[] = [];

    for (const ball of beltBallsRef.current) {
      const colIdx = topColors.get(ball.color);
      if (colIdx !== undefined) {
        const col = columnsRef.current[colIdx];
        const topBrick = col.bricks[0];
        if (topBrick && topBrick.filled + topBrick.inFlight < BRICK_HOLES) {
          const targetHole = topBrick.filled + topBrick.inFlight;
          topBrick.inFlight++;
          const coords = getBeltCoordinates(ball.s);

          droppingBallsRef.current.push({
            id: nextDropIdRef.current++,
            color: ball.color,
            startX: coords.x,
            startY: coords.y,
            targetX: col.x + BRICK_HOLE_OFFSETS[targetHole],
            targetY: BRICK_TOP_Y + 10,
            progress: 0,
            duration: 0.22,
            colIndex: colIdx,
            holeIndex: targetHole,
          });
          continue;
        }
      }
      remainingBeltBalls.push(ball);
    }

    beltBallsRef.current = remainingBeltBalls;
  };

  // Power-up 2: Shuffle
  const useShuffle = () => {
    if (powerupCounts.shuffle <= 0 || gameState !== 'playing') return;
    setPowerupCounts((p) => ({ ...p, shuffle: p.shuffle - 1 }));
    sounds.playPowerup();

    const normalBlocks: { r: number; c: number; color: MarbleColor }[] = [];
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        if (gridRef.current[r][c].kind === 'block' && gridRef.current[r][c].color) {
          normalBlocks.push({ r, c, color: gridRef.current[r][c].color! });
        }
      }
    }

    const colors = normalBlocks.map((b) => b.color);
    for (let i = colors.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [colors[i], colors[j]] = [colors[j], colors[i]];
    }

    normalBlocks.forEach((b, idx) => {
      gridRef.current[b.r][b.c].color = colors[idx];
      gridRef.current[b.r][b.c].animState = 'popBounced';
      gridRef.current[b.r][b.c].animTimer = 0;
    });
  };

  // Power-up 3: Gumball
  const useGumball = () => {
    if (powerupCounts.gumball <= 0 || gameState !== 'playing') return;
    setPowerupCounts((p) => ({ ...p, gumball: p.gumball - 1 }));
    sounds.playPowerup();

    columnsRef.current.forEach((col) => {
      if (col.bricks.length > 0) {
        col.bricks[0].animState = 'completing';
        col.bricks[0].animTimer = 0;
      }
    });
  };

  // Pointer Interaction
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameState !== 'playing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;

    const { scale, offsetX, offsetY } = viewTransformRef.current;
    const gameX = (rawX - offsetX) / scale;
    const gameY = (rawY - offsetY) / scale;

    // 1. HUD: Shop (in top-left corner)
    if (
      (rawX >= 4 && rawX <= 64 && rawY >= 36 && rawY <= 88) ||
      (gameX >= 8 && gameX <= 54 && gameY >= 36 && gameY <= 84)
    ) {
      sounds.playTap();
      setCoins((c) => c + 50);
      return;
    }

    // 2. HUD: Settings Gear (in top-right corner)
    if (
      (rawX >= rect.width - 64 && rawX <= rect.width - 4 && rawY >= 36 && rawY <= 76) ||
      (gameX >= 242 && gameX <= 288 && gameY >= 36 && gameY <= 74)
    ) {
      toggleSound();
      return;
    }

    // 3. HUD: Restart (in top-right corner)
    if (
      (rawX >= rect.width - 64 && rawX <= rect.width - 4 && rawY >= 78 && rawY <= 118) ||
      (gameX >= 242 && gameX <= 288 && gameY >= 76 && gameY <= 116)
    ) {
      handleRestart();
      return;
    }

    // 4. Power-up 1: Magnet (56..112, 148..184)
    if (gameX >= 56 && gameX <= 112 && gameY >= 148 && gameY <= 184) {
      useMagnet();
      return;
    }

    // 5. Power-up 2: Shuffle (122..174, 148..184)
    if (gameX >= 122 && gameX <= 174 && gameY >= 148 && gameY <= 184) {
      useShuffle();
      return;
    }

    // 6. Power-up 3: Gumball (184..240, 148..184)
    if (gameX >= 184 && gameX <= 240 && gameY >= 148 && gameY <= 184) {
      useGumball();
      return;
    }

    // 7. Grid Blocks (r0..r5)
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const cx = GRID_X_CENTERS[c];
        const cy = GRID_Y_CENTERS[r];
        const halfSize = CELL_SIZE / 2;

        if (
          gameX >= cx - halfSize &&
          gameX <= cx + halfSize &&
          gameY >= cy - halfSize &&
          gameY <= cy + halfSize
        ) {
          const cell = gridRef.current[r][c];
          if (cell.kind === 'block' && isExposed(gridRef.current, r, c)) {
            // Check if funnel waiting backlog is locked (>= 45 balls waiting until < 40)
            if (backlogLockedRef.current) {
              sounds.playBlocked();
              cell.animState = 'blocked';
              cell.animTimer = 0;
              return;
            }

            sounds.playTap();
            cell.animState = 'pressed';
            cell.animTimer = 0;

            setTimeout(() => {
              if (gridRef.current[r]?.[c]?.kind === 'block') {
                const tapRes = tapCell(gridRef.current, r, c);
                if (tapRes.tapped && tapRes.color) {
                  sounds.playPopBurst();
                  physicsRef.current.spawnBurst(cx, cy, tapRes.color, BALLS_PER_BLOCK);
                  setScore((s) => s + 50);

                  const changes = updateGridAfterChange(gridRef.current);
                  if (changes.revealedCells.length > 0) {
                    sounds.playTap();
                  }
                  if (changes.dispensedCells.length > 0) {
                    sounds.playPopBurst();
                  }
                }
              }
            }, 80);
            return;
          }
        }
      }
    }
  };

  // Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
      lastTime = currentTime;

      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        animationFrameId = requestAnimationFrame(loop);
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      const displayW = Math.round(rect.width * dpr);
      const displayH = Math.round(rect.height * dpr);

      if (canvas.width !== displayW || canvas.height !== displayH) {
        canvas.width = displayW;
        canvas.height = displayH;
      }

      ctx.save();
      // Apply DPR scaling
      ctx.scale(dpr, dpr);

      // Uniform scaling to fill width on mobile portrait
      const scaleX = rect.width / BASE_WIDTH;
      const scaleY = rect.height / BASE_HEIGHT;
      const scale = Math.min(scaleX, scaleY);
      const offsetX = (rect.width - BASE_WIDTH * scale) / 2;
      const offsetY = (rect.height - BASE_HEIGHT * scale) / 2;

      viewTransformRef.current = { scale, offsetX, offsetY };

      // 1. Draw the Royal Marble Frame image covering 100% of the canvas end-to-end!
      if (bgImgRef.current && bgImgRef.current.complete && bgImgRef.current.naturalWidth > 0) {
        ctx.drawImage(bgImgRef.current, 0, 0, rect.width, rect.height);
      } else {
        ctx.fillStyle = '#10011E';
        ctx.fillRect(0, 0, rect.width, rect.height);
      }

      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);

      // ==========================================
      // 1. GAME LOGIC TICK
      // ==========================================
      // Advance belt scroll distance continuously at the beginning of the frame
      beltScrollDistanceRef.current = (beltScrollDistanceRef.current + BELT_SPEED * dt) % TOTAL_PATH_LEN;
      const slotSpacing = TOTAL_PATH_LEN / BELT_CAPACITY; // ~14.913px

      if (gameState === 'playing') {
        // Find which slot is currently under the feed point (FEED_POINT_S = 96)
        let feedSlotIndex = -1;
        let minFeedDist = Infinity;

        for (let k = 0; k < BELT_CAPACITY; k++) {
          const slotS = (k * slotSpacing + beltScrollDistanceRef.current) % TOTAL_PATH_LEN;
          const dist = circularDistance(slotS, FEED_POINT_S);
          if (dist < minFeedDist) {
            minFeedDist = dist;
            feedSlotIndex = k;
          }
        }

        // Slot is eligible to receive a ball if it is directly below neck (dist < 4.5px) and empty
        const occupiedSlotSet = new Set<number>(beltBallsRef.current.map((b) => b.slotIndex));
        const canFeed =
          feedSlotIndex !== -1 &&
          minFeedDist <= 4.5 &&
          !occupiedSlotSet.has(feedSlotIndex) &&
          beltBallsRef.current.length < BELT_CAPACITY;

        const fedBall = physicsRef.current.update(dt, canFeed);
        if (fedBall && feedSlotIndex !== -1) {
          sounds.playBallClink();
          const targetS = (feedSlotIndex * slotSpacing + beltScrollDistanceRef.current) % TOTAL_PATH_LEN;
          beltBallsRef.current.push({
            id: fedBall.id,
            color: fedBall.color,
            slotIndex: feedSlotIndex,
            s: targetS,
            scale: 1.15,
          });
        }

        // Advance each ball locked precisely to its designated moving slot (0..29)
        for (const ball of beltBallsRef.current) {
          ball.s = (ball.slotIndex * slotSpacing + beltScrollDistanceRef.current) % TOTAL_PATH_LEN;
          if (ball.scale > 1.0) {
            ball.scale = Math.max(1.0, ball.scale - dt * 2.5);
          }
        }

        const matchedBeltBallIds = new Set<number>();
        const nowMs = Date.now();

        for (const ball of beltBallsRef.current) {
          if (isSOnBottomLane(ball.s)) {
            const coords = getBeltCoordinates(ball.s);
            const match = tryMatchBeltBall(coords.x, ball.color, columnsRef.current, nowMs);

            if (match) {
              matchedBeltBallIds.add(ball.id);
              const col = columnsRef.current[match.matchedColIndex];
              const targetX = col.x + BRICK_HOLE_OFFSETS[match.targetHoleIndex];
              const targetY = BRICK_TOP_Y + 10;

              droppingBallsRef.current.push({
                id: nextDropIdRef.current++,
                color: ball.color,
                startX: coords.x,
                startY: coords.y,
                targetX,
                targetY,
                progress: 0,
                duration: 0.18,
                colIndex: match.matchedColIndex,
                holeIndex: match.targetHoleIndex,
              });
            }
          }
        }

        if (matchedBeltBallIds.size > 0) {
          beltBallsRef.current = beltBallsRef.current.filter((b) => !matchedBeltBallIds.has(b.id));
        }

        for (let i = droppingBallsRef.current.length - 1; i >= 0; i--) {
          const drop = droppingBallsRef.current[i];
          drop.progress += dt / drop.duration;

          if (drop.progress >= 1.0) {
            const col = columnsRef.current[drop.colIndex];
            const topBrick = col.bricks[0];

            if (topBrick) {
              topBrick.inFlight = Math.max(0, topBrick.inFlight - 1);
              topBrick.filled++;
              sounds.playDropHole(topBrick.filled - 1);

              if (topBrick.filled >= BRICK_HOLES && topBrick.animState !== 'completing') {
                topBrick.animState = 'completing';
                topBrick.animTimer = 0;
                sounds.playBrickClear();
                setScore((s) => s + 300);

                for (let s = 0; s < 5; s++) {
                  particlesRef.current.push({
                    x: col.x + (Math.random() - 0.5) * 40,
                    y: BRICK_TOP_Y + (Math.random() - 0.5) * 15,
                    vx: (Math.random() - 0.5) * 80,
                    vy: -40 - Math.random() * 60,
                    color: '#FFFFFF',
                    size: 4 + Math.random() * 4,
                    alpha: 1,
                    life: 0,
                    maxLife: 0.4,
                    shape: 'star',
                  });
                }
              }
            }

            droppingBallsRef.current.splice(i, 1);
          }
        }

        columnsRef.current.forEach((col) => {
          if (col.bricks.length > 0) {
            const top = col.bricks[0];
            if (top.animState === 'completing') {
              top.animTimer = (top.animTimer || 0) + dt;
              if (top.animTimer >= 0.25) {
                col.bricks.shift();
                col.shiftOffsetY = BRICK_STACK_PITCH;
              }
            }
          }

          if (col.shiftOffsetY > 0) {
            col.shiftOffsetY = Math.max(0, col.shiftOffsetY - dt * 90);
          }
        });

        if (isLevelWon(columnsRef.current)) {
          setGameState('won');
          sounds.playWin();
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        }
      }

      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.life += dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.alpha = Math.max(0, 1 - p.life / p.maxLife);
        if (p.life >= p.maxLife) {
          particlesRef.current.splice(i, 1);
        }
      }

      // Funnel backlog tracking & hysteresis state (locks at >= 45, unlocks at < 40)
      const waitingCount = physicsRef.current.balls.length;
      const wasLocked = backlogLockedRef.current;
      const nowLocked = shouldBlockBlockTap(waitingCount, wasLocked);
      if (!wasLocked && nowLocked) {
        // Limit reached: play subtle indicator sound indicating balls cannot enter right now
        sounds.playBlocked();
      }
      backlogLockedRef.current = nowLocked;

      // ==========================================
      // 2. CANVAS RENDERING
      // ==========================================
      renderCanvasHUD(ctx, coins, currentLevel, soundMuted, rect.width);
      renderCanvasPowerups(ctx, powerupCounts);
      renderGlassContainer(ctx);
      renderFunnel(ctx);
      // Conveyor belt renders the 30 sockets and nested marbles directly at (0, 0)
      conveyorRenderer.render(ctx, beltScrollDistanceRef.current, currentTime, beltBallsRef.current);
      renderBrickColumns(ctx, columnsRef.current);
      renderGridBlocks(ctx, gridRef.current, dt);
      renderFunnelBalls(ctx, physicsRef.current.balls);
      renderDroppingBalls(ctx, droppingBallsRef.current);
      renderParticles(ctx, particlesRef.current);
      renderHint(ctx);

      ctx.restore();

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState, coins, currentLevel, soundMuted, powerupCounts]);

  // ==========================================
  // CANVAS DRAWING IMPLEMENTATION
  // ==========================================

  const renderCanvasHUD = (
    ctx: CanvasRenderingContext2D,
    coinsAmount: number,
    levelNum: number,
    muted: boolean,
    screenWidth: number
  ) => {
    ctx.save();

    const { scale, offsetX } = viewTransformRef.current;
    // Corner buttons stay neatly anchored inside the top-left and top-right ornate corners of the frame
    const shopX = Math.min(10, (12 - offsetX) / scale);
    const settingsX = Math.max(244, (screenWidth - 52 - offsetX) / scale);

    // 1. Shop button in top-left ornate corner
    const shopGrad = ctx.createLinearGradient(shopX, 40, shopX, 82);
    shopGrad.addColorStop(0, '#E83D84');
    shopGrad.addColorStop(1, '#AD1457');
    ctx.fillStyle = shopGrad;
    ctx.beginPath();
    ctx.roundRect(shopX, 40, 42, 42, 10);
    ctx.fill();
    ctx.strokeStyle = THEME.goldBorder;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏪', shopX + 21, 61);

    // 2. Settings Gear in top-right corner
    const btnGrad = ctx.createLinearGradient(settingsX, 40, settingsX, 74);
    btnGrad.addColorStop(0, '#532098');
    btnGrad.addColorStop(1, '#34106B');
    ctx.fillStyle = btnGrad;
    ctx.beginPath();
    ctx.roundRect(settingsX, 40, 42, 34, 8);
    ctx.fill();
    ctx.strokeStyle = THEME.goldBorder;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = '15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(muted ? '🔇' : '⚙️', settingsX + 21, 57);

    // 3. Restart Button in top-right corner
    ctx.fillStyle = btnGrad;
    ctx.beginPath();
    ctx.roundRect(settingsX, 78, 42, 34, 8);
    ctx.fill();
    ctx.strokeStyle = THEME.goldBorder;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🔄', settingsX + 21, 95);

    // 4. Coin pill: below the "ROYAL MARBLE" banner: x: 52..142, y: 118..144 (90x26, radius 13)
    const pillGrad = ctx.createLinearGradient(52, 118, 52, 144);
    pillGrad.addColorStop(0, '#461A82');
    pillGrad.addColorStop(1, '#280A54');
    ctx.fillStyle = pillGrad;
    ctx.beginPath();
    ctx.roundRect(52, 118, 90, 26, 13);
    ctx.fill();
    ctx.strokeStyle = THEME.goldBorder;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🪙', 66, 131);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px Fredoka, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(coinsAmount.toLocaleString(), 79, 132);

    // 5. Level pill: x: 154..244, y: 118..144 (90x26, radius 13)
    ctx.fillStyle = pillGrad;
    ctx.beginPath();
    ctx.roundRect(154, 118, 90, 26, 13);
    ctx.fill();
    ctx.strokeStyle = THEME.goldBorder;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#FFE382';
    ctx.font = 'bold 12px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Level ${levelNum}`, 199, 132);

    ctx.restore();
  };

  const renderCanvasPowerups = (
    ctx: CanvasRenderingContext2D,
    counts: { magnet: number; shuffle: number; gumball: number }
  ) => {
    ctx.save();
    drawPowerupBox(ctx, 62, 150, 48, 28, '🧲', counts.magnet);
    drawPowerupBox(ctx, 124, 150, 48, 28, '🔀', counts.shuffle);
    drawPowerupBox(ctx, 186, 150, 48, 28, '🔮', counts.gumball);
    ctx.restore();
  };

  const drawPowerupBox = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    icon: string,
    count: number
  ) => {
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, '#32B558');
    grad.addColorStop(1, '#1A7D3A');
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 8);
    ctx.fill();

    ctx.strokeStyle = THEME.goldBorder;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = '18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, x + w / 2, y + h / 2);

    const badgeX = x + w - 3;
    const badgeY = y + h - 3;
    ctx.fillStyle = '#E93D5A';
    ctx.beginPath();
    ctx.arc(badgeX, badgeY, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 9px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${count}`, badgeX, badgeY + 1);
  };

  const renderGlassContainer = (ctx: CanvasRenderingContext2D) => {
    const { x, y, width, height, topRadius } = GLASS_CONTAINER;

    ctx.save();
    // Translucent luxury crystalline glass gradient
    const grad = ctx.createLinearGradient(x, y, x, y + height);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
    grad.addColorStop(0.4, 'rgba(85, 25, 145, 0.22)');
    grad.addColorStop(1, 'rgba(35, 8, 70, 0.38)');
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.moveTo(x + topRadius, y);
    ctx.lineTo(x + width - topRadius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + topRadius);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x, y + height);
    ctx.lineTo(x, y + topRadius);
    ctx.quadraticCurveTo(x, y, x + topRadius, y);
    ctx.closePath();
    ctx.fill();

    // Golden frame rim
    ctx.strokeStyle = THEME.glassBorder;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Inner bright glass highlight rim
    ctx.strokeStyle = THEME.glassInnerRim;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Stepped pyramid backdrop
    ctx.fillStyle = THEME.gridBoardBg;
    ctx.beginPath();
    ctx.roundRect(147 - 40, 235, 80, 40, 8);
    ctx.roundRect(147 - 75, 268, 150, 40, 8);
    ctx.roundRect(147 - 110, 303, 220, 125, 10);
    ctx.fill();

    ctx.restore();
  };

  const renderFunnel = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    ctx.fillStyle = THEME.funnelFill;
    ctx.beginPath();
    ctx.moveTo(14, 432);
    ctx.lineTo(FUNNEL.neckX1, FUNNEL.neckY1);
    ctx.lineTo(FUNNEL.neckX1, FUNNEL.neckY2);
    ctx.lineTo(FUNNEL.neckX2, FUNNEL.neckY2);
    ctx.lineTo(FUNNEL.neckX2, FUNNEL.neckY1);
    ctx.lineTo(282, 432);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = THEME.funnelBorder;
    ctx.lineWidth = 5;
    ctx.lineJoin = 'round';
    ctx.stroke();

    ctx.restore();
  };

  const renderConveyorBelt = (ctx: CanvasRenderingContext2D) => {
    ctx.save();

    ctx.fillStyle = THEME.beltHousingFill;
    ctx.beginPath();
    ctx.roundRect(20, 490, 256, 56, 22);
    ctx.fill();
    ctx.strokeStyle = THEME.beltHousingBorder;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = THEME.beltTrack;
    ctx.beginPath();
    ctx.roundRect(28, 498, 240, 44, 22);
    ctx.fill();
    ctx.strokeStyle = THEME.beltRim;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = THEME.beltDivider;
    ctx.beginPath();
    ctx.roundRect(55, 518, 186, 5, 3);
    ctx.fill();

    ctx.fillStyle = THEME.beltSlot;
    for (let i = 0; i < 14; i++) {
      const sx = 58 + i * 13;
      ctx.beginPath();
      ctx.roundRect(sx, 502, 10, 12, 5);
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(sx, 526, 10, 12, 5);
      ctx.fill();
    }

    ctx.restore();
  };

  const renderBrickColumns = (ctx: CanvasRenderingContext2D, columns: BrickColumn[]) => {
    ctx.save();

    columns.forEach((col) => {
      const stack = col.bricks;
      const count = stack.length;
      if (count === 0) return;

      const colX = col.x;
      // Stacks extend to screen bottom (up to 5 bricks visible)
      const visibleCount = Math.min(count, 5);

      for (let i = visibleCount - 1; i >= 0; i--) {
        const brick = stack[i];
        const isTop = i === 0;
        const config = COLOR_CONFIG[brick.color];

        const baseY = BRICK_TOP_Y + i * BRICK_STACK_PITCH - col.shiftOffsetY;

        let brickScale = 1.0;
        let liftY = 0;
        let alpha = 1.0;

        if (isTop && brick.animState === 'completing') {
          const t = Math.min((brick.animTimer || 0) / 0.25, 1.0);
          brickScale = 1.0 + 0.12 * Math.sin(t * Math.PI);
          liftY = -10 * t;
          alpha = Math.max(0, 1.0 - t * 1.5);
        }

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(colX, baseY + liftY);
        ctx.scale(brickScale, brickScale);

        ctx.fillStyle = isTop ? config.hex : config.dark;
        ctx.beginPath();
        ctx.roundRect(-BRICK_WIDTH / 2, 0, BRICK_WIDTH, BRICK_TOP_HEIGHT, 6);
        ctx.fill();

        ctx.fillStyle = config.border;
        ctx.fillRect(-BRICK_WIDTH / 2, BRICK_TOP_HEIGHT - 3, BRICK_WIDTH, 3);

        ctx.fillStyle = config.highlight;
        ctx.fillRect(-BRICK_WIDTH / 2 + 4, 1, BRICK_WIDTH - 8, 2);

        if (isTop) {
          BRICK_HOLE_OFFSETS.forEach((hx, hIdx) => {
            const isFilled = hIdx < brick.filled;
            const holeY = 10;
            const holeR = 6;

            ctx.beginPath();
            ctx.arc(hx, holeY, holeR, 0, Math.PI * 2);

            if (isFilled) {
              drawGlossyBall(ctx, hx, holeY, holeR, brick.color);
            } else {
              ctx.fillStyle = config.dark;
              ctx.fill();
              ctx.strokeStyle = config.border;
              ctx.lineWidth = 1.5;
              ctx.stroke();
            }
          });
        }

        ctx.restore();
      }
    });

    ctx.restore();
  };

  const renderGridBlocks = (ctx: CanvasRenderingContext2D, grid: GridCell[][], dt: number) => {
    ctx.save();

    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const cell = grid[r][c];
        if (cell.kind === 'wall' || cell.kind === 'empty') continue;

        const cx = GRID_X_CENTERS[c];
        const cy = GRID_Y_CENTERS[r] + (cell.offsetY || 0);

        if (cell.offsetY && cell.offsetY < 0) {
          cell.offsetY = Math.min(0, cell.offsetY + dt * 132);
        }

        const tappable = cell.kind === 'block' && isExposed(grid, r, c);

        ctx.save();
        ctx.translate(cx, cy);

        if (cell.animState === 'pressed') {
          ctx.scale(1.1, 0.85);
        } else if (cell.animState === 'blocked' && cell.animTimer !== undefined) {
          cell.animTimer += dt / 0.18;
          const shakeX = Math.sin(cell.animTimer * Math.PI * 4) * (1 - Math.min(1.0, cell.animTimer)) * 3;
          ctx.translate(shakeX, 0);
          if (cell.animTimer >= 1.0) cell.animState = 'idle';
        } else if (cell.animState === 'popBounced' && cell.animTimer !== undefined) {
          cell.animTimer += dt / 0.25;
          const bounceScale = 1.0 + 0.15 * Math.sin(Math.min(1.0, cell.animTimer) * Math.PI);
          ctx.scale(bounceScale, bounceScale);
          if (cell.animTimer >= 1.0) cell.animState = 'idle';
        }

        if (cell.kind === 'locked') {
          ctx.fillStyle = THEME.lockedTile;
          ctx.beginPath();
          ctx.roundRect(-CELL_SIZE / 2, -CELL_SIZE / 2, CELL_SIZE, CELL_SIZE, CELL_RADIUS);
          ctx.fill();

          ctx.fillStyle = THEME.lockedTileBorder;
          ctx.fillRect(-CELL_SIZE / 2, CELL_SIZE / 2 - 3, CELL_SIZE, 3);

          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 16px Fredoka, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('?', 0, 0);
        } else if (cell.kind === 'dispenser') {
          ctx.fillStyle = THEME.dispenserBlue;
          ctx.beginPath();
          ctx.roundRect(-CELL_SIZE / 2, -CELL_SIZE / 2, CELL_SIZE, CELL_SIZE, CELL_RADIUS);
          ctx.fill();

          ctx.fillStyle = THEME.dispenserBorder;
          ctx.fillRect(-CELL_SIZE / 2, CELL_SIZE / 2 - 4, CELL_SIZE, 4);

          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 15px Fredoka, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${cell.counter || 0}`, 0, -2);

          ctx.fillStyle = '#23395B';
          ctx.fillRect(-CELL_SIZE / 2 + 5, CELL_SIZE / 2 - 5, CELL_SIZE - 10, 2);
        } else if (cell.kind === 'block' && cell.color) {
          const config = COLOR_CONFIG[cell.color];

          ctx.fillStyle = cell.animState === 'pressed' ? config.dark : config.hex;
          ctx.beginPath();
          ctx.roundRect(-CELL_SIZE / 2, -CELL_SIZE / 2, CELL_SIZE, CELL_SIZE, CELL_RADIUS);
          ctx.fill();

          ctx.fillStyle = config.dark;
          ctx.fillRect(-CELL_SIZE / 2, CELL_SIZE / 2 - 3, CELL_SIZE, 3);

          ctx.fillStyle = config.highlight;
          ctx.fillRect(-CELL_SIZE / 2 + 2, -CELL_SIZE / 2 + 1, CELL_SIZE - 4, 2);

          if (tappable) {
            ctx.fillStyle = config.dot;
            const dotOffsets = [-7, 0, 7];
            for (const dx of dotOffsets) {
              for (const dy of dotOffsets) {
                ctx.beginPath();
                ctx.arc(dx, dy, 2, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          }
        }

        ctx.restore();
      }
    }

    ctx.restore();
  };

  const drawGlossyBall = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    color: MarbleColor,
    scale: number = 1.0
  ) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

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
  };

  const renderFunnelBalls = (ctx: CanvasRenderingContext2D, balls: { x: number; y: number; color: MarbleColor }[]) => {
    ctx.save();
    for (const b of balls) {
      drawGlossyBall(ctx, b.x, b.y, BALL_RADIUS_FUNNEL, b.color);
    }
    ctx.restore();
  };

  const renderBeltBalls = (ctx: CanvasRenderingContext2D, balls: BeltBall[]) => {
    ctx.save();
    for (const b of balls) {
      const coords = getBeltCoordinates(b.s);
      drawGlossyBall(ctx, coords.x, coords.y, BALL_RADIUS_BELT, b.color, b.scale);
    }
    ctx.restore();
  };

  const renderDroppingBalls = (ctx: CanvasRenderingContext2D, droppingBalls: DroppingBall[]) => {
    ctx.save();
    for (const drop of droppingBalls) {
      const t = drop.progress;
      const currentX = drop.startX + (drop.targetX - drop.startX) * t;
      const linearY = drop.startY + (drop.targetY - drop.startY) * t;
      const arcHeight = -14 * Math.sin(t * Math.PI);
      const currentY = linearY + arcHeight;

      drawGlossyBall(ctx, currentX, currentY, BALL_RADIUS_BELT, drop.color, 1.0);
    }
    ctx.restore();
  };

  const renderParticles = (ctx: CanvasRenderingContext2D, particles: Particle[]) => {
    ctx.save();
    for (const p of particles) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;

      if (p.shape === 'star') {
        ctx.beginPath();
        const r = p.size;
        ctx.moveTo(p.x, p.y - r);
        ctx.quadraticCurveTo(p.x, p.y, p.x + r, p.y);
        ctx.quadraticCurveTo(p.x, p.y, p.x, p.y + r);
        ctx.quadraticCurveTo(p.x, p.y, p.x - r, p.y);
        ctx.quadraticCurveTo(p.x, p.y, p.x, p.y - r);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  };

  const renderHint = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = '600 11px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Tap exposed blocks (with pop-it dots) to release marbles!', 148, 632);
    ctx.restore();
  };

  return (
    <div
      ref={containerRef}
      style={{
        backgroundImage: `url(${bgImageSrc})`,
        backgroundSize: '100% 100%',
        backgroundPosition: 'center',
      }}
      className="relative w-full h-full flex items-center justify-center bg-[#10011E] overflow-hidden select-none font-['Fredoka']"
    >
      {/* 
        Full-size Canvas:
        Expands to 100% of the screen width and height.
        Renders HUD, powerups, container, belt, and brick stacks at true scaled size.
      */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        data-testid="marble-sort-canvas"
        className="w-full h-full touch-none cursor-pointer block"
      />

      {/* Accessible DOM Button Layer (synchronized for screen readers & testing) */}
      <div className="absolute inset-0 pointer-events-none z-10 opacity-0" aria-label="Game Controls">
        <button
          onClick={() => {
            sounds.playTap();
            setCoins((c) => c + 50);
          }}
          className="pointer-events-auto"
          aria-label="Shop"
        >
          Shop
        </button>
        <button onClick={toggleSound} className="pointer-events-auto" aria-label="Mute Sound">
          Mute
        </button>
        <button onClick={handleRestart} className="pointer-events-auto" aria-label="Restart Level">
          Restart
        </button>
        <button onClick={useMagnet} className="pointer-events-auto" aria-label="Use Magnet Power-up">
          Magnet
        </button>
        <button onClick={useShuffle} className="pointer-events-auto" aria-label="Use Shuffle Power-up">
          Shuffle
        </button>
        <button onClick={useGumball} className="pointer-events-auto" aria-label="Use Gumball Power-up">
          Gumball
        </button>
      </div>

      {/* Win Modal Overlay */}
      {gameState === 'won' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Level Won"
          className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
        >
          <div className="bg-white rounded-3xl p-6 border-4 border-[#FFD21F] shadow-2xl flex flex-col items-center max-w-xs w-full text-center">
            <div className="text-5xl mb-2 animate-bounce">🏆</div>
            <h2 className="text-3xl font-extrabold text-[#7B3FE4] mb-1">LEVEL COMPLETE!</h2>
            <p className="text-sm text-gray-600 mb-4 font-medium">All marbles sorted into matching bricks!</p>
            <div className="flex items-center gap-2 mb-6 bg-amber-50 px-4 py-2 rounded-full border border-amber-200">
              <span className="text-2xl">🪙</span>
              <span className="text-lg font-bold text-amber-700">+100 Coins</span>
            </div>
            <div className="flex gap-3 w-full">
              <button
                onClick={handleRestart}
                className="flex-1 py-3 rounded-2xl bg-gray-200 hover:bg-gray-300 font-bold text-gray-700 active:scale-95 transition-transform"
              >
                Replay
              </button>
              <button
                onClick={handleNextLevel}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-b from-[#2FB457] to-[#1F783A] text-white font-bold shadow-lg active:scale-95 transition-transform"
              >
                Next Level
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
