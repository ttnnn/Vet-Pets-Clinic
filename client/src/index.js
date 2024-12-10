import React from 'react';
import { createRoot } from 'react-dom/client'; // ใช้ react-dom/client แทน react-dom
import { BrowserRouter } from 'react-router-dom';
import App from './App';

const container = document.getElementById('root'); // ดึง root element
const root = createRoot(container); // ใช้ createRoot สำหรับ React 18

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
