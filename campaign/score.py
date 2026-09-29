"""Original score + sound design for the Tapfour films, synthesized from an edit's cue sheet.

    python3 score.py out/master.cues.json out/master.wav

Cue sheet (written by build.mjs): { duration, bpm, grid0, end, levels: [[t, level]], events: [{t, kind, ...}] }
Levels: 0 pad only · 1 + plucks · 2 + bass/kick · 3 + hats/rim · 4 full. Key of D major, 96 bpm by default.
"""
import json, sys
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
rng = np.random.default_rng(4)
mtof = lambda m: 440.0 * 2 ** ((m - 69) / 12)

CHORDS = {  # warm, open voicings
    'D':  [50, 57, 61, 64, 66],   # Dmaj9
    'Bm': [47, 54, 57, 61, 62],   # Bm9
    'G':  [43, 50, 54, 57, 59],   # Gmaj9
    'A':  [45, 52, 54, 59, 62],   # A13sus
}
PROG = ['D', 'Bm', 'G', 'A']


def lp(x, f, order=2):
    return sosfilt(butter(order, min(f, SR / 2 - 100), 'low', fs=SR, output='sos'), x, axis=0)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, 'high', fs=SR, output='sos'), x, axis=0)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], 'band', fs=SR, output='sos'), x, axis=0)


def env(n, a, r, hold=None):
    """attack a s, release r s at the end, flat between."""
    e = np.ones(n)
    na, nr = max(1, int(a * SR)), max(1, int(r * SR))
    e[:na] = np.linspace(0, 1, na) ** 1.5
    e[-nr:] *= np.linspace(1, 0, nr) ** 2
    return e


def add(buf, sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= len(buf) or i + len(sig) <= 0:
        return
    s = sig if sig.ndim == 2 else np.stack([sig, sig], 1)
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    s = s * np.array([l, r]) * np.sqrt(2)
    j0, j1 = max(0, i), min(len(buf), i + len(s))
    buf[j0:j1] += gain * s[j0 - i:j1 - i]


def saw(f, n, det=0.0):
    ph = (np.arange(n) * f * 2 ** (det / 1200) / SR + rng.random()) % 1.0
    return 2 * ph - 1


def pad_note(m, dur):
    n = int(dur * SR)
    x = sum(saw(mtof(m), n, d) for d in (-9, 0, 8)) / 3
    return x * env(n, 1.4, 1.8)


def pluck(m, dur=1.6, bright=1.0):
    n = int(dur * SR); t = np.arange(n) / SR; f = mtof(m)
    x = np.sin(2 * np.pi * f * t + 0.6 * bright * np.exp(-t * 9) * np.sin(2 * np.pi * f * 2 * t))
    x += 0.22 * np.sin(2 * np.pi * f * 3.01 * t) * np.exp(-t * 14)
    return x * np.exp(-t * 3.6) * np.minimum(1, t / 0.004)


def kick(v=1.0):
    n = int(0.45 * SR); t = np.arange(n) / SR
    f = 44 + 90 * np.exp(-t * 32)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7.5)
    x += 0.25 * hp(rng.standard_normal(n) * np.exp(-t * 180), 2000)
    return np.tanh(1.6 * x) * v


def hat(v=1.0, open_=False):
    n = int((0.22 if open_ else 0.06) * SR); t = np.arange(n) / SR
    return hp(rng.standard_normal(n), 7000, 4) * np.exp(-t * (14 if open_ else 70)) * v


def rim(v=1.0):
    n = int(0.12 * SR); t = np.arange(n) / SR
    x = bp(rng.standard_normal(n), 1400, 5200) * np.exp(-t * 55) + 0.5 * np.sin(2 * np.pi * 1850 * t) * np.exp(-t * 90)
    return x * v


def reverb_ir(sec=2.6):
    n = int(sec * SR); t = np.arange(n) / SR
    ir = rng.standard_normal((n, 2)) * np.exp(-t * 3.2)[:, None]
    ir = lp(ir, 5200)
    ir[: int(0.012 * SR)] *= 0.2
    return ir / np.abs(ir).sum(0) * 9


