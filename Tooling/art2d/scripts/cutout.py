"""Flat-grey background cutout with decontaminated edges.
usage: python cutout.py in.png out.png [--hole-area 120]
- background model: per-row/col smooth fit of border colour (handles slight gradient)
- flood fill from the border through background-like pixels; enclosed holes kept as bg only if
  they are large and very close to the background colour
- soft alpha from colour distance in a band, edge colour decontaminated, 1 px soft erosion
"""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

def bg_model(img):
    h, w, _ = img.shape
    b = 6
    # fit a bilinear-ish plane per channel to border pixels
    ys, xs = np.mgrid[0:h, 0:w]
    mask = np.zeros((h, w), bool)
    mask[:b] = mask[-b:] = True
    mask[:, :b] = mask[:, -b:] = True
    A = np.stack([np.ones(mask.sum()), xs[mask] / w, ys[mask] / h, (xs[mask] / w) * (ys[mask] / h)], 1)
    full = np.stack([np.ones(h * w), xs.ravel() / w, ys.ravel() / h, (xs.ravel() / w) * (ys.ravel() / h)], 1)
    out = np.zeros_like(img)
    for c in range(3):
        coef, *_ = np.linalg.lstsq(A, img[..., c][mask], rcond=None)
        out[..., c] = (full @ coef).reshape(h, w)
    resid = np.sqrt(((img[mask] - out[mask]) ** 2).sum(1))
    return out, float(np.percentile(resid, 99))

def cut(path_in, path_out, hole_area=120, tlo=None, shadow_x0=None, shadow_y0=None):
    im = np.asarray(Image.open(path_in).convert("RGB")).astype(np.float32)
    B, noise = bg_model(im)
    d = np.sqrt(((im - B) ** 2).sum(2))
    d = ndi.gaussian_filter(d, 0.6)
    t_lo = max(6.0, noise * 1.3) if tlo is None else tlo
    t_hi = t_lo + 26.0
    bgish = d < t_lo + 6
    if shadow_x0 is not None or shadow_y0 is not None:  # neutral-grey cast shadow (low chroma, darker than bg) counts as background right of x0
        chroma = im.max(2) - im.min(2)
        lum = im.mean(2); blum = B.mean(2)
        sh = (chroma < 18) & (lum < blum + 4) & (lum > blum - 130)
        if shadow_x0 is not None: sh[:, :shadow_x0] = False
        if shadow_y0 is not None: sh[:shadow_y0, :] = False
        bgish |= ndi.binary_opening(sh, iterations=1)
    lab, n = ndi.label(bgish)
    h, w = d.shape
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(border))
    # enclosed holes: large and very flat background colour
    sizes = ndi.sum(np.ones_like(d), lab, index=np.arange(1, n + 1))
    means = ndi.mean(d, lab, index=np.arange(1, n + 1))
    holes = [i + 1 for i in range(n) if (i + 1) not in border and sizes[i] >= hole_area and means[i] < t_lo * 0.75]
    if holes:
        bg |= np.isin(lab, holes)
    fg = ~bg
    fg = ndi.binary_fill_holes(fg) & ~np.isin(lab, holes) if holes else ndi.binary_fill_holes(fg)
    # keep the largest components (drop specks)
    fl, fn = ndi.label(fg)
    if fn > 1:
        s = ndi.sum(np.ones_like(d), fl, index=np.arange(1, fn + 1))
        keep = [i + 1 for i in range(fn) if s[i] >= max(400, s.max() * 0.002)]
        fg = np.isin(fl, keep)
    # soft alpha in a 2px band around the boundary
    inner = ndi.binary_erosion(fg, iterations=2)
    band = fg & ~inner | (ndi.binary_dilation(fg, iterations=1) & ~fg)
    soft = np.clip((d - t_lo) / (t_hi - t_lo), 0, 1)
    alpha = fg.astype(np.float32)
    alpha[band] = soft[band]
    alpha[inner] = 1.0
    # 1px soft erosion: average with a min-filtered copy
    er = ndi.grey_erosion(alpha, size=(3, 3))
    alpha = 0.2 * alpha + 0.8 * er
    alpha = ndi.gaussian_filter(alpha, 0.35)
    alpha[inner] = 1.0
    alpha[~ndi.binary_dilation(fg, iterations=2)] = 0
    # decontaminate edge colour: F = (C - (1-a)B)/a
    a = np.clip(alpha, 1e-3, 1)[..., None]
    F = (im - (1 - a) * B) / a
    F = np.where(alpha[..., None] > 0.98, im, np.clip(F, 0, 255))
    # colour bleed: partial-alpha pixels take the colour of the nearest solid pixel (the ink line)
    solid = alpha >= 0.92
    _, (iy, ix) = ndi.distance_transform_edt(~solid, return_indices=True)
    edge = (alpha > 0) & ~solid
    F[edge] = im[iy[edge], ix[edge]]
    rgba = np.dstack([F, alpha * 255]).round().clip(0, 255).astype(np.uint8)
    Image.fromarray(rgba, "RGBA").save(path_out)
    ys, xs = np.nonzero(alpha > 0.5)
    print(f"{path_out} noise={noise:.1f} t_lo={t_lo:.1f} holes={len(holes)} bbox={xs.min()},{ys.min()},{xs.max()},{ys.max()}")

if __name__ == "__main__":
    args = sys.argv[1:]
    ha = 120; tlo = None
    if "--hole-area" in args:
        i = args.index("--hole-area"); ha = int(args[i + 1]); del args[i:i + 2]
    sx = None; sy = None
    if "--shadow-y0" in args:
        i = args.index("--shadow-y0"); sy = int(args[i + 1]); del args[i:i + 2]
    if "--shadow-x0" in args:
        i = args.index("--shadow-x0"); sx = int(args[i + 1]); del args[i:i + 2]
    if "--tlo" in args:
        i = args.index("--tlo"); tlo = float(args[i + 1]); del args[i:i + 2]
    for k in range(0, len(args), 2):
        cut(args[k], args[k + 1], ha, tlo, sx, sy)
