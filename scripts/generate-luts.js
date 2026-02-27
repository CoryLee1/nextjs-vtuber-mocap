const fs = require('fs');
const path = require('path');

const SIZE = 16; // 16x16x16 LUT

function writeCube(name, transform) {
  let lines = [];
  lines.push(`TITLE "${name}"`);
  lines.push(`LUT_3D_SIZE ${SIZE}`);
  lines.push('');
  for (let b = 0; b < SIZE; b++) {
    for (let g = 0; g < SIZE; g++) {
      for (let r = 0; r < SIZE; r++) {
        const ri = r / (SIZE - 1);
        const gi = g / (SIZE - 1);
        const bi = b / (SIZE - 1);
        const [ro, go, bo] = transform(ri, gi, bi);
        lines.push(`${clamp(ro).toFixed(6)} ${clamp(go).toFixed(6)} ${clamp(bo).toFixed(6)}`);
      }
    }
  }
  const outPath = path.join(__dirname, '..', 'public', 'lut', `${name}.cube`);
  fs.writeFileSync(outPath, lines.join('\n'));
  console.log(`Written: ${outPath}`);
}

function clamp(v) { return Math.max(0, Math.min(1, v)); }

// Helper: lift shadows, compress highlights (filmic S-curve)
function sCurve(x, contrast = 1.2) {
  const mid = 0.5;
  return mid + (x - mid) * contrast / (1 + Math.abs((x - mid) * contrast * 2));
}

// 1. Cinematic Warm — teal shadows, warm highlights, filmic contrast
writeCube('cinematic-warm', (r, g, b) => {
  // Slight S-curve for contrast
  r = sCurve(r, 1.3);
  g = sCurve(g, 1.3);
  b = sCurve(b, 1.3);
  // Warm highlights: push red up, pull blue down in brights
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  r = r + luma * 0.06;
  g = g + luma * 0.02;
  b = b - luma * 0.04;
  // Teal shadows: add blue-green in darks
  const shadow = Math.max(0, 1 - luma * 2);
  r = r - shadow * 0.03;
  g = g + shadow * 0.02;
  b = b + shadow * 0.05;
  return [r, g, b];
});

// 2. Anime Soft — lifted blacks, reduced contrast, pastel push, slight pink tint
writeCube('anime-soft', (r, g, b) => {
  // Lift blacks
  r = r * 0.85 + 0.08;
  g = g * 0.85 + 0.08;
  b = b * 0.85 + 0.08;
  // Reduce contrast
  r = 0.5 + (r - 0.5) * 0.85;
  g = 0.5 + (g - 0.5) * 0.85;
  b = 0.5 + (b - 0.5) * 0.85;
  // Slight pink tint
  r = r + 0.02;
  b = b + 0.01;
  // Desaturate slightly
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  r = luma + (r - luma) * 0.9;
  g = luma + (g - luma) * 0.9;
  b = luma + (b - luma) * 0.9;
  return [r, g, b];
});

// 3. Cyberpunk — high contrast, magenta/cyan split toning, crushed blacks
writeCube('cyberpunk', (r, g, b) => {
  // Crush blacks
  r = Math.pow(r, 1.15);
  g = Math.pow(g, 1.15);
  b = Math.pow(b, 1.15);
  // High contrast S-curve
  r = sCurve(r, 1.6);
  g = sCurve(g, 1.6);
  b = sCurve(b, 1.6);
  // Split tone: cyan shadows, magenta highlights
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const highlight = Math.max(0, luma * 2 - 1);
  const shadow = Math.max(0, 1 - luma * 2);
  // Magenta highlights
  r = r + highlight * 0.08;
  b = b + highlight * 0.06;
  // Cyan shadows
  g = g + shadow * 0.06;
  b = b + shadow * 0.08;
  // Boost saturation
  r = luma + (r - luma) * 1.2;
  g = luma + (g - luma) * 1.2;
  b = luma + (b - luma) * 1.2;
  return [r, g, b];
});

// 4. Neutral (identity) — pass-through for testing
writeCube('neutral', (r, g, b) => [r, g, b]);

console.log('Done!');
