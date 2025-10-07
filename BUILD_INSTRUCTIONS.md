# Build Instructions

## Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ (for local development)
- Python 3.9+ (for local development)
- MongoDB (for local development)

## Quick Start with Docker (Recommended)

1. **Clone the repository**
```bash
git clone <repository-url>
cd hack-Qubit-Conquer-Bytes
```

2. **Set up environment variables**
```bash
cp .env.docker .env
# Edit .env and add your OPENAI_API_KEY if needed
```

3. **Build and run with Docker Compose**
```bash
docker-compose up --build
```

4. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- MongoDB: localhost:27017
- Redis: localhost:6379

## Local Development Setup

### Backend Setup

1. **Navigate to Backend directory**
```bash
cd Backend
```

2. **Install Node.js dependencies**
```bash
npm install
```

3. **Install Python dependencies**
```bash
pip install -r requirements.txt
```

4. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. **Start MongoDB locally**
```bash
mongod --dbpath ./data/db
```

6. **Run the backend**
```bash
npm run dev
```

### Frontend Setup

1. **Navigate to Frontend directory**
```bash
cd Frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Run the development server**
```bash
npm run dev
```

4. **Access the application**
- Frontend: http://localhost:5174

## Building for Production

### Using Docker

```bash
docker-compose -f docker-compose.yml up --build -d
```

### Manual Build

**Backend:**
```bash
cd Backend
npm install --production
```

**Frontend:**
```bash
cd Frontend
npm run build
# Serve the dist/ folder with nginx or any static server
```

## Testing

### Backend Tests
```bash
cd Backend
npm test
```

### Test the RAG Chatbot
```bash
cd Backend/RAG_CHATBOT
python rag_chatbot.py test
```

## Troubleshooting

### Port Already in Use
If ports 3000, 5000, or 27017 are already in use, modify the port mappings in `docker-compose.yml`.

### MongoDB Connection Issues
Ensure MongoDB is running and the connection string in `.env` is correct.

### Python Dependencies Issues
If you encounter issues with Python packages, try:
```bash
pip install --upgrade pip
pip install -r requirements.txt --no-cache-dir
```

### Docker Build Issues
Clear Docker cache and rebuild:
```bash
docker-compose down -v
docker system prune -a
docker-compose up --build
```

## Environment Variables

Key environment variables (see `.env.example` for full list):

- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `OPENAI_API_KEY`: OpenAI API key (optional)
- `PORT`: Backend server port (default: 5000)
- `FRONTEND_URL`: Frontend URL for CORS

## Project Structure

```
├── Backend/              # Node.js + Python backend
│   ├── routes/          # API routes
│   ├── models/          # MongoDB models
│   ├── middleware/      # Express middleware
│   ├── RAG_CHATBOT/     # Python RAG chatbot
│   └── server.js        # Main server file
├── Frontend/            # React frontend
│   ├── src/
│   │   ├── pages/      # React pages
│   │   ├── components/ # React components
│   │   └── utils/      # Utilities including API client
│   └── vite.config.js
└── docker-compose.yml   # Docker orchestration
```

