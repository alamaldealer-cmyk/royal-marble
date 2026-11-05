const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Test sharp SVG rasterization
const testSvg = `
<svg width="140" height="140" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#2E1B5B"/>
      <stop offset="100%" stop-color="#140A2E"/>
    </linearGradient>
  </defs>
  <rect x="10" y="10" width="120" height="120" rx="28" fill="url(#bgGrad)"/>
</svg>`;

sharp(Buffer.from(testSvg))
  .png()
  .toBuffer()
  .then(buf => {
    console.log('Sharp test succeeded, buffer length:', buf.length);
  })
  .catch(err => {
    console.error('Sharp test failed:', err);
  });
