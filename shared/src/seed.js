import { EPOCH_ISO, TIME_ZONE } from './constants.js';

export function hashStr(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** PRNG determinista (mulberry32). */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fecha del juego (YYYY-MM-DD) en hora de Madrid. */
export function gameDay(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

/** Número de mundo: el 24-11-2026 es el #1. */
export function dayNumber(iso) {
  const t = (s) => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));
  return Math.round((t(iso) - t(EPOCH_ISO)) / 864e5) + 1;
}

/** Semilla del mundo de un día (y de un tema patrocinado, si lo hay). */
export function worldSeed(iso, themeId = 'default') {
  const base = themeId === 'default' ? 'otea-' + iso : 'otea-' + themeId + '-' + iso;
  return hashStr(base) & 0x3fffffff;
}

/** Segundos que faltan para el próximo mundo (medianoche de Madrid). */
export function secondsToNextWorld(date = new Date()) {
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(date);
  const g = (k) => +(p.find((x) => x.type === k) || { value: 0 }).value;
  return 86400 - (g('hour') * 3600 + g('minute') * 60 + g('second'));
}
