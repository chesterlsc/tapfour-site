// Plate lengths (seconds) — must match each plate's exported `duration` (checked by build.mjs).
export const PLATE_LEN = { open: 12.2, tap: 3.9, screen: 5.6, details: 9.2, connect: 5.4, scan: 6.0, sync: 9.0, dash: 7.4, links: 5.6, duo: 7.0, finale: 9.5 };

// An edit's segments: [plate, from?, to?]. Returns [{ plate, from, to, start, len }] on the edit's timeline.
export function layout(segments) {
  let t = 0;
  return segments.map(([plate, from = 0, to, id]) => {
    const end = to ?? PLATE_LEN[plate], len = +(end - from).toFixed(3), s = { plate, id: id || plate, from, to: end, start: +t.toFixed(3), len };
    t += len; return s;
  });
}
export const total = segs => segs.reduce((a, s) => a + s.len, 0);

// Cue times are written relative to a plate's own clock ({ at: 'tap', t: 2.1 }); convert to edit time.
// If a segment is trimmed (from > 0), plate-clock times still line up with the picture.
export function resolveCues(cues, segs) {
  return cues.map(c => {
    const s = segs.find(x => x.id === c.at);
    if (!s) throw new Error(`cue for missing segment ${c.at}`);
    const off = s.start - s.from;
    return { ...c, t: +(c.t + off).toFixed(3), out: c.out === undefined ? s.start + s.len : +(c.out + off).toFixed(3) };
  });
}
