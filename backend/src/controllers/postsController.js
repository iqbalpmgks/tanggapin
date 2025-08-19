const Post = require('../models/Post');
const Keyword = require('../models/Keyword');
const logger = require('../config/logger');
const Joi = require('joi');

// Validation schemas
const createPostSchema = Joi.object({
  instagramPostId: Joi.string().required().messages({
    'any.required': 'Instagram post ID is required'
  }),
  instagramMediaId: Joi.string().required().messages({
    'any.required': 'Instagram media ID is required'
  }),
  postType: Joi.string().valid('IMAGE', 'VIDEO', 'CAROUSEL_ALBUM', 'REEL').required().messages({
    'any.only': 'Post type must be one of: IMAGE, VIDEO, CAROUSEL_ALBUM, REEL',
    'any.required': 'Post type is required'
  }),
  caption: Joi.string().max(2200).allow('').optional(),
  permalink: Joi.string().uri().required().messages({
    'string.uri': 'Permalink must be a valid URL',
    'any.required': 'Permalink is required'
  }),
  thumbnailUrl: Joi.string().uri().optional(),
  mediaUrl: Joi.string().uri().optional(),
  timestamp: Joi.date().required().messages({
    'any.required': 'Post timestamp is required'
  })
});

const updatePostSchema = Joi.object({
  caption: Joi.string().max(2200).allow('').optional(),
  thumbnailUrl: Joi.string().uri().optional(),
  mediaUrl: Joi.string().uri().optional(),
  automationSettings: Joi.object({
    replyMode: Joi.string().valid('COMMENTS_ONLY', 'DMS_ONLY', 'BOTH').optional()
  }).optional()
});

const automationSchema = Joi.object({
  replyMode: Joi.string().valid('COMMENTS_ONLY', 'DMS_ONLY', 'BOTH').default('BOTH')
});

/**
 * Get user's posts
 */
