// Roomscript art pipeline runner.
// Serves ./web + ./node_modules + ./specs + ./out over localhost, drives headless Chromium (SwiftShader WebGL,
// deterministic CPU raster) with Playwright, and writes PNG / GLB / frame sequences. ffmpeg encodes motion.
// Usage: node run.mjs [--only portraits,props,cards,motion,sheet] [--char vale] [--out out]
import http from "node:http";
import {readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync, rmSync} from "node:fs";
import {join, extname, dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {createHash} from "node:crypto";
import {execFileSync, spawnSync} from "node:child_process";
import {chromium} from "playwright-core";

const ROOT = dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).join(" ").split("--").filter(Boolean).map(s => {const [k, ...v] = s.trim().split(/\s+/); return [k, v.join(" ") || true];}));
const ONLY = new Set(String(args.only || "portraits,props,cards,motion,sheet").split(","));
const OUT = resolve(ROOT, args.out || "out");
const CHAR = args.char ? String(args.char).toLowerCase() : null;
const MIME = {".html":"text/html",".js":"text/javascript",".mjs":"text/javascript",".json":"application/json",".png":"image/png",".woff2":"font/woff2",".css":"text/css"};

const json = p => JSON.parse(readFileSync(join(ROOT, p), "utf8"));
const listSpecs = dir => existsSync(join(ROOT, "specs", dir)) ? readdirSync(join(ROOT, "specs", dir)).filter(f => f.endsWith(".json")).sort().map(f => ({file: f, spec: json(join("specs", dir, f))})) : [];
const manifest = [];
function save(rel, buf, meta = {}) {
  const abs = join(OUT, rel); mkdirSync(dirname(abs), {recursive: true}); writeFileSync(abs, buf);
  manifest.push({path: rel.replace(/\\/g, "/"), bytes: buf.length, sha256: createHash("sha256").update(buf).digest("hex").slice(0, 16), ...meta});
}
const fromDataUrl = d => Buffer.from(d.slice(d.indexOf(",") + 1), "base64");

