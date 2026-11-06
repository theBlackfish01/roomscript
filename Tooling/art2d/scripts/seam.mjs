import sharp from 'sharp'; import fs from 'node:fs'; import path from 'node:path';
import { composeFrame } from './composite.mjs';
const [name, dir, out, frames, crop] = process.argv.slice(2);
const geom = JSON.parse(fs.readFileSync(`out/geom_${name}.json`));
const [x,y,w,h] = crop.split(',').map(Number);
const tiles=[]; let X=4;
for (const fr of frames.split(',')) { const b = await composeFrame(name, dir, fr, geom.frames[fr]);
  const c = await sharp(b).extract({left:x,top:y,width:w,height:h}).flatten({background:'#000'}).png().toBuffer(); const t = await sharp(c).resize({width:w*3,kernel:'nearest'}).png().toBuffer();
  tiles.push({input:t,left:X,top:4}); X+=w*3+4; }
await sharp({create:{width:X,height:h*3+8,channels:3,background:'#444'}}).composite(tiles).png().toFile(out); console.log(out);
