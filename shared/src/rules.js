// Reglas del juego. El servidor las usa para decidir cada toque; el cliente, en modo local.
import { WORLD_METERS as WM, PENALTY_DECOY_MS, PENALTY_HINT_MS, MIN_BALLOON_PX } from './constants.js';
import { balloonAt, balloonCell } from './world.js';

/**
 * Juzga un toque en (x, y) del mundo con una escala de `mpp` metros por píxel.
 * Devuelve { kind: 'target' | 'decoy' | 'tooSmall' | 'none', balloon? }.
 */
export function judgeTap(world, x, y, mpp) {
  const tol = 8 * mpp, t = world.target;
  if (Math.hypot(x - t.x, y - t.y) * WM < t.r * 1.25 + tol) return t.r / mpp < MIN_BALLOON_PX ? { kind: 'tooSmall' } : { kind: 'target', balloon: t };
  const [cx, cy] = balloonCell(x, y), [tx, ty] = world.targetCell;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const X = cx + i, Y = cy + j;
    if (X === tx && Y === ty) continue;
    const b = balloonAt(world.seed, X, Y);
    if (b && Math.hypot(x - b.x, y - b.y) * WM < b.r * 1.25 + tol) return b.r / mpp < MIN_BALLOON_PX ? { kind: 'tooSmall' } : { kind: 'decoy', balloon: b };
  }
  return { kind: 'none' };
}

/** Tiempo final con penalizaciones. */
export const finalTime = (elapsedMs, fails, hints) => elapsedMs + fails * PENALTY_DECOY_MS + hints * PENALTY_HINT_MS;

/** Limpia el alias que verá todo el mundo en el ranking. */
export function cleanAlias(s) {
  return String(s || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 18) || 'Anónimo';
}
