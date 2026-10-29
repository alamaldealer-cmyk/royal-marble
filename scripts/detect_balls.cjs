const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const inputPath = path.join(__dirname, '../public/assets/aistudio/Glossy_Color_Sphere_Sprite_Sheet_214e5358.png');
const srcData = fs.readFileSync(inputPath);
const srcPng = PNG.sync.read(srcData);

// Background in this image is a checkerboard of white (~255) and light gray (~204)
// Let's sample along horizontal line y = 160 (middle of row 0 balls)
console.log('Sampling y=160 across width...');

let inBall = false;
let ballStart = 0;
const balls = [];

for (let x = 0; x < srcPng.width; x++) {
  const idx = (160 * srcPng.width + x) * 4;
  const r = srcPng.data[idx];
  const g = srcPng.data[idx + 1];
  const b = srcPng.data[idx + 2];

  // Checkerboard is near gray/white: |r-g| < 15 && |g-b| < 15 && r > 190
  const isBg = Math.abs(r - g) < 15 && Math.abs(g - b) < 15 && r > 185;

  if (!isBg && !inBall) {
    inBall = true;
    ballStart = x;
  } else if (isBg && inBall) {
    inBall = false;
    const ballEnd = x - 1;
    const ballCenter = Math.round((ballStart + ballEnd) / 2);
    const midIdx = (160 * srcPng.width + ballCenter) * 4;
    balls.push({
      center: ballCenter,
      width: ballEnd - ballStart + 1,
      r: srcPng.data[midIdx],
      g: srcPng.data[midIdx + 1],
      b: srcPng.data[midIdx + 2],
    });
  }
}

console.log(`Found ${balls.length} balls on row 0:`);
balls.forEach((b, i) => {
  console.log(`Ball ${i}: x=${b.center}, w=${b.width}, rgb(${b.r}, ${b.g}, ${b.b})`);
});
