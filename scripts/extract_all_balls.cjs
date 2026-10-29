const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const inputPath = path.join(__dirname, '../public/assets/aistudio/Glossy_Color_Sphere_Sprite_Sheet_214e5358.png');
const outDirSrc = path.join(__dirname, '../src/assets/images/balls');
const outDirPub = path.join(__dirname, '../public/assets/balls');

if (!fs.existsSync(outDirSrc)) fs.mkdirSync(outDirSrc, { recursive: true });
if (!fs.existsSync(outDirPub)) fs.mkdirSync(outDirPub, { recursive: true });

const srcData = fs.readFileSync(inputPath);
const srcPng = PNG.sync.read(srcData);

// Color locations on row 1 (cy = 291):
// Radius of sphere is 53px. We'll output 128x128 images with sphere centered at (64, 64)
const colorDefs = [
  { color: 'pink',   cx: 97,   cy: 291 },
  { color: 'ice',    cx: 365,  cy: 291 },
  { color: 'yellow', cx: 635,  cy: 291 },
  { color: 'lime',   cx: 768,  cy: 291 },
  { color: 'cyan',   cx: 1032, cy: 291 },
  { color: 'orange', cx: 1293, cy: 291 },
  { color: 'red',    cx: 1552, cy: 291 },
];

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h, s, l];
}

function hue2rgb(p, q, t) {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1/6) return p + (q - p) * 6 * t;
  if (t < 1/2) return q;
  if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
  return p;
}

function hslToRgb(h, s, l) {
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

const OUT_SIZE = 128;
const RADIUS = 53.0;
const FEATHER = 1.2;

for (const def of colorDefs) {
  const dstPng = new PNG({ width: OUT_SIZE, height: OUT_SIZE });

  for (let y = 0; y < OUT_SIZE; y++) {
    for (let x = 0; x < OUT_SIZE; x++) {
      const dx = x - OUT_SIZE / 2;
      const dy = y - OUT_SIZE / 2;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const dIdx = (y * OUT_SIZE + x) * 4;

      if (dist > RADIUS) {
        dstPng.data[dIdx + 3] = 0;
        continue;
      }

      const sx = Math.round(def.cx + dx);
      const sy = Math.round(def.cy + dy);
      const sIdx = (sy * srcPng.width + sx) * 4;

      const r = srcPng.data[sIdx];
      const g = srcPng.data[sIdx + 1];
      const b = srcPng.data[sIdx + 2];

      let alpha = 255;
      if (dist > RADIUS - FEATHER) {
        alpha = Math.round(((RADIUS - dist) / FEATHER) * 255);
      }

      dstPng.data[dIdx] = r;
      dstPng.data[dIdx + 1] = g;
      dstPng.data[dIdx + 2] = b;
      dstPng.data[dIdx + 3] = alpha;
    }
  }

  const buf = PNG.sync.write(dstPng);
  fs.writeFileSync(path.join(outDirSrc, `ball_${def.color}.png`), buf);
  fs.writeFileSync(path.join(outDirPub, `ball_${def.color}.png`), buf);
  console.log(`Saved ball_${def.color}.png (${buf.length} bytes)`);
}

// Generate Purple from Pink sphere
{
  const pinkDef = colorDefs[0];
  const dstPng = new PNG({ width: OUT_SIZE, height: OUT_SIZE });

  for (let y = 0; y < OUT_SIZE; y++) {
    for (let x = 0; x < OUT_SIZE; x++) {
      const dx = x - OUT_SIZE / 2;
      const dy = y - OUT_SIZE / 2;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const dIdx = (y * OUT_SIZE + x) * 4;

      if (dist > RADIUS) {
        dstPng.data[dIdx + 3] = 0;
        continue;
      }

      const sx = Math.round(pinkDef.cx + dx);
      const sy = Math.round(pinkDef.cy + dy);
      const sIdx = (sy * srcPng.width + sx) * 4;

      const r = srcPng.data[sIdx];
      const g = srcPng.data[sIdx + 1];
      const b = srcPng.data[sIdx + 2];

      let alpha = 255;
      if (dist > RADIUS - FEATHER) {
        alpha = Math.round(((RADIUS - dist) / FEATHER) * 255);
      }

      // Shift hue to royal purple: 265 / 360 = 0.736
      const [h, s, l] = rgbToHsl(r, g, b);
      let [newR, newG, newB] = [r, g, b];
      if (s > 0.15) {
        [newR, newG, newB] = hslToRgb(0.736, Math.min(1.0, s * 1.05), l);
      }

      dstPng.data[dIdx] = newR;
      dstPng.data[dIdx + 1] = newG;
      dstPng.data[dIdx + 2] = newB;
      dstPng.data[dIdx + 3] = alpha;
    }
  }

  const buf = PNG.sync.write(dstPng);
  fs.writeFileSync(path.join(outDirSrc, 'ball_purple.png'), buf);
  fs.writeFileSync(path.join(outDirPub, 'ball_purple.png'), buf);
  console.log(`Saved ball_purple.png (${buf.length} bytes)`);
}

console.log('All 8 glossy balls created successfully!');
