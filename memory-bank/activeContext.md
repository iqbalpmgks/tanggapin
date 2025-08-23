# Active Context: Tanggapin

## Current Work Focus

### Project Status: Initial Setup Phase
- **Phase**: Memory Bank Creation & Project Foundation
- **Current Task**: Establishing comprehensive project documentation
- **Next Phase**: Project structure setup and initial development

### Recent Changes
- Created complete memory bank structure based on PRD specifications
- Documented all core project requirements and technical decisions
- Established foundation for development workflow

## Next Steps

### Immediate Actions (Week 1)
1. **Project Structure Setup** ✅ COMPLETED
   - ✅ Create frontend and backend directory structure
   - ✅ Initialize React app with Vite
   - ✅ Setup Express.js backend with basic configuration
   - ✅ Configure MongoDB connection and basic models

2. **Development Environment** ✅ COMPLETED
   - ✅ Setup package.json files for both frontend and backend
   - ✅ Configure environment variables and .env files
   - ✅ Setup basic development scripts and tooling
   - ✅ Initialize Git repository with proper .gitignore

3. **Instagram API Integration Foundation** ✅ COMPLETED
   - ✅ Setup Meta Developer account and Instagram app
   - ✅ Configure webhook endpoints for development
   - ✅ Setup ngrok for local webhook testing
   - ✅ Create basic Instagram API client structure

### Week 2 Priorities
1. **Authentication System** ✅ COMPLETED
   - ✅ Implement JWT-based login system
   - ✅ Create user model and authentication middleware
   - ✅ Setup admin user creation functionality
   - ✅ Build basic login UI components
   - ✅ Authentication state management with React Context
   - ✅ Token storage and refresh mechanisms
   - ✅ API interceptors for automatic token handling
   - ✅ Custom authentication utility hooks

2. **Core Reply Engine**
   - Develop keyword matching algorithm
   - Create response template system
   - Implement basic webhook processing
   - Setup activity logging structure

### Week 3-4 Goals
1. **Instagram Integration**
   - Complete webhook event processing
   - Implement DM sending functionality
   - Create fallback comment system
   - Build post selection interface

2. **Dashboard & Monitoring**
   - Create activity dashboard
   - Implement real-time updates
   - Build reporting and analytics
   - Setup performance monitoring

## Active Decisions and Considerations

### Technical Architecture Decisions
1. **Monorepo vs Separate Repos**: Using monorepo structure for easier development and deployment
2. **State Management**: React Context API sufficient for MVP, avoid Redux complexity
3. **Database Schema**: Document-based design to handle varied Instagram data structures
4. **Real-time Updates**: WebSocket for dashboard, polling for Instagram API

### Development Approach
1. **API-First Development**: Build backend endpoints before frontend components
2. **Component-Driven UI**: Create reusable components for consistent design
3. **Test-Driven Critical Paths**: Focus testing on reply engine and Instagram integration
4. **Progressive Enhancement**: Start with basic functionality, add advanced features iteratively

### Risk Mitigation Strategies
1. **Instagram API Changes**: Abstract API calls behind service layer for easy updates
2. **Rate Limiting**: Implement queue system from start to handle API limits
3. **Token Management**: Robust refresh and error handling for Instagram tokens
4. **Fallback Mechanisms**: Multiple fallback strategies for failed DMs

### Post-MVP Considerations

#### Scope Clarification (Updated from PRD)
- **AI-Generated Replies**: Confirmed as post-MVP feature, excluded from current scope
- **Pricing Tiers**: FREE/PRO/BUSINESS plans are post-MVP, no implementation needed now
- **Multi-Admin Support**: Role-based permissions deferred to post-MVP
- **Channel Expansion**: WhatsApp, TikTok, Telegram integrations are post-MVP
- **Advanced Analytics**: Basic reporting only for MVP, advanced features post-MVP

#### Architecture for Future Scalability
- **Database Design**: Structure models to support future feature gating
- **API Design**: RESTful patterns that can accommodate usage limits
- **Component Architecture**: Modular design for easy feature additions
- **Service Layer**: Abstract business logic for future AI integration

