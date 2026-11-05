const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const outDirPublic = path.join(__dirname, '../public/assets');
const outDirSrc = path.join(__dirname, '../src/assets/images');

if (!fs.existsSync(outDirPublic)) fs.mkdirSync(outDirPublic, { recursive: true });
if (!fs.existsSync(outDirSrc)) fs.mkdirSync(outDirSrc, { recursive: true });

// Common Chassis SVG Template
function getChassisSvg(type, glowColor = '#00F0FF', isActive = false) {
  const outerBorderColor = isActive ? '#00F0FF' : '#4E357F';
  const innerRingColor = isActive ? '#00F0FF' : (type === 'magnet' ? '#00F0FF' : '#FFD21F');
  const glowFilter = isActive
    ? `<filter id="activeGlow" x="-20%" y="-20%" width="140%" height="140%">
         <feGaussianBlur stdDeviation="4" result="blur"/>
         <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
       </filter>`
    : '';

  return `
    <defs>
      <!-- Metallic Outer Bevel Gradient -->
      <linearGradient id="outerBevelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#4E347A"/>
        <stop offset="35%" stop-color="#2B1A4E"/>
        <stop offset="70%" stop-color="#190D34"/>
        <stop offset="100%" stop-color="#0E0520"/>
      </linearGradient>

      <!-- Golden Chrome Edge -->
      <linearGradient id="goldEdgeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#FFE779"/>
        <stop offset="50%" stop-color="#D49B1F"/>
        <stop offset="100%" stop-color="#7A4C07"/>
      </linearGradient>

      <!-- Inner Chamber Gradient -->
      <radialGradient id="innerChamberGrad" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stop-color="#26134D"/>
        <stop offset="60%" stop-color="#14092B"/>
        <stop offset="100%" stop-color="#0A0418"/>
      </radialGradient>

      <!-- Specular Glass Cap Gradient -->
      <linearGradient id="glassCapGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="rgba(255, 255, 255, 0.45)"/>
        <stop offset="25%" stop-color="rgba(255, 255, 255, 0.15)"/>
        <stop offset="55%" stop-color="rgba(255, 255, 255, 0.0)"/>
      </linearGradient>

      <!-- Drop Shadow Filter -->
      <filter id="btnShadow" x="-15%" y="-15%" width="130%" height="130%">
        <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#000000" flood-opacity="0.8"/>
      </filter>

      ${glowFilter}
    </defs>

    <!-- Outer Drop Shadow Backing -->
    <rect x="12" y="12" width="116" height="116" rx="30" fill="none" filter="url(#btnShadow)"/>

    <!-- 1. Outer Metallic Bezel Base -->
    <rect x="12" y="10" width="116" height="116" rx="30" fill="url(#outerBevelGrad)" stroke="url(#goldEdgeGrad)" stroke-width="2.5"/>

    <!-- 2. Dark Chamfered Inset Chamber -->
    <rect x="19" y="17" width="102" height="102" rx="24" fill="url(#innerChamberGrad)" stroke="${innerRingColor}" stroke-width="1.8" ${isActive ? 'filter="url(#activeGlow)"' : ''}/>

    <!-- 3. Tech Accent Corner Marks -->
    <path d="M 28 20 L 22 26 M 112 20 L 118 26 M 28 116 L 22 110 M 112 116 L 118 110" stroke="${innerRingColor}" stroke-width="1.5" stroke-linecap="round" opacity="0.7"/>

    <!-- 4. Subtle Concentric Tech Track Inset -->
    <circle cx="70" cy="68" r="42" fill="none" stroke="rgba(255, 255, 255, 0.08)" stroke-width="1" stroke-dasharray="4 6"/>
  `;
}

