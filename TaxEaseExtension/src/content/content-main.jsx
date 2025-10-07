import React from 'react';
import ReactDOM from 'react-dom/client';
import ChatOverlay from './ChatOverlay-New';
import '../../styles/global.css';

// Create a container for our chat overlay
const container = document.createElement('div');
container.id = 'taxease-chat-overlay';
document.body.appendChild(container);

// Render the comprehensive chat overlay
ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <ChatOverlay />
  </React.StrictMode>
);

console.log('[TaxEase] Extension loaded successfully!');
