import React from 'react';
import ReactDOM from 'react-dom/client';
import './mockApi.js'; // Setup client-side Mock API interceptors
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

