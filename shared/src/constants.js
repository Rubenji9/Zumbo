// Escala del mundo: el cuadrado [0,1]x[0,1] mide WORLD_METERS de lado.
export const WORLD_METERS = 400000;
// Número de octavas de ruido (la última llega a ~1 cm por celda).
export const OCTAVES = 26;
// Frecuencia (celdas por unidad de mundo) de cada octava.
export const FREQ = Array.from({ length: OCTAVES }, (_, i) => 3 * 2 ** i);
// Desplazamiento para que todas las coordenadas de la rejilla sean positivas.
export const LATTICE_OFFSET = 8;
// Octava de la rejilla de drones (~260 m por celda) y probabilidad (de 256) de que haya uno.
export const DRONE_OCTAVE = 9;
export const DRONE_DENSITY = 115;
// Reglas de puntuación.
export const PENALTY_DECOY_MS = 5000;
export const PENALTY_HINT_MS = 20000;
export const MAX_HINTS = 2;
// Radio mínimo en píxeles para que un toque sobre un dron cuente.
export const MIN_DRONE_PX = 4;
// Primer día oficial del juego (Zumbo #1).
export const EPOCH_ISO = '2026-11-24';
export const TIME_ZONE = 'Europe/Madrid';
