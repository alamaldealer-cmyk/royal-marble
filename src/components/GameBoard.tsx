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
  BALTI_HEIGHT,
  BALTI_SOCKET_Y,
  BALTI_TOP_Y,
  BALTI_WIDTH,
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
  CYBER_FRAME,
  FUNNEL,
  GLASS_CONTAINER,
  GRID_COLS,
  GRID_ROWS,
  GRID_X_CENTERS,
  GRID_Y_CENTERS,
  RAILING_PLATFORM,
  SLOTBAR_FRAME,
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
import { drawBucketCell, getBucketFrameIndex, ANIM_DURATIONS } from '../game/bucketAnimation';
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
import cyberFrameSrc from '../assets/images/cyber_game_frame.png';
import coinRackImgSrc from '../assets/images/coin_rack.png';
import pauseNormalImgSrc from '../assets/images/pause_normal.png';
import pauseHoverImgSrc from '../assets/images/pause_hover.png';
import pausePressedImgSrc from '../assets/images/pause_pressed.png';
import bucketPurple from '../assets/images/buckets/bucket_purple.png';
import bucketPink from '../assets/images/buckets/bucket_pink.png';
import bucketIce from '../assets/images/buckets/bucket_ice.png';
import bucketYellow from '../assets/images/buckets/bucket_yellow.png';
import bucketLime from '../assets/images/buckets/bucket_lime.png';
import bucketCyan from '../assets/images/buckets/bucket_cyan.png';
import bucketOrange from '../assets/images/buckets/bucket_orange.png';
import bucketRed from '../assets/images/buckets/bucket_red.png';
import bucketsSheetClean from '../assets/images/buckets/buckets_sheet_clean.png';

// Bottom rail bucket sprites cropped from user sprite sheet
import railBucketPurple from '../assets/images/rail_buckets/bucket_purple.png';
import railBucketPink from '../assets/images/rail_buckets/bucket_pink.png';
import railBucketIce from '../assets/images/rail_buckets/bucket_ice.png';
import railBucketYellow from '../assets/images/rail_buckets/bucket_yellow.png';
import railBucketLime from '../assets/images/rail_buckets/bucket_lime.png';
import railBucketCyan from '../assets/images/rail_buckets/bucket_cyan.png';
import railBucketOrange from '../assets/images/rail_buckets/bucket_orange.png';
import railBucketRed from '../assets/images/rail_buckets/bucket_red.png';

// Cover tiles cropped from user spritesheet (image_8bd7b6f3.png)
import tilePurple from '../assets/images/tiles/tile_purple.png';
import tilePink from '../assets/images/tiles/tile_pink.png';
import tileIce from '../assets/images/tiles/tile_ice.png';
import tileYellow from '../assets/images/tiles/tile_yellow.png';
import tileLime from '../assets/images/tiles/tile_lime.png';
import tileCyan from '../assets/images/tiles/tile_cyan.png';
import tileOrange from '../assets/images/tiles/tile_orange.png';
import tileRed from '../assets/images/tiles/tile_red.png';

// Open bucket sprites with 9 marbles cropped from top row of user spritesheet
import bucketOpenPurple from '../assets/images/tiles/bucket_open_purple.png';
import bucketOpenPink from '../assets/images/tiles/bucket_open_pink.png';
import bucketOpenIce from '../assets/images/tiles/bucket_open_ice.png';
import bucketOpenYellow from '../assets/images/tiles/bucket_open_yellow.png';
import bucketOpenLime from '../assets/images/tiles/bucket_open_lime.png';
import bucketOpenCyan from '../assets/images/tiles/bucket_open_cyan.png';
import bucketOpenOrange from '../assets/images/tiles/bucket_open_orange.png';
import bucketOpenRed from '../assets/images/tiles/bucket_open_red.png';

// Sci-Fi Slotbar UI Frame (Lights ON & OFF)
import slotbarLightsOnSrc from '../assets/images/slotbar/slotbar_lights_on.png';
import slotbarLightsOffSrc from '../assets/images/slotbar/slotbar_lights_off.png';

// Sci-Fi Frame Light animation frames (8 frames from user spritesheet)
import frameLight0 from '../assets/images/frame_lights/frame_0.png';
import frameLight1 from '../assets/images/frame_lights/frame_1.png';
import frameLight2 from '../assets/images/frame_lights/frame_2.png';
import frameLight3 from '../assets/images/frame_lights/frame_3.png';
import frameLight4 from '../assets/images/frame_lights/frame_4.png';
import frameLight5 from '../assets/images/frame_lights/frame_5.png';
import frameLight6 from '../assets/images/frame_lights/frame_6.png';
import frameLight7 from '../assets/images/frame_lights/frame_7.png';

const FRAME_LIGHT_SRCS = [
  frameLight0,
  frameLight1,
  frameLight2,
  frameLight3,
  frameLight4,
  frameLight5,
  frameLight6,
  frameLight7,
];

// Animated Cave Dispenser frames (16 frames from user spritesheet)
import cave0 from '../assets/images/cave/cave_0.png';
import cave1 from '../assets/images/cave/cave_1.png';
import cave2 from '../assets/images/cave/cave_2.png';
import cave3 from '../assets/images/cave/cave_3.png';
import cave4 from '../assets/images/cave/cave_4.png';
import cave5 from '../assets/images/cave/cave_5.png';
import cave6 from '../assets/images/cave/cave_6.png';
import cave7 from '../assets/images/cave/cave_7.png';
import cave8 from '../assets/images/cave/cave_8.png';
import cave9 from '../assets/images/cave/cave_9.png';
import cave10 from '../assets/images/cave/cave_10.png';
import cave11 from '../assets/images/cave/cave_11.png';
import cave12 from '../assets/images/cave/cave_12.png';
import cave13 from '../assets/images/cave/cave_13.png';
import cave14 from '../assets/images/cave/cave_14.png';
import cave15 from '../assets/images/cave/cave_15.png';

const CAVE_FRAME_SRCS = [
  cave0,
  cave1,
  cave2,
  cave3,
  cave4,
  cave5,
  cave6,
  cave7,
  cave8,
  cave9,
  cave10,
  cave11,
  cave12,
  cave13,
  cave14,
  cave15,
];

