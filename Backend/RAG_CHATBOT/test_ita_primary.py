#!/usr/bin/env python3
"""
ITA Primary Database Test Script
Tests the RAG chatbot with the comprehensive ITA.pdf vector database
"""

from rag_chatbot import AdvancedRAGChatbot
import sys
import time

def test_ita_primary_database():
    """Test the RAG chatbot with ITA primary database"""
    
    print("🚀 Testing RAG Chatbot with ITA Primary Database")
    print("=" * 60)
    
    try:
        # Initialize with ITA_primary database (this is now the default)
        print("📚 Loading ITA primary database...")
        chatbot = AdvancedRAGChatbot()  # Will automatically use ITA_primary
        
        # Comprehensive test questions for Income Tax Act
        test_questions = [
            "What is the definition of agricultural income under the Income Tax Act?",
            "What are the tax rates for individual taxpayers in India?",
            "Explain the provisions of Section 80C for tax deductions",
            "What is capital gains tax and how is it calculated?",
            "What are the penalties for late filing of income tax returns?",
            "What is Tax Deducted at Source (TDS) and when is it applicable?",
            "What are the exemptions available under Section 10 of the Income Tax Act?",
            "How is depreciation calculated for business assets?",
            "What is the difference between salary income and business income?",
            "What are the provisions for assessment and reassessment under the Act?"
        ]
        
        print(f"📊 Testing with {len(test_questions)} comprehensive questions\n")
        
        for i, question in enumerate(test_questions, 1):
            print(f"\n{i}. Question: {question}")
            print("-" * 60)
            
            try:
                start_time = time.time()
                answer = chatbot.ask(question, top_k=5)  # Get top 5 most relevant chunks
                response_time = time.time() - start_time
                
                print(answer)
                print(f"\n⏱️ Response time: {response_time:.2f} seconds")
                
            except Exception as e:
                print(f"❌ Error answering question: {e}")
            
            print("\n" + "=" * 60)
        
        print("\n✅ Comprehensive testing completed!")
        
        # Display database statistics
        print(f"\n📊 Database Statistics:")
        print(f"   📄 Document: ITA.pdf")
        print(f"   🧩 Total chunks: {len(chatbot.chunks)}")
        print(f"   📝 Metadata entries: {len(chatbot.metadata)}")
        
    except Exception as e:
        print(f"❌ Error initializing chatbot: {e}")
        print("\nAvailable databases:")
        
        import os
        vector_db_path = "vector_database"
        if os.path.exists(vector_db_path):
            vector_files = [f for f in os.listdir(vector_db_path) if f.endswith('_vectors')]
            for vf in vector_files:
                print(f"  - {vf.replace('_vectors', '')}")

def interactive_ita_session():
    """Start interactive session with ITA primary database"""
    print("🎯 Starting Interactive Session with ITA Primary Database")
    print("=" * 60)
    
    try:
        chatbot = AdvancedRAGChatbot()  # Uses ITA_primary by default
        
        print("💡 Ask questions about Income Tax Act, 1961")
        print("📋 Examples:")
        print("   - What is Section 80C?")
        print("   - How to calculate capital gains?")
        print("   - What are TDS provisions?")
        print("   - Agricultural income exemptions")
        print("\n💬 Type 'quit' to exit\n")
        
        chatbot.interactive_chat()
        
    except Exception as e:
        print(f"❌ Error: {e}")

def quick_test():
    """Quick functionality test"""
    print("⚡ Quick Test - ITA Primary Database")
    print("=" * 40)
    
    try:
        chatbot = AdvancedRAGChatbot()
        
        # Quick test question
        question = "What is agricultural income?"
        print(f"❓ Test Question: {question}")
        print("-" * 40)
        
        answer = chatbot.ask(question, top_k=3)
        print(answer)
        
        print("\n✅ Quick test successful!")
        
    except Exception as e:
        print(f"❌ Quick test failed: {e}")

def show_database_info():
    """Show information about the ITA primary database"""
    print("📊 ITA Primary Database Information")
    print("=" * 40)
    
    try:
        import json
        
        # Load metadata
        with open("document_metadata/ITA_primary_metadata.json", 'r') as f:
            metadata = json.load(f)
        
        print(f"📄 Document: {metadata.get('filename', 'Unknown')}")
        print(f"🗓️ Created: {metadata.get('created_at', 'Unknown')}")
        print(f"📊 Pages: {metadata.get('processed_pages', 0)}/{metadata.get('total_pages', 0)}")
        print(f"🧩 Chunks: {metadata.get('total_chunks', 0)}")
        print(f"⏱️ Processing time: {metadata.get('processing_time', 'Unknown')}")
        print(f"📈 Success rate: {metadata.get('success_rate', 'Unknown')}")
        print(f"🤖 Model: {metadata.get('model_used', 'Unknown')}")
        
        content_dist = metadata.get('content_distribution', {})
        if content_dist:
            print(f"\n🏷️ Content Distribution:")
            for content_type, count in sorted(content_dist.items(), key=lambda x: x[1], reverse=True):
                print(f"   {content_type}: {count} chunks")
        
    except Exception as e:
        print(f"❌ Error loading database info: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        
        if command == "test":
            test_ita_primary_database()
        elif command == "interactive":
            interactive_ita_session()
        elif command == "quick":
            quick_test()
        elif command == "info":
            show_database_info()
        else:
            print("❓ Unknown command. Available commands:")
            print("   python test_ita_primary.py test       - Run comprehensive tests")
            print("   python test_ita_primary.py interactive - Start interactive session")
            print("   python test_ita_primary.py quick      - Quick functionality test")
            print("   python test_ita_primary.py info       - Show database information")
    else:
        # Default: run comprehensive test
        test_ita_primary_database()