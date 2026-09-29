# Contact sheet for the storyboard: 3×3 frames, each labelled with its timecode and shot name.
import json, sys
from PIL import Image, ImageDraw, ImageFont
picks = json.loads(sys.argv[1])
W, H, G, L = 800, 450, 24, 56
sheet = Image.new('RGB', (3 * W + 4 * G, 3 * (H + L) + 3 * G + 90), '#0a0a0b')
d = ImageDraw.Draw(sheet)
try:
    from PIL import ImageFont as F
    big = F.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 34); small = F.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf', 22)
except Exception:
    big = small = ImageFont.load_default()
d.text((G, 28), 'Tapfour Connect — launch film storyboard (1080p frames)', fill='#f2f0eb', font=big)
for i, (sid, label, sec) in enumerate(picks):
    im = Image.open(f'out/frames/{sid}.png').convert('RGB').resize((W, H), Image.LANCZOS)
    x, y = G + (i % 3) * (W + G), 90 + (i // 3) * (H + L + G)
    sheet.paste(im, (x, y))
    tc = f'{int(sec // 60)}:{int(sec % 60):02d}.{int(round((sec % 1) * 30)):02d}'
    d.text((x, y + H + 14), f'{i + 1:02d}  {tc}', fill='#c8f23c', font=small)
    d.text((x + 230, y + H + 14), label.upper(), fill='#d6d4ce', font=small)
sheet.save('out/storyboard.png')
print('wrote out/storyboard.png')
