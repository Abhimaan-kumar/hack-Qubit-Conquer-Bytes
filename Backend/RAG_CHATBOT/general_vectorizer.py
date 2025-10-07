#!/usr/bin/env python3
"""
General File Vectorizer
A comprehensive vectorization system that can process any large document from any path
Supports multiple file formats: PDF, TXT, DOCX, etc.
"""

import os
import json
import time
import PyPDF2
import faiss
import numpy as np
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from sentence_transformers import SentenceTransformer
import pickle
from typing import List, Dict, Optional, Union
import re
from pathlib import Path
import hashlib
from datetime import datetime

class GeneralFileVectorizer:
    def __init__(self, 
                 chunk_size: int = 1000, 
                 chunk_overlap: int = 200,
                 embedding_model: str = 'all-MiniLM-L6-v2'):
        """
        Initialize the General File Vectorizer
        
        Args:
            chunk_size: Size of each text chunk
            chunk_overlap: Overlap between chunks
            embedding_model: Name of the embedding model to use
        """
        print("🚀 Initializing General File Vectorizer...")
        
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.embedding_model = embedding_model
        
        # Initialize embeddings model
        try:
            self.embeddings = HuggingFaceEmbeddings(
                model_name=embedding_model,
                model_kwargs={'device': 'cpu'}
            )
            print(f"✅ Loaded embedding model: {embedding_model}")
        except Exception as e:
            print(f"❌ Error loading embedding model: {e}")
            raise
        
        # Initialize text splitter
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len,
            separators=[
                "\n\n",  # Paragraph breaks
                "\n",    # Line breaks
                ".",     # Sentence endings
                "!",     # Exclamation marks
                "?",     # Question marks
                ";",     # Semicolons
                ":",     # Colons
                ",",     # Commas
                " ",     # Word breaks
                ""       # Character level
            ]
        )
        
        # Supported file formats
        self.supported_formats = {
            '.pdf': self._extract_from_pdf,
            '.txt': self._extract_from_txt,
            '.md': self._extract_from_txt,  # Markdown as text
            '.py': self._extract_from_txt,  # Python files as text
            '.js': self._extract_from_txt,  # JavaScript files as text
            '.html': self._extract_from_txt,  # HTML files as text
            '.json': self._extract_from_txt,  # JSON files as text
            '.csv': self._extract_from_txt,  # CSV files as text
        }
        
        print("✅ General File Vectorizer initialized successfully!")
    
    def get_file_info(self, file_path: str) -> Dict:
        """Get comprehensive information about a file"""
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        
        file_path = Path(file_path)
        stat = file_path.stat()
        
        # Generate file hash for uniqueness
        with open(file_path, 'rb') as f:
            file_hash = hashlib.md5(f.read()).hexdigest()[:12]
        
        return {
            'file_path': str(file_path.absolute()),
            'filename': file_path.name,
            'file_stem': file_path.stem,
            'file_extension': file_path.suffix.lower(),
            'file_size_bytes': stat.st_size,
            'file_size_mb': round(stat.st_size / (1024 * 1024), 2),
            'created_time': datetime.fromtimestamp(stat.st_ctime).isoformat(),
            'modified_time': datetime.fromtimestamp(stat.st_mtime).isoformat(),
            'file_hash': file_hash,
            'document_id': f"{file_path.stem}_{file_hash}"
        }
    
    def _extract_from_pdf(self, file_path: str) -> Dict:
        """Extract text from PDF files"""
        print(f"📖 Extracting text from PDF: {file_path}")
        
        text_by_page = {}
        total_text = ""
        failed_pages = []
        
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                total_pages = len(pdf_reader.pages)
                
                print(f"📄 Total pages: {total_pages}")
                
                for page_num in range(total_pages):
                    if page_num % 50 == 0 and page_num > 0:
                        print(f"   Processing page {page_num + 1}/{total_pages}")
                    
                    try:
                        page = pdf_reader.pages[page_num]
                        text = page.extract_text()
                        
                        if text and text.strip():
                            cleaned_text = self._clean_text(text)
                            if len(cleaned_text.strip()) > 50:
                                text_by_page[page_num + 1] = cleaned_text
                                total_text += f"\n\n=== Page {page_num + 1} ===\n{cleaned_text}"
                        else:
                            failed_pages.append(page_num + 1)
                            
                    except Exception as e:
                        print(f"⚠️ Error processing page {page_num + 1}: {e}")
                        failed_pages.append(page_num + 1)
                        continue
                
                processed_pages = len(text_by_page)
                success_rate = (processed_pages / total_pages) * 100 if total_pages > 0 else 0
                
                print(f"✅ Successfully processed {processed_pages}/{total_pages} pages ({success_rate:.1f}%)")
                
                return {
                    'total_text': total_text,
                    'text_by_page': text_by_page,
                    'total_pages': total_pages,
                    'processed_pages': processed_pages,
                    'failed_pages': failed_pages,
                    'success_rate': success_rate,
                    'extraction_method': 'pdf'
                }
                
        except Exception as e:
            print(f"❌ Error reading PDF: {e}")
            return None
    
    def _extract_from_txt(self, file_path: str) -> Dict:
        """Extract text from text-based files (TXT, MD, PY, etc.)"""
        print(f"📖 Extracting text from file: {file_path}")
        
        try:
            # Try different encodings
            encodings = ['utf-8', 'utf-16', 'latin-1', 'cp1252']
            text = None
            used_encoding = None
            
            for encoding in encodings:
                try:
                    with open(file_path, 'r', encoding=encoding) as file:
                        text = file.read()
                        used_encoding = encoding
                        break
                except UnicodeDecodeError:
                    continue
            
            if text is None:
                raise Exception("Could not decode file with any supported encoding")
            
            # Split text into artificial "pages" for consistency (every 5000 characters)
            page_size = 5000
            text_by_page = {}
            total_text = ""
            
            if len(text) <= page_size:
                # Small file - single page
                cleaned_text = self._clean_text(text)
                text_by_page[1] = cleaned_text
                total_text = f"=== Page 1 ===\n{cleaned_text}"
                total_pages = 1
            else:
                # Large file - split into pages
                pages = [text[i:i+page_size] for i in range(0, len(text), page_size)]
                total_pages = len(pages)
                
                for i, page_text in enumerate(pages, 1):
                    cleaned_text = self._clean_text(page_text)
                    text_by_page[i] = cleaned_text
                    total_text += f"\n\n=== Page {i} ===\n{cleaned_text}"
            
            print(f"✅ Successfully processed {total_pages} page(s)")
            
            return {
                'total_text': total_text,
                'text_by_page': text_by_page,
                'total_pages': total_pages,
                'processed_pages': total_pages,
                'failed_pages': [],
                'success_rate': 100.0,
                'extraction_method': 'text',
                'encoding_used': used_encoding
            }
            
        except Exception as e:
            print(f"❌ Error reading text file: {e}")
            return None
    
    def _clean_text(self, text: str) -> str:
        """Clean and preprocess text"""
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Fix common issues
        text = re.sub(r'([a-z])([A-Z])', r'\1 \2', text)  # Add space between camelCase
        text = re.sub(r'(\d+)([A-Z])', r'\1 \2', text)    # Add space between number and letter
        
        # Remove control characters
        text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', '', text)
        
        # Fix multiple spaces
        text = re.sub(r'\s+', ' ', text)
        
        return text.strip()
    
    def create_chunks(self, extraction_data: Dict, file_info: Dict) -> List[Dict]:
        """Create text chunks with metadata"""
        print(f"🧩 Creating text chunks...")
        
        total_text = extraction_data['total_text']
        text_by_page = extraction_data['text_by_page']
        
        # Split text into chunks
        chunks = self.text_splitter.split_text(total_text)
        
        print(f"📝 Created {len(chunks)} initial chunks")
        
        # Create enhanced metadata for each chunk
        chunks_with_metadata = []
        
        for i, chunk in enumerate(chunks):
            # Find which page this chunk belongs to
            page_num = self._find_page_for_chunk(chunk, text_by_page)
            
            # Analyze chunk content
            content_info = self._analyze_chunk_content(chunk, file_info['file_extension'])
            
            chunk_metadata = {
                'chunk_id': f"{file_info['document_id']}_chunk_{i:04d}",
                'page': page_num,
                'length': len(chunk),
                'file_type': file_info['file_extension'],
                'content_type': content_info['type'],
                'has_code': content_info['has_code'],
                'has_numbers': content_info['has_numbers'],
                'language_detected': content_info['language'],
                'preview': chunk[:150] + "..." if len(chunk) > 150 else chunk
            }
            
            chunks_with_metadata.append({
                'text': chunk,
                'metadata': chunk_metadata
            })
        
        # Filter out very short chunks
        min_length = 50 if file_info['file_extension'] == '.pdf' else 30
        filtered_chunks = [
            chunk for chunk in chunks_with_metadata 
            if len(chunk['text'].strip()) > min_length
        ]
        
        print(f"✅ Created {len(filtered_chunks)} high-quality chunks (filtered from {len(chunks)})")
        return filtered_chunks
    
    def _find_page_for_chunk(self, chunk: str, text_by_page: Dict) -> int:
        """Find which page a chunk belongs to"""
        # Look for page markers first
        page_match = re.search(r'=== Page (\d+) ===', chunk)
        if page_match:
            return int(page_match.group(1))
        
        # Use word overlap method as fallback
        chunk_words = set(chunk.lower().split()[:10])
        
        best_page = 1
        best_score = 0
        
        for page_num, page_text in text_by_page.items():
            page_words = set(page_text.lower().split())
            overlap = len(chunk_words.intersection(page_words))
            
            if overlap > best_score:
                best_score = overlap
                best_page = page_num
        
        return best_page
    
    def _analyze_chunk_content(self, chunk: str, file_extension: str) -> Dict:
        """Analyze the content type of a chunk"""
        chunk_lower = chunk.lower()
        
        # Detect programming languages
        code_patterns = {
            'python': ['def ', 'import ', 'class ', 'if __name__'],
            'javascript': ['function ', 'const ', 'let ', '=>'],
            'html': ['<html', '<div', '<script', '</'],
            'css': ['{', '}', 'color:', 'font-'],
            'json': ['{"', '"}', '":', '[{'],
            'sql': ['select ', 'from ', 'where ', 'insert ']
        }
        
        detected_language = 'natural'
        has_code = False
        
        if file_extension in ['.py', '.js', '.html', '.css', '.json', '.sql']:
            has_code = True
            detected_language = file_extension[1:]  # Remove the dot
        else:
            # Check for code patterns in text
            for lang, patterns in code_patterns.items():
                if any(pattern in chunk_lower for pattern in patterns):
                    detected_language = lang
                    has_code = True
                    break
        
        # Check for numbers/data
        has_numbers = bool(re.search(r'\d+', chunk))
        
        # Determine content type
        if 'definition' in chunk_lower or 'means' in chunk_lower:
            content_type = 'definition'
        elif has_code:
            content_type = 'code'
        elif has_numbers and ('table' in chunk_lower or 'data' in chunk_lower):
            content_type = 'data'
        elif any(word in chunk_lower for word in ['example', 'instance', 'sample']):
            content_type = 'example'
        elif any(word in chunk_lower for word in ['step', 'procedure', 'process', 'how to']):
            content_type = 'procedure'
        else:
            content_type = 'general'
        
        return {
            'type': content_type,
            'has_code': has_code,
            'has_numbers': has_numbers,
            'language': detected_language
        }
    
    def vectorize_file(self, file_path: str, output_dir: str = "general_vectors") -> Optional[str]:
        """
        Vectorize any file and create a searchable database
        
        Args:
            file_path: Path to the file to vectorize
            output_dir: Directory to store the vector database
            
        Returns:
            Document ID if successful, None if failed
        """
        start_time = time.time()
        
        try:
            # Get file information
            file_info = self.get_file_info(file_path)
            print(f"\n🚀 Starting vectorization of: {file_info['filename']}")
            print(f"📊 File size: {file_info['file_size_mb']} MB")
            print(f"📝 File type: {file_info['file_extension']}")
            print(f"🆔 Document ID: {file_info['document_id']}")
            
            # Check if file type is supported
            file_ext = file_info['file_extension']
            if file_ext not in self.supported_formats:
                print(f"❌ Unsupported file format: {file_ext}")
                print(f"Supported formats: {list(self.supported_formats.keys())}")
                return None
            
            # Extract text using appropriate method
            extraction_data = self.supported_formats[file_ext](file_path)
            if not extraction_data:
                print("❌ Failed to extract text from file")
                return None
            
            print(f"📈 Text extraction success rate: {extraction_data['success_rate']:.1f}%")
            
            # Create chunks
            chunks_with_metadata = self.create_chunks(extraction_data, file_info)
            if not chunks_with_metadata:
                print("❌ No chunks created")
                return None
            
            # Prepare texts for vectorization
            texts = [chunk['text'] for chunk in chunks_with_metadata]
            metadatas = [chunk['metadata'] for chunk in chunks_with_metadata]
            
            print(f"🔄 Creating FAISS vector database with {len(texts)} chunks...")
            
            # Create FAISS vector store
            vector_store = FAISS.from_texts(
                texts=texts,
                embedding=self.embeddings,
                metadatas=metadatas
            )
            
            # Create output directories
            os.makedirs(output_dir, exist_ok=True)
            os.makedirs("general_metadata", exist_ok=True)
            
            # Save vector database
            document_id = file_info['document_id']
            vector_db_path = f"{output_dir}/{document_id}_vectors"
            vector_store.save_local(vector_db_path)
            
            # Create comprehensive metadata
            processing_time = time.time() - start_time
            
            # Analyze content distribution
            content_types = {}
            languages = {}
            for chunk in chunks_with_metadata:
                content_type = chunk['metadata']['content_type']
                language = chunk['metadata']['language_detected']
                content_types[content_type] = content_types.get(content_type, 0) + 1
                languages[language] = languages.get(language, 0) + 1
            
            metadata = {
                'document_id': document_id,
                'file_info': file_info,
                'extraction_info': {
                    'method': extraction_data['extraction_method'],
                    'total_pages': extraction_data['total_pages'],
                    'processed_pages': extraction_data['processed_pages'],
                    'success_rate': extraction_data['success_rate'],
                    'failed_pages': extraction_data.get('failed_pages', []),
                    'encoding_used': extraction_data.get('encoding_used', 'N/A')
                },
                'vectorization_info': {
                    'total_chunks': len(chunks_with_metadata),
                    'chunk_size': self.chunk_size,
                    'chunk_overlap': self.chunk_overlap,
                    'embedding_model': self.embedding_model,
                    'processing_time': f"{processing_time:.2f} seconds",
                    'created_at': datetime.now().isoformat()
                },
                'content_analysis': {
                    'content_types': content_types,
                    'languages_detected': languages
                },
                'chunks_metadata': metadatas
            }
            
            # Save metadata
            metadata_path = f"general_metadata/{document_id}_metadata.json"
            with open(metadata_path, 'w', encoding='utf-8') as f:
                json.dump(metadata, f, indent=2, ensure_ascii=False)
            
            # Print success summary
            print(f"\n🎉 File Vectorization Completed Successfully!")
            print(f"=" * 60)
            print(f"📄 File: {file_info['filename']}")
            print(f"📊 Size: {file_info['file_size_mb']} MB")
            print(f"📝 Type: {file_info['file_extension']}")
            print(f"📑 Pages/Sections: {extraction_data['processed_pages']}/{extraction_data['total_pages']}")
            print(f"🧩 Total chunks: {len(chunks_with_metadata)}")
            print(f"⏱️ Processing time: {processing_time:.2f} seconds")
            print(f"🏷️ Content types: {content_types}")
            print(f"🗣️ Languages detected: {languages}")
            print(f"💾 Vector database: {vector_db_path}")
            print(f"📝 Metadata: {metadata_path}")
            print(f"🆔 Document ID: {document_id}")
            
            return document_id
            
        except Exception as e:
            print(f"❌ Error during vectorization: {e}")
            return None
    
    def list_supported_formats(self):
        """List all supported file formats"""
        print("📋 Supported File Formats:")
        print("=" * 30)
        for ext, func in self.supported_formats.items():
            method = "PDF extraction" if "pdf" in func.__name__ else "Text extraction"
            print(f"  {ext:<6} - {method}")
        print(f"\nTotal: {len(self.supported_formats)} formats supported")

