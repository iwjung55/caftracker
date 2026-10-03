import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Self-hosted fonts: no third-party requests (see docs/architecture.md, privacy).
import '@fontsource/barlow/400.css';
import '@fontsource/barlow/500.css';
import '@fontsource/barlow/600.css';
import '@fontsource/barlow-condensed/500.css';
import '@fontsource/barlow-condensed/600.css';
import './styles/app.css';
import { init } from './data/store';
import { App } from './App';

void init();

// Offline support for the installed app (production builds only; the dev server must stay uncached).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL }).catch(() => {
      // Without a service worker the app still works online; nothing to tell the user.
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
