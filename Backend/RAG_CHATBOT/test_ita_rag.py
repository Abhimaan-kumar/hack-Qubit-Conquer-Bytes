#!/usr/bin/env python3
"""
Test script for RAG Chatbot with ITA 1961 Amendment PDF
"""

from rag_chatbot import AdvancedRAGChatbot
import sys

def test_ita_document():
    """Test the RAG chatbot with ITA document"""
    
    print("🚀 Testing RAG Chatbot with ITA 1961 Amendment PDF")
    print("=" * 60)
    
    try:
        # Initialize with ITA document
        chatbot = AdvancedRAGChatbot(document_id='doc_ita-1961-amended_1759853795')
        
        # Test questions specifically related to Income Tax Act
        test_questions = [
            "What is agricultural income according to Income Tax Act?",
            "What are the provisions for tax deductions?",
            "What is the definition of income under the Act?",
            "What are the penalties for non-compliance?",
            "What is Section 80C about?",
        ]
        
        print(f"📊 Testing with {len(test_questions)} questions\n")
        
        for i, question in enumerate(test_questions, 1):
            print(f"\n{i}. Question: {question}")
            print("-" * 50)
            
            try:
                answer = chatbot.ask(question, top_k=3)
                print(answer)
            except Exception as e:
                print(f"❌ Error answering question: {e}")
            
            print("\n" + "=" * 60)
        
        print("\n✅ Testing completed!")
        
    except Exception as e:
        print(f"❌ Error initializing chatbot: {e}")
        print("\nAvailable document IDs:")
        
        # List available documents
        import os
        vector_db_path = "vector_database"
        if os.path.exists(vector_db_path):
            vector_files = [f for f in os.listdir(vector_db_path) if f.endswith('_vectors')]
            for vf in vector_files:
                print(f"  - {vf.replace('_vectors', '')}")

def interactive_mode():
    """Start interactive mode with ITA document"""
    try:
        chatbot = AdvancedRAGChatbot(document_id='doc_ita-1961-amended_1759853795')
        chatbot.interactive_chat()
    except Exception as e:
        print(f"❌ Error: {e}")
        print("Falling back to latest document...")
        chatbot = AdvancedRAGChatbot()
        chatbot.interactive_chat()

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "interactive":
        interactive_mode()
    else:
        test_ita_document()