const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const inputPath = path.join(__dirname, '../public/assets/aistudio/Glossy_Color_Sphere_Sprite_Sheet_214e5358.png');
console.log('Reading:', inputPath);

const srcData = fs.readFileSync(inputPath);
const srcPng = PNG.sync.read(srcData);

console.log('Dimensions:', srcPng.width, 'x', srcPng.height);

// Check alpha vs RGB around borders
let nonOpaque = 0;
for (let i = 0; i < srcPng.data.length; i += 4) {
  if (srcPng.data[i + 3] < 255) nonOpaque++;
}
console.log('Non-opaque pixels count:', nonOpaque, 'out of', srcPng.width * srcPng.height);

// Sample background pixel at (5, 5)
const idx = (5 * srcPng.width + 5) * 4;
console.log('Pixel (5,5):', srcPng.data[idx], srcPng.data[idx+1], srcPng.data[idx+2], srcPng.data[idx+3]);