# ---------- sound design ----------
def sfx(kind, ev):
    t = lambda d: np.arange(int(d * SR)) / SR
    if kind == 'tick':       # UI tap
        x = t(0.05); return (np.sin(2 * np.pi * 2600 * x) * np.exp(-x * 160) + 0.4 * hp(rng.standard_normal(len(x)), 3000) * np.exp(-x * 300)) * 0.35
    if kind == 'tap':        # phone meets the stand: soft, physical
        x = t(0.3); body = np.sin(2 * np.pi * (150 + 60 * np.exp(-x * 60)) * x) * np.exp(-x * 26)
        return (body + 0.3 * bp(rng.standard_normal(len(x)), 800, 4000) * np.exp(-x * 120)) * 0.8
    if kind == 'nfc':        # read chime: two soft bells
        a = pluck(88, 1.4, 0.4); b = pluck(95, 1.4, 0.4)
        out = np.zeros(int(1.6 * SR)); out[:len(a)] += a; k = int(0.09 * SR); out[k:k + len(b)] += 0.8 * b[:len(out) - k]
        return out * 0.32
    if kind == 'whoosh':
        d = ev.get('dur', 0.6); x = t(d); n = rng.standard_normal(len(x))
        e = np.sin(np.pi * np.minimum(1, x / d)) ** 2
        lo = bp(n, 300, 1400) * e; hi = bp(n, 1500, 6000) * e * np.linspace(0.2, 1, len(x))
        return (lo * 0.5 + hi * 0.35) * 0.55
    if kind == 'swish':
        x = t(0.28); return bp(rng.standard_normal(len(x)), 2500, 9000) * np.sin(np.pi * x / 0.28) ** 2 * 0.18
    if kind == 'type':       # a few soft key clicks
        d = ev.get('dur', 1.0); out = np.zeros(int((d + 0.1) * SR)); k = 0.0
        while k < d:
            c = t(0.03); click = hp(rng.standard_normal(len(c)), 2500) * np.exp(-c * 250) * (0.5 + 0.5 * rng.random())
            i = int(k * SR); out[i:i + len(c)] += click[:len(out) - i]; k += 0.07 + 0.06 * rng.random()
        return out * 0.16
    if kind == 'star':
        return pluck(79 + 2 * ev.get('n', 0), 0.8, 0.3) * 0.14
    if kind == 'reload':
        x = t(0.09); f = 700 + 900 * x / 0.09; return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 30) * 0.12
    if kind == 'success':
        a = pluck(79, 1.2, 0.3); b = pluck(86, 1.2, 0.3)
        out = np.zeros(int(1.4 * SR)); out[:len(a)] += a; k = int(0.1 * SR); out[k:k + len(b)] += b[:len(out) - k]
        return out * 0.2
    if kind == 'focus':      # camera locks on the QR
        x = t(0.12); return np.sin(2 * np.pi * 1800 * x) * np.exp(-x * 50) * 0.08 + np.sin(2 * np.pi * 2400 * x) * np.exp(-x * 60) * 0.06
    if kind == 'impact':
        x = t(2.4); boom = np.sin(2 * np.pi * (38 + 40 * np.exp(-x * 6)) * x) * np.exp(-x * 2.2)
        return (boom * 0.9 + 0.3 * lp(rng.standard_normal(len(x)), 900) * np.exp(-x * 5)) * 0.7
    if kind == 'riser':
        d = ev.get('dur', 1.4); x = t(d); n = rng.standard_normal(len(x)); k = (x / d) ** 2
        out = np.zeros(len(x))
        for i, (lo, hi) in enumerate([(200, 800), (600, 2400), (1800, 7000)]):
            out += bp(n, lo, hi) * np.clip(k * 3 - i, 0, 1)
        return out * k * 0.22
    if kind == 'count':
        x = t(0.03); return np.sin(2 * np.pi * 3200 * x) * np.exp(-x * 200) * 0.05
    if kind == 'logo':
        out = np.zeros(int(3.2 * SR))
        for i, m in enumerate([74, 78, 81, 85]):
            p = pluck(m, 3.0, 0.25); k = int(i * 0.05 * SR); out[k:k + len(p)] += p[:len(out) - k] * (0.9 - i * 0.12)
        return out * 0.22
    raise ValueError(kind)


