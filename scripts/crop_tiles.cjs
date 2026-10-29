/**
 * Crop cover tiles and open buckets from public/assets/aistudio/image_8bd7b6f3.png
 * Removes dark purple background with smooth alpha anti-aliasing and color de-fringing.
 */
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const inputPath = path.join(__dirname, '../public/assets/aistudio/image_8bd7b6f3.png');
const outDirPublic = path.join(__dirname, '../public/assets/tiles');
const outDirSrc = path.join(__dirname, '../src/assets/images/tiles');

if (!fs.existsSync(outDirPublic)) fs.mkdirSync(outDirPublic, { recursive: true });
if (!fs.existsSync(outDirSrc)) fs.mkdirSync(outDirSrc, { recursive: true });

const srcData = fs.readFileSync(inputPath);
const srcPng = PNG.sync.read(srcData);

const colors = [
  { name: 'purple', cx: 131, colIdx: 0 },
  { name: 'pink',   cx: 313, colIdx: 1 },
  { name: 'ice',    cx: 495, colIdx: 2 },
  { name: 'yellow', cx: 677, colIdx: 3 },
  { name: 'lime',   cx: 860, colIdx: 4 },
  { name: 'cyan',   cx: 1043, colIdx: 5 },
  { name: 'orange', cx: 1227, colIdx: 6 },
  { name: 'red',    cx: 1409, colIdx: 7 },
];

// Helper: check if a pixel is clearly background
function isBackgroundPixel(r, g, b) {
  // Background is dark navy/purple: luminance < 26, and R < 60, G < 35, B < 125
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  return lum < 26 && r < 60 && g < 35 && b < 135;
}

// Flood fill from borders to identify outer background
function extractWithTransparentBg(src, x0, y0, width, height, isBucket = false) {
  const dst = new PNG({ width, height });

  // 1. Copy raw pixels into dst
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const sx = x0 + x;
      const sy = y0 + y;
      const sIdx = (sy * src.width + sx) * 4;
      const dIdx = (y * width + x) * 4;
      dst.data[dIdx] = src.data[sIdx];
      dst.data[dIdx + 1] = src.data[sIdx + 1];
      dst.data[dIdx + 2] = src.data[sIdx + 2];
      dst.data[dIdx + 3] = 255;
    }
  }

  // 2. BFS flood fill from all 4 borders to mark background
  const isBg = new Uint8Array(width * height);
  const queue = [];

  // Seed with border pixels that match background
  for (let x = 0; x < width; x++) {
    // top row
    const dIdxTop = (0 * width + x) * 4;
    if (isBackgroundPixel(dst.data[dIdxTop], dst.data[dIdxTop + 1], dst.data[dIdxTop + 2])) {
      isBg[x] = 1;
      queue.push(x, 0);
    }
    // bottom row
    const yB = height - 1;
    const dIdxB = (yB * width + x) * 4;
    if (isBackgroundPixel(dst.data[dIdxB], dst.data[dIdxB + 1], dst.data[dIdxB + 2])) {
      isBg[yB * width + x] = 1;
      queue.push(x, yB);
    }
  }

  for (let y = 0; y < height; y++) {
    // left column
    const dIdxL = (y * width + 0) * 4;
    if (!isBg[y * width] && isBackgroundPixel(dst.data[dIdxL], dst.data[dIdxL + 1], dst.data[dIdxL + 2])) {
      isBg[y * width] = 1;
      queue.push(0, y);
    }
    // right column
    const xR = width - 1;
    const dIdxR = (y * width + xR) * 4;
    if (!isBg[y * width + xR] && isBackgroundPixel(dst.data[dIdxR], dst.data[dIdxR + 1], dst.data[dIdxR + 2])) {
      isBg[y * width + xR] = 1;
      queue.push(xR, y);
    }
  }

  // BFS expansion
  let head = 0;
  while (head < queue.length) {
    const qx = queue[head++];
    const qy = queue[head++];

    const neighbors = [
      [qx + 1, qy],
      [qx - 1, qy],
      [qx, qy + 1],
      [qx, qy - 1],
    ];

    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nPos = ny * width + nx;
        if (!isBg[nPos]) {
          const nIdx = nPos * 4;
          const nr = dst.data[nIdx];
          const ng = dst.data[nIdx + 1];
          const nb = dst.data[nIdx + 2];
          // Check if neighbour is background
          if (isBackgroundPixel(nr, ng, nb)) {
            isBg[nPos] = 1;
            queue.push(nx, ny);
          }
        }
      }
    }
  }

  // 3. Set transparent alpha for background and compute smooth anti-aliased edge
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pos = y * width + x;
      const idx = pos * 4;

      if (isBg[pos]) {
        dst.data[idx + 3] = 0; // Pure transparent
      } else {
        // Check if this pixel touches a background pixel (border anti-aliasing)
        const touchesBg = (
          (x > 0 && isBg[pos - 1]) ||
          (x < width - 1 && isBg[pos + 1]) ||
          (y > 0 && isBg[pos - width]) ||
          (y < height - 1 && isBg[pos + width])
        );

        if (touchesBg) {
          const r = dst.data[idx];
          const g = dst.data[idx + 1];
          const b = dst.data[idx + 2];
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;

          // Smooth edge ramp: lum between 15 and 55
          const alphaFactor = Math.max(0.1, Math.min(1.0, (lum - 14) / 40));
          dst.data[idx + 3] = Math.round(alphaFactor * 255);

          // De-fringe: remove dark purple component (approx rgb 18, 1, 65)
          const bgR = 18, bgG = 1, bgB = 65;
          if (alphaFactor < 0.95 && alphaFactor > 0.05) {
            dst.data[idx] = Math.min(255, Math.max(0, Math.round((r - bgR * (1 - alphaFactor)) / alphaFactor)));
            dst.data[idx + 1] = Math.min(255, Math.max(0, Math.round((g - bgG * (1 - alphaFactor)) / alphaFactor)));
            dst.data[idx + 2] = Math.min(255, Math.max(0, Math.round((b - bgB * (1 - alphaFactor)) / alphaFactor)));
          }
        } else {
          dst.data[idx + 3] = 255;
        }
      }
    }
  }

  return dst;
}

