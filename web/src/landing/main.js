// Portada de Zumbo: animación de entrada, mundo en vivo, zoom con scroll, Zum y sus
// impostores, ranking del día y cuentas de usuario.
import './landing.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createWorld, gameDay, dayNumber, secondsToNextWorld, WORLD_METERS as WM } from '@zumbo/shared';
import { createRenderer } from '../engine/renderer.js';
import { eyeSVG, droneSVG, droneLiveSVG } from '../ui/brand.js';
import { fmtMeters, fmtTime } from '../ui/dom.js';
import { BACKEND } from '../services/index.js';
import { accountsAvailable, onAccount, signUpEmail, signInEmail, signInGoogle, resetPassword, signOut, authError } from '../services/account.js';

gsap.registerPlugin(ScrollTrigger);
const $ = (s) => document.querySelector(s);
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (REDUCED) document.documentElement.classList.add('reduced');
const DPR = Math.min(2, devicePixelRatio || 1);
const iso = gameDay();

// Mundo de demostración (no es el de hoy: así la portada no destripa dónde está Zum).
const demo = createWorld('2000-01-01');

/* ---------------- marca ---------------- */
$('#navLogo').innerHTML = eyeSVG();
$('#footLogo').innerHTML = eyeSVG();
$('#authLogo').innerHTML = eyeSVG();
$('#introDrone').innerHTML = droneLiveSVG({ id: 'introZum' });
$('#heroDrone').innerHTML = droneLiveSVG({ id: 'heroZum' });
$('#zumBig').innerHTML = droneLiveSVG({ id: 'bigZum' });
$('#finalDrone').innerHTML = droneLiveSVG({ id: 'finalZum' });
$('#doneDrone').innerHTML = droneLiveSVG({ id: 'doneZum' });

/* ---------------- contador del mundo ---------------- */
$('#heroDay').textContent = 'Mundo #' + dayNumber(iso);
$('#rankDay').textContent = 'Mundo #' + dayNumber(iso);
const pad = (n) => String(n).padStart(2, '0');
function tick() { const s = secondsToNextWorld(); $('#heroCountdown').textContent = `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`; }
tick(); setInterval(tick, 1000);

/* ---------------- navegación ---------------- */
const nav = $('#nav');
const onScroll = () => nav.classList.toggle('solid', scrollY > 40);
addEventListener('scroll', onScroll, { passive: true }); onScroll();

/* ---------------- mundo en vivo (hero) ---------------- */
let hero = null;
try { hero = createRenderer($('#heroWorld'), demo); } catch (e) { console.warn('Sin WebGL2', e); }
const heroState = { visible: true, ready: false, start: performance.now(), last: 0 };
// Vuelo lento sobre la isla: se acerca y se aleja en bucle (el zoom profundo está más abajo).
const HERO_LOOP = 60000;
function heroView(t, W, H) {
  const k = 0.5 - 0.5 * Math.cos((2 * Math.PI * t) / HERO_LOOP);
  const z0 = Math.max(W, H) * 1.05, z = z0 * (1 + 1.9 * k);
  const off = W > 700 ? 0.17 * W : 0; // la isla, a la derecha del texto
  return { x: 0.47 - off / z + 0.03 * k, y: 0.5 + 0.02 * k, z };
}
function heroFrame(t) {
  requestAnimationFrame(heroFrame);
  if (!hero || !heroState.visible || document.hidden || (!heroState.ready && heroState.last)) return;
  if (t - heroState.last < 33) return; // ~30 fps
  heroState.last = t;
  const c = $('#heroWorld'), W = c.clientWidth, H = c.clientHeight, s = Math.min(DPR, 1) * (W * H > 1.2e6 ? 0.6 : 0.75);
  const w = Math.round(W * s), h = Math.round(H * s);
  if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
  hero.render(REDUCED ? heroView(9000, W, H) : heroView(t - heroState.start, W, H), W, H, s, { clouds: 1, showTarget: false });
}
if (hero) {
  new IntersectionObserver(([e]) => { heroState.visible = e.isIntersecting; }).observe($('.hero'));
  requestAnimationFrame(heroFrame);
  // Postal de ejemplo para «Cómo se juega», hecha con el mismo motor.
  const pc = hero.snapshot({ x: demo.postcards[0].x, y: demo.postcards[0].y, z: (480 * WM) / 45000 }, 480, 300, { clouds: 0, showTarget: false });
  $('#howPostal').getContext('2d').drawImage(pc, 0, 0);
}

