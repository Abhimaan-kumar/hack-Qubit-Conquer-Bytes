"""extract_text.py

Usage:
    python extract_text.py --pdf ../../../../income_tax_act_1961.pdf --out data/act_text.txt

This script extracts text from a PDF and writes it to a UTF-8 text file.
It uses PyPDF2 for robust PDF text extraction.
"""
import argparse
from pathlib import Path
import sys

try:
    from PyPDF2 import PdfReader
except Exception as e:
    print("PyPDF2 not installed. Please install dependencies from requirements.txt", file=sys.stderr)
    raise


def extract_text_from_pdf(pdf_path: Path) -> str:
    reader = PdfReader(str(pdf_path))
    parts = []
    for page in reader.pages:
        try:
            text = page.extract_text() or ""
        except Exception:
            # some PDFs may raise on extract; skip safely
            text = ""
        parts.append(text)
    return "\n".join(parts)


def main():
    parser = argparse.ArgumentParser(description="Extract text from a PDF file")
    parser.add_argument("--pdf", required=True, help="Path to PDF file")
    parser.add_argument("--out", required=True, help="Output text file path")
    args = parser.parse_args()

    pdf_path = Path(args.pdf).resolve()
    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    if not pdf_path.exists():
        print(f"PDF file not found: {pdf_path}", file=sys.stderr)
        raise SystemExit(1)

    print(f"Reading PDF: {pdf_path}")
    text = extract_text_from_pdf(pdf_path)
    print(f"Extracted {len(text)} characters")

    out_path.write_text(text, encoding="utf-8")
    print(f"Written extracted text to: {out_path}")


if __name__ == "__main__":
    main()
