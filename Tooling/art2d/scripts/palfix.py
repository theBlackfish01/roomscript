"""Repair small-area colours lost by palette quantisation (e.g. a brass brooch).
usage: python palfix.py <orig_rgba.png> <quantised_from_sharp.png(colours=N-extra)> <out.png> [extra=24] [thresh=16]
Pixels whose quantised colour is far from the original are clustered into `extra` new palette
entries; those pixels are remapped to their nearest extra entry when it is closer.
"""
import sys
import numpy as np
from PIL import Image
from scipy.cluster.vq import kmeans2

orig_p, q_p, out_p = sys.argv[1:4]
extra = int(sys.argv[4]) if len(sys.argv) > 4 else 24
thresh = float(sys.argv[5]) if len(sys.argv) > 5 else 16
o = np.asarray(Image.open(orig_p).convert("RGBA")).astype(np.float32)
qi = Image.open(q_p)
assert qi.mode == "P", qi.mode
idx = np.asarray(qi).copy()
pal = np.array(qi.getpalette(rawmode="RGBA") if hasattr(qi, "getpalette") else qi.getpalette(), dtype=np.float32)
pal = pal.reshape(-1, 4) if pal.size % 4 == 0 and "transparency" not in qi.info else None
if pal is None:
    rgb = np.array(qi.getpalette(), np.float32).reshape(-1, 3)
    tr = qi.info.get("transparency", b"")
    a = np.full(len(rgb), 255, np.float32)
    if isinstance(tr, bytes):
        a[: len(tr)] = np.frombuffer(tr, np.uint8)
    elif isinstance(tr, int):
        a[tr] = 0
    pal = np.concatenate([rgb, a[:, None]], 1)
used = np.unique(idx)
remap = np.zeros(256, np.int32); remap[used] = np.arange(len(used))
idx = remap[idx]; pal = pal[used]; n_used = len(used)
# free slots: merge the closest pairs of opaque palette entries (count-weighted mean)
counts = np.bincount(idx.ravel(), minlength=n_used).astype(np.float64)
need = extra - (256 - n_used)
alive = list(range(n_used))
while need > 0:
    P = pal[alive]
    op = P[:, 3] >= 250
    D = ((P[:, None, :3] - P[None, :, :3]) ** 2).sum(-1)
    D[~op, :] = 1e9; D[:, ~op] = 1e9
    np.fill_diagonal(D, 1e9)
    i, j = np.unravel_index(D.argmin(), D.shape)
    a, b = alive[i], alive[j]
    w = counts[a] + counts[b]
    pal[a] = (pal[a] * counts[a] + pal[b] * counts[b]) / max(w, 1)
    counts[a] = w; counts[b] = 0
    idx[idx == b] = a
    alive.remove(b); need -= 1
used = np.unique(idx)
remap = np.zeros(256, np.int32); remap[used] = np.arange(len(used))
idx = remap[idx]; pal = pal[used]; n_used = len(used)
extra = min(extra, 256 - n_used)
qcol = pal[idx]
from scipy import ndimage as ndi
blur = lambda a: np.stack([ndi.gaussian_filter(a[..., c], 1.5) for c in range(3)], -1)
err = np.sqrt(((qcol[..., :3] - o[..., :3]) ** 2).sum(-1))
berr = np.sqrt(((blur(qcol) - blur(o)) ** 2).sum(-1))
sel = (o[..., 3] > 200) & (berr > thresh)
nsel = int(sel.sum())
if nsel > extra * 4 and extra >= 4:
    X = o[sel][:, :3]
    cent, _ = kmeans2(X, extra, minit="++", seed=7)
    d_extra = ((X[:, None, :] - cent[None]) ** 2).sum(-1)
    best = d_extra.argmin(1)
    better = np.ones(len(X), bool)
    new_idx = idx[sel]
    new_idx[better] = n_used + best[better]
    idx[sel] = new_idx
    pal = np.concatenate([pal, np.concatenate([cent, np.full((extra, 1), 255)], 1)], 0)
im = Image.fromarray(idx.astype(np.uint8), "P")
pal8 = pal.round().clip(0, 255).astype(np.uint8)
im.putpalette(pal8[:, :3].ravel().tolist())
im.info["transparency"] = bytes(pal8[:, 3].tolist())
im.save(out_p, optimize=True, transparency=bytes(pal8[:, 3].tolist()))
print(f"{out_p} used={n_used} fixed={nsel} pal={len(pal8)}")
