import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App'; // Verifica che punti al file giusto
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();