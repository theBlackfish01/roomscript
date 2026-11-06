// node overlay.mjs <Name>  -> debug/<Name>-<frame>-anchors.png + debug/<Name>-anchors-all.png
import sharp from 'sharp'; import fs from 'node:fs';
import { composeFrame } from './composite.mjs';
const name = process.argv[2];
const A = JSON.parse(fs.readFileSync('out/anchors.json')).characters[name];
const geom = JSON.parse(fs.readFileSync(`out/geom_${name}.json`));
const tiles = []; let X = 4;
const col = { faceBox: '#00ffff', mouthBox: '#ff00ff', headLayerRect: '#ffff00', eyes: '#00ff00', tellProp: '#ff8800', rightHand: '#ff0000', leftHand: '#0088ff', feet: '#ffffff' };
for (const [fr, a] of Object.entries(A.frames)) {
  const [cw, ch] = a.canvas;
  const b = await composeFrame(name, 'out', fr, geom.frames[fr]);
  let svg = `<svg width="${cw}" height="${ch}" xmlns="http://www.w3.org/2000/svg">`;
  for (const [k, v] of Object.entries(a)) {
    if (!v || typeof v !== 'object' || Array.isArray(v) || !col[k]) continue;
    if ('w' in v) svg += `<rect x="${v.x * cw}" y="${v.y * ch}" width="${v.w * cw}" height="${v.h * ch}" fill="none" stroke="${col[k]}" stroke-width="1.5"/>`;
    else svg += `<circle cx="${v.x * cw}" cy="${v.y * ch}" r="5" fill="none" stroke="${col[k]}" stroke-width="2"/><text x="${v.x * cw + 7}" y="${v.y * ch + 4}" font-size="10" font-family="Arial" fill="${col[k]}">${k}</text>`;
  }
  svg += `<line x1="0" y1="${ch === 1024 ? 1016 : 504}" x2="${cw}" y2="${ch === 1024 ? 1016 : 504}" stroke="#f00" stroke-opacity="0.5"/></svg>`;
  const img = await sharp({ create: { width: cw, height: ch, channels: 3, background: '#555' } }).composite([{ input: b }, { input: Buffer.from(svg) }]).png().toBuffer();
  fs.writeFileSync(`debug/${name}-${fr}-anchors.png`, img);
  tiles.push({ input: img, left: X, top: 4 }); X += cw + 4;
}
await sharp({ create: { width: X, height: 1032, channels: 3, background: '#222' } }).composite(tiles).png().toFile(`debug/${name}-anchors-all.png`);
console.log(`debug/${name}-anchors-all.png`);
