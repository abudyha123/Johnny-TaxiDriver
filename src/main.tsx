import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './i18n';
import './index.css';

// Johnny's request screen lives at /admin and is loaded only there (separate bundle).
const AdminApp = lazy(() => import('./admin/AdminApp.tsx'));
// The customer's tracking page (/track#<token>), also its own bundle.
const TrackPage = lazy(() => import('./track/TrackPage.tsx'));
const path = window.location.pathname.replace(/\/+$/, '');
const isAdmin = path === '/admin';
const isTrack = path === '/track';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isAdmin ? (
      <Suspense fallback={null}>
        <AdminApp />
      </Suspense>
    ) : isTrack ? (
      <Suspense fallback={null}>
        <TrackPage />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>
);
