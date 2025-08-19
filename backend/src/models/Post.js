const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  instagramPostId: {
    type: String,
    required: [true, 'Instagram post ID is required'],
    unique: true,
    index: true
  },
  instagramMediaId: {
    type: String,
    required: [true, 'Instagram media ID is required']
  },
  postType: {
    type: String,
    enum: ['IMAGE', 'VIDEO', 'CAROUSEL_ALBUM', 'REEL'],
    required: [true, 'Post type is required']
  },
  caption: {
    type: String,
    maxlength: [2200, 'Caption cannot exceed 2200 characters']
  },
  permalink: {
    type: String,
    required: [true, 'Permalink is required']
  },
  thumbnailUrl: {
    type: String
  },
  mediaUrl: {
    type: String
  },
  timestamp: {
    type: Date,
    required: [true, 'Post timestamp is required']
  },
  automationSettings: {
    isEnabled: {
      type: Boolean,
      default: false
    },
    replyMode: {
      type: String,
      enum: ['COMMENTS_ONLY', 'DMS_ONLY', 'BOTH'],
      default: 'BOTH'
    },
    enabledAt: {
      type: Date
    },
    disabledAt: {
      type: Date
    }
  },
  statistics: {
    totalComments: {
      type: Number,
      default: 0
    },
    totalReplies: {
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
    lastProcessedAt: {
      type: Date
    }
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'ARCHIVED', 'ERROR'],
    default: 'INACTIVE'
  },
  lastSyncAt: {
    type: Date,
    default: Date.now
  },
  syncError: {
    message: String,
    code: String,
    timestamp: Date
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      // Add computed fields
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Compound indexes for performance
postSchema.index({ userId: 1, createdAt: -1 });
postSchema.index({ userId: 1, 'automationSettings.isEnabled': 1 });
postSchema.index({ instagramPostId: 1, userId: 1 });
postSchema.index({ status: 1, lastSyncAt: 1 });

// Virtual for success rate
postSchema.virtual('successRate').get(function() {
  if (this.statistics.totalReplies === 0) return 0;
  return Math.round((this.statistics.successfulReplies / this.statistics.totalReplies) * 100);
});

// Virtual for automation status
postSchema.virtual('automationStatus').get(function() {
  if (!this.automationSettings.isEnabled) return 'DISABLED';
  if (this.status !== 'ACTIVE') return 'INACTIVE';
  return 'ACTIVE';
});

// Instance method to enable automation
postSchema.methods.enableAutomation = function(replyMode = 'BOTH') {
  this.automationSettings.isEnabled = true;
  this.automationSettings.replyMode = replyMode;
  this.automationSettings.enabledAt = new Date();
  this.status = 'ACTIVE';
  return this.save();
};

// Instance method to disable automation
postSchema.methods.disableAutomation = function() {
  this.automationSettings.isEnabled = false;
  this.automationSettings.disabledAt = new Date();
  this.status = 'INACTIVE';
  return this.save();
};

// Instance method to update statistics
postSchema.methods.updateStatistics = function(stats) {
  Object.assign(this.statistics, stats);
  this.statistics.lastProcessedAt = new Date();
  return this.save();
};

// Instance method to increment reply counters
postSchema.methods.incrementReplyCounter = function(type) {
  this.statistics.totalReplies += 1;
  
  switch(type) {
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

// Static method to find posts with automation enabled
postSchema.statics.findAutomationEnabled = function(userId) {
  const query = {
    'automationSettings.isEnabled': true,
    status: 'ACTIVE'
  };
  
  if (userId) {
    query.userId = userId;
  }
  
  return this.find(query).populate('userId', 'name email instagramAccount.username');
};

// Static method to find posts needing sync
postSchema.statics.findPostsNeedingSync = function(olderThan = 24) {
  const cutoffDate = new Date();
  cutoffDate.setHours(cutoffDate.getHours() - olderThan);
  
  return this.find({
    status: 'ACTIVE',
    lastSyncAt: { $lt: cutoffDate }
  });
};

// Static method to get user's post statistics
postSchema.statics.getUserPostStats = function(userId) {
  return this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalPosts: { $sum: 1 },
        activePosts: {
          $sum: {
            $cond: [{ $eq: ['$automationSettings.isEnabled', true] }, 1, 0]
          }
        },
        totalReplies: { $sum: '$statistics.totalReplies' },
        successfulReplies: { $sum: '$statistics.successfulReplies' },
        failedReplies: { $sum: '$statistics.failedReplies' },
        fallbackReplies: { $sum: '$statistics.fallbackReplies' }
      }
    }
  ]);
};

// Pre-save middleware
postSchema.pre('save', function(next) {
  // Update lastSyncAt when post is modified
  if (this.isModified() && !this.isModified('lastSyncAt')) {
    this.lastSyncAt = new Date();
  }
  next();
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
