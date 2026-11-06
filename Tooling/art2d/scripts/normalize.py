"""Normalise cutouts to the shared standee canvas, export head layers + anchors.
usage: python normalize.py <Character>   (reads config.json, writes out_rgba/<Name>/*.png and out/anchors_<Name>.json)

Canvas 512x1024, feet baseline y=1016, px/cm = 976/170 (a 170 cm figure's head top at y=40).
Fallen frames: 1024x512 canvas, same px/cm, body centred, lowest point on y=504.
Source-space anchors (pixels of the raw 1024x1536 frame) come from config.json and are mapped
with the frame's registration + the character transform.
"""
import json, sys, os
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi

ART = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PXCM = 976.0 / 170.0
CW, CH, BASE = 512, 1024, 1016
HEAD = 512

def load(p):
    return np.asarray(Image.open(os.path.join(ART, p)).convert("RGBA")).astype(np.float32)

def bbox(a, t=128):
    ys, xs = np.nonzero(a[..., 3] > t)
    return xs.min(), ys.min(), xs.max(), ys.max()

def feet_x(a):
    x0, y0, x1, y1 = bbox(a)
    band = a[y1 - max(4, int((y1 - y0) * 0.03)): y1 + 1, :, 3] > 128
    xs = np.nonzero(band)[1]
    return float(xs.mean())

def gray(a, region):
    x0, y0, x1, y1 = region
    sub = a[y0:y1, x0:x1]
    al = sub[..., 3:4] / 255.0
    g = (sub[..., :3] * al + 128 * (1 - al)).mean(2)
    return g

def register(ref, mov, region, search=24):
    """integer translation (dx,dy) so that mov shifted by (dx,dy) matches ref in region."""
    x0, y0, x1, y1 = region
    R = gray(ref, region)
    best = (1e18, 0, 0)
    H, W = ref.shape[:2]
    for step, rng, cx, cy in ((3, search, 0, 0),):
        pass
    def ssd(dx, dy):
        rx0, ry0, rx1, ry1 = x0 - dx, y0 - dy, x1 - dx, y1 - dy
        if rx0 < 0 or ry0 < 0 or rx1 > W or ry1 > H:
            return 1e18
        M = gray(mov, (rx0, ry0, rx1, ry1))
        return float(((R - M) ** 2).mean())
    for dy in range(-search, search + 1, 3):
        for dx in range(-search, search + 1, 3):
            v = ssd(dx, dy)
            if v < best[0]: best = (v, dx, dy)
    _, bx, by = best
    for dy in range(by - 3, by + 4):
        for dx in range(bx - 3, bx + 4):
            v = ssd(dx, dy)
            if v < best[0]: best = (v, dx, dy)
    return best[1], best[2], best[0]

def shift(a, dx, dy):
    out = np.zeros_like(a)
    H, W = a.shape[:2]
    xs0, xd0 = (0, dx) if dx >= 0 else (-dx, 0)
    ys0, yd0 = (0, dy) if dy >= 0 else (-dy, 0)
    w, h = W - abs(dx), H - abs(dy)
    out[yd0:yd0 + h, xd0:xd0 + w] = a[ys0:ys0 + h, xs0:xs0 + w]
    return out

def to_img(a):
    return Image.fromarray(a.round().clip(0, 255).astype(np.uint8), "RGBA")

def resize_premul(img, size):
    return img.convert("RGBa").resize(size, Image.LANCZOS).convert("RGBA")

def place(src, s, fx, fy, cw, ch, ox, oy):
    """scale src by s, put source point (fx,fy) at canvas (ox,oy)."""
    im = to_img(src)
    W, H = im.size
    sw, sh = round(W * s), round(H * s)
    sc = resize_premul(im, (sw, sh))
    canvas = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    px, py = round(ox - fx * sw / W), round(oy - fy * sh / H)
    canvas.alpha_composite(sc, (max(0, px), max(0, py)), (max(0, -px), max(0, -py)))
    # actual mapping: canvas = src * (sw/W) + (px,py)
    return canvas, (sw / W, sh / H, px, py)

