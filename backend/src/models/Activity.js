const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
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
  keywordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Keyword',
    index: true
  },
  type: {
    type: String,
    enum: ['COMMENT_RECEIVED', 'DM_SENT', 'COMMENT_REPLIED', 'FALLBACK_COMMENT', 'ERROR'],
    required: [true, 'Activity type is required'],
    index: true
  },
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILED', 'PENDING', 'FALLBACK'],
    required: [true, 'Activity status is required'],
    index: true
  },
  instagramData: {
    commentId: {
      type: String,
      index: true
    },
    messageId: {
      type: String
    },
    fromUserId: {
      type: String,
      required: [true, 'Instagram user ID is required'],
      index: true
    },
    fromUsername: {
      type: String,
      required: [true, 'Instagram username is required']
    },
    originalText: {
      type: String,
      required: [true, 'Original text is required'],
      maxlength: [2200, 'Original text cannot exceed 2200 characters']
    },
    timestamp: {
      type: Date,
      required: [true, 'Instagram timestamp is required']
    }
  },
  matchedKeyword: {
    keyword: {
      type: String,
      required: function() {
        return this.keywordId != null;
      }
    },
    matchType: {
      type: String,
      enum: ['EXACT', 'CONTAINS', 'STARTS_WITH', 'ENDS_WITH']
    },
    matchedTerm: {
      type: String // The actual term that matched (could be synonym)
    }
  },
  response: {
    type: {
      type: String,
      enum: ['DM', 'COMMENT', 'NONE'],
      default: 'NONE'
    },
    message: {
      type: String,
      maxlength: [1000, 'Response message cannot exceed 1000 characters']
    },
    sentAt: {
      type: Date
    },
    deliveredAt: {
      type: Date
    },
    instagramResponseId: {
      type: String
    }
  },
  error: {
    code: {
      type: String
    },
    message: {
      type: String
    },
    details: {
      type: mongoose.Schema.Types.Mixed
    },
    retryCount: {
      type: Number,
      default: 0
    },
    lastRetryAt: {
      type: Date
    }
  },
  processing: {
    startedAt: {
      type: Date,
      default: Date.now
    },
    completedAt: {
      type: Date
    },
    responseTime: {
      type: Number // in milliseconds
    },
    queuePosition: {
      type: Number
    }
  },
  metadata: {
    userAgent: String,
    ipAddress: String,
    webhookId: String,
    processingNode: String,
    retryAttempts: [{
      attemptAt: Date,
      error: String,
      responseTime: Number
    }]
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
activitySchema.index({ userId: 1, createdAt: -1 });
activitySchema.index({ postId: 1, createdAt: -1 });
activitySchema.index({ type: 1, status: 1, createdAt: -1 });
activitySchema.index({ 'instagramData.fromUserId': 1, createdAt: -1 });
activitySchema.index({ status: 1, 'error.retryCount': 1 });
activitySchema.index({ createdAt: -1 }); // For general sorting

// Unique index to prevent duplicate processing of same Instagram event
activitySchema.index({ 
  'instagramData.commentId': 1, 
  'instagramData.fromUserId': 1,
  type: 1 
}, { 
  unique: true,
  sparse: true // Allow null values
});

// Virtual for processing duration
activitySchema.virtual('processingDuration').get(function() {
  if (!this.processing.completedAt || !this.processing.startedAt) return null;
  return this.processing.completedAt - this.processing.startedAt;
});

// Virtual for response success
activitySchema.virtual('isSuccessful').get(function() {
  return this.status === 'SUCCESS';
});

// Virtual for human-readable status
activitySchema.virtual('statusDisplay').get(function() {
  const statusMap = {
    'SUCCESS': 'Successful',
    'FAILED': 'Failed',
    'PENDING': 'Processing',
    'FALLBACK': 'Fallback Used'
  };
  return statusMap[this.status] || this.status;
});

// Instance method to mark as completed
activitySchema.methods.markCompleted = function(status, responseData = {}) {
  this.status = status;
  this.processing.completedAt = new Date();
  this.processing.responseTime = this.processing.completedAt - this.processing.startedAt;
  
  if (responseData.message) {
    this.response.message = responseData.message;
    this.response.type = responseData.type || 'DM';
    this.response.sentAt = new Date();
  }
  
  if (responseData.instagramResponseId) {
    this.response.instagramResponseId = responseData.instagramResponseId;
  }
  
  return this.save();
};

// Instance method to mark as failed
activitySchema.methods.markFailed = function(error, canRetry = false) {
  this.status = 'FAILED';
  this.processing.completedAt = new Date();
  this.processing.responseTime = this.processing.completedAt - this.processing.startedAt;
  
  this.error.code = error.code || 'UNKNOWN_ERROR';
  this.error.message = error.message || 'Unknown error occurred';
  this.error.details = error.details || {};
  
  if (canRetry) {
    this.error.retryCount += 1;
    this.error.lastRetryAt = new Date();
    this.metadata.retryAttempts.push({
      attemptAt: new Date(),
      error: error.message,
      responseTime: this.processing.responseTime
    });
  }
  
  return this.save();
};

// Instance method to mark as fallback
activitySchema.methods.markFallback = function(fallbackMessage) {
  this.status = 'FALLBACK';
  this.processing.completedAt = new Date();
  this.processing.responseTime = this.processing.completedAt - this.processing.startedAt;
  
  this.response.type = 'COMMENT';
  this.response.message = fallbackMessage;
  this.response.sentAt = new Date();
  
  return this.save();
};

// Static method to find activities by user
activitySchema.statics.findByUser = function(userId, options = {}) {
  const {
    limit = 50,
    skip = 0,
    status,
    type,
    startDate,
    endDate
  } = options;
  
  const query = { userId };
  
  if (status) query.status = status;
  if (type) query.type = type;
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('postId', 'instagramPostId caption thumbnailUrl')
    .populate('keywordId', 'keyword response.dmMessage');
};

// Static method to get activity statistics
activitySchema.statics.getActivityStats = function(userId, timeframe = 'week') {
  const now = new Date();
  let startDate;
  
  switch (timeframe) {
    case 'day':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
  
  const matchStage = { createdAt: { $gte: startDate } };
  if (userId) matchStage.userId = mongoose.Types.ObjectId(userId);
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalActivities: { $sum: 1 },
        successfulReplies: {
          $sum: { $cond: [{ $eq: ['$status', 'SUCCESS'] }, 1, 0] }
        },
        failedReplies: {
          $sum: { $cond: [{ $eq: ['$status', 'FAILED'] }, 1, 0] }
        },
        fallbackReplies: {
          $sum: { $cond: [{ $eq: ['$status', 'FALLBACK'] }, 1, 0] }
        },
        averageResponseTime: { $avg: '$processing.responseTime' },
        totalComments: {
          $sum: { $cond: [{ $eq: ['$type', 'COMMENT_RECEIVED'] }, 1, 0] }
        },
        totalDMs: {
          $sum: { $cond: [{ $eq: ['$type', 'DM_SENT'] }, 1, 0] }
        }
      }
    }
  ]);
};

