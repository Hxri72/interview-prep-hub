import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router';
import App from './App';
import './index.css';

// HashRouter keeps URLs like /#/topic/nodejs/event-loop, which work on
// GitHub Pages without any server setup (refreshing never gives a 404).
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
);
