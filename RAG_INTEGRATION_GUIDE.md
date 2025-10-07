# RAG Chatbot Integration - Complete Setup Guide

## 🎯 Overview

This guide covers the integration of a Python-based RAG (Retrieval-Augmented Generation) Chatbot with the TaxEase application. The RAG chatbot uses FAISS vector search and sentence transformers to provide intelligent, context-aware responses based on Income Tax Act documents.

## 🏗️ Architecture

```
┌─────────────────┐
│  React Frontend │ (Port 5174)
│  (Vite)         │
└────────┬────────┘
         │ HTTP/REST
         ▼
┌─────────────────┐
│  Node.js Backend│ (Port 8080)
│  (Express)      │
└────────┬────────┘
         │ HTTP/REST
         ▼
┌─────────────────┐
│  Flask RAG      │ (Port 5555)
│  Server (Python)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  FAISS Vector   │
│  Database       │
└─────────────────┘
```

## 📦 Components

### 1. Flask RAG Server (`Backend/RAG_CHATBOT/flask_server.py`)
- **Port**: 5555
- **Framework**: Flask with Flask-CORS
- **Endpoints**:
  - `GET /health` - Health check
  - `POST /api/rag/query` - Query the chatbot
  - `GET /api/rag/documents` - List available vector databases
  - `POST /api/rag/switch` - Switch document database

### 2. Node.js Backend Integration (`Backend/routes/ai.js`)
- Updated to call Flask RAG server
- Automatic fallback to mock responses if RAG unavailable
- Enhanced error handling and logging

### 3. Frontend Assistant Page
- Already configured at `/assistant` route
- Calls Node.js backend which proxies to Flask RAG server

## 🚀 Installation & Setup

### Step 1: Install Python Dependencies

```bash
cd Backend/RAG_CHATBOT

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # On macOS/Linux
# venv\Scripts\activate    # On Windows

# Install dependencies
pip install -r requirements.txt
```

**Required Python Packages**:
- flask==3.0.0
- flask-cors==4.0.0
- sentence-transformers==2.2.2
- scikit-learn==1.3.2
- numpy==1.24.3
- faiss-cpu==1.7.4
- langchain==0.1.0
- PyPDF2==3.0.1

### Step 2: Install Node.js Dependencies

```bash
cd ../../Backend
npm install axios --save
```

### Step 3: Configure Environment Variables

Update `Backend/.env`:
```properties
# RAG Chatbot Configuration
RAG_SERVER_URL=http://localhost:5555
USE_RAG_CHATBOT=true
```

## 🎮 Usage

### Starting All Services (Automated)

Use the provided startup script:

```bash
chmod +x start-all.sh
./start-all.sh
```

This will:
1. ✅ Check prerequisites (Node.js, Python, MongoDB)
2. ✅ Install dependencies
3. ✅ Start MongoDB
4. ✅ Start RAG Chatbot Server (port 5555)
5. ✅ Start Backend Server (port 8080)
6. ✅ Start Frontend Server (port 5174)

### Starting Services Manually

#### 1. Start MongoDB
```bash
brew services start mongodb-community
# or
mongod
```

#### 2. Start RAG Chatbot Server
```bash
cd Backend/RAG_CHATBOT
./start_rag_server.sh
```

Or manually:
```bash
cd Backend/RAG_CHATBOT
source venv/bin/activate
export FLASK_PORT=5555
python flask_server.py
```

#### 3. Start Backend Server
```bash
cd Backend
npm start
```

#### 4. Start Frontend Server
```bash
cd Frontend
npm run dev
```

### Stopping All Services

```bash
chmod +x stop-all.sh
./stop-all.sh
```

## 🧪 Testing the Integration

### Test RAG Server Health

```bash
curl http://localhost:5555/health
```

Expected response:
```json
{
  "status": "healthy",
  "chatbot_ready": true,
  "message": "RAG Chatbot server is running"
}
```

### Test RAG Query

```bash
curl -X POST http://localhost:5555/api/rag/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is Section 80C?",
    "top_k": 5
  }'
```

