// node ready.mjs <Name> "<notes>"  -> out/<NAME>_READY.md
import fs from 'node:fs';
const [name, notes = ''] = process.argv.slice(2);
const A = JSON.parse(fs.readFileSync('out/anchors.json')).characters[name];
const f2 = (p) => (p ? `(${p.x}, ${p.y})` : '-');
const b2 = (b) => (b ? `x ${b.x} y ${b.y} w ${b.w} h ${b.h}` : '-');
const kb = (f) => (fs.existsSync(`out/${name}/${f}`) ? (fs.statSync(`out/${name}/${f}`).size / 1024).toFixed(0) : '-');
let total = 0; for (const f of fs.readdirSync(`out/${name}`)) total += fs.statSync(`out/${name}/${f}`).size;
const rows = Object.entries(A.frames).map(([fr, a]) => `| ${fr} | \`${a.body}\` (${kb(a.body)} KB)${a.body !== `${name}-${fr}.png` ? ' **shared**' : ''} | ${a.head ? `\`${a.head}\` (${kb(a.head)} KB)` : '-'} | ${a.canvas.join('x')} |`).join('\n');
const anc = Object.entries(A.frames).map(([fr, a]) => `| ${fr} | ${b2(a.headLayerRect)} | ${b2(a.faceBox)} | ${f2(a.eyes)} | ${b2(a.mouthBox)} | ${f2(a.tellProp)} | ${f2(a.rightHand)} | ${f2(a.leftHand)} | ${f2(a.feet)} | ${a.anchorsFrom} |`).join('\n');
const md = `# ${name}: ready (${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC)

**Complete.** Files are in \`Tooling/art2d/out/${name}/\`. The contact sheet is \`docs/captures/2026-11-07-run9-contact-${name.toLowerCase()}.png\`.

- **Height:** ${A.heightCm} cm on the shared scale (976 px = 170 cm, 5.741 px/cm, baseline y=1016).
- **Total size:** ${(total / 1048576).toFixed(3)} MB.

| Frame | Body layer | Head layer (512x512) | Canvas |
|---|---|---|---|
${rows}

To draw a frame, draw the body, then the head layer on top at \`headLayerRect\`. The head layer's lower part feathers into the body. A \`headLayerRect.y\` below 0 means the head layer extends above the body canvas, so let that quad overhang. Frames marked **shared** reuse the neutral body; only the head swaps (lip flap).

## Anchors

Normalised 0..1, origin at the top left of the frame canvas. \`rightHand\` and \`leftHand\` are the character's own. The source of truth is \`Tooling/art2d/out/anchors.json\`.

| Frame | headLayerRect | faceBox | eyes | mouthBox | tellProp | rightHand | leftHand | feet | from |
|---|---|---|---|---|---|---|---|---|---|
${anc}

${notes}
`;
fs.writeFileSync(`out/${name.toUpperCase()}_READY.md`, md);
console.log(`out/${name.toUpperCase()}_READY.md`, (total / 1048576).toFixed(3));
