#!/bin/bash

# Test script to verify the complete chat flow
echo "🔍 Testing Tax Assistant Chat Flow"
echo "===================================="
echo ""

# Step 1: Test backend health
echo "1️⃣ Checking Backend Health..."
BACKEND_STATUS=$(curl -s http://localhost:8080/api/health 2>/dev/null || echo "FAILED")
if [[ "$BACKEND_STATUS" == *"success"* ]]; then
    echo "   ✅ Backend is healthy"
else
    echo "   ❌ Backend is not responding"
    echo "   Response: $BACKEND_STATUS"
fi
echo ""

# Step 2: Test RAG server health  
echo "2️⃣ Checking RAG Server Health..."
RAG_STATUS=$(curl -s http://localhost:5555/health 2>/dev/null || echo "FAILED")
if [[ "$RAG_STATUS" == *"healthy"* ]]; then
    echo "   ✅ RAG Server is healthy"
    echo "   Status: $(echo $RAG_STATUS | python3 -m json.tool 2>/dev/null || echo $RAG_STATUS)"
else
    echo "   ❌ RAG Server is not responding"
fi
echo ""

# Step 3: Test authentication
echo "3️⃣ Testing User Authentication..."
# Register or login (adjust email/password as needed)
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "Test123!@#"}' 2>/dev/null)

if [[ "$LOGIN_RESPONSE" == *"token"* ]]; then
    echo "   ✅ Login successful"
    TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    echo "   Token: ${TOKEN:0:50}..."
else
    echo "   ⚠️ Login failed, trying to register first..."
    REGISTER_RESPONSE=$(curl -s -X POST http://localhost:8080/api/auth/register \
      -H "Content-Type: application/json" \
      -d '{"name": "Test User", "email": "test@example.com", "password": "Test123!@#"}' 2>/dev/null)
    
    if [[ "$REGISTER_RESPONSE" == *"token"* ]]; then
        echo "   ✅ Registration successful"
        TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
        echo "   Token: ${TOKEN:0:50}..."
    else
        echo "   ❌ Authentication failed"
        echo "   Response: $REGISTER_RESPONSE"
        exit 1
    fi
fi
echo ""

# Step 4: Test AI query with authentication
echo "4️⃣ Testing AI Query with RAG..."
if [ -n "$TOKEN" ]; then
    AI_RESPONSE=$(curl -s -X POST http://localhost:8080/api/ai/query \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d '{
        "query": "What is Section 80C of Income Tax Act?",
        "queryType": "general_tax_info",
        "sessionId": "test_session_'$(date +%s)'",
        "context": {
          "use_context": true,
          "top_k": 3,
          "document_id": "ITA_primary"
        }
      }' 2>/dev/null)
    
    if [[ "$AI_RESPONSE" == *"success"*true* ]]; then
        echo "   ✅ AI Query successful"
        echo "   Response preview:"
        echo "$AI_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print('   ', data['data']['response'][:200] + '...' if len(data['data']['response']) > 200 else data['data']['response'])" 2>/dev/null || echo "   $AI_RESPONSE"
        
        # Check if RAG was used
        if [[ "$AI_RESPONSE" == *"rag-faiss"* ]] || [[ "$AI_RESPONSE" == *"income_tax_act"* ]]; then
            echo ""
            echo "   🎉 RAG Chatbot is working!"
            echo "   Model: $(echo $AI_RESPONSE | grep -o '"model":"[^"]*"' | cut -d'"' -f4)"
        else
            echo ""
            echo "   ⚠️ Response received but RAG might not be active"
        fi
    else
        echo "   ❌ AI Query failed"
        echo "   Response: $AI_RESPONSE"
    fi
else
    echo "   ❌ No auth token available"
fi
echo ""

echo "===================================="
echo "Test Complete!"
echo ""
echo "📝 To check backend logs:"
echo "   docker logs tax-assistant-backend --tail=50"
echo ""
echo "📝 To check frontend in browser:"
echo "   Open http://localhost:3000 (Docker) or http://localhost:5174 (Dev)"
