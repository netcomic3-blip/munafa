import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { LanguageProvider } from './context/LanguageContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LocalEdgeDb } from './services/localEdgeDb';
import { installFirstSecondHackerFirewall, onSecurityBlock } from './utils/security';
import './index.css';

// 1. Install 1st-Second Hacker, Code, Script & AI-Code Firewall before any render
try {
  installFirstSecondHackerFirewall();
  onSecurityBlock((evt) => {
    LocalEdgeDb.dispatchMobilePush({
      id: evt.id,
      title: '1st-Second Cyber-Shield Blocked Threat',
      body: `${evt.threatType.replace(/_/g, ' ')}: ${evt.detail}`,
      timestamp: new Date().toLocaleTimeString(),
      accountNumber: 'security',
      type: 'security',
    });
  });
} catch (err) {
  console.warn('Munafa security shield bootstrap warning:', err);
}

// 2. Initialize Main Registry + Per-User Device Edge Node & Self-Healing engine
try {
  LocalEdgeDb.init();
} catch (err) {
  console.warn('Munafa storage pre-init warning:', err);
}

// 3. Global Crash-Proof Shield: intercept uncaught async rejections & transient DOM errors cleanly
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    event.preventDefault();
    console.warn('Munafa Crash-Proof Shield intercepted async error:', event.reason);
  });
  window.addEventListener('error', (event) => {
    if (event.message && /ResizeObserver|Script error/i.test(event.message)) {
      event.preventDefault();
    }
  });
}

// Active feedback: Highlight clicked buttons with thin green & white moving lights
if (typeof document !== 'undefined') {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement | null;
    const btn = target?.closest('button');
    if (btn) {
      btn.classList.add('btn-clicked');
      setTimeout(() => {
        btn.classList.remove('btn-clicked');
      }, 1500);
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </ErrorBoundary>
);
