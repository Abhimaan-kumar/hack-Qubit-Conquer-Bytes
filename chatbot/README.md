# Chatbot (RAG) using income_tax_act_1961.pdf

This folder contains scripts to extract text from `income_tax_act_1961.pdf`, vectorize it into a FAISS index, and run a RAG-style chatbot.

Quick steps (PowerShell):

1. Create a venv and install dependencies:

    python -m venv .venv; .\.venv\Scripts\Activate.ps1; pip install -r requirements.txt

2. Extract text:

    python extract_text.py --pdf ../../../../income_tax_act_1961.pdf --out data/act_text.txt

3. Vectorize:

    python vectorize.py --input data/act_text.txt --index data/act_index.faiss --meta data/act_docs.jsonl

4. Chat: run `chatbot.py` (requires OpenAI API key in env var `OPENAI_API_KEY`) — script will be added and documented.
