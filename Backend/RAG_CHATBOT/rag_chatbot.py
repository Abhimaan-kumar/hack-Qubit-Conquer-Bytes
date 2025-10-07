import os
import json
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import pickle
import faiss
from typing import List, Dict, Tuple

class AdvancedRAGChatbot:
    def __init__(self, document_id: str = None):
        """
        Initialize the Advanced RAG Chatbot
        
        Args:
            document_id (str): Specific document ID to load, or None to load the latest
        """
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.chunks = []
        self.embeddings = None
        self.metadata = []
        self.document_id = document_id
        
        # Load the vector database
        self.load_vector_database()
    
    def load_vector_database(self):
        """Load the pre-created vector database"""
        try:
            # Find available documents
            vector_db_path = "vector_database"
            metadata_path = "document_metadata"
            
            if not os.path.exists(vector_db_path) or not os.path.exists(metadata_path):
                print("❌ Vector database not found. Please run document_vectorizer.py first to create the database.")
                print("Usage: python document_vectorizer.py <pdf_file_path>")
                exit(1)
            
            # Get all available document IDs
            vector_files = [f for f in os.listdir(vector_db_path) if f.endswith('_vectors')]
            if not vector_files:
                print("❌ No vector databases found.")
                exit(1)
            
            # Use specified document_id or get the latest one
            if self.document_id:
                vector_file = f"{self.document_id}_vectors"
                metadata_file = f"{self.document_id}_metadata.json"
            else:
                # Get the most recent vector file
                vector_file = max(vector_files, key=lambda x: os.path.getctime(os.path.join(vector_db_path, x)))
                doc_id = vector_file.replace('_vectors', '')
                metadata_file = f"{doc_id}_metadata.json"
                self.document_id = doc_id
            
            # Load FAISS index and chunks
            vector_dir = os.path.join(vector_db_path, vector_file)
            faiss_index_path = os.path.join(vector_dir, "index.faiss")
            chunks_path = os.path.join(vector_dir, "index.pkl")
            
            # Load FAISS index
            self.faiss_index = faiss.read_index(faiss_index_path)
            
            # Load chunks from LangChain FAISS format
            with open(chunks_path, 'rb') as f:
                docstore, index_to_id = pickle.load(f)
                # Extract chunks from docstore
                self.chunks = []
                for i in range(len(index_to_id)):
                    if i in index_to_id:
                        doc_id = index_to_id[i]
                        if doc_id in docstore._dict:
                            doc = docstore._dict[doc_id]
                            self.chunks.append(doc.page_content)
                        else:
                            self.chunks.append("")
                    else:
                        self.chunks.append("")
            
            # Load metadata
            metadata_path_full = os.path.join(metadata_path, metadata_file)
            with open(metadata_path_full, 'r', encoding='utf-8') as f:
                metadata_info = json.load(f)
                self.metadata = metadata_info['chunks_metadata']
            
            print(f"✅ Loaded vector database '{self.document_id}' with {len(self.chunks)} chunks")
            print(f"📄 Document: {metadata_info.get('filename', 'Unknown')}")
            
        except FileNotFoundError as e:
            print(f"❌ Vector database file not found: {e}")
            print("Please run document_vectorizer.py first to create the database.")
            exit(1)
        except Exception as e:
            print(f"❌ Error loading vector database: {e}")
            exit(1)
    
    def find_relevant_chunks(self, query: str, top_k: int = 5, similarity_threshold: float = 0.3) -> List[Dict]:
        """
        Find the most relevant chunks for a given query using FAISS
        
        Args:
            query (str): User's question
            top_k (int): Number of top chunks to return
            similarity_threshold (float): Minimum similarity score to consider
            
        Returns:
            List[Dict]: List of relevant chunks with metadata
        """
        # Embed the query
        query_embedding = self.model.encode([query]).astype('float32')
        
        # Search using FAISS
        scores, indices = self.faiss_index.search(query_embedding, top_k)
        
        relevant_chunks = []
        for i, (score, idx) in enumerate(zip(scores[0], indices[0])):
            if idx < len(self.chunks) and score >= similarity_threshold:
                relevant_chunks.append({
                    'chunk': self.chunks[idx],
                    'similarity': float(score),
                    'metadata': self.metadata[idx] if idx < len(self.metadata) else {'page': 'N/A', 'chunk_id': idx},
                    'chunk_id': int(idx)
                })
        
        return relevant_chunks
    
    def generate_contextual_answer(self, query: str, relevant_chunks: List[Dict]) -> str:
        """
        Generate a contextual answer based on relevant chunks
        
        Args:
            query (str): User's question
            relevant_chunks (List[Dict]): Relevant document chunks
            
        Returns:
            str: Generated answer with source attribution
        """
        if not relevant_chunks:
            return "I couldn't find relevant information in the document to answer your question. Please try rephrasing your question or ask about topics covered in the uploaded document."
        
        # Create context from relevant chunks
        context_parts = []
        sources = []
        
        for i, chunk_data in enumerate(relevant_chunks, 1):
            chunk = chunk_data['chunk']
            metadata = chunk_data['metadata']
            similarity = chunk_data['similarity']
            
            context_parts.append(f"[Source {i}] {chunk}")
            sources.append(f"Source {i}: Page {metadata.get('page', 'N/A')}, Chunk {metadata.get('chunk_id', 'N/A')} (Relevance: {similarity:.2f})")
        
        context = "\n\n".join(context_parts)
        
        # Generate answer based on context
        answer = self.create_structured_answer(query, context, relevant_chunks)
        
        # Add source attribution
        source_attribution = "\n\n📚 **Sources:**\n" + "\n".join(sources)
        
        return answer + source_attribution
    
    def create_structured_answer(self, query: str, context: str, relevant_chunks: List[Dict]) -> str:
        """
        Create a structured answer based on the query type and context
        
        Args:
            query (str): User's question
            context (str): Relevant context from documents
            relevant_chunks (List[Dict]): List of relevant chunks with metadata
            
        Returns:
            str: Structured answer
        """
        query_lower = query.lower()
        
        # Analyze query type
        if any(word in query_lower for word in ['what is', 'define', 'definition', 'meaning']):
            return self.create_definition_answer(query, context, relevant_chunks)
        elif any(word in query_lower for word in ['how to', 'how do', 'process', 'procedure', 'steps']):
            return self.create_process_answer(query, context, relevant_chunks)
        elif any(word in query_lower for word in ['example', 'examples', 'instance', 'case']):
            return self.create_example_answer(query, context, relevant_chunks)
        elif any(word in query_lower for word in ['calculate', 'computation', 'formula']):
            return self.create_calculation_answer(query, context, relevant_chunks)
        elif any(word in query_lower for word in ['benefit', 'advantage', 'exemption', 'deduction']):
            return self.create_benefit_answer(query, context, relevant_chunks)
        else:
            return self.create_general_answer(query, context, relevant_chunks)
    
    def create_definition_answer(self, query: str, context: str, relevant_chunks: List[Dict]) -> str:
        """Create a definition-style answer"""
        # Extract the most relevant chunk for definition
        top_chunk = relevant_chunks[0]['chunk']
        
        # Look for definition patterns
        definition_lines = []
        for line in top_chunk.split('\n'):
            if line.strip() and (
                'is defined as' in line.lower() or 
                'means' in line.lower() or 
                'includes' in line.lower() or
                'refers to' in line.lower()
            ):
                definition_lines.append(line.strip())
        
        if definition_lines:
            answer = f"**Definition:**\n\n{chr(10).join(definition_lines)}"
        else:
            # Use the most relevant chunk
            answer = f"**Answer:**\n\n{top_chunk}"
        
        # Add additional context if available
        if len(relevant_chunks) > 1:
            additional_info = []
            for chunk_data in relevant_chunks[1:3]:  # Get next 2 chunks
                chunk = chunk_data['chunk']
                if len(chunk.strip()) > 50:  # Only add substantial chunks
                    additional_info.append(chunk.strip())
            
            if additional_info:
                answer += f"\n\n**Additional Information:**\n\n{chr(10).join(additional_info[:2])}"
        
        return answer
    
    def create_process_answer(self, query: str, context: str, relevant_chunks: List[Dict]) -> str:
        """Create a process/procedure-style answer"""
        # Look for numbered lists, bullet points, or step-by-step information
        steps = []
        for chunk_data in relevant_chunks:
            chunk = chunk_data['chunk']
            lines = chunk.split('\n')
            for line in lines:
                line = line.strip()
                if line and (
                    line[0].isdigit() or 
                    line.startswith('•') or 
                    line.startswith('-') or
                    line.lower().startswith('step') or
                    'must' in line.lower() or
                    'should' in line.lower()
                ):
                    steps.append(line)
        
        if steps:
            answer = f"**Process/Steps:**\n\n" + "\n".join(f"• {step}" for step in steps)
        else:
            answer = f"**Procedure:**\n\n{relevant_chunks[0]['chunk']}"
        
        return answer
    
    def create_example_answer(self, query: str, context: str, relevant_chunks: List[Dict]) -> str:
        """Create an example-focused answer"""
        examples = []
        for chunk_data in relevant_chunks:
            chunk = chunk_data['chunk']
            if any(word in chunk.lower() for word in ['example', 'for instance', 'such as', 'like']):
                examples.append(chunk)
        
        if examples:
            answer = f"**Examples:**\n\n" + "\n\n".join(examples)
        else:
            answer = f"**Relevant Information:**\n\n{relevant_chunks[0]['chunk']}"
        
        return answer
    
    def create_calculation_answer(self, query: str, context: str, relevant_chunks: List[Dict]) -> str:
        """Create a calculation/formula-focused answer"""
        # Look for mathematical expressions, percentages, formulas
        calc_info = []
        for chunk_data in relevant_chunks:
            chunk = chunk_data['chunk']
            if any(char in chunk for char in ['%', '₹', '$', '=', '+', '-', '×', '÷']) or \
               any(word in chunk.lower() for word in ['calculate', 'formula', 'rate', 'percentage', 'amount']):
                calc_info.append(chunk)
        
        if calc_info:
            answer = f"**Calculation Information:**\n\n" + "\n\n".join(calc_info)
        else:
            answer = f"**Related Information:**\n\n{relevant_chunks[0]['chunk']}"
        
        return answer
    
    def create_benefit_answer(self, query: str, context: str, relevant_chunks: List[Dict]) -> str:
        """Create a benefits/exemptions-focused answer"""
        benefits = []
        for chunk_data in relevant_chunks:
            chunk = chunk_data['chunk']
            if any(word in chunk.lower() for word in ['benefit', 'exemption', 'deduction', 'allowance', 'relief']):
                benefits.append(chunk)
        
        if benefits:
            answer = f"**Benefits/Exemptions:**\n\n" + "\n\n".join(benefits)
        else:
            answer = f"**Relevant Information:**\n\n{relevant_chunks[0]['chunk']}"
        
        return answer
    
    def create_general_answer(self, query: str, context: str, relevant_chunks: List[Dict]) -> str:
        """Create a general answer"""
        # Combine top chunks for comprehensive answer
        combined_chunks = []
        for chunk_data in relevant_chunks[:3]:  # Use top 3 chunks
            chunk = chunk_data['chunk'].strip()
            if chunk and len(chunk) > 30:  # Only substantial chunks
                combined_chunks.append(chunk)
        
        answer = f"**Answer:**\n\n" + "\n\n".join(combined_chunks)
        return answer
    
    def ask(self, query: str, top_k: int = 5) -> str:
        """
        Main method to ask a question and get an answer
        
        Args:
            query (str): User's question
            top_k (int): Number of relevant chunks to consider
            
        Returns:
            str: Generated answer with sources
        """
        print(f"🔍 Searching for: {query}")
        
        # Find relevant chunks
        relevant_chunks = self.find_relevant_chunks(query, top_k)
        
        if not relevant_chunks:
            return "❌ I couldn't find relevant information in the document to answer your question. Please try rephrasing your question or ask about topics covered in the uploaded document."
        
        print(f"📚 Found {len(relevant_chunks)} relevant chunks")
        
        # Generate answer
        answer = self.generate_contextual_answer(query, relevant_chunks)
        
        return f"💡 **Answer to: {query}**\n\n{answer}"
    
    def interactive_chat(self):
        """Start an interactive chat session"""
        print("🚀 Advanced Tax Assistant RAG Chatbot")
        print("📖 Loaded document knowledge base")
        print("💬 Type your questions (type 'quit' to exit)")
        print("=" * 50)
        
        while True:
            try:
                query = input("\n❓ Your question: ").strip()
                
                if query.lower() in ['quit', 'exit', 'bye', 'q']:
                    print("👋 Goodbye!")
                    break
                
                if not query:
                    print("⚠️ Please enter a question.")
                    continue
                
                answer = self.ask(query)
                print(f"\n{answer}")
                print("\n" + "=" * 50)
                
            except KeyboardInterrupt:
                print("\n👋 Goodbye!")
                break
            except Exception as e:
                print(f"❌ Error: {e}")

def test_chatbot():
    """Test the chatbot with various questions"""
    chatbot = AdvancedRAGChatbot()
    
    test_questions = [
        "What is agricultural income?",
        "How to calculate tax on agricultural income?",
        "What are the exemptions for agricultural income?",
        "Give me examples of agricultural income",
        "What is the definition of income tax?",
        "Tell me about tax deductions",
        "What are the filing requirements?",
        "How do I file my tax returns?"
    ]
    
    print("🧪 Testing Advanced RAG Chatbot")
    print("=" * 60)
    
    for i, question in enumerate(test_questions, 1):
        print(f"\n{i}. Testing: {question}")
        print("-" * 40)
        answer = chatbot.ask(question)
        print(answer)
        print("\n" + "=" * 60)

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "test":
        test_chatbot()
    else:
        chatbot = AdvancedRAGChatbot()
        chatbot.interactive_chat()