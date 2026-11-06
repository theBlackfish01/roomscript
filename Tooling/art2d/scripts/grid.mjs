// node grid.mjs in.png out.png x,y,w,h step [scale]  -> crop with labelled grid in SOURCE pixel coords
import sharp from "sharp";
const [inp, out, crop, stepS, scaleS] = process.argv.slice(2);
const [x, y, w, h] = crop.split(",").map(Number);
const step = +stepS, k = +(scaleS || 2);
const W = Math.round(w * k), H = Math.round(h * k);
const base = await sharp(inp).flatten({ background: "#808080" }).extract({ left: x, top: y, width: w, height: h }).resize(W, H).png().toBuffer();
let svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">`;
for (let gx = Math.ceil(x / step) * step; gx < x + w; gx += step) {
  const px = (gx - x) * k, major = gx % (step * 5) === 0;
  svg += `<line x1="${px}" y1="0" x2="${px}" y2="${H}" stroke="${major ? "#00ffff" : "#00ff00"}" stroke-opacity="0.55" stroke-width="1"/>`;
  svg += `<text x="${px + 2}" y="12" font-size="11" font-family="Arial" fill="#ff0">${gx}</text>`;
}
for (let gy = Math.ceil(y / step) * step; gy < y + h; gy += step) {
  const py = (gy - y) * k, major = gy % (step * 5) === 0;
  svg += `<line x1="0" y1="${py}" x2="${W}" y2="${py}" stroke="${major ? "#00ffff" : "#00ff00"}" stroke-opacity="0.55" stroke-width="1"/>`;
  svg += `<text x="2" y="${py - 2}" font-size="11" font-family="Arial" fill="#ff0">${gy}</text>`;
}
svg += "</svg>";
await sharp(base).composite([{ input: Buffer.from(svg) }]).png().toFile(out);
console.log(out);
