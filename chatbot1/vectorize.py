"""vectorize.py

Usage:
    python vectorize.py --input data/act_text.txt --index data/act_index.faiss --meta data/act_docs.jsonl

This script:
 - Reads extracted text
 - Splits into chunks with simple sliding window
 - Encodes chunks using sentence-transformers
 - Builds a FAISS index and saves document metadata
"""
import argparse
from pathlib import Path
import json
import math
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


def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200):
    """Simple whitespace chunking with overlap (characters)."""
    chunks = []
    start = 0
    length = len(text)
    while start < length:
        end = min(start + chunk_size, length)
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end == length:
            break
        start = max(0, end - overlap)
    return chunks


def main():
    parser = argparse.ArgumentParser(description="Vectorize extracted text into FAISS index")
    parser.add_argument("--input", required=True, help="Input text file produced by extract_text.py")
    parser.add_argument("--index", required=True, help="Output FAISS index path")
    parser.add_argument("--meta", required=True, help="Output metadata jsonl path")
    parser.add_argument("--model", default="all-MiniLM-L6-v2", help="SentenceTransformer model name")
    parser.add_argument("--chunk_size", type=int, default=1000)
    parser.add_argument("--overlap", type=int, default=200)
    args = parser.parse_args()

    input_path = Path(args.input)
    index_path = Path(args.index)
    meta_path = Path(args.meta)
    index_path.parent.mkdir(parents=True, exist_ok=True)
    meta_path.parent.mkdir(parents=True, exist_ok=True)

    if not input_path.exists():
        print(f"Input file not found: {input_path}", file=sys.stderr)
        raise SystemExit(1)

    text = input_path.read_text(encoding="utf-8")
    chunks = chunk_text(text, chunk_size=args.chunk_size, overlap=args.overlap)
    print(f"Created {len(chunks)} chunks")

    model = SentenceTransformer(args.model)
    embeddings = model.encode(chunks, show_progress_bar=True, convert_to_numpy=True)
    dim = embeddings.shape[1]
    print(f"Embeddings shape: {embeddings.shape}")

    # build FAISS index (IndexFlatIP with normalization)
    # We'll store raw vectors in IndexFlatL2 for simplicity
    index = faiss.IndexFlatL2(dim)
    index.add(embeddings)
    faiss.write_index(index, str(index_path))
    print(f"Wrote FAISS index to: {index_path}")

    # Write metadata (one JSON per line)
    with meta_path.open("w", encoding="utf-8") as f:
        for i, chunk in enumerate(chunks):
            meta = {"id": i, "text": chunk}
            f.write(json.dumps(meta, ensure_ascii=False) + "\n")
    print(f"Wrote metadata to: {meta_path}")


if __name__ == "__main__":
    main()
