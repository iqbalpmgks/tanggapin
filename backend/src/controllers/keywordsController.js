const Keyword = require('../models/Keyword');
const Post = require('../models/Post');
const logger = require('../config/logger');
const Joi = require('joi');

// Validation schemas
const createKeywordSchema = Joi.object({
  postId: Joi.string().required().messages({
    'any.required': 'Post ID is required'
  }),
  keyword: Joi.string().min(1).max(100).required().messages({
    'string.min': 'Keyword must be at least 1 character',
    'string.max': 'Keyword cannot exceed 100 characters',
    'any.required': 'Keyword is required'
  }),
  synonyms: Joi.array().items(
    Joi.string().min(1).max(100)
  ).max(10).default([]).messages({
    'array.max': 'Cannot have more than 10 synonyms'
  }),
  response: Joi.object({
    dmMessage: Joi.string().min(1).max(1000).required().messages({
      'string.min': 'DM message cannot be empty',
      'string.max': 'DM message cannot exceed 1000 characters',
      'any.required': 'DM message is required'
    }),
    fallbackComment: Joi.string().min(1).max(300).required().messages({
      'string.min': 'Fallback comment cannot be empty',
      'string.max': 'Fallback comment cannot exceed 300 characters',
      'any.required': 'Fallback comment is required'
    }),
    includeProductLink: Joi.boolean().default(true),
    productLink: Joi.string().uri().when('includeProductLink', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional()
    }).messages({
      'string.uri': 'Product link must be a valid URL',
      'any.required': 'Product link is required when includeProductLink is true'
    })
  }).required(),
  settings: Joi.object({
    matchType: Joi.string().valid('EXACT', 'CONTAINS', 'STARTS_WITH', 'ENDS_WITH').default('CONTAINS'),
    caseSensitive: Joi.boolean().default(false),
    priority: Joi.number().min(1).max(10).default(1)
  }).default({})
});

const updateKeywordSchema = Joi.object({
  keyword: Joi.string().min(1).max(100).optional(),
  synonyms: Joi.array().items(
    Joi.string().min(1).max(100)
  ).max(10).optional(),
  response: Joi.object({
    dmMessage: Joi.string().min(1).max(1000).optional(),
    fallbackComment: Joi.string().min(1).max(300).optional(),
    includeProductLink: Joi.boolean().optional(),
    productLink: Joi.string().uri().optional()
  }).optional(),
  settings: Joi.object({
    matchType: Joi.string().valid('EXACT', 'CONTAINS', 'STARTS_WITH', 'ENDS_WITH').optional(),
    caseSensitive: Joi.boolean().optional(),
    priority: Joi.number().min(1).max(10).optional()
  }).optional()
});

const bulkKeywordSchema = Joi.object({
  keyword: Joi.string().min(1).max(100).required().messages({
    'string.min': 'Keyword must be at least 1 character',
    'string.max': 'Keyword cannot exceed 100 characters',
    'any.required': 'Keyword is required'
  }),
  synonyms: Joi.array().items(
    Joi.string().min(1).max(100)
  ).max(10).default([]).messages({
    'array.max': 'Cannot have more than 10 synonyms'
  }),
  response: Joi.object({
    dmMessage: Joi.string().min(1).max(1000).required().messages({
      'string.min': 'DM message cannot be empty',
      'string.max': 'DM message cannot exceed 1000 characters',
      'any.required': 'DM message is required'
    }),
    fallbackComment: Joi.string().min(1).max(300).required().messages({
      'string.min': 'Fallback comment cannot be empty',
      'string.max': 'Fallback comment cannot exceed 300 characters',
      'any.required': 'Fallback comment is required'
    }),
    includeProductLink: Joi.boolean().default(true),
    productLink: Joi.string().uri().when('includeProductLink', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional()
    }).messages({
      'string.uri': 'Product link must be a valid URL',
      'any.required': 'Product link is required when includeProductLink is true'
    })
  }).required(),
  settings: Joi.object({
    matchType: Joi.string().valid('EXACT', 'CONTAINS', 'STARTS_WITH', 'ENDS_WITH').default('CONTAINS'),
    caseSensitive: Joi.boolean().default(false),
    priority: Joi.number().min(1).max(10).default(1)
  }).default({})
});

const bulkCreateSchema = Joi.object({
  postId: Joi.string().required(),
  keywords: Joi.array().items(bulkKeywordSchema).min(1).max(50).required().messages({
    'array.min': 'At least one keyword is required',
    'array.max': 'Cannot create more than 50 keywords at once'
  })
});

const testMatchSchema = Joi.object({
  text: Joi.string().required().messages({
    'any.required': 'Text to test is required'
  })
});

/**
 * Get user's keywords
 */