def render(cs):
    D = cs['duration'] + 0.5
    N = int(D * SR)
    bpm, g0, end = cs.get('bpm', 96), cs['grid0'], cs.get('end', cs['duration'])
    beat = 60 / bpm
    lv = sorted(cs['levels'])
    level = lambda t: max([l for (tt, l) in lv if tt <= t] or [0])
    music = np.zeros((N, 2)); verb_send = np.zeros((N, 2)); pads = [np.zeros((N, 2)) for _ in range(3)]
    duck = np.ones(N)

    def chord_at(t):
        if t < g0:  # before the reveal: suspended, then tension, resolving to D on the downbeat
            return 'Bm' if t < g0 - 2.4 else 'A'
        if t >= end:
            return 'D'
        return PROG[int((t - g0) // (beat * 8)) % 4]

    # pads: one voicing per chord span, three filter colours crossfaded by level
    spans, t, cur = [], 0.0, None
    step = 0.05
    while t < D:
        c = chord_at(t)
        if c != cur:
            spans.append([t, c]); cur = c
        t += step
    spans = [(a, (spans[i + 1][0] if i + 1 < len(spans) else D), c) for i, (a, c) in enumerate(spans)]
    for a, b, c in spans:
        dur = min(D - a, (b - a) + 1.8)
        for k, m in enumerate(CHORDS[c]):
            x = pad_note(m, dur) * (0.22 if k == 0 else 0.15)
            for j, f in enumerate((650, 1500, 3200)):
                add(pads[j], lp(x, f), a, pan=(k - 2) * 0.22)
    # level → filter colour (smoothed)
    tt = np.arange(N) / SR
    lvl = np.array([level(x) for x in np.arange(0, D, 0.01)])
    lvl = np.convolve(lvl, np.ones(120) / 120, mode='same')  # 1.2 s smoothing
    L = np.interp(tt, np.arange(len(lvl)) * 0.01, lvl)
    w0, w1, w2 = np.clip(1.5 - L, 0, 1), np.clip(1 - abs(L - 1.8), 0, 1), np.clip(L - 2.2, 0, 1)
    ws = w0 + w1 + w2 + 1e-6
    pad = (pads[0] * (w0 / ws)[:, None] + pads[1] * (w1 / ws)[:, None] + pads[2] * (w2 / ws)[:, None])
    pad = hp(pad, 140) * (0.8 + 0.12 * np.clip(L, 0, 4))[:, None]

    # grooves on the grid
    nbeats = int((min(end, D) - g0) / beat) + 1
    for i in range(nbeats):
        tb = g0 + i * beat
        if tb >= end:
            break
        l = level(tb); c = CHORDS[chord_at(tb + 0.01)]; bar_pos = i % 4
        if l >= 1:  # plucks: quarters at 1, eighths from 2
            subs = [0, 0.5] if l >= 2 else [0]
            for s in subs:
                idx = [0, 2, 4, 1, 3, 2, 4, 1][(i * 2 + int(s * 2)) % 8]
                m = c[idx] + 24 if idx else c[2] + 24
                add(music, pluck(m, 1.4, 0.7), tb + s * beat, gain=0.085 * (1.0 if s == 0 else 0.7), pan=0.3 if s else -0.25)
                add(verb_send, pluck(m, 1.4, 0.7), tb + s * beat, gain=0.05)
        if l >= 2:
            if bar_pos in (0, 2) or l >= 4:
                k = kick(0.85 if bar_pos in (0, 2) else 0.6); add(music, k, tb, gain=0.55)
                j = int(tb * SR); dk = 1 - 0.55 * np.exp(-np.arange(int(0.35 * SR)) / SR * 9)
                duck[j:j + len(dk)] = np.minimum(duck[j:j + len(dk)], dk[:max(0, N - j)])
            root = c[0] - 12 if c[0] > 40 else c[0]
            n = int(beat * 0.95 * SR); x = np.sin(2 * np.pi * mtof(root) * np.arange(n) / SR)
            add(music, np.tanh(1.8 * x) * env(n, 0.01, 0.12) * 0.16, tb)
        if l >= 3:
            add(music, hat(0.5), tb + beat / 2, gain=0.22, pan=0.35)
            if bar_pos in (1, 3):
                add(music, rim(0.5), tb, gain=0.22, pan=-0.1)
        if l >= 4:
            for s in (0.25, 0.75):
                add(music, hat(0.3), tb + s * beat, gain=0.16, pan=0.45)
    music[:, 0] *= duck; music[:, 1] *= duck
    pad *= duck[:, None] ** 0.7

    # sound design
    fx = np.zeros((N, 2))
    for ev in cs['events']:
        s = sfx(ev['kind'], ev)
        add(fx, s, ev['t'], gain=ev.get('gain', 1.0), pan=ev.get('pan', 0.0))
        if ev['kind'] in ('nfc', 'success', 'logo', 'impact', 'star'):
            add(verb_send, s, ev['t'], gain=0.4 * ev.get('gain', 1.0))

    ir = reverb_ir()
    wet = np.stack([fftconvolve(pad[:, 0] * 0.35 + verb_send[:, 0], ir[:, 0])[:N], fftconvolve(pad[:, 1] * 0.35 + verb_send[:, 1], ir[:, 1])[:N]], 1)
    mix = pad * 0.9 + music + wet * 0.55 + fx
    mix = hp(mix, 28)
    # fade in / out
    fi = int(0.25 * SR); mix[:fi] *= np.linspace(0, 1, fi)[:, None]
    fo = int(cs.get('fadeOut', 2.2) * SR); mix[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 1.5
    mix = np.tanh(mix * 1.1) / np.tanh(1.1)
    mix *= 0.89 / (np.abs(mix).max() + 1e-9)  # ≈ -1 dBFS peak
    return mix[: int(cs['duration'] * SR)]


if __name__ == '__main__':
    import wave
    cs = json.load(open(sys.argv[1]))
    y = render(cs)
    pcm = (np.clip(y, -1, 1) * 32767).astype('<i2')
    with wave.open(sys.argv[2], 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
    print(sys.argv[2], f'{len(y) / SR:.2f}s')