/* ---------------- animación de entrada ---------------- */
const introEl = $('#intro');
function endIntro(fast) {
  if (introEl.classList.contains('gone')) return;
  try { sessionStorage.setItem('zumbo-intro', '1'); } catch {}
  document.body.classList.remove('intro-on');
  heroState.ready = true; heroState.start = performance.now();
  if (fast) { introEl.classList.add('gone'); heroIn(); return; }
  gsap.to(introEl, { opacity: 0, duration: 0.45, ease: 'power2.out', onComplete: () => { introEl.classList.add('gone'); } });
  heroIn();
}
function runIntro() {
  let seen = false;
  try { seen = sessionStorage.getItem('zumbo-intro') === '1'; } catch {}
  if (REDUCED || seen) { endIntro(true); return; }
  $('#introSkip').onclick = () => { tl.kill(); endIntro(false); };
  const d = '#introDrone', svg = '#introZum';
  gsap.set(d, { scale: 0.06, y: -120, rotate: -25, filter: 'blur(6px)' });
  gsap.set('#introWord span', { yPercent: 120, opacity: 0 });
  const tl = gsap.timeline({ onComplete: () => endIntro(false) });
  tl.to('#introBar', { width: '100%', duration: 2.6, ease: 'power1.inOut' }, 0)
    .to(d, { scale: 1, y: 0, rotate: 0, filter: 'blur(0px)', duration: 1.25, ease: 'expo.out' }, 0.1)
    .to(`${svg} .iris`, { x: 7, y: 3, duration: 0.25, ease: 'power2.out' }, 1.0)
    .to(`${svg} .iris`, { x: -7, y: -2, duration: 0.3, ease: 'power2.inOut' }, 1.3)
    .to(`${svg} .iris`, { x: 0, y: 0, duration: 0.2 }, 1.62)
    .to(`${svg} .lid`, { attr: { transform: 'scale(1 1)' }, duration: 0.08, yoyo: true, repeat: 1 }, 1.85)
    .to('#introWord span', { yPercent: 0, opacity: 1, duration: 0.6, stagger: 0.05, ease: 'back.out(2)' }, 1.15)
    .to('#introWord', { opacity: 0, y: 20, duration: 0.3 }, 2.25)
    // Nos metemos en el ojo de Zum.
    .to(d, { scale: 26, duration: 0.85, ease: 'power3.in', transformOrigin: '50% 50%' }, 2.25)
    .to('.intro-shadow', { opacity: 0, duration: 0.2 }, 2.25);
}

/* ---------------- entrada del hero ---------------- */
let heroDone = false;
function heroIn() {
  if (heroDone) return; heroDone = true;
  if (REDUCED) return;
  gsap.from('.hero-title .line > span', { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: 0.12, delay: 0.15 });
  gsap.from(['.pill', '.hero-sub', '.hero-cta', '.hero-facts'], { y: 26, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.1, delay: 0.35 });
  gsap.from('.hero-zum', { x: 160, y: -120, scale: 0.4, opacity: 0, duration: 1.6, ease: 'expo.out', delay: 0.5 });
  gsap.from('.nav', { y: -30, opacity: 0, duration: 0.8, ease: 'power3.out', delay: 0.2 });
}

