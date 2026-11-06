// OpenAI Images request runner (node:https, no timeout). Never prints the key.
// The key is read from Tooling/.env at runtime; it is never written to a file.
const AUTH_SCHEME="Bearer";
// usage: node oai.mjs --job jobs/x.json   (job: {endpoint, images[], prompt, size, quality, n, out, character, frame, purpose})
import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ART = path.resolve(HERE, "..");
const ROOT = path.resolve(ART, "..");
const LEDGER_JSONL = path.join(ART, "ledger-requests.jsonl");
const LEDGER_JSON = path.join(ROOT, "results", "openai-images-ledger.json");
const PRICE = { text_in: 5 / 1e6, image_in: 8 / 1e6, out: 30 / 1e6 };

function key() {
  const env = fs.readFileSync(path.join(ROOT, ".env"), "utf8");
  const m = env.match(/^OPENAI_API_KEY\s*=\s*"?([^"\r\n]+)"?/m);
  if (!m) throw new Error("OPENAI_API_KEY missing");
  return m[1].trim();
}

function multipart(fields, files) {
  const b = "----art2d" + crypto.randomBytes(8).toString("hex");
  const parts = [];
  for (const [k, v] of Object.entries(fields)) {
    parts.push(Buffer.from(`--${b}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`));
  }
  for (const f of files) {
    parts.push(Buffer.from(`--${b}\r\nContent-Disposition: form-data; name="${f.name}"; filename="${path.basename(f.path)}"\r\nContent-Type: image/png\r\n\r\n`));
    parts.push(fs.readFileSync(f.path));
    parts.push(Buffer.from("\r\n"));
  }
  parts.push(Buffer.from(`--${b}--\r\n`));
  return { body: Buffer.concat(parts), type: `multipart/form-data; boundary=${b}` };
}

function post(urlPath, body, type) {
  return new Promise((resolve, reject) => {
    const WATCHDOG_MS = +(process.env.OAI_WATCHDOG_MS || 12 * 60 * 1000);
    const req = https.request({ host: "api.openai.com", path: urlPath, method: "POST",
      headers: { Authorization: AUTH_SCHEME+" "+key(), "Content-Type": type, "Content-Length": body.length } }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve({ status: res.statusCode, text: Buffer.concat(chunks).toString("utf8") }));
    });
    req.setTimeout(0);
    const wd = setTimeout(() => { req.destroy(new Error(`watchdog ${WATCHDOG_MS / 60000} min`)); }, WATCHDOG_MS);
    req.on("close", () => clearTimeout(wd));
    req.on("error", reject);
    req.end(body);
  });
}

function cost(u) {
  if (!u) return 0;
  const d = u.input_tokens_details || {};
  const img = d.image_tokens ?? 0;
  const txt = d.text_tokens ?? Math.max(0, (u.input_tokens || 0) - img);
  return txt * PRICE.text_in + img * PRICE.image_in + (u.output_tokens || 0) * PRICE.out;
}

function rebuildLedger() {
  const lines = fs.existsSync(LEDGER_JSONL) ? fs.readFileSync(LEDGER_JSONL, "utf8").split("\n").filter(Boolean) : [];
  const rows = lines.map((l) => JSON.parse(l));
  const total = rows.reduce((s, r) => s + (r.est_cost_usd || 0), 0);
  fs.writeFileSync(LEDGER_JSON, JSON.stringify({ total_est_cost_usd: +total.toFixed(4), budget_usd: 25, stop_at_usd: 22, requests: rows }, null, 2));
  return total;
}

export function spent() { return rebuildLedger(); }

async function run(job) {
  const t0 = Date.now();
  const total0 = rebuildLedger();
  if (total0 >= 22) { console.log(`BUDGET_STOP spent=${total0.toFixed(3)}`); process.exit(3); }
  const fields = { model: job.model || "gpt-image-2", prompt: job.prompt, size: job.size || "1024x1536",
    quality: job.quality || "medium", n: String(job.n || 1), output_format: "png" };
  let res;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      if (job.endpoint === "edit") {
        const files = job.images.map((p) => ({ name: "image[]", path: path.resolve(ART, p) }));
        const mp = multipart(fields, files);
        res = await post("/v1/images/edits", mp.body, mp.type);
      } else {
        const body = Buffer.from(JSON.stringify({ ...fields, n: job.n || 1 }));
        res = await post("/v1/images/generations", body, "application/json");
      }
    } catch (e) { res = { status: 599, text: `network: ${e.message}` }; }
    if (res.status < 500 || attempt === 3) break;
    fs.appendFileSync(path.join(ART, "errors.log"), `${new Date().toISOString()} ${job.out} attempt ${attempt} status=${res.status} ${res.text.slice(0, 120).replace(/\s+/g, " ")} (retrying)
`);
  }
  const secs = ((Date.now() - t0) / 1000).toFixed(0);
  let j; try { j = JSON.parse(res.text); } catch { j = { raw: res.text.slice(0, 500) }; }
  if (res.status !== 200) {
    const msg = j.error ? `${j.error.code || ""} ${j.error.type || ""} ${j.error.message}` : res.text.slice(0, 300);
    console.log(`ERROR status=${res.status} ${msg}`);
    fs.appendFileSync(path.join(ART, "errors.log"), `${new Date().toISOString()} ${job.out} ${res.status} ${msg}\n`);
    process.exit(res.status === 429 || /quota|billing/i.test(msg) ? 4 : 2);
  }
  const outs = [];
  j.data.forEach((d, i) => {
    const out = job.n > 1 ? job.out.replace(/\.png$/, `-c${i + 1}.png`) : job.out;
    fs.mkdirSync(path.dirname(path.resolve(ART, out)), { recursive: true });
    fs.writeFileSync(path.resolve(ART, out), Buffer.from(d.b64_json, "base64"));
    outs.push(out);
  });
  const row = { time: new Date().toISOString(), model: fields.model, endpoint: job.endpoint === "edit" ? "images/edits" : "images/generations",
    size: fields.size, quality: fields.quality, n: job.n || 1, input_fidelity: job.endpoint === "edit" ? "high (gpt-image-2 automatic; parameter omitted)" : null,
    usage: j.usage || null, est_cost_usd: +cost(j.usage).toFixed(4), files: outs, inputs: job.images || [], purpose: job.purpose,
    character: job.character, frame: job.frame, prompt_sha: crypto.createHash("sha256").update(job.prompt).digest("hex").slice(0, 16), prompt: job.prompt, seconds: +secs };
  fs.appendFileSync(LEDGER_JSONL, JSON.stringify(row) + "\n");
  const total = rebuildLedger();
  console.log(`OK ${outs.join(",")} ${secs}s cost=${row.est_cost_usd} total=${total.toFixed(3)}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const i = process.argv.indexOf("--job");
  if (i < 0) { console.log(`spent=${rebuildLedger().toFixed(3)}`); process.exit(0); }
  const job = JSON.parse(fs.readFileSync(process.argv[i + 1], "utf8"));
  run(job).catch((e) => { console.log(`ERROR network ${e.message}`); process.exit(2); });
}
