"""chatbot.py

Simple RAG chatbot:
 - Loads FAISS index and metadata
 - Encodes user query with the same sentence-transformers model
 - Retrieves top-k chunks and sends a prompt to OpenAI (if OPENAI_API_KEY available)

Usage:
    python chatbot.py --index data/act_index.faiss --meta data/act_docs.jsonl

Environment:
    Set OPENAI_API_KEY for full chat responses. If not set, the script will print the retrieved contexts.
"""
import os
import argparse
from pathlib import Path
import json
import sys

try:
    from sentence_transformers import SentenceTransformer
except Exception:
    print("sentence-transformers not installed. Please install dependencies from requirements.txt", file=sys.stderr)
    raise

try:
    import faiss
except Exception:
    print("faiss not installed. Please install dependencies from requirements.txt", file=sys.stderr)
    raise

import requests

# NOTE: The user requested this API key be used directly in the script.
# For security it's recommended to use an environment variable instead.
GEMINI_API_KEY = "AIzaSyDGFfUIe_UCHxsSWGgMEiODCE84-w3mCKU"
# Default model - adjust if you have a different Gemini model available
GEMINI_MODEL = "text-bison-001"


def load_meta(meta_path: Path):
    docs = []
    with meta_path.open("r", encoding="utf-8") as f:
        for line in f:
            docs.append(json.loads(line))
    return docs


def retrieve(query: str, index_path: Path, meta_path: Path, model_name: str = "all-MiniLM-L6-v2", top_k: int = 5):
    model = SentenceTransformer(model_name)
    q_vec = model.encode([query], convert_to_numpy=True)

    index = faiss.read_index(str(index_path))
    D, I = index.search(q_vec, top_k)
    docs = load_meta(meta_path)
    results = []
    for score, idx in zip(D[0], I[0]):
        if idx < 0 or idx >= len(docs):
            continue
        results.append({"id": docs[idx]["id"], "text": docs[idx]["text"], "score": float(score)})
    return results


def generate_answer(query: str, contexts: list):
    # build prompt
    context_text = "\n\n---\n\n".join([c["text"] for c in contexts])
    prompt = f"You are an assistant knowledgeable about the Indian Income Tax Act 1961. Use the provided context to answer the user query. If the answer is not contained in the context, say you don't know.\n\nContext:\n{context_text}\n\nUser question: {query}\n\nAnswer:" 
    # Use Google Generative API (Gemini) via REST. We call the text generation endpoint.
    # Endpoint format: https://generativelanguage.googleapis.com/v1beta2/models/{model}:generate
    url = f"https://generativelanguage.googleapis.com/v1beta2/models/{GEMINI_MODEL}:generate"
    headers = {"Content-Type": "application/json"}
    params = {"key": GEMINI_API_KEY}
    body = {
        "prompt": {
            "text": prompt
        },
        "temperature": 0.0,
        "maxOutputTokens": 512
    }
    try:
        r = requests.post(url, headers=headers, params=params, json=body, timeout=30)
        r.raise_for_status()
        data = r.json()
        # attempt to extract the text from the Gemini response
        # The exact response shape may vary; we try common fields.
        ans = None
        if "candidates" in data and isinstance(data["candidates"], list) and data["candidates"]:
            ans = data["candidates"][0].get("content") or data["candidates"][0].get("output")
        elif "outputs" in data and isinstance(data["outputs"], list) and data["outputs"]:
            # newer API shapes
            out = data["outputs"][0]
            if isinstance(out, dict) and "content" in out:
                # content may be string or list
                if isinstance(out["content"], list):
                    parts = [p.get("text","") for p in out["content"] if isinstance(p, dict)]
                    ans = "".join(parts)
                elif isinstance(out["content"], str):
                    ans = out["content"]
        # fallback: try top-level "output" or "text"
        if not ans:
            ans = data.get("output") or data.get("text") or json.dumps(data)
        return {"answer": ans, "context": context_text}
    except Exception as e:
        return {"answer": None, "context": context_text, "error": str(e)}


def main():
    parser = argparse.ArgumentParser(description="RAG chatbot over Income Tax Act 1961")
    parser.add_argument("--index", required=True, help="Path to FAISS index")
    parser.add_argument("--meta", required=True, help="Path to metadata jsonl")
    parser.add_argument("--model", default="all-MiniLM-L6-v2")
    parser.add_argument("--top_k", type=int, default=5)
    args = parser.parse_args()

    index_path = Path(args.index)
    meta_path = Path(args.meta)
    if not index_path.exists() or not meta_path.exists():
        print("Index or metadata not found. Run vectorize.py first.")
        raise SystemExit(1)

    print("Chatbot ready. Type your question and press Enter (empty line to exit).")
    while True:
        try:
            query = input("Q> ").strip()
        except EOFError:
            break
        if not query:
            break
        contexts = retrieve(query, index_path, meta_path, model_name=args.model, top_k=args.top_k)
        if not contexts:
            print("No relevant context found.")
            continue
        result = generate_answer(query, contexts)
        if result.get("answer"):
            print("A> \n" + result["answer"] + "\n")
        else:
            print("A> (no generation - showing retrieved context)\n")
            print(result.get("context"))


if __name__ == "__main__":
    main()
