import React from 'react';
import { createRoot } from 'react-dom/client';
import { SensPrototypeProvider } from '@sens/prototype-kit';
import '@sens/prototype-kit/style.css';
import { App } from './App';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SensPrototypeProvider>
      <App />
    </SensPrototypeProvider>
  </React.StrictMode>,
);
