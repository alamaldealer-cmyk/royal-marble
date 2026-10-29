const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const cave0Path = path.join(__dirname, '../src/assets/images/cave/cave_0.png');
const data = fs.readFileSync(cave0Path);
const png = PNG.sync.read(data);

// Find the center of the capsule glass window (where x is around 256)
console.log('Center column (x=256) pixels:');
for (let y = 100; y < 450; y += 10) {
  const idx = (y * png.width + 256) * 4;
  console.log(`y=${y}: rgba(${png.data[idx]}, ${png.data[idx+1]}, ${png.data[idx+2]}, ${png.data[idx+3]})`);
}
