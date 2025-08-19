const logger = require('../config/logger');

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
 * Process Instagram webhook event
 */
const processWebhookEvent = async (eventData) => {
  try {
    const { type, postId, fromUserId, fromUsername, text, commentId, messageId, timestamp } = eventData;
    
    // Find the post and verify it has automation enabled
    const post = await Post.findOne({
      instagramPostId: postId,
      'automationSettings.isEnabled': true,
      status: 'ACTIVE'
    });

    if (!post) {
      logger.info(`Post ${postId} not found or automation disabled`);
      return { success: false, reason: 'Post not found or automation disabled' };
    }

    // Find matching keywords for this post
    const matchingKeywords = await Keyword.findMatchingKeywords(post._id, text);
    
    if (matchingKeywords.length === 0) {
      logger.info(`No matching keywords found for text: "${text}" in post ${postId}`);
      
      // Create activity for unmatched comment
      await Activity.create({
        userId: post.userId,
        postId: post._id,
        type: type === 'comment' ? 'COMMENT_RECEIVED' : 'DM_SENT',
        status: 'SUCCESS',
        instagramData: {
          commentId,
          messageId,
          fromUserId,
          fromUsername,
          originalText: text,
          timestamp: timestamp || new Date()
        },
        response: {
          type: 'NONE'
        }
      });
      
      return { success: true, reason: 'No matching keywords', action: 'logged' };
    }

    // Use the highest priority keyword
    const keyword = matchingKeywords[0];
    
    // Create activity record
    const activity = await Activity.create({
      userId: post.userId,
      postId: post._id,
      keywordId: keyword._id,
      type: 'COMMENT_RECEIVED',
      status: 'PENDING',
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
        matchedTerm: keyword.keyword // This could be enhanced to show which synonym matched
      }
    });

    // Determine response strategy based on post settings
    const replyMode = post.automationSettings.replyMode;
    let responseType = 'DM';
    let responseMessage = keyword.response.dmMessage;

    // Add product link if enabled
    if (keyword.response.includeProductLink && keyword.response.productLink) {
      responseMessage += `\n\n${keyword.response.productLink}`;
    }

    // Simulate sending response (in real implementation, this would call Instagram API)
    const responseResult = await simulateInstagramResponse(
      responseType,
      fromUserId,
      responseMessage,
      replyMode
    );

    if (responseResult.success) {
      // Mark activity as successful
      await activity.markCompleted('SUCCESS', {
        type: responseResult.type,
        message: responseMessage,
        instagramResponseId: responseResult.responseId
      });

      // Update keyword statistics
      await keyword.incrementMatch('success', responseResult.responseTime);

      // Update post statistics
      await post.incrementReplyCounter('success');

      logger.info(`Successfully processed webhook event for post ${postId}, keyword "${keyword.keyword}"`);
      
      return {
        success: true,
        action: 'replied',
        responseType: responseResult.type,
        keyword: keyword.keyword,
        activityId: activity._id
      };
    } else {
      // Try fallback if DM failed
      if (responseResult.error === 'DM_FAILED' && replyMode !== 'DMS_ONLY') {
        const fallbackResult = await simulateInstagramResponse(
          'COMMENT',
          fromUserId,
          keyword.response.fallbackComment,
          'COMMENTS_ONLY'
        );

        if (fallbackResult.success) {
          await activity.markFallback(keyword.response.fallbackComment);
          await keyword.incrementMatch('fallback', fallbackResult.responseTime);
          await post.incrementReplyCounter('fallback');

          return {
            success: true,
            action: 'fallback',
            responseType: 'COMMENT',
            keyword: keyword.keyword,
            activityId: activity._id
          };
        }
      }

      // Mark as failed
      await activity.markFailed({
        code: responseResult.error,
        message: responseResult.message
      });

      await keyword.incrementMatch('failed');
      await post.incrementReplyCounter('failed');

      return {
        success: false,
        reason: responseResult.message,
        keyword: keyword.keyword,
        activityId: activity._id
      };
    }
  } catch (error) {
    logger.error('Process webhook event error:', error);
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
 * Handle Instagram webhook events
 */
const handleWebhook = async (req, res) => {
  try {
    const webhookData = req.body;
    
    // Acknowledge receipt immediately
    res.status(200).send('OK');

    // Process webhook events asynchronously
    if (webhookData.entry && Array.isArray(webhookData.entry)) {
      for (const entry of webhookData.entry) {
        if (entry.changes && Array.isArray(entry.changes)) {
          for (const change of entry.changes) {
            if (change.field === 'comments' && change.value) {
              // Process comment event
              const commentData = change.value;
              await processWebhookEvent({
                type: 'comment',
                postId: commentData.media?.id,
                fromUserId: commentData.from?.id,
                fromUsername: commentData.from?.username,
                text: commentData.text,
                commentId: commentData.id,
                timestamp: new Date(commentData.created_time * 1000)
              });
            } else if (change.field === 'messages' && change.value) {
              // Process message event
              const messageData = change.value;
              await processWebhookEvent({
                type: 'message',
                postId: messageData.post_id,
                fromUserId: messageData.from?.id,
                fromUsername: messageData.from?.username,
                text: messageData.message?.text,
                messageId: messageData.message?.mid,
                timestamp: new Date(messageData.timestamp)
              });
            }
          }
        }
      }
    }

    logger.info('Webhook events processed successfully');
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
 * Test webhook with mock data
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

    // Process the test event
    const result = await processWebhookEvent({
      type,
      postId,
      fromUserId,
      fromUsername,
      text,
      commentId,
      messageId,
      timestamp: new Date()
    });

    logger.info(`Test webhook processed: ${JSON.stringify(result)}`);

    res.json({
      success: true,
      message: 'Test webhook processed successfully',
      data: {
        testEvent: value,
        result
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

module.exports = {
  verifyWebhook,
  handleWebhook,
  getWebhookStatus,
  testWebhook
};
