// node compare.mjs out.png [--crop x,y,w,h] [--h 700] img1 img2 ...  (labels = basenames)
import sharp from "sharp";
import path from "node:path";
const args = process.argv.slice(2);
const out = args.shift();
let crop = null, H = 700;
for (let i = 0; i < args.length; ) {
  if (args[i] === "--crop") { crop = args[i + 1].split(",").map(Number); args.splice(i, 2); }
  else if (args[i] === "--h") { H = +args[i + 1]; args.splice(i, 2); }
  else i++;
}
const tiles = [];
for (const f of args) {
  let img = sharp(f);
  if (crop) img = img.extract({ left: crop[0], top: crop[1], width: crop[2], height: crop[3] });
  const buf = await img.resize({ height: H }).png().toBuffer();
  const m = await sharp(buf).metadata();
  tiles.push({ buf, w: m.width, label: path.basename(f, ".png") });
}
const W = tiles.reduce((s, t) => s + t.w + 8, 8);
const comps = []; let x = 8;
for (const t of tiles) {
  comps.push({ input: t.buf, left: x, top: 30 });
  comps.push({ input: Buffer.from(`<svg width="${t.w}" height="26"><text x="4" y="19" font-family="Arial" font-size="16" fill="#fff">${t.label}</text></svg>`), left: x, top: 2 });
  x += t.w + 8;
}
await sharp({ create: { width: W, height: H + 38, channels: 3, background: "#333" } }).composite(comps).png().toFile(out);
console.log(out);
