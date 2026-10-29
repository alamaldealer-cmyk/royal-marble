const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const inputPath = path.join(__dirname, '../public/assets/aistudio/cave_spritesheet_no_number_f4d309e0.png');
const outDirSrc = path.join(__dirname, '../src/assets/images/cave');
const outDirPub = path.join(__dirname, '../public/assets/cave');

if (!fs.existsSync(outDirSrc)) fs.mkdirSync(outDirSrc, { recursive: true });
if (!fs.existsSync(outDirPub)) fs.mkdirSync(outDirPub, { recursive: true });

const srcData = fs.readFileSync(inputPath);
const srcPng = PNG.sync.read(srcData);

const frameW = 512;
const frameH = 512;
const cols = 8;
const rows = 2;

for (let idx = 0; idx < 16; idx++) {
  const col = idx % cols;
  const row = Math.floor(idx / cols);
  const startX = col * frameW;
  const startY = row * frameH;

  const framePng = new PNG({ width: frameW, height: frameH });

  for (let y = 0; y < frameH; y++) {
    for (let x = 0; x < frameW; x++) {
      const sIdx = ((startY + y) * srcPng.width + (startX + x)) * 4;
      const dIdx = (y * frameW + x) * 4;

      let r = srcPng.data[sIdx];
      let g = srcPng.data[sIdx + 1];
      let b = srcPng.data[sIdx + 2];
      let a = srcPng.data[sIdx + 3];

      // Clean up stray white border artifacts near outer cell edge (within 8px of edges)
      if ((x <= 8 || x >= frameW - 9 || y <= 8 || y >= frameH - 9) && r > 230 && g > 230 && b > 230) {
        a = 0;
      }

      framePng.data[dIdx] = r;
      framePng.data[dIdx + 1] = g;
      framePng.data[dIdx + 2] = b;
      framePng.data[dIdx + 3] = a;
    }
  }

  const outSrc = path.join(outDirSrc, `cave_${idx}.png`);
  const outPub = path.join(outDirPub, `cave_${idx}.png`);
  const buffer = PNG.sync.write(framePng);
  fs.writeFileSync(outSrc, buffer);
  fs.writeFileSync(outPub, buffer);
  console.log(`Saved frame ${idx} (${buffer.length} bytes)`);
}

console.log('All 16 frames saved successfully!');
