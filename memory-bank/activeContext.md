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
1. **Project Structure Setup**
   - Create frontend and backend directory structure
   - Initialize React app with Vite
   - Setup Express.js backend with basic configuration
   - Configure MongoDB connection and basic models

2. **Development Environment**
   - Setup package.json files for both frontend and backend
   - Configure environment variables and .env files
   - Setup basic development scripts and tooling
   - Initialize Git repository with proper .gitignore

3. **Instagram API Integration Foundation**
   - Setup Meta Developer account and Instagram app
   - Configure webhook endpoints for development
   - Setup ngrok for local webhook testing
   - Create basic Instagram API client structure

### Week 2 Priorities
1. **Authentication System**
   - Implement JWT-based login system
   - Create user model and authentication middleware
   - Setup admin user creation functionality
   - Build basic login UI components

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
- Project structure: ⏳ Pending
- Environment configuration: ⏳ Pending
- Instagram API setup: ⏳ Pending
- Database setup: ⏳ Pending

### Key Configuration Needs
1. Meta Developer account and Instagram app creation
2. MongoDB local installation and configuration
3. Ngrok setup for webhook testing
4. Environment variables configuration
5. Package dependencies installation

### Immediate Blockers
- None currently identified
- All prerequisites can be setup in parallel
- Instagram API access requires Meta Developer approval (may take time)

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