// Glossy 3D Sphere Ball Sprites cropped from user sprite sheet
import ballPurple from '../assets/images/balls/ball_purple.png';
import ballPink from '../assets/images/balls/ball_pink.png';
import ballIce from '../assets/images/balls/ball_ice.png';
import ballYellow from '../assets/images/balls/ball_yellow.png';
import ballLime from '../assets/images/balls/ball_lime.png';
import ballCyan from '../assets/images/balls/ball_cyan.png';
import ballOrange from '../assets/images/balls/ball_orange.png';
import ballRed from '../assets/images/balls/ball_red.png';

// Shift everything slightly up to create space below for the new buckets and railing
const ARENA_SHIFT_Y = -42;

const COLOR_ROW_MAP: Record<MarbleColor, number> = {
  purple: 0,
  pink: 1,
  ice: 2,
  yellow: 3,
  lime: 4,
  cyan: 5,
  orange: 6,
  red: 7,
};

const BUCKET_COL_CENTERS = [
  83.5, 228.0, 369.0, 509.0, 647.0, 784.5, 922.0, 1058.0, 1195.5, 1331.0, 1461.0,
];

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
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [pauseButtonState, setPauseButtonState] = useState<'normal' | 'hover' | 'pressed'>('normal');
  const [soundMuted, setSoundMuted] = useState<boolean>(false);
  const [powerupCounts, setPowerupCounts] = useState({
    magnet: 1,
    shuffle: 1,
    gumball: 1,
  });
  const [, setImagesLoaded] = useState<boolean>(false);

  // Current canvas viewport scale & offset in CSS pixels
  const viewTransformRef = useRef({ scale: 1, offsetX: 0, offsetY: 0 });
  const [hudTransform, setHudTransform] = useState({ scale: 1, offsetX: 0, offsetY: 0 });

  useEffect(() => {
    const updateLayout = () => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const scaleX = rect.width / BASE_WIDTH;
      const scaleY = rect.height / BASE_HEIGHT;
      const scale = Math.min(scaleX, scaleY);
      const offsetX = (rect.width - BASE_WIDTH * scale) / 2;
      const offsetY = (rect.height - BASE_HEIGHT * scale) / 2;
      setHudTransform({ scale, offsetX, offsetY });
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, []);

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
  const cyberFrameRef = useRef<HTMLImageElement | null>(null);
  const bucketImgsRef = useRef<Partial<Record<MarbleColor, HTMLImageElement>>>({});
  const railBucketImgsRef = useRef<Partial<Record<MarbleColor, HTMLImageElement>>>({});
  const tileImgsRef = useRef<Partial<Record<MarbleColor, HTMLImageElement>>>({});
  const bucketOpenImgsRef = useRef<Partial<Record<MarbleColor, HTMLImageElement>>>({});
  const slotbarLightsOnRef = useRef<HTMLImageElement | null>(null);
  const slotbarLightsOffRef = useRef<HTMLImageElement | null>(null);
  const bucketsSheetRef = useRef<HTMLImageElement | null>(null);
  const bucketSpritesheetRef = useRef<HTMLImageElement | null>(null);
  const frameLightsImgsRef = useRef<HTMLImageElement[]>([]);
  const frameLightsAnimTimerRef = useRef<number>(0);
  const frameLightsAnimElapsedRef = useRef<number>(0);
  const caveImgsRef = useRef<HTMLImageElement[]>([]);
  const ballImgsRef = useRef<Partial<Record<MarbleColor, HTMLImageElement>>>({});

  useEffect(() => {
    let loadedCount = 0;
    const totalToLoad = 70;
    const checkLoaded = () => {
      loadedCount++;
      if (loadedCount >= totalToLoad) {
        setImagesLoaded(true);
      }
    };

    const bSpr = new Image();
    bSpr.onload = checkLoaded;
    bSpr.src = '/assets/bucket_spritesheet.png';
    if (bSpr.complete) checkLoaded();
    bucketSpritesheetRef.current = bSpr;

    const img = new Image();
    img.onload = checkLoaded;
    img.src = bgImageSrc;
    if (img.complete) checkLoaded();
    bgImgRef.current = img;

    const frame = new Image();
    frame.onload = checkLoaded;
    frame.src = cyberFrameSrc;
    if (frame.complete) checkLoaded();
    cyberFrameRef.current = frame;

    const slotOn = new Image();
    slotOn.onload = checkLoaded;
    slotOn.src = slotbarLightsOnSrc;
    if (slotOn.complete) checkLoaded();
    slotbarLightsOnRef.current = slotOn;

    const slotOff = new Image();
    slotOff.onload = checkLoaded;
    slotOff.src = slotbarLightsOffSrc;
    if (slotOff.complete) checkLoaded();
    slotbarLightsOffRef.current = slotOff;

    const sheet = new Image();
    sheet.onload = checkLoaded;
    sheet.src = bucketsSheetClean;
    if (sheet.complete) checkLoaded();
    bucketsSheetRef.current = sheet;

    const colorImgMap: Record<MarbleColor, string> = {
      purple: bucketPurple,
      pink: bucketPink,
      ice: bucketIce,
      yellow: bucketYellow,
      lime: bucketLime,
      cyan: bucketCyan,
      orange: bucketOrange,
      red: bucketRed,
    };

    const loaded: Partial<Record<MarbleColor, HTMLImageElement>> = {};
    for (const [c, src] of Object.entries(colorImgMap)) {
      const bImg = new Image();
      bImg.onload = checkLoaded;
      bImg.src = src;
      if (bImg.complete) checkLoaded();
      loaded[c as MarbleColor] = bImg;
    }
    bucketImgsRef.current = loaded;

    const railColorImgMap: Record<MarbleColor, string> = {
      purple: railBucketPurple,
      pink: railBucketPink,
      ice: railBucketIce,
      yellow: railBucketYellow,
      lime: railBucketLime,
      cyan: railBucketCyan,
      orange: railBucketOrange,
      red: railBucketRed,
    };

    const loadedRail: Partial<Record<MarbleColor, HTMLImageElement>> = {};
    for (const [c, src] of Object.entries(railColorImgMap)) {
      const bImg = new Image();
      bImg.onload = checkLoaded;
      bImg.src = src;
      if (bImg.complete) checkLoaded();
      loadedRail[c as MarbleColor] = bImg;
    }
    railBucketImgsRef.current = loadedRail;

    // Preload locked cover tiles
    const colorTileImgMap: Record<MarbleColor, string> = {
      purple: tilePurple,
      pink: tilePink,
      ice: tileIce,
      yellow: tileYellow,
      lime: tileLime,
      cyan: tileCyan,
      orange: tileOrange,
      red: tileRed,
    };
    const loadedTiles: Partial<Record<MarbleColor, HTMLImageElement>> = {};
    for (const [c, src] of Object.entries(colorTileImgMap)) {
      const tImg = new Image();
      tImg.onload = checkLoaded;
      tImg.src = src;
      if (tImg.complete) checkLoaded();
      loadedTiles[c as MarbleColor] = tImg;
    }
    tileImgsRef.current = loadedTiles;

    // Preload open bucket images with 9 marbles
    const colorOpenBucketImgMap: Record<MarbleColor, string> = {
      purple: bucketOpenPurple,
      pink: bucketOpenPink,
      ice: bucketOpenIce,
      yellow: bucketOpenYellow,
      lime: bucketOpenLime,
      cyan: bucketOpenCyan,
      orange: bucketOpenOrange,
      red: bucketOpenRed,
    };
    const loadedOpenBuckets: Partial<Record<MarbleColor, HTMLImageElement>> = {};
    for (const [c, src] of Object.entries(colorOpenBucketImgMap)) {
      const obImg = new Image();
      obImg.onload = checkLoaded;
      obImg.src = src;
      if (obImg.complete) checkLoaded();
      loadedOpenBuckets[c as MarbleColor] = obImg;
    }
    bucketOpenImgsRef.current = loadedOpenBuckets;

    // Preload animated sci-fi frame light states (8 frames)
    const loadedFrameLights: HTMLImageElement[] = [];
    FRAME_LIGHT_SRCS.forEach((src) => {
      const flImg = new Image();
      flImg.onload = checkLoaded;
      flImg.onerror = checkLoaded;
      flImg.src = src;
      if (flImg.complete) checkLoaded();
      loadedFrameLights.push(flImg);
    });
    frameLightsImgsRef.current = loadedFrameLights;

    // Preload animated cave dispenser frames (16 frames)
    const loadedCaveFrames: HTMLImageElement[] = [];
    CAVE_FRAME_SRCS.forEach((src) => {
      const cImg = new Image();
      cImg.onload = checkLoaded;
      cImg.onerror = checkLoaded;
      cImg.src = src;
      if (cImg.complete) checkLoaded();
      loadedCaveFrames.push(cImg);
    });
    caveImgsRef.current = loadedCaveFrames;

    // Preload glossy 3D sphere ball images (8 colors)
    const ballImgMap: Record<MarbleColor, string> = {
      purple: ballPurple,
      pink: ballPink,
      ice: ballIce,
      yellow: ballYellow,
      lime: ballLime,
      cyan: ballCyan,
      orange: ballOrange,
      red: ballRed,
    };
    const loadedBalls: Partial<Record<MarbleColor, HTMLImageElement>> = {};
    for (const [c, src] of Object.entries(ballImgMap)) {
      const bImg = new Image();
      bImg.onload = checkLoaded;
      bImg.onerror = checkLoaded;
      bImg.src = src;
      if (bImg.complete) checkLoaded();
      loadedBalls[c as MarbleColor] = bImg;
    }
    ballImgsRef.current = loadedBalls;
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
      bricks: colColors.map((color, bIdx) => ({
        color,
        filled: 0,
        inFlight: 0,
        animState: bIdx === 0 ? 'activate' : 'idle',
        animTimer: 0,
      })),
      lastDropTime: 0,
      shiftOffsetY: 0,
      enterTimer: 0,
      lightPulseTimer: 0,
    }));

    physicsRef.current = new FunnelPhysics();
    beltBallsRef.current = [];
    droppingBallsRef.current = [];
    particlesRef.current = [];
    frameLightsAnimTimerRef.current = 0;
    frameLightsAnimElapsedRef.current = 0;
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
            targetY: BALTI_SOCKET_Y,
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
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;

    const { scale, offsetX, offsetY } = viewTransformRef.current;
    const gameX = (rawX - offsetX) / scale;
    const gameY = (rawY - offsetY) / scale;

    // 0. HUD: Pause Button (in top-left red box area: x: ~16..56, y: ~4..48)
    if (
      (gameX >= 16 && gameX <= 56 && gameY >= 4 && gameY <= 48) ||
      (rawX >= 10 && rawX <= 64 && rawY >= 4 && rawY <= 52)
    ) {
      setPauseButtonState('pressed');
      sounds.playTap();
      setIsPaused((p) => !p);
      return;
    }

    if (isPaused || gameState !== 'playing') return;

    // Arena coordinate space (accounting for vertical arena shift)
    const arenaGameX = gameX;
    const arenaGameY = gameY - ARENA_SHIFT_Y;

    // Grid Blocks (r0..r5)
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const cx = GRID_X_CENTERS[c];
        const cy = GRID_Y_CENTERS[r];
        const halfW = 18;
        const halfH = 17;

        if (
          arenaGameX >= cx - halfW &&
          arenaGameX <= cx + halfW &&
          arenaGameY >= cy - halfH &&
          arenaGameY <= cy + halfH
        ) {
          const cell = gridRef.current[r][c];
          if (cell.kind === 'block' && isExposed(gridRef.current, r, c) && cell.animState !== 'revealing') {
            // Trigger lights blink & chase animation on upper bucket click!
            frameLightsAnimTimerRef.current = 1.6;
            frameLightsAnimElapsedRef.current = 0;

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
                    changes.revealedCells.forEach(({ r: revR, c: revC, color: revColor }) => {
                      const rx = GRID_X_CENTERS[revC];
                      const ry = GRID_Y_CENTERS[revR] + ARENA_SHIFT_Y;
                      for (let s = 0; s < 5; s++) {
                        particlesRef.current.push({
                          x: rx + (Math.random() - 0.5) * 20,
                          y: ry + (Math.random() - 0.5) * 16,
                          vx: (Math.random() - 0.5) * 80,
                          vy: -25 - Math.random() * 45,
                          color: COLOR_CONFIG[revColor]?.hex || '#FFE494',
                          size: 3 + Math.random() * 3,
                          alpha: 1,
                          life: 0,
                          maxLife: 0.35,
                          shape: 'sparkle',
                        });
                      }
                    });
                  }
                  if (changes.dispensedCells.length > 0) {
                    sounds.playPopBurst();
                  }
                }
              }
            }, 80);
            return;
          } else if (cell.kind === 'locked' || (cell.kind === 'block' && !isExposed(gridRef.current, r, c))) {
            // User clicked on a locked upper bucket: trigger brief lights animation feedback
            sounds.playBlocked();
            frameLightsAnimTimerRef.current = 0.8;
            frameLightsAnimElapsedRef.current = 0;
            return;
          } else if (cell.kind === 'dispenser') {
            const belowR = r + 1;
            if (
              belowR < GRID_ROWS &&
              gridRef.current[belowR][c].kind === 'empty' &&
              cell.counter &&
              cell.counter > 0 &&
              cell.animState !== 'cave_dispensing'
            ) {
              sounds.playPopBurst();
              frameLightsAnimTimerRef.current = 1.0;
              frameLightsAnimElapsedRef.current = 0;
              const nextColor = cell.queue?.shift() || 'purple';
              cell.counter--;
              cell.animState = 'cave_dispensing';
              cell.animTimer = 0;
              gridRef.current[belowR][c] = {
                kind: 'block',
                color: nextColor,
                animState: 'dispensing',
                animTimer: 0,
                offsetY: -15,
              };
              return;
            } else {
              sounds.playTap();
              frameLightsAnimTimerRef.current = 0.8;
              frameLightsAnimElapsedRef.current = 0;
              return;
            }
          }
        }
      }
    }
  };

  const handlePointerUp = () => {
    if (pauseButtonState === 'pressed') {
      setPauseButtonState('normal');
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;

    const { scale, offsetX, offsetY } = viewTransformRef.current;
    const gameX = (rawX - offsetX) / scale;
    const gameY = (rawY - offsetY) / scale;

    if (
      (gameX >= 16 && gameX <= 56 && gameY >= 4 && gameY <= 48) ||
      (rawX >= 10 && rawX <= 64 && rawY >= 4 && rawY <= 52)
    ) {
      if (pauseButtonState !== 'pressed') {
        setPauseButtonState('hover');
      }
    } else {
      if (pauseButtonState === 'hover') {
        setPauseButtonState('normal');
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

      ctx.translate(offsetX, offsetY + ARENA_SHIFT_Y * scale);
      ctx.scale(scale, scale);

      // ==========================================
      // 1. GAME LOGIC TICK
      // ==========================================
      // Advance belt scroll distance continuously when not paused
      if (!isPaused) {
        beltScrollDistanceRef.current = (beltScrollDistanceRef.current + BELT_SPEED * dt) % TOTAL_PATH_LEN;
      }
      const slotSpacing = TOTAL_PATH_LEN / BELT_CAPACITY; // ~14.913px

      if (!isPaused && gameState === 'playing') {
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
              col.lightPulseTimer = Math.max(col.lightPulseTimer || 0, 0.45);
              const targetX = col.x;
              const targetY = BALTI_SOCKET_Y;

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
              col.lightPulseTimer = 0.65;

              // Trigger proper bucket animation based on ball sequence
              if (topBrick.filled === 1) {
                topBrick.animState = 'hit_1';
                topBrick.animTimer = 0;
                sounds.playDropHole(0);
              } else if (topBrick.filled === 2) {
                topBrick.animState = 'hit_2';
                topBrick.animTimer = 0;
                sounds.playDropHole(1);
              } else if (topBrick.filled >= 3) {
                topBrick.animState = 'hit_3';
                topBrick.animTimer = 0;
                col.lightPulseTimer = 1.0;
                sounds.playDropHole(2);
              }
            }

            droppingBallsRef.current.splice(i, 1);
          }
        }

        columnsRef.current.forEach((col) => {
          if (col.bricks.length > 0) {
            const top = col.bricks[0];
            if (top.animState === 'hit_1') {
              top.animTimer = (top.animTimer || 0) + dt;
              if (top.animTimer >= ANIM_DURATIONS.hit_1) {
                top.animState = 'idle';
                top.animTimer = 0;
              }
            } else if (top.animState === 'hit_2') {
              top.animTimer = (top.animTimer || 0) + dt;
              if (top.animTimer >= ANIM_DURATIONS.hit_2) {
                top.animState = 'idle';
                top.animTimer = 0;
              }
            } else if (top.animState === 'hit_3') {
              top.animTimer = (top.animTimer || 0) + dt;
              if (top.animTimer >= ANIM_DURATIONS.hit_3) {
                top.animState = 'hold_full';
                top.animTimer = 0;
              }
            } else if (top.animState === 'hold_full') {
              top.animTimer = (top.animTimer || 0) + dt;
              if (top.animTimer >= ANIM_DURATIONS.hold_full) {
                top.animState = 'vanish';
                top.animTimer = 0;
                sounds.playBrickClear();
                setScore((s) => s + 300);

                // Sparkling pop celebration particles
                for (let s = 0; s < 10; s++) {
                  particlesRef.current.push({
                    x: col.x + (Math.random() - 0.5) * 36,
                    y: BALTI_SOCKET_Y + (Math.random() - 0.5) * 16,
                    vx: (Math.random() - 0.5) * 100,
                    vy: -40 - Math.random() * 60,
                    color: '#FFE494',
                    size: 3 + Math.random() * 4,
                    alpha: 1,
                    life: 0,
                    maxLife: 0.5,
                    shape: Math.random() > 0.4 ? 'star' : 'sparkle',
                  });
                }
              }
            } else if (top.animState === 'vanish' || top.animState === 'completing') {
              top.animTimer = (top.animTimer || 0) + dt;
              if (top.animTimer >= ANIM_DURATIONS.vanish) {
                col.bricks.shift();
                col.shiftOffsetY = 0;
                col.enterTimer = 0.26;
                col.lightPulseTimer = 0.75;
                sounds.playBallClink();

                if (col.bricks.length > 0) {
                  const nextTop = col.bricks[0];
                  nextTop.animState = 'activate';
                  nextTop.animTimer = 0;
                }
              }
            } else if (top.animState === 'activate') {
              top.animTimer = (top.animTimer || 0) + dt;
              if (top.animTimer >= ANIM_DURATIONS.activate) {
                top.animState = 'idle';
                top.animTimer = 0;
              }
            }
          }

          if (col.enterTimer && col.enterTimer > 0) {
            col.enterTimer = Math.max(0, col.enterTimer - dt);
          }

          if (col.lightPulseTimer && col.lightPulseTimer > 0) {
            col.lightPulseTimer = Math.max(0, col.lightPulseTimer - dt);
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

      // Update frame lights animation timer (only blinks when user clicks an upper bucket)
      if (!isPaused && frameLightsAnimTimerRef.current > 0) {
        frameLightsAnimTimerRef.current = Math.max(0, frameLightsAnimTimerRef.current - dt);
        frameLightsAnimElapsedRef.current += dt;
      }

      // ==========================================
      // 2. CANVAS RENDERING
      // ==========================================
      // Renders the cyber frame with animated lights: upper buckets chamber, funnel neck & bottom chain dock
      renderCyberFrame(ctx);
      // Conveyor belt renders the rotating sprockets, moving link treads, and 30 sockets with marbles
      conveyorRenderer.render(ctx, beltScrollDistanceRef.current, currentTime, beltBallsRef.current, false);
      renderMachineRailingAndBaltis(ctx, columnsRef.current, dt);
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
  }, [gameState, isPaused, powerupCounts]);

  // ==========================================
  // CANVAS DRAWING IMPLEMENTATION
  // ==========================================

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

  const renderCyberFrame = (ctx: CanvasRenderingContext2D) => {
    ctx.save();

    // The lights ONLY blink, cycle, and animate when the user clicks an upper bucket.
    // In idle/normal state, they stay at Frame 0 (unlit/steady, no continuous blinking).
    let frameIndex = 0;
    if (!isPaused && frameLightsAnimTimerRef.current > 0) {
      const frameDuration = 0.09; // fast dynamic neon blink & chase animation
      const elapsed = frameLightsAnimElapsedRef.current;
      frameIndex = Math.min(7, Math.floor(elapsed / frameDuration) % 8);
    } else {
      frameIndex = 0; // Off / steady frame: no blinking
    }

    const lightFrames = frameLightsImgsRef.current;
    const frameImg = lightFrames[frameIndex];

    if (frameImg && frameImg.complete && frameImg.naturalWidth > 0) {
      ctx.drawImage(
        frameImg,
        CYBER_FRAME.x,
        CYBER_FRAME.y,
        CYBER_FRAME.width,
        CYBER_FRAME.height
      );
    } else if (cyberFrameRef.current && cyberFrameRef.current.complete && cyberFrameRef.current.naturalWidth > 0) {
      ctx.drawImage(
        cyberFrameRef.current,
        CYBER_FRAME.x,
        CYBER_FRAME.y,
        CYBER_FRAME.width,
        CYBER_FRAME.height
      );
    } else {
      renderGlassContainer(ctx);
      renderFunnel(ctx);
    }
    ctx.restore();
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

  const renderMachineRailingAndBaltis = (
    ctx: CanvasRenderingContext2D,
    columns: BrickColumn[],
    _dt: number
  ) => {
    ctx.save();

    // 1. Draw the 4 Baltis (Buckets) via animated Spritesheet
    const sheetImg = bucketSpritesheetRef.current;
    const hasSheet = sheetImg && sheetImg.complete && sheetImg.naturalWidth > 0;
    const cellCenterY = 580;
    const baltiW = 50;
    const baltiH = 50;

    columns.forEach((col) => {
      const colX = col.x;
      const stack = col.bricks;
      const count = stack.length;

      // Completed column beacon
      if (count === 0) {
        ctx.fillStyle = 'rgba(46, 181, 90, 0.2)';
        ctx.beginPath();
        ctx.arc(colX, cellCenterY, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#2EB55A';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#2EB55A';
        ctx.font = 'bold 13px Fredoka, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✓', colX, cellCenterY);
        return;
      }

      // 1a. Draw queued bucket behind in rack if stack has more than 1 bucket
      if (count > 1 && hasSheet) {
        const queuedBrick = stack[1];
        drawBucketCell(
          ctx,
          sheetImg,
          queuedBrick.color,
          0, // Frame 0: queued dim bucket
          colX,
          cellCenterY - 9, // Slightly recessed in queue slot
          42,
          42,
          0.72
        );
      }

      // 1b. Draw active front bucket using spritesheet animation
      const brick = stack[0];
      if (hasSheet) {
        const frameIdx = getBucketFrameIndex(brick);
        drawBucketCell(
          ctx,
          sheetImg,
          brick.color,
          frameIdx,
          colX,
          cellCenterY,
          baltiW,
          baltiH,
          1.0
        );
      } else {
        // Fallback if spritesheet is loading
        const railBucketImg = railBucketImgsRef.current[brick.color];
        if (railBucketImg && railBucketImg.complete && railBucketImg.naturalWidth > 0) {
          ctx.drawImage(
            railBucketImg,
            colX - BALTI_WIDTH / 2,
            BALTI_TOP_Y,
            BALTI_WIDTH,
            BALTI_HEIGHT
          );
        }
      }
    });

    // 2. Remaining Queue Badge Indicator ("New balti counter")
    const badgeY = cellCenterY + 28; // Below the bucket
    const badgeW = 32;
    const badgeH = 12;

    columns.forEach((col) => {
      const colX = col.x;
      const stack = col.bricks;
      const count = stack.length;
      if (count === 0) return;

      ctx.fillStyle = '#1D0A35';
      ctx.beginPath();
      ctx.roundRect(colX - badgeW / 2, badgeY, badgeW, badgeH, 6);
      ctx.fill();

      if (count > 1) {
        ctx.strokeStyle = '#F5D061';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Mini preview dot of upcoming bucket color
        const nextColor = stack[1].color;
        const nextConfig = COLOR_CONFIG[nextColor];
        ctx.fillStyle = nextConfig.hex;
        ctx.beginPath();
        ctx.arc(colX - 8, badgeY + badgeH / 2, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = nextConfig.border;
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Counter text "x[count]"
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 9px Fredoka, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`x${count}`, colX + 4, badgeY + badgeH / 2 + 0.5);
      } else {
        // Last one in this slot!
        ctx.strokeStyle = '#FFE494';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#FFE494';
        ctx.font = 'bold 8px Fredoka, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('LAST', colX, badgeY + badgeH / 2 + 0.5);
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
        const cy = GRID_Y_CENTERS[r] + (cell.kind === 'dispenser' ? 0 : (cell.offsetY || 0));

        if (cell.kind === 'block' && cell.animState === 'dispensing') {
          cell.animTimer = (cell.animTimer || 0) + dt;
          // Frames 0-5 of cave: 6 / 16 = 0.375s
          // At frame 6 (0.375s), slot opens with glow and bucket starts sliding out
          if (cell.animTimer < 0.375) {
            // Keep tucked inside cave during squash & glow charge-up
            continue;
          }
          const slideProgress = Math.min(1.0, (cell.animTimer - 0.375) / 0.35);
          const ease = 1 - Math.pow(1 - slideProgress, 3);
          cell.offsetY = -15 * (1 - ease);
          if (slideProgress >= 1.0) {
            cell.animState = 'idle';
            cell.offsetY = 0;
            cell.animTimer = undefined;
          }
        } else if (cell.offsetY && cell.offsetY < 0) {
          cell.offsetY = Math.min(0, cell.offsetY + dt * 132);
        }

        const tappable = cell.kind === 'block' && isExposed(grid, r, c) && cell.animState !== 'revealing';

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
          const drawW = 35;
          const drawH = 33;
          const color = cell.color || 'purple';
          const tileImg = tileImgsRef.current[color];

          // Dark slot cavity behind tile
          ctx.fillStyle = '#1D0A35';
          ctx.beginPath();
          ctx.roundRect(-drawW / 2, -drawH / 2, drawW, drawH, 7);
          ctx.fill();

          if (tileImg && tileImg.complete && tileImg.naturalWidth > 0) {
            // Draw clean cropped cover tile on top of the locked bucket
            const tileW = 36;
            const tileH = 30;
            ctx.drawImage(tileImg, -tileW / 2, -tileH / 2, tileW, tileH);
          } else {
            // Elegant fallback if image still loading
            const config = COLOR_CONFIG[color];
            ctx.fillStyle = config.hex;
            ctx.beginPath();
            ctx.roundRect(-drawW / 2, -drawH / 2, drawW, drawH, 7);
            ctx.fill();
            ctx.strokeStyle = config.border;
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        } else if (cell.kind === 'dispenser') {
          if (cell.animState === 'cave_dispensing') {
            cell.animTimer = (cell.animTimer || 0) + dt;
            // Spawn little cyan energy sparkles at frame 6 when slot bursts open with light
            if (cell.animTimer >= 0.375 && (cell.animTimer - dt) < 0.375) {
              for (let s = 0; s < 6; s++) {
                particlesRef.current.push({
                  x: cx + (Math.random() - 0.5) * 18,
                  y: cy + 10 + (Math.random() - 0.5) * 6,
                  vx: (Math.random() - 0.5) * 60,
                  vy: 10 + Math.random() * 35,
                  color: '#27C4F4',
                  size: 3 + Math.random() * 2.5,
                  alpha: 1,
                  life: 0,
                  maxLife: 0.35,
                  shape: 'sparkle',
                });
              }
            }
            if (cell.animTimer >= 1.0) {
              cell.animState = 'idle';
              cell.animTimer = 0;
            }
          }

          const frameIdx = cell.animState === 'cave_dispensing'
            ? Math.min(15, Math.floor((cell.animTimer || 0) * 16))
            : 0;

          const caveImg = caveImgsRef.current[frameIdx];

          const caveW = 64;
          const caveH = 64;
          // Positioned so the visible dome spans exactly 35px width (matching a bucket)
          // Top of dome is at cy - 15px (clean gap below bucket above at cy - 16.5px)
          const caveOffsetY = 2;

          ctx.save();
          ctx.translate(0, caveOffsetY);

          if (caveImg && caveImg.complete && caveImg.naturalWidth > 0) {
            ctx.drawImage(caveImg, -caveW / 2, -caveH / 2, caveW, caveH);
          } else {
            // Elegant fallback while loading
            ctx.fillStyle = '#261646';
            ctx.beginPath();
            ctx.roundRect(-18, -16, 36, 33, 7);
            ctx.fill();
            ctx.strokeStyle = '#27C4F4';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }

          // Remaining bucket count number centered right in the middle of the glass dome window
          // Capsule glass window center is at y=235 in 512 frame -> (235/512 - 0.5) * caveH = -0.041 * 64 = -2.6px
          const countNum = cell.counter ?? 0;
          const numY = Math.round(-0.041 * caveH);

          // Glowing holographic counter inside the transparent glass dome
          ctx.save();
          if (countNum > 0) {
            // Subtle glass glow backing circle centered in the glass dome window
            ctx.fillStyle = 'rgba(12, 148, 192, 0.45)';
            ctx.beginPath();
            ctx.arc(0, numY, 10, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = 'rgba(140, 228, 253, 0.85)';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Bright crisp counter text with cyan glow, perfectly centered
            ctx.shadowColor = '#27C4F4';
            ctx.shadowBlur = 8;
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 13px Fredoka, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${countNum}`, 0, numY + 0.5);
          } else {
            // Empty cave: small dim indicator
            ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.font = 'bold 10px Fredoka, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('0', 0, numY);
          }
          ctx.restore();

          ctx.restore();
        } else if (cell.kind === 'block' && cell.color) {
          const config = COLOR_CONFIG[cell.color];
          const drawW = 35;
          const drawH = 33;

          if (cell.animState === 'emptying' && bucketsSheetRef.current && bucketsSheetRef.current.complete) {
            cell.animTimer = (cell.animTimer || 0) + dt;
            const progress = Math.min(1.0, cell.animTimer / 0.26);
            const frameIdx = Math.min(10, Math.floor(progress * 11));
            const rowIndex = COLOR_ROW_MAP[cell.color] ?? 0;
            const colCenterX = BUCKET_COL_CENTERS[frameIdx];

            // Source crop from clean sprite sheet
            const sx = Math.max(0, colCenterX - 64);
            const sy = rowIndex * 128;
            const sw = 128;
            const sh = 128;

            ctx.drawImage(
              bucketsSheetRef.current,
              sx,
              sy,
              sw,
              sh,
              -drawW / 2,
              -drawH / 2,
              drawW,
              drawH
            );

            // Pop marbles into funnel when halfway through emptying (around frame 4-5)
            if (cell.animTimer >= 0.12 && !cell.burstSpawned) {
              cell.burstSpawned = true;
              sounds.playPopBurst();
              physicsRef.current.spawnBurst(cx, cy, cell.color, BALLS_PER_BLOCK);
              setScore((s) => s + 50);
            }

            // Once animation completes, clear the cell and update grid
            if (cell.animTimer >= 0.26) {
              const tapRes = tapCell(gridRef.current, r, c);
              if (tapRes.tapped) {
                const changes = updateGridAfterChange(gridRef.current);
                if (changes.revealedCells.length > 0) {
                  sounds.playTap();
                  changes.revealedCells.forEach(({ r: revR, c: revC, color: revColor }) => {
                    const rx = GRID_X_CENTERS[revC];
                    const ry = GRID_Y_CENTERS[revR] + ARENA_SHIFT_Y;
                    for (let s = 0; s < 5; s++) {
                      particlesRef.current.push({
                        x: rx + (Math.random() - 0.5) * 20,
                        y: ry + (Math.random() - 0.5) * 16,
                        vx: (Math.random() - 0.5) * 80,
                        vy: -25 - Math.random() * 45,
                        color: COLOR_CONFIG[revColor]?.hex || '#FFE494',
                        size: 3 + Math.random() * 3,
                        alpha: 1,
                        life: 0,
                        maxLife: 0.35,
                        shape: 'sparkle',
                      });
                    }
                  });
                }
                if (changes.dispensedCells.length > 0) sounds.playPopBurst();
              }
            }
          } else if (cell.animState === 'revealing') {
            // Unlocking animation: tile lifts off and fades away, exposing open bucket underneath
            cell.animTimer = (cell.animTimer || 0) + dt;
            const p = Math.min(1.0, cell.animTimer / 0.35);

            // 1. Draw open bucket underneath
            const openImg = bucketOpenImgsRef.current[cell.color] || bucketImgsRef.current[cell.color];
            if (openImg && openImg.complete && openImg.naturalWidth > 0) {
              ctx.fillStyle = config.dark;
              ctx.beginPath();
              ctx.roundRect(-drawW / 2 + 2, -drawH / 2 + 2, drawW - 4, drawH - 4, 6);
              ctx.fill();
              ctx.drawImage(openImg, -drawW / 2, -drawH / 2, drawW, drawH);
            } else {
              ctx.fillStyle = config.hex;
              ctx.beginPath();
              ctx.roundRect(-drawW / 2, -drawH / 2, drawW, drawH, 7);
              ctx.fill();
              ctx.strokeStyle = config.border;
              ctx.lineWidth = 1.5;
              ctx.stroke();

              for (let mr = 0; mr < 3; mr++) {
                for (let mc = 0; mc < 3; mc++) {
                  const mx = -drawW / 2 + 7 + mc * 10;
                  const my = -drawH / 2 + 7 + mr * 9;
                  drawGlossyBall(ctx, mx, my, 3.5, cell.color);
                }
              }
            }

            // 2. Animate cover tile lifting and popping away!
            const tileImg = tileImgsRef.current[cell.color];
            if (tileImg && tileImg.complete && tileImg.naturalWidth > 0) {
              ctx.save();
              const liftY = -p * 24; // lifts up 24px
              const popScale = 1.0 + 0.16 * Math.sin(p * Math.PI); // pop scale
              const alpha = Math.max(0, 1.0 - p * 1.2); // fade out
              const rot = (c % 2 === 0 ? 0.1 : -0.1) * p; // subtle rotation flip

              ctx.translate(0, liftY);
              ctx.rotate(rot);
              ctx.scale(popScale, popScale);
              ctx.globalAlpha = alpha;

              const tileW = 36;
              const tileH = 30;
              ctx.drawImage(tileImg, -tileW / 2, -tileH / 2, tileW, tileH);
              ctx.restore();
            }

            // End of reveal animation: bucket becomes active
            if (cell.animTimer >= 0.35) {
              cell.animState = 'idle';
              cell.animTimer = undefined;
            }
          } else {
            // Idle / active / popBounced state: render glossy open bucket container
            const openImg = bucketOpenImgsRef.current[cell.color] || bucketImgsRef.current[cell.color];
            if (openImg && openImg.complete && openImg.naturalWidth > 0) {
              // Solid container backing cavity so no background color ever shines through
              ctx.fillStyle = config.dark;
              ctx.beginPath();
              ctx.roundRect(-drawW / 2 + 2, -drawH / 2 + 2, drawW - 4, drawH - 4, 6);
              ctx.fill();

              // Full-color vibrant open bucket image with 9 marbles
              ctx.drawImage(openImg, -drawW / 2, -drawH / 2, drawW, drawH);

              if (tappable) {
                // Subtle bright golden outline for exposed active bucket
                ctx.strokeStyle = '#FFE382';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.roundRect(-drawW / 2 + 1, -drawH / 2 + 1, drawW - 2, drawH - 2, 7);
                ctx.stroke();

                // Sparkle dot on exposed active bucket
                ctx.fillStyle = '#FFE382';
                ctx.beginPath();
                ctx.arc(drawW / 2 - 4, -drawH / 2 + 5, 2, 0, Math.PI * 2);
                ctx.fill();
              }
            } else {
              // High-fidelity fallback bucket with 9 glossy marbles
              ctx.fillStyle = config.hex;
              ctx.beginPath();
              ctx.roundRect(-drawW / 2, -drawH / 2, drawW, drawH, 7);
              ctx.fill();
              ctx.strokeStyle = config.border;
              ctx.lineWidth = 1.5;
              ctx.stroke();

              // Inner dark cavity
              ctx.fillStyle = config.dark;
              ctx.beginPath();
              ctx.roundRect(-drawW / 2 + 3, -drawH / 2 + 3, drawW - 6, drawH - 6, 5);
              ctx.fill();

              // 9 glossy marbles in 3x3 layout
              for (let mr = 0; mr < 3; mr++) {
                for (let mc = 0; mc < 3; mc++) {
                  const mx = -drawW / 2 + 7 + mc * 10;
                  const my = -drawH / 2 + 7 + mr * 9;
                  drawGlossyBall(ctx, mx, my, 3.5, cell.color);
                }
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

    const ballImg = ballImgsRef.current[color];
    if (ballImg && ballImg.complete && ballImg.naturalWidth > 0) {
      const size = radius * 2.05;
      ctx.drawImage(ballImg, -size / 2, -size / 2, size, size);
    } else {
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
    }

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

  const renderHint = (_ctx: CanvasRenderingContext2D) => {
    // Hint text hidden for clean royal frame aesthetic
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
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setPauseButtonState('normal')}
        data-testid="marble-sort-canvas"
        className="w-full h-full touch-none cursor-pointer block"
      />

      {/* Interactive HUD Layer (Accessible, stylable in AI Studio edit panel, with dedicated element IDs) */}
      <div
        id="game-hud-overlay"
        style={{
          position: 'absolute',
          left: `${hudTransform.offsetX}px`,
          top: `${hudTransform.offsetY}px`,
          width: `${BASE_WIDTH}px`,
          height: `${BASE_HEIGHT}px`,
          transform: `scale(${hudTransform.scale})`,
          transformOrigin: 'top left',
          pointerEvents: 'none',
        }}
        className="z-20 font-['Fredoka']"
      >
        {/* 1. Pause Button: Top-left red box area */}
        <button
          id="pause-button"
          aria-label="Pause Game"
          onClick={() => {
            sounds.playTap();
            setIsPaused(true);
          }}
          className="group absolute pointer-events-auto cursor-pointer select-none active:scale-90 transition-transform focus:outline-none"
          style={{
            top: '7px',
            left: '18px',
            width: '36px',
            height: '42px',
            marginLeft: '-35px',
            marginRight: '0px',
          }}
        >
          {/* Normal state */}
          <img
            src={pauseNormalImgSrc}
            alt="Pause"
            className="w-full h-full object-contain pointer-events-none drop-shadow block group-hover:hidden group-active:hidden"
          />
          {/* Hover state */}
          <img
            src={pauseHoverImgSrc}
            alt="Pause Hover"
            className="w-full h-full object-contain pointer-events-none drop-shadow hidden group-hover:block group-active:hidden"
          />
          {/* Pressed / Active state */}
          <img
            src={pausePressedImgSrc}
            alt="Pause Pressed"
            className="w-full h-full object-contain pointer-events-none drop-shadow hidden group-active:block"
          />
        </button>

        {/* 2. Coin Rack UI: Top-right yellow box area */}
        <div
          id="coin-rack-ui"
          aria-label="Coin Rack"
          className="absolute pointer-events-auto flex items-center justify-center select-none cursor-pointer active:scale-95 transition-transform"
          style={{
            top: '7px',
            right: '12px',
            width: '90px',
            height: '40px',
            marginTop: '-1px',
            marginRight: '-38px',
            marginBottom: '0px',
            marginLeft: '0px',
            paddingTop: '0px',
            paddingRight: '0px',
            paddingLeft: '0px',
          }}
        >
          <img
            src={coinRackImgSrc}
            alt="Coin Rack"
            className="w-full h-full object-contain pointer-events-none drop-shadow"
          />
          <span
            id="coin-amount"
            className="absolute font-extrabold text-[#FFFFFF] text-[11px] tracking-wide pointer-events-none"
            style={{
              left: '32px',
              right: '12px',
              top: '9px',
              bottom: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textShadow: '0 1px 3px rgba(0,0,0,0.85), 0 0 4px #350170',
              fontFamily: "'Fredoka', sans-serif",
            }}
          >
            {coins.toLocaleString()}
          </span>
        </div>

        {/* Hidden Accessible Controls for Power-ups */}
        <div className="opacity-0 pointer-events-none">
          <button onClick={useMagnet} className="pointer-events-auto" aria-label="Use Magnet Power-up">Magnet</button>
          <button onClick={useShuffle} className="pointer-events-auto" aria-label="Use Shuffle Power-up">Shuffle</button>
          <button onClick={useGumball} className="pointer-events-auto" aria-label="Use Gumball Power-up">Gumball</button>
        </div>
      </div>

      {/* Pause Modal Overlay */}
      {isPaused && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Game Paused"
          className="absolute inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
        >
          <div className="bg-[#240A42] rounded-3xl p-6 border-4 border-[#F5D061] shadow-2xl flex flex-col items-center max-w-xs w-full text-center text-white">
            <div className="w-16 h-16 mb-2 flex items-center justify-center">
              <img src={pauseNormalImgSrc} alt="Paused" className="w-12 h-14 object-contain drop-shadow" />
            </div>
            <h2 className="text-3xl font-extrabold text-[#FFE382] mb-1 tracking-wider drop-shadow-md">
              PAUSED
            </h2>
            <p className="text-sm text-purple-200 mb-5 font-semibold">
              Level {currentLevel} • {coins.toLocaleString()} Coins
            </p>

            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={() => {
                  sounds.playTap();
                  setIsPaused(false);
                }}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-b from-[#2FB457] to-[#1F783A] text-white text-lg font-bold shadow-lg active:scale-95 transition-transform border border-green-300 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>▶</span> Resume Game
              </button>

              <button
                onClick={() => {
                  sounds.playTap();
                  handleRestart();
                  setIsPaused(false);
                }}
                className="w-full py-3 rounded-2xl bg-gradient-to-b from-[#7B3FE4] to-[#5821A8] hover:from-[#8B4FF4] hover:to-[#682FB8] text-white font-bold shadow active:scale-95 transition-transform border border-purple-400 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>🔄</span> Restart Level
              </button>

              <button
                onClick={toggleSound}
                className="w-full py-3 rounded-2xl bg-[#3D156E] hover:bg-[#4E1E8A] text-purple-200 font-semibold active:scale-95 transition-transform border border-purple-700/60 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{soundMuted ? '🔇' : '🔊'}</span> Sound: {soundMuted ? 'OFF' : 'ON'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Win Modal Overlay */}
      {gameState === 'won' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Level Won"
          className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in"
        >
          <div className="bg-[#240A42] rounded-3xl p-6 border-4 border-[#FFD21F] shadow-2xl flex flex-col items-center max-w-xs w-full text-center text-white">
            <div className="text-5xl mb-2 animate-bounce">🏆</div>
            <h2 className="text-3xl font-extrabold text-[#FFE382] mb-1">LEVEL COMPLETE!</h2>
            <p className="text-sm text-purple-200 mb-4 font-medium">All marbles sorted into matching bricks!</p>
            <div className="flex items-center gap-2 mb-6 bg-[#3D156E] px-5 py-2.5 rounded-full border-2 border-[#FFD21F] shadow-inner">
              <span className="text-2xl">🪙</span>
              <span className="text-xl font-extrabold text-[#FFE382]">+100 Coins</span>
            </div>
            <div className="flex gap-3 w-full">
              <button
                onClick={handleRestart}
                className="flex-1 py-3 rounded-2xl bg-purple-900/80 hover:bg-purple-800 font-bold text-purple-200 active:scale-95 transition-transform border border-purple-600 cursor-pointer"
              >
                Replay
              </button>
              <button
                onClick={handleNextLevel}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-b from-[#2FB457] to-[#1F783A] text-white font-bold shadow-lg active:scale-95 transition-transform border border-green-300 cursor-pointer"
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
