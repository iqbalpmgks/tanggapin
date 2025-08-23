# Keyword Matching Algorithm Implementation Plan

## Overview
This document outlines the implementation plan for the Reply Engine Foundation's keyword matching algorithm module. The module will provide a clean, efficient way to match user messages against configured keywords and return relevant tags for the reply system.

## Current State Analysis

### Existing Implementation
- **Keyword Model**: Already exists with comprehensive schema including synonyms, match types, and statistics
- **Basic Matching**: `matchesText()` method exists in Keyword model but is instance-based
- **Webhook Integration**: Basic webhook processing exists but uses `Keyword.findMatchingKeywords()` static method
- **Match Types**: EXACT, CONTAINS, STARTS_WITH, ENDS_WITH already supported

### Gaps Identified
1. **No dedicated service layer**: Keyword matching logic is scattered across model methods
2. **Limited performance optimization**: No caching or batch processing
3. **No advanced matching**: Missing fuzzy matching, stemming, or NLP features
4. **No tag system**: Current implementation returns keyword objects, not tags
5. **No centralized configuration**: Match settings are per-keyword only

## Implementation Strategy

### 1. Create Keyword Matching Service
**File**: `backend/src/services/KeywordMatchingService.js`

**Features**:
- Centralized keyword matching logic
- Performance optimizations (caching, indexing)
- Support for multiple match strategies
- Tag-based response system
- Batch processing capabilities
- Statistics tracking

### 2. Enhanced Matching Algorithms
**Algorithms to implement**:
- **String Matching**: Exact, contains, starts/ends with (existing)
- **Fuzzy Matching**: Levenshtein distance for typos
- **Word Boundary Matching**: Whole word matching
- **Stemming**: Basic word stem matching
- **Priority-based Matching**: Multiple keyword conflicts resolution

### 3. Tag System Implementation
**Tag Structure**:
```javascript
{
  tag: 'product_inquiry',
  confidence: 0.95,
  matchedKeyword: 'price',
  matchedTerm: 'harga',
  matchType: 'SYNONYM',
  priority: 8,
  responseTemplate: 'dm_price_inquiry'
}
```

### 4. Performance Optimizations
- **In-memory caching**: Frequently used keywords
- **Batch processing**: Multiple messages at once
- **Indexing strategy**: Optimized database queries
- **Lazy loading**: Load keywords only when needed

## Detailed Implementation Plan

### Phase 1: Core Service Structure
1. Create `KeywordMatchingService` class
2. Implement basic string matching methods
3. Add caching layer for keywords
4. Create tag generation logic
5. Add comprehensive error handling

### Phase 2: Advanced Matching
1. Implement fuzzy matching algorithm
2. Add word boundary detection
3. Create stemming functionality
4. Implement priority-based conflict resolution
5. Add confidence scoring

### Phase 3: Performance & Integration
1. Optimize database queries
2. Add batch processing capabilities
3. Integrate with existing webhook system
4. Add comprehensive logging
5. Create unit tests

### Phase 4: Analytics & Monitoring
1. Add match statistics tracking
2. Create performance metrics
3. Implement match quality scoring
4. Add debugging tools
5. Create admin dashboard integration

## Technical Specifications

### Service Interface
```javascript
class KeywordMatchingService {
  // Core matching method
  async matchMessage(postId, messageText, options = {})
  
  // Batch processing
  async matchMessages(postId, messages, options = {})
  
  // Cache management
  async refreshKeywordCache(postId)
  
  // Statistics
  async getMatchingStats(postId, timeRange)
}
```

### Match Options
```javascript
const matchOptions = {
  enableFuzzyMatching: true,
  fuzzyThreshold: 0.8,
  enableStemming: false,
  maxMatches: 5,
  minConfidence: 0.7,
  priorityWeighting: true
}
```

