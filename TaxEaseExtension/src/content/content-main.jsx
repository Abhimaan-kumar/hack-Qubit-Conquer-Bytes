import React from 'react';
import ReactDOM from 'react-dom/client';
import ChatOverlay from './ChatOverlay';

// Create a container for our chat overlay
const container = document.createElement('div');
container.id = 'taxease-chat-overlay';
document.body.appendChild(container);

// Render the chat overlay
ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <ChatOverlay />
  </React.StrictMode>
);