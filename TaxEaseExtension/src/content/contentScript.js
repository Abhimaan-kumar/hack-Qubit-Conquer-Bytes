/**
 * Content Script Entry Point
 * Injects the React-based chat overlay into web pages
 */

// Check if overlay is already injected (prevent double injection)
if (!document.getElementById('taxease-chat-root')) {
  console.log('[TaxEase] Initializing extension overlay...');

  // Create root container for React app
  const rootContainer = document.createElement('div');
  rootContainer.id = 'taxease-chat-root';
  
  // Ensure it doesn't interfere with page styles
  rootContainer.style.cssText = `
    all: initial;
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 2147483647;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  // Allow pointer events only on overlay elements
  rootContainer.addEventListener('mousedown', (e) => {
    if (e.target === rootContainer) {
      e.target.style.pointerEvents = 'none';
    }
  });

  // Inject into page
  document.body.appendChild(rootContainer);

  // Import and render React component
  import('./overlay/index.js')
    .then(() => {
      console.log('[TaxEase] Extension loaded successfully!');
    })
    .catch((error) => {
      console.error('[TaxEase] Failed to load extension:', error);
    });
} else {
  console.log('[TaxEase] Extension already loaded, skipping injection.');
}

// Listen for page navigation (for SPAs)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    console.log('[TaxEase] Page navigation detected, overlay persists.');
  }
}).observe(document, { subtree: true, childList: true });

// Prevent overlay removal
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.removedNodes.forEach((node) => {
      if (node.id === 'taxease-chat-root') {
        console.warn('[TaxEase] Overlay removed, re-injecting...');
        document.body.appendChild(node);
      }
    });
  });
});

observer.observe(document.body, { childList: true });

console.log('[TaxEase] Content script initialized.');
