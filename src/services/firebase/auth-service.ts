/**
 * VATIO · Servicio de autenticación con Firebase
 *
 * Maneja login/registro con email+contraseña y Google.
 * Funciona tanto en web como dentro del WebView de Capacitor.
 */

import {
  initializeApp,
  getApps,
  getApp,
  FirebaseApp,
} from 'firebase/app';
import {
  getAuth,
  Auth,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { firebaseConfig } from './config';

// ── Singleton de app/auth (evita reinicializar en HMR) ──
function getFirebaseApp(): FirebaseApp {
  return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
}

export const firebaseApp = getFirebaseApp();
export const firebaseAuth: Auth = getAuth(firebaseApp);

export type AuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
};

function toAuthUser(u: User): AuthUser {
  return {
    uid: u.uid,
    email: u.email,
    displayName: u.displayName,
    photoURL: u.photoURL,
  };
}

/** Registro con email y contraseña */
export async function registerWithEmail(
  email: string,
  password: string,
  displayName?: string
): Promise<AuthUser> {
  const cred = await createUserWithEmailAndPassword(firebaseAuth, email, password);
  if (displayName) {
    await updateProfile(cred.user, { displayName });
  }
  return toAuthUser(cred.user);
}

/** Login con email y contraseña */
export async function loginWithEmail(email: string, password: string): Promise<AuthUser> {
  const cred = await signInWithEmailAndPassword(firebaseAuth, email, password);
  return toAuthUser(cred.user);
}

/** Login con Google (popup en web; en nativo conviene redirect) */
export async function loginWithGoogle(): Promise<AuthUser> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const cred = await signInWithPopup(firebaseAuth, provider);
  return toAuthUser(cred.user);
}

/** Recuperación de contraseña */
export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(firebaseAuth, email);
}

/** Cerrar sesión */
export async function logoutFirebase(): Promise<void> {
  await signOut(firebaseAuth);
}

/** Suscripción al estado de sesión */
export function observeAuth(cb: (user: AuthUser | null) => void): () => void {
  return onAuthStateChanged(firebaseAuth, user => {
    cb(user ? toAuthUser(user) : null);
  });
}