### Test Through Backend

```bash
# First, register/login to get JWT token
TOKEN="your-jwt-token"

curl -X POST http://localhost:8080/api/ai/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "query": "What are the tax deduction limits under Section 80C?",
    "queryType": "deduction_guidance"
  }'
```

### Test Through Frontend

1. Open browser: `http://localhost:5174`
2. Login/Register
3. Navigate to `/assistant`
4. Ask questions about Income Tax Act

## 📁 Vector Database Setup

The RAG chatbot requires pre-processed vector databases. Your project already has:

```
Backend/RAG_CHATBOT/
├── vector_database/
│   ├── doc_comprehensive_tax_guide_1759852974_vectors/
│   │   ├── index.faiss
│   │   └── index.pkl
│   ├── doc_ita-1961-amended_1759853795_vectors/
│   │   ├── index.faiss
│   │   └── index.pkl
│   └── doc_test_document_1759853728_vectors/
│       ├── index.faiss
│       └── index.pkl
└── document_metadata/
    ├── doc_comprehensive_tax_guide_1759852974_metadata.json
    ├── doc_ita-1961-amended_1759853795_metadata.json
    └── doc_test_document_1759853728_metadata.json
```

### To Create New Vector Databases

```bash
cd Backend/RAG_CHATBOT
python document_vectorizer.py
```

## 🔧 Configuration

### Flask Server Configuration

In `flask_server.py`, you can modify:

```python
# Change port
port = int(os.environ.get('FLASK_PORT', 5555))

# Change default document
chatbot = AdvancedRAGChatbot("ITA_primary")

# Adjust top_k for more/fewer results
top_k = data.get('top_k', 5)  # Default 5 chunks
```

### Backend Configuration

In `Backend/routes/ai.js`:

```javascript
// Disable RAG temporarily
const USE_RAG_CHATBOT = false;

// Change timeout
timeout: 30000  // 30 seconds
```

### Frontend Configuration

The assistant page is already configured. To customize:

Edit `Frontend/src/pages/ChatAssistant.jsx`:
```javascript
// Change query type
await apiClient.sendAIQuery(message, 'general');
```

## 🎯 API Reference

### Flask RAG Server

#### POST /api/rag/query

Request:
```json
{
  "query": "What is the tax rate for income above 10 lakhs?",
  "top_k": 5,
  "document_id": "ITA_primary"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "query": "What is the tax rate for income above 10 lakhs?",
    "answer": "For income above Rs 10,00,000...",
    "relevant_chunks_count": 5,
    "document_id": "ITA_primary",
    "sources": [
      {
        "page": 42,
        "chunk_id": 123,
        "similarity": 0.89
      }
    ]
  }
}
```

#### GET /api/rag/documents

Response:
```json
{
  "success": true,
  "documents": [
    "doc_comprehensive_tax_guide_1759852974",
    "doc_ita-1961-amended_1759853795"
  ],
  "current": "ITA_primary"
}
```

### Node.js Backend

#### POST /api/ai/query

Request:
```json
{
  "query": "Explain Section 80D deductions",
  "queryType": "deduction_guidance",
  "sessionId": "session_123"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "query": "Explain Section 80D deductions",
    "response": "Section 80D allows deductions for...",
    "queryType": "deduction_guidance",
    "confidence": 0.87,
    "sources": [
      {
        "type": "income_tax_act",
        "reference": "Page 42",
        "section": "Chunk 123",
        "similarity": 0.89
      }
    ],
    "sessionId": "session_123"
  }
}
```

## 🐛 Troubleshooting

### RAG Server Not Starting

**Issue**: Flask server fails to start

**Solutions**:
1. Check Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Verify vector databases exist:
   ```bash
   ls Backend/RAG_CHATBOT/vector_database/
   ```

3. Check logs:
   ```bash
   tail -f logs/rag_server.log
   ```

### Port Already in Use

**Issue**: Port 5555 already occupied

