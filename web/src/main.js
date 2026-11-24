import './styles.css';
import { createWorld, getTheme, gameDay, secondsToNextWorld, PENALTY_DECOY_MS, PENALTY_HINT_MS, MAX_HINTS, WORLD_METERS as WM, droneAt, judgeTap } from '@zumbo/shared';
import { createRenderer } from './engine/renderer.js';
import { createCamera, bindInput } from './engine/camera.js';
import { resolveThemeId, createServer } from './services/index.js';
import { $, toast, fmtTime, fmtMeters, niceScale, fmtLatLon } from './ui/dom.js';
import { droneSVG, logoSVG } from './ui/brand.js';
import { makePostcard, PW } from './ui/postcards.js';
import { introSheet, resultSheet, rankingSheet, postcardSheet, closeSheet, sheetOpen, renderBoard } from './ui/sheets.js';

const iso = gameDay();
const dateLabel = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', timeZone: 'Europe/Madrid' });

boot().catch((e) => { console.error(e); $('#loadT').textContent = e.message === 'webgl2' ? 'Tu navegador no tiene WebGL2. Prueba con Chrome, Edge, Safari o Firefox actualizados.' : 'No se pudo preparar el mapa en este dispositivo.'; });

async function boot() {
  const theme = getTheme(await resolveThemeId(iso).catch(() => 'default'));
  const world = createWorld(iso, theme);
  const T = theme.target;
  $('#loadLogo').innerHTML = logoSVG(T);
  $('#brand').innerHTML = logoSVG(T) + '<b>zumbo</b><small>#' + world.day + '</small>';
  $('#tgt').innerHTML = droneSVG({ body: T.body, pupil: T.pupil, led: T.led }) + '<span></span>';
  $('#tgt span').textContent = T.label;
  $('#zone').textContent = 'Zona: ' + world.zone;
  if (theme.sponsor) { const s = $('#sponsor'); s.hidden = false; s.textContent = 'Mundo patrocinado por '; const a = document.createElement('a'); a.href = theme.sponsor.url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = theme.sponsor.name; s.append(a); }

  const cv = $('#gl'), fx = $('#fx'), fctx = fx.getContext('2d');
  const renderer = createRenderer(cv, world);
  const server = await createServer(world);
  const cam = createCamera();
  if (import.meta.env.DEV) window.__zumbo = { cam, world, S: null }; // ayuda para depurar en `npm run dev`

  // ---------- estado de la partida ----------
  const S = { phase: 'intro', startedAt: 0, fails: 0, hints: 0, result: null, caught: new Map(), alias: '' };
  if (import.meta.env.DEV) window.__zumbo.S = S;
  try { S.alias = localStorage.getItem('zumbo-alias') || ''; } catch {}
  if (server.alias && !S.alias) S.alias = server.alias;
  let board = [];
  const total = () => S.result ? S.result.ms : S.phase === 'play' ? Date.now() - S.startedAt + S.fails * PENALTY_DECOY_MS + S.hints * PENALTY_HINT_MS : 0;
  server.subscribeBoard((rows) => { board = rows; renderBoard(rows, { mode: server.mode }); });

  // ---------- resolución adaptativa ----------
  const DPR = () => Math.min(2, devicePixelRatio || 1);
  const COARSE = matchMedia('(pointer:coarse)').matches;
  let HI = 1, LO = 0.5;
  const sizeScales = () => { HI = Math.max(0.6, Math.min(DPR(), COARSE ? 1.25 : 1.5, Math.sqrt(2.4e6 / (innerWidth * innerHeight)))); LO = Math.max(0.4, HI * 0.5); };
  function resize() { cam.resize(); sizeScales(); fx.width = Math.round(cam.W * DPR()); fx.height = Math.round(cam.H * DPR()); }
  function draw(scale) {
    const w = Math.round(cam.W * scale), h = Math.round(cam.H * scale);
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    renderer.render(cam, cam.W, cam.H, scale);
    overlay(); hud();
  }

  // ---------- capa de marcas (impostores, objetivo encontrado) ----------
  function overlay() {
    const d = DPR(); fctx.setTransform(d, 0, 0, d, 0, 0); fctx.clearRect(0, 0, cam.W, cam.H);
    const mpp = cam.mpp();
    for (const b of S.caught.values()) {
      const [sx, sy] = cam.toScreen(b.x, b.y), r = Math.max(12, (b.r / mpp) * 1.25);
      if (sx < -r || sy < -r || sx > cam.W + r || sy > cam.H + r) continue;
      fctx.strokeStyle = 'rgba(255,77,90,.95)'; fctx.lineWidth = 2.5; fctx.beginPath(); fctx.arc(sx, sy, r, 0, Math.PI * 2); fctx.stroke();
      const bx = sx + r * 0.71, by = sy - r * 0.71;
      fctx.fillStyle = '#ff4d5a'; fctx.beginPath(); fctx.arc(bx, by, 10, 0, Math.PI * 2); fctx.fill();
      fctx.strokeStyle = '#fff'; fctx.lineWidth = 2.2; fctx.beginPath(); fctx.moveTo(bx - 4, by - 4); fctx.lineTo(bx + 4, by + 4); fctx.moveTo(bx + 4, by - 4); fctx.lineTo(bx - 4, by + 4); fctx.stroke();
    }
    if (S.result) {
      const [sx, sy] = cam.toScreen(world.target.x, world.target.y), r = Math.max(16, (world.target.r / mpp) * 1.4);
      fctx.strokeStyle = T.body; fctx.lineWidth = 3; fctx.setLineDash([8, 6]); fctx.beginPath(); fctx.arc(sx, sy, r, 0, Math.PI * 2); fctx.stroke(); fctx.setLineDash([]);
    }
  }
  function hud() {
    const mpp = cam.mpp(), nice = niceScale(mpp, 110);
    $('#sbarL').style.width = (nice / mpp).toFixed(1) + 'px'; $('#sbarT').textContent = fmtMeters(nice);
    $('#coord').textContent = fmtLatLon(cam.x, cam.y); $('#alt').textContent = 'altitud ' + fmtMeters(cam.W * mpp * 0.9);
  }
  let lastClock = '';
  const updClock = () => { const t = fmtTime(total()); if (t !== lastClock) { lastClock = t; $('#clock').textContent = t; } };
  const penalty = () => { const c = $('#clock'); c.classList.add('hit'); setTimeout(() => c.classList.remove('hit'), 600); };

  // ---------- postales ----------
  let cards = [], shown = 0;
  const CARD_TITLES = ['Postal del día', 'Postal cercana', 'Postal muy cercana'];
  const CARD_LABELS = ['45 km', '3,2 km', '300 m'];
  const CARD_TEXTS = [
    `Una vista de 45 km en ${world.zone}: Zum está en algún punto de esta imagen. Busca este sitio en el mapa.`,
    'Una vista de 3,2 km: Zum está en ella.',
    'Una vista de 300 m: Zum está en ella. Fíjate bien.',
  ];
  function showCard() {
    const c = cards[shown]; if (!c) return;
    $('#pc').getContext('2d').drawImage(c, 0, 0);
    $('#pcLab').textContent = CARD_LABELS[shown];
    $('#clueT').textContent = CARD_TITLES[shown];
    const t = $('#tabs');
    t.innerHTML = S.hints ? Array.from({ length: S.hints + 1 }, (_, i) => `<button type="button" data-b="${i}">${i + 1}</button>`).join('') : '';
    t.querySelectorAll('button').forEach((b) => { b.classList.toggle('on', +b.dataset.b === shown); b.onclick = () => { shown = +b.dataset.b; showCard(); }; });
  }
  function updClue() {
    const b = $('#clue2');
    b.disabled = S.phase !== 'play' || S.hints >= MAX_HINTS;
    b.textContent = S.hints >= MAX_HINTS ? 'Todas las postales desbloqueadas' : (S.hints ? 'Postal todavía más cerca · +20 s' : 'Postal más cerca · +20 s');
  }
  $('#pcBtn').onclick = () => {
    const c = cards[shown]; if (!c) return;
    postcardSheet(CARD_TITLES[shown], CARD_TEXTS[shown], c.toDataURL('image/jpeg', 0.9));
  };
  $('#clue2').onclick = async () => {
    if (S.phase !== 'play' || S.hints >= MAX_HINTS) return;
    S.hints++; penalty(); shown = S.hints; showCard(); updClue(); toast(CARD_TITLES[shown] + ' · +20 s');
    try { await server.useHint({ level: S.hints }); } catch (e) { console.warn(e); }
  };

  // ---------- flujo de partida ----------
  const where = () => fmtLatLon(world.target.x, world.target.y, 4);
  const nextLabel = () => { const s = secondsToNextWorld(); return `Nuevo mundo en ${Math.floor(s / 3600)} h ${Math.floor((s % 3600) / 60)} min · a medianoche, hora de Madrid`; };
  const shareText = () => { const r = S.result; return `Zumbo #${world.day} · ${fmtTime(r.ms)}\n${'🟥'.repeat(r.fails || 0)}${'🟨'.repeat(r.hints || 0)}${r.fails || r.hints ? '' : '🟩'}\nHe pillado a Zum. ¿Y tú? ${location.origin}`; };
  function showResult(fresh) {
    S.phase = 'done'; updClue(); updClock();
    resultSheet(world, dateLabel, S.result, fresh, where(), nextLabel(), {
      onShare: async () => { try { await navigator.clipboard.writeText(shareText()); toast('Resultado copiado'); } catch { toast('No se pudo copiar'); } },
      onExplore: () => { closeSheet(); cam.flyTo(world.target.x, world.target.y, WM / 0.06, 1600); },
    });
    renderBoard(board, { mode: server.mode });
  }
  function showIntro() {
    S.phase = 'intro'; updClue();
    introSheet(world, dateLabel, S.alias, start);
  }
  async function start(alias) {
    S.alias = String(alias || '').trim().slice(0, 18);
    try { localStorage.setItem('zumbo-alias', S.alias); } catch {}
    const r = await server.startRun({ alias: S.alias }).catch((e) => { toast('No se pudo empezar: ' + e.message); return null; });
    if (!r) return;
    if (r.already) { S.result = r.already; showResult(false); return; }
    resume(r);
    closeSheet(); cam.flyTo(0.5, 0.5, cam.fit, 400);
  }
  function resume(r) {
    S.phase = 'play'; S.startedAt = r.startedAt; S.fails = r.fails || 0; S.hints = r.hints || 0;
    for (const k of r.decoys || []) { const [cx, cy] = k.split(':').map(Number); const b = droneAt(world.seed, cx, cy); if (b) S.caught.set(k, b); }
    shown = S.hints; updClue(); showCard(); cam.dirty = true;
  }
  $('#rankBtn').onclick = () => { rankingSheet(world, dateLabel, S.phase === 'intro' ? 'Volver' : 'Volver al mapa', () => (S.phase === 'intro' ? showIntro() : S.result && S.phase !== 'play' ? showResult(false) : closeSheet())); renderBoard(board, { mode: server.mode }); };
  $('#zin').onclick = () => cam.flyTo(cam.x, cam.y, cam.z * 2.5, 380);
  $('#zout').onclick = () => cam.flyTo(cam.x, cam.y, cam.z / 2.5, 380);
  $('#home').onclick = () => cam.flyTo(0.5, 0.5, cam.fit, 1100);

  let busy = false;
  bindInput(cv, cam, {
    isBlocked: sheetOpen,
    onTap(px, py) {
      if (S.phase === 'intro' || busy) return false;
      const [x, y] = cam.toWorld(px, py), mpp = cam.mpp();
      // Comprobación previa local: si no hay ningún dron bajo el dedo, ni se llama al servidor
      // (y el doble toque sirve para hacer zoom). Si lo hay, el servidor tiene la última palabra.
      if (judgeTap(world, x, y, mpp).kind === 'none') return false;
      busy = true;
      server.tap({ x, y, mpp }).then((r) => {
        busy = false;
        if (r.kind === 'tooSmall') toast('Acércate más para comprobar ese dron');
        else if (r.kind === 'decoy') {
          const [cx, cy] = r.key.split(':').map(Number), b = droneAt(world.seed, cx, cy);
          if (b) S.caught.set(r.key, b);
          if (r.penalized) { S.fails = r.fails; penalty(); toast('Impostor · +5 s'); } else toast(r.practice ? 'Impostor' : 'Ese impostor ya está marcado');
          cam.dirty = true;
        } else if (r.kind === 'target') {
          if (r.result) { S.result = r.result; S.phase = 'done'; cam.dirty = true; updClock(); setTimeout(() => showResult(true), 900); }
          else toast('Ese es Zum');
        }
      }).catch((e) => { busy = false; toast('Sin conexión con el servidor'); console.warn(e); });
      return true;
    },
  });

  // ---------- bucle ----------
  addEventListener('resize', resize);
  resize();
  draw(HI);
  cards = world.postcards.map((p) => makePostcard(renderer, p));
  showCard(); updClue();
  cam.dirty = true;
  let lastMove = 0, hiDone = true, lastT = 0;
  function frame(t) {
    requestAnimationFrame(frame);
    cam.step(t);
    if (t - lastT > 250) { lastT = t; updClock(); }
    const now = performance.now();
    if (cam.dirty) { cam.dirty = false; draw(LO); lastMove = now; hiDone = false; }
    else if (!hiDone && now - lastMove > 140) { hiDone = true; draw(HI); }
  }
  requestAnimationFrame(frame);
  setTimeout(() => $('#load').classList.add('off'), 60);

  // ¿Ya jugó hoy o tiene una partida a medias?
  const mine = await server.getMine().catch(() => null);
  if (mine) { S.result = mine; showResult(false); return; }
  const run = await server.getRun().catch(() => null);
  if (run) { resume(run); toast('Partida recuperada'); return; }
  showIntro();
}
