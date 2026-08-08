import { useState, useEffect, useCallback } from 'react';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signOut as fbSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../services/firebase';

/**
 * Tracks the Firebase auth session. When Firebase isn't configured it returns a
 * signed-out, non-loading state so the app runs normally on localStorage.
 */
export function useAuth() {
  const configured = isFirebaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(configured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!configured || !auth) { setLoading(false); return; }
    return onAuthStateChanged(auth, u => { setUser(u); setLoading(false); });
  }, [configured]);

  const signInWithGoogle = useCallback(async () => {
    if (!auth) return;
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (e: any) {
      // Popups are often blocked on mobile — fall back to a full-page redirect.
      if (e?.code === 'auth/popup-blocked' || e?.code === 'auth/cancelled-popup-request' || e?.code === 'auth/operation-not-supported-in-this-environment') {
        try { await signInWithRedirect(auth, provider); } catch (e2: any) { setError(e2?.message || 'Sign-in failed.'); }
      } else if (e?.code !== 'auth/popup-closed-by-user') {
        setError(e?.message || 'Sign-in failed.');
      }
    }
  }, []);

  const signOut = useCallback(async () => {
    if (auth) await fbSignOut(auth);
  }, []);

  return { configured, user, loading, error, signInWithGoogle, signOut };
}
