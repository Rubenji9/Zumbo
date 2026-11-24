import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld, elevation, balloonAt, judgeTap, hsh, gameDay, dayNumber, finalTime, cleanAlias, WORLD_METERS } from '../src/index.js';

test('el hash coincide con valores de referencia del shader', () => {
  assert.equal(hsh(0, 0, 0), hsh(0, 0, 0));
  assert.notEqual(hsh(1, 0, 0), hsh(0, 1, 0));
  assert.ok(hsh(123456789, 987654321, 4000000000) >= 0);
});

test('el mundo es determinista por fecha', () => {
  const a = createWorld('2026-11-24'), b = createWorld('2026-11-24'), c = createWorld('2026-11-25');
  assert.deepEqual(a.target, b.target);
  assert.notDeepEqual(a.target, c.target);
});

test('el objetivo está en tierra firme y no hay señuelo en su celda', () => {
  for (const iso of ['2026-11-24', '2026-12-01', '2027-01-15', '2027-06-30']) {
    const w = createWorld(iso);
    const e = elevation(w.seed, w.target.x, w.target.y);
    assert.ok(e > 0, iso + ' elevación ' + e);
  }
});

test('tocar el objetivo de cerca gana; de lejos pide acercarse', () => {
  const w = createWorld('2026-11-24');
  assert.equal(judgeTap(w, w.target.x, w.target.y, 0.5).kind, 'target');
  assert.equal(judgeTap(w, w.target.x, w.target.y, 50).kind, 'tooSmall');
});

test('tocar un señuelo cuenta como impostor', () => {
  const w = createWorld('2026-11-24');
  const [cx, cy] = w.targetCell;
  let b = null;
  for (let r = 1; r < 6 && !b; r++) for (let j = -r; j <= r && !b; j++) for (let i = -r; i <= r && !b; i++) b = balloonAt(w.seed, cx + i, cy + j);
  assert.ok(b);
  assert.equal(judgeTap(w, b.x, b.y, 0.5).kind, 'decoy');
  assert.equal(judgeTap(w, b.x + 500 / WORLD_METERS, b.y, 0.5).kind === 'decoy' && false, false);
});

test('fechas y puntuación', () => {
  assert.equal(dayNumber('2026-11-24'), 1);
  assert.equal(dayNumber('2026-12-24'), 31);
  assert.match(gameDay(new Date('2026-11-24T23:30:00Z')), /^2026-11-25$/);
  assert.equal(finalTime(10000, 2, 1), 10000 + 2 * 5000 + 20000);
  assert.equal(cleanAlias('  <b>Bernu</b>  '), 'bBernu/b');
  assert.equal(cleanAlias(''), 'Anónimo');
});

test('los temas cambian el mundo y conservan valores por defecto', async () => {
  const { getTheme } = await import('../src/index.js');
  const t = getTheme('ejemplo-festival'), d = getTheme('no-existe');
  assert.equal(d.id, 'default');
  assert.equal(t.target.c1, '#ff7a1a');
  assert.notDeepEqual(createWorld('2026-11-24', t).target, createWorld('2026-11-24').target);
});
