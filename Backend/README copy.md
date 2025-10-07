# Tax Assistant Backend API

A comprehensive Node.js/Express backend API for an AI-assisted tax filing application that surpasses ClearTax in features and user experience.

## 🚀 Features

- **User Authentication & Authorization**: JWT-based auth with secure password hashing
- **Tax Calculations**: Advanced tax computation with old/new regime comparison
- **Document Management**: Secure file upload and AI-powered document analysis
- **AI Integration**: OpenAI-powered tax guidance and intelligent assistance
- **Real-time Processing**: Asynchronous document processing with status tracking
- **Comprehensive Security**: Rate limiting, CORS, Helmet, input validation
- **Scalable Architecture**: MongoDB with Mongoose ODM, modular route structure

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **AI Integration**: OpenAI API
- **Security**: Helmet, CORS, Rate Limiting, bcrypt
- **Validation**: Express Validator
- **PDF Processing**: pdf-parse
- **Excel Processing**: xlsx

## 📁 Project Structure

```
Backend/
├── config/
│   └── database.js          # MongoDB connection configuration
├── middleware/
│   ├── auth.js             # Authentication middleware
│   ├── errorHandler.js     # Global error handling
│   └── validation.js       # Input validation middleware
├── models/
│   ├── User.js             # User model
│   ├── TaxDocument.js      # Document model
│   ├── TaxCalculation.js   # Tax calculation model
│   ├── AIQuery.js          # AI interaction model
│   └── index.js            # Model exports
├── routes/
│   ├── auth.js             # Authentication routes
│   ├── taxCalculations.js  # Tax calculation routes
│   ├── documents.js        # Document management routes
│   ├── ai.js               # AI interaction routes
│   └── index.js            # Route exports
├── uploads/                # File upload directory
├── .env.example           # Environment variables template
├── package.json           # Dependencies and scripts
├── server.js              # Main application entry point
└── README.md              # This file
```

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tax-assistant/Backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB**
   Make sure MongoDB is running locally or configure MongoDB Atlas URI

5. **Run the application**
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/tax-assistant` |
| `JWT_SECRET` | JWT signing secret | Required |
| `OPENAI_API_KEY` | OpenAI API key | Required for AI features |
| `FRONTEND_URL` | Frontend application URL | `http://localhost:5174` |

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/updatepassword` - Change password

### Tax Calculations
- `GET /api/tax-calculations` - Get user calculations
- `POST /api/tax-calculations` - Create calculation
- `PUT /api/tax-calculations/:id` - Update calculation
- `DELETE /api/tax-calculations/:id` - Delete calculation
- `POST /api/tax-calculations/compare` - Compare regimes

### Document Management
- `POST /api/documents/upload` - Upload document
- `GET /api/documents` - Get user documents
- `GET /api/documents/:id/download` - Download document
- `DELETE /api/documents/:id` - Delete document
- `POST /api/documents/:id/process` - Process document with AI

### AI Assistant
- `POST /api/ai/query` - Ask AI question
- `GET /api/ai/history` - Get query history
- `POST /api/ai/query/:id/feedback` - Provide feedback
- `GET /api/ai/metrics` - Get AI performance metrics

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with 12 salt rounds
- **Rate Limiting**: Prevents brute force attacks
- **Input Validation**: Comprehensive request validation
- **CORS Protection**: Configured for frontend origin
- **Helmet Security Headers**: Security headers middleware
- **File Upload Security**: Type and size restrictions
- **Account Lockout**: Prevents brute force on login

## 🗄 Database Models

### User Model
- Personal information, authentication, preferences
- Account security features (lockout, verification)

### TaxDocument Model
- File metadata, processing status, AI analysis results
- Support for multiple document types

### TaxCalculation Model
- Income/deductions data, tax computation results
- Regime comparison and AI insights

### AIQuery Model
- Query history, responses, user feedback
- Performance tracking and analytics

## 🚀 Deployment

### Prerequisites
- Node.js 18+
- MongoDB 5+
- npm or yarn

### Production Deployment
1. Set `NODE_ENV=production`
2. Configure production MongoDB URI
3. Set secure `JWT_SECRET`
4. Configure `FRONTEND_URL` for production
5. Use process manager like PM2

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint
```

## 📊 Monitoring

- Health check endpoint: `GET /api/health`
- Request logging with Morgan
- Error tracking and reporting
- Performance monitoring

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@taxassistant.com or create an issue in the repository.

## 🔄 API Versioning

Current API version: v1
All endpoints are prefixed with `/api/`

## 📈 Future Enhancements

- [ ] Real-time notifications
- [ ] Advanced AI document analysis
- [ ] Multi-language support
- [ ] Integration with tax authorities
- [ ] Advanced reporting and analytics
- [ ] Mobile app API support