**Solution**:
```bash
lsof -ti :5555 | xargs kill -9
```

Or change port in `.env`:
```properties
RAG_SERVER_URL=http://localhost:5556
```

And in `start_rag_server.sh`:
```bash
export FLASK_PORT=5556
```

### Backend Can't Connect to RAG

**Issue**: Node.js backend receives connection errors

**Check**:
1. RAG server is running:
   ```bash
   curl http://localhost:5555/health
   ```

2. Firewall not blocking port 5555

3. Check backend logs:
   ```bash
   tail -f logs/backend.log
   ```

**Temporary workaround**: Disable RAG in `.env`:
```properties
USE_RAG_CHATBOT=false
```

### No Vector Databases Found

**Issue**: "Failed to load vector database"

**Solution**:
1. Run document vectorizer:
   ```bash
   cd Backend/RAG_CHATBOT
   python document_vectorizer.py
   ```

2. Ensure PDFs exist in `Backend/` directory:
   - `comprehensive_tax_guide.pdf`
   - `ita-1961-amended.pdf`

### Low Confidence Scores

**Issue**: RAG returns low confidence (<0.5)

**Solutions**:
1. Increase `top_k` parameter:
   ```python
   top_k = 10  # Instead of 5
   ```

2. Improve document chunking in `document_vectorizer.py`

3. Use better embedding model (requires more memory):
   ```python
   model = SentenceTransformer('all-mpnet-base-v2')
   ```

## 📊 Monitoring

### View Logs in Real-Time

```bash
# Backend
tail -f logs/backend.log

# Frontend
tail -f logs/frontend.log

# RAG Server
tail -f logs/rag_server.log
```

### Check Service Health

```bash
# RAG Health
curl http://localhost:5555/health

# Backend Health
curl http://localhost:8080/api/health

# Frontend
curl http://localhost:5174
```

### Monitor Resource Usage

```bash
# CPU and Memory
top -pid $(cat logs/rag_server.pid)
top -pid $(cat logs/backend.pid)
```

## 🚀 Performance Optimization

### 1. Vector Search Optimization

In `rag_chatbot.py`:
```python
# Use GPU if available (requires faiss-gpu)
import faiss
faiss.index_factory(d, "IVF100,Flat")  # For large databases
```

### 2. Caching Responses

Add Redis caching in `flask_server.py`:
```python
from flask_caching import Cache

cache = Cache(app, config={'CACHE_TYPE': 'redis'})

@cache.memoize(timeout=300)  # Cache for 5 minutes
def query_chatbot(query, top_k):
    # ... existing code
```

### 3. Load Balancing

For production, use Gunicorn:
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5555 flask_server:app
```

## 📝 Service URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:5174 | React UI |
| Backend API | http://localhost:8080/api | REST API |
| RAG Chatbot | http://localhost:5555/api/rag | Vector search |
| Assistant Page | http://localhost:5174/assistant | Chat interface |

## ✅ Verification Checklist

- [ ] MongoDB is running
- [ ] Python virtual environment is activated
- [ ] Flask dependencies installed
- [ ] Vector databases exist
- [ ] RAG server responds to `/health`
- [ ] Backend can connect to RAG server
- [ ] Frontend can access `/assistant` page
- [ ] JWT authentication works
- [ ] Queries return meaningful responses
- [ ] Confidence scores > 0.5

## 🎓 Next Steps

1. **Add More Documents**: Process additional PDF files
2. **Improve Embeddings**: Try better transformer models
3. **Add Context Memory**: Store conversation history
4. **Deploy to Production**: Use Docker containers
5. **Monitor Performance**: Add logging and metrics
6. **A/B Testing**: Compare RAG vs mock responses

## 📚 Documentation

- Flask: https://flask.palletsprojects.com/
- FAISS: https://github.com/facebookresearch/faiss
- Sentence Transformers: https://www.sbert.net/
- LangChain: https://python.langchain.com/

---

**Last Updated**: 2024
**Version**: 1.0.0
**Status**: ✅ Production Ready