function findFfmpeg() {
  if (process.env.FFMPEG && existsSync(process.env.FFMPEG)) return process.env.FFMPEG;
  for (const cmd of [["python", ["-c", "import imageio_ffmpeg as i;print(i.get_ffmpeg_exe())"]], ["ffmpeg", ["-version"]]]) {
    try { const out = execFileSync(cmd[0], cmd[1], {encoding: "utf8", stdio: ["ignore", "pipe", "ignore"]}).trim(); return cmd[0] === "ffmpeg" ? "ffmpeg" : out.split(/\r?\n/).pop(); } catch {}
  }
  return null;
}

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);
  const path = url === "/" ? join(ROOT, "web", "harness.html") : url.startsWith("/out/") ? join(OUT, url.slice(5)) : join(ROOT, url);
  if (!path.startsWith(ROOT) && !path.startsWith(OUT)) { res.writeHead(403).end(); return; }
  try { const body = readFileSync(path); res.writeHead(200, {"content-type": MIME[extname(path)] || "application/octet-stream"}).end(body); }
  catch { res.writeHead(404).end(); }
});
await new Promise(r => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch({headless: true, args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--disable-gpu-driver-bug-workarounds", "--force-color-profile=srgb", "--font-render-hinting=none"]});
const page = await browser.newPage({viewport: {width: 800, height: 600}, deviceScaleFactor: 1});
page.on("console", m => { if (m.type() === "error" || m.type() === "warning") console.log("[page]", m.text()); });
page.on("pageerror", e => console.log("[pageerror]", e.message));
await page.goto(base + "/");
await page.waitForFunction(() => window.RS && window.RS.ready === true, null, {timeout: 60000});
const style = json("specs/style.json");
const t0 = Date.now();

if (ONLY.has("portraits")) {
  for (const {spec} of listSpecs("characters")) {
    if (CHAR && spec.key !== CHAR) continue;
    for (const pose of Object.keys(spec.poses)) {
      const r = await page.evaluate(([s, p, st]) => window.RS.portrait(s, p, st), [spec, pose, style]);
      save(`Art/Actors/${spec.file}/${spec.file}-${pose}.png`, fromDataUrl(r.x1), {kind: "portrait", suspect: spec.id, pose, size: "512x1024"});
      save(`Art/Actors/${spec.file}/hires/${spec.file}-${pose}@2x.png`, fromDataUrl(r.x2), {kind: "portrait-hires", suspect: spec.id, pose, size: "1024x2048"});
      save(`Previews/Actors/${spec.file}-${pose}-preview.png`, fromDataUrl(r.preview), {kind: "preview"});
      console.log("portrait", spec.file, pose);
    }
  }
}
if (ONLY.has("props")) {
  for (const {spec} of listSpecs("props")) {
    const r = await page.evaluate(([s, st]) => window.RS.prop(s, st), [spec, style]);
    save(`Art/Props/${spec.file}.glb`, Buffer.from(r.glb, "base64"), {kind: "glb", object: spec.object, triangles: r.triangles, heightM: r.heightM});
    save(`Art/Props/${spec.file}-thumb.png`, fromDataUrl(r.thumb), {kind: "prop-thumb"});
    console.log("prop", spec.file, r.triangles, "tris");
  }
}
if (ONLY.has("cards")) {
  const chars = Object.fromEntries(listSpecs("characters").map(c => [c.spec.id, c.spec]));
  for (const {spec} of listSpecs("cards")) {
    const r = await page.evaluate(([s, c, st]) => window.RS.card(s, c, st), [spec, chars, style]);
    save(`Art/Cards/${spec.file}.png`, fromDataUrl(r.png), {kind: "card", evidence: spec.evidence});
    save(`Previews/Cards/${spec.file}-preview.png`, fromDataUrl(r.preview), {kind: "preview"});
    console.log("card", spec.file);
  }
}
if (ONLY.has("motion")) {
  const ffmpeg = findFfmpeg();
  for (const {spec} of listSpecs("motion")) {
    const dir = join(OUT, "Motion", spec.file, "frames"); rmSync(dir, {recursive: true, force: true}); mkdirSync(dir, {recursive: true});
    const chars = Object.fromEntries(listSpecs("characters").map(c => [c.spec.id, c.spec]));
    await page.evaluate(([s, st, c]) => window.RS.motionInit(s, st, c), [spec, style, chars]);
    const frames = Math.round(spec.seconds * spec.fps);
    for (let f = 0; f < frames; f++) {
      const d = await page.evaluate(f => window.RS.motionFrame(f), f);
      writeFileSync(join(dir, String(f).padStart(4, "0") + ".png"), fromDataUrl(d));
    }
    console.log("motion", spec.file, frames, "frames");
    if (!ffmpeg) { console.warn("ffmpeg not found; frames only. Set FFMPEG=path."); continue; }
    const mp4 = join(OUT, "Motion", spec.file + ".mp4"), mov = join(OUT, "Motion", spec.file + "-alpha.webm");
    // Over black for the video edit (additive look), plus VP9+alpha WebM for compositing; the PNG frames stay the lossless master
    // (for a ProRes 4444 intermediate: -c:v prores_ks -profile:v 4444 -pix_fmt yuva444p10le, ~65 MB/s).
    spawnSync(ffmpeg, ["-y", "-loglevel", "error", "-framerate", String(spec.fps), "-i", join(dir, "%04d.png"), "-f", "lavfi", "-i", `color=c=black:s=${spec.width}x${spec.height}:r=${spec.fps}`, "-filter_complex", "[1][0]overlay=shortest=1,format=yuv420p", "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-movflags", "+faststart", mp4], {stdio: "inherit"});
    spawnSync(ffmpeg, ["-y", "-loglevel", "error", "-framerate", String(spec.fps), "-i", join(dir, "%04d.png"), "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "26", "-row-mt", "1", "-auto-alt-ref", "0", mov], {stdio: "inherit"});
    for (const p of [mp4, mov]) if (existsSync(p)) manifest.push({path: p.slice(OUT.length + 1).replace(/\\/g, "/"), bytes: statSync(p).size, kind: "video"});
  }
}
if (ONLY.has("sheet")) {
  const known = new Map([...(existsSync(join(OUT, "manifest.json")) ? JSON.parse(readFileSync(join(OUT, "manifest.json"), "utf8")) : []), ...manifest].map(m => [m.path, m]));
  const tiles = [...known.values()].filter(m => ["portrait", "card", "prop-thumb"].includes(m.kind) && existsSync(join(OUT, m.path))).map(m => m.path).sort();
  const motion = existsSync(join(OUT, "Motion")) ? readdirSync(join(OUT, "Motion")).filter(d => existsSync(join(OUT, "Motion", d, "frames"))) : [];
  const stills = motion.flatMap(m => { const fs = readdirSync(join(OUT, "Motion", m, "frames")).sort(); return [0.22, 0.32, 0.6, 0.9].map(k => `Motion/${m}/frames/${fs[Math.floor(k * (fs.length - 1))]}`); });
  const d = await page.evaluate(([t, s, st]) => window.RS.sheet(t, s, st), [tiles, stills, style]);
  save("contact-sheet.png", fromDataUrl(d), {kind: "sheet"});
}
const prior = existsSync(join(OUT, "manifest.json")) ? JSON.parse(readFileSync(join(OUT, "manifest.json"), "utf8")) : [];
const merged = Object.values(Object.fromEntries([...prior, ...manifest].map(m => [m.path, m])));
writeFileSync(join(OUT, "manifest.json"), JSON.stringify(merged, null, 1));
console.log(`done in ${((Date.now() - t0) / 1000).toFixed(1)} s; ${manifest.length} files`);
await browser.close(); server.close();
