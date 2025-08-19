const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

/**
 * Generate JWT token
 * @param {Object} payload - Token payload
 * @param {string} expiresIn - Token expiration time
 * @returns {string} JWT token
 */
const generateToken = (payload, expiresIn = process.env.JWT_EXPIRES_IN || '7d') => {
  try {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
  } catch (error) {
    logger.error('Error generating JWT token:', error);
    throw new Error('Token generation failed');
  }
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    logger.error('Error verifying JWT token:', error);
    throw error;
  }
};

/**
 * Decode JWT token without verification
 * @param {string} token - JWT token to decode
 * @returns {Object} Decoded token payload
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    logger.error('Error decoding JWT token:', error);
    throw new Error('Token decoding failed');
  }
};

/**
 * Check if token is expired
 * @param {string} token - JWT token to check
 * @returns {boolean} True if token is expired
 */
const isTokenExpired = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      return true;
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    logger.error('Error checking token expiration:', error);
    return true;
  }
};

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} Extracted token or null
 */
const extractTokenFromHeader = (authHeader) => {
  if (!authHeader) {
    return null;
  }
  
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7);
};

/**
 * Get token expiration time
 * @param {string} token - JWT token
 * @returns {Date|null} Expiration date or null
 */
const getTokenExpiration = (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) {
      return null;
    }
    
    return new Date(decoded.exp * 1000);
  } catch (error) {
    logger.error('Error getting token expiration:', error);
    return null;
  }
};

/**
 * Get time until token expires
 * @param {string} token - JWT token
 * @returns {number|null} Time until expiration in milliseconds or null
 */
const getTimeUntilExpiration = (token) => {
  try {
    const expirationDate = getTokenExpiration(token);
    if (!expirationDate) {
      return null;
    }
    
    const currentTime = new Date();
    const timeUntilExpiration = expirationDate.getTime() - currentTime.getTime();
    
    return timeUntilExpiration > 0 ? timeUntilExpiration : 0;
  } catch (error) {
    logger.error('Error calculating time until expiration:', error);
    return null;
  }
};

/**
 * Refresh token if it's close to expiration
 * @param {string} token - Current JWT token
 * @param {Object} user - User object
 * @param {number} refreshThreshold - Time threshold in milliseconds (default: 1 hour)
 * @returns {string|null} New token if refreshed, null otherwise
 */
const refreshTokenIfNeeded = (token, user, refreshThreshold = 60 * 60 * 1000) => {
  try {
    const timeUntilExpiration = getTimeUntilExpiration(token);
    
    if (timeUntilExpiration === null || timeUntilExpiration <= refreshThreshold) {
      // Token is close to expiration or expired, generate new one
      const payload = {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name
      };
      
      return generateToken(payload);
    }
    
    return null; // No refresh needed
  } catch (error) {
    logger.error('Error refreshing token:', error);
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken,
  decodeToken,
  isTokenExpired,
  extractTokenFromHeader,
  getTokenExpiration,
  getTimeUntilExpiration,
  refreshTokenIfNeeded
};