### Response Format
```javascript
const matchResult = {
  success: true,
  matches: [
    {
      tag: 'product_inquiry',
      confidence: 0.95,
      keyword: keywordObject,
      matchedTerm: 'harga',
      matchType: 'SYNONYM',
      responseData: {
        dmMessage: 'Template message',
        fallbackComment: 'Fallback message',
        productLink: 'https://...'
      }
    }
  ],
  processingTime: 45,
  cacheHit: true
}
```

## Database Optimizations

### New Indexes
```javascript
// Compound index for fast keyword lookup
{ postId: 1, 'settings.isActive': 1, 'settings.priority': -1 }

// Text search index for advanced matching
{ keyword: 'text', synonyms: 'text' }

// Performance monitoring index
{ 'statistics.totalMatches': -1, 'statistics.averageResponseTime': 1 }
```

### Cache Strategy
- **L1 Cache**: In-memory keyword cache per post (Redis-like structure)
- **L2 Cache**: Database query result caching
- **TTL**: 5 minutes for keyword cache, 1 hour for statistics

## Integration Points

### Webhook Controller Integration
```javascript
// Replace existing logic in webhookController.js
const matchResult = await keywordMatchingService.matchMessage(
  post._id, 
  text, 
  { enableFuzzyMatching: true }
);

if (matchResult.success && matchResult.matches.length > 0) {
  const bestMatch = matchResult.matches[0];
  // Process response using bestMatch.responseData
}
```

### API Endpoints
- `POST /api/keywords/test-match` - Test keyword matching
- `GET /api/keywords/:postId/matches` - Get match statistics
- `POST /api/keywords/batch-test` - Batch testing interface

## Testing Strategy

### Unit Tests
- String matching algorithms
- Fuzzy matching accuracy
- Cache performance
- Tag generation logic
- Error handling scenarios

### Integration Tests
- Database query performance
- Webhook integration
- Cache invalidation
- Statistics accuracy

### Performance Tests
- Large keyword set matching
- Concurrent request handling
- Memory usage optimization
- Response time benchmarks

## Success Metrics

### Performance Targets
- **Match Time**: < 50ms for single message
- **Batch Processing**: < 200ms for 10 messages
- **Cache Hit Rate**: > 80%
- **Memory Usage**: < 100MB for 1000 keywords

### Accuracy Targets
- **Exact Match**: 100% accuracy
- **Fuzzy Match**: > 90% accuracy for common typos
- **False Positive Rate**: < 5%
- **False Negative Rate**: < 10%

## Implementation Timeline

### Week 1: Core Implementation
- [x] Analysis and planning
- [ ] Create KeywordMatchingService class
- [ ] Implement basic string matching
- [ ] Add caching layer
- [ ] Create tag system

### Week 2: Advanced Features
- [ ] Implement fuzzy matching
- [ ] Add word boundary detection
- [ ] Create priority resolution
- [ ] Add confidence scoring
- [ ] Performance optimization

### Week 3: Integration & Testing
- [ ] Integrate with webhook system
- [ ] Create API endpoints
- [ ] Write comprehensive tests
- [ ] Performance benchmarking
- [ ] Documentation

## Risk Mitigation

### Technical Risks
1. **Performance Degradation**: Implement caching and optimize queries
2. **Memory Leaks**: Proper cache management and cleanup
3. **False Matches**: Comprehensive testing and confidence scoring
4. **Integration Issues**: Gradual rollout with feature flags

### Business Risks
1. **User Experience**: Maintain backward compatibility
2. **Data Loss**: Comprehensive logging and rollback procedures
3. **Downtime**: Zero-downtime deployment strategy

## Future Enhancements

### Post-MVP Features
1. **Machine Learning**: AI-powered keyword suggestions
2. **Natural Language Processing**: Intent recognition
3. **Multi-language Support**: International keyword matching
4. **Advanced Analytics**: Match pattern analysis
5. **A/B Testing**: Keyword performance comparison

### Scalability Considerations
1. **Microservice Architecture**: Separate matching service
2. **Distributed Caching**: Redis cluster for large scale
3. **Queue Processing**: Async matching for high volume
4. **Load Balancing**: Multiple service instances
