import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { loadMessages } from './i18n';
import { getSettings } from './settings/settings';
import './index.css';

void loadMessages(getSettings().locale)
  .catch(() => undefined)
  .then(() =>
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    ),
  );
