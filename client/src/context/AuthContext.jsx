import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('notes_token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Session Restoration ─────────────────────────────────────────
  // Use the stored token to fetch profile on startup.
  useEffect(() => {
    const storedToken = localStorage.getItem('notes_token');
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
