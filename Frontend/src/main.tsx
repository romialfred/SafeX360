import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

// LOT 44 — Setup i18n (doit être importé avant App pour init avant le render)
import './i18n';

import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider>
      <ModalsProvider>
        <App />
      </ModalsProvider>
    </MantineProvider>
  </StrictMode>
);
