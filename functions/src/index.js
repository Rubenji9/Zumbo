// Árbitro de las partidas. El cliente nunca escribe su propio tiempo:
// el servidor guarda la hora de inicio, juzga cada toque y publica el resultado.
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createWorld, getTheme, judgeTap, finalTime, cleanAlias, gameDay } from '@otea/shared';

initializeApp();
setGlobalOptions({ region: 'europe-west1', maxInstances: 20 });
const db = getFirestore();

const worlds = new Map();
async function worldFor(iso) {
  if (worlds.has(iso)) return worlds.get(iso);
  const s = await db.doc(`schedule/${iso}`).get();
  const w = createWorld(iso, getTheme(s.exists ? s.data().themeId : 'default'));
  worlds.set(iso, w);
  return w;
}

function check(req) {
  if (!req.auth) throw new HttpsError('unauthenticated', 'Inicia sesión');
  const iso = String(req.data?.iso || '');
  // Solo se puede jugar el mundo de hoy (con un margen por si el reloj cambia a medianoche).
  const today = gameDay(), ayer = gameDay(new Date(Date.now() - 10 * 60 * 1000));
  if (iso !== today && iso !== ayer) throw new HttpsError('failed-precondition', 'Ese mundo ya no está activo');
  return { uid: req.auth.uid, iso, runRef: db.doc(`runs/${iso}_${req.auth.uid}`) };
}

const publicRun = (r) => ({ startedAt: r.startedAt, fails: r.fails, hints: r.hints, decoys: r.decoys });

export const getMyRun = onCall(async (req) => {
  const { runRef } = check(req);
  const s = await runRef.get();
  if (!s.exists) return {};
  const r = s.data();
  return r.result ? { result: r.result } : { run: publicRun(r) };
});

export const startRun = onCall(async (req) => {
  const { uid, iso, runRef } = check(req);
  return db.runTransaction(async (tx) => {
    const s = await tx.get(runRef);
    if (s.exists) { const r = s.data(); return r.result ? { already: r.result } : publicRun(r); }
    const r = { uid, iso, alias: cleanAlias(req.data?.alias), startedAt: Date.now(), fails: 0, hints: 0, decoys: [], taps: 0 };
    tx.set(runRef, r);
    return publicRun(r);
  });
});

export const useHint = onCall(async (req) => {
  const { runRef } = check(req);
  await runRef.update({ hints: 1 });
  return { hints: 1 };
});

export const tap = onCall(async (req) => {
  const { uid, iso, runRef } = check(req);
  const x = Number(req.data?.x), y = Number(req.data?.y), mpp = Number(req.data?.mpp);
  if (![x, y, mpp].every(Number.isFinite) || mpp < 0.005 || mpp > 5000) throw new HttpsError('invalid-argument', 'Toque no válido');
  const world = await worldFor(iso);
  const j = judgeTap(world, x, y, mpp);
  return db.runTransaction(async (tx) => {
    const s = await tx.get(runRef);
    if (!s.exists || s.data().result) return { kind: j.kind, practice: true, key: j.balloon?.key };
    const r = s.data();
    if (r.taps > 400) throw new HttpsError('resource-exhausted', 'Demasiados toques');
    tx.update(runRef, { taps: r.taps + 1 });
    if (j.kind === 'decoy') {
      if (r.decoys.includes(j.balloon.key)) return { kind: 'decoy', key: j.balloon.key, fails: r.fails, penalized: false };
      tx.update(runRef, { fails: r.fails + 1, decoys: [...r.decoys, j.balloon.key] });
      return { kind: 'decoy', key: j.balloon.key, fails: r.fails + 1, penalized: true };
    }
    if (j.kind === 'target') {
      const result = { day: iso, alias: r.alias, ms: finalTime(Date.now() - r.startedAt, r.fails, r.hints), fails: r.fails, hints: r.hints, at: Date.now() };
      tx.update(runRef, { result });
      tx.set(db.doc(`leaderboards/${iso}/entries/${uid}`), result);
      return { kind: 'target', result };
    }
    return { kind: j.kind };
  });
});
