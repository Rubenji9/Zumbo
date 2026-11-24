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