#### Development Priorities (MVP Focus)
1. **Core Reply Engine**: Keyword-based matching only (no AI)
2. **Basic Dashboard**: Activity logs and simple reporting
3. **Single Account**: One Instagram account per user
4. **Manual Registration**: Admin-only user creation
5. **Essential Features**: Comments, DMs, fallback system only

## Important Patterns and Preferences

### Code Organization Patterns
```
Feature-Based Structure:
- Each major feature (auth, posts, replies, dashboard) has its own module
- Shared utilities and components in common directories
- Clear separation between business logic and UI components
```

### API Design Patterns
```
RESTful Endpoints:
GET    /api/posts              # List user's posts
POST   /api/posts/:id/keywords # Add keywords to post
GET    /api/activities         # Get activity log
POST   /api/webhook/instagram  # Instagram webhook endpoint
```

### Error Handling Strategy
```
Layered Error Handling:
1. Input Validation (Joi schemas)
2. Business Logic Errors (custom error classes)
3. External API Errors (retry logic + fallbacks)
4. Global Error Handler (logging + user-friendly responses)
```

### Security Implementation
```
Defense in Depth:
1. Input sanitization and validation
2. JWT token authentication
3. Rate limiting per user/IP
4. Encrypted sensitive data storage
5. Audit logging for all actions
```

## Learnings and Project Insights

### Instagram API Insights
- Business/Creator account requirement limits target audience but ensures API access
- Webhook events provide real-time capabilities but require public endpoint
- DM restrictions to private accounts necessitate robust fallback system
- Rate limits require careful queue management and user communication

### User Experience Considerations
- 5-minute onboarding target requires streamlined setup flow
- Mobile-friendly dashboard essential for social media managers
- Real-time feedback crucial for user confidence in automation
- Clear success/failure indicators prevent user confusion

### Technical Complexity Areas
1. **Keyword Matching**: Balance between accuracy and performance
2. **Webhook Reliability**: Handle Instagram API inconsistencies
3. **Token Management**: Graceful handling of expired/revoked tokens
4. **Fallback Logic**: Multiple strategies for different failure scenarios

## Development Workflow Preferences

### Git Workflow
```
Branch Strategy:
- main: Production-ready code
- develop: Integration branch
- feature/*: Individual features
- hotfix/*: Critical fixes
```

### Testing Strategy
```
Testing Pyramid:
- Unit Tests: Core business logic (keyword matching, response generation)
- Integration Tests: API endpoints and database operations
- E2E Tests: Critical user flows (login, post setup, automation)
```

### Deployment Strategy
```
Environment Progression:
- Local: Full development environment with ngrok
- Staging: Production-like environment for testing
- Production: PM2 managed processes with monitoring
```

## Current Environment State

### Development Setup Status
- Memory bank: ✅ Complete
- Project structure: ✅ Complete
- Environment configuration: ✅ Complete
- Instagram API setup: ✅ Complete
- Database setup: ✅ Complete

### Key Configuration Completed
1. ✅ Meta Developer account and Instagram app creation
2. ✅ MongoDB local installation and configuration
3. ✅ Ngrok setup for webhook testing
4. ✅ Environment variables configuration
5. ✅ Package dependencies installation

### Current Status
- Week 1 Foundation: ✅ Fully Complete
- Week 2 Authentication: ✅ Fully Complete
- Next Priority: Core Reply Engine implementation

## Context for Future Development

### Scalability Considerations
- Design database schema to handle multiple accounts (future feature)
- API rate limiting architecture to support growth
- Modular design for additional social platforms
- Performance monitoring from day one

### Maintenance Considerations
- Comprehensive logging for debugging production issues
- Automated backup strategies for user data
- Update mechanisms for Instagram API changes
- User communication system for service updates

### Success Metrics to Track
- Response time: <5 seconds target
- Success rate: 90% automation success
- User engagement: Onboarding completion rate
- System reliability: 99% uptime target

## Post-MVP Implementation Strategy

### Phase 2: Enhanced Automation (Months 2-3)

