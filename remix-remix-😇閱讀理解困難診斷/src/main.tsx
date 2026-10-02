import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {ErrorBoundary} from './components/ErrorBoundary.tsx';
import './index.css';

// Safe listeners to catch and log window errors without uncaught crashes
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    console.warn('Captured window error:', event.error || event.message);
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.warn('Captured unhandled rejection:', event.reason);
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

