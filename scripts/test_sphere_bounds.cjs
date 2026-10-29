const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const inputPath = path.join(__dirname, '../public/assets/aistudio/Glossy_Color_Sphere_Sprite_Sheet_214e5358.png');
const srcData = fs.readFileSync(inputPath);
const srcPng = PNG.sync.read(srcData);

// Let's test Column 0, Row 1 (Pink)
// We know cy ~ 291, cx ~ 102
// Let's find exact bounding circle
console.log('Testing Pink sphere at cx~102, cy~291...');

// Find horizontal edges at y=291
let leftX = 0, rightX = 0;
for (let x = 40; x < 160; x++) {
  const idx = (291 * srcPng.width + x) * 4;
  const r = srcPng.data[idx];
  const g = srcPng.data[idx + 1];
  const b = srcPng.data[idx + 2];
  const isPink = r > 180 && g < 100;
  if (isPink && !leftX) leftX = x;
  if (!isPink && leftX && !rightX) rightX = x - 1;
}
console.log('Horizontal edges at y=291:', leftX, rightX, 'center:', (leftX + rightX) / 2, 'width:', rightX - leftX + 1);

// Find vertical edges at x=102
let topY = 0, bottomY = 0;
for (let y = 230; y < 350; y++) {
  const idx = (y * srcPng.width + 102) * 4;
  const r = srcPng.data[idx];
  const g = srcPng.data[idx + 1];
  const b = srcPng.data[idx + 2];
  const isPink = r > 180 && g < 100;
  if (isPink && !topY) topY = y;
  if (!isPink && topY && !bottomY) bottomY = y - 1;
}
console.log('Vertical edges at x=102:', topY, bottomY, 'center:', (topY + bottomY) / 2, 'height:', bottomY - topY + 1);
