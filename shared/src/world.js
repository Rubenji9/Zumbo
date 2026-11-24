// Descripción determinista del mundo de un día: relieve, globos, objetivo y postales.
// La usan el navegador (para pintar y jugar) y el servidor (para validar).
import { WORLD_METERS as WM, FREQ, LATTICE_OFFSET, BALLOON_OCTAVE } from './constants.js';
import { hsh, octaveNoise, smoothstep } from './noise.js';
import { rng, worldSeed, dayNumber } from './seed.js';
import { getTheme } from './themes.js';

/** Elevación en metros (negativa = mar). Igual que terrain() del shader, con menos octavas. */
export function elevation(seed, x, y, maxOctaves = 14) {
  const n = (i, salt, ox, oy) => octaveNoise(seed, i, x, y, salt, ox, oy);
  const wx = 0.045 * n(1, 90)[0] + 0.02 * n(2, 92)[0];
  const wy = 0.045 * n(1, 91)[0] + 0.02 * n(2, 93)[0];
  const M = 0.12 + 1.1 * smoothstep(0, 0.4, n(1, 70)[0]);
  let h = 0, dsx = 0, dsy = 0;
  for (let i = 0; i < maxOctaves; i++) {
    const v = i < 5 ? n(i, i, wx, wy) : n(i, i);
    let A;
    if (i < 3) A = [1100, 650, 380][i];
    else {
      A = (20000 / 2 ** i) * M / (1 + 0.25 * (dsx * dsx + dsy * dsy));
      if (i > 10) A *= 0.6 ** (i - 10);
      dsx += v[1]; dsy += v[2];
    }
    h += A * v[0];
  }
  const px = x - 0.5, py = y - 0.5, dc = Math.hypot(px, py * 1.15);
  return h + 520 - 6500 * Math.max(0, dc - 0.2);
}

/** Variante de globo señuelo a partir de su hash (0 = el bueno, nunca sale aquí). */
export function variant(h) {
  const m = h % 20;
  if (m < 3) return 1; if (m < 5) return 2; if (m < 7) return 3; if (m < 8) return 4;
  return 5 + (Math.floor(h / 20) % 9);
}

/** Globo señuelo de la celda (cx, cy) de la rejilla de globos, o null. */
export function balloonAt(seed, cx, cy) {
  const b0 = hsh(cx, cy, (seed + 500) >>> 0);
  if ((b0 & 255) >= 77) return null;
  const b1 = hsh(cx, cy, (seed + 501) >>> 0), b2 = hsh(cx, cy, (seed + 502) >>> 0), f = FREQ[BALLOON_OCTAVE];
  return {
    key: cx + ':' + cy,
    x: (cx + ((b1 & 1023) / 1023) * 0.8 + 0.1) / f - LATTICE_OFFSET,
    y: (cy + (((b1 >>> 10) & 1023) / 1023) * 0.8 + 0.1) / f - LATTICE_OFFSET,
    r: 9 + (4 * ((b2 >>> 8) & 255)) / 255,
    alt: 40 + (130 * ((b2 >>> 16) & 255)) / 255,
    variant: variant(b2),
  };
}

export const balloonCell = (x, y) => [Math.floor((x + LATTICE_OFFSET) * FREQ[BALLOON_OCTAVE]), Math.floor((y + LATTICE_OFFSET) * FREQ[BALLOON_OCTAVE])];

const ZONES = ['este', 'noreste', 'norte', 'noroeste', 'oeste', 'suroeste', 'sur', 'sureste'];
export function zoneName(x, y) {
  const dx = x - 0.5, dy = y - 0.5;
  if (Math.hypot(dx, dy) < 0.06) return 'el centro de la isla';
  const a = ((Math.atan2(-dy, dx) * 180) / Math.PI + 360) % 360;
  return 'el ' + ZONES[Math.round(a / 45) % 8] + ' de la isla';
}

/** Crea el mundo del día. */
export function createWorld(iso, theme = getTheme('default')) {
  const seed = worldSeed(iso, theme.id);
  const R = rng(seed ^ 0xba11);
  let target = null;
  for (let t = 0; t < 6000 && !target; t++) {
    const x = 0.28 + R() * 0.44, y = 0.28 + R() * 0.44, e = elevation(seed, x, y);
    if (e > 12 && e < 420) {
      const e2 = elevation(seed, x + 1e-4, y), e3 = elevation(seed, x, y + 1e-4);
      if (Math.abs(e2 - e) < 25 && Math.abs(e3 - e) < 25) target = { x, y, r: 11, alt: 95 };
    }
  }
  if (!target) target = { x: 0.5, y: 0.5, r: 11, alt: 95 };
  const postcards = [
    { w: 45000, x: target.x + ((R() - 0.5) * 0.5 * 45000) / WM, y: target.y + ((R() - 0.5) * 0.36 * 45000) / WM },
    { w: 3200, x: target.x + ((R() - 0.5) * 0.5 * 3200) / WM, y: target.y + ((R() - 0.5) * 0.36 * 3200) / WM },
  ];
  return { iso, day: dayNumber(iso), seed, theme, target, targetCell: balloonCell(target.x, target.y), postcards, zone: zoneName(target.x, target.y) };
}
