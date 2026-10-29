const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const inputPath = path.join(__dirname, '../public/assets/aistudio/Glossy_Color_Sphere_Sprite_Sheet_214e5358.png');
const srcData = fs.readFileSync(inputPath);
const srcPng = PNG.sync.read(srcData);

const y = 291;
for (let x = 320; x <= 550; x += 20) {
  const idx = (y * srcPng.width + x) * 4;
  console.log(`x=${x}: rgb(${srcPng.data[idx]}, ${srcPng.data[idx+1]}, ${srcPng.data[idx+2]})`);
}
