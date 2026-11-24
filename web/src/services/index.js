import { createLocalServer } from './localServer.js';

export const BACKEND = import.meta.env.VITE_BACKEND === 'firebase' ? 'firebase' : 'local';

export async function resolveThemeId(iso) {
  const q = new URLSearchParams(location.search).get('tema');
  if (q) return q; // vista previa de un tema: ?tema=ejemplo-festival
  if (BACKEND !== 'firebase') return 'default';
  const { fetchThemeId } = await import('./firebase.js');
  return fetchThemeId(iso);
}

export async function createServer(world) {
  if (BACKEND === 'firebase' && !new URLSearchParams(location.search).get('tema')) {
    try { const { createFirebaseServer } = await import('./firebase.js'); return await createFirebaseServer(world); }
    catch (e) { if (e.code === 'need-account') throw e; console.warn('Firebase no disponible, modo local', e); }
  }
  return createLocalServer(world);
}
