# Tanggapin Backend

Backend API server for Tanggapin - Instagram Auto Reply System for SMEs and Content Creators.

## Features

- Express.js server with security middleware
- MongoDB integration with Mongoose ODM
- Complete data models (User, Post, Keyword, Activity)
- Request logging and error handling
- Rate limiting for API protection
- Environment-based configuration
- Health check endpoint
- Graceful shutdown handling

## Prerequisites

- Node.js >= 18.0.0
- npm or yarn package manager

## Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration values.

## Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with nodemon
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode

## Environment Variables

Copy `.env.example` to `.env` and configure the following variables:

### Server Configuration
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `FRONTEND_URL` - Frontend URL for CORS

### Database Configuration
- `MONGODB_URI` - MongoDB connection string
- `REDIS_URL` - Redis connection string

### JWT Configuration
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRES_IN` - Token expiration time

### Instagram API Configuration
- `INSTAGRAM_APP_ID` - Instagram app ID
- `INSTAGRAM_APP_SECRET` - Instagram app secret
- `INSTAGRAM_WEBHOOK_VERIFY_TOKEN` - Webhook verification token

### Development Configuration
- `NGROK_AUTH_TOKEN` - Ngrok authentication token
- `WEBHOOK_BASE_URL` - Public webhook URL

## API Endpoints

### Health Check
- `GET /health` - Server health status

### API Info
- `GET /api` - API information and status

## Middleware

### Security
- **Helmet.js** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - Request rate limiting

### Logging
- **Request Logger** - HTTP request logging
- **Winston** - Structured logging with file output

### Error Handling
- **Global Error Handler** - Centralized error handling
- **404 Handler** - Route not found handling

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js        # MongoDB connection configuration
│   │   └── logger.js          # Winston logger configuration
│   ├── middleware/
│   │   ├── errorHandler.js    # Global error handling
│   │   └── requestLogger.js   # HTTP request logging
│   ├── models/
│   │   ├── User.js            # User model with Instagram integration
│   │   ├── Post.js            # Instagram post model
│   │   ├── Keyword.js         # Keyword matching and responses
│   │   ├── Activity.js        # Activity logging and analytics
│   │   ├── index.js           # Models export
│   │   └── README.md          # Models documentation
│   ├── controllers/           # Route handlers (empty)
│   ├── routes/                # API routes (empty)
│   ├── services/              # Business logic (empty)
│   ├── utils/                 # Helper functions (empty)
│   └── server.js              # Main server file
├── logs/                      # Log files directory
├── .env.example               # Environment variables template
├── .gitignore                 # Git ignore rules
├── package.json               # Dependencies and scripts
└── README.md                  # This file
```

## Development

1. Start the development server:
```bash
npm run dev
```

2. The server will start on `http://localhost:3000` (or the port specified in `.env`)

3. Check server health:
```bash
curl http://localhost:3000/health
```

## Logging

Logs are written to:
- Console (colored output in development)
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only

## Error Handling

The application includes comprehensive error handling for:
- Mongoose validation errors
- JWT token errors
- Cast errors (invalid ObjectIds)
- Duplicate key errors
- General server errors

## Security Features

- Helmet.js for security headers
- CORS configuration
- Rate limiting (100 requests per 15 minutes per IP)
- Request body size limits
- Environment-based configuration

## Database Models

The application includes comprehensive MongoDB models:

- **User Model**: User accounts with Instagram integration
- **Post Model**: Instagram posts with automation settings
- **Keyword Model**: Keyword matching and automated responses
- **Activity Model**: Complete audit trail of all automation activities

See `src/models/README.md` for detailed model documentation.

## Next Steps

MongoDB connection and models are now complete. The following features will be added in subsequent development phases:

1. ✅ MongoDB connection and models
2. JWT authentication system
3. API routes structure
4. Instagram API integration
5. Webhook handling
6. Reply engine implementation

## Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation as needed
4. Ensure all tests pass before submitting
