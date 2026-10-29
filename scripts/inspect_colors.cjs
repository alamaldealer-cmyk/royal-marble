const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const inputPath = path.join(__dirname, '../public/assets/aistudio/Glossy_Color_Sphere_Sprite_Sheet_214e5358.png');
const srcData = fs.readFileSync(inputPath);
const srcPng = PNG.sync.read(srcData);

// Let's inspect the 7 column positions in row 1 (cy = 291):
// Pink: ~97
// White: ~365
// Yellow: ~635
// Lime: ~768
// Cyan: ~1032
// Orange: ~1293
// Red: ~1552
const testCols = [
  { name: 'pink', estX: 97 },
  { name: 'ice', estX: 365 },
  { name: 'yellow', estX: 635 },
  { name: 'lime', estX: 768 },
  { name: 'cyan', estX: 1032 },
  { name: 'orange', estX: 1293 },
  { name: 'red', estX: 1552 },
];

testCols.forEach(col => {
  // Sample a 120x120 box around (estX, 291)
  const cy = 291;
  const cx = col.estX;
  const idx = (cy * srcPng.width + cx) * 4;
  console.log(`${col.name}: center pixel (${cx}, ${cy}) = rgb(${srcPng.data[idx]}, ${srcPng.data[idx+1]}, ${srcPng.data[idx+2]})`);
});
