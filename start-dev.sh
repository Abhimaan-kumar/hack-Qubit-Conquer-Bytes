#!/bin/bash

echo "🚀 Starting TaxEase Development Environment..."

# Start Backend
echo "📦 Starting Backend Server..."
cd Backend
npm run dev &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to start
sleep 3

# Start Frontend
echo "🎨 Starting Frontend Server..."
cd ../Frontend
npm run dev &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

echo ""
echo "✅ Development servers started!"
echo "🔗 Frontend: http://localhost:5174"
echo "🔗 Backend: http://localhost:5001"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for Ctrl+C
trap "echo '🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
