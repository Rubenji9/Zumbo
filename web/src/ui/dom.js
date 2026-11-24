export const $ = (s) => document.querySelector(s);
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export function fmtTime(ms) { const s = Math.floor(ms / 1000); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
export function fmtMeters(m) {
  return m >= 1000 ? (m / 1000).toLocaleString('es-ES', { maximumFractionDigits: m >= 10000 ? 0 : 1 }) + ' km' : m >= 1 ? Math.round(m) + ' m' : Math.round(m * 100) + ' cm';
}
let toastT = 0;
export function toast(m) { const e = $('#toast'); e.textContent = m; e.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => e.classList.remove('on'), 2000); }
export function niceScale(mpp, px) { const tgt = mpp * px, p = 10 ** Math.floor(Math.log10(tgt)); return [1, 2, 5, 10].map((k) => k * p).filter((v) => v <= tgt).pop() || p; }
/** Coordenadas ficticias, para que el mapa se lea como un mapa real. */
export function fakeLatLon(x, y) { return [43.9 - y * 3.6, -2.4 + x * 4.85]; }
export function fmtLatLon(x, y, d = 5) { const [la, lo] = fakeLatLon(x, y); return la.toFixed(d).replace('.', ',') + '° N · ' + Math.abs(lo).toFixed(d).replace('.', ',') + '° ' + (lo < 0 ? 'O' : 'E'); }
