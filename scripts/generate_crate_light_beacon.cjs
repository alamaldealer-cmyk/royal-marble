const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const outDirPublic = path.join(__dirname, '../public/assets');
const outDirSrc = path.join(__dirname, '../src/assets/images');

const FRAME_W = 100;
const FRAME_H = 120;
const TOTAL_FRAMES = 16;

// Generate SVG for a single frame of the upward light beacon
function getBeaconFrameSvg(frameIndex) {
  const p = frameIndex / TOTAL_FRAMES; // 0.0 to 1.0
  const twoPi = Math.PI * 2;

  // Pulse calculations for smooth 16-frame looping
  const pulse1 = 0.5 + 0.5 * Math.sin(p * twoPi);
  const pulse2 = 0.5 + 0.5 * Math.cos(p * twoPi);
  const beamWidth = 46 + 6 * Math.sin(p * twoPi);
  const floorGlowRy = 11 + 2 * Math.sin(p * twoPi);

  // Sparkles rising upward seamlessly
  const sparkles = [
    { x: 38, baseY: 95, speed: 65, size: 2.2, color: '#FFE853' },
    { x: 62, baseY: 92, speed: 75, size: 2.5, color: '#00F0FF' },
    { x: 45, baseY: 88, speed: 55, size: 1.8, color: '#FFFFFF' },
    { x: 55, baseY: 98, speed: 70, size: 2.0, color: '#70E5FF' },
    { x: 32, baseY: 94, speed: 60, size: 1.6, color: '#00F0FF' },
    { x: 68, baseY: 96, speed: 68, size: 2.0, color: '#FFE853' },
    { x: 50, baseY: 90, speed: 80, size: 2.8, color: '#FFFFFF' },
  ];

  const sparkleSvgs = sparkles.map((sp, idx) => {
    // Current Y based on frame progress
    const travel = (sp.speed * p) % 75;
    const curY = sp.baseY - travel;
    // Fade in at bottom, fade out near top
    const alpha = curY > 80 ? (95 - curY) / 15 : curY < 40 ? Math.max(0, (curY - 20) / 20) : 1.0;
    const sparklePulse = 0.7 + 0.3 * Math.sin((p + idx * 0.2) * twoPi);
    const r = sp.size * sparklePulse;

    return `
      <!-- Sparkle ${idx} -->
      <g transform="translate(${sp.x}, ${curY.toFixed(1)})" opacity="${alpha.toFixed(2)}">
        <circle cx="0" cy="0" r="${r.toFixed(1)}" fill="${sp.color}" filter="url(#coreGlow)"/>
        <line x1="-${(r*1.8).toFixed(1)}" y1="0" x2="${(r*1.8).toFixed(1)}" y2="0" stroke="${sp.color}" stroke-width="0.8"/>
        <line x1="0" y1="-${(r*1.8).toFixed(1)}" x2="0" y2="${(r*1.8).toFixed(1)}" stroke="${sp.color}" stroke-width="0.8"/>
      </g>
    `;
  }).join('\n');

  // Upward Hologram Caret (▲) floating up softly
  const caretY = 32 - 12 * p;
  const caretAlpha = (p < 0.2 ? p / 0.2 : p > 0.8 ? (1.0 - p) / 0.2 : 1.0) * 0.75;

  return `
    <svg width="${FRAME_W}" height="${FRAME_H}" viewBox="0 0 ${FRAME_W} ${FRAME_H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Intense Bottom Emitter Glow -->
        <radialGradient id="emitterDiscGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.95"/>
          <stop offset="25%" stop-color="#7DF9FF" stop-opacity="0.85"/>
          <stop offset="55%" stop-color="#00F0FF" stop-opacity="0.6"/>
          <stop offset="85%" stop-color="#0077FF" stop-opacity="0.2"/>
          <stop offset="100%" stop-color="#001144" stop-opacity="0"/>
        </radialGradient>

        <!-- Golden Core Beam Gradient -->
        <linearGradient id="verticalCoreBeam" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stop-color="#FFE853" stop-opacity="0.85"/>
          <stop offset="30%" stop-color="#00F0FF" stop-opacity="0.7"/>
          <stop offset="70%" stop-color="#00B0FF" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="#7000FF" stop-opacity="0.0"/>
        </linearGradient>

        <!-- Wide Volumetric Upward Cone -->
        <linearGradient id="volumetricCone" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stop-color="#00F0FF" stop-opacity="0.55"/>
          <stop offset="40%" stop-color="#00E5FF" stop-opacity="0.3"/>
          <stop offset="80%" stop-color="#0088FF" stop-opacity="0.1"/>
          <stop offset="100%" stop-color="#0044FF" stop-opacity="0.0"/>
        </linearGradient>

        <!-- Left/Right Flute Highlights -->
        <linearGradient id="fluteGrad" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.7"/>
          <stop offset="50%" stop-color="#70E5FF" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="#00F0FF" stop-opacity="0.0"/>
        </linearGradient>

        <filter id="coreGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>

        <filter id="wideGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="6" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      <!-- 1. Ambient Volumetric Upward Light Shaft Cone -->
      <polygon points="${(50 - beamWidth/2).toFixed(1)},96 ${(50 + beamWidth/2).toFixed(1)},96 ${(50 + beamWidth/3).toFixed(1)},16 ${(50 - beamWidth/3).toFixed(1)},16"
               fill="url(#volumetricCone)" filter="url(#wideGlow)"/>

      <!-- 2. Concentric Emitter Base Pedestal On Floor (Underneath Crate) -->
      <!-- Wide Outer Ground Corona -->
      <ellipse cx="50" cy="96" rx="${(beamWidth/2 + 6).toFixed(1)}" ry="${(floorGlowRy + 2).toFixed(1)}" fill="url(#emitterDiscGrad)" filter="url(#wideGlow)"/>
      <!-- Concentric Hologram Projector Ring -->
      <ellipse cx="50" cy="96" rx="${(beamWidth/2).toFixed(1)}" ry="${floorGlowRy.toFixed(1)}" fill="none" stroke="#00F0FF" stroke-width="1.6" stroke-dasharray="8 6"/>
      <!-- Inner Brilliant Emitter Lens Core -->
      <ellipse cx="50" cy="96" rx="14" ry="4.5" fill="#FFFFFF" filter="url(#coreGlow)"/>
      <ellipse cx="50" cy="96" rx="8" ry="2.5" fill="#FFE853"/>

      <!-- 3. Vertical Core Light Streams / Laser Energy Columns -->
      <line x1="50" y1="96" x2="50" y2="20" stroke="url(#verticalCoreBeam)" stroke-width="6" stroke-linecap="round" filter="url(#coreGlow)"/>
      <line x1="${(50 - beamWidth*0.28).toFixed(1)}" y1="95" x2="${(50 - beamWidth*0.2).toFixed(1)}" y2="28" stroke="url(#fluteGrad)" stroke-width="2" stroke-linecap="round"/>
      <line x1="${(50 + beamWidth*0.28).toFixed(1)}" y1="95" x2="${(50 + beamWidth*0.2).toFixed(1)}" y2="28" stroke="url(#fluteGrad)" stroke-width="2" stroke-linecap="round"/>

      <!-- 4. Ascending Anti-Gravity Energy Sparkles / Photons -->
      ${sparkleSvgs}

      <!-- 5. Ethereal Caret (▲) beacon softly rising up -->
      <g transform="translate(50, ${caretY.toFixed(1)})" opacity="${caretAlpha.toFixed(2)}">
        <polygon points="0,-4 5,3 -5,3" fill="#00F0FF" filter="url(#coreGlow)"/>
      </g>
    </svg>
  `;
}

async function main() {
  console.log('Generating 16-frame Crate Light Beacon Spritesheet...');

  const compositeInputs = [];
  for (let f = 0; f < TOTAL_FRAMES; f++) {
    const svgStr = getBeaconFrameSvg(f);
    const frameBuf = await sharp(Buffer.from(svgStr)).png().toBuffer();
    compositeInputs.push({
      input: frameBuf,
      left: f * FRAME_W,
      top: 0,
    });
  }

  const sheetWidth = FRAME_W * TOTAL_FRAMES; // 1600px
  const sheetHeight = FRAME_H; // 120px

  const sheetBuf = await sharp({
    create: {
      width: sheetWidth,
      height: sheetHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  }).composite(compositeInputs).png().toBuffer();

  fs.writeFileSync(path.join(outDirPublic, 'crate_light_beacon_spritesheet.png'), sheetBuf);
  fs.writeFileSync(path.join(outDirSrc, 'crate_light_beacon_spritesheet.png'), sheetBuf);
  console.log(`Created crate_light_beacon_spritesheet.png (${sheetWidth}x${sheetHeight}, ${sheetBuf.length} bytes)`);
}

main().catch(err => console.error(err));
