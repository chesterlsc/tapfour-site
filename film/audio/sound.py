#!/usr/bin/env python3
"""Original sound design + music bed for the Tapfour Connect film, all synthesized here (no samples, no licensed music).

Cues come from src/timeline.ts (read through Node's type stripping), so the audio stays locked to the edit.
Writes public/audio/tapfour-connect.wav (48 kHz, 24-bit stereo) — the film's soundtrack and the separate audio stem.
"""
import json, subprocess, wave, os
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SR = 48000
tl = json.loads(subprocess.check_output(['node', '--experimental-strip-types', '--no-warnings', '-e',
    "import('./src/timeline.ts').then(m=>console.log(JSON.stringify({SHOTS:m.SHOTS,BEATS:m.BEATS,FILM:m.FILM_SECONDS})))"], cwd=ROOT))
DUR = tl['FILM'] + 2.0
N = int(DUR * SR)
T0 = {s['id']: s['start'] for s in tl['SHOTS']}
B = tl['BEATS']
rng = np.random.default_rng(7)

def env(n, a, d, curve=4.0):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) * curve / max(d, 1e-4))
    return e

def lp(x, fc):  # one-pole low-pass
    a = np.exp(-2 * np.pi * fc / SR); y = np.empty_like(x); s = 0.0
    for i in range(len(x)): s = (1 - a) * x[i] + a * s; y[i] = s
    return y

def lp_fast(x, fc, passes=2):  # vectorised-ish IIR via scipy-free trick: FFT brickwall with soft knee
    X = np.fft.rfft(x, axis=0); f = np.fft.rfftfreq(len(x), 1 / SR)
    g = 1 / (1 + (f / fc) ** (2 * passes))
    return np.fft.irfft(X * (g[:, None] if X.ndim > 1 else g), n=len(x), axis=0)

def hp_fast(x, fc, passes=2):
    X = np.fft.rfft(x, axis=0); f = np.fft.rfftfreq(len(x), 1 / SR)
    g = 1 - 1 / (1 + (f / fc) ** (2 * passes))
    return np.fft.irfft(X * (g[:, None] if X.ndim > 1 else g), n=len(x), axis=0)

def reverb(x, secs=2.4, mix=0.3, pre=0.02):
    n = int(secs * SR); t = np.arange(n) / SR
    ir = np.stack([rng.normal(0, 1, n), rng.normal(0, 1, n)], 1) * np.exp(-t * 6.9 / secs)[:, None]
    ir = lp_fast(ir, 5500); ir[: int(pre * SR)] = 0; ir /= np.sqrt((ir ** 2).sum(0))
    L = len(x) + n; F = 1 << int(np.ceil(np.log2(L)))
    wet = np.fft.irfft(np.fft.rfft(x, F, axis=0) * np.fft.rfft(ir, F, axis=0), F, axis=0)[: len(x)]
    return x * (1 - mix) + wet * mix * 0.6

mix = np.zeros((N, 2)); sfx = np.zeros((N, 2)); music = np.zeros((N, 2))

def put(buf, at, sig, gain=1.0, pan=0.0):
    i = int(at * SR)
    if sig.ndim == 1: sig = np.stack([sig * np.sqrt(0.5 - pan / 2), sig * np.sqrt(0.5 + pan / 2)], 1) * np.sqrt(2)
    j = min(N, i + len(sig)); buf[i:j] += sig[: j - i] * gain

def tone(f, dur, a=0.005, d=None, kind='sine', det=0.0):
    n = int(dur * SR); t = np.arange(n) / SR
    ph = 2 * np.pi * f * t
    if kind == 'sine': s = np.sin(ph)
    elif kind == 'tri': s = 2 / np.pi * np.arcsin(np.sin(ph))
    else: s = np.sin(ph) + 0.3 * np.sin(2 * ph) + 0.12 * np.sin(3 * ph)
    return s * env(n, a, d or dur)

# ---------------- sound effects ----------------
def nfc_tick():  # crisp contact click
    n = int(0.06 * SR); s = hp_fast(rng.normal(0, 1, n), 2500) * env(n, 0.0005, 0.012, 6)
    return s * 0.5 + tone(2400, 0.06, 0.0005, 0.03) * 0.35
def haptic():  # low, short, felt more than heard
    n = int(0.16 * SR); t = np.arange(n) / SR
    f = 70 - 25 * t / 0.16
    s = np.tanh(2.2 * np.sin(2 * np.pi * np.cumsum(f) / SR)) * env(n, 0.002, 0.07, 5)
    return s
def shimmer(base=1318.5):
    return sum(tone(base * r, 1.4, 0.01, 1.2) * g for r, g in [(1, 0.5), (1.5, 0.3), (2, 0.18), (3, 0.08)])
def blip(f, dur=0.12, g=1.0):
    return tone(f, dur, 0.002, dur * 0.6, 'tri') * g
def click(f=3200):
    n = int(0.03 * SR); return hp_fast(rng.normal(0, 1, n), f) * env(n, 0.0003, 0.008, 6) * 0.6