#### Monetization Implementation Approach
```javascript
// Database schema extensions for pricing
const UserSchema = {
  ...existingFields,
  plan: { type: String, enum: ['FREE', 'PRO', 'BUSINESS'], default: 'FREE' },
  planExpiry: Date,
  usageLimits: {
    dailyReplies: Number,
    monthlyReplies: Number,
    features: [String]
  },
  currentUsage: {
    dailyReplies: { type: Number, default: 0 },
    monthlyReplies: { type: Number, default: 0 },
    lastReset: Date
  }
};

// Feature gating middleware
const featureGate = (requiredFeature) => {
  return async (req, res, next) => {
    const user = req.user;
    const hasFeature = user.usageLimits.features.includes(requiredFeature);
    if (!hasFeature) {
      return res.status(403).json({ 
        error: 'Feature not available in your plan',
        upgrade: true 
      });
    }
    next();
  };
};
```

#### Multi-Admin Implementation Strategy
```javascript
// Organization and role management
const OrganizationSchema = {
  name: String,
  owner: { type: ObjectId, ref: 'User' },
  members: [{
    user: { type: ObjectId, ref: 'User' },
    role: { type: String, enum: ['viewer', 'editor', 'admin'] },
    permissions: [String],
    joinedAt: Date
  }],
  settings: {
    instagramAccounts: [String],
    sharedKeywords: Boolean,
    centralizedReporting: Boolean
  }
};

// Permission-based access control
const checkPermission = (permission) => {
  return async (req, res, next) => {
    const { organizationId } = req.params;
    const userId = req.user.id;
    
    const org = await Organization.findById(organizationId);
    const member = org.members.find(m => m.user.toString() === userId);
    
    if (!member || !member.permissions.includes(permission)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};
```

### Phase 3: AI Integration (Months 4-5)

#### AI Service Architecture
```javascript
// AI provider abstraction
class AIProviderFactory {
  static create(provider, config) {
    switch (provider) {
      case 'openai':
        return new OpenAIProvider(config);
      case 'anthropic':
        return new AnthropicProvider(config);
      case 'local':
        return new LocalAIProvider(config);
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  }
}

// Hybrid reply engine with fallback
class HybridReplyEngine {
  constructor(aiProvider, keywordEngine) {
    this.aiProvider = aiProvider;
    this.keywordEngine = keywordEngine;
    this.confidenceThreshold = 0.7;
  }

  async generateReply(comment, context, userSettings) {
    // Try AI first if enabled and available
    if (userSettings.aiEnabled && this.aiProvider.isAvailable()) {
      try {
        const aiReply = await this.aiProvider.generateReply(comment, context);
        if (aiReply.confidence >= this.confidenceThreshold) {
          return { ...aiReply, source: 'AI' };
        }
      } catch (error) {
        console.warn('AI reply failed, falling back to keywords:', error);
      }
    }

    // Fallback to keyword-based reply
    return this.keywordEngine.generateReply(comment, context);
  }
}
```

#### Context-Aware AI Implementation
```javascript
// Context building for AI
class AIContextBuilder {
  buildContext(comment, post, userHistory, businessInfo) {
    return {
      comment: {
        text: comment.text,
        author: comment.username,
        timestamp: comment.created_time
      },
      post: {
        caption: post.caption,
        type: post.media_type,
        hashtags: this.extractHashtags(post.caption)
      },
      business: {
        name: businessInfo.name,
        industry: businessInfo.industry,
        tone: businessInfo.preferredTone,
        products: businessInfo.products
      },
      history: {
        previousInteractions: userHistory.slice(-5),
        commonQuestions: this.getCommonQuestions(userHistory)
      }
    };
  }
}
```

### Phase 4: Multi-Platform Integration (Months 6-7)

