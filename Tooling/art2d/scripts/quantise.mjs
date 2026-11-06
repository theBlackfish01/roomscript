// node quantise.mjs <Name>  out_rgba/<Name>/*.png -> out/<Name>/*.png (libimagequant via sharp + small-colour repair palfix.py), prints sizes
import sharp from 'sharp'; import fs from 'node:fs'; import path from 'node:path'; import { execFileSync } from 'node:child_process';
const [name] = process.argv.slice(2);
const src = `out_rgba/${name}`, dst = `out/${name}`; fs.mkdirSync(dst, { recursive: true }); fs.mkdirSync('debug/q', { recursive: true });
let total = 0; const rows = [];
for (const f of fs.readdirSync(src).filter((f) => f.endsWith('.png')).sort()) {
  const tmp = path.join('debug/q', f);
  await sharp(path.join(src, f)).png({ palette: true, quality: 90, effort: 10, dither: 1.0, compressionLevel: 9 }).toFile(tmp);
  execFileSync('.venv/Scripts/python', ['scripts/palfix.py', path.join(src, f), tmp, path.join(dst, f), '40', '10']);
  const kb = fs.statSync(path.join(dst, f)).size / 1024; total += kb; rows.push(`${f} ${kb.toFixed(0)}KB`);
}
console.log(rows.join('\n')); console.log(`TOTAL ${name} ${(total / 1024).toFixed(3)} MB`);
