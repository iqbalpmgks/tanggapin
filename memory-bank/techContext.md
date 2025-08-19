# Technical Context: Tanggapin

## Technology Stack

### Frontend
- **Framework**: React.js 18+
- **Build Tool**: Vite (fast development and build)
- **Styling**: Tailwind CSS (utility-first CSS framework)
- **State Management**: React Context API + useReducer
- **HTTP Client**: Axios for API communication
- **Real-time**: WebSocket client for live updates
- **Routing**: React Router v6

### Backend
- **Runtime**: Node.js (LTS version)
- **Framework**: Express.js
- **Authentication**: JWT (JSON Web Tokens)
- **API Documentation**: Swagger/OpenAPI
- **Real-time**: Socket.io for WebSocket connections
- **Validation**: Joi for input validation
- **Security**: Helmet.js, CORS, rate limiting

### Database
- **Primary**: MongoDB (local installation)
- **ODM**: Mongoose for object modeling
- **Caching**: Redis (for session and response caching)
- **Backup**: MongoDB dump utilities

### External APIs
- **Instagram**: Instagram Graph API
- **Meta**: Facebook Graph API (for Instagram Business accounts)
- **Webhooks**: Instagram webhook subscriptions

### Development Tools
- **Localhost Exposure**: Ngrok (for webhook testing)
- **Environment**: dotenv for configuration
- **Process Management**: PM2 for production
- **Logging**: Winston for structured logging
- **Testing**: Jest + React Testing Library

## Development Setup

### Prerequisites
```bash
# Required software
Node.js >= 18.0.0
MongoDB >= 6.0
Git
Ngrok account (for webhook testing)
```

### Environment Configuration
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/tanggapin
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Instagram API
INSTAGRAM_APP_ID=your-app-id
INSTAGRAM_APP_SECRET=your-app-secret
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=your-verify-token

# Ngrok (Development)
NGROK_AUTH_TOKEN=your-ngrok-token
WEBHOOK_BASE_URL=https://your-ngrok-url.ngrok.io
```

### Project Structure
```
tanggapin/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── context/        # React Context providers
│   │   ├── services/       # API service functions
│   │   ├── utils/          # Utility functions
│   │   └── styles/         # Global styles
│   ├── public/             # Static assets
│   └── package.json
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Helper functions
│   │   └── config/         # Configuration files
│   └── package.json
├── shared/                  # Shared utilities/types
├── docs/                   # Documentation
├── memory-bank/            # Project memory bank
└── spec/                   # Specifications
```

## Technical Constraints

### Instagram API Limitations
- **Account Types**: Business/Creator accounts only
- **Rate Limits**: 
  - 200 calls per hour per user
  - 4800 calls per hour per app
- **Webhook Events**: Limited to comments, mentions, messages
- **DM Restrictions**: Cannot message private accounts that don't follow back
- **Content Types**: Text and links only (no media in automated responses)

### Development Constraints
- **Local Development**: Requires ngrok for webhook testing
- **Database**: Local MongoDB instance (no cloud dependency for MVP)
- **Single Account**: One Instagram account per user (MVP limitation)
- **Admin Registration**: No self-registration (admin creates accounts)

### Performance Requirements
- **Response Time**: <5 seconds from webhook to response
- **Throughput**: Handle >1000 requests/day
- **Uptime**: 99% availability target
- **Concurrent Users**: Support 10+ simultaneous users

## Dependencies

### Frontend Dependencies
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.8.0",
  "axios": "^1.3.0",
  "socket.io-client": "^4.6.0",
  "tailwindcss": "^3.2.0",
  "@headlessui/react": "^1.7.0",
  "@heroicons/react": "^2.0.0"
}
```

### Backend Dependencies
```json
{
  "express": "^4.18.0",
  "mongoose": "^7.0.0",
  "jsonwebtoken": "^9.0.0",
  "bcryptjs": "^2.4.0",
  "joi": "^17.8.0",
  "helmet": "^6.0.0",
  "cors": "^2.8.0",
  "socket.io": "^4.6.0",
  "winston": "^3.8.0",
  "axios": "^1.3.0",
  "dotenv": "^16.0.0"
}
```

### Development Dependencies
```json
{
  "nodemon": "^2.0.0",
  "jest": "^29.0.0",
  "supertest": "^6.3.0",
  "@testing-library/react": "^14.0.0",
  "eslint": "^8.35.0",
  "prettier": "^2.8.0"
}
```

## Tool Usage Patterns

### Development Workflow
1. **Local Development**: 
   - Frontend: `npm run dev` (Vite dev server)
   - Backend: `npm run dev` (nodemon)
   - Database: Local MongoDB instance

2. **Webhook Testing**:
   - Start ngrok: `ngrok http 3000`
   - Update webhook URL in Instagram app settings
   - Test with Instagram posts/comments

3. **Database Management**:
   - MongoDB Compass for GUI
   - Mongoose CLI for migrations
   - Regular backups with mongodump

### Code Quality
- **Linting**: ESLint with Airbnb config
- **Formatting**: Prettier with consistent rules
- **Testing**: Jest for unit tests, Supertest for API tests
- **Type Safety**: JSDoc comments for documentation

### Deployment Preparation
- **Environment**: PM2 for process management
- **Monitoring**: Winston logs + custom dashboard
- **Security**: Helmet.js, input validation, rate limiting
- **Performance**: Response caching, database indexing

## API Integration Patterns

### Instagram Graph API
```javascript
// API Client Pattern
class InstagramAPI {
  constructor(accessToken) {
    this.token = accessToken;
    this.baseURL = 'https://graph.instagram.com';
  }

  async getComments(mediaId) {
    return axios.get(`${this.baseURL}/${mediaId}/comments`, {
      params: { access_token: this.token }
    });
  }

  async sendMessage(userId, message) {
    return axios.post(`${this.baseURL}/me/messages`, {
      recipient: { id: userId },
      message: { text: message },
      access_token: this.token
    });
  }
}
```

### Webhook Handling
```javascript
// Webhook verification and processing
app.get('/webhook', (req, res) => {
  const verify_token = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN;
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token === verify_token) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

app.post('/webhook', (req, res) => {
  const body = req.body;
  if (body.object === 'instagram') {
    body.entry.forEach(entry => {
      entry.changes.forEach(change => {
        processWebhookEvent(change);
      });
    });
  }
  res.status(200).send('EVENT_RECEIVED');
});
```

## Security Implementation

### Authentication Flow
```javascript
// JWT-based authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};
```

### Input Validation
```javascript
// Joi validation schemas
const keywordSchema = Joi.object({
  keyword: Joi.string().min(1).max(50).required(),
  response: Joi.string().min(1).max(1000).required(),
  postId: Joi.string().required(),
  isActive: Joi.boolean().default(true)
});
```

### Rate Limiting
```javascript
// Express rate limiting
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
