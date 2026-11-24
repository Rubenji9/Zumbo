// Temas visuales. "default" es Zumbo; el resto son mundos patrocinados.
// Para añadir uno: copia el ejemplo, cambia id/colores y prográmalo en Firestore
// (colección "schedule", documento con la fecha, campo themeId). Ver docs/PATROCINIOS.md.
//
// target: cómo es Zum ese día.
//   body  color del cuerpo        pupil  color de la pupila
//   led   color de la luz         decoyPupil  pupila de los impostores «casi iguales»
export const DEFAULT_THEME = {
  id: 'default',
  name: 'Zumbo',
  sponsor: null,
  target: { label: 'Zum · dron rosa, ojo con pupila rosa', body: '#ff3d8b', pupil: '#ff3d8b', led: '#ffd23f', decoyPupil: '#2961db' },
  world: { landTint: [1, 1, 1], waterTint: [1, 1, 1], townDensity: 0.14, cloudCover: 0.05 },
};

export const THEMES = {
  default: DEFAULT_THEME,
  'ejemplo-festival': {
    id: 'ejemplo-festival',
    name: 'Isla Festival',
    sponsor: { name: 'Marca de ejemplo', url: 'https://example.com', message: 'Mundo patrocinado de ejemplo' },
    target: { label: 'Zum · dron naranja, pupila negra', body: '#ff7a1a', pupil: '#1b1b1f', led: '#ffd23f', decoyPupil: '#2961db' },
    world: { landTint: [1.05, 0.98, 0.9], waterTint: [0.95, 1.0, 1.05], townDensity: 0.22, cloudCover: 0.15 },
  },
};

export function getTheme(id) {
  const t = THEMES[id] || DEFAULT_THEME;
  return { ...DEFAULT_THEME, ...t, target: { ...DEFAULT_THEME.target, ...t.target }, world: { ...DEFAULT_THEME.world, ...t.world } };
}

export const hexToRgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; };
