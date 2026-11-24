// Marca: el logo es el globo objetivo visto desde arriba.
let gid = 0;
const TAU = Math.PI * 2;
export function balloonSVG(c1, c2, crown, shadow = false) {
  const id = 'bg' + gid++;
  let g = '';
  for (let i = 0; i < 12; i++) {
    const a0 = (i / 12) * TAU - 1.2, a1 = ((i + 1) / 12) * TAU - 1.2, p = (a) => `${(50 + 46 * Math.cos(a)).toFixed(2)} ${(50 + 46 * Math.sin(a)).toFixed(2)}`;
    g += `<path d="M50 50L${p(a0)}A46 46 0 0 1 ${p(a1)}Z" fill="${i % 2 ? c2 : c1}"/>`;
  }
  return `<svg viewBox="-2 -2 112 112" aria-hidden="true"><defs><radialGradient id="${id}" cx=".34" cy=".3" r=".75"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".42"/></radialGradient></defs>${shadow ? '<ellipse cx="62" cy="63" rx="44" ry="44" fill="#000" opacity=".28"/>' : ''}${g}<circle cx="50" cy="50" r="14" fill="${crown}"/><circle cx="50" cy="50" r="46" fill="url(#${id})"/><circle cx="50" cy="50" r="46" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="1.5"/></svg>`;
}
export const logoSVG = (t) => balloonSVG(t.c1, t.c2, t.crown, true);
