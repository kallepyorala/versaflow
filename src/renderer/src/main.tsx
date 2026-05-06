import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { connectStore } from '@/store/connect';
import './styles/global.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

// Wire the renderer to the sidecar's BOOT/DELTA stream. Decoding only;
// the store hydrate/applyDelta hookup lands in #18.
connectStore();

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