// Magnet Icon SVG
function getMagnetIconSvg(frame = 0, isActive = false) {
  const pulseScale = 1.0 + (isActive ? 0.04 * Math.sin(frame * Math.PI / 4) : 0);
  const arcGlow = isActive ? '#00F0FF' : '#70E5FF';
  const waveOpacity = 0.5 + 0.4 * Math.sin(frame * Math.PI / 4);

  return `
    <g transform="translate(70, 68) scale(${pulseScale}) translate(-70, -68)">
      <defs>
        <!-- Magnet Red Pole Gradient -->
        <linearGradient id="redPole" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#FF5277"/>
          <stop offset="50%" stop-color="#FF1744"/>
          <stop offset="100%" stop-color="#B20025"/>
        </linearGradient>

        <!-- Magnet Blue Pole Gradient -->
        <linearGradient id="bluePole" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#00E5FF"/>
          <stop offset="50%" stop-color="#00B0FF"/>
          <stop offset="100%" stop-color="#0069C0"/>
        </linearGradient>

        <!-- Chrome Arc Gradient -->
        <linearGradient id="chromeArc" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#A5B4C8"/>
          <stop offset="40%" stop-color="#E2E8F0"/>
          <stop offset="70%" stop-color="#64748B"/>
          <stop offset="100%" stop-color="#334155"/>
        </linearGradient>

        <!-- Gold Terminals -->
        <linearGradient id="goldTip" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#FFF275"/>
          <stop offset="50%" stop-color="#FFB300"/>
          <stop offset="100%" stop-color="#E65100"/>
        </linearGradient>

        <filter id="fluxGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      <!-- Magnetic Flux Forcefield Energy Arcs -->
      <path d="M 46 45 C 54 36, 86 36, 94 45" fill="none" stroke="${arcGlow}" stroke-width="2.5" stroke-linecap="round" opacity="${waveOpacity}" filter="url(#fluxGlow)"/>
      <path d="M 50 38 C 58 30, 82 30, 90 38" fill="none" stroke="${arcGlow}" stroke-width="1.8" stroke-linecap="round" opacity="${waveOpacity * 0.7}" filter="url(#fluxGlow)"/>

      <!-- Main Horseshoe Magnet Body: Outer Bevel Shadow -->
      <path d="M 43 54 L 43 74 C 43 90, 55 98, 70 98 C 85 98, 97 90, 97 74 L 97 54 L 84 54 L 84 73 C 84 81, 77 86, 70 86 C 63 86, 56 81, 56 73 L 56 54 Z"
            fill="url(#chromeArc)" stroke="#1A102F" stroke-width="2.5"/>

      <!-- Red Left Arm Pole -->
      <path d="M 43 52 L 43 68 L 56 68 L 56 52 Z" fill="url(#redPole)" stroke="#1A102F" stroke-width="1.5"/>
      <rect x="43" y="46" width="13" height="6" rx="1.5" fill="url(#goldTip)" stroke="#1A102F" stroke-width="1.2"/>
      <line x1="45" y1="58" x2="45" y2="66" stroke="rgba(255,255,255,0.7)" stroke-width="1.5" stroke-linecap="round"/>

      <!-- Blue Right Arm Pole -->
      <path d="M 84 52 L 84 68 L 97 68 L 97 52 Z" fill="url(#bluePole)" stroke="#1A102F" stroke-width="1.5"/>
      <rect x="84" y="46" width="13" height="6" rx="1.5" fill="url(#goldTip)" stroke="#1A102F" stroke-width="1.2"/>
      <line x1="95" y1="58" x2="95" y2="66" stroke="rgba(255,255,255,0.7)" stroke-width="1.5" stroke-linecap="round"/>

      <!-- Chrome Body Specular Highlight -->
      <path d="M 59 75 C 61 82, 65 84, 70 84 C 75 84, 79 82, 81 75" fill="none" stroke="rgba(255, 255, 255, 0.65)" stroke-width="1.8" stroke-linecap="round"/>

      <!-- Center Floating Lightning Spark -->
      <polygon points="70,40 67,49 71,49 69,57 74,47 70,47" fill="#FFE853" filter="url(#fluxGlow)"/>
    </g>
  `;
}

// Shuffle Icon SVG
function getShuffleIconSvg(angleDeg = 0) {
  return `
    <g transform="translate(70, 68) rotate(${angleDeg}) translate(-70, -68)">
      <defs>
        <!-- Cyan Arrow Gradient -->
        <linearGradient id="cyanArrowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#00F0FF"/>
          <stop offset="50%" stop-color="#00A2FF"/>
          <stop offset="100%" stop-color="#7000FF"/>
        </linearGradient>

        <!-- Gold Arrow Gradient -->
        <linearGradient id="goldArrowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FFE566"/>
          <stop offset="50%" stop-color="#FFA000"/>
          <stop offset="100%" stop-color="#FF3D00"/>
        </linearGradient>

        <filter id="arrowGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      <!-- Center Glowing Orbital Energy Ring -->
      <circle cx="70" cy="68" r="28" fill="none" stroke="rgba(0, 240, 255, 0.25)" stroke-width="3" stroke-dasharray="6 8"/>

      <!-- Arrow 1 (Top-Right): Cyan/Violet Cyber Stream -->
      <path d="M 44 68 C 44 51, 56 42, 74 42 C 84 42, 90 46, 94 51"
            fill="none" stroke="url(#cyanArrowGrad)" stroke-width="7" stroke-linecap="round" filter="url(#arrowGlow)"/>
      <!-- Arrowhead 1 -->
      <polygon points="102,51 92,40 91,48 83,48 94,56" fill="#00F0FF" stroke="#0A0418" stroke-width="1.5"/>

      <!-- Arrow 2 (Bottom-Left): Gold/Orange Cyber Stream -->
      <path d="M 96 68 C 96 85, 84 94, 66 94 C 56 94, 50 90, 46 85"
            fill="none" stroke="url(#goldArrowGrad)" stroke-width="7" stroke-linecap="round" filter="url(#arrowGlow)"/>
      <!-- Arrowhead 2 -->
      <polygon points="38,85 48,96 49,88 57,88 46,80" fill="#FFE566" stroke="#0A0418" stroke-width="1.5"/>

      <!-- Sleek inner highlight lines on arrows -->
      <path d="M 48 64 C 49 53, 58 46, 74 46" fill="none" stroke="rgba(255, 255, 255, 0.85)" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M 92 72 C 91 83, 82 90, 66 90" fill="none" stroke="rgba(255, 255, 255, 0.85)" stroke-width="1.8" stroke-linecap="round"/>

      <!-- Central Quantum Singularity / Star Core -->
      <circle cx="70" cy="68" r="4.5" fill="#FFFFFF" filter="url(#arrowGlow)"/>
      <circle cx="70" cy="68" r="2" fill="#00F0FF"/>
    </g>
  `;
}

