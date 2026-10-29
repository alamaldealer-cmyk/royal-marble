const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const inputPath = path.join(__dirname, '../public/assets/aistudio/Glossy_Color_Sphere_Sprite_Sheet_214e5358.png');
const srcData = fs.readFileSync(inputPath);
const srcPng = PNG.sync.read(srcData);

// Checkerboard detection function
function isCheckerboard(r, g, b) {
  // Check if pixel is gray/white checkerboard
  // Checkerboard squares in this image are:
  // white: (254, 253, 253) or similar (r>230, g>230, b>230, |r-g|<10, |g-b|<10)
  // gray: (204, 204, 204) or similar (r>190, g>190, b>190, |r-g|<10, |g-b|<10)
  return Math.abs(r - g) <= 8 && Math.abs(g - b) <= 8 && Math.abs(r - b) <= 8 && r >= 195;
}

// Let's sample along row 1 (y = 291)
const y = 291;
const cols = [];
let inSphere = false;
let startX = 0;

for (let x = 0; x < srcPng.width; x++) {
  const idx = (y * srcPng.width + x) * 4;
  const r = srcPng.data[idx];
  const g = srcPng.data[idx + 1];
  const b = srcPng.data[idx + 2];

  const bg = isCheckerboard(r, g, b);

  if (!bg && !inSphere) {
    inSphere = true;
    startX = x;
  } else if (bg && inSphere) {
    inSphere = false;
    const endX = x - 1;
    const w = endX - startX + 1;
    if (w > 40) {
      const cx = Math.round((startX + endX) / 2);
      const cIdx = (y * srcPng.width + cx) * 4;
      cols.push({
        cx,
        w,
        startX,
        endX,
        rgb: [srcPng.data[cIdx], srcPng.data[cIdx+1], srcPng.data[cIdx+2]]
      });
    }
  }
}

console.log('Columns on row 1:', cols);
