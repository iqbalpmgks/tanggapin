# System Patterns: Tanggapin

## System Architecture

### High-Level Architecture
```
Frontend (React + Vite + Tailwind) 
    ↓ HTTP/WebSocket
Backend (Node.js + Express)
    ↓ REST API
Instagram Graph API
    ↓ Database
MongoDB (Local)
```

### Core Components

#### 1. Authentication Layer
- **Pattern**: JWT-based authentication
- **Implementation**: Login-only system (no self-registration)
- **Security**: Encrypted token storage, input validation
- **Admin Control**: Admin registers users manually

#### 2. Instagram API Integration
- **Pattern**: Event-driven webhook processing
- **Components**:
  - Webhook receiver for real-time comments/DMs
  - API client for sending responses
  - Token management and refresh logic
- **Constraints**: Business/Creator accounts only, API rate limiting

#### 3. Reply Engine (Core Logic)
- **Pattern**: Rule-based keyword matching
- **Flow**:
  ```
  Incoming Comment/DM → Keyword Detection → 
  Rule Matching → Response Generation → 
  Delivery Attempt → Fallback Logic → Logging
  ```
- **Components**:
  - Keyword matcher (supports synonyms)
  - Response template engine
  - Delivery service (DM/Comment)
  - Fallback handler

#### 4. Post Management System
- **Pattern**: Selective automation per post
- **Features**:
  - Post selection interface
  - Per-post configuration (comments/DMs/both)
  - Keyword-response mapping per post
  - Enable/disable controls

#### 5. Monitoring & Logging
- **Pattern**: Event sourcing for complete audit trail
- **Components**:
  - Activity logger
  - Performance tracker
  - Status classifier (success/failure/fallback)
  - Reporting engine

## Key Technical Decisions

### 1. Frontend Technology
- **Choice**: React.js with Vite
- **Reasoning**: Fast development, modern tooling, component reusability
- **Styling**: Tailwind CSS for rapid UI development
- **State Management**: React hooks + Context API (simple state needs)

### 2. Backend Technology
- **Choice**: Node.js with Express
- **Reasoning**: JavaScript ecosystem consistency, good Instagram API support
- **Architecture**: RESTful API with webhook endpoints
- **Real-time**: WebSocket for dashboard updates

### 3. Database Design
- **Choice**: MongoDB (local)
- **Reasoning**: Flexible schema for varied Instagram data, JSON-native
- **Collections**:
  - Users (authentication)
  - Posts (automation settings)
  - Keywords (rules and responses)
  - Activities (logs and metrics)
  - InstagramTokens (API credentials)

### 4. Instagram API Strategy
- **Approach**: Instagram Graph API integration
- **Webhook Events**: Comments, mentions, messages
- **Rate Limiting**: Queue-based throttling
- **Error Handling**: Exponential backoff, fallback mechanisms

## Design Patterns in Use

### 1. Strategy Pattern (Reply Logic)
```javascript
class ReplyStrategy {
  execute(comment, keywords, responses) {
    // Abstract reply logic
  }
}

class DMStrategy extends ReplyStrategy {
  execute(comment, keywords, responses) {
    // DM-specific logic
  }
}

class CommentStrategy extends ReplyStrategy {
  execute(comment, keywords, responses) {
    // Comment-specific logic
  }
}
```

### 2. Observer Pattern (Event Handling)
```javascript
class WebhookHandler {
  constructor() {
    this.observers = [];
  }
  
  notify(event) {
    this.observers.forEach(observer => observer.handle(event));
  }
}
```

### 3. Factory Pattern (Response Generation)
```javascript
class ResponseFactory {
  static createResponse(type, template, data) {
    switch(type) {
      case 'DM': return new DMResponse(template, data);
      case 'COMMENT': return new CommentResponse(template, data);
      case 'FALLBACK': return new FallbackResponse(template, data);
    }
  }
}
```

### 4. Chain of Responsibility (Keyword Matching)
```javascript
class KeywordMatcher {
  setNext(matcher) {
    this.next = matcher;
    return matcher;
  }
  
  handle(comment) {
    if (this.canHandle(comment)) {
      return this.process(comment);
    }
    return this.next?.handle(comment);
  }
}
```

## Component Relationships

### Data Flow Architecture
```
Instagram Webhook → Webhook Handler → Event Processor → 
Keyword Matcher → Response Generator → Delivery Service → 
Activity Logger → Dashboard Updates
```

### Module Dependencies
```
Authentication ← Dashboard ← API Routes
Instagram API ← Reply Engine ← Webhook Handler
Database ← All Modules (data persistence)
Logging ← All Modules (audit trail)
```

## Critical Implementation Paths

### 1. Real-time Comment Processing
```
Comment Received → Validate Source → Extract Keywords → 
Match Rules → Generate Response → Attempt DM → 
Handle Fallback → Log Result → Update Dashboard
```

### 2. Post Configuration Flow
```
User Selects Post → Load Current Settings → 
Configure Keywords → Set Response Templates → 
Test Configuration → Save Settings → Activate Automation
```

### 3. Error Recovery Path
```
API Error → Classify Error Type → Apply Retry Logic → 
Fallback to Alternative Method → Log Failure → 
Notify User → Queue for Manual Review
```

### 4. Dashboard Data Pipeline
```
Activity Events → Real-time Aggregation → 
Cache Updates → WebSocket Broadcast → 
Frontend State Update → UI Refresh
```

## Performance Patterns

### 1. Caching Strategy
- **Instagram Data**: Cache post metadata, user profiles
- **Keywords**: In-memory cache for fast matching
- **Responses**: Template caching for quick generation
- **Dashboard**: Aggregated metrics caching

### 2. Queue Management
- **Incoming Events**: Priority queue (DMs > Comments)
- **Outgoing Responses**: Rate-limited queue
- **Failed Requests**: Retry queue with exponential backoff

### 3. Database Optimization
- **Indexing**: Keywords, timestamps, user IDs
- **Aggregation**: Pre-computed dashboard metrics
- **Archiving**: Old activity logs cleanup

## Security Patterns

### 1. API Security
- **Authentication**: JWT tokens with expiration
- **Authorization**: Role-based access control
- **Input Validation**: Sanitization and validation middleware
- **Rate Limiting**: Per-user API limits

### 2. Instagram Token Management
- **Storage**: Encrypted token storage
- **Refresh**: Automatic token refresh logic
- **Revocation**: Handle token revocation gracefully

### 3. Data Protection
- **Encryption**: Sensitive data encryption at rest
- **Logging**: No sensitive data in logs
- **Access Control**: Principle of least privilege
