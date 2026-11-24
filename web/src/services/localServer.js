// "Servidor" que vive en el navegador. Mismo contrato que el de Firebase,
// para poder jugar y desarrollar sin backend. El ranking es solo de este dispositivo.
import { judgeTap, finalTime, cleanAlias } from '@otea/shared';

const read = (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

export function createLocalServer(world) {
  const key = `otea-run-${world.iso}-${world.theme.id}`;
  let run = read(key);
  const listeners = new Set();
  const board = () => (run?.result ? [{ id: 'me', me: true, ...run.result }] : []);
  const emit = () => listeners.forEach((cb) => cb(board()));
  const save = () => { write(key, run); emit(); };

  return {
    mode: 'local',
    async getMine() { return run?.result || null; },
    async getRun() { return run && !run.result ? { startedAt: run.startedAt, fails: run.fails, hints: run.hints, decoys: run.decoys } : null; },
    async startRun({ alias }) {
      if (run?.result) return { already: run.result };
      if (!run) { run = { startedAt: Date.now(), fails: 0, hints: 0, decoys: [], alias: cleanAlias(alias) }; save(); }
      return { startedAt: run.startedAt, fails: run.fails, hints: run.hints, decoys: run.decoys };
    },
    async tap({ x, y, mpp }) {
      const j = judgeTap(world, x, y, mpp);
      if (!run || run.result) return { kind: j.kind, practice: true, key: j.balloon?.key };
      if (j.kind === 'decoy' && !run.decoys.includes(j.balloon.key)) { run.fails++; run.decoys.push(j.balloon.key); save(); return { kind: 'decoy', key: j.balloon.key, fails: run.fails, penalized: true }; }
      if (j.kind === 'decoy') return { kind: 'decoy', key: j.balloon.key, fails: run.fails, penalized: false };
      if (j.kind === 'target') {
        run.result = { day: world.iso, alias: run.alias, ms: finalTime(Date.now() - run.startedAt, run.fails, run.hints), fails: run.fails, hints: run.hints, at: Date.now() };
        save();
        return { kind: 'target', result: run.result };
      }
      return { kind: j.kind };
    },
    async useHint() { if (run && !run.result) { run.hints = 1; save(); } return { hints: run?.hints || 0 }; },
    subscribeBoard(cb) { listeners.add(cb); cb(board()); return () => listeners.delete(cb); },
  };
}
