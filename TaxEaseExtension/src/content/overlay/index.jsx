/**
 * Overlay Entry Point
 * Renders the React overlay into the injected container
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import ChatOverlay from './ChatOverlay.jsx';
import '../../../styles/overlay.css';

// Get or create the root element
const rootElement = document.getElementById('taxease-chat-root');

if (rootElement) {
  // Create shadow DOM to isolate styles (optional, but recommended)
  const shadowRoot = rootElement.attachShadow ? rootElement.attachShadow({ mode: 'open' }) : rootElement;
  
  // Create a container inside shadow DOM
  const appContainer = document.createElement('div');
  appContainer.id = 'taxease-app-container';
  appContainer.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 2147483647;
  `;
  
  // Allow pointer events on child elements
  appContainer.addEventListener('mousedown', (e) => {
    e.stopPropagation();
  });

  if (shadowRoot === rootElement) {
    rootElement.appendChild(appContainer);
  } else {
    shadowRoot.appendChild(appContainer);
    
    // Inject styles into shadow DOM
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      * {
        box-sizing: border-box;
        pointer-events: auto;
      }
      
      .custom-scrollbar::-webkit-scrollbar {
        width: 8px;
      }
      
      .custom-scrollbar::-webkit-scrollbar-track {
        background: rgba(243, 244, 246, 0.5);
        border-radius: 10px;
      }
      
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, #667eea, #764ba2);
        border-radius: 10px;
      }
      
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(180deg, #764ba2, #667eea);
      }
      
      @keyframes bounce {
        0%, 80%, 100% {
          transform: translateY(0);
        }
        40% {
          transform: translateY(-10px);
        }
      }
    `;
    shadowRoot.appendChild(styleElement);
  }

  // Render React app
  const root = ReactDOM.createRoot(appContainer);
  root.render(
    <React.StrictMode>
      <ChatOverlay />
    </React.StrictMode>
  );

  console.log('[TaxEase] React overlay rendered successfully!');
} else {
  console.error('[TaxEase] Root element not found!');
}
