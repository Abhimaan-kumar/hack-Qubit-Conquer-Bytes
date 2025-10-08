import os
from typing import Dict, List, Optional
from datetime import datetime
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from pymongo import MongoClient
from dotenv import load_dotenv
from document_processor import DocumentProcessor
from claude_integration import ClaudeIntegration

load_dotenv()

app = Flask(__name__)

# Initialize MongoDB connection
mongo_client = MongoClient(os.getenv('MONGODB_URI'))
db = mongo_client[os.getenv('MONGODB_DB_NAME', 'tax-assistant')]
conversations = db.conversations
documents = db.documents

# Initialize our components
document_processor = DocumentProcessor()
claude = ClaudeIntegration()

def require_api_key(f):
    """Decorator to require API key for routes."""
    def decorated_function(*args, **kwargs):
        api_key = request.headers.get('X-API-Key')
        if not api_key or api_key != os.getenv('API_KEY'):
            return jsonify({"error": "Invalid API key"}), 401
        return f(*args, **kwargs)
    return decorated_function

def get_conversation_history(conversation_id: str, limit: int = 10) -> List[Dict]:
    """Retrieve conversation history from MongoDB."""
    history = conversations.find(
        {"conversation_id": conversation_id},
        {"_id": 0}
    ).sort("timestamp", -1).limit(limit)
    return list(history)

@app.route('/rag/upload', methods=['POST'])
@require_api_key
def upload_document():
    """Upload and process a document."""
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files['file']
    if not file.filename:
        return jsonify({"error": "No file selected"}), 400
    
    filename = secure_filename(file.filename)
    file_path = os.path.join('RAG_CHATBOT', 'uploads', filename)
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    file.save(file_path)
    
    try:
        doc_id = document_processor.process_document(file_path)
        
        # Store document metadata in MongoDB
        documents.insert_one({
            "doc_id": doc_id,
            "filename": filename,
            "upload_date": datetime.now(),
            "status": "processed",
            "user_id": request.headers.get('X-User-ID')
        })
        
        return jsonify({
            "message": "Document processed successfully",
            "doc_id": doc_id
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        # Clean up local file after processing
        if os.path.exists(file_path):
            os.remove(file_path)

@app.route('/rag/query', methods=['POST'])
@require_api_key
def query():
    """Process a query using RAG."""
    data = request.json
    if not data or 'query' not in data:
        return jsonify({"error": "No query provided"}), 400
    
    query = data['query']
    conversation_id = data.get('conversation_id')
    k = int(data.get('top_k', os.getenv('TOP_K_RESULTS', 5)))
    
    # Get relevant chunks from documents
    chunks = document_processor.search(query, k=k)
    
    # Get conversation history if conversation_id is provided
    history = []
    if conversation_id:
        history = get_conversation_history(
            conversation_id,
            limit=int(os.getenv('MAX_HISTORY_MESSAGES', 10))
        )
    
    # Get response from Claude
    response = claude.get_response(query, history, chunks)
    
    # Store the interaction in conversation history
    if conversation_id:
        # Store user message
        conversations.insert_one({
            "conversation_id": conversation_id,
            "content": query,
            "is_bot": False,
            "timestamp": datetime.now(),
            "user_id": request.headers.get('X-User-ID')
        })
        
        # Store bot response
        conversations.insert_one({
            "conversation_id": conversation_id,
            "content": response,
            "is_bot": True,
            "timestamp": datetime.now(),
            "user_id": request.headers.get('X-User-ID')
        })
    
    return jsonify({
        "reply": response,
        "sources": [
            {
                "doc_id": chunk["doc_id"],
                "chunk_id": chunk["chunk_id"],
                "score": chunk["score"],
                "file_name": chunk["file_name"]
            }
            for chunk in chunks
        ],
        "conversation_id": conversation_id
    }), 200

@app.route('/rag/documents', methods=['GET'])
@require_api_key
def list_documents():
    """List all processed documents."""
    user_id = request.headers.get('X-User-ID')
    query = {"user_id": user_id} if user_id else {}
    docs = list(documents.find(query, {"_id": 0}))
    return jsonify(docs), 200

@app.route('/rag/documents/<doc_id>', methods=['DELETE'])
@require_api_key
def delete_document(doc_id):
    """Delete a document and its chunks."""
    try:
        # Check user ownership
        user_id = request.headers.get('X-User-ID')
        doc = documents.find_one({"doc_id": doc_id, "user_id": user_id})
        if not doc:
            return jsonify({"error": "Document not found or access denied"}), 404
            
        document_processor.delete_document(doc_id)
        documents.delete_one({"doc_id": doc_id})
        return jsonify({"message": "Document deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/rag/conversations/<conversation_id>', methods=['DELETE'])
@require_api_key
def delete_conversation(conversation_id):
    """Delete a conversation history."""
    try:
        # Check user ownership
        user_id = request.headers.get('X-User-ID')
        if not user_id:
            return jsonify({"error": "User ID required"}), 400
            
        result = conversations.delete_many({
            "conversation_id": conversation_id,
            "user_id": user_id
        })
        return jsonify({
            "message": "Conversation deleted successfully",
            "deleted_count": result.deleted_count
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/rag/cleanup', methods=['POST'])
@require_api_key
def cleanup_user_data():
    """Clean up all data for a user (called during logout)."""
    try:
        user_id = request.headers.get('X-User-ID')
        if not user_id:
            return jsonify({"error": "User ID required"}), 400
            
        # Delete all conversations for the user
        conversations.delete_many({"user_id": user_id})
        
        # Delete all documents uploaded by the user
        user_docs = documents.find({"user_id": user_id})
        for doc in user_docs:
            try:
                document_processor.delete_document(doc['doc_id'])
            except Exception as e:
                print(f"Error deleting document {doc['doc_id']}: {e}")
        
        documents.delete_many({"user_id": user_id})
        
        return jsonify({
            "message": "User data cleaned up successfully"
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=int(os.getenv('RAG_SERVICE_PORT', 5001)),
        debug=os.getenv('FLASK_DEBUG', '0') == '1'
    )