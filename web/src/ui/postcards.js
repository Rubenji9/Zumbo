// Postales: vistas del mundo renderizadas fuera de pantalla con escala y norte.
import { fmtMeters, niceScale } from './dom.js';
export const PW = 480, PH = 300;

export function makePostcard(renderer, p) {
  const c = renderer.snapshot({ x: p.x, y: p.y, z: (PW * 400000) / p.w }, PW, PH, { clouds: 0, showTarget: true });
  const x = c.getContext('2d'), mpp = p.w / PW, nice = niceScale(mpp, 90), L = nice / mpp;
  x.fillStyle = 'rgba(10,14,22,.62)'; x.fillRect(10, PH - 34, L + 86, 24);
  x.strokeStyle = '#fff'; x.lineWidth = 2; x.beginPath(); x.moveTo(18, PH - 26); x.lineTo(18, PH - 18); x.lineTo(18 + L, PH - 18); x.lineTo(18 + L, PH - 26); x.stroke();
  x.fillStyle = '#fff'; x.font = '700 13px Manrope,sans-serif'; x.fillText(fmtMeters(nice), 26 + L, PH - 17);
  x.fillStyle = 'rgba(10,14,22,.62)'; x.beginPath(); x.arc(PW - 24, 24, 14, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#fff'; x.font = '800 12px Manrope,sans-serif'; x.textAlign = 'center'; x.fillText('N', PW - 24, 29);
  return c;
}
