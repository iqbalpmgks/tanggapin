const mongoose = require('mongoose');

const keywordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: [true, 'Post ID is required'],
    index: true
  },
  keyword: {
    type: String,
    required: [true, 'Keyword is required'],
    trim: true,
    lowercase: true,
    maxlength: [100, 'Keyword cannot exceed 100 characters'],
    minlength: [1, 'Keyword must be at least 1 character']
  },
  synonyms: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [100, 'Synonym cannot exceed 100 characters']
  }],
  response: {
    dmMessage: {
      type: String,
      required: [true, 'DM message is required'],
      maxlength: [1000, 'DM message cannot exceed 1000 characters']
    },
    fallbackComment: {
      type: String,
      required: [true, 'Fallback comment is required'],
      maxlength: [300, 'Fallback comment cannot exceed 300 characters']
    },
    includeProductLink: {
      type: Boolean,
      default: true
    },
    productLink: {
      type: String,
      validate: {
        validator: function(v) {
          if (!this.response.includeProductLink) return true;
          return /^https?:\/\/.+/.test(v);
        },
        message: 'Product link must be a valid URL'
      }
    }
  },
  settings: {
    isActive: {
      type: Boolean,
      default: true
    },
    matchType: {
      type: String,
      enum: ['EXACT', 'CONTAINS', 'STARTS_WITH', 'ENDS_WITH'],
      default: 'CONTAINS'
    },
    caseSensitive: {
      type: Boolean,
      default: false
    },
    priority: {
      type: Number,
      default: 1,
      min: [1, 'Priority must be at least 1'],
      max: [10, 'Priority cannot exceed 10']
    }
  },
  statistics: {
    totalMatches: {
      type: Number,
      default: 0
    },
    successfulReplies: {
      type: Number,
      default: 0
    },
    failedReplies: {
      type: Number,
      default: 0
    },
    fallbackReplies: {
      type: Number,
      default: 0
    },
    lastMatchedAt: {
      type: Date
    },
    averageResponseTime: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Compound indexes for performance
keywordSchema.index({ userId: 1, postId: 1 });
keywordSchema.index({ postId: 1, 'settings.isActive': 1, 'settings.priority': -1 });
keywordSchema.index({ keyword: 1, userId: 1 });
keywordSchema.index({ 'settings.isActive': 1, 'settings.priority': -1 });

// Unique compound index to prevent duplicate keywords per post
keywordSchema.index({ postId: 1, keyword: 1 }, { unique: true });

// Virtual for success rate
keywordSchema.virtual('successRate').get(function() {
  const totalReplies = this.statistics.successfulReplies + this.statistics.failedReplies + this.statistics.fallbackReplies;
  if (totalReplies === 0) return 0;
  return Math.round((this.statistics.successfulReplies / totalReplies) * 100);
});

// Virtual for all matching terms (keyword + synonyms)
keywordSchema.virtual('allTerms').get(function() {
  return [this.keyword, ...this.synonyms];
});

// Instance method to check if text matches this keyword
keywordSchema.methods.matchesText = function(text) {
  if (!text || !this.settings.isActive) return false;
  
  const searchText = this.settings.caseSensitive ? text : text.toLowerCase();
  const terms = this.allTerms.map(term => 
    this.settings.caseSensitive ? term : term.toLowerCase()
  );
  
  for (const term of terms) {
    let matches = false;
    
    switch (this.settings.matchType) {
      case 'EXACT':
        matches = searchText === term;
        break;
      case 'CONTAINS':
        matches = searchText.includes(term);
        break;
      case 'STARTS_WITH':
        matches = searchText.startsWith(term);
        break;
      case 'ENDS_WITH':
        matches = searchText.endsWith(term);
        break;
      default:
        matches = searchText.includes(term);
    }
    
    if (matches) return true;
  }
  
  return false;
};

// Instance method to increment match counter
keywordSchema.methods.incrementMatch = function(responseType, responseTime = 0) {
  this.statistics.totalMatches += 1;
  this.statistics.lastMatchedAt = new Date();
  
  // Update average response time
  if (responseTime > 0) {
    const currentAvg = this.statistics.averageResponseTime || 0;
    const totalResponses = this.statistics.successfulReplies + this.statistics.failedReplies + this.statistics.fallbackReplies;
    this.statistics.averageResponseTime = Math.round(
      (currentAvg * totalResponses + responseTime) / (totalResponses + 1)
    );
  }
  
  switch (responseType) {
    case 'success':
      this.statistics.successfulReplies += 1;
      break;
    case 'failed':
      this.statistics.failedReplies += 1;
      break;
    case 'fallback':
      this.statistics.fallbackReplies += 1;
      break;
  }
  
  return this.save();
};

// Instance method to activate/deactivate keyword
keywordSchema.methods.setActive = function(isActive) {
  this.settings.isActive = isActive;
  return this.save();
};

// Static method to find keywords for a post
keywordSchema.statics.findByPost = function(postId, activeOnly = true) {
  const query = { postId };
  if (activeOnly) {
    query['settings.isActive'] = true;
  }
  
  return this.find(query)
    .sort({ 'settings.priority': -1, createdAt: 1 })
    .populate('postId', 'instagramPostId caption')
    .populate('userId', 'name email');
};

// Static method to find matching keywords for text
keywordSchema.statics.findMatchingKeywords = function(postId, text) {
  return this.find({
    postId,
    'settings.isActive': true
  })
  .sort({ 'settings.priority': -1 })
  .then(keywords => {
    return keywords.filter(keyword => keyword.matchesText(text));
  });
};

// Static method to get keyword statistics for a user
keywordSchema.statics.getUserKeywordStats = function(userId) {
  return this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalKeywords: { $sum: 1 },
        activeKeywords: {
          $sum: {
            $cond: [{ $eq: ['$settings.isActive', true] }, 1, 0]
          }
        },
        totalMatches: { $sum: '$statistics.totalMatches' },
        successfulReplies: { $sum: '$statistics.successfulReplies' },
        failedReplies: { $sum: '$statistics.failedReplies' },
        fallbackReplies: { $sum: '$statistics.fallbackReplies' },
        averageResponseTime: { $avg: '$statistics.averageResponseTime' }
      }
    }
  ]);
};

