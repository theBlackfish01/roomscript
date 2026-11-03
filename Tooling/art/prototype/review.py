# Review helper (not part of the pipeline): tiles portraits over a dark backdrop for quick inspection.
import sys, glob
from PIL import Image
files = sys.argv[2:]; out = sys.argv[1]
ims = [Image.open(f).convert("RGBA") for f in files]
w, h = ims[0].size; s = 0.6 if h > 1000 else 1
W, H = int(w*s), int(h*s)
sheet = Image.new("RGBA", (W*len(ims), H), (34, 30, 27, 255))
for i, im in enumerate(ims):
    sheet.alpha_composite(im.resize((W, H), Image.LANCZOS), (i*W, 0))
sheet.convert("RGB").save(out)
