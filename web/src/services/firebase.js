// Conexión con Firebase: autenticación (anónima o con cuenta), funciones (árbitro de
// cada partida) y Firestore (ranking en directo, perfiles y calendario de mundos patrocinados).
const env = import.meta.env;
let core = null;

/** Arranca Firebase una sola vez y espera a saber si ya hay sesión. */
export async function firebaseCore() {
  if (core) return core;
  const [{ initializeApp }, auth, fn, fs] = await Promise.all([import('firebase/app'), import('firebase/auth'), import('firebase/functions'), import('firebase/firestore')]);
  const app = initializeApp({ apiKey: env.VITE_FIREBASE_API_KEY, authDomain: env.VITE_FIREBASE_AUTH_DOMAIN, projectId: env.VITE_FIREBASE_PROJECT_ID, appId: env.VITE_FIREBASE_APP_ID });
  const a = auth.getAuth(app), db = fs.getFirestore(app), fns = fn.getFunctions(app, env.VITE_FIREBASE_FUNCTIONS_REGION || 'europe-west1');
  a.languageCode = 'es';
  if (env.VITE_FIREBASE_EMULATORS === 'true') {
    auth.connectAuthEmulator(a, 'http://127.0.0.1:9099', { disableWarnings: true });
    fs.connectFirestoreEmulator(db, '127.0.0.1', 8080);
    fn.connectFunctionsEmulator(fns, '127.0.0.1', 5001);
  }
  await a.authStateReady();
  core = { app, auth: a, authMod: auth, db, fns, fn, fs };
  return core;
}

/** ¿Hay una cuenta de verdad (no anónima) con la sesión abierta? */
export async function hasAccount() {
  const c = await firebaseCore();
  return !!c.auth.currentUser && !c.auth.currentUser.isAnonymous;
}

/** Para jugar hace falta cuenta. */
export async function initFirebase() {
  const c = await firebaseCore();
  const u = c.auth.currentUser;
  if (!u || u.isAnonymous) { const e = new Error('Hace falta una cuenta para jugar'); e.code = 'need-account'; throw e; }
  return { ...c, uid: u.uid, user: u };
}

/** Tema programado para un día (colección "schedule"), o "default". */
export async function fetchThemeId(iso) {
  const { db, fs } = await firebaseCore();
  try { const s = await fs.getDoc(fs.doc(db, 'schedule', iso)); return s.exists() ? s.data().themeId || 'default' : 'default'; } catch { return 'default'; }
}

/** Ranking de un día (sin necesidad de sesión). */
export async function watchBoard(iso, cb, max = 50) {
  const { db, fs, auth } = await firebaseCore();
  const q = fs.query(fs.collection(db, 'leaderboards', iso, 'entries'), fs.orderBy('ms'), fs.limit(max));
  return fs.onSnapshot(q, (s) => cb(s.docs.map((d) => ({ id: d.id, me: d.id === auth.currentUser?.uid, ...d.data() }))), () => cb(null));
}

export async function createFirebaseServer(world) {
  const { uid, user, fns, fn, db, fs } = await initFirebase();
  const call = (name, data = {}) => fn.httpsCallable(fns, name)({ iso: world.iso, ...data }).then((r) => r.data);
  let alias = user.displayName || '';
  if (!user.isAnonymous && !alias) { try { const p = await fs.getDoc(fs.doc(db, 'users', uid)); alias = p.exists() ? p.data().alias || '' : ''; } catch {} }
  return {
    mode: 'firebase',
    uid,
    alias,
    registered: !user.isAnonymous,
    getMine: () => call('getMyRun').then((r) => r.result || null),
    getRun: () => call('getMyRun').then((r) => r.run || null),
    startRun: ({ alias }) => call('startRun', { alias }),
    tap: ({ x, y, mpp }) => call('tap', { x, y, mpp }),
    useHint: ({ level = 1 } = {}) => call('useHint', { level }),
    subscribeBoard(cb) { let un = () => {}; watchBoard(world.iso, cb).then((u) => (un = u)); return () => un(); },
  };
}
