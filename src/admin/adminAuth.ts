// Sign-in for Johnny's request screen.
// firebase mode: real Firebase Authentication (email + password). Signing in is not enough:
// the account must also be listed in /admins, which only the project owner can edit in the
// Firebase console. The same check is enforced again on the server by firestore.rules.
import { REQUESTS_MODE } from '../lib/requests/store';

export type AdminUser = { email: string };
export type AuthState =
  | { kind: 'loading' }
  | { kind: 'signedOut' }
  | { kind: 'notAllowed'; email: string }
  | { kind: 'admin'; user: AdminUser };

const DEMO_SESSION = 'jt_demo_admin';

export async function watchAdmin(cb: (s: AuthState) => void): Promise<() => void> {
  if (REQUESTS_MODE === 'demo') {
    cb(sessionStorage.getItem(DEMO_SESSION) === '1' ? { kind: 'admin', user: { email: 'johnny (demo)' } } : { kind: 'signedOut' });
    return () => {};
  }
  const [{ auth, db }, { onAuthStateChanged }, { doc, getDoc }] = await Promise.all([
    import('../lib/firebase/client'), import('firebase/auth'), import('firebase/firestore'),
  ]);
  return onAuthStateChanged(auth(), async (u) => {
    if (!u) return cb({ kind: 'signedOut' });
    cb({ kind: 'loading' });
    try {
      const allowed = (await getDoc(doc(db(), 'admins', u.uid))).exists();
      cb(allowed ? { kind: 'admin', user: { email: u.email || '' } } : { kind: 'notAllowed', email: u.email || '' });
    } catch {
      cb({ kind: 'notAllowed', email: u.email || '' }); // the rules refused even the check
    }
  });
}

export async function signIn(email: string, password: string): Promise<void> {
  if (REQUESTS_MODE === 'demo') {
    if (password !== 'demo') throw new Error('bad-credentials');
    sessionStorage.setItem(DEMO_SESSION, '1');
    location.reload();
    return;
  }
  const [{ auth }, { signInWithEmailAndPassword }] = await Promise.all([import('../lib/firebase/client'), import('firebase/auth')]);
  await signInWithEmailAndPassword(auth(), email.trim(), password);
}

export async function signOutAdmin(): Promise<void> {
  if (REQUESTS_MODE === 'demo') { sessionStorage.removeItem(DEMO_SESSION); location.reload(); return; }
  const [{ auth }, { signOut }] = await Promise.all([import('../lib/firebase/client'), import('firebase/auth')]);
  await signOut(auth());
}

export async function sendReset(email: string): Promise<void> {
  const [{ auth }, { sendPasswordResetEmail }] = await Promise.all([import('../lib/firebase/client'), import('firebase/auth')]);
  await sendPasswordResetEmail(auth(), email.trim());
}

export function authErrorHe(e: unknown): string {
  const code = (e as { code?: string })?.code || (e as Error)?.message || '';
  if (/invalid-credential|wrong-password|user-not-found|invalid-email|bad-credentials/.test(code)) return 'האימייל או הסיסמה שגויים.';
  if (/too-many-requests/.test(code)) return 'יותר מדי ניסיונות. נסו שוב בעוד כמה דקות.';
  if (/network/.test(code)) return 'אין חיבור לאינטרנט. בדקו את החיבור ונסו שוב.';
  return 'הכניסה נכשלה. נסו שוב.';
}
