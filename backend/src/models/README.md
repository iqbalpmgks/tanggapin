# Database Models

This directory contains all MongoDB models for the Tanggapin application using Mongoose ODM.

## Models Overview

### User Model (`User.js`)
Manages user accounts and Instagram integration.

**Key Features:**
- Email/password authentication
- Instagram account connection
- User settings and preferences
- Admin/user role management
- Token expiration tracking

**Key Methods:**
- `isInstagramTokenExpired()` - Check if Instagram token is expired
- `hasValidInstagramConnection()` - Validate Instagram connection
- `findUsersWithExpiredTokens()` - Find users needing token refresh
- `findActiveUsers()` - Get all active users

### Post Model (`Post.js`)
Represents Instagram posts with automation settings.

**Key Features:**
- Instagram post metadata
- Automation configuration per post
- Reply statistics tracking
- Post status management
- Performance metrics

**Key Methods:**
- `enableAutomation(replyMode)` - Enable automation for post
- `disableAutomation()` - Disable automation
- `incrementReplyCounter(type)` - Update reply statistics
- `findAutomationEnabled(userId)` - Get posts with automation enabled
- `getUserPostStats(userId)` - Get user's post statistics

### Keyword Model (`Keyword.js`)
Manages keywords and their automated responses.

**Key Features:**
- Keyword matching with synonyms
- Flexible matching types (exact, contains, starts with, ends with)
- DM and fallback comment responses
- Priority-based matching
- Performance tracking

**Key Methods:**
- `matchesText(text)` - Check if text matches keyword
- `incrementMatch(responseType, responseTime)` - Update match statistics
- `findMatchingKeywords(postId, text)` - Find keywords that match text
- `getTopKeywords(userId, limit)` - Get best performing keywords

### Activity Model (`Activity.js`)
Logs all automation activities and responses.

**Key Features:**
- Complete audit trail of all activities
- Response time tracking
- Error handling and retry logic
- Instagram event processing
- Performance analytics

**Key Methods:**
- `markCompleted(status, responseData)` - Mark activity as completed
- `markFailed(error, canRetry)` - Mark activity as failed
- `markFallback(fallbackMessage)` - Mark as fallback response
- `findByUser(userId, options)` - Get user's activities
- `getActivityStats(userId, timeframe)` - Get activity statistics

## Database Schema Relationships

```
User (1) ←→ (N) Post
User (1) ←→ (N) Keyword
User (1) ←→ (N) Activity

Post (1) ←→ (N) Keyword
Post (1) ←→ (N) Activity

Keyword (1) ←→ (N) Activity
```

## Indexes

### Performance Indexes
- **User**: `email`, `instagramAccount.instagramUserId`, `isActive`, `createdAt`
- **Post**: `userId + createdAt`, `userId + automationSettings.isEnabled`, `instagramPostId`
- **Keyword**: `userId + postId`, `postId + settings.isActive + settings.priority`, `keyword + userId`
- **Activity**: `userId + createdAt`, `postId + createdAt`, `type + status + createdAt`

### Unique Indexes
- **User**: `email` (unique)
- **Post**: `instagramPostId` (unique)
- **Keyword**: `postId + keyword` (unique compound)
- **Activity**: `instagramData.commentId + instagramData.fromUserId + type` (unique compound, sparse)

## Data Validation

### User Model
- Email format validation
- Password minimum length (6 characters)
- Name maximum length (100 characters)
- Instagram token URL validation

### Post Model
- Instagram post ID required
- Post type enum validation
- Caption maximum length (2200 characters)
- Permalink URL format

### Keyword Model
- Keyword length (1-100 characters)
- Response message limits (DM: 1000 chars, Comment: 300 chars)
- Priority range (1-10)
- Product link URL validation

### Activity Model
- Instagram data completeness
- Response message limits
- Status and type enum validation
- Processing time tracking

## Virtual Fields

### User Model
- `displayName` - Returns name or email for display

### Post Model
- `successRate` - Calculated success percentage
- `automationStatus` - Current automation status

### Keyword Model
- `successRate` - Response success percentage
- `allTerms` - Keyword plus all synonyms

### Activity Model
- `processingDuration` - Time taken to process
- `isSuccessful` - Boolean success status
- `statusDisplay` - Human-readable status

## Usage Examples

### Creating a User
```javascript
const { User } = require('./models');

const user = new User({
  email: 'user@example.com',
  password: 'hashedPassword',
  name: 'John Doe',
  role: 'user'
});

await user.save();
```

### Setting up Post Automation
```javascript
const { Post } = require('./models');

const post = await Post.findById(postId);
await post.enableAutomation('BOTH'); // Enable for comments and DMs
```

### Creating Keywords
```javascript
const { Keyword } = require('./models');

const keyword = new Keyword({
  userId: user._id,
  postId: post._id,
  keyword: 'price',
  synonyms: ['cost', 'how much'],
  response: {
    dmMessage: 'Hi! The price is $99. Check it out here: {productLink}',
    fallbackComment: 'Hi! Please check our bio for pricing info 👆',
    productLink: 'https://example.com/product'
  }
});

await keyword.save();
```

### Logging Activity
```javascript
const { Activity } = require('./models');

const activity = new Activity({
  userId: user._id,
  postId: post._id,
  keywordId: keyword._id,
  type: 'COMMENT_RECEIVED',
  status: 'PENDING',
  instagramData: {
    commentId: 'ig_comment_123',
    fromUserId: 'ig_user_456',
    fromUsername: 'customer123',
    originalText: 'What is the price?',
    timestamp: new Date()
  }
});

await activity.save();
```

## Migration Notes

When updating models:
1. Always add new fields as optional or with defaults
2. Create migration scripts for breaking changes
3. Update indexes when adding new query patterns
4. Test performance impact of schema changes
5. Document all changes in this README

## Performance Considerations

1. **Indexing**: All frequently queried fields are indexed
2. **Pagination**: Use `limit()` and `skip()` for large result sets
3. **Population**: Only populate necessary fields to reduce memory usage
4. **Aggregation**: Use MongoDB aggregation for complex analytics
5. **Cleanup**: Implement data archiving for old activities

## Security Notes

1. **Sensitive Data**: Passwords and tokens are excluded from JSON output
2. **Validation**: All user input is validated at the schema level
3. **Sanitization**: Text fields are trimmed and length-limited
4. **Access Control**: User-based data isolation through userId fields
