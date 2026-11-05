const sharp = require('sharp');
const fs = require('fs');

async function testExtract() {
  const inputPath = 'public/assets/aistudio/Magnet_and_Shuffle_Power-Up_Sprite_Sheet_4cf2056b.png';
  const img = sharp(inputPath);
  const meta = await img.metadata();
  const raw = await img.raw().toBuffer({ resolveWithObject: true });

  const { width, height } = raw.info;
  const data = raw.data;

  // Function to process a region [x0, y0, w, h]
  function extractWithTransparency(x0, y0, w, h) {
    const outBuf = Buffer.alloc(w * h * 4);

    // First, identify background mask using flood fill from edges
    // Background pixels are grayscale (diff <= 8) and either near 219 or near 254
    const isBgCandidate = (x, y) => {
      const idx = (y * width + x) * 3;
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const diff = max - min;
      // Strict checkerboard check
      if (diff <= 7) {
        if ((r >= 210 && r <= 228) || (r >= 247 && r <= 255)) {
          return true;
        }
      }
      return false;
    };

    // Flood fill from edges of region
    const visited = new Uint8Array(w * h);
    const queue = [];

    // Push boundary pixels that match bg
    for (let lx = 0; lx < w; lx++) {
      // top edge
      if (isBgCandidate(x0 + lx, y0)) {
        visited[0 * w + lx] = 1;
        queue.push(lx, 0);
      }
      // bottom edge
      if (isBgCandidate(x0 + lx, y0 + h - 1)) {
        visited[(h - 1) * w + lx] = 1;
        queue.push(lx, h - 1);
      }
    }
    for (let ly = 0; ly < h; ly++) {
      // left edge
      if (isBgCandidate(x0, y0 + ly)) {
        visited[ly * w + 0] = 1;
        queue.push(0, ly);
      }
      // right edge
      if (isBgCandidate(x0 + w - 1, y0 + ly)) {
        visited[ly * w + (w - 1)] = 1;
        queue.push(w - 1, ly);
      }
    }

    let head = 0;
    while (head < queue.length) {
      const cx = queue[head++];
      const cy = queue[head++];

      const neighbors = [
        [cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]
      ];
      for (const [nx, ny] of neighbors) {
        if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
          const nidx = ny * w + nx;
          if (!visited[nidx] && isBgCandidate(x0 + nx, y0 + ny)) {
            visited[nidx] = 1;
            queue.push(nx, ny);
          }
        }
      }
    }

    // Now copy pixels to RGBA buffer
    for (let ly = 0; ly < h; ly++) {
      for (let lx = 0; lx < w; lx++) {
        const srcIdx = ((y0 + ly) * width + (x0 + lx)) * 3;
        const dstIdx = (ly * w + lx) * 4;
        const isB = visited[ly * w + lx] === 1;

        const r = data[srcIdx];
        const g = data[srcIdx + 1];
        const b = data[srcIdx + 2];

        if (isB) {
          outBuf[dstIdx] = 0;
          outBuf[dstIdx + 1] = 0;
          outBuf[dstIdx + 2] = 0;
          outBuf[dstIdx + 3] = 0;
        } else {
          // Check if adjacent to background for smooth antialiasing
          let bgAdj = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const nX = lx + dx;
              const nY = ly + dy;
              if (nX >= 0 && nX < w && nY >= 0 && nY < h) {
                if (visited[nY * w + nX] === 1) bgAdj++;
              }
            }
          }

          let alpha = 255;
          let outR = r, outG = g, outB = b;

          // If adjacent to background and somewhat pale/grayish, calculate soft alpha
          const diff = Math.max(r, g, b) - Math.min(r, g, b);
          if (bgAdj > 0 && diff <= 12 && ((r > 205 && r < 232) || r > 240)) {
            // Semi-transparent transition
            alpha = Math.max(20, Math.min(240, 255 - bgAdj * 25));
          }

          // If it is blue/cyan glow around button (e.g. diff > 15 and blue > red), keep full vibrant glow
          outBuf[dstIdx] = outR;
          outBuf[dstIdx + 1] = outG;
          outBuf[dstIdx + 2] = outB;
          outBuf[dstIdx + 3] = alpha;
        }
      }
    }

    return sharp(outBuf, { raw: { width: w, height: h, channels: 4 } });
  }

  // Test extraction of Button 0 (Magnet Idle) and Button 3 (Magnet Active)
  // Row 2 is y: 284..476 (h=192), width=192
  await extractWithTransparency(0, 284, 192, 192).png().toFile('public/assets/test_btn_mag_0.png');
  await extractWithTransparency(192 * 3, 284, 192, 192).png().toFile('public/assets/test_btn_mag_3.png');
  await extractWithTransparency(192 * 4, 284, 192, 192).png().toFile('public/assets/test_btn_shuf_0.png');
  await extractWithTransparency(192 * 7, 284, 192, 192).png().toFile('public/assets/test_btn_shuf_3.png');
  console.log('Saved test buttons');
}

testExtract().catch(console.error);
