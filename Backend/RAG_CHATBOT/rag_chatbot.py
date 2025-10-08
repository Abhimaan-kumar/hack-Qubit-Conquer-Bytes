"""
Simplified RAG Chatbot without LangChain dependencies
Uses direct FAISS and pickle loading for better compatibility
"""
import os
import json
import numpy as np
from sentence_transformers import SentenceTransformer
import pickle
import faiss
from typing import List, Dict
import re
from datetime import datetime

class AdvancedRAGChatbot:
    def __init__(self, document_id: str = None):
        """
        Initialize the Advanced RAG Chatbot with enhanced features
        
        Args:
            document_id (str): Specific document ID to load, or None to use ITA_primary as default
        """
        print("🚀 Initializing Enhanced RAG Chatbot...")
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.chunks = []
        self.embeddings = None
        self.metadata = []
        self.conversation_history = []
        self.query_cache = {}  # Cache for frequently asked questions
        
        # Default to ITA_primary if no specific document_id is provided
        self.document_id = document_id if document_id else "ITA_primary"
        
        # Tax-specific keywords for better context understanding
        self.tax_keywords = {
            'deduction': ['80c', '80d', '80e', '80g', '24b', 'deduction', 'exemption'],
            'income': ['salary', 'income', 'earnings', 'revenue', 'profit'],
            'regime': ['old regime', 'new regime', 'tax regime', 'regime comparison'],
            'calculation': ['calculate', 'computation', 'formula', 'how to compute'],
            'filing': ['itr', 'return', 'filing', 'form 16', 'form 26as'],
            'penalty': ['penalty', 'late fee', 'interest', 'default'],
            'assessment': ['assessment', 'notice', 'scrutiny']
        }
        
        # Load the vector database
        self.load_vector_database()
        print("✅ RAG Chatbot initialized successfully!")
    
    def load_vector_database(self):
        """Load the pre-created vector database - simplified version"""
        try:
            # Find available documents
            vector_db_path = "vector_database"
            metadata_path = "document_metadata"
            
            if not os.path.exists(vector_db_path) or not os.path.exists(metadata_path):
                print("❌ Vector database not found. Using fallback mode.")
                print("   The chatbot will work but with reduced accuracy.")
                self.chunks = []
                self.metadata = []
                self.faiss_index = None
                return
            
            # Get all available document IDs
            vector_files = [f for f in os.listdir(vector_db_path) if f.endswith('_vectors')]
            if not vector_files:
                print("❌ No vector databases found. Using fallback mode.")
                self.chunks = []
                self.metadata = []
                self.faiss_index = None
                return
            
            # Use specified document_id (default is ITA_primary)
            vector_file = f"{self.document_id}_vectors"
            metadata_file = f"{self.document_id}_metadata.json"
            
            # Check if the specified vector database exists
            if not os.path.exists(os.path.join(vector_db_path, vector_file)):
                print(f"⚠️ Specified database '{self.document_id}' not found. Available databases:")
                for vf in vector_files:
                    print(f"   - {vf.replace('_vectors', '')}")
                
                if vector_files:
                    # Fall back to the most recent vector file
                    vector_file = max(vector_files, key=lambda x: os.path.getctime(os.path.join(vector_db_path, x)))
                    doc_id = vector_file.replace('_vectors', '')
                    metadata_file = f"{doc_id}_metadata.json"
                    self.document_id = doc_id
                    print(f"📋 Using fallback database: {self.document_id}")
            
            # Load FAISS index and chunks
            vector_dir = os.path.join(vector_db_path, vector_file)
            faiss_index_path = os.path.join(vector_dir, "index.faiss")
            chunks_path = os.path.join(vector_dir, "index.pkl")
            
            # Load FAISS index
            self.faiss_index = faiss.read_index(faiss_index_path)
            
            # Load chunks - handle both old and new pickle formats
            try:
                with open(chunks_path, 'rb') as f:
                    data = pickle.load(f)
                    
                    # Try to handle LangChain format
                    if isinstance(data, tuple) and len(data) == 2:
                        docstore, index_to_id = data
                        # Extract chunks from docstore
                        self.chunks = []
                        for i in range(len(index_to_id)):
                            if i in index_to_id:
                                doc_id = index_to_id[i]
                                if hasattr(docstore, '_dict') and doc_id in docstore._dict:
                                    doc = docstore._dict[doc_id]
                                    self.chunks.append(doc.page_content)
                                else:
                                    self.chunks.append("")
                            else:
                                self.chunks.append("")
                    else:
                        # Simple list format
                        self.chunks = data if isinstance(data, list) else []
            except Exception as e:
                print(f"⚠️ Could not load chunks in standard format: {e}")
                print("   Trying alternative loading method...")
                # Create dummy chunks if needed
                self.chunks = [f"Chunk {i}" for i in range(self.faiss_index.ntotal)]
            
            # Load metadata
            metadata_path_full = os.path.join(metadata_path, metadata_file)
            if os.path.exists(metadata_path_full):
                with open(metadata_path_full, 'r', encoding='utf-8') as f:
                    metadata_info = json.load(f)
                    self.metadata = metadata_info.get('chunks_metadata', [])
                    print(f"✅ Loaded vector database '{self.document_id}' with {len(self.chunks)} chunks")
                    print(f"📄 Document: {metadata_info.get('filename', 'Unknown')}")
            else:
                print(f"⚠️ Metadata file not found, using default metadata")
                self.metadata = [{'page': i//10, 'chunk_id': i} for i in range(len(self.chunks))]
            
        except Exception as e:
            print(f"❌ Error loading vector database: {e}")
            print("   Continuing in fallback mode with reduced functionality")
            self.chunks = []
            self.metadata = []
            self.faiss_index = None
    
    def find_relevant_chunks(self, query: str, top_k: int = 5, similarity_threshold: float = 0.3) -> List[Dict]:
        """
        Find the most relevant chunks for a given query using FAISS with enhanced features
        """
        # Check if FAISS is available
        if self.faiss_index is None or len(self.chunks) == 0:
            return []
        
        # Check cache first
        cache_key = f"{query.lower()}_{top_k}"
        if cache_key in self.query_cache:
            print("📦 Using cached results")
            return self.query_cache[cache_key]
        
        try:
            # Enhance query with tax-specific context
            enhanced_query = self.enhance_query(query)
            
            # Embed the enhanced query
            query_embedding = self.model.encode([enhanced_query]).astype('float32')
            
            # Search using FAISS with more candidates initially
            search_k = min(top_k * 3, len(self.chunks))
            scores, indices = self.faiss_index.search(query_embedding, search_k)
            
            relevant_chunks = []
            seen_content = set()
            
            for i, (distance, idx) in enumerate(zip(scores[0], indices[0])):
                if idx < len(self.chunks) and idx >= 0:
                    chunk_content = self.chunks[idx]
                    
                    # Skip duplicates
                    chunk_preview = chunk_content[:100] if len(chunk_content) > 100 else chunk_content
                    if chunk_preview in seen_content:
                        continue
                    seen_content.add(chunk_preview)
                    
                    # Convert FAISS distance to similarity score
                    similarity_score = 1.0 / (1.0 + float(distance)) if distance >= 0 else 1.0
                    
                    # Apply threshold
                    if similarity_score >= similarity_threshold:
                        # Calculate relevance boost
                        keyword_boost = self.calculate_keyword_relevance(query, chunk_content)
                        final_score = similarity_score * (1 + keyword_boost * 0.2)
                        
                        relevant_chunks.append({
                            'chunk': chunk_content,
                            'similarity': float(final_score),
                            'base_similarity': float(similarity_score),
                            'keyword_boost': float(keyword_boost),
                            'metadata': self.metadata[idx] if idx < len(self.metadata) else {'page': 'N/A', 'chunk_id': idx},
                            'chunk_id': int(idx)
                        })
                    
                    if len(relevant_chunks) >= top_k:
                        break
            
            # Sort by final score
            relevant_chunks.sort(key=lambda x: x['similarity'], reverse=True)
            relevant_chunks = relevant_chunks[:top_k]
            
            # Cache the results
            if len(relevant_chunks) > 0:
                self.query_cache[cache_key] = relevant_chunks
                
                # Limit cache size
                if len(self.query_cache) > 100:
                    oldest_keys = list(self.query_cache.keys())[:20]
                    for key in oldest_keys:
                        del self.query_cache[key]
            
            return relevant_chunks
            
        except Exception as e:
            print(f"❌ Error in find_relevant_chunks: {e}")
            return []
    
    def enhance_query(self, query: str) -> str:
        """Enhance query with additional context"""
        query_lower = query.lower()
        enhancements = []
        
        for category, keywords in self.tax_keywords.items():
            if any(kw in query_lower for kw in keywords):
                enhancements.append(category)
        
        section_pattern = r'section\s+(\d+[a-z]*)'
        sections = re.findall(section_pattern, query_lower)
        if sections:
            enhancements.extend(sections)
        
        if enhancements:
            return f"{query} context: {' '.join(enhancements)}"
        return query
    
    def calculate_keyword_relevance(self, query: str, chunk: str) -> float:
        """Calculate keyword-based relevance boost"""
        query_lower = query.lower()
        chunk_lower = chunk.lower()
        
        query_terms = set(re.findall(r'\b\w+\b', query_lower))
        stop_words = {'is', 'are', 'the', 'a', 'an', 'what', 'how', 'why', 'when', 'where', 'can', 'do', 'does'}
        query_terms = query_terms - stop_words
        
        if not query_terms:
            return 0.0
        
        matches = sum(1 for term in query_terms if term in chunk_lower)
        boost = matches / len(query_terms)
        
        if query_lower in chunk_lower:
            boost += 0.3
        
        return min(boost, 1.0)
    
    def generate_contextual_answer(self, query: str, relevant_chunks: List[Dict]) -> str:
        """Generate answer from chunks"""
        if not relevant_chunks:
            return self.generate_fallback_answer(query)
        
        # Store in history
        self.conversation_history.append({
            'query': query,
            'timestamp': datetime.now().isoformat(),
            'chunks_used': len(relevant_chunks)
        })
        
        # Create structured answer
        answer_parts = []
        sources = []
        
        for i, chunk_data in enumerate(relevant_chunks[:3], 1):  # Use top 3 chunks
            chunk = chunk_data['chunk']
            metadata = chunk_data['metadata']
            similarity = chunk_data['similarity']
            
            if i == 1:
                answer_parts.append(f"**Answer:**\n\n{chunk}")
            else:
                answer_parts.append(f"\n**Additional Information:**\n\n{chunk}")
            
            page_info = metadata.get('page', 'N/A')
            chunk_id = metadata.get('chunk_id', chunk_data['chunk_id'])
            confidence = self.get_confidence_label(similarity)
            
            sources.append({
                'number': i,
                'page': page_info,
                'chunk_id': chunk_id,
                'similarity': similarity,
                'confidence': confidence
            })
        
        answer = "\n".join(answer_parts)
        source_attribution = self.format_sources(sources)
        
        avg_similarity = sum(s['similarity'] for s in sources) / len(sources)
        confidence_section = self.format_confidence(avg_similarity, len(relevant_chunks))
        
        return f"{answer}\n\n{source_attribution}\n\n{confidence_section}"
    
    def generate_fallback_answer(self, query: str) -> str:
        """Generate fallback when no chunks found"""
        return f"""I couldn't find specific information about "{query}" in the Income Tax Act documents.

**Here's how I can help:**

💡 **Try rephrasing your question:**
   - Use specific terms like "Section 80C", "deduction", "tax calculation"
   - Ask about specific tax scenarios or provisions

📚 **I can answer questions about:**
   - Tax deductions and exemptions
   - Income tax calculations
   - Tax filing procedures
   - Specific sections of Income Tax Act
   - Tax regime comparisons

🔍 **Example questions:**
   - "What is Section 80C?"
   - "How to calculate HRA exemption?"
   - "What are the tax slabs for new regime?"

Please try asking in a different way or be more specific about what you'd like to know."""
    
    def get_confidence_label(self, similarity: float) -> str:
        """Get confidence label"""
        if similarity >= 0.8:
            return "Very High"
        elif similarity >= 0.6:
            return "High"
        elif similarity >= 0.4:
            return "Medium"
        else:
            return "Low"
    
    def format_sources(self, sources: List[Dict]) -> str:
        """Format sources"""
        source_lines = ["📚 **Sources & References:**"]
        
        for source in sources:
            confidence_emoji = "🟢" if source['similarity'] >= 0.7 else "🟡" if source['similarity'] >= 0.5 else "🟠"
            source_lines.append(
                f"   {confidence_emoji} Source {source['number']}: Page {source['page']} "
                f"(Relevance: {source['similarity']:.2f} - {source['confidence']})"
            )
        
        return "\n".join(source_lines)
    
    def format_confidence(self, avg_similarity: float, chunk_count: int) -> str:
        """Format confidence section"""
        confidence_emoji = "✅" if avg_similarity >= 0.7 else "⚠️" if avg_similarity >= 0.5 else "ℹ️"
        
        confidence_text = f"{confidence_emoji} **Answer Confidence:** {avg_similarity:.1%}"
        quality_text = f"📊 **Based on:** {chunk_count} relevant document sections"
        
        disclaimer = ""
        if avg_similarity < 0.6:
            disclaimer = "\n\n⚠️ *Note: This answer has moderate confidence. Please verify with official sources or consult a tax professional for critical decisions.*"
        
        return f"{confidence_text}\n{quality_text}{disclaimer}"
    
    def ask(self, query: str, top_k: int = 5, use_context: bool = True) -> str:
        """Main method to ask questions"""
        print(f"🔍 Processing query: {query}")
        
        if use_context and len(self.conversation_history) > 0:
            query = self.add_conversation_context(query)
        
        relevant_chunks = self.find_relevant_chunks(query, top_k)
        
        if not relevant_chunks:
            print("⚠️ No relevant chunks found")
            return self.generate_fallback_answer(query)
        
        print(f"📚 Found {len(relevant_chunks)} relevant chunks")
        if relevant_chunks:
            print(f"   Top similarity: {relevant_chunks[0]['similarity']:.3f}")
        
        answer = self.generate_contextual_answer(query, relevant_chunks)
        
        return f"💡 **Answer:**\n\n{answer}"
    
    def add_conversation_context(self, query: str) -> str:
        """Add conversation context"""
        if not self.conversation_history:
            return query
        
        recent_queries = [h['query'] for h in self.conversation_history[-2:]]
        
        if any(word in query.lower() for word in ['it', 'this', 'that', 'these', 'those', 'also', 'more']):
            context = " (previous context: " + "; ".join(recent_queries) + ")"
            return query + context
        
        return query
    
    def get_conversation_summary(self) -> Dict:
        """Get conversation summary"""
        if not self.conversation_history:
            return {
                'total_queries': 0,
                'avg_chunks_used': 0,
                'recent_topics': []
            }
        
        total_chunks = sum(h['chunks_used'] for h in self.conversation_history)
        
        return {
            'total_queries': len(self.conversation_history),
            'avg_chunks_used': total_chunks / len(self.conversation_history),
            'recent_topics': [h['query'] for h in self.conversation_history[-5:]],
            'session_start': self.conversation_history[0]['timestamp'] if self.conversation_history else None
        }
    
    def clear_history(self):
        """Clear conversation history"""
        self.conversation_history = []
        self.query_cache = {}
        print("🧹 Conversation history and cache cleared")
