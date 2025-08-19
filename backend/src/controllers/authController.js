const User = require('../models/User');
const logger = require('../config/logger');
const Joi = require('joi');

// Validation schemas
const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'any.required': 'Password is required'
  })
});

const createUserSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'any.required': 'Password is required'
  }),
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name cannot exceed 100 characters',
    'any.required': 'Name is required'
  }),
  role: Joi.string().valid('admin', 'user').default('user')
});

/**
 * Login user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const login = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { email, password } = value;

    // Find user and verify credentials
    const user = await User.findByCredentials(email, password);
    
    // Generate JWT token
    const token = user.generateAuthToken();
    
    // Update last login
    await user.updateLastLogin();
    
    logger.info(`User logged in: ${user.email}`);
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          lastLoginAt: user.lastLoginAt,
          instagramAccount: {
            isConnected: user.instagramAccount.isConnected,
            username: user.instagramAccount.username
          }
        },
        token
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    
    if (error.message === 'Invalid login credentials') {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error during login'
    });
  }
};

/**
 * Get current user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getProfile = async (req, res) => {
  try {
    const user = req.user;
    
    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
          lastLoginAt: user.lastLoginAt,
          instagramAccount: {
            isConnected: user.instagramAccount.isConnected,
            username: user.instagramAccount.username,
            accountType: user.instagramAccount.accountType
          },
          settings: user.settings,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Create new user (Admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createUser = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = createUserSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { email, password, name, role } = value;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Create new user
    const userData = {
      email,
      password,
      name,
      role,
      createdBy: req.user._id
    };

    const user = new User(userData);
    await user.save();

    logger.info(`New user created: ${user.email} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    logger.error('Create user error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error during user creation'
    });
  }
};

/**
 * Logout user (client-side token removal)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const logout = async (req, res) => {
  try {
    logger.info(`User logged out: ${req.user.email}`);
    
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during logout'
    });
  }
};

/**
 * Verify token validity
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const verifyToken = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        user: {
          id: req.user._id,
          email: req.user.email,
          name: req.user.name,
          role: req.user.role
        }
      }
    });
  } catch (error) {
    logger.error('Verify token error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

module.exports = {
  login,
  getProfile,
  createUser,
  logout,
  verifyToken
};
