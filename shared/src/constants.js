// Escala del mundo: el cuadrado [0,1]x[0,1] mide WORLD_METERS de lado.
export const WORLD_METERS = 400000;
// Número de octavas de ruido (la última llega a ~1 cm por celda).
export const OCTAVES = 26;
// Frecuencia (celdas por unidad de mundo) de cada octava.
export const FREQ = Array.from({ length: OCTAVES }, (_, i) => 3 * 2 ** i);
// Desplazamiento para que todas las coordenadas de la rejilla sean positivas.
export const LATTICE_OFFSET = 8;
// Octava de la rejilla de globos (~520 m por celda).
export const BALLOON_OCTAVE = 8;
// Reglas de puntuación.
export const PENALTY_DECOY_MS = 5000;
export const PENALTY_HINT_MS = 20000;
// Radio mínimo en píxeles para que un toque sobre un globo cuente.
export const MIN_BALLOON_PX = 4;
// Primer día oficial del juego (Mundo #1).
export const EPOCH_ISO = '2026-11-24';
export const TIME_ZONE = 'Europe/Madrid';