/* ---------------- aparición al hacer scroll ---------------- */
if (!REDUCED) {
  ScrollTrigger.batch('.reveal', { start: 'top 85%', once: true, onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.12 }) });
  gsap.from('.sec-head > *', { scrollTrigger: { trigger: '.how', start: 'top 75%' }, y: 30, opacity: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out' });
  gsap.from('.zum-copy > *', { scrollTrigger: { trigger: '.zum', start: 'top 70%' }, y: 30, opacity: 0, duration: 0.8, stagger: 0.08, ease: 'power3.out' });
  gsap.from('#zumBig', { scrollTrigger: { trigger: '.zum', start: 'top 75%' }, scale: 0.3, rotate: -40, opacity: 0, duration: 1.4, ease: 'expo.out' });
  gsap.from('.final h2, .final .hero-cta', { scrollTrigger: { trigger: '.final', start: 'top 75%' }, y: 40, opacity: 0, duration: 0.9, stagger: 0.12, ease: 'power3.out' });
}

/* ---------------- paso 3: pilla a Zum ---------------- */
const catchSet = [{ pupil: '#2961db' }, { arms: 3 }, {}, { led: '#ff3b30' }, { body: '#22c3a6' }, { antenna: true }, { body: '#ff8a3d' }, { arms: 3, pupil: '#2961db' }];
$('#howCatch').innerHTML = catchSet.map((o, i) => `<div class="mini${i === 2 ? ' zum' : ''}">${droneSVG(o)}</div>`).join('');
if (!REDUCED) {
  const minis = [...document.querySelectorAll('#howCatch .mini')];
  let k = 0;
  setInterval(() => {
    minis.forEach((m) => m.classList.remove('hit'));
    // Zum cambia de sitio cada vez, como cada día.
    k = (k + 3) % minis.length;
    const zumEl = minis.find((m) => m.classList.contains('zum'));
    const other = minis[k];
    if (other !== zumEl) { const a = zumEl.innerHTML; zumEl.innerHTML = other.innerHTML; other.innerHTML = a; zumEl.classList.remove('zum'); other.classList.add('zum'); }
    setTimeout(() => minis.find((m) => m.classList.contains('zum'))?.classList.add('hit'), 900);
  }, 2600);
}

/* ---------------- Zum e impostores ---------------- */
const IMP = [
  { o: {}, name: 'Zum', why: '¡Este es el bueno!', ok: true },
  { o: { pupil: '#2961db' }, name: 'Impostor', why: 'Pupila azul' },
  { o: { arms: 3 }, name: 'Impostor', why: 'Tres hélices' },
  { o: { antenna: true }, name: 'Impostor', why: 'Lleva antena' },
  { o: { led: '#ff3b30' }, name: 'Impostor', why: 'Luz roja' },
  { o: { body: '#22c3a6' }, name: 'Impostor', why: 'Otro color' },
];
const order = IMP.map((x, i) => ({ x, r: (i * 7919) % 11 })).sort((a, b) => a.r - b.r).map((a) => a.x);
$('#impRow').innerHTML = order.map((x, i) => `<button type="button" class="imp${x.ok ? ' ok' : ''} reveal" data-i="${i}">${droneSVG(x.o)}<b>${x.ok ? 'Zum' : '¿Zum?'}</b><small></small></button>`).join('');
document.querySelectorAll('.imp').forEach((el) => {
  el.addEventListener('click', () => {
    const x = order[+el.dataset.i];
    el.classList.add('open');
    el.querySelector('b').textContent = x.name;
    el.querySelector('small').textContent = x.why;
    if (!REDUCED) gsap.fromTo(el, { rotateY: 90 }, { rotateY: 0, duration: 0.5, ease: 'back.out(2)' });
  });
});
if (!REDUCED) ScrollTrigger.batch('.imp', { start: 'top 90%', once: true, onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 0.7, stagger: 0.07, ease: 'power3.out' }) });

