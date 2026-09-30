# The empty dark studio (public/art/plate-empty.jpg, 3840×2160) that every shot's stands and devices sit on, grown
# from the supplied renders' own background: edge colours, long feather, soft vignette and grain. The stands
# themselves are the renders, cut out in src/shots/kit.tsx.
import json, numpy as np
from PIL import Image

S, CX, CY = 0.64, 1200, 1700          # scale, stand centre in the render
W, H, PX, PY = 3840, 2160, 1920, 1020  # plate size, where the stand centre lands
x0, y0 = int(PX - CX * S), int(PY - CY * S)
rng = np.random.default_rng(3)

def plate(src, with_render=True):
    sw, sh = int(src.width * S), int(src.height * S)
    im = np.asarray(src.resize((sw, sh), Image.LANCZOS)).astype(np.float32)
    ys = np.clip(np.arange(H) - y0, 0, sh - 1)
    left, right = im[ys, :12].mean(1), im[ys, -12:].mean(1)
    xs = np.arange(W)[None, :, None]
    t = np.clip((xs - x0) / sw, 0, 1)
    out = left[:, None] * (1 - t) + right[:, None] * t
    out *= (1 - 0.45 * np.clip(np.abs(xs - PX) / (W * 0.62), 0, 1) ** 1.6)
    if with_render:
        F = 300; mask = np.ones((sh, sw, 1), np.float32); ramp = np.linspace(0, 1, F)[None, :, None]
        mask[:, :F] *= ramp; mask[:, -F:] *= ramp[:, ::-1]
        ya, yb = max(0, y0), min(H, y0 + sh)
        reg = out[ya:yb, x0:x0 + sw]; m = mask[ya - y0:yb - y0]
        reg[:] = reg * (1 - m) + im[ya - y0:yb - y0] * m
    out += rng.normal(0, 1.1, out.shape)
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))

plate(Image.open('public/art/r-black-review.jpg').convert('RGB'), False).save('public/art/plate-empty.jpg', quality=94)
print('plate-empty written')