const getPosts = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      page = 1,
      limit = 20,
      status,
      automationEnabled,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = { userId };
    if (status) query.status = status;
    if (automationEnabled !== undefined) {
      query['automationSettings.isEnabled'] = automationEnabled === 'true';
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortDirection = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const posts = await Post.find(query)
      .sort({ [sortBy]: sortDirection })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('userId', 'name email instagramAccount.username');

    // Get total count for pagination
    const totalPosts = await Post.countDocuments(query);
    const totalPages = Math.ceil(totalPosts / parseInt(limit));

    logger.info(`Retrieved ${posts.length} posts for user ${req.user.email}`);

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalPosts,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    logger.error('Get posts error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Get single post
 */
const getPost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const post = await Post.findOne({ _id: id, userId })
      .populate('userId', 'name email instagramAccount.username');

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Get keywords for this post
    const keywords = await Keyword.find({ postId: id, userId })
      .sort({ 'settings.priority': -1, createdAt: 1 });

    logger.info(`Retrieved post ${id} for user ${req.user.email}`);

    res.json({
      success: true,
      data: {
        post: {
          ...post.toJSON(),
          keywordsCount: keywords.length
        },
        keywords
      }
    });
  } catch (error) {
    logger.error('Get post error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Create new post
 */
const createPost = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = createPostSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const userId = req.user._id;

    // Check if post already exists
    const existingPost = await Post.findOne({
      instagramPostId: value.instagramPostId,
      userId
    });

    if (existingPost) {
      return res.status(400).json({
        success: false,
        error: 'Post already exists in your account'
      });
    }

    // Create new post
    const postData = {
      ...value,
      userId,
      status: 'INACTIVE'
    };

    const post = new Post(postData);
    await post.save();

    logger.info(`New post created: ${post.instagramPostId} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: {
        post
      }
    });
  } catch (error) {
    logger.error('Create post error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Post with this Instagram ID already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Update post
 */
const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Validate request body
    const { error, value } = updatePostSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const post = await Post.findOne({ _id: id, userId });
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Update post fields
    Object.assign(post, value);
    await post.save();

    logger.info(`Post updated: ${post.instagramPostId} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Post updated successfully',
      data: {
        post
      }
    });
  } catch (error) {
    logger.error('Update post error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Delete post
 */
const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const post = await Post.findOne({ _id: id, userId });
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Delete associated keywords
    await Keyword.deleteMany({ postId: id, userId });

    // Delete the post
    await Post.deleteOne({ _id: id });

    logger.info(`Post deleted: ${post.instagramPostId} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Post and associated keywords deleted successfully'
    });
  } catch (error) {
    logger.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Enable automation for post
 */
const enableAutomation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Validate request body
    const { error, value } = automationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const post = await Post.findOne({ _id: id, userId });
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Check if post has keywords
    const keywordCount = await Keyword.countDocuments({ 
      postId: id, 
      userId,
      'settings.isActive': true 
    });

    if (keywordCount === 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot enable automation: Post has no active keywords'
      });
    }

    // Enable automation
    await post.enableAutomation(value.replyMode);

    logger.info(`Automation enabled for post: ${post.instagramPostId} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Automation enabled successfully',
      data: {
        post
      }
    });
  } catch (error) {
    logger.error('Enable automation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Disable automation for post
 */
const disableAutomation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const post = await Post.findOne({ _id: id, userId });
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Disable automation
    await post.disableAutomation();

    logger.info(`Automation disabled for post: ${post.instagramPostId} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Automation disabled successfully',
      data: {
        post
      }
    });
  } catch (error) {
    logger.error('Disable automation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Get post statistics
 */
const getPostStatistics = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const post = await Post.findOne({ _id: id, userId });
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Get keyword statistics for this post
    const keywordStats = await Keyword.aggregate([
      { $match: { postId: post._id, userId } },
      {
        $group: {
          _id: null,
          totalKeywords: { $sum: 1 },
          activeKeywords: {
            $sum: { $cond: [{ $eq: ['$settings.isActive', true] }, 1, 0] }
          },
          totalMatches: { $sum: '$statistics.totalMatches' },
          successfulReplies: { $sum: '$statistics.successfulReplies' },
          failedReplies: { $sum: '$statistics.failedReplies' },
          fallbackReplies: { $sum: '$statistics.fallbackReplies' }
        }
      }
    ]);

    const stats = keywordStats[0] || {
      totalKeywords: 0,
      activeKeywords: 0,
      totalMatches: 0,
      successfulReplies: 0,
      failedReplies: 0,
      fallbackReplies: 0
    };

    // Calculate success rate
    const totalReplies = stats.successfulReplies + stats.failedReplies + stats.fallbackReplies;
    const successRate = totalReplies > 0 ? Math.round((stats.successfulReplies / totalReplies) * 100) : 0;

    res.json({
      success: true,
      data: {
        post: {
          id: post._id,
          instagramPostId: post.instagramPostId,
          caption: post.caption,
          automationStatus: post.automationStatus,
          statistics: post.statistics
        },
        keywordStatistics: {
          ...stats,
          successRate,
          totalReplies
        }
      }
    });
  } catch (error) {
    logger.error('Get post statistics error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Sync posts from Instagram
 */
const syncPosts = async (req, res) => {
  try {
    const userId = req.user._id;

    // This would typically call Instagram API to fetch user's posts
    // For now, return a placeholder response
    res.json({
      success: true,
      message: 'Instagram API integration not yet implemented',
      data: {
        syncedPosts: 0,
        newPosts: 0,
        updatedPosts: 0,
        errors: []
      }
    });
  } catch (error) {
    logger.error('Sync posts error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Get posts overview statistics
 */
const getPostsOverview = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get post statistics
    const postStats = await Post.getUserPostStats(userId);
    const stats = postStats[0] || {
      totalPosts: 0,
      activePosts: 0,
      totalReplies: 0,
      successfulReplies: 0,
      failedReplies: 0,
      fallbackReplies: 0
    };

    // Calculate success rate
    const totalReplies = stats.successfulReplies + stats.failedReplies + stats.fallbackReplies;
    const successRate = totalReplies > 0 ? Math.round((stats.successfulReplies / totalReplies) * 100) : 0;

    // Get recent posts
    const recentPosts = await Post.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('instagramPostId caption automationSettings.isEnabled statistics.totalReplies createdAt');

    res.json({
      success: true,
      data: {
        overview: {
          ...stats,
          successRate,
          totalReplies
        },
        recentPosts
      }
    });
  } catch (error) {
    logger.error('Get posts overview error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

module.exports = {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  enableAutomation,
  disableAutomation,
  getPostStatistics,
  syncPosts,
  getPostsOverview
};
