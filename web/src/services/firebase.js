// Conexión con Firebase: autenticación anónima, funciones (árbitro de cada partida)
// y Firestore (ranking en directo y calendario de mundos patrocinados).
const env = import.meta.env;
let ctx = null;

export async function initFirebase() {
  if (ctx) return ctx;
  const [{ initializeApp }, auth, fn, fs] = await Promise.all([import('firebase/app'), import('firebase/auth'), import('firebase/functions'), import('firebase/firestore')]);
  const app = initializeApp({ apiKey: env.VITE_FIREBASE_API_KEY, authDomain: env.VITE_FIREBASE_AUTH_DOMAIN, projectId: env.VITE_FIREBASE_PROJECT_ID, appId: env.VITE_FIREBASE_APP_ID });
  const a = auth.getAuth(app), db = fs.getFirestore(app), fns = fn.getFunctions(app, env.VITE_FIREBASE_FUNCTIONS_REGION || 'europe-west1');
  if (env.VITE_FIREBASE_EMULATORS === 'true') {
    auth.connectAuthEmulator(a, 'http://127.0.0.1:9099', { disableWarnings: true });
    fs.connectFirestoreEmulator(db, '127.0.0.1', 8080);
    fn.connectFunctionsEmulator(fns, '127.0.0.1', 5001);
  }
  const cred = await auth.signInAnonymously(a);
  ctx = { uid: cred.user.uid, db, fns, fn, fs };
  return ctx;
}

/** Tema programado para un día (colección "schedule"), o "default". */
export async function fetchThemeId(iso) {
  const { db, fs } = await initFirebase();
  try { const s = await fs.getDoc(fs.doc(db, 'schedule', iso)); return s.exists() ? s.data().themeId || 'default' : 'default'; } catch { return 'default'; }
}

export async function createFirebaseServer(world) {
  const { uid, db, fns, fn, fs } = await initFirebase();
  const call = (name, data = {}) => fn.httpsCallable(fns, name)({ iso: world.iso, ...data }).then((r) => r.data);
  return {
    mode: 'firebase',
    uid,
    getMine: () => call('getMyRun').then((r) => r.result || null),
    getRun: () => call('getMyRun').then((r) => r.run || null),
    startRun: ({ alias }) => call('startRun', { alias }),
    tap: ({ x, y, mpp }) => call('tap', { x, y, mpp }),
    useHint: ({ level = 1 } = {}) => call('useHint', { level }),
    subscribeBoard(cb) {
      const q = fs.query(fs.collection(db, 'leaderboards', world.iso, 'entries'), fs.orderBy('ms'), fs.limit(50));
      return fs.onSnapshot(q, (s) => cb(s.docs.map((d) => ({ id: d.id, me: d.id === uid, ...d.data() }))), () => cb(null));
    },
  };
}
