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

## Post-MVP Architectural Patterns

### 1. Feature Gating Pattern (Post-MVP)
```javascript
class FeatureGate {
  constructor(userPlan, feature) {
    this.userPlan = userPlan;
    this.feature = feature;
  }

  canAccess() {
    const limits = PLAN_LIMITS[this.userPlan];
    return limits.features.includes(this.feature);
  }

  checkUsageLimit(currentUsage, limitType) {
    const limits = PLAN_LIMITS[this.userPlan];
    return currentUsage < limits[limitType];
  }
}

// Usage-based limiting
const PLAN_LIMITS = {
  FREE: { dailyReplies: 20, features: ['basic_dashboard'] },
  PRO: { dailyReplies: 300, features: ['advanced_analytics', 'ai_replies'] },
  BUSINESS: { dailyReplies: 1000, features: ['multi_admin', 'priority_support'] }
};
```

### 2. Multi-Tenant Architecture (Post-MVP)
```javascript
class TenantContext {
  constructor(userId, organizationId) {
    this.userId = userId;
    this.organizationId = organizationId;
  }

  getDataScope() {
    return {
      user: this.userId,
      organization: this.organizationId,
      permissions: this.getUserPermissions()
    };
  }
}

// Data isolation pattern
class TenantAwareRepository {
  find(query, tenantContext) {
    return this.model.find({
      ...query,
      organizationId: tenantContext.organizationId
    });
  }
}
```

### 3. AI Integration Pattern (Post-MVP)
```javascript
class AIReplyService {
  constructor(provider = 'openai') {
    this.provider = provider;
    this.fallbackToKeyword = true;
  }

  async generateReply(comment, context) {
    try {
      const aiReply = await this.provider.generate(comment, context);
      return { type: 'AI', content: aiReply, confidence: 0.85 };
    } catch (error) {
      if (this.fallbackToKeyword) {
        return this.keywordService.generateReply(comment, context);
      }
      throw error;
    }
  }
}

// Hybrid AI + Keyword pattern
class HybridReplyEngine {
  async processComment(comment, settings) {
    if (settings.aiEnabled && this.featureGate.canUseAI()) {
      return await this.aiService.generateReply(comment, settings);
    }
    return await this.keywordService.generateReply(comment, settings);
  }
}
```

### 4. Multi-Platform Integration Pattern (Post-MVP)
```javascript
class PlatformAdapter {
  constructor(platform) {
    this.platform = platform;
  }

  async sendMessage(recipient, message) {
    switch (this.platform) {
      case 'instagram':
        return this.instagramAPI.sendDM(recipient, message);
      case 'whatsapp':
        return this.whatsappAPI.sendMessage(recipient, message);
      case 'telegram':
        return this.telegramAPI.sendMessage(recipient, message);
    }
  }
}

// Unified platform management
class MultiPlatformManager {
  constructor() {
    this.adapters = new Map();
  }

  registerPlatform(name, adapter) {
    this.adapters.set(name, adapter);
  }

  async broadcastMessage(platforms, recipient, message) {
    const promises = platforms.map(platform => {
      const adapter = this.adapters.get(platform);
      return adapter.sendMessage(recipient, message);
    });
    return Promise.allSettled(promises);
  }
}
```

### 5. Advanced Analytics Pattern (Post-MVP)
```javascript
class AnalyticsAggregator {
  constructor() {
    this.metrics = new Map();
  }

  async aggregateEngagementMetrics(timeRange, filters) {
    const pipeline = [
      { $match: this.buildTimeFilter(timeRange) },
      { $group: {
        _id: '$platform',
        totalReplies: { $sum: 1 },
        successRate: { $avg: '$success' },
        avgResponseTime: { $avg: '$responseTime' }
      }},
      { $sort: { totalReplies: -1 } }
    ];
    
    return this.activityModel.aggregate(pipeline);
  }
}

// Real-time analytics pattern
class RealTimeAnalytics {
  constructor(socketIO) {
    this.io = socketIO;
    this.subscribers = new Set();
  }

  trackEvent(event, data) {
    this.updateMetrics(event, data);
    this.broadcastUpdate(event, data);
  }

  broadcastUpdate(event, data) {
    this.io.emit('analytics:update', { event, data, timestamp: Date.now() });
  }
}
```

### 6. Scalability Patterns (Post-MVP)

#### Queue-Based Processing
```javascript
class ScalableQueueProcessor {
  constructor(redisClient) {
    this.redis = redisClient;
    this.workers = [];
  }

  async addJob(queue, job, priority = 'normal') {
    const queueKey = `queue:${queue}:${priority}`;
    await this.redis.lpush(queueKey, JSON.stringify(job));
  }

  startWorkers(concurrency = 5) {
    for (let i = 0; i < concurrency; i++) {
      this.workers.push(this.createWorker());
    }
  }
}
```

#### Microservices Communication
```javascript
class ServiceRegistry {
  constructor() {
    this.services = new Map();
  }

  register(serviceName, endpoint, healthCheck) {
    this.services.set(serviceName, { endpoint, healthCheck });
  }

  async callService(serviceName, method, data) {
    const service = this.services.get(serviceName);
    if (!service) throw new Error(`Service ${serviceName} not found`);
    
    return axios.post(`${service.endpoint}/${method}`, data);
  }
}
```

### 7. Enterprise Security Patterns (Post-MVP)

#### Audit Logging
```javascript
class AuditLogger {
  constructor() {
    this.sensitiveFields = ['password', 'token', 'apiKey'];
  }

  logAction(userId, action, resource, changes) {
    const auditEntry = {
      userId,
      action,
      resource,
      changes: this.sanitizeData(changes),
      timestamp: new Date(),
      ip: this.getClientIP(),
      userAgent: this.getUserAgent()
    };
    
    this.auditModel.create(auditEntry);
  }
}
```

#### Role-Based Access Control
```javascript
class RBACManager {
  constructor() {
    this.roles = new Map();
    this.permissions = new Map();
  }

  defineRole(roleName, permissions) {
    this.roles.set(roleName, permissions);
  }

  hasPermission(userRoles, requiredPermission) {
    return userRoles.some(role => {
      const permissions = this.roles.get(role);
      return permissions && permissions.includes(requiredPermission);
    });
  }
}
```

## Future Architecture Considerations

### 1. Database Scaling Strategy
- **Read Replicas**: For analytics and reporting queries
- **Sharding**: User-based sharding for horizontal scaling
- **Caching Layer**: Redis for frequently accessed data
- **Data Archiving**: Historical data management

### 2. API Gateway Pattern
- **Rate Limiting**: Per-user and per-plan limits
- **Authentication**: Centralized JWT validation
- **Request Routing**: Service-based routing
- **Monitoring**: Request/response logging and metrics

### 3. Event-Driven Architecture
- **Event Sourcing**: Complete audit trail of all actions
- **CQRS**: Separate read/write models for performance
- **Event Bus**: Decoupled service communication
- **Saga Pattern**: Distributed transaction management

### 4. Monitoring and Observability
- **Distributed Tracing**: Request flow across services
- **Metrics Collection**: Business and technical metrics
- **Log Aggregation**: Centralized logging with correlation IDs
- **Health Checks**: Service availability monitoring
