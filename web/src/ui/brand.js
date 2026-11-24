// Marca Zumbo: el logo es el ojo de Zum; el personaje es Zum, el dron con un ojo.
const INK = '#14121f';

/** El ojo-cámara de Zum (logo). */
export function eyeSVG(pupil = '#ff3d8b', ring = INK) {
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="44" fill="#fff" stroke="${ring}" stroke-width="7"/><circle cx="50" cy="50" r="29" fill="${ring}"/><circle cx="50" cy="50" r="18" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="3"/><circle cx="53" cy="53" r="9" fill="${pupil}"/><circle cx="41" cy="40" r="5" fill="#fff"/></svg>`;
}

/** Zum visto desde arriba. opts: body, pupil, led, arms (3|4), antenna, shadow. */
export function droneSVG({ body = '#ff3d8b', pupil = '#ff3d8b', led = '#ffd23f', arms = 4, antenna = false, shadow = false } = {}) {
  const dark = shade(body, -0.32);
  const angs = arms === 4 ? [45, 135, 225, 315] : [90, 210, 330];
  const pts = angs.map((a) => [100 + 62 * Math.cos((a * Math.PI) / 180), 100 + 62 * Math.sin((a * Math.PI) / 180)]);
  let s = shadow ? '<ellipse cx="114" cy="116" rx="86" ry="86" fill="#000" opacity=".22"/>' : '';
  for (const [x, y] of pts) s += `<line x1="100" y1="100" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${dark}" stroke-width="14" stroke-linecap="round"/>`;
  for (const [x, y] of pts) s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="31" fill="rgba(220,226,235,.45)" stroke="${INK}" stroke-width="2.5"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="7" fill="${dark}" stroke="${INK}" stroke-width="2.5"/>`;
  s += `<rect x="58" y="58" width="84" height="84" rx="30" fill="${body}" stroke="${INK}" stroke-width="3"/><path d="M68 80Q70 66 86 64" stroke="#fff" stroke-opacity=".55" stroke-width="6" fill="none" stroke-linecap="round"/>`;
  if (antenna) s += `<line x1="128" y1="70" x2="146" y2="46" stroke="${INK}" stroke-width="3" stroke-linecap="round"/><circle cx="147" cy="44" r="5" fill="#ffd23f" stroke="${INK}" stroke-width="2"/>`;
  s += `<circle cx="122" cy="132" r="4.5" fill="${led}" stroke="${INK}" stroke-width="1.5"/>`;
  s += `<circle cx="100" cy="100" r="26" fill="#fff" stroke="${INK}" stroke-width="3"/><circle cx="100" cy="100" r="17" fill="${INK}"/><circle cx="102" cy="102" r="6" fill="${pupil}"/><circle cx="94" cy="93" r="3.5" fill="#fff"/>`;
  return `<svg viewBox="0 0 220 220" aria-hidden="true">${s}</svg>`;
}

function shade(hex, a) {
  const n = parseInt(hex.slice(1), 16), f = a < 0 ? 0 : 255, t = Math.abs(a);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(v + (f - v) * t));
  return `rgb(${c.join(',')})`;
}

export const logoSVG = (t) => eyeSVG(t.pupil);

/** Zum con las hélices girando (para la portada y la animación de entrada). */
export function droneLiveSVG({ body = '#ff3d8b', pupil = '#ff3d8b', led = '#ffd23f', id = 'zl' } = {}) {
  const dark = shade(body, -0.32);
  const pts = [45, 135, 225, 315].map((a) => [100 + 62 * Math.cos((a * Math.PI) / 180), 100 + 62 * Math.sin((a * Math.PI) / 180)]);
  let s = '';
  for (const [x, y] of pts) s += `<line x1="100" y1="100" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${dark}" stroke-width="14" stroke-linecap="round"/>`;
  pts.forEach(([x, y], i) => {
    s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="31" fill="rgba(220,226,235,.22)" stroke="${INK}" stroke-width="2.5"/>`;
    s += `<g class="rotor${i % 2 ? ' rev' : ''}" style="transform-origin:${x.toFixed(1)}px ${y.toFixed(1)}px"><rect x="${(x - 28).toFixed(1)}" y="${(y - 3.5).toFixed(1)}" width="56" height="7" rx="3.5" fill="${INK}" opacity=".75"/><rect x="${(x - 3.5).toFixed(1)}" y="${(y - 28).toFixed(1)}" width="7" height="56" rx="3.5" fill="${INK}" opacity=".35"/></g>`;
    s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="7" fill="${dark}" stroke="${INK}" stroke-width="2.5"/>`;
  });
  s += `<rect x="58" y="58" width="84" height="84" rx="30" fill="${body}" stroke="${INK}" stroke-width="3"/><path d="M68 80Q70 66 86 64" stroke="#fff" stroke-opacity=".55" stroke-width="6" fill="none" stroke-linecap="round"/>`;
  s += `<circle class="led" cx="122" cy="132" r="4.5" fill="${led}" stroke="${INK}" stroke-width="1.5"/>`;
  s += `<g class="eye"><circle cx="100" cy="100" r="26" fill="#fff" stroke="${INK}" stroke-width="3"/><g class="iris"><circle cx="100" cy="100" r="17" fill="${INK}"/><circle cx="100" cy="100" r="11" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="2"/><circle cx="102" cy="102" r="6" fill="${pupil}"/><circle cx="94" cy="93" r="3.5" fill="#fff"/></g><rect class="lid" x="72" y="72" width="56" height="56" fill="${body}" transform="scale(1 0)" style="transform-origin:100px 74px"/></g>`;
  return `<svg viewBox="0 0 200 200" id="${id}" aria-hidden="true">${s}</svg>`;
}
