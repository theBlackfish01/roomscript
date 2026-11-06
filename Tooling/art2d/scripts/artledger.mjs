// node artledger.mjs -> ledger.json (per character/frame: chosen raw, request prompt/model/size/quality, outputs, sizes)
import fs from 'node:fs';
const cfg = JSON.parse(fs.readFileSync('config.json'));
const reqs = fs.readFileSync('ledger-requests.jsonl', 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
const out = { _doc: 'Per-frame provenance for the Run 9 illustrated cast. Seeds: n/a (OpenAI Images API exposes none). Full request log: Tooling/results/openai-images-ledger.json', generated: new Date().toISOString(), characters: {} };
for (const [name, c] of Object.entries(cfg)) {
  const fr = {};
  for (const [f, fc] of Object.entries(c.frames)) {
    const raw = fc.raw || null;
    const req = raw ? reqs.find((r) => r.files.includes(raw)) : null;
    const size = (p) => (fs.existsSync(p) ? +(fs.statSync(p).size / 1024).toFixed(1) : null);
    fr[f] = { chosen_raw: raw, source: req ? { model: req.model, endpoint: req.endpoint, size: req.size, quality: req.quality, inputs: req.inputs, prompt: req.prompt, time: req.time, candidates: req.files } : (raw && raw.includes('-base') && name === 'Vale' ? { note: 'style reference docs/art/2026-11-07-vale-style-reference.png (gpt-image-2, medium, 1024x1536, generated Nov 7 before this run)' } : null),
      body_kb: size(`out/${name}/${name}-${f}.png`), head_kb: size(`out/${name}/${name}-${f}-head.png`), body_shared_with: fc.body && fc.body !== 'own' ? fc.body : null };
  }
  out.characters[name] = { height_cm: c.height_cm, frames: fr };
}
const total = reqs.reduce((s, r) => s + r.est_cost_usd, 0);
out.openai_total_est_usd = +total.toFixed(3);
fs.writeFileSync('ledger.json', JSON.stringify(out, null, 1));
console.log('ledger.json', out.openai_total_est_usd);
