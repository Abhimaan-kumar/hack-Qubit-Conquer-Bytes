#!/bin/bash

echo "🛑 Stopping TaxEase Application Services"
echo "========================================"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to kill process by PID file
kill_by_pid_file() {
    if [ -f "$1" ]; then
        PID=$(cat "$1")
        if kill -0 "$PID" 2>/dev/null; then
            echo -e "${YELLOW}Stopping $2 (PID: $PID)...${NC}"
            kill -9 "$PID"
            rm "$1"
            echo -e "${GREEN}✅ $2 stopped${NC}"
        else
            echo -e "${YELLOW}⚠️  $2 process not running${NC}"
            rm "$1"
        fi
    else
        echo -e "${YELLOW}⚠️  No PID file for $2${NC}"
    fi
}

# Function to kill process on port
kill_port() {
    if lsof -i :"$1" >/dev/null 2>&1; then
        echo -e "${YELLOW}Stopping process on port $1...${NC}"
        lsof -ti :"$1" | xargs kill -9 2>/dev/null
        echo -e "${GREEN}✅ Port $1 freed${NC}"
    fi
}

# Create logs directory if it doesn't exist
mkdir -p logs

# Stop services by PID files
kill_by_pid_file "logs/backend.pid" "Backend"
kill_by_pid_file "logs/frontend.pid" "Frontend"
kill_by_pid_file "logs/rag_server.pid" "RAG Server"

# Backup: kill by ports
echo ""
echo -e "${YELLOW}Checking ports...${NC}"
kill_port 8080  # Backend
kill_port 5174  # Frontend
kill_port 5555  # RAG Server

# Deactivate virtual environment if active
if [[ "$VIRTUAL_ENV" != "" ]]; then
    deactivate 2>/dev/null || true
fi

echo ""
echo -e "${GREEN}========================================"
echo "✅ All services stopped"
echo "========================================${NC}"
