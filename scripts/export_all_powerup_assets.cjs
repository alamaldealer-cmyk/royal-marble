const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function exportAll() {
  const inputPath = 'public/assets/aistudio/Magnet_and_Shuffle_Power-Up_Sprite_Sheet_4cf2056b.png';
  const img = sharp(inputPath);
  const raw = await img.raw().toBuffer({ resolveWithObject: true });

  const { width, height } = raw.info;
  const data = raw.data;

  // Clean background removal function
  function cropClean(srcX0, srcY0, srcW, srcH, targetSize = 192) {
    const outBuf = Buffer.alloc(targetSize * targetSize * 4);
    const centerX = targetSize / 2;
    const centerY = targetSize / 2;

    const isBg = new Uint8Array(targetSize * targetSize);

    // Scaling / offset to center src inside targetSize
    const offX = Math.round((targetSize - srcW) / 2);
    const offY = Math.round((targetSize - srcH) / 2);

    for (let ty = 0; ty < targetSize; ty++) {
      for (let tx = 0; tx < targetSize; tx++) {
        const sx = srcX0 + (tx - offX);
        const sy = srcY0 + (ty - offY);

        if (sx < 0 || sx >= width || sy < 0 || sy >= height) {
          isBg[ty * targetSize + tx] = 1;
          continue;
        }

        const idx = (sy * width + sx) * 3;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const diff = max - min;
        const dist = Math.hypot(tx - centerX, ty - centerY);

        // Outside inner button content (dist > 62):
        if (dist > 60) {
          // Neutral grey / light white checkerboard
          if (diff <= 18 && min >= 170) {
            isBg[ty * targetSize + tx] = 1;
            continue;
          }
          if (diff <= 12 && min >= 145) {
            isBg[ty * targetSize + tx] = 1;
            continue;
          }
        }
        // At outer perimeter (dist > 84):
        if (dist > 84) {
          const isVibrantGlow = (b - r > 25) || (r - g > 28 && b - g > 18);
          if (!isVibrantGlow && (diff <= 25 || min >= 175)) {
            isBg[ty * targetSize + tx] = 1;
            continue;
          }
        }
        // Beyond dist 94, cut off edge artifacts
        if (dist > 94) {
          const isVibrantGlow = (b - r > 40) || (r - g > 40 && b - g > 30);
          if (!isVibrantGlow) {
            isBg[ty * targetSize + tx] = 1;
            continue;
          }
        }
      }
    }

    // Now copy and soft-alpha edges
    for (let ty = 0; ty < targetSize; ty++) {
      for (let tx = 0; tx < targetSize; tx++) {
        const idx = ty * targetSize + tx;
        const dstIdx = idx * 4;

        if (isBg[idx]) {
          outBuf[dstIdx] = 0;
          outBuf[dstIdx + 1] = 0;
          outBuf[dstIdx + 2] = 0;
          outBuf[dstIdx + 3] = 0;
        } else {
          const sx = srcX0 + (tx - offX);
          const sy = srcY0 + (ty - offY);
          const srcIdx = (sy * width + sx) * 3;
          const r = data[srcIdx];
          const g = data[srcIdx + 1];
          const b = data[srcIdx + 2];
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const diff = max - min;

          // Check if neighboring any background pixel
          let bgCount = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const nX = tx + dx;
              const nY = ty + dy;
              if (nX < 0 || nX >= targetSize || nY < 0 || nY >= targetSize || isBg[nY * targetSize + nX]) {
                bgCount++;
              }
            }
          }

          let alpha = 255;
          if (bgCount > 0) {
            if (diff < 35 && min > 155) {
              alpha = Math.max(0, Math.min(255, Math.round(255 * (1 - (bgCount / 8.0) * 0.75))));
            }
          }

          outBuf[dstIdx] = r;
          outBuf[dstIdx + 1] = g;
          outBuf[dstIdx + 2] = b;
          outBuf[dstIdx + 3] = alpha;
        }
      }
    }

    return sharp(outBuf, { raw: { width: targetSize, height: targetSize, channels: 4 } });
  }

  // Ensure directories exist
  const outDir = 'public/assets/buttons';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const srcAssetsDir = 'src/assets/images';
  if (!fs.existsSync(srcAssetsDir)) fs.mkdirSync(srcAssetsDir, { recursive: true });

  // Row 2 coordinates:
  // Each slot is 192 wide, row Y is approx 284..476 (192 high)
  // Magnet buttons: slots 0, 1, 2, 3
  // Centers measured earlier:
  // Button 0: x0=5, y0=284 (w=192, h=192)
  // Button 1: x0=192, y0=284
  // Button 2: x0=384, y0=284
  // Button 3: x0=576, y0=284
  // Shuffle buttons: slots 4, 5, 6, 7
  // Button 4: x0=776, y0=284 (shifted slightly to center chassis)
  // Button 5: x0=960, y0=284
  // Button 6: x0=1152, y0=284
  // Button 7: x0=1344, y0=284

  const magnetCoords = [
    { x: 5, y: 284, name: 'magnet_btn_0.png' },   // Idle
    { x: 192, y: 284, name: 'magnet_btn_1.png' }, // Subtle glow
    { x: 384, y: 284, name: 'magnet_btn_2.png' }, // Orbiting cyan arc
    { x: 576, y: 284, name: 'magnet_btn_3.png' }, // Active plasma aura
  ];

  const shuffleCoords = [
    { x: 778, y: 284, name: 'shuffle_btn_0.png' },  // Idle
    { x: 960, y: 284, name: 'shuffle_btn_1.png' },  // Swirl ring
    { x: 1152, y: 284, name: 'shuffle_btn_2.png' }, // Pulse starburst
    { x: 1344, y: 284, name: 'shuffle_btn_3.png' }, // Intense energy flare
  ];

  const magnetBuffers = [];
  for (const item of magnetCoords) {
    const s = cropClean(item.x, item.y, 192, 192, 192);
    const buf = await s.png().toBuffer();
    fs.writeFileSync(path.join(outDir, item.name), buf);
    fs.writeFileSync(path.join(srcAssetsDir, item.name), buf);
    magnetBuffers.push(buf);
    console.log(`Saved ${item.name}`);
  }

  const shuffleBuffers = [];
  for (const item of shuffleCoords) {
    const s = cropClean(item.x, item.y, 192, 192, 192);
    const buf = await s.png().toBuffer();
    fs.writeFileSync(path.join(outDir, item.name), buf);
    fs.writeFileSync(path.join(srcAssetsDir, item.name), buf);
    shuffleBuffers.push(buf);
    console.log(`Saved ${item.name}`);
  }

  // Create combined 4-frame sprite strips for CSS/canvas sprite animation!
  // Magnet strip: 4 * 192 = 768 x 192
  const magStrip = sharp({
    create: {
      width: 192 * 4,
      height: 192,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  }).composite(magnetBuffers.map((b, i) => ({ input: b, left: i * 192, top: 0 })));

  await magStrip.png().toFile(path.join(outDir, 'magnet_spritesheet.png'));
  await sharp(path.join(outDir, 'magnet_spritesheet.png')).toFile(path.join(srcAssetsDir, 'magnet_spritesheet.png'));
  console.log('Saved magnet_spritesheet.png');

  // Shuffle strip: 4 * 192 = 768 x 192
  const shufStrip = sharp({
    create: {
      width: 192 * 4,
      height: 192,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  }).composite(shuffleBuffers.map((b, i) => ({ input: b, left: i * 192, top: 0 })));

  await shufStrip.png().toFile(path.join(outDir, 'shuffle_spritesheet.png'));
  await sharp(path.join(outDir, 'shuffle_spritesheet.png')).toFile(path.join(srcAssetsDir, 'shuffle_spritesheet.png'));
  console.log('Saved shuffle_spritesheet.png');

  console.log('All powerup assets successfully generated!');
}

exportAll().catch(console.error);
