import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import AdminDashboard from './components/AdminDashboard';
import './styles.css';

const isAdmin = window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin/');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>{isAdmin ? <AdminDashboard /> : <App />}</React.StrictMode>,
);

// Production service worker: application shell, campus GeoJSON and eligible
// campus-area OSM tiles are cached. Development remains easy to debug.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      const ready = await navigator.serviceWorker.ready;
      // Cache only a very small campus area; users can add zoom 17 in More.
      ready.active?.postMessage({ type: 'CACHE_CAMPUS', zooms: [15, 16] });
      registration.update().catch(() => {});
    } catch (error) {
      console.warn('Offline worker could not be registered:', error);
    }
  });
}
