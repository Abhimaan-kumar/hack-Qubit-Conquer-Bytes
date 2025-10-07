# TaxEase AI Assistant - Chrome Extension

A Chrome Extension that provides an AI assistant for filing income tax returns on the Indian government's e-filing portal.

## Features

- 🪟 **Popup UI**: Control the assistant from the extension icon
- 🧩 **Overlay Chatbot**: Floating chat panel on the e-filing website
- 💡 **Field-Aware Tooltips**: Contextual help when filling forms
- 📤 **File Upload**: Upload Form-16/Payslip for automatic data extraction
- 🔒 **Privacy Mode**: No data stored after browser is closed

## Tech Stack

- **Frontend Framework**: React + Vite
- **Styling**: TailwindCSS + Framer Motion
- **Extension Type**: Chrome Extension (Manifest V3)
- **API Calls**: Fetch or Axios (for mock Flask backend endpoints)

## Folder Structure

```
TaxEaseExtension/
├── manifest.json
├── vite.config.js
├── src/
│   ├── popup/
│   │   └── Popup.jsx
│   ├── content/
│   │   └── ChatOverlay.jsx
│   ├── components/
│   │   ├── ChatBubble.jsx
│   │   ├── Tooltip.jsx
│   │   └── PrivacyNotice.jsx
│   ├── assets/
│   ├── App.jsx  (for local testing UI)
│   └── main.jsx
├── styles/
│   └── global.css
├── package.json
└── README.md
```

## Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run development server**:
   ```bash
   npm run dev
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

## Loading the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked"
4. Select the `dist` folder generated after building

## Testing

For local testing without the actual income tax portal:
1. Run `npm run dev`
2. Open `mock-page.html` in your browser
3. The content script chatbot will attach to this page for testing

## Mock API Endpoints

The extension includes mock API endpoints for:

- `POST /api/chat` → Returns sample AI responses based on input
- `POST /api/upload` → Returns extracted income details from documents

## Privacy

- No credentials or personal data are stored
- Uses `chrome.storage.local` only for temporary session state
- Auto-clears chat history on browser close or "End Session"
- Strict privacy mode is always ON

## Design Guidelines

- Blue + white theme inspired by Indian government websites
- Rounded corners, subtle shadows, neumorphic touch
- Tailwind typography and spacing
- Header icon with Indian flag emoji 🇮🇳
- Font: Inter / Poppins
- Lightweight and responsive UI

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request