def main():
    """Main function for command-line usage"""
    import sys
    import argparse
    
    parser = argparse.ArgumentParser(description="General File Vectorizer - Vectorize any document")
    parser.add_argument('--file', '-f', type=str, help='Path to the file to vectorize')
    parser.add_argument('--output', '-o', type=str, default='general_vectors', 
                       help='Output directory for vector database (default: general_vectors)')
    parser.add_argument('--chunk-size', type=int, default=1000, 
                       help='Chunk size for text splitting (default: 1000)')
    parser.add_argument('--chunk-overlap', type=int, default=200, 
                       help='Chunk overlap for text splitting (default: 200)')
    parser.add_argument('--model', type=str, default='all-MiniLM-L6-v2', 
                       help='Embedding model to use (default: all-MiniLM-L6-v2)')
    parser.add_argument('--list-formats', action='store_true', 
                       help='List supported file formats')
    parser.add_argument('--info', type=str, 
                       help='Show information about a file without vectorizing')
    
    args = parser.parse_args()
    
    # Initialize vectorizer
    vectorizer = GeneralFileVectorizer(
        chunk_size=args.chunk_size,
        chunk_overlap=args.chunk_overlap,
        embedding_model=args.model
    )
    
    if args.list_formats:
        vectorizer.list_supported_formats()
        return
    
    if args.info:
        try:
            file_info = vectorizer.get_file_info(args.info)
            print(f"\n📊 File Information:")
            print(f"=" * 40)
            for key, value in file_info.items():
                print(f"{key:<15}: {value}")
        except Exception as e:
            print(f"❌ Error getting file info: {e}")
        return
    
    if not args.file:
        print("❌ Please provide a file path using --file or -f")
        print("Use --help for more options")
        return
    
    # Vectorize the file
    document_id = vectorizer.vectorize_file(args.file, args.output)
    
    if document_id:
        print(f"\n✅ Vectorization complete! Document ID: {document_id}")
        print(f"🚀 You can now use this document in your RAG applications")
    else:
        print(f"\n❌ Vectorization failed!")

if __name__ == "__main__":
    main()