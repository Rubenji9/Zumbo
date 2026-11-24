// Gemelo exacto (en CPU) del hash y del ruido del shader. Si cambias algo aquí,
// cámbialo también en web/src/engine/world.frag.glsl o el mundo no coincidirá.
import { FREQ, LATTICE_OFFSET } from './constants.js';

const G16 = Array.from({ length: 16 }, (_, i) => [Math.cos((i * Math.PI) / 8), Math.sin((i * Math.PI) / 8)]);

/** Hash entero de 32 bits idéntico al `hsh` del shader. */
export function hsh(x, y, s) {
  let h = (Math.imul(x, 0x8da6b343) ^ Math.imul(y, 0xd8163841) ^ Math.imul(s, 0xcb1ab31f)) >>> 0;
  h ^= h >>> 16; h = Math.imul(h, 0x7feb352d);
  h ^= h >>> 15; h = Math.imul(h, 0x846ca68b);
  h ^= h >>> 16;
  return h >>> 0;
}

/** Ruido de gradiente con derivadas: [valor, d/dx, d/dy]. */
export function noise(cx, cy, fx, fy, s) {
  const ux = fx * fx * fx * (fx * (fx * 6 - 15) + 10), uy = fy * fy * fy * (fy * (fy * 6 - 15) + 10);
  const ga = G16[hsh(cx, cy, s) & 15], gb = G16[hsh(cx + 1, cy, s) & 15];
  const gc = G16[hsh(cx, cy + 1, s) & 15], gd = G16[hsh(cx + 1, cy + 1, s) & 15];
  const va = ga[0] * fx + ga[1] * fy, vb = gb[0] * (fx - 1) + gb[1] * fy;
  const vc = gc[0] * fx + gc[1] * (fy - 1), vd = gd[0] * (fx - 1) + gd[1] * (fy - 1);
  const k = va - vb - vc + vd;
  const dx = ga[0] + ux * (gb[0] - ga[0]) + uy * (gc[0] - ga[0]) + ux * uy * (ga[0] - gb[0] - gc[0] + gd[0]) + 30 * fx * fx * (fx * (fx - 2) + 1) * (uy * k + vb - va);
  const dy = ga[1] + ux * (gb[1] - ga[1]) + uy * (gc[1] - ga[1]) + ux * uy * (ga[1] - gb[1] - gc[1] + gd[1]) + 30 * fy * fy * (fy * (fy - 2) + 1) * (ux * k + vc - va);
  return [va + ux * (vb - va) + uy * (vc - va) + ux * uy * k, dx, dy];
}

/** Ruido de la octava `i` en el punto de mundo (x, y). */
export function octaveNoise(seed, i, x, y, salt, ox = 0, oy = 0) {
  const f = FREQ[i], qx = (x + LATTICE_OFFSET + ox) * f, qy = (y + LATTICE_OFFSET + oy) * f;
  const cx = Math.floor(qx), cy = Math.floor(qy);
  return noise(cx, cy, qx - cx, qy - cy, (seed + salt) >>> 0);
}

export const smoothstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
