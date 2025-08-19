const Activity = require('../models/Activity');
const logger = require('../config/logger');
const Joi = require('joi');

// Validation schemas
const createActivitySchema = Joi.object({
  postId: Joi.string().required().messages({
    'any.required': 'Post ID is required'
  }),
  keywordId: Joi.string().optional(),
  type: Joi.string().valid('COMMENT_RECEIVED', 'DM_SENT', 'COMMENT_REPLIED', 'FALLBACK_COMMENT', 'ERROR').required().messages({
    'any.only': 'Type must be one of: COMMENT_RECEIVED, DM_SENT, COMMENT_REPLIED, FALLBACK_COMMENT, ERROR',
    'any.required': 'Activity type is required'
  }),
  status: Joi.string().valid('SUCCESS', 'FAILED', 'PENDING', 'FALLBACK').required().messages({
    'any.only': 'Status must be one of: SUCCESS, FAILED, PENDING, FALLBACK',
    'any.required': 'Activity status is required'
  }),
  instagramData: Joi.object({
    commentId: Joi.string().optional(),
    messageId: Joi.string().optional(),
    fromUserId: Joi.string().required().messages({
      'any.required': 'Instagram user ID is required'
    }),
    fromUsername: Joi.string().required().messages({
      'any.required': 'Instagram username is required'
    }),
    originalText: Joi.string().required().messages({
      'any.required': 'Original text is required'
    }),
    timestamp: Joi.date().required().messages({
      'any.required': 'Instagram timestamp is required'
    })
  }).required(),
  matchedKeyword: Joi.object({
    keyword: Joi.string().optional(),
    matchType: Joi.string().valid('EXACT', 'CONTAINS', 'STARTS_WITH', 'ENDS_WITH').optional(),
    matchedTerm: Joi.string().optional()
  }).optional(),
  response: Joi.object({
    type: Joi.string().valid('DM', 'COMMENT', 'NONE').default('NONE'),
    message: Joi.string().optional(),
    sentAt: Joi.date().optional(),
    deliveredAt: Joi.date().optional(),
    instagramResponseId: Joi.string().optional()
  }).optional(),
  error: Joi.object({
    code: Joi.string().optional(),
    message: Joi.string().optional(),
    details: Joi.any().optional()
  }).optional()
});

const retryActivitySchema = Joi.object({
  reason: Joi.string().optional()
});

const batchRetrySchema = Joi.object({
  activityIds: Joi.array().items(Joi.string()).min(1).max(100).required().messages({
    'array.min': 'At least one activity ID is required',
    'array.max': 'Cannot retry more than 100 activities at once'
  }),
  reason: Joi.string().optional()
});

