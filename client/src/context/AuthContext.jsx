import React, { createContext, useContext, useState, useEffect } from 'react';
import { isFirebaseReady, firebaseAuth, firestore } from '../firebase.js';
import { onAuthStateChanged, signOut as fbSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('notes_token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Firebase Auth State Listener ─────────────────────────────────────────
  // When Firebase is configured, this is the source of truth for auth state.
  // It automatically restores the session on any device / browser tab.
  useEffect(() => {
    if (!isFirebaseReady || !firebaseAuth) {
      // Offline/localStorage mode — use the stored token to fetch profile.
      // If a stale Firebase token exists (from a previous Firebase session),
      // clear it immediately so the user gets a clean login screen.
      const storedToken = localStorage.getItem('notes_token');
      if (storedToken && storedToken.startsWith('firebase-uid-')) {
        localStorage.removeItem('notes_token');
        setToken(null);
        setUser(null);
        setLoading(false);
        return;
      }

      const fetchProfile = async () => {
        if (!storedToken) { setUser(null); setLoading(false); return; }
        try {
          const res = await fetch('/api/auth/profile', { headers: { Authorization: `Bearer ${storedToken}` } });
          if (res.ok) setUser(await res.json());
          else { localStorage.removeItem('notes_token'); setToken(null); setUser(null); }
        } catch {
          setUser(null);
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
      return;
    }

    // Firebase mode: listen to auth state changes
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const snap = await getDoc(doc(firestore, 'users', firebaseUser.uid));
          if (snap.exists()) {
            const userData = { id: snap.id, ...snap.data() };
            const fbToken = 'firebase-uid-' + firebaseUser.uid;
            setUser(userData);
            setToken(fbToken);
            localStorage.setItem('notes_token', fbToken);
          } else {
            // Profile not in Firestore yet — fallback to basic Firebase info
            const userData = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              email: firebaseUser.email,
              semester: '1',
              department: 'General',
              role: firebaseUser.email === 'admin@notes.edu' ? 'admin' : 'student',
              favorites: [],
              uploadCount: 0
            };
            setUser(userData);
            const fbToken = 'firebase-uid-' + firebaseUser.uid;
            setToken(fbToken);
            localStorage.setItem('notes_token', fbToken);
          }
        } catch (err) {
          console.error('[Auth] Error fetching profile from Firestore:', err);
          setUser(null);
          logout();
        }
      } else {
        // User signed out from Firebase
        setUser(null);
        setToken(null);
        localStorage.removeItem('notes_token');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []); // Run once on mount

  // ── Login ────────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    setError(null);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.message);
      throw new Error(data.message);
    }
    localStorage.setItem('notes_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  // ── Register ─────────────────────────────────────────────────────────────
  const register = async (name, email, password, semester, department) => {
    setError(null);
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, semester, department })
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.message);
      throw new Error(data.message);
    }
    localStorage.setItem('notes_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  // ── Google (mock SSO button) ─────────────────────────────────────────────
  const loginWithGoogle = async (googlePayload) => {
    setError(null);
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(googlePayload)
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.message);
      throw new Error(data.message);
    }
    localStorage.setItem('notes_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  // ── Update Profile ───────────────────────────────────────────────────────
  const updateProfile = async (profileData) => {
    setError(null);
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(profileData)
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.message);
      throw new Error(data.message);
    }
    // Refresh profile
    const profileRes = await fetch('/api/auth/profile', { headers: { Authorization: `Bearer ${token}` } });
    if (profileRes.ok) setUser(await profileRes.json());
    return data.user;
  };

  // ── Toggle Favourite ─────────────────────────────────────────────────────
  const toggleFavorite = async (noteId) => {
    if (!token) return false;
    try {
      const res = await fetch(`/api/notes/${noteId}/favorite`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Refresh profile to get updated favourites list
        const profileRes = await fetch('/api/auth/profile', { headers: { Authorization: `Bearer ${token}` } });
        if (profileRes.ok) setUser(await profileRes.json());
        return data.favorited;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  // ── Logout ───────────────────────────────────────────────────────────────
  const logout = () => {
    if (isFirebaseReady && firebaseAuth) {
      fbSignOut(firebaseAuth).catch(() => {});
    }
    localStorage.removeItem('notes_token');
    setToken(null);
    setUser(null);
    setError(null);
  };

  return (
    <AuthContext.Provider value={{
      user, token, loading, error,
      login, register, loginWithGoogle, updateProfile, toggleFavorite, logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
