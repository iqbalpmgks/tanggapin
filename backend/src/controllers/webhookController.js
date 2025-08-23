const logger = require('../config/logger');
const keywordMatchingService = require('../services/KeywordMatchingService');
const responseTemplateService = require('../services/ResponseTemplateService');
const eventQueueService = require('../services/EventQueueService');

/**
 * Verify Instagram webhook
 */
const verifyWebhook = async (req, res) => {
  try {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    // Check if a token and mode were sent
    if (mode && token) {
      // Check the mode and token sent are correct
      if (mode === 'subscribe' && token === process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN) {
        // Respond with 200 OK and challenge token from the request
        logger.info('Instagram webhook verified successfully');
        res.status(200).send(challenge);
      } else {
        // Respond with '403 Forbidden' if verify tokens do not match
        logger.warn('Instagram webhook verification failed - invalid token');
        res.sendStatus(403);
      }
    } else {
      logger.warn('Instagram webhook verification failed - missing parameters');
      res.sendStatus(403);
    }
  } catch (error) {
    logger.error('Webhook verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

const Post = require('../models/Post');
const Keyword = require('../models/Keyword');
const Activity = require('../models/Activity');
const Joi = require('joi');

/**
 * Enhanced activity logging function
 */
const logActivity = async (activityData) => {
  try {
    const activity = await Activity.create({
      userId: activityData.userId || null,
      postId: activityData.postId || null,
      keywordId: activityData.keywordId || null,
      type: activityData.type,
      status: activityData.status,
      instagramData: activityData.instagramData,
      matchingData: activityData.matchingData || null,
      response: activityData.response || null,
      error: activityData.error || null,
      metadata: {
        processingTime: activityData.processingTime,
        reason: activityData.reason,
        fallbackReason: activityData.fallbackReason,
        userAgent: activityData.userAgent,
        ipAddress: activityData.ipAddress
      }
    });

    // Log to console for debugging
    logger.info('Activity logged:', {
      activityId: activity._id,
      type: activity.type,
      status: activity.status,
      fromUser: activityData.instagramData?.fromUsername,
      text: activityData.instagramData?.originalText?.substring(0, 50),
      tag: activityData.matchingData?.tag,
      processingTime: activityData.processingTime
    });

    return activity;
  } catch (error) {
    logger.error('Failed to log activity:', error);
    throw error;
  }
};

/**
 * Update activity status with additional data
 */
const updateActivityStatus = async (activityId, status, updateData = {}) => {
  try {
    const updateFields = {
      status,
      updatedAt: new Date()
    };

    if (updateData.response) {
      updateFields.response = updateData.response;
    }

    if (updateData.error) {
      updateFields.error = updateData.error;
    }

    if (updateData.processingTime) {
      updateFields['metadata.processingTime'] = updateData.processingTime;
    }

    if (updateData.fallbackReason) {
      updateFields['metadata.fallbackReason'] = updateData.fallbackReason;
    }

    const activity = await Activity.findByIdAndUpdate(
      activityId,
      { $set: updateFields },
      { new: true }
    );

    logger.info('Activity status updated:', {
      activityId,
      status,
      processingTime: updateData.processingTime
    });

    return activity;
  } catch (error) {
    logger.error('Failed to update activity status:', error);
    throw error;
  }
};

// Validation schemas
const testWebhookSchema = Joi.object({
  type: Joi.string().valid('comment', 'message').required().messages({
    'any.only': 'Type must be either "comment" or "message"',
    'any.required': 'Event type is required'
  }),
  postId: Joi.string().required().messages({
    'any.required': 'Post ID is required'
  }),
  fromUserId: Joi.string().required().messages({
    'any.required': 'Instagram user ID is required'
  }),
  fromUsername: Joi.string().required().messages({
    'any.required': 'Instagram username is required'
  }),
  text: Joi.string().required().messages({
    'any.required': 'Message text is required'
  }),
  commentId: Joi.string().when('type', {
    is: 'comment',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  messageId: Joi.string().when('type', {
    is: 'message',
    then: Joi.required(),
    otherwise: Joi.optional()
  })
});

/**
 * Process Instagram webhook event with enhanced keyword matching
 */
const processWebhookEvent = async (eventData) => {
  const startTime = Date.now();
  
  try {
    const { type, postId, fromUserId, fromUsername, text, commentId, messageId, timestamp } = eventData;
    
    // Log incoming webhook event
    logger.info('Processing webhook event:', {
      type,
      postId,
      fromUserId,
      fromUsername,
      text: text?.substring(0, 100) + (text?.length > 100 ? '...' : ''),
      timestamp: timestamp || new Date()
    });

    // Find the post and verify it has automation enabled
    const post = await Post.findOne({
      instagramPostId: postId,
      'automationSettings.isEnabled': true,
      status: 'ACTIVE'
    });

    if (!post) {
      logger.info(`Post ${postId} not found or automation disabled`);
      
      // Log activity for post not found
      await logActivity({
        type: type === 'comment' ? 'COMMENT_RECEIVED' : 'MESSAGE_RECEIVED',
        status: 'IGNORED',
        instagramData: {
          commentId,
          messageId,
          fromUserId,
          fromUsername,
          originalText: text,
          timestamp: timestamp || new Date()
        },
        reason: 'Post not found or automation disabled',
        processingTime: Date.now() - startTime
      });
      
      return { success: false, reason: 'Post not found or automation disabled' };
    }

    // Use keyword matching service for enhanced matching
    const matchOptions = {
      enableFuzzyMatching: true,
      fuzzyThreshold: 0.8,
      enableWordBoundary: true,
      maxMatches: 3,
      minConfidence: 0.7
    };

    const matchResult = await keywordMatchingService.matchMessage(
      post._id,
      text,
      matchOptions
    );

    if (!matchResult.success) {
      logger.error('Keyword matching service error:', matchResult.error);
      
      await logActivity({
        userId: post.userId,
        postId: post._id,
        type: type === 'comment' ? 'COMMENT_RECEIVED' : 'MESSAGE_RECEIVED',
        status: 'ERROR',
        instagramData: {
          commentId,
          messageId,
          fromUserId,
          fromUsername,
          originalText: text,
          timestamp: timestamp || new Date()
        },
        error: {
          code: 'KEYWORD_MATCHING_ERROR',
          message: matchResult.error
        },
        processingTime: Date.now() - startTime
      });
      
      return { success: false, reason: matchResult.error };
    }

    if (matchResult.matches.length === 0) {
      logger.info(`No matching keywords found for text: "${text}" in post ${postId}`);
      
      // Log activity for unmatched message
      await logActivity({
        userId: post.userId,
        postId: post._id,
        type: type === 'comment' ? 'COMMENT_RECEIVED' : 'MESSAGE_RECEIVED',
        status: 'NO_MATCH',
        instagramData: {
          commentId,
          messageId,
          fromUserId,
          fromUsername,
          originalText: text,
          timestamp: timestamp || new Date()
        },
        matchingData: {
          totalKeywords: matchResult.totalKeywords,
          processingTime: matchResult.processingTime,
          cacheHit: matchResult.cacheHit
        },
        processingTime: Date.now() - startTime
      });
      
      return { success: true, reason: 'No matching keywords', action: 'logged' };
    }

    // Use the best match (highest confidence and priority)
    const bestMatch = matchResult.matches[0];
    const keyword = bestMatch.keyword;
    
    logger.info(`Keyword matched: "${bestMatch.matchedTerm}" (${bestMatch.matchType}) with confidence ${bestMatch.confidence}`);

    // Create comprehensive activity record
    const activity = await logActivity({
      userId: post.userId,
      postId: post._id,
      keywordId: keyword._id,
      type: type === 'comment' ? 'COMMENT_RECEIVED' : 'MESSAGE_RECEIVED',
      status: 'PROCESSING',
      instagramData: {
        commentId,
        messageId,
        fromUserId,
        fromUsername,
        originalText: text,
        timestamp: timestamp || new Date()
      },
      matchedKeyword: {
        keyword: keyword.keyword,
        matchType: keyword.settings.matchType,
        matchedTerm: bestMatch.matchedTerm
      },
      matchingData: {
        tag: bestMatch.tag,
        matchedTerm: bestMatch.matchedTerm,
        matchType: bestMatch.matchType,
        confidence: bestMatch.confidence,
        priority: bestMatch.priority,
        totalMatches: matchResult.matches.length,
        totalKeywords: matchResult.totalKeywords,
        processingTime: matchResult.processingTime,
        cacheHit: matchResult.cacheHit,
        allMatches: matchResult.matches.map(m => ({
          tag: m.tag,
          matchedTerm: m.matchedTerm,
          confidence: m.confidence,
          priority: m.priority
        }))
      },
      processingTime: Date.now() - startTime
    });

    // Determine response strategy based on post settings
    const replyMode = post.automationSettings.replyMode;
    let responseType = 'DM';
    let responseMessage = bestMatch.responseData.dmMessage;

    // Add product link if enabled
    if (bestMatch.responseData.productLink) {
      responseMessage += `\n\n${bestMatch.responseData.productLink}`;
    }

    // Simulate sending response (in real implementation, this would call Instagram API)
    const responseResult = await simulateInstagramResponse(
      responseType,
      fromUserId,
      responseMessage,
      replyMode
    );

    if (responseResult.success) {
      // Update activity as successful
      await updateActivityStatus(activity._id, 'SUCCESS', {
        response: {
          type: responseResult.type,
          message: responseResult.message,
          instagramResponseId: responseResult.responseId,
          responseTime: responseResult.responseTime,
          retryCount: responseResult.retryCount || 0
        },
        processingTime: Date.now() - startTime
      });

      // Update keyword statistics
      await keyword.incrementMatch('success', responseResult.responseTime);

      // Update post statistics
      await post.incrementReplyCounter('success');

      logger.info(`Successfully processed webhook event for post ${postId}, keyword "${keyword.keyword}"`);
      
      return {
        success: true,
        action: responseResult.action || 'replied',
        responseType: responseResult.type,
        keyword: keyword.keyword,
        tag: bestMatch.tag,
        confidence: bestMatch.confidence,
        activityId: activity._id,
        processingTime: Date.now() - startTime,
        retryCount: responseResult.retryCount || 0
      };
    } else {
      // Mark as failed
      await updateActivityStatus(activity._id, 'FAILED', {
        error: {
          code: responseResult.error,
          message: responseResult.message,
          retryCount: responseResult.retryCount || 0
        },
        processingTime: Date.now() - startTime
      });

      await keyword.incrementMatch('failed');
      await post.incrementReplyCounter('failed');

      return {
        success: false,
        reason: responseResult.message,
        keyword: keyword.keyword,
        tag: bestMatch.tag,
        activityId: activity._id,
        processingTime: Date.now() - startTime,
        retryCount: responseResult.retryCount || 0
      };
    }
  } catch (error) {
    logger.error('Process webhook event error:', error);
    
    // Log error activity
    try {
      await logActivity({
        type: type === 'comment' ? 'COMMENT_RECEIVED' : 'MESSAGE_RECEIVED',
        status: 'ERROR',
        instagramData: {
          commentId: eventData.commentId,
          messageId: eventData.messageId,
          fromUserId: eventData.fromUserId,
          fromUsername: eventData.fromUsername,
          originalText: eventData.text,
          timestamp: eventData.timestamp || new Date()
        },
        error: {
          code: 'PROCESSING_ERROR',
          message: error.message,
          stack: error.stack
        },
        processingTime: Date.now() - startTime
      });
    } catch (logError) {
      logger.error('Failed to log error activity:', logError);
    }
    
    return { success: false, reason: error.message };
  }
};

/**
 * Simulate Instagram API response (placeholder for real implementation)
 */
const simulateInstagramResponse = async (type, userId, message, replyMode) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

  // Simulate success/failure based on type and mode
  const successRate = type === 'DM' ? 0.85 : 0.95; // DMs have higher failure rate
  const isSuccess = Math.random() < successRate;

  if (isSuccess) {
    return {
      success: true,
      type,
      responseId: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      responseTime: Math.floor(Math.random() * 2000 + 500)
    };
  } else {
    return {
      success: false,
      error: type === 'DM' ? 'DM_FAILED' : 'COMMENT_FAILED',
      message: type === 'DM' 
        ? 'Cannot send DM to private account that doesn\'t follow back'
        : 'Comment posting failed due to Instagram restrictions'
    };
  }
};

/**
 * Handle Instagram webhook events with queue system
 */
const handleWebhook = async (req, res) => {
  try {
    const webhookData = req.body;
    
    // Acknowledge receipt immediately
    res.status(200).send('OK');

    // Process webhook events using queue system
    if (webhookData.entry && Array.isArray(webhookData.entry)) {
      for (const entry of webhookData.entry) {
        if (entry.changes && Array.isArray(entry.changes)) {
          for (const change of entry.changes) {
            if (change.field === 'comments' && change.value) {
              // Add comment event to queue
              const commentData = change.value;
              const eventData = {
                type: 'comment',
                postId: commentData.media?.id,
                fromUserId: commentData.from?.id,
                fromUsername: commentData.from?.username,
                text: commentData.text,
                commentId: commentData.id,
                timestamp: new Date(commentData.created_time * 1000)
              };

              await eventQueueService.addEvent(
                eventData,
                processWebhookEvent,
                {
                  priority: 1, // Comments have normal priority
                  maxRetries: 3,
                  retryDelay: 3000,
                  timeout: 30000
                }
              );

            } else if (change.field === 'messages' && change.value) {
              // Add message event to queue
              const messageData = change.value;
              const eventData = {
                type: 'message',
                postId: messageData.post_id,
                fromUserId: messageData.from?.id,
                fromUsername: messageData.from?.username,
                text: messageData.message?.text,
                messageId: messageData.message?.mid,
                timestamp: new Date(messageData.timestamp)
              };

              await eventQueueService.addEvent(
                eventData,
                processWebhookEvent,
                {
                  priority: 2, // Messages have higher priority
                  maxRetries: 3,
                  retryDelay: 3000,
                  timeout: 30000
                }
              );
            }
          }
        }
      }
    }

    logger.info('Webhook events added to queue successfully');
  } catch (error) {
    logger.error('Handle webhook error:', error);
    // Don't return error to Instagram - we already acknowledged receipt
  }
};

/**
 * Get webhook status
 */
const getWebhookStatus = async (req, res) => {
  try {
    // Check if webhook is properly configured
    const webhookToken = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN;
    const isConfigured = !!webhookToken;

    // Get recent webhook activity stats
    const recentActivity = await Activity.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    });

    // Get posts with automation enabled
    const activePosts = await Post.countDocuments({
      'automationSettings.isEnabled': true,
      status: 'ACTIVE'
    });

    res.json({
      success: true,
      data: {
        webhook: {
          isConfigured,
          verifyToken: webhookToken ? 'Set' : 'Not set',
          status: isConfigured ? 'Active' : 'Inactive'
        },
        statistics: {
          recentActivity,
          activePosts,
          lastChecked: new Date()
        }
      }
    });
  } catch (error) {
    logger.error('Get webhook status error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Initialize webhook services
 */
const initializeWebhookServices = async () => {
  try {
    // Initialize Response Template Service
    if (!responseTemplateService.isInitialized) {
      await responseTemplateService.initialize();
    }

    // Initialize Event Queue Service
    if (!eventQueueService.isInitialized) {
      eventQueueService.initialize();
    }

    logger.info('Webhook services initialized successfully');
    return true;
  } catch (error) {
    logger.error('Failed to initialize webhook services:', error);
    throw error;
  }
};

/**
 * Test webhook with mock data using queue system
 */
const testWebhook = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = testWebhookSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { type, postId, fromUserId, fromUsername, text, commentId, messageId } = value;

    // Add test event to queue
    const eventId = await eventQueueService.addEvent(
      {
        type,
        postId,
        fromUserId,
        fromUsername,
        text,
        commentId,
        messageId,
        timestamp: new Date()
      },
      processWebhookEvent,
      {
        priority: 10, // High priority for test events
        maxRetries: 3,
        retryDelay: 3000,
        timeout: 30000
      }
    );

    logger.info(`Test webhook added to queue: ${eventId}`);

    // Wait a moment for processing to start
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get event status
    const eventStatus = eventQueueService.getEvent(eventId);

    res.json({
      success: true,
      message: 'Test webhook added to queue successfully',
      data: {
        testEvent: value,
        eventId,
        eventStatus,
        queueStatus: eventQueueService.getStatus()
      }
    });
  } catch (error) {
    logger.error('Test webhook error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Get queue status and statistics
 */
const getQueueStatus = async (req, res) => {
  try {
    const queueStatus = eventQueueService.getStatus();
    const queueItems = eventQueueService.getQueueItems({ limit: 10 });
    const statistics = eventQueueService.getStatistics();

    res.json({
      success: true,
      data: {
        status: queueStatus,
        recentItems: queueItems,
        statistics
      }
    });
  } catch (error) {
    logger.error('Get queue status error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Get response templates
 */
const getResponseTemplates = async (req, res) => {
  try {
    const templates = responseTemplateService.getAllTemplates();
    const statistics = responseTemplateService.getStatistics();

    res.json({
      success: true,
      data: {
        templates,
        statistics
      }
    });
  } catch (error) {
    logger.error('Get response templates error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

module.exports = {
  verifyWebhook,
  handleWebhook,
  getWebhookStatus,
  testWebhook,
  processWebhookEvent,
  logActivity,
  updateActivityStatus,
  initializeWebhookServices,
  getQueueStatus,
  getResponseTemplates,
  sendResponseWithRetry
};