const getKeywords = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      page = 1,
      limit = 20,
      postId,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = { userId };
    if (postId) query.postId = postId;
    if (isActive !== undefined) query['settings.isActive'] = isActive === 'true';

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortDirection = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const keywords = await Keyword.find(query)
      .sort({ [sortBy]: sortDirection })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('postId', 'instagramPostId caption thumbnailUrl')
      .populate('userId', 'name email');

    // Get total count for pagination
    const totalKeywords = await Keyword.countDocuments(query);
    const totalPages = Math.ceil(totalKeywords / parseInt(limit));

    logger.info(`Retrieved ${keywords.length} keywords for user ${req.user.email}`);

    res.json({
      success: true,
      data: {
        keywords,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalKeywords,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    logger.error('Get keywords error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

const getKeyword = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const keyword = await Keyword.findOne({ _id: id, userId })
      .populate('postId', 'instagramPostId caption thumbnailUrl')
      .populate('userId', 'name email');

    if (!keyword) {
      return res.status(404).json({
        success: false,
        error: 'Keyword not found'
      });
    }

    logger.info(`Retrieved keyword ${id} for user ${req.user.email}`);

    res.json({
      success: true,
      data: {
        keyword
      }
    });
  } catch (error) {
    logger.error('Get keyword error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

const createKeyword = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = createKeywordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const userId = req.user._id;

    // Verify post exists and belongs to user
    const post = await Post.findOne({ _id: value.postId, userId });
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Check if keyword already exists for this post
    const existingKeyword = await Keyword.findOne({
      postId: value.postId,
      keyword: value.keyword.toLowerCase(),
      userId
    });

    if (existingKeyword) {
      return res.status(400).json({
        success: false,
        error: 'Keyword already exists for this post'
      });
    }

    // Create new keyword
    const keywordData = {
      ...value,
      userId
    };

    const keyword = new Keyword(keywordData);
    await keyword.save();

    // Populate the response
    await keyword.populate('postId', 'instagramPostId caption');

    logger.info(`New keyword created: "${keyword.keyword}" for post ${post.instagramPostId} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Keyword created successfully',
      data: {
        keyword
      }
    });
  } catch (error) {
    logger.error('Create keyword error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Keyword already exists for this post'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

const updateKeyword = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Validate request body
    const { error, value } = updateKeywordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const keyword = await Keyword.findOne({ _id: id, userId });
    if (!keyword) {
      return res.status(404).json({
        success: false,
        error: 'Keyword not found'
      });
    }

    // Update keyword fields
    Object.assign(keyword, value);
    await keyword.save();

    // Populate the response
    await keyword.populate('postId', 'instagramPostId caption');

    logger.info(`Keyword updated: "${keyword.keyword}" by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Keyword updated successfully',
      data: {
        keyword
      }
    });
  } catch (error) {
    logger.error('Update keyword error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

const deleteKeyword = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const keyword = await Keyword.findOne({ _id: id, userId });
    if (!keyword) {
      return res.status(404).json({
        success: false,
        error: 'Keyword not found'
      });
    }

    await Keyword.deleteOne({ _id: id });

    logger.info(`Keyword deleted: "${keyword.keyword}" by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Keyword deleted successfully'
    });
  } catch (error) {
    logger.error('Delete keyword error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

const getKeywordsByPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;
    const { activeOnly = 'true' } = req.query;

    // Verify post exists and belongs to user
    const post = await Post.findOne({ _id: postId, userId });
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    // Get keywords for this post
    const keywords = await Keyword.findByPost(postId, activeOnly === 'true');

    logger.info(`Retrieved ${keywords.length} keywords for post ${postId} by user ${req.user.email}`);

    res.json({
      success: true,
      data: {
        post: {
          id: post._id,
          instagramPostId: post.instagramPostId,
          caption: post.caption
        },
        keywords
      }
    });
  } catch (error) {
    logger.error('Get keywords by post error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

const bulkCreateKeywords = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = bulkCreateSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const userId = req.user._id;
    const { postId, keywords } = value;

    // Verify post exists and belongs to user
    const post = await Post.findOne({ _id: postId, userId });
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    const results = {
      created: [],
      errors: [],
      duplicates: []
    };

    // Process each keyword
    for (const keywordData of keywords) {
      try {
        // Check if keyword already exists
        const existingKeyword = await Keyword.findOne({
          postId,
          keyword: keywordData.keyword.toLowerCase(),
          userId
        });

        if (existingKeyword) {
          results.duplicates.push({
            keyword: keywordData.keyword,
            error: 'Keyword already exists for this post'
          });
          continue;
        }

        // Create new keyword
        const keyword = new Keyword({
          ...keywordData,
          postId,
          userId
        });

        await keyword.save();
        await keyword.populate('postId', 'instagramPostId caption');
        
        results.created.push(keyword);
      } catch (err) {
        results.errors.push({
          keyword: keywordData.keyword,
          error: err.message
        });
      }
    }

    logger.info(`Bulk created ${results.created.length} keywords for post ${post.instagramPostId} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: `Successfully created ${results.created.length} keywords`,
      data: {
        summary: {
          totalRequested: keywords.length,
          created: results.created.length,
          duplicates: results.duplicates.length,
          errors: results.errors.length
        },
        results
      }
    });
  } catch (error) {
    logger.error('Bulk create keywords error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

const activateKeyword = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const keyword = await Keyword.findOne({ _id: id, userId });
    if (!keyword) {
      return res.status(404).json({
        success: false,
        error: 'Keyword not found'
      });
    }

    await keyword.setActive(true);

    logger.info(`Keyword activated: "${keyword.keyword}" by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Keyword activated successfully',
      data: {
        keyword
      }
    });
  } catch (error) {
    logger.error('Activate keyword error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

const deactivateKeyword = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const keyword = await Keyword.findOne({ _id: id, userId });
    if (!keyword) {
      return res.status(404).json({
        success: false,
        error: 'Keyword not found'
      });
    }

    await keyword.setActive(false);

    logger.info(`Keyword deactivated: "${keyword.keyword}" by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Keyword deactivated successfully',
      data: {
        keyword
      }
    });
  } catch (error) {
    logger.error('Deactivate keyword error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

const getKeywordStatistics = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const keyword = await Keyword.findOne({ _id: id, userId })
      .populate('postId', 'instagramPostId caption');

    if (!keyword) {
      return res.status(404).json({
        success: false,
        error: 'Keyword not found'
      });
    }

    res.json({
      success: true,
      data: {
        keyword: {
          id: keyword._id,
          keyword: keyword.keyword,
          synonyms: keyword.synonyms,
          isActive: keyword.settings.isActive,
          post: keyword.postId
        },
        statistics: keyword.statistics,
        performance: {
          successRate: keyword.successRate,
          totalReplies: keyword.statistics.successfulReplies + keyword.statistics.failedReplies + keyword.statistics.fallbackReplies
        }
      }
    });
  } catch (error) {
    logger.error('Get keyword statistics error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

const getKeywordsOverview = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get keyword statistics
    const keywordStats = await Keyword.getUserKeywordStats(userId);
    const stats = keywordStats[0] || {
      totalKeywords: 0,
      activeKeywords: 0,
      totalMatches: 0,
      successfulReplies: 0,
      failedReplies: 0,
      fallbackReplies: 0,
      averageResponseTime: 0
    };

    // Calculate success rate
    const totalReplies = stats.successfulReplies + stats.failedReplies + stats.fallbackReplies;
    const successRate = totalReplies > 0 ? Math.round((stats.successfulReplies / totalReplies) * 100) : 0;

    // Get recent keywords
    const recentKeywords = await Keyword.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('keyword settings.isActive statistics.totalMatches createdAt')
      .populate('postId', 'instagramPostId');

    res.json({
      success: true,
      data: {
        overview: {
          ...stats,
          successRate,
          totalReplies
        },
        recentKeywords
      }
    });
  } catch (error) {
    logger.error('Get keywords overview error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

const getTopPerformingKeywords = async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 10 } = req.query;

    const topKeywords = await Keyword.getTopKeywords(userId, parseInt(limit));

    res.json({
      success: true,
      data: {
        topKeywords
      }
    });
  } catch (error) {
    logger.error('Get top performing keywords error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

const testKeywordMatch = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Validate request body
    const { error, value } = testMatchSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const keyword = await Keyword.findOne({ _id: id, userId });
    if (!keyword) {
      return res.status(404).json({
        success: false,
        error: 'Keyword not found'
      });
    }

    const matches = keyword.matchesText(value.text);

    res.json({
      success: true,
      data: {
        keyword: {
          id: keyword._id,
          keyword: keyword.keyword,
          synonyms: keyword.synonyms,
          settings: keyword.settings
        },
        testText: value.text,
        matches,
        matchDetails: {
          allTerms: keyword.allTerms,
          matchType: keyword.settings.matchType,
          caseSensitive: keyword.settings.caseSensitive
        }
      }
    });
  } catch (error) {
    logger.error('Test keyword match error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

module.exports = {
  getKeywords,
  getKeyword,
  createKeyword,
  updateKeyword,
  deleteKeyword,
  getKeywordsByPost,
  bulkCreateKeywords,
  activateKeyword,
  deactivateKeyword,
  getKeywordStatistics,
  getKeywordsOverview,
  getTopPerformingKeywords,
  testKeywordMatch
};