#### Platform Adapter Pattern Implementation
```javascript
// Unified platform interface
class PlatformAdapter {
  constructor(platform, credentials) {
    this.platform = platform;
    this.credentials = credentials;
    this.rateLimiter = new RateLimiter(platform);
  }

  async sendMessage(recipient, message, options = {}) {
    await this.rateLimiter.checkLimit();
    
    switch (this.platform) {
      case 'instagram':
        return this.sendInstagramDM(recipient, message, options);
      case 'whatsapp':
        return this.sendWhatsAppMessage(recipient, message, options);
      case 'telegram':
        return this.sendTelegramMessage(recipient, message, options);
    }
  }

  async getMessages(since) {
    // Platform-specific message retrieval
  }
}

// Cross-platform message queue
class CrossPlatformQueue {
  constructor() {
    this.queues = new Map();
    this.processors = new Map();
  }

  addMessage(platform, message, priority = 'normal') {
    const queueKey = `${platform}:${priority}`;
    if (!this.queues.has(queueKey)) {
      this.queues.set(queueKey, []);
    }
    this.queues.get(queueKey).push(message);
  }

  async processQueue(platform) {
    const adapter = this.processors.get(platform);
    const highPriorityQueue = this.queues.get(`${platform}:high`) || [];
    const normalQueue = this.queues.get(`${platform}:normal`) || [];
    
    // Process high priority first
    for (const message of highPriorityQueue) {
      await adapter.sendMessage(message.recipient, message.content);
    }
    
    for (const message of normalQueue) {
      await adapter.sendMessage(message.recipient, message.content);
    }
  }
}
```

### Phase 5: Enterprise Features (Months 8-9)

#### Superadmin Panel Architecture
```javascript
// Global monitoring system
class GlobalMonitoringService {
  constructor() {
    this.metrics = new MetricsCollector();
    this.alerting = new AlertingService();
  }

  async getSystemHealth() {
    return {
      activeUsers: await this.getUserCount(),
      apiUsage: await this.getAPIUsage(),
      errorRates: await this.getErrorRates(),
      responseTimes: await this.getResponseTimes(),
      queueSizes: await this.getQueueSizes()
    };
  }

  async getUserAnalytics(timeRange) {
    return {
      signups: await this.getSignupTrends(timeRange),
      churn: await this.getChurnRate(timeRange),
      engagement: await this.getEngagementMetrics(timeRange),
      revenue: await this.getRevenueMetrics(timeRange)
    };
  }
}

// Audit logging system
class EnterpriseAuditLogger {
  constructor() {
    this.sensitiveActions = [
      'user_created', 'user_deleted', 'plan_changed',
      'api_key_generated', 'settings_modified'
    ];
  }

  async logAction(action, actor, target, metadata = {}) {
    const auditEntry = {
      action,
      actor: {
        id: actor.id,
        email: actor.email,
        role: actor.role
      },
      target: {
        type: target.type,
        id: target.id,
        name: target.name
      },
      metadata: this.sanitizeMetadata(metadata),
      timestamp: new Date(),
      ip: this.getClientIP(),
      userAgent: this.getUserAgent(),
      severity: this.getSeverity(action)
    };

    await this.auditModel.create(auditEntry);
    
    if (this.sensitiveActions.includes(action)) {
      await this.alerting.sendSecurityAlert(auditEntry);
    }
  }
}
```

### Implementation Priorities and Dependencies

#### Phase 2 Dependencies
1. **Payment Integration**: Stripe/PayPal integration for subscription management
2. **Usage Tracking**: Real-time usage monitoring and limiting
3. **Organization Management**: Multi-tenant data isolation
4. **Role Management**: Permission-based access control

#### Phase 3 Dependencies
1. **AI Provider Setup**: OpenAI/Anthropic API integration
2. **Context Management**: Enhanced data collection for AI training
3. **Confidence Scoring**: AI response quality assessment
4. **Fallback Logic**: Seamless AI-to-keyword fallback

#### Phase 4 Dependencies
1. **WhatsApp Business API**: Meta Business verification
2. **TikTok API**: Platform API access and approval
3. **Telegram Bot API**: Bot creation and management
4. **Unified Schema**: Cross-platform data normalization

#### Phase 5 Dependencies
1. **Enterprise Security**: Enhanced audit logging and compliance
2. **Scalability Infrastructure**: Load balancing and clustering
3. **API Gateway**: Rate limiting and request routing
4. **Monitoring Stack**: Comprehensive observability

### Risk Mitigation for Post-MVP

#### Technical Risks
- **AI Provider Reliability**: Multiple provider fallbacks
- **Platform API Changes**: Adapter pattern for easy updates
- **Scaling Challenges**: Microservices architecture preparation
- **Data Privacy**: GDPR/CCPA compliance implementation

#### Business Risks
- **Feature Complexity**: Gradual rollout with feature flags
- **User Adoption**: Comprehensive onboarding and documentation
- **Competition**: Unique value proposition focus
- **Monetization**: Flexible pricing model testing
