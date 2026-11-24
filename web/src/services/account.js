// Cuentas de Zumbo: email y contraseña o Google. Si el jugador ya había jugado
// como anónimo, su sesión se convierte en cuenta y conserva sus partidas.
import { BACKEND } from './index.js';

const ERRORS = {
  'auth/email-already-in-use': 'Ese email ya tiene cuenta. Prueba a entrar.',
  'auth/invalid-email': 'Ese email no parece válido.',
  'auth/weak-password': 'La contraseña tiene que tener al menos 6 caracteres.',
  'auth/invalid-credential': 'Email o contraseña incorrectos.',
  'auth/wrong-password': 'Email o contraseña incorrectos.',
  'auth/user-not-found': 'No hay ninguna cuenta con ese email.',
  'auth/popup-closed-by-user': 'Has cerrado la ventana de Google antes de terminar.',
  'auth/popup-blocked': 'El navegador ha bloqueado la ventana de Google. Permítela e inténtalo otra vez.',
  'auth/operation-not-allowed': 'Este método de acceso aún no está activado en Firebase.',
  'auth/too-many-requests': 'Demasiados intentos. Espera un momento.',
  'auth/network-request-failed': 'Sin conexión. Revisa tu internet.',
};
export const authError = (e) => ERRORS[e?.code] || 'No se ha podido completar. Inténtalo otra vez.';
export const accountsAvailable = () => BACKEND === 'firebase';

async function core() {
  const { firebaseCore } = await import('./firebase.js');
  return firebaseCore();
}

async function saveProfile(c, user, alias) {
  const clean = String(alias || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 18);
  if (clean && user.displayName !== clean) await c.authMod.updateProfile(user, { displayName: clean });
  await c.fs.setDoc(c.fs.doc(c.db, 'users', user.uid), { alias: clean || user.displayName || 'Jugador', updatedAt: c.fs.serverTimestamp() }, { merge: true });
}

export async function onAccount(cb) {
  if (!accountsAvailable()) { cb(null); return () => {}; }
  const c = await core();
  return c.authMod.onAuthStateChanged(c.auth, (u) => cb(u && !u.isAnonymous ? { uid: u.uid, name: u.displayName || u.email?.split('@')[0] || 'Jugador', email: u.email } : null));
}

export async function signUpEmail(email, password, alias) {
  const c = await core(), A = c.authMod, cur = c.auth.currentUser;
  let user;
  if (cur?.isAnonymous) user = (await A.linkWithCredential(cur, A.EmailAuthProvider.credential(email, password))).user;
  else user = (await A.createUserWithEmailAndPassword(c.auth, email, password)).user;
  await saveProfile(c, user, alias);
  return user;
}

export async function signInEmail(email, password) {
  const c = await core();
  return (await c.authMod.signInWithEmailAndPassword(c.auth, email, password)).user;
}

export async function signInGoogle(alias) {
  const c = await core(), A = c.authMod, cur = c.auth.currentUser, provider = new A.GoogleAuthProvider();
  let user;
  try {
    user = cur?.isAnonymous ? (await A.linkWithPopup(cur, provider)).user : (await A.signInWithPopup(c.auth, provider)).user;
  } catch (e) {
    // La cuenta de Google ya existía: entramos con ella.
    if (e.code === 'auth/credential-already-in-use') { const cred = A.GoogleAuthProvider.credentialFromError(e); user = (await A.signInWithCredential(c.auth, cred)).user; }
    else throw e;
  }
  await saveProfile(c, user, alias || user.displayName);
  return user;
}

export async function resetPassword(email) {
  const c = await core();
  await c.authMod.sendPasswordResetEmail(c.auth, email);
}

export async function signOut() {
  const c = await core();
  await c.authMod.signOut(c.auth);
}