// 1. Process Cover Tiles (Row 0: y around 377..483, height ~107, width ~148)
// We take box of width 156, height 114 centered at each cx and tileY=430
const tileWidth = 156;
const tileHeight = 114;
const tileYCenter = 430;

for (const c of colors) {
  const x0 = c.cx - Math.floor(tileWidth / 2);
  const y0 = tileYCenter - Math.floor(tileHeight / 2);

  const tilePng = extractWithTransparentBg(srcPng, x0, y0, tileWidth, tileHeight, false);

  const buf = PNG.sync.write(tilePng);
  fs.writeFileSync(path.join(outDirPublic, `tile_${c.name}.png`), buf);
  fs.writeFileSync(path.join(outDirSrc, `tile_${c.name}.png`), buf);
  console.log(`Exported tile_${c.name}.png (${tileWidth}x${tileHeight})`);
}

// 2. Process Top Open Buckets with 9 marbles (y around 114..277, height ~164, width ~164)
const bucketWidth = 168;
const bucketHeight = 168;
const bucketYCenter = 195;

for (const c of colors) {
  const x0 = c.cx - Math.floor(bucketWidth / 2);
  const y0 = bucketYCenter - Math.floor(bucketHeight / 2);

  const bucketPng = extractWithTransparentBg(srcPng, x0, y0, bucketWidth, bucketHeight, true);

  const buf = PNG.sync.write(bucketPng);
  fs.writeFileSync(path.join(outDirPublic, `bucket_open_${c.name}.png`), buf);
  fs.writeFileSync(path.join(outDirSrc, `bucket_open_${c.name}.png`), buf);
  console.log(`Exported bucket_open_${c.name}.png (${bucketWidth}x${bucketHeight})`);
}

console.log('All tiles and open buckets successfully cropped with transparent background!');