def main(name):
    cfg = json.load(open(os.path.join(ART, "config.json")))[name]
    frames = cfg["frames"]
    hcm = cfg["height_cm"]
    REF = cfg.get("ref", "neutral")
    ref = load(frames[REF]["cut"])
    x0, y0, x1, y1 = bbox(ref)
    s = hcm * PXCM / (y1 - y0 + 1)
    fx = feet_x(ref)
    # head crop square in neutral source space
    figH = y1 - y0 + 1
    S = int(round(cfg.get("head_frac", 0.22) * figH))
    top_band = ref[y0: y0 + int(figH * 0.1), :, 3] > 128
    hcx = float(np.nonzero(top_band)[1].mean()) + cfg.get("head_dx", 0)
    hx0 = int(round(hcx - S / 2)); hy0 = int(round(y0 - 0.03 * figH)) + cfg.get("head_dy", 0)
    head_region = (hx0, max(0, hy0), hx0 + S, hy0 + int(S * 0.75))
    legs_region = (max(0, x0 - 20), int(y1 - figH * 0.28), min(ref.shape[1], x1 + 20), min(ref.shape[0], y1 + 10))
    outdir = os.path.join(ART, "out_rgba", name); os.makedirs(outdir, exist_ok=True)
    result = {"character": name, "height_cm": hcm, "px_per_cm": PXCM, "canvas": [CW, CH], "baseline_y": BASE,
              "scale_src_to_canvas": s, "frames": {}}
    # feather mask for head layer (fades the lower part into the body)
    yy, xx = np.mgrid[0:HEAD, 0:HEAD] / HEAD
    def make_feather(start):
        vf = np.clip((1.0 - yy) / (1.0 - start), 0, 1)
        hf = np.clip(np.minimum(xx, 1 - xx) / 0.07, 0, 1)
        f = np.minimum(vf, np.maximum(hf, np.clip((start - 0.1 - yy) / 0.1, 0, 1)))
        return f * f * (3 - 2 * f)
    for fr, fc in frames.items():
        a = load(fc["cut"])
        if fr == "fallen":
            fb = bbox(a)
            sf = hcm * PXCM / (fb[2] - fb[0] + 1) * fc.get("length_frac", 1.0)
            cx = (fb[0] + fb[2]) / 2
            canvas, (kx, ky, px, py) = place(a, sf, cx, fb[3], 1024, 512, 512, 504)
            canvas.save(os.path.join(outdir, f"{name}-{fr}.png"))
            mp = lambda p: [(p[0] * kx + px) / 1024, (p[1] * ky + py) / 512]
            result["frames"][fr] = {"body": f"{name}-{fr}.png", "canvas": [1024, 512], "registration": [0, 0],
                                    "anchors_src": fc.get("anchors", {}), "map": [kx, ky, px, py]}
            continue
        if fr == REF:
            dx = dy = 0; err = 0
        else:
            reg = fc.get("register", "head")
            if reg == "none":
                dx = dy = 0; err = 0
            elif reg == "feet":
                bb = bbox(a); dx = int(round(fx - feet_x(a))); dy = int(y1 - bb[3]); err = 0
            else:
                dx, dy, err = register(ref, a, head_region if reg == "head" else legs_region)
            dx += fc.get("nudge", [0, 0])[0]; dy += fc.get("nudge", [0, 0])[1]
        a_al = shift(a, dx, dy) if (dx or dy) else a
        own_body = fc.get("body", "own") == "own"
        cwf = fc.get("canvas_w", CW)
        canvas, (kx, ky, px, py) = place(a_al, s, fx, y1, cwf, CH, cwf / 2, BASE)
        if own_body:
            canvas.save(os.path.join(outdir, f"{name}-{fr}.png"))
        # head layer from full-res registered source
        fy0 = hy0 + fc.get("head_dy", 0); fx0 = hx0 + fc.get("head_dx", 0)
        if "head_center" in fc:  # raw-frame coords of the face centre
            fx0 = int(round(fc["head_center"][0] + dx - S / 2)); fy0 = int(round(fc["head_center"][1] + dy - S * 0.42))
        crop = to_img(a_al).crop((fx0, fy0, fx0 + S, fy0 + S))
        hl = resize_premul(crop, (HEAD, HEAD)).filter(ImageFilter.UnsharpMask(radius=1.2, percent=60, threshold=2))
        h = np.asarray(hl).astype(np.float32)
        h[..., 3] *= make_feather(fc.get('feather_start', 0.72))
        to_img(h).save(os.path.join(outdir, f"{name}-{fr}-head.png"))
        rect = [(fx0 * kx + px) / cwf, (fy0 * ky + py) / CH, S * kx / cwf, S * ky / CH]
        result["frames"][fr] = {"body": f"{name}-{fr}.png" if own_body else f"{name}-{fc['body']}.png",
                                "head": f"{name}-{fr}-head.png", "headLayerRect": [round(v, 5) for v in rect],
                                "registration": [int(dx), int(dy)], "reg_err": round(err, 1), "canvas": [cwf, CH],
                                "anchors_src": fc.get("anchors", {}), "map": [kx, ky, px + dx * kx, py + dy * ky]}
        print(f"{name}-{fr}: reg=({dx},{dy}) err={err:.1f} body={'own' if own_body else fc['body']} rect={['%.4f' % v for v in rect]}")
    json.dump(result, open(os.path.join(ART, "out", f"geom_{name}.json"), "w"), indent=1)
    print(f"scale={s:.4f} feet_x={fx:.1f} head_crop=({hx0},{hy0},{S})")

if __name__ == "__main__":
    main(sys.argv[1])
