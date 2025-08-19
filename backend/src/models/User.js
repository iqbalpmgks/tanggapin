const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  instagramAccount: {
    instagramUserId: {
      type: String,
      sparse: true // Allows multiple null values but unique non-null values
    },
    username: {
      type: String,
      trim: true
    },
    accessToken: {
      type: String
    },
    tokenExpiresAt: {
      type: Date
    },
    isConnected: {
      type: Boolean,
      default: false
    },
    accountType: {
      type: String,
      enum: ['BUSINESS', 'CREATOR'],
      default: 'BUSINESS'
    }
  },
  settings: {
    timezone: {
      type: String,
      default: 'UTC'
    },
    language: {
      type: String,
      default: 'en'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      webhook: {
        type: Boolean,
        default: true
      }
    }
  },
  lastLoginAt: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.role === 'user'; // Only required for regular users (created by admin)
    }
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      // Remove sensitive fields from JSON output
      delete ret.password;
      delete ret.instagramAccount.accessToken;
      return ret;
    }
  }
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ 'instagramAccount.instagramUserId': 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for full name display
userSchema.virtual('displayName').get(function() {
  return this.name || this.email;
});

// Instance method to check if Instagram token is expired
userSchema.methods.isInstagramTokenExpired = function() {
  if (!this.instagramAccount.tokenExpiresAt) return true;
  return new Date() >= this.instagramAccount.tokenExpiresAt;
};

// Instance method to check if user has valid Instagram connection
userSchema.methods.hasValidInstagramConnection = function() {
  return this.instagramAccount.isConnected && 
         this.instagramAccount.accessToken && 
         !this.isInstagramTokenExpired();
};

// Instance method to generate JWT token
userSchema.methods.generateAuthToken = function() {
  const payload = {
    id: this._id,
    email: this.email,
    role: this.role,
    name: this.name
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Instance method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLoginAt = new Date();
  return this.save();
};

// Static method to find users with expired tokens
userSchema.statics.findUsersWithExpiredTokens = function() {
  return this.find({
    'instagramAccount.isConnected': true,
    'instagramAccount.tokenExpiresAt': { $lt: new Date() }
  });
};

// Static method to find active users
userSchema.statics.findActiveUsers = function() {
  return this.find({ isActive: true });
};

// Static method to find user by email and verify password
userSchema.statics.findByCredentials = async function(email, password) {
  const user = await this.findOne({ 
    email: email.toLowerCase(),
    isActive: true 
  });
  
  if (!user) {
    throw new Error('Invalid login credentials');
  }
  
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new Error('Invalid login credentials');
  }
  
  return user;
};

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
