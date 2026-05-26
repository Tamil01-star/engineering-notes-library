import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Global fetch override to redirect API calls to production API backend if defined
const originalFetch = window.fetch;
window.fetch = (input, init) => {
  if (typeof input === 'string' && (input.startsWith('/api') || input.startsWith('/uploads'))) {
    const baseUrl = import.meta.env.VITE_API_URL || '';
    input = baseUrl + input;
  }
  return originalFetch(input, init);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
