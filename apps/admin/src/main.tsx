import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { setupAxiosInterceptors } from './stores/authStore';
import './index.css';

setupAxiosInterceptors();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
