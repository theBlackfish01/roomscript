// Build out/anchors.json from out/geom_<Name>.json (+ config anchors in source px). node anchors.mjs
import fs from 'node:fs';
const out = { _doc: 'Normalised (0..1) anchors, origin top-left of the frame canvas (512x1024 standing; 1024x512 fallen). Boxes {x,y,w,h}. eyes = midpoint between the eyes; feet = sole-level midpoint; rightHand/leftHand = the CHARACTER\'s right/left; headLayerRect = where the 512x512 <frame>-head.png sits on the body canvas (draw it on top, same pivot); body = body texture file (expression frames can share the neutral body).', canvasStanding: [512, 1024], canvasFallen: [1024, 512], baselineY_px: 1016, pxPerCm: 976 / 170, characters: {} };
const r = (v) => Math.round(v * 10000) / 10000;
for (const f of fs.readdirSync('out').filter((f) => /^geom_.*\.json$/.test(f))) {
  const g = JSON.parse(fs.readFileSync('out/' + f));
  const ch = { heightCm: g.height_cm, frames: {} };
  const neutral = g.frames.neutral || g.frames.standing;
  for (const [fr, fg] of Object.entries(g.frames)) {
    const own = fg.anchors_src && Object.keys(fg.anchors_src).length;
    const src = own ? fg.anchors_src : (neutral?.anchors_src || {});
    const [kx, ky, px, py] = own || !neutral ? fg.map : neutral.map;
    const [cw, chh] = fg.canvas || [512, 1024];
    const A = {};
    for (const [k, v] of Object.entries(src)) {
      if (v.length === 4) A[k] = { x: r((v[0] * kx + px) / cw), y: r((v[1] * ky + py) / chh), w: r(v[2] * kx / cw), h: r(v[3] * ky / chh) };
      else A[k] = { x: r((v[0] * kx + px) / cw), y: r((v[1] * ky + py) / chh) };
    }
    if (cw !== 1024 || chh !== 512) A.feet = { x: 0.5, y: r(1016 / 1024) }; // normaliser pivot: sole midpoint on the baseline
    if (fg.headLayerRect) { const [x, y, w, h] = fg.headLayerRect; A.headLayerRect = { x: r(x), y: r(y), w: r(w), h: r(h) }; }
    ch.frames[fr] = { body: fg.body, head: fg.head || null, canvas: fg.canvas || [512, 1024], anchorsFrom: own ? fr : 'neutral', ...A };
  }
  out.characters[g.character] = ch;
}
fs.writeFileSync('out/anchors.json', JSON.stringify(out, null, 1));
console.log(Object.keys(out.characters).join(','));