const getActivities = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      page = 1,
      limit = 50,
      status,
      type,
      postId,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build options for the findByUser method
    const options = {
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      status,
      type,
      startDate,
      endDate
    };

    // Add postId filter if provided
    let query = { userId };
    if (postId) query.postId = postId;
    if (status) query.status = status;
    if (type) query.type = type;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Execute query with pagination
    const sortDirection = sortOrder === 'desc' ? -1 : 1;
    const activities = await Activity.find(query)
      .sort({ [sortBy]: sortDirection })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('postId', 'instagramPostId caption thumbnailUrl')
      .populate('keywordId', 'keyword response.dmMessage');

    // Get total count for pagination
    const totalActivities = await Activity.countDocuments(query);
    const totalPages = Math.ceil(totalActivities / parseInt(limit));

    logger.info(`Retrieved ${activities.length} activities for user ${req.user.email}`);

    res.json({
      success: true,
      data: {
        activities,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalActivities,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
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

const getActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const activity = await Activity.findOne({ _id: id, userId })
      .populate('postId', 'instagramPostId caption thumbnailUrl')
      .populate('keywordId', 'keyword synonyms response settings')
      .populate('userId', 'name email');

    if (!activity) {
      return res.status(404).json({
        success: false,
        error: 'Activity not found'
      });
    }

    logger.info(`Retrieved activity ${id} for user ${req.user.email}`);

    res.json({
      success: true,
      data: {
        activity
      }
    });
  } catch (error) {
    logger.error('Get activity error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

const createActivity = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = createActivitySchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const userId = req.user._id;

    // Create new activity
    const activityData = {
      ...value,
      userId
    };

    const activity = new Activity(activityData);
    await activity.save();

    // Populate the response
    await activity.populate('postId', 'instagramPostId caption');
    if (activity.keywordId) {
      await activity.populate('keywordId', 'keyword response.dmMessage');
    }

    logger.info(`New activity created: ${activity.type} for post ${activity.postId?.instagramPostId} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Activity created successfully',
      data: {
        activity
      }
    });
  } catch (error) {
    logger.error('Create activity error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

const getActivitiesByPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;
    const {
      page = 1,
      limit = 20,
      status,
      type
    } = req.query;

    // Build query
    const query = { userId, postId };
    if (status) query.status = status;
    if (type) query.type = type;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const activities = await Activity.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('keywordId', 'keyword response.dmMessage');

    // Get total count for pagination
    const totalActivities = await Activity.countDocuments(query);
    const totalPages = Math.ceil(totalActivities / parseInt(limit));

    logger.info(`Retrieved ${activities.length} activities for post ${postId} by user ${req.user.email}`);

    res.json({
      success: true,
      data: {
        activities,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalActivities,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    logger.error('Get activities by post error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

const getActivitiesOverview = async (req, res) => {
  try {
    const userId = req.user._id;
    const { timeframe = 'week' } = req.query;

    // Get activity statistics
    const activityStats = await Activity.getActivityStats(userId, timeframe);
    const stats = activityStats[0] || {
      totalActivities: 0,
      successfulReplies: 0,
      failedReplies: 0,
      fallbackReplies: 0,
      averageResponseTime: 0,
      totalComments: 0,
      totalDMs: 0
    };

    // Calculate success rate
    const totalReplies = stats.successfulReplies + stats.failedReplies + stats.fallbackReplies;
    const successRate = totalReplies > 0 ? Math.round((stats.successfulReplies / totalReplies) * 100) : 0;

    // Get recent activities
    const recentActivities = await Activity.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('type status instagramData.fromUsername response.type createdAt')
      .populate('postId', 'instagramPostId');

    res.json({
      success: true,
      data: {
        overview: {
          ...stats,
          successRate,
          totalReplies
        },
        recentActivities
      }
    });
  } catch (error) {
    logger.error('Get activities overview error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

const getHourlyDistribution = async (req, res) => {
  try {
    const userId = req.user._id;
    const { days = 7 } = req.query;

    const hourlyData = await Activity.getHourlyDistribution(userId, parseInt(days));

    // Fill in missing hours with zero counts
    const fullHourlyData = Array.from({ length: 24 }, (_, hour) => {
      const existing = hourlyData.find(item => item._id === hour);
      return {
        hour,
        count: existing ? existing.count : 0,
        successCount: existing ? existing.successCount : 0
      };
    });

    res.json({
      success: true,
      data: {
        hourlyDistribution: fullHourlyData,
        period: `Last ${days} days`
      }
    });
  } catch (error) {
    logger.error('Get hourly distribution error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

const getPerformanceStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const { timeframe = 'week' } = req.query;

    // Get activity statistics for different timeframes
    const currentStats = await Activity.getActivityStats(userId, timeframe);
    
    // Calculate previous period for comparison
    let previousTimeframe;
    switch (timeframe) {
      case 'day':
        previousTimeframe = 'day';
        break;
      case 'week':
        previousTimeframe = 'week';
        break;
      case 'month':
        previousTimeframe = 'month';
        break;
      default:
        previousTimeframe = 'week';
    }

    const current = currentStats[0] || {
      totalActivities: 0,
      successfulReplies: 0,
      failedReplies: 0,
      fallbackReplies: 0,
      averageResponseTime: 0
    };

    // Calculate performance metrics
    const totalReplies = current.successfulReplies + current.failedReplies + current.fallbackReplies;
    const successRate = totalReplies > 0 ? Math.round((current.successfulReplies / totalReplies) * 100) : 0;
    const fallbackRate = totalReplies > 0 ? Math.round((current.fallbackReplies / totalReplies) * 100) : 0;

    res.json({
      success: true,
      data: {
        performance: {
          totalActivities: current.totalActivities,
          totalReplies,
          successRate,
          fallbackRate,
          averageResponseTime: Math.round(current.averageResponseTime || 0),
          breakdown: {
            successful: current.successfulReplies,
            failed: current.failedReplies,
            fallback: current.fallbackReplies
          }
        },
        timeframe
      }
    });
  } catch (error) {
    logger.error('Get performance stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

const retryActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Validate request body
    const { error, value } = retryActivitySchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const activity = await Activity.findOne({ _id: id, userId });
    if (!activity) {
      return res.status(404).json({
        success: false,
        error: 'Activity not found'
      });
    }

    if (activity.status !== 'FAILED') {
      return res.status(400).json({
        success: false,
        error: 'Only failed activities can be retried'
      });
    }

    // Reset activity for retry
    activity.status = 'PENDING';
    activity.processing.completedAt = undefined;
    activity.processing.responseTime = undefined;
    activity.error.lastRetryAt = new Date();
    
    if (value.reason) {
      activity.metadata.retryAttempts.push({
        attemptAt: new Date(),
        error: value.reason,
        responseTime: 0
      });
    }

    await activity.save();

    logger.info(`Activity ${id} queued for retry by user ${req.user.email}`);

    res.json({
      success: true,
      message: 'Activity queued for retry',
      data: {
        activity
      }
    });
  } catch (error) {
    logger.error('Retry activity error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

const getFailedActivities = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      page = 1,
      limit = 20,
      maxRetries = 3
    } = req.query;

    // Find failed activities that can be retried
    const query = {
      userId,
      status: 'FAILED',
      'error.retryCount': { $lt: parseInt(maxRetries) }
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const failedActivities = await Activity.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('postId', 'instagramPostId caption')
      .populate('keywordId', 'keyword');

    const totalFailed = await Activity.countDocuments(query);
    const totalPages = Math.ceil(totalFailed / parseInt(limit));

    res.json({
      success: true,
      data: {
        failedActivities,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalFailed,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    logger.error('Get failed activities error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

const retryBatchActivities = async (req, res) => {
  try {
    const userId = req.user._id;

    // Validate request body
    const { error, value } = batchRetrySchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { activityIds, reason } = value;

    // Find activities that belong to user and can be retried
    const activities = await Activity.find({
      _id: { $in: activityIds },
      userId,
      status: 'FAILED'
    });

    if (activities.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No retryable activities found'
      });
    }

    const results = {
      queued: 0,
      skipped: 0,
      errors: []
    };

    // Process each activity
    for (const activity of activities) {
      try {
        activity.status = 'PENDING';
        activity.processing.completedAt = undefined;
        activity.processing.responseTime = undefined;
        activity.error.lastRetryAt = new Date();
        
        if (reason) {
          activity.metadata.retryAttempts.push({
            attemptAt: new Date(),
            error: reason,
            responseTime: 0
          });
        }

        await activity.save();
        results.queued++;
      } catch (err) {
        results.errors.push({
          activityId: activity._id,
          error: err.message
        });
      }
    }

    logger.info(`Batch retry: ${results.queued} activities queued by user ${req.user.email}`);

    res.json({
      success: true,
      message: `${results.queued} activities queued for retry`,
      data: {
        summary: {
          requested: activityIds.length,
          found: activities.length,
          queued: results.queued,
          errors: results.errors.length
        },
        results
      }
    });
  } catch (error) {
    logger.error('Retry batch activities error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

const exportActivities = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      format = 'json',
      startDate,
      endDate,
      status,
      type
    } = req.query;

    // Build query
    const query = { userId };
    if (status) query.status = status;
    if (type) query.type = type;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Get activities for export
    const activities = await Activity.find(query)
      .sort({ createdAt: -1 })
      .populate('postId', 'instagramPostId caption')
      .populate('keywordId', 'keyword')
      .lean();

    // Format data for export
    const exportData = activities.map(activity => ({
      id: activity._id,
      type: activity.type,
      status: activity.status,
      post: activity.postId?.instagramPostId || 'N/A',
      keyword: activity.keywordId?.keyword || 'N/A',
      fromUsername: activity.instagramData.fromUsername,
      originalText: activity.instagramData.originalText,
      responseType: activity.response?.type || 'NONE',
      responseMessage: activity.response?.message || '',
      createdAt: activity.createdAt,
      processingTime: activity.processing?.responseTime || 0
    }));

    if (format === 'csv') {
      // Convert to CSV format
      const csv = [
        'ID,Type,Status,Post,Keyword,From Username,Original Text,Response Type,Response Message,Created At,Processing Time (ms)',
        ...exportData.map(row => 
          `"${row.id}","${row.type}","${row.status}","${row.post}","${row.keyword}","${row.fromUsername}","${row.originalText.replace(/"/g, '""')}","${row.responseType}","${row.responseMessage.replace(/"/g, '""')}","${row.createdAt}","${row.processingTime}"`
        )
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="activities.csv"');
      res.send(csv);
    } else {
      res.json({
        success: true,
        data: {
          activities: exportData,
          exportedAt: new Date(),
          totalRecords: exportData.length
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

const cleanupOldActivities = async (req, res) => {
  try {
    const userId = req.user._id;
    const { olderThanDays = 90 } = req.query;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(olderThanDays));

    // Delete old activities
    const result = await Activity.deleteMany({
      userId,
      createdAt: { $lt: cutoffDate },
      status: { $in: ['SUCCESS', 'FAILED'] } // Keep pending activities
    });

    logger.info(`Cleaned up ${result.deletedCount} old activities for user ${req.user.email}`);

    res.json({
      success: true,
      message: `Cleaned up ${result.deletedCount} old activities`,
      data: {
        deletedCount: result.deletedCount,
        cutoffDate,
        olderThanDays: parseInt(olderThanDays)
      }
    });
  } catch (error) {
    logger.error('Cleanup old activities error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

module.exports = {
  getActivities,
  getActivity,
  createActivity,
  getActivitiesByPost,
  getActivitiesOverview,
  getHourlyDistribution,
  getPerformanceStats,
  retryActivity,
  getFailedActivities,
  retryBatchActivities,
  exportActivities,
  cleanupOldActivities
};
