#!/bin/bash

# Rebuild and restart RAG chatbot service
# This script fixes the pydantic compatibility issues

echo "🔄 Rebuilding TaxEase RAG Service..."
echo "=================================="

# Stop and remove existing containers
echo "📦 Stopping existing services..."
docker-compose down

# Optional: Remove old volumes if you want a fresh start
read -p "Do you want to remove old volumes for a clean rebuild? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "🗑️  Removing volumes..."
    docker-compose down -v
fi

# Rebuild the RAG service with no cache
echo "🔨 Rebuilding RAG service..."
docker-compose build --no-cache rag

# Start all services
echo "🚀 Starting all services..."
docker-compose up -d

# Wait a bit for services to initialize
echo "⏳ Waiting for services to initialize..."
sleep 10

# Check service status
echo ""
echo "📊 Service Status:"
echo "=================================="
docker-compose ps

echo ""
echo "📝 RAG Server Logs (last 50 lines):"
echo "=================================="
docker-compose logs --tail=50 rag

echo ""
echo "✅ Rebuild complete!"
echo ""
echo "Next steps:"
echo "  1. Check if RAG service is healthy: docker-compose ps"
echo "  2. View live logs: docker-compose logs -f rag"
echo "  3. Test the chatbot: curl http://localhost:5555/health"
echo ""