def chime(notes, gap=0.11, dur=1.2):
    out = np.zeros(int((dur + gap * len(notes)) * SR))
    for i, f in enumerate(notes):
        s = tone(f, dur, 0.004, dur * 0.8) * 0.6
        h = tone(f * 2, dur * 0.6, 0.004, dur * 0.3) * 0.15; s[:len(h)] += h
        k = int(i * gap * SR); out[k:k + len(s)] += s
    return out
def whoosh(dur=0.6, up=True):
    n = int(dur * SR); t = np.linspace(0, 1, n)
    s = rng.normal(0, 1, n)
    X = np.fft.rfft(s); f = np.fft.rfftfreq(n, 1 / SR)
    s = np.fft.irfft(X * np.exp(-((np.log(f + 1) - np.log(1800)) ** 2) / 1.2), n)
    shape = np.sin(np.pi * t) ** 2 * (t if up else 1 - t) ** 0.3
    return s / (np.abs(s).max() + 1e-9) * shape
def knock():  # stand landing on a wooden table
    n = int(0.25 * SR); t = np.arange(n) / SR
    body = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 28) + 0.5 * np.sin(2 * np.pi * 410 * t) * np.exp(-t * 45)
    tick = hp_fast(rng.normal(0, 1, n), 1800) * np.exp(-t * 180) * 0.4
    return body * 0.8 + tick

tap, scan, order, owner, setup, solo = (T0[k] for k in ['tap', 'scan', 'order', 'owner', 'setup', 'solo'])
Bt, Bs, Bo, Bw, Bu, Bl = B['tap'], B['scan'], B['order'], B['owner'], B['setup'], B['solo']
# 1 open: soft rising air into the lockup
put(sfx, 3.2, whoosh(0.9), 0.10); put(sfx, B['open']['lockup'], shimmer(880), 0.10)
# 2 reveal: bright chord hit is in the music; a light whoosh on the cut
put(sfx, T0['reveal'] - 0.35, whoosh(0.5), 0.12)
# 3 one tap
put(sfx, tap + Bt['contact'] - 0.35, whoosh(0.45), 0.08, 0.4)
put(sfx, tap + Bt['contact'], nfc_tick(), 0.55); put(sfx, tap + Bt['contact'], haptic(), 0.75)
put(sfx, tap + Bt['contact'] + 0.03, shimmer(), 0.16)
put(sfx, tap + Bt['banner'], blip(1760, 0.1), 0.10)
put(sfx, tap + Bt['browser'] - 0.1, click(), 0.3)
for i in range(5): put(sfx, tap + Bt['stars'] + i * Bt['starStep'], blip([1046.5, 1174.7, 1318.5, 1568, 1760][i], 0.16), 0.14)
put(sfx, tap + Bt['stars'] + 4 * Bt['starStep'] + 0.1, shimmer(2093), 0.07)
# 4 scan
put(sfx, scan + Bs['lock'], blip(1318.5, 0.08), 0.18); put(sfx, scan + Bs['lock'] + 0.09, blip(1975.5, 0.14), 0.18)
put(sfx, scan + Bs['tapPill'], click(), 0.3); put(sfx, scan + Bs['menuUp'], whoosh(0.5), 0.1)
put(sfx, scan + Bs['soldOut'], blip(880, 0.09), 0.12); put(sfx, scan + Bs['price'], blip(1174.7, 0.09), 0.12)
# 5 table ordering
for i, k in enumerate(['add1', 'add2', 'add3']): put(sfx, order + Bo[k], click(2600 + i * 300), 0.32); put(sfx, order + Bo[k] + 0.01, blip(1318.5 * (1.12 ** i), 0.07), 0.08)
put(sfx, order + Bo['place'], click(), 0.35); put(sfx, order + Bo['place'] + 0.05, whoosh(0.4), 0.10)
put(sfx, order + Bo['toast'], chime([1318.5, 1975.5, 2637]), 0.28)   # the order chime
put(sfx, order + Bo['open'] - 0.15, click(), 0.3)
put(sfx, order + Bo['accept'], click(), 0.35); put(sfx, order + Bo['accept'] + 0.04, chime([1568, 2349.3], 0.08, 0.8), 0.16)
put(sfx, order + Bo['preparing'], blip(1046.5, 0.12), 0.12)
# 6 owner app: count-up ticks, then the chart
t = owner + Bw['count']
for i in range(34):
    put(sfx, t, click(4200), 0.13 * (1 - i / 40)); t += 0.025 + i * 0.0025
