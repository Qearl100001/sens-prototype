import React from 'react';
import ReactDOM from 'react-dom/client';
import { SensPrototypeProvider } from '@sens/prototype-kit';
import '@sens/prototype-kit/style.css';
import { App } from './App';
import './tokens.css';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SensPrototypeProvider>
      <App />
    </SensPrototypeProvider>
  </React.StrictMode>,
);
