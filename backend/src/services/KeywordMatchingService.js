const Keyword = require('../models/Keyword');
const logger = require('../config/logger');

/**
 * Keyword Matching Service
 * Provides centralized keyword matching logic with performance optimizations
 */
class KeywordMatchingService {
  constructor() {
    // In-memory cache for keywords by postId
    this.keywordCache = new Map();
    this.cacheTimestamps = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes
    
    // Performance metrics
    this.metrics = {
      totalMatches: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageMatchTime: 0
    };
  }

  /**
   * Match a single message against keywords for a specific post
   * @param {string} postId - MongoDB ObjectId of the post
   * @param {string} messageText - Text to match against keywords
   * @param {Object} options - Matching options
   * @returns {Object} Match result with tags and metadata
   */
  async matchMessage(postId, messageText, options = {}) {
    const startTime = Date.now();
    
    try {
      // Validate inputs
      if (!postId || !messageText) {
        return {
          success: false,
          error: 'Missing required parameters: postId and messageText',
          matches: [],
          processingTime: Date.now() - startTime
        };
      }

      // Set default options
      const matchOptions = {
        enableFuzzyMatching: options.enableFuzzyMatching || false,
        fuzzyThreshold: options.fuzzyThreshold || 0.8,
        enableWordBoundary: options.enableWordBoundary || false,
        maxMatches: options.maxMatches || 5,
        minConfidence: options.minConfidence || 0.7,
        priorityWeighting: options.priorityWeighting !== false,
        ...options
      };

      // Get keywords for the post (with caching)
      const keywords = await this.getKeywordsForPost(postId);
      
      if (!keywords || keywords.length === 0) {
        return {
          success: true,
          matches: [],
          processingTime: Date.now() - startTime,
          cacheHit: this.keywordCache.has(postId),
          reason: 'No active keywords found for post'
        };
      }

      // Perform matching
      const matches = this.performMatching(messageText, keywords, matchOptions);
      
      // Sort matches by confidence and priority
      const sortedMatches = this.sortMatches(matches, matchOptions);
      
      // Limit results
      const limitedMatches = sortedMatches.slice(0, matchOptions.maxMatches);
      
      // Filter by minimum confidence
      const filteredMatches = limitedMatches.filter(
        match => match.confidence >= matchOptions.minConfidence
      );

      // Update metrics
      this.updateMetrics(startTime);

      return {
        success: true,
        matches: filteredMatches,
        processingTime: Date.now() - startTime,
        cacheHit: this.keywordCache.has(postId.toString()),
        totalKeywords: keywords.length,
        matchOptions
      };

    } catch (error) {
      logger.error('KeywordMatchingService.matchMessage error:', error);
      return {
        success: false,
        error: error.message,
        matches: [],
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Match multiple messages in batch
   * @param {string} postId - MongoDB ObjectId of the post
   * @param {Array} messages - Array of message objects {text, id}
   * @param {Object} options - Matching options
   * @returns {Object} Batch match results
   */
  async matchMessages(postId, messages, options = {}) {
    const startTime = Date.now();
    
    try {
      if (!Array.isArray(messages) || messages.length === 0) {
        return {
          success: false,
          error: 'Messages must be a non-empty array',
          results: [],
          processingTime: Date.now() - startTime
        };
      }

      const results = [];
      
      // Process each message
      for (const message of messages) {
        const messageText = typeof message === 'string' ? message : message.text;
        const messageId = typeof message === 'object' ? message.id : null;
        
        const matchResult = await this.matchMessage(postId, messageText, options);
        
        results.push({
          messageId,
          messageText,
          ...matchResult
        });
      }

      return {
        success: true,
        results,
        totalMessages: messages.length,
        processingTime: Date.now() - startTime,
        summary: this.generateBatchSummary(results)
      };

    } catch (error) {
      logger.error('KeywordMatchingService.matchMessages error:', error);
      return {
        success: false,
        error: error.message,
        results: [],
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Get keywords for a post with caching
   * @param {string} postId - MongoDB ObjectId of the post
   * @returns {Array} Array of keyword objects
   */
  async getKeywordsForPost(postId) {
    const cacheKey = postId.toString();
    const now = Date.now();
    
    // Check cache validity
    const isCacheHit = this.keywordCache.has(cacheKey);
    if (isCacheHit) {
      const cacheTime = this.cacheTimestamps.get(cacheKey);
      if (now - cacheTime < this.cacheTTL) {
        this.metrics.cacheHits++;
        return this.keywordCache.get(cacheKey);
      } else {
        // Cache expired, remove it
        this.keywordCache.delete(cacheKey);
        this.cacheTimestamps.delete(cacheKey);
      }
    }

    // Fetch from database
    this.metrics.cacheMisses++;
    
    try {
      const keywords = await Keyword.find({
        postId,
        'settings.isActive': true
      }).sort({ 'settings.priority': -1, createdAt: 1 });

      // Cache the result
      this.keywordCache.set(cacheKey, keywords);
      this.cacheTimestamps.set(cacheKey, now);

      return keywords;
    } catch (error) {
      // Handle invalid ObjectId or other database errors
      if (error.name === 'CastError') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Perform keyword matching against message text
   * @param {string} messageText - Text to match
   * @param {Array} keywords - Array of keyword objects
   * @param {Object} options - Matching options
   * @returns {Array} Array of match objects
   */
  performMatching(messageText, keywords, options) {
    const matches = [];
    const normalizedText = messageText.toLowerCase().trim();

    for (const keyword of keywords) {
      const matchResult = this.matchKeyword(normalizedText, keyword, options);
      if (matchResult) {
        matches.push({
          tag: this.generateTag(keyword),
          confidence: matchResult.confidence,
          keyword: keyword,
          matchedTerm: matchResult.matchedTerm,
          matchType: matchResult.matchType,
          priority: keyword.settings.priority,
          responseData: {
            dmMessage: keyword.response.dmMessage,
            fallbackComment: keyword.response.fallbackComment,
            productLink: keyword.response.includeProductLink ? keyword.response.productLink : null
          },
          keywordId: keyword._id,
          settings: keyword.settings
        });
      }
    }

    return matches;
  }

  /**
   * Match a single keyword against text
   * @param {string} text - Normalized text to match
   * @param {Object} keyword - Keyword object
   * @param {Object} options - Matching options
   * @returns {Object|null} Match result or null if no match
   */
  matchKeyword(text, keyword, options) {
    const allTerms = [keyword.keyword, ...keyword.synonyms];
    const caseSensitive = keyword.settings.caseSensitive;
    
    for (const term of allTerms) {
      const normalizedTerm = caseSensitive ? term : term.toLowerCase();
      const searchText = caseSensitive ? text : text.toLowerCase();
      
      // Try exact matching first
      const exactMatch = this.performExactMatch(searchText, normalizedTerm, keyword.settings.matchType, options);
      if (exactMatch) {
        return {
          confidence: 1.0,
          matchedTerm: term,
          matchType: term === keyword.keyword ? 'KEYWORD' : 'SYNONYM'
        };
      }

      // Try fuzzy matching if enabled
      if (options.enableFuzzyMatching) {
        const fuzzyMatch = this.performFuzzyMatch(searchText, normalizedTerm, options);
        if (fuzzyMatch && fuzzyMatch.confidence >= options.fuzzyThreshold) {
          return {
            confidence: fuzzyMatch.confidence,
            matchedTerm: term,
            matchType: `FUZZY_${term === keyword.keyword ? 'KEYWORD' : 'SYNONYM'}`
          };
        }
      }
    }

    return null;
  }

  /**
   * Perform exact string matching
   * @param {string} text - Text to search in
   * @param {string} term - Term to search for
   * @param {string} matchType - Type of matching (EXACT, CONTAINS, etc.)
   * @param {Object} options - Matching options
   * @returns {boolean} True if match found
   */
  performExactMatch(text, term, matchType, options) {
    switch (matchType) {
      case 'EXACT':
        return text === term;
      
      case 'CONTAINS':
        if (options.enableWordBoundary) {
          // Use word boundary regex for more precise matching
          const regex = new RegExp(`\\b${this.escapeRegex(term)}\\b`, 'i');
          return regex.test(text);
        }
        return text.includes(term);
      
      case 'STARTS_WITH':
        return text.startsWith(term);
      
      case 'ENDS_WITH':
        return text.endsWith(term);
      
      default:
        return text.includes(term);
    }
  }

  /**
   * Perform fuzzy string matching using Levenshtein distance
   * @param {string} text - Text to search in
   * @param {string} term - Term to search for
   * @param {Object} options - Matching options
   * @returns {Object|null} Fuzzy match result with confidence
   */
  performFuzzyMatch(text, term, options) {
    // For fuzzy matching, we'll check each word in the text
    const words = text.split(/\s+/);
    let bestMatch = null;
    let bestConfidence = 0;

    for (const word of words) {
      const distance = this.levenshteinDistance(word, term);
      const maxLength = Math.max(word.length, term.length);
      const confidence = maxLength > 0 ? 1 - (distance / maxLength) : 0;

      if (confidence > bestConfidence && confidence >= options.fuzzyThreshold) {
        bestConfidence = confidence;
        bestMatch = {
          confidence: confidence,
          matchedWord: word
        };
      }
    }

    return bestMatch;
  }

  /**
   * Calculate Levenshtein distance between two strings
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {number} Edit distance
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];

    // Initialize matrix
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Sort matches by confidence and priority
   * @param {Array} matches - Array of match objects
   * @param {Object} options - Matching options
   * @returns {Array} Sorted matches
   */
  sortMatches(matches, options) {
    return matches.sort((a, b) => {
      if (options.priorityWeighting) {
        // First sort by priority, then by confidence
        if (a.priority !== b.priority) {
          return b.priority - a.priority; // Higher priority first
        }
      }
      
      // Then sort by confidence
      return b.confidence - a.confidence; // Higher confidence first
    });
  }

  /**
   * Generate a tag from keyword
   * @param {Object} keyword - Keyword object
   * @returns {string} Generated tag
   */
  generateTag(keyword) {
    // Generate a tag based on keyword and settings
    const baseTag = keyword.keyword.replace(/\s+/g, '_').toLowerCase();
    const priority = keyword.settings.priority;
    
    // Add priority suffix for high priority keywords
    if (priority >= 8) {
      return `high_priority_${baseTag}`;
    } else if (priority >= 5) {
      return `medium_priority_${baseTag}`;
    } else {
      return `low_priority_${baseTag}`;
    }
  }

  /**
   * Generate summary for batch processing results
   * @param {Array} results - Array of match results
   * @returns {Object} Summary statistics
   */
  generateBatchSummary(results) {
    const summary = {
      totalMessages: results.length,
      messagesWithMatches: 0,
      messagesWithoutMatches: 0,
      totalMatches: 0,
      averageMatchesPerMessage: 0,
      averageProcessingTime: 0,
      cacheHitRate: 0
    };

    let totalProcessingTime = 0;
    let cacheHits = 0;

    for (const result of results) {
      if (result.matches && result.matches.length > 0) {
        summary.messagesWithMatches++;
        summary.totalMatches += result.matches.length;
      } else {
        summary.messagesWithoutMatches++;
      }

      totalProcessingTime += result.processingTime || 0;
      if (result.cacheHit) {
        cacheHits++;
      }
    }

    summary.averageMatchesPerMessage = summary.totalMessages > 0 
      ? Math.round((summary.totalMatches / summary.totalMessages) * 100) / 100 
      : 0;
    
    summary.averageProcessingTime = summary.totalMessages > 0 
      ? Math.round(totalProcessingTime / summary.totalMessages) 
      : 0;
    
    summary.cacheHitRate = summary.totalMessages > 0 
      ? Math.round((cacheHits / summary.totalMessages) * 100) 
      : 0;

    return summary;
  }

  /**
   * Refresh keyword cache for a specific post
   * @param {string} postId - MongoDB ObjectId of the post
   * @returns {boolean} Success status
   */
  async refreshKeywordCache(postId) {
    try {
      const cacheKey = postId.toString();
      
      // Remove from cache
      this.keywordCache.delete(cacheKey);
      this.cacheTimestamps.delete(cacheKey);
      
      // Reload from database
      await this.getKeywordsForPost(postId);
      
      logger.info(`Keyword cache refreshed for post: ${postId}`);
      return true;
    } catch (error) {
      logger.error('Error refreshing keyword cache:', error);
      return false;
    }
  }

  /**
   * Clear all keyword cache
   */
  clearCache() {
    this.keywordCache.clear();
    this.cacheTimestamps.clear();
    logger.info('Keyword cache cleared');
  }

  /**
   * Get matching statistics for a post
   * @param {string} postId - MongoDB ObjectId of the post
   * @param {Object} timeRange - Time range for statistics
   * @returns {Object} Statistics object
   */
  async getMatchingStats(postId, timeRange = {}) {
    try {
      const { startDate, endDate } = timeRange;
      const matchConditions = { postId };
      
      if (startDate || endDate) {
        matchConditions.updatedAt = {};
        if (startDate) matchConditions.updatedAt.$gte = new Date(startDate);
        if (endDate) matchConditions.updatedAt.$lte = new Date(endDate);
      }

      const keywords = await Keyword.find(matchConditions);
      
      const stats = {
        totalKeywords: keywords.length,
        activeKeywords: keywords.filter(k => k.settings.isActive).length,
        totalMatches: keywords.reduce((sum, k) => sum + k.statistics.totalMatches, 0),
        successfulReplies: keywords.reduce((sum, k) => sum + k.statistics.successfulReplies, 0),
        failedReplies: keywords.reduce((sum, k) => sum + k.statistics.failedReplies, 0),
        fallbackReplies: keywords.reduce((sum, k) => sum + k.statistics.fallbackReplies, 0),
        averageResponseTime: this.calculateAverageResponseTime(keywords),
        topKeywords: keywords
          .filter(k => k.statistics.totalMatches > 0)
          .sort((a, b) => b.statistics.totalMatches - a.statistics.totalMatches)
          .slice(0, 5)
          .map(k => ({
            keyword: k.keyword,
            matches: k.statistics.totalMatches,
            successRate: k.successRate
          }))
      };

      // Calculate success rate
      const totalReplies = stats.successfulReplies + stats.failedReplies + stats.fallbackReplies;
      stats.successRate = totalReplies > 0 ? Math.round((stats.successfulReplies / totalReplies) * 100) : 0;

      return stats;
    } catch (error) {
      logger.error('Error getting matching stats:', error);
      throw error;
    }
  }

  /**
   * Calculate average response time from keywords
   * @param {Array} keywords - Array of keyword objects
   * @returns {number} Average response time in milliseconds
   */
  calculateAverageResponseTime(keywords) {
    const validKeywords = keywords.filter(k => 
      k.statistics.averageResponseTime && k.statistics.averageResponseTime > 0
    );
    
    if (validKeywords.length === 0) return 0;
    
    const totalTime = validKeywords.reduce((sum, k) => sum + k.statistics.averageResponseTime, 0);
    return Math.round(totalTime / validKeywords.length);
  }

  /**
   * Update performance metrics
   * @param {number} startTime - Start time of operation
   */
  updateMetrics(startTime) {
    this.metrics.totalMatches++;
    const processingTime = Date.now() - startTime;
    
    // Update average match time
    this.metrics.averageMatchTime = Math.round(
      (this.metrics.averageMatchTime * (this.metrics.totalMatches - 1) + processingTime) / this.metrics.totalMatches
    );
  }

  /**
   * Get service performance metrics
   * @returns {Object} Performance metrics
   */
  getMetrics() {
    const cacheSize = this.keywordCache.size;
    const totalCacheRequests = this.metrics.cacheHits + this.metrics.cacheMisses;
    const cacheHitRate = totalCacheRequests > 0 
      ? Math.round((this.metrics.cacheHits / totalCacheRequests) * 100) 
      : 0;

    return {
      ...this.metrics,
      cacheSize,
      cacheHitRate,
      totalCacheRequests
    };
  }

  /**
   * Escape special regex characters
   * @param {string} string - String to escape
   * @returns {string} Escaped string
   */
  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

// Create singleton instance
const keywordMatchingService = new KeywordMatchingService();

module.exports = keywordMatchingService;
