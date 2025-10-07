#!/bin/bash

echo "🧪 Testing RAG Chatbot Integration"
echo "===================================="
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test RAG Server Health
echo -e "${BLUE}Test 1: RAG Server Health Check${NC}"
HEALTH_RESPONSE=$(curl -s http://localhost:5555/health)
if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    echo -e "${GREEN}✅ RAG Server is healthy${NC}"
    echo "$HEALTH_RESPONSE" | python3 -m json.tool
else
    echo -e "${RED}❌ RAG Server is not responding${NC}"
    echo "Make sure to start the RAG server first:"
    echo "  cd Backend/RAG_CHATBOT && ./start_rag_server.sh"
fi
echo ""

# Test RAG Query
echo -e "${BLUE}Test 2: RAG Query Test${NC}"
QUERY_RESPONSE=$(curl -s -X POST http://localhost:5555/api/rag/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What is Section 80C?", "top_k": 3}')

if echo "$QUERY_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ RAG Query successful${NC}"
    echo "$QUERY_RESPONSE" | python3 -m json.tool | head -20
else
    echo -e "${RED}❌ RAG Query failed${NC}"
    echo "$QUERY_RESPONSE"
fi
echo ""

# Test Backend API
echo -e "${BLUE}Test 3: Backend Health Check${NC}"
BACKEND_RESPONSE=$(curl -s http://localhost:8080/api/health)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend is responding${NC}"
else
    echo -e "${RED}❌ Backend is not responding${NC}"
    echo "Make sure to start the backend:"
    echo "  cd Backend && npm start"
fi
echo ""

# Test Frontend
echo -e "${BLUE}Test 4: Frontend Check${NC}"
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5174)
if [ "$FRONTEND_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Frontend is running${NC}"
else
    echo -e "${RED}❌ Frontend is not responding${NC}"
    echo "Make sure to start the frontend:"
    echo "  cd Frontend && npm run dev"
fi
echo ""

# Summary
echo -e "${BLUE}===================================="
echo "Test Summary"
echo "====================================${NC}"
echo ""
echo "Service URLs:"
echo "  🌐 Frontend:     http://localhost:5174"
echo "  🌐 Assistant:    http://localhost:5174/assistant"
echo "  🔧 Backend API:  http://localhost:8080/api"
echo "  🤖 RAG Chatbot:  http://localhost:5555/api/rag"
echo ""
echo "Next Steps:"
echo "  1. Open http://localhost:5174 in your browser"
echo "  2. Register/Login"
echo "  3. Navigate to /assistant"
echo "  4. Ask questions about Income Tax Act"
echo ""
