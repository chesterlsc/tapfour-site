# Opening plate: the supplied 4K render (black Review stand, dark studio) extended to 16:9 at 3840×2160.
# The sides are grown from the render's own edge colours with a long feather and film grain, so the push-in never
# reveals a seam. Writes public/art/plate-open.jpg and the stand-face corners (for the light sweep) as JSON.
import json, numpy as np
from PIL import Image, ImageFilter
src = Image.open('public/art/render-black-review-dark.png').convert('RGB')
S, CX, CY, PX, PY = 0.64, 1200, 1700, 2250, 1020
W, H = 3840, 2160
sw, sh = int(src.width * S), int(src.height * S)
im = np.asarray(src.resize((sw, sh), Image.LANCZOS)).astype(np.float32)
x0, y0 = int(PX - CX * S), int(PY - CY * S)
plate = np.zeros((H, W, 3), np.float32)
# vertical profile from the render edges (rows mapped into the plate)
ys = np.clip(np.arange(H) - y0, 0, sh - 1)
left = im[ys, :12].mean(1); right = im[ys, -12:].mean(1)
xs = np.arange(W)[None, :, None]
t = np.clip((xs - x0) / sw, 0, 1)
plate[:] = left[:, None] * (1 - t) + right[:, None] * t
# darken the far sides gently (studio falloff)
d = np.clip(np.abs(xs - PX) / (W * 0.62), 0, 1)
plate *= (1 - 0.45 * d ** 1.6)
# place the render with a wide feather on its left/right edges
F = 260
mask = np.ones((sh, sw, 1), np.float32)
ramp = np.linspace(0, 1, F)[None, :, None]
mask[:, :F] *= ramp; mask[:, -F:] *= ramp[:, ::-1]
ya, yb = max(0, y0), min(H, y0 + sh)
reg = plate[ya:yb, x0:x0 + sw]
reg[:] = reg * (1 - mask[ya - y0:yb - y0]) + im[ya - y0:yb - y0] * mask[ya - y0:yb - y0]
rng = np.random.default_rng(3)
plate += rng.normal(0, 1.1, plate.shape)
Image.fromarray(np.clip(plate, 0, 255).astype(np.uint8)).save('public/art/plate-open.jpg', quality=95)
corners = [(740, 800), (1640, 760), (1696, 2410), (830, 2600)]
json.dump({'w': W, 'h': H, 'face': [[x * S + x0, y * S + y0] for x, y in corners]}, open('public/art/plate-open.json', 'w'))
print('plate', x0, y0, sw, sh)