/* ---------------- zoom infinito con scroll ---------------- */
let zoomR = null, zoomP = 0, zoomDirty = true, zoomLast = 0, zoomHi = false;
const zc = $('#zoomWorld');
const STAGES = [300, 40, 4, 0.15, 0];
function zoomView(p, W, H) {
  const z0 = Math.max(W, H) * 1.05, z1 = WM / 0.019; // al final Zum ocupa ~160 px
  const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
  const z = z0 * Math.pow(z1 / z0, e);
  const m = (1 / z0 - 1 / z) / (1 / z0 - 1 / z1);
  const off = W > 700 ? (0.16 * W) / z : 0; // deja hueco al texto de la izquierda
  return { x: 0.5 + (demo.target.x - 0.5) * m - off, y: 0.5 + (demo.target.y - 0.5) * m, z };
}
function zoomDraw(scale) {
  if (!zoomR) return;
  const W = zc.clientWidth, H = zc.clientHeight, w = Math.round(W * scale), h = Math.round(H * scale);
  if (zc.width !== w || zc.height !== h) { zc.width = w; zc.height = h; }
  const v = zoomView(zoomP, W, H);
  zoomR.render(v, W, H, scale, { clouds: 1, showTarget: true });
  const mpp = WM / v.z;
  $('#zsAlt').textContent = fmtMeters(W * mpp * 0.9);
  const st = STAGES.findIndex((s) => mpp > s);
  document.querySelectorAll('#zsStages li').forEach((li, i) => li.classList.toggle('on', i <= (st < 0 ? 4 : st)));
  $('#zsBar').style.width = (zoomP * 100).toFixed(1) + '%';
}
function zoomLoop(t) {
  requestAnimationFrame(zoomLoop);
  if (!zoomR) return;
  if (zoomDirty) { zoomDirty = false; zoomLast = t; zoomHi = false; zoomDraw(Math.min(DPR, 1) * 0.55); }
  else if (!zoomHi && t - zoomLast > 160) { zoomHi = true; zoomDraw(Math.min(DPR, 1.25)); }
}
new IntersectionObserver(([e]) => {
  if (e.isIntersecting && !zoomR) { try { zoomR = createRenderer(zc, demo); zoomDirty = true; requestAnimationFrame(zoomLoop); } catch (err) { console.warn(err); } }
}, { rootMargin: '100% 0px' }).observe($('#zoom'));
ScrollTrigger.create({ trigger: '#zoom', start: 'top top', end: 'bottom bottom', onUpdate: (s) => { zoomP = s.progress; zoomDirty = true; } });
addEventListener('resize', () => { zoomDirty = true; });

/* ---------------- ranking de hoy ---------------- */
async function loadRanking() {
  const list = $('#rankList'), note = $('#rankNote'), cnt = $('#rankCount');
  if (BACKEND !== 'firebase') { note.textContent = 'El ranking mundial aparece en la versión publicada.'; return; }
  try {
    const { watchBoard } = await import('../services/firebase.js');
    watchBoard(iso, (rows) => {
      list.textContent = '';
      if (rows === null) { note.textContent = 'No se pudo cargar el ranking.'; return; }
      rows.slice(0, 6).forEach((r, i) => {
        const li = document.createElement('li');
        const mk = (c, t) => { const s = document.createElement('span'); s.className = c; s.textContent = t; return s; };
        li.append(mk('p', i + 1 + '.'), mk('n', String(r.alias || 'Anónimo').slice(0, 18)), mk('t', fmtTime(r.ms)));
        list.append(li);
      });
      cnt.textContent = rows.length ? rows.length + (rows.length === 1 ? ' jugador' : ' jugadores') + (rows.length >= 50 ? '+' : '') : '';
      note.textContent = rows.length ? '' : 'Aún nadie ha encontrado a Zum hoy. Puedes ser el primero.';
    }, 50);
  } catch { note.textContent = 'No se pudo cargar el ranking.'; }
}
new IntersectionObserver(([e], o) => { if (e.isIntersecting) { o.disconnect(); loadRanking(); } }, { rootMargin: '300px' }).observe($('#ranking'));

