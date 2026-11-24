// Cámara: posición en el mundo [0,1]², zoom en px CSS por unidad de mundo,
// animaciones y entrada (ratón, rueda, pellizco, teclado).
import { WORLD_METERS as WM } from '@zumbo/shared';

export const MAX_ZOOM = WM / 0.01; // 1 cm por píxel

export function createCamera() {
  const cam = { x: 0.5, y: 0.5, z: 800, fit: 800, W: innerWidth, H: innerHeight, dirty: true, tween: null };
  cam.clampZ = (z) => Math.min(MAX_ZOOM, Math.max(cam.fit * 0.8, z));
  cam.clamp = () => { cam.x = Math.min(0.95, Math.max(0.05, cam.x)); cam.y = Math.min(0.95, Math.max(0.05, cam.y)); };
  cam.mpp = () => WM / cam.z;
  cam.toWorld = (px, py) => [cam.x + (px - cam.W / 2) / cam.z, cam.y + (py - cam.H / 2) / cam.z];
  cam.toScreen = (x, y) => [(x - cam.x) * cam.z + cam.W / 2, (y - cam.y) * cam.z + cam.H / 2];
  cam.resize = () => {
    const first = !cam.sized;
    cam.W = innerWidth; cam.H = innerHeight;
    cam.fit = Math.max(260, Math.min(cam.W, cam.H) * 1.15);
    if (first) { cam.z = cam.fit; cam.sized = true; }
    cam.z = cam.clampZ(cam.z); cam.dirty = true;
  };
  cam.zoomAt = (px, py, f) => {
    const [wx, wy] = cam.toWorld(px, py);
    cam.z = cam.clampZ(cam.z * f);
    cam.x = wx - (px - cam.W / 2) / cam.z; cam.y = wy - (py - cam.H / 2) / cam.z;
    cam.clamp(); cam.dirty = true;
  };
  cam.flyTo = (x, y, z, ms = 900) => { cam.tween = { x0: cam.x, y0: cam.y, z0: cam.z, x1: x, y1: y, z1: cam.clampZ(z), t0: performance.now(), ms }; };
  cam.step = (t) => {
    const tw = cam.tween; if (!tw) return;
    const k = Math.min(1, (t - tw.t0) / tw.ms), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    const l0 = Math.log(tw.z0), l1 = Math.log(tw.z1);
    cam.z = Math.exp(l0 + (l1 - l0) * e);
    // Trayectoria "de cámara": el desplazamiento sigue a la escala, no al tiempo.
    const m = Math.abs(l1 - l0) < 0.01 ? e : Math.min(1, Math.max(0, (1 / tw.z0 - 1 / cam.z) / (1 / tw.z0 - 1 / tw.z1)));
    cam.x = tw.x0 + (tw.x1 - tw.x0) * m; cam.y = tw.y0 + (tw.y1 - tw.y0) * m;
    if (k >= 1) cam.tween = null;
    cam.dirty = true;
  };
  return cam;
}

/** Conecta la entrada del usuario. onTap(x, y) devuelve true si el toque se ha usado. */
export function bindInput(el, cam, { onTap, isBlocked }) {
  const P = new Map();
  let down = null, pinch = null, lastTap = 0;
  el.addEventListener('pointerdown', (e) => {
    try { el.setPointerCapture(e.pointerId); } catch {}
    P.set(e.pointerId, { x: e.clientX, y: e.clientY }); cam.tween = null;
    if (P.size === 1) down = { x: e.clientX, y: e.clientY, t: performance.now(), moved: false };
    if (P.size === 2) { const v = [...P.values()]; pinch = { d: Math.hypot(v[0].x - v[1].x, v[0].y - v[1].y), mx: (v[0].x + v[1].x) / 2, my: (v[0].y + v[1].y) / 2 }; if (down) down.moved = true; }
    el.classList.add('drag');
  });
  el.addEventListener('pointermove', (e) => {
    const p = P.get(e.pointerId); if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
    if (P.size === 1) { cam.x -= dx / cam.z; cam.y -= dy / cam.z; if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 7) down.moved = true; }
    else if (P.size === 2 && pinch) {
      const v = [...P.values()], d = Math.hypot(v[0].x - v[1].x, v[0].y - v[1].y), mx = (v[0].x + v[1].x) / 2, my = (v[0].y + v[1].y) / 2;
      cam.x -= (mx - pinch.mx) / cam.z; cam.y -= (my - pinch.my) / cam.z;
      if (pinch.d > 0) cam.zoomAt(mx, my, d / pinch.d);
      pinch.d = d; pinch.mx = mx; pinch.my = my;
    }
    cam.clamp(); cam.dirty = true;
  });
  const up = (e) => {
    if (!P.delete(e.pointerId)) return;
    if (P.size < 2) pinch = null;
    if (P.size === 1) down = null;
    if (P.size === 0) {
      el.classList.remove('drag');
      if (down && !down.moved && performance.now() - down.t < 450) {
        const now = performance.now(), x = e.clientX, y = e.clientY;
        if (!onTap(x, y)) {
          if (now - lastTap < 330) {
            lastTap = 0;
            const [wx, wy] = cam.toWorld(x, y), z1 = cam.clampZ(cam.z * 3);
            cam.flyTo(wx - (x - cam.W / 2) / z1, wy - (y - cam.H / 2) / z1, z1, 420);
          } else lastTap = now;
        }
      }
      down = null;
    }
  };
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  el.addEventListener('wheel', (e) => { e.preventDefault(); cam.tween = null; cam.zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * (e.ctrlKey ? 0.012 : 0.0022))); }, { passive: false });
  addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || isBlocked()) return;
    const st = 90 / cam.z;
    if (e.key === '+' || e.key === '=') cam.flyTo(cam.x, cam.y, cam.z * 2.5, 380);
    else if (e.key === '-') cam.flyTo(cam.x, cam.y, cam.z / 2.5, 380);
    else if (e.key === 'ArrowLeft') cam.x -= st; else if (e.key === 'ArrowRight') cam.x += st;
    else if (e.key === 'ArrowUp') cam.y -= st; else if (e.key === 'ArrowDown') cam.y += st;
    else return;
    cam.clamp(); cam.dirty = true;
  });
}
