import React from 'react';
import ReactDOM from 'react-dom/client';
import './mockApi.js'; // Setup client-side Mock API interceptors
import App from './App.jsx';
import './index.css';

// ── One-time startup cleanup ──────────────────────────────────────────────────
// If Firebase is disabled and a stale firebase-uid- token is still in
// localStorage (from a previous Firebase session), remove it immediately so
// the user gets a clean login screen instead of a permissions error.
const _storedToken = localStorage.getItem('notes_token');
if (_storedToken && _storedToken.startsWith('firebase-uid-')) {
  localStorage.removeItem('notes_token');
  console.info('[Startup] Cleared stale Firebase token from localStorage.');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

