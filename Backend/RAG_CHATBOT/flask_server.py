"""
Flask server to integrate RAG chatbot with the Node.js backend
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
from rag_chatbot import AdvancedRAGChatbot
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize the chatbot
chatbot = None

def init_chatbot():
    """Initialize the chatbot instance"""
    global chatbot
    try:
        # Initialize with ITA_primary by default
        chatbot = AdvancedRAGChatbot("ITA_primary")
        print("✅ RAG Chatbot initialized successfully")
        return True
    except Exception as e:
        print(f"❌ Error initializing chatbot: {e}")
        return False

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'chatbot_ready': chatbot is not None,
        'message': 'RAG Chatbot server is running'
    })

@app.route('/api/rag/query', methods=['POST'])
def query_chatbot():
    """
    Handle chatbot queries
    
    Expected JSON payload:
    {
        "query": "user question",
        "top_k": 5 (optional),
        "document_id": "ITA_primary" (optional)
    }
    """
    global chatbot
    
    try:
        data = request.get_json()
        
        if not data or 'query' not in data:
            return jsonify({
                'success': False,
                'error': 'Query is required'
            }), 400
        
        query = data['query']
        top_k = data.get('top_k', 5)
        document_id = data.get('document_id', None)
        
        # Reinitialize chatbot if document_id is different
        if document_id and chatbot.document_id != document_id:
            chatbot = AdvancedRAGChatbot(document_id)
        
        # Get answer from chatbot
        answer = chatbot.ask(query, top_k)
        
        # Get relevant chunks for additional info
        relevant_chunks = chatbot.find_relevant_chunks(query, top_k)
        
        return jsonify({
            'success': True,
            'data': {
                'query': query,
                'answer': answer,
                'relevant_chunks_count': len(relevant_chunks),
                'document_id': chatbot.document_id,
                'sources': [
                    {
                        'page': chunk['metadata'].get('page', 'N/A'),
                        'chunk_id': chunk['chunk_id'],
                        'similarity': chunk['similarity']
                    }
                    for chunk in relevant_chunks
                ]
            }
        })
        
    except Exception as e:
        print(f"❌ Error processing query: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/rag/documents', methods=['GET'])
def list_documents():
    """List available vector databases"""
    try:
        vector_db_path = "vector_database"
        
        if not os.path.exists(vector_db_path):
            return jsonify({
                'success': True,
                'documents': []
            })
        
        # Get all vector databases
        vector_files = [f.replace('_vectors', '') for f in os.listdir(vector_db_path) if f.endswith('_vectors')]
        
        return jsonify({
            'success': True,
            'documents': vector_files,
            'current': chatbot.document_id if chatbot else None
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/rag/switch', methods=['POST'])
def switch_document():
    """Switch to a different document database"""
    global chatbot
    
    try:
        data = request.get_json()
        document_id = data.get('document_id')
        
        if not document_id:
            return jsonify({
                'success': False,
                'error': 'document_id is required'
            }), 400
        
        # Reinitialize chatbot with new document
        chatbot = AdvancedRAGChatbot(document_id)
        
        return jsonify({
            'success': True,
            'message': f'Switched to document: {document_id}',
            'current_document': chatbot.document_id
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    print("🚀 Starting RAG Chatbot Flask Server...")
    print("📂 Working directory:", os.getcwd())
    
    # Initialize chatbot
    if not init_chatbot():
        print("⚠️ Warning: Chatbot initialization failed. Server will start but queries will fail.")
    
    # Start Flask server
    port = int(os.environ.get('FLASK_PORT', 5555))
    print(f"🌐 Server running on http://localhost:{port}")
    print(f"📝 API endpoint: http://localhost:{port}/api/rag/query")
    
    app.run(host='0.0.0.0', port=port, debug=True)
