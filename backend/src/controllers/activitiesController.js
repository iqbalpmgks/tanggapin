const Activity = require('../models/Activity');
const keywordMatchingService = require('../services/KeywordMatchingService');
const logger = require('../config/logger');
const Joi = require('joi');

/**
 * Get activities for the authenticated user
 */
const getActivities = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      page = 1,
      limit = 20,
      status,
      type,
      startDate,
      endDate,
      postId
    } = req.query;

    const options = {
      limit: Math.min(parseInt(limit), 100), // Max 100 items per page
      skip: (parseInt(page) - 1) * parseInt(limit),
      status,
      type,
      startDate,
      endDate
    };

    let query = { userId };
    
    if (postId) {
      query.postId = postId;
    }

    if (status) {
      query.status = status;
    }

    if (type) {
      query.type = type;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const activities = await Activity.find(query)
      .sort({ createdAt: -1 })
      .limit(options.limit)
      .skip(options.skip)
      .populate('postId', 'instagramPostId caption thumbnailUrl')
      .populate('keywordId', 'keyword synonyms response.dmMessage response.fallbackComment');

    const totalCount = await Activity.countDocuments(query);
    const totalPages = Math.ceil(totalCount / options.limit);

    res.json({
      success: true,
      data: {
        activities,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    logger.error('Get activities error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Get activity statistics
 */
const getActivityStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { timeframe = 'week' } = req.query;

    const stats = await Activity.getActivityStats(userId, timeframe);
    const hourlyDistribution = await Activity.getHourlyDistribution(userId);

    // Get keyword matching service metrics
    const serviceMetrics = keywordMatchingService.getMetrics();

    res.json({
      success: true,
      data: {
        stats: stats[0] || {
          totalActivities: 0,
          successfulReplies: 0,
          failedReplies: 0,
          fallbackReplies: 0,
          averageResponseTime: 0,
          totalComments: 0,
          totalDMs: 0
        },
        hourlyDistribution,
        serviceMetrics,
        timeframe
      }
    });
  } catch (error) {
    logger.error('Get activity stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Get single activity details
 */
const getActivityById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { activityId } = req.params;

    const activity = await Activity.findOne({
      _id: activityId,
      userId
    })
    .populate('postId', 'instagramPostId caption thumbnailUrl permalink')
    .populate('keywordId', 'keyword synonyms response settings statistics')
    .populate('userId', 'name email');

    if (!activity) {
      return res.status(404).json({
        success: false,
        error: 'Activity not found'
      });
    }

    res.json({
      success: true,
      data: { activity }
    });
  } catch (error) {
    logger.error('Get activity by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Test keyword matching for a message
 */
const testKeywordMatching = async (req, res) => {
  try {
    const schema = Joi.object({
      postId: Joi.string().required().messages({
        'any.required': 'Post ID is required'
      }),
      text: Joi.string().required().min(1).max(2200).messages({
        'any.required': 'Text is required',
        'string.min': 'Text must be at least 1 character',
        'string.max': 'Text cannot exceed 2200 characters'
      }),
      options: Joi.object({
        enableFuzzyMatching: Joi.boolean().default(false),
        fuzzyThreshold: Joi.number().min(0).max(1).default(0.8),
        enableWordBoundary: Joi.boolean().default(false),
        maxMatches: Joi.number().min(1).max(10).default(5),
        minConfidence: Joi.number().min(0).max(1).default(0.7)
      }).default({})
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { postId, text, options } = value;

    // Test keyword matching
    const matchResult = await keywordMatchingService.matchMessage(
      postId,
      text,
      options
    );

    // Get additional statistics
    const matchingStats = await keywordMatchingService.getMatchingStats(postId);

    res.json({
      success: true,
      data: {
        input: { postId, text, options },
        matchResult,
        matchingStats,
        timestamp: new Date()
      }
    });
  } catch (error) {
    logger.error('Test keyword matching error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Batch test keyword matching for multiple messages
 */
const batchTestKeywordMatching = async (req, res) => {
  try {
    const schema = Joi.object({
      postId: Joi.string().required().messages({
        'any.required': 'Post ID is required'
      }),
      messages: Joi.array().items(
        Joi.alternatives().try(
          Joi.string().min(1).max(2200),
          Joi.object({
            id: Joi.string(),
            text: Joi.string().required().min(1).max(2200)
          })
        )
      ).min(1).max(20).required().messages({
        'any.required': 'Messages array is required',
        'array.min': 'At least 1 message is required',
        'array.max': 'Maximum 20 messages allowed'
      }),
      options: Joi.object({
        enableFuzzyMatching: Joi.boolean().default(false),
        fuzzyThreshold: Joi.number().min(0).max(1).default(0.8),
        enableWordBoundary: Joi.boolean().default(false),
        maxMatches: Joi.number().min(1).max(10).default(5),
        minConfidence: Joi.number().min(0).max(1).default(0.7)
      }).default({})
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { postId, messages, options } = value;

    // Batch test keyword matching
    const batchResult = await keywordMatchingService.matchMessages(
      postId,
      messages,
      options
    );

    res.json({
      success: true,
      data: {
        input: { postId, messages, options },
        batchResult,
        timestamp: new Date()
      }
    });
  } catch (error) {
    logger.error('Batch test keyword matching error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Get keyword matching statistics for a post
 */
const getKeywordMatchingStats = async (req, res) => {
  try {
    const { postId } = req.params;
    const { startDate, endDate } = req.query;

    const timeRange = {};
    if (startDate) timeRange.startDate = startDate;
    if (endDate) timeRange.endDate = endDate;

    const stats = await keywordMatchingService.getMatchingStats(postId, timeRange);
    const serviceMetrics = keywordMatchingService.getMetrics();

    res.json({
      success: true,
      data: {
        postId,
        timeRange,
        stats,
        serviceMetrics,
        timestamp: new Date()
      }
    });
  } catch (error) {
    logger.error('Get keyword matching stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Refresh keyword cache for a post
 */
const refreshKeywordCache = async (req, res) => {
  try {
    const { postId } = req.params;

    const success = await keywordMatchingService.refreshKeywordCache(postId);

    if (success) {
      res.json({
        success: true,
        message: 'Keyword cache refreshed successfully',
        data: { postId, timestamp: new Date() }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to refresh keyword cache'
      });
    }
  } catch (error) {
    logger.error('Refresh keyword cache error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Clear all keyword cache
 */
const clearKeywordCache = async (req, res) => {
  try {
    keywordMatchingService.clearCache();

    res.json({
      success: true,
      message: 'All keyword cache cleared successfully',
      data: { timestamp: new Date() }
    });
  } catch (error) {
    logger.error('Clear keyword cache error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Get service performance metrics
 */
const getServiceMetrics = async (req, res) => {
  try {
    const metrics = keywordMatchingService.getMetrics();

    res.json({
      success: true,
      data: {
        metrics,
        timestamp: new Date()
      }
    });
  } catch (error) {
    logger.error('Get service metrics error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Export activity data
 */
const exportActivities = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      format = 'json',
      startDate,
      endDate,
      status,
      type
    } = req.query;

    let query = { userId };
    
    if (status) query.status = status;
    if (type) query.type = type;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const activities = await Activity.find(query)
      .sort({ createdAt: -1 })
      .limit(1000) // Limit export to 1000 records
      .populate('postId', 'instagramPostId caption')
      .populate('keywordId', 'keyword')
      .lean();

    if (format === 'csv') {
      // Convert to CSV format
      const csvData = activities.map(activity => ({
        id: activity._id,
        type: activity.type,
        status: activity.status,
        fromUsername: activity.instagramData.fromUsername,
        originalText: activity.instagramData.originalText,
        matchedKeyword: activity.matchingData?.matchedTerm || '',
        confidence: activity.matchingData?.confidence || '',
        responseType: activity.response?.type || '',
        processingTime: activity.metadata?.processingTime || '',
        createdAt: activity.createdAt
      }));

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=activities.csv');
      
      // Simple CSV conversion (in production, use a proper CSV library)
      const csvHeaders = Object.keys(csvData[0] || {}).join(',');
      const csvRows = csvData.map(row => Object.values(row).join(','));
      const csvContent = [csvHeaders, ...csvRows].join('\n');
      
      res.send(csvContent);
    } else {
      // JSON format
      res.json({
        success: true,
        data: {
          activities,
          exportInfo: {
            format,
            totalRecords: activities.length,
            filters: { status, type, startDate, endDate },
            exportedAt: new Date()
          }
        }
      });
    }
  } catch (error) {
    logger.error('Export activities error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

module.exports = {
  getActivities,
  getActivityStats,
  getActivityById,
  testKeywordMatching,
  batchTestKeywordMatching,
  getKeywordMatchingStats,
  refreshKeywordCache,
  clearKeywordCache,
  getServiceMetrics,
  exportActivities
};