// Static method to find top performing keywords
keywordSchema.statics.getTopKeywords = function(userId, limit = 10) {
  const matchStage = userId ? { userId: mongoose.Types.ObjectId(userId) } : {};
  
  return this.aggregate([
    { $match: matchStage },
    {
      $addFields: {
        totalReplies: {
          $add: ['$statistics.successfulReplies', '$statistics.failedReplies', '$statistics.fallbackReplies']
        }
      }
    },
    { $match: { totalReplies: { $gt: 0 } } },
    {
      $addFields: {
        successRate: {
          $multiply: [
            { $divide: ['$statistics.successfulReplies', '$totalReplies'] },
            100
          ]
        }
      }
    },
    { $sort: { 'statistics.totalMatches': -1, successRate: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'posts',
        localField: 'postId',
        foreignField: '_id',
        as: 'post'
      }
    },
    { $unwind: '$post' }
  ]);
};

// Pre-save middleware to normalize keyword and synonyms
keywordSchema.pre('save', function(next) {
  // Ensure keyword is lowercase if not case sensitive
  if (!this.settings.caseSensitive) {
    this.keyword = this.keyword.toLowerCase();
    this.synonyms = this.synonyms.map(synonym => synonym.toLowerCase());
  }
  
  // Remove duplicate synonyms
  this.synonyms = [...new Set(this.synonyms)];
  
  // Remove synonyms that match the main keyword
  this.synonyms = this.synonyms.filter(synonym => synonym !== this.keyword);
  
  next();
});

const Keyword = mongoose.model('Keyword', keywordSchema);

module.exports = Keyword;