// Glass Reflection Overlay on Top Half
const glassCapSvg = `
  <path d="M 20 20 L 120 20 C 120 20, 115 54, 70 54 C 25 54, 20 20, 20 20 Z" fill="url(#glassCapGrad)"/>
`;

async function main() {
  console.log('Generating unified sci-fi gaming buttons...');

  // 1. Magnet Button Idle (140x140)
  const magnetIdleSvg = `
    <svg width="140" height="140" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
      ${getChassisSvg('magnet', '#00F0FF', false)}
      ${getMagnetIconSvg(0, false)}
      ${glassCapSvg}
    </svg>
  `;
  const magnetIdleBuf = await sharp(Buffer.from(magnetIdleSvg)).png().toBuffer();
  fs.writeFileSync(path.join(outDirPublic, 'magnet_btn_idle.png'), magnetIdleBuf);
  fs.writeFileSync(path.join(outDirSrc, 'magnet_btn_idle.png'), magnetIdleBuf);
  console.log('Created magnet_btn_idle.png');

  // 2. Magnet Button Active (140x140 with vibrant cyan plasma border & active aura)
  const magnetActiveSvg = `
    <svg width="140" height="140" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
      ${getChassisSvg('magnet', '#00F0FF', true)}
      ${getMagnetIconSvg(2, true)}
      ${glassCapSvg}
    </svg>
  `;
  const magnetActiveBuf = await sharp(Buffer.from(magnetActiveSvg)).png().toBuffer();
  fs.writeFileSync(path.join(outDirPublic, 'magnet_btn_active.png'), magnetActiveBuf);
  fs.writeFileSync(path.join(outDirSrc, 'magnet_btn_active.png'), magnetActiveBuf);
  console.log('Created magnet_btn_active.png');

  // 3. Magnet Anim Strip (8 frames: 1120x140)
  const magnetFrames = [];
  for (let f = 0; f < 8; f++) {
    const fSvg = `
      <svg width="140" height="140" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
        ${getChassisSvg('magnet', '#00F0FF', f % 2 === 1)}
        ${getMagnetIconSvg(f, true)}
        ${glassCapSvg}
      </svg>
    `;
    const fBuf = await sharp(Buffer.from(fSvg)).png().toBuffer();
    magnetFrames.push({ input: fBuf, left: f * 140, top: 0 });
  }
  const magnetStripBuf = await sharp({
    create: { width: 1120, height: 140, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  }).composite(magnetFrames).png().toBuffer();
  fs.writeFileSync(path.join(outDirPublic, 'magnet_anim_strip.png'), magnetStripBuf);
  fs.writeFileSync(path.join(outDirSrc, 'magnet_anim_strip.png'), magnetStripBuf);
  console.log('Created magnet_anim_strip.png (8 frames, 1120x140)');

  // 4. Shuffle Button Idle (140x140)
  const shuffleIdleSvg = `
    <svg width="140" height="140" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
      ${getChassisSvg('shuffle', '#FFD21F', false)}
      ${getShuffleIconSvg(0)}
      ${glassCapSvg}
    </svg>
  `;
  const shuffleIdleBuf = await sharp(Buffer.from(shuffleIdleSvg)).png().toBuffer();
  fs.writeFileSync(path.join(outDirPublic, 'shuffle_btn_idle.png'), shuffleIdleBuf);
  fs.writeFileSync(path.join(outDirSrc, 'shuffle_btn_idle.png'), shuffleIdleBuf);
  console.log('Created shuffle_btn_idle.png');

  // 5. Shuffle Anim Strip (8 frames rotating 360 deg: 1120x140)
  const shuffleFrames = [];
  for (let f = 0; f < 8; f++) {
    const angle = (f / 8) * 360;
    const fSvg = `
      <svg width="140" height="140" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
        ${getChassisSvg('shuffle', '#FFD21F', f > 0)}
        ${getShuffleIconSvg(angle)}
        ${glassCapSvg}
      </svg>
    `;
    const fBuf = await sharp(Buffer.from(fSvg)).png().toBuffer();
    shuffleFrames.push({ input: fBuf, left: f * 140, top: 0 });
  }
  const shuffleStripBuf = await sharp({
    create: { width: 1120, height: 140, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  }).composite(shuffleFrames).png().toBuffer();
  fs.writeFileSync(path.join(outDirPublic, 'shuffle_anim_strip.png'), shuffleStripBuf);
  fs.writeFileSync(path.join(outDirSrc, 'shuffle_anim_strip.png'), shuffleStripBuf);
  console.log('Created shuffle_anim_strip.png (8 frames, 1120x140)');

  console.log('All unified sci-fi gaming buttons created successfully!');
}

main().catch(err => console.error(err));