put(sfx, owner + Bw['bars'], whoosh(1.1), 0.07)
# 7 done for you
put(sfx, setup + Bu['gbpAfter'], whoosh(0.8), 0.13); put(sfx, setup + Bu['cutWeb'] - 0.2, click(), 0.28)
put(sfx, setup + Bu['cutMenu'], whoosh(0.4), 0.08); put(sfx, setup + Bu['paste'] - 0.15, click(), 0.28)
put(sfx, setup + Bu['added'] - 0.25, click(), 0.28); put(sfx, setup + Bu['added'], chime([1568, 2093]), 0.16)
# 8 Solo: five stands land
for i, at in enumerate(Bl['land']): put(sfx, solo + at, knock(), 0.5, [-0.4, 0.1, -0.3, 0.2, 0.5][i]); put(sfx, solo + at + 0.01, shimmer(1318.5 * [1, 1.122, 1.26, 1.335, 1.498][i]), 0.05)
put(sfx, solo + Bl['card'], whoosh(0.6), 0.1)
# 9 end
put(sfx, T0['end'] + 0.3, shimmer(659.3), 0.12)

# ---------------- music bed: warm minimal synth, 100 BPM, D major ----------------
BPM = 100; beat = 60 / BPM; bar = beat * 4
def mtof(m): return 440 * 2 ** ((m - 69) / 12)
CH = [[50, 57, 62, 66, 69, 76], [47, 54, 62, 66, 69, 73], [43, 50, 59, 62, 66, 71], [45, 52, 57, 61, 64, 69]]  # Dmaj9 · Bm11 · Gmaj9 · A6/9
def pad(chord, dur, g=1.0):
    n = int(dur * SR); t = np.arange(n) / SR; out = np.zeros((n, 2))
    for m in chord:
        f = mtof(m)
        for side, dt in ((0, -0.08), (1, 0.08)):
            ff = f * 2 ** (dt / 12)
            s = 2 / np.pi * np.arcsin(np.sin(2 * np.pi * ff * t + side)) * 0.6 + np.sin(2 * np.pi * ff * t) * 0.4
            out[:, side] += s
    e = np.minimum(1, t / 1.2) * np.minimum(1, (dur - t) / 0.9).clip(0)
    return out * e[:, None] * g / len(chord)

def energy(t):  # arrangement: 0..1 by story beat
    pts = [(0, .15), (4, .3), (7, .55), (12, .5), (22, .6), (32, .72), (44, .85), (52, .5), (64, .7), (74, .85), (83, 1.0), (84.5, .45), (92, 0)]
    xs, ys = zip(*pts); return np.interp(t, xs, ys)

t_axis = np.arange(N) / SR
nbars = int(DUR / bar) + 1
for b in range(nbars):
    start = b * bar
    chord = CH[b % 4]
    put(music, start, pad(chord, bar + 0.9, 0.9), 1.0)
    bass = mtof(chord[0] - 12)
    for q in range(4):  # soft sub pulse
        at = start + q * beat
        if at < 7 or at > 88: continue
        put(music, at, tone(bass, beat * 0.9, 0.01, beat * 0.5) * 0.5, 1.0)
    # plucked arpeggio (8ths) once the story gets going
    for e8 in range(8):
        at = start + e8 * beat / 2
        if at < 12 or at > 86: continue
        m = chord[[2, 3, 4, 5, 4, 3, 4, 5][e8]] + 12
        put(music, at, tone(mtof(m), 0.35, 0.003, 0.18, 'tri') * 0.22, 1.0, [-0.3, 0.3][e8 % 2])
    # light hat / kick from the ordering scene
    for q in range(4):
        at = start + q * beat
        if 32 <= at < 52 or 74 <= at < 84:
            put(music, at, np.sin(2 * np.pi * 52 * np.arange(int(0.2 * SR)) / SR) * env(int(0.2 * SR), 0.002, 0.12, 6), 0.45)
            put(music, at + beat / 2, click(7000), 0.08, 0.2)
# final resolve chord on the end card
put(music, T0['end'] + 0.2, pad([38, 50, 57, 62, 66, 69, 76], 7.5, 1.2), 1.0)
music = lp_fast(music, 6500)
music *= energy(t_axis)[:, None]
music = reverb(music, 2.8, 0.35)
sfx = reverb(sfx, 1.4, 0.18)

mix = music * 0.55 + sfx * 1.0
# fade in/out, gentle limiter, normalise to −1 dBFS
fade = np.minimum(1, t_axis / 0.8) * np.clip((DUR - t_axis) / 2.2, 0, 1)
mix *= fade[:, None]
mix = np.tanh(mix * 1.6) / 1.6
mix /= np.abs(mix).max() / 0.89
mix = mix[: int(tl['FILM'] * SR)]
os.makedirs(os.path.join(ROOT, 'public/audio'), exist_ok=True)
pcm = (np.clip(mix, -1, 1) * (2 ** 23 - 1)).astype(np.int32)
b = np.zeros((len(pcm), 2, 3), np.uint8)
for k in range(3): b[:, :, k] = (pcm >> (8 * k)) & 0xFF
with wave.open(os.path.join(ROOT, 'public/audio/tapfour-connect.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(3); w.setframerate(SR); w.writeframes(b.tobytes())
print('wrote public/audio/tapfour-connect.wav', f'{len(mix) / SR:.1f}s')
