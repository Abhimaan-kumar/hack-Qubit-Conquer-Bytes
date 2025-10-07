#!/bin/bash

echo "🚀 Starting TaxEase Application with RAG Chatbot Integration"
echo "=============================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    lsof -i :"$1" >/dev/null 2>&1
}

# Function to kill process on port
kill_port() {
    echo -e "${YELLOW}Stopping process on port $1...${NC}"
    lsof -ti :"$1" | xargs kill -9 2>/dev/null
    sleep 2
}

echo -e "${BLUE}Step 1: Checking prerequisites...${NC}"

# Check Node.js
if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js: $(node --version)${NC}"

# Check Python
if ! command_exists python3; then
    echo -e "${RED}❌ Python 3 is not installed. Please install Python 3 first.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Python: $(python3 --version)${NC}"

# Check MongoDB
if ! command_exists mongod; then
    echo -e "${YELLOW}⚠️  MongoDB not found. Make sure MongoDB is installed and running.${NC}"
else
    echo -e "${GREEN}✅ MongoDB installed${NC}"
fi

echo ""
echo -e "${BLUE}Step 2: Checking ports...${NC}"

# Check and clean ports
if port_in_use 8080; then
    echo -e "${YELLOW}⚠️  Port 8080 (Backend) is in use${NC}"
    read -p "Kill process on port 8080? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kill_port 8080
    fi
fi

if port_in_use 5174; then
    echo -e "${YELLOW}⚠️  Port 5174 (Frontend) is in use${NC}"
    read -p "Kill process on port 5174? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kill_port 5174
    fi
fi

if port_in_use 5555; then
    echo -e "${YELLOW}⚠️  Port 5555 (RAG Server) is in use${NC}"
    read -p "Kill process on port 5555? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kill_port 5555
    fi
fi

echo ""
echo -e "${BLUE}Step 3: Installing dependencies...${NC}"

# Install Backend dependencies
echo -e "${YELLOW}Installing Backend dependencies...${NC}"
cd Backend
if [ ! -d "node_modules" ]; then
    npm install
else
    echo -e "${GREEN}✅ Backend dependencies already installed${NC}"
fi

# Install axios if not present
npm install axios --save

cd ..

# Install Frontend dependencies
echo -e "${YELLOW}Installing Frontend dependencies...${NC}"
cd Frontend
if [ ! -d "node_modules" ]; then
    npm install
else
    echo -e "${GREEN}✅ Frontend dependencies already installed${NC}"
fi
cd ..

echo ""
echo -e "${BLUE}Step 4: Starting MongoDB...${NC}"
if command_exists brew; then
    brew services start mongodb-community 2>/dev/null || echo -e "${YELLOW}MongoDB may already be running${NC}"
else
    echo -e "${YELLOW}Please ensure MongoDB is running manually${NC}"
fi

echo ""
echo -e "${BLUE}Step 5: Starting RAG Chatbot Server (Port 5555)...${NC}"
cd Backend/RAG_CHATBOT

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Creating Python virtual environment...${NC}"
    python3 -m venv venv
fi

# Activate virtual environment and install dependencies
source venv/bin/activate
echo -e "${YELLOW}Installing Python dependencies...${NC}"
pip install -q --upgrade pip
pip install -q -r requirements.txt

# Start Flask server in background
echo -e "${GREEN}Starting Flask RAG server...${NC}"
export FLASK_PORT=5555
nohup python flask_server.py > ../../logs/rag_server.log 2>&1 &
RAG_PID=$!
echo $RAG_PID > ../../logs/rag_server.pid
echo -e "${GREEN}✅ RAG Server started (PID: $RAG_PID)${NC}"

cd ../..

# Wait for RAG server to be ready
echo -e "${YELLOW}Waiting for RAG server to be ready...${NC}"
sleep 5

# Test RAG server
if curl -s http://localhost:5555/health > /dev/null; then
    echo -e "${GREEN}✅ RAG Server is healthy${NC}"
else
    echo -e "${YELLOW}⚠️  RAG Server may not be fully ready yet${NC}"
fi

echo ""
echo -e "${BLUE}Step 6: Starting Backend Server (Port 8080)...${NC}"
cd Backend
nohup npm start > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../logs/backend.pid
echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"
cd ..

# Wait for backend
sleep 3

echo ""
echo -e "${BLUE}Step 7: Starting Frontend Server (Port 5174)...${NC}"
cd Frontend
nohup npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../logs/frontend.pid
echo -e "${GREEN}✅ Frontend started (PID: $FRONTEND_PID)${NC}"
cd ..

echo ""
echo -e "${GREEN}=============================================================="
echo "✅ All services started successfully!"
echo "==============================================================${NC}"
echo ""
echo -e "${BLUE}Service URLs:${NC}"
echo "  🌐 Frontend:     http://localhost:5174"
echo "  🔧 Backend API:  http://localhost:8080/api"
echo "  🤖 RAG Chatbot:  http://localhost:5555/api/rag"
echo ""
echo -e "${BLUE}Service Logs:${NC}"
echo "  📝 Backend:      tail -f logs/backend.log"
echo "  📝 Frontend:     tail -f logs/frontend.log"
echo "  📝 RAG Server:   tail -f logs/rag_server.log"
echo ""
echo -e "${BLUE}Process IDs:${NC}"
echo "  Backend:   $BACKEND_PID"
echo "  Frontend:  $FRONTEND_PID"
echo "  RAG:       $RAG_PID"
echo ""
echo -e "${YELLOW}To stop all services, run: ./stop-all.sh${NC}"
echo ""