// Static method to find activities needing retry
activitySchema.statics.findActivitiesForRetry = function(maxRetries = 3) {
  return this.find({
    status: 'FAILED',
    'error.retryCount': { $lt: maxRetries },
    $or: [
      { 'error.lastRetryAt': { $exists: false } },
      { 'error.lastRetryAt': { $lt: new Date(Date.now() - 5 * 60 * 1000) } } // 5 minutes ago
    ]
  }).sort({ createdAt: 1 });
};

// Static method to get hourly activity distribution
activitySchema.statics.getHourlyDistribution = function(userId, days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const matchStage = { createdAt: { $gte: startDate } };
  if (userId) matchStage.userId = mongoose.Types.ObjectId(userId);
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: { $hour: '$createdAt' },
        count: { $sum: 1 },
        successCount: {
          $sum: { $cond: [{ $eq: ['$status', 'SUCCESS'] }, 1, 0] }
        }
      }
    },
    { $sort: { '_id': 1 } }
  ]);
};

// Pre-save middleware to set processing times
activitySchema.pre('save', function(next) {
  if (this.isNew) {
    this.processing.startedAt = this.processing.startedAt || new Date();
  }
  
  if (this.isModified('status') && this.status !== 'PENDING' && !this.processing.completedAt) {
    this.processing.completedAt = new Date();
    this.processing.responseTime = this.processing.completedAt - this.processing.startedAt;
  }
  
  next();
});

const Activity = mongoose.model('Activity', activitySchema);

module.exports = Activity;
