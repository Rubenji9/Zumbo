// Hojas modales: bienvenida, resultado, ranking y postal ampliada.
import { $, esc, fmtTime } from './dom.js';
import { droneSVG, logoSVG } from './brand.js';

const ov = () => $('#ov'), sheet = () => $('#sheet');
export function openSheet(html) { sheet().innerHTML = html; ov().hidden = false; }
export function closeSheet() { ov().hidden = true; }
export const sheetOpen = () => !ov().hidden;

function logoBlock(world, dateLabel) {
  return `<div class="logo">${logoSVG(world.theme.target)}<div><b>zumbo</b><span>Mundo #${world.day} · ${esc(dateLabel)}${world.theme.sponsor ? ' · ' + esc(world.theme.name) : ''}</span></div></div>`;
}
const boardBlock = `<div class="bh">Ranking de hoy<span id="bcount"></span></div><ol class="board" id="board"></ol><p class="bnote" id="bnote"></p>`;

export function introSheet(world, dateLabel, alias, onStart) {
  const t = world.theme.target;
  const sponsor = world.theme.sponsor ? `<p class="meta">${esc(world.theme.sponsor.message || 'Mundo patrocinado')}</p>` : '';
  const zum = (o) => droneSVG({ body: t.body, pupil: t.pupil, led: t.led, ...o });
  openSheet(`${logoBlock(world, dateLabel)}<h1>¿Dónde está Zum?</h1>
<p class="meta">Zum es un dron pequeño con un solo ojo. Hoy se ha escondido en algún sitio de este mundo. El mismo para todos.</p>${sponsor}
<ol class="steps"><li>Mira la postal: Zum está en esa zona.</li><li>Busca ese sitio en el mapa y acércate. El zoom llega hasta los centímetros.</li><li>Toca a Zum. Hay drones casi iguales y cada impostor suma 5 s.</li></ol>
<div class="lineup"><figure class="ok">${zum({})}<figcaption>Zum</figcaption></figure><figure class="no">${zum({ pupil: t.decoyPupil })}<figcaption>Otro ojo</figcaption></figure><figure class="no">${zum({ arms: 3 })}<figcaption>Tres hélices</figcaption></figure><figure class="no">${zum({ led: '#ff3b30' })}<figcaption>Luz roja</figcaption></figure></div>
<label for="alias">Tu nombre en el ranking</label><input id="alias" maxlength="18" autocomplete="nickname" placeholder="Tu nombre">
<button class="go" id="go" type="button">Empezar</button><p class="small">El cronómetro arranca al pulsar. Cada postal extra suma 20 s.</p>`);
  const a = $('#alias'); a.value = alias;
  const go = () => onStart(a.value);
  $('#go').onclick = go;
  a.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
}

export function resultSheet(world, dateLabel, r, fresh, where, nextLabel, { onShare, onExplore }) {
  const h = r.hints || 0;
  openSheet(`${logoBlock(world, dateLabel)}<h1>${fresh ? '¡Pillado!' : 'Hoy ya encontraste a Zum'}</h1><div class="big">${fmtTime(r.ms)}</div>
<div class="stats"><span>${r.fails || 0} impostor${(r.fails || 0) === 1 ? '' : 'es'}</span><span>${h ? h + ' postal' + (h === 1 ? '' : 'es') + ' extra' : 'sin pistas'}</span><span>${esc(where)}</span></div>
${boardBlock}<button class="go" id="share" type="button">Copiar resultado</button><button class="alt" id="explore" type="button">Ver a Zum y explorar</button><p class="small">${esc(nextLabel)}</p>`);
  $('#share').onclick = onShare; $('#explore').onclick = onExplore;
}

export function rankingSheet(world, dateLabel, backLabel, onBack) {
  openSheet(`<h1>Ranking de hoy</h1><p class="meta">Mundo #${world.day} · ${esc(dateLabel)}</p>${boardBlock}<button class="alt" id="back" type="button">${esc(backLabel)}</button>`);
  $('#back').onclick = onBack;
}

export function postcardSheet(title, text, dataUrl) {
  openSheet(`<h1>${esc(title)}</h1><p class="meta">${esc(text)}</p><img class="bigpc" alt="Postal de la zona donde está Zum" src="${dataUrl}"><button class="alt" id="back" type="button">Volver al mapa</button>`);
  $('#back').onclick = closeSheet;
}

/** Pinta el ranking en la hoja abierta (si la hay). rows = null significa error. */
export function renderBoard(rows, state) {
  const ol = $('#board'); if (!ol) return;
  const note = $('#bnote'), cnt = $('#bcount');
  ol.textContent = '';
  const list = (rows || []).filter((r) => typeof r.ms === 'number').sort((a, b) => a.ms - b.ms);
  list.slice(0, 10).forEach((r, i) => ol.append(row(i + 1, r)));
  const me = list.findIndex((r) => r.me);
  if (me >= 10) ol.append(row(me + 1, list[me]));
  cnt.textContent = state.mode === 'firebase' && rows ? list.length + (list.length === 1 ? ' jugador' : ' jugadores') : '';
  note.textContent = rows === null ? 'No se pudo cargar el ranking.' : state.mode !== 'firebase' ? 'Modo local: el ranking mundial se activa al conectar Firebase.' : list.length ? '' : 'Aún no hay tiempos hoy. Sé el primero.';
}
function row(pos, r) {
  const li = document.createElement('li'); if (r.me) li.className = 'me';
  const mk = (c, t) => { const s = document.createElement('span'); s.className = c; s.textContent = t; return s; };
  li.append(mk('p', pos + '.'), mk('n', String(r.alias || 'Anónimo').slice(0, 18)), mk('t', fmtTime(r.ms)));
  return li;
}
