# Chatbot (Local LLM over WebSockets)

This folder provides a standalone local chatbot that streams responses from an Ollama model (e.g., `llama3.2:3b`) using LangChain and Socket.IO. It does not modify your existing app; it runs separately on port 3001.

## Components
- `server/`: Node.js Express + Socket.IO server integrated with LangChain's `ChatOllama`
- `client/`: Minimal HTML client to test chat via WebSocket

## Requirements
- Windows 10/11
- NVIDIA RTX 3050 (or similar)
- Node.js 18+
- Ollama installed and running

## Install Ollama
1. Download and install: `https://ollama.com/download`
2. Start Ollama service (it usually runs on `http://127.0.0.1:11434`).
3. Pull a lightweight model suited for 6–8GB VRAM:
```bash
ollama pull llama3.2:3b
```

If you need a smaller footprint, consider `qwen2.5:1.5b` or `phi3` variants.

## Setup
From the project root:
```bash
cd chatbot/server
npm install
```

Create an `.env` in `chatbot/server/` (optional):
```bash
CHATBOT_PORT=3001
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2:3b
OLLAMA_TEMPERATURE=0.2
SYSTEM_PROMPT=You are a helpful tax assistant. Answer clearly and concisely.
```

## Run
```bash
cd chatbot/server
npm start
```
You should see: `Chatbot server listening on http://127.0.0.1:3001`

Open the test client in a browser:
```bash
start ..\client\index.html
```
Type a message and watch tokens stream live.

## Socket Events
- Client → Server: `user_message` with `{ text }`
- Server → Client: `bot_token` streaming tokens `{ token }`
- Server → Client: `bot_end` when completion ends `{ text }`
- Server → Client: `bot_error` on errors `{ error }`

## Integrating with your frontend
Keep it separate and call the Socket.IO endpoint `ws://127.0.0.1:3001` from your UI. No changes to your existing app are required.

## Troubleshooting
- Ensure Ollama is running: visit `http://127.0.0.1:11434/api/tags`
- Model not found: run `ollama pull <model>`
- CORS: the server allows `*` for testing; tighten in production
- Port conflict: change `CHATBOT_PORT` in `.env`