/* ---------------- cuentas ---------------- */
const modal = $('#authModal');
let mode = 'up', account = null, lastFocus = null;
function setMode(m) {
  mode = m;
  $('#tabUp').classList.toggle('on', m === 'up'); $('#tabUp').setAttribute('aria-selected', m === 'up');
  $('#tabIn').classList.toggle('on', m === 'in'); $('#tabIn').setAttribute('aria-selected', m === 'in');
  $('#authTitle').textContent = m === 'up' ? 'Crea tu cuenta' : 'Entra en Zumbo';
  $('#fAlias').hidden = m !== 'up';
  $('#authSubmit').textContent = m === 'up' ? 'Crear cuenta' : 'Entrar';
  $('#authPass').autocomplete = m === 'up' ? 'new-password' : 'current-password';
  $('#authForgot').hidden = m !== 'in';
  msg('');
}
function msg(t, ok) { const e = $('#authMsg'); e.textContent = t; e.classList.toggle('ok', !!ok); }
function showDone() {
  $('#authForm').hidden = true; document.querySelector('.tabs').hidden = true; $('#authGoogle').hidden = true; document.querySelector('.or').hidden = true;
  document.querySelector('.auth-head').hidden = true; $('#authDone').hidden = false; $('#doneName').textContent = account?.name || 'jugador';
}
function showForm() {
  $('#authForm').hidden = false; document.querySelector('.tabs').hidden = false; $('#authGoogle').hidden = false; document.querySelector('.or').hidden = false;
  document.querySelector('.auth-head').hidden = false; $('#authDone').hidden = true;
}
function openAuth(m = 'up') {
  lastFocus = document.activeElement;
  modal.hidden = false;
  if (account) showDone(); else { showForm(); setMode(m); }
  if (!accountsAvailable()) msg('Las cuentas funcionan en la versión publicada de Zumbo.');
  setTimeout(() => (account ? $('#authDone a') : $('#authGoogle')).focus(), 30);
  if (!REDUCED) gsap.fromTo('.modal-card', { y: 30, opacity: 0, scale: 0.97 }, { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: 'power3.out' });
}
function closeAuth() { modal.hidden = true; lastFocus?.focus?.(); }
['#navAccount', '#heroAccount', '#rankAccount', '#finalAccount'].forEach((s) => $(s).addEventListener('click', () => openAuth('up')));
$('#authClose').onclick = closeAuth;
modal.addEventListener('click', (e) => { if (e.target === modal) closeAuth(); });
addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) closeAuth(); });
$('#tabUp').onclick = () => setMode('up');
$('#tabIn').onclick = () => setMode('in');
async function busy(btn, fn) {
  if (!accountsAvailable()) { msg('Las cuentas funcionan en la versión publicada de Zumbo.'); return; }
  const t = btn.textContent; btn.disabled = true; btn.textContent = 'Un momento…';
  try { await fn(); } catch (e) { console.warn(e); msg(authError(e)); } finally { btn.disabled = false; btn.textContent = t; }
}
$('#authForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = $('#authEmail').value.trim(), pass = $('#authPass').value, alias = $('#authAlias').value.trim();
  if (!email || !pass) { msg('Escribe tu email y tu contraseña.'); return; }
  if (mode === 'up' && pass.length < 6) { msg('La contraseña tiene que tener al menos 6 caracteres.'); return; }
  busy($('#authSubmit'), async () => {
    if (mode === 'up') await signUpEmail(email, pass, alias); else await signInEmail(email, pass);
    try { if (alias) localStorage.setItem('zumbo-alias', alias); } catch {}
  });
});
$('#authGoogle').onclick = () => busy($('#authGoogle'), () => signInGoogle($('#authAlias').value.trim()));
$('#authForgot').onclick = () => {
  const email = $('#authEmail').value.trim();
  if (!email) { msg('Escribe tu email arriba y vuelve a pulsar.'); return; }
  busy($('#authForgot'), async () => { await resetPassword(email); msg('Te hemos enviado un email para cambiar la contraseña.', true); });
};
$('#authOut').onclick = () => busy($('#authOut'), async () => { await signOut(); showForm(); setMode('in'); });
onAccount((a) => {
  account = a;
  const b = $('#navAccount');
  b.textContent = a ? 'Hola, ' + a.name : 'Crear cuenta';
  if (a && !modal.hidden) showDone();
}).catch(() => {});

/* ---------------- arranque ---------------- */
runIntro();
