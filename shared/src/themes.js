// Temas visuales. "default" es Otea; el resto son mundos patrocinados.
// Para añadir uno: copia el ejemplo, cambia id/colores y prográmalo en Firestore
// (colección "schedule", documento con la fecha, campo themeId). Ver docs/PATROCINIOS.md.
export const DEFAULT_THEME = {
  id: 'default',
  name: 'Otea',
  sponsor: null,
  target: { label: 'Globo rosa · corona amarilla', c1: '#ff3d8b', c2: '#f4f4f4', crown: '#ffd23f', decoyCrown: '#2961db' },
  world: { landTint: [1, 1, 1], waterTint: [1, 1, 1], townDensity: 0.14, cloudCover: 0.05 },
};

export const THEMES = {
  default: DEFAULT_THEME,
  'ejemplo-festival': {
    id: 'ejemplo-festival',
    name: 'Isla Festival',
    sponsor: { name: 'Marca de ejemplo', url: 'https://example.com', message: 'Mundo patrocinado de ejemplo' },
    target: { label: 'Globo naranja · corona negra', c1: '#ff7a1a', c2: '#f4f4f4', crown: '#1b1b1f', decoyCrown: '#2961db' },
    world: { landTint: [1.05, 0.98, 0.9], waterTint: [0.95, 1.0, 1.05], townDensity: 0.22, cloudCover: 0.15 },
  },
};

export function getTheme(id) {
  const t = THEMES[id] || DEFAULT_THEME;
  return { ...DEFAULT_THEME, ...t, target: { ...DEFAULT_THEME.target, ...t.target }, world: { ...DEFAULT_THEME.world, ...t.world } };
}

export const hexToRgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; };
