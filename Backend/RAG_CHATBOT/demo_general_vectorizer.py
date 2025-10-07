#!/usr/bin/env python3
"""
General Vectorizer Demo Script
Demonstrates the capabilities of the general file vectorizer
"""

from general_vectorizer import GeneralFileVectorizer
import os
import json

def demo_general_vectorizer():
    """Demonstrate the general vectorizer capabilities"""
    
    print("🎯 General File Vectorizer Demo")
    print("=" * 50)
    
    # Initialize vectorizer
    vectorizer = GeneralFileVectorizer(
        chunk_size=800,
        chunk_overlap=150,
        embedding_model='all-MiniLM-L6-v2'
    )
    
    # Show supported formats
    print("\n1. Supported File Formats:")
    vectorizer.list_supported_formats()
    
    # List available files to vectorize
    print("\n2. Available Files in Current Directory:")
    current_files = []
    for file in os.listdir('.'):
        if os.path.isfile(file):
            file_ext = os.path.splitext(file)[1].lower()
            if file_ext in vectorizer.supported_formats:
                current_files.append(file)
                print(f"   ✅ {file} ({file_ext})")
            else:
                print(f"   ❌ {file} ({file_ext}) - Not supported")
    
    if not current_files:
        print("   No supported files found in current directory")
        return
    
    # Demo file information
    print(f"\n3. File Information Demo:")
    demo_file = current_files[0]  # Use first available file
    try:
        file_info = vectorizer.get_file_info(demo_file)
        print(f"   📄 File: {demo_file}")
        print(f"   📊 Size: {file_info['file_size_mb']} MB")
        print(f"   🗓️ Modified: {file_info['modified_time']}")
        print(f"   🆔 Would get ID: {file_info['document_id']}")
    except Exception as e:
        print(f"   ❌ Error getting file info: {e}")
    
    # Show existing vector databases
    print(f"\n4. Existing Vector Databases:")
    if os.path.exists('general_vectors'):
        vector_dirs = [d for d in os.listdir('general_vectors') if d.endswith('_vectors')]
        if vector_dirs:
            for vdir in vector_dirs:
                doc_id = vdir.replace('_vectors', '')
                metadata_file = f'general_metadata/{doc_id}_metadata.json'
                
                if os.path.exists(metadata_file):
                    try:
                        with open(metadata_file, 'r') as f:
                            metadata = json.load(f)
                        
                        file_info = metadata['file_info']
                        vector_info = metadata['vectorization_info']
                        
                        print(f"   📚 {file_info['filename']} ({file_info['file_extension']})")
                        print(f"      🧩 Chunks: {vector_info['total_chunks']}")
                        print(f"      ⏱️ Created: {vector_info['created_at'][:19]}")
                        print(f"      🆔 ID: {doc_id}")
                        
                    except Exception as e:
                        print(f"   ❌ Error reading metadata for {doc_id}: {e}")
                else:
                    print(f"   📚 {doc_id} (metadata missing)")
        else:
            print("   No vector databases found")
    else:
        print("   No general_vectors directory found")
    
    # Interactive vectorization option
    print(f"\n5. Interactive Vectorization:")
    print(f"   To vectorize a file, use:")
    print(f"   python general_vectorizer.py --file <filepath>")
    print(f"   ")
    print(f"   Example commands:")
    for file in current_files[:3]:  # Show up to 3 examples
        print(f"   python general_vectorizer.py --file {file}")
    
    print(f"\n✅ Demo completed!")

def show_vectorizer_help():
    """Show help information for the general vectorizer"""
    
    print("📖 General File Vectorizer - Usage Guide")
    print("=" * 50)
    
    commands = [
        {
            'command': 'python general_vectorizer.py --file document.pdf',
            'description': 'Vectorize a PDF file'
        },
        {
            'command': 'python general_vectorizer.py --file code.py --chunk-size 500',
            'description': 'Vectorize Python code with smaller chunks'
        },
        {
            'command': 'python general_vectorizer.py --file data.txt --output my_vectors',
            'description': 'Vectorize text file to custom output directory'
        },
        {
            'command': 'python general_vectorizer.py --info document.pdf',
            'description': 'Show file information without vectorizing'
        },
        {
            'command': 'python general_vectorizer.py --list-formats',
            'description': 'List all supported file formats'
        }
    ]
    
    print("\n🚀 Common Commands:")
    for i, cmd in enumerate(commands, 1):
        print(f"\n{i}. {cmd['description']}")
        print(f"   {cmd['command']}")
    
    print(f"\n⚙️ Advanced Options:")
    options = [
        '--chunk-size: Size of text chunks (default: 1000)',
        '--chunk-overlap: Overlap between chunks (default: 200)',
        '--model: Embedding model to use (default: all-MiniLM-L6-v2)',
        '--output: Output directory for vectors (default: general_vectors)'
    ]
    
    for option in options:
        print(f"   {option}")
    
    print(f"\n📁 File Structure Created:")
    print(f"   general_vectors/          - Vector databases")
    print(f"   general_metadata/         - Document metadata")
    print(f"   <document_id>_vectors/    - Individual vector database")
    print(f"   <document_id>_metadata.json - Document information")
    
    print(f"\n💡 Tips:")
    print(f"   • Use smaller chunk sizes (400-600) for code files")
    print(f"   • Use larger chunk sizes (1000-1500) for documents")
    print(f"   • Each file gets a unique document ID based on content hash")
    print(f"   • Vector databases can be used with any RAG chatbot system")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "help":
        show_vectorizer_help()
    else:
        demo_general_vectorizer()