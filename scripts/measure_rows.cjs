const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const inputPath = path.join(__dirname, '../public/assets/aistudio/Glossy_Color_Sphere_Sprite_Sheet_214e5358.png');
const srcData = fs.readFileSync(inputPath);
const srcPng = PNG.sync.read(srcData);

console.log('Image width:', srcPng.width, 'height:', srcPng.height);

// Let's sample 5 rows vertically along x=100 (Pink ball 0)
// To find vertical centers of the 5 rows of balls
let inRow = false;
let rowStart = 0;
const rows = [];

for (let y = 0; y < srcPng.height; y++) {
  const idx = (y * srcPng.width + 100) * 4;
  const r = srcPng.data[idx];
  const g = srcPng.data[idx + 1];
  const b = srcPng.data[idx + 2];

  // Pink ball has r > 200, g < 100
  const isPink = r > 180 && g < 100;

  if (isPink && !inRow) {
    inRow = true;
    rowStart = y;
  } else if (!isPink && inRow) {
    inRow = false;
    const rowEnd = y - 1;
    const cy = Math.round((rowStart + rowEnd) / 2);
    const h = rowEnd - rowStart + 1;
    rows.push({ cy, h, start: rowStart, end: rowEnd });
  }
}

console.log('Detected rows:', rows);
