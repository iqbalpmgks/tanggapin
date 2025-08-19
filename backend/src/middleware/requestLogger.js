const logger = require('../config/logger');

/**
 * Request logging middleware
 * Logs HTTP requests with method, URL, IP, and response time
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Get client IP address
  const ip = req.ip || 
             req.connection.remoteAddress || 
             req.socket.remoteAddress ||
             (req.connection.socket ? req.connection.socket.remoteAddress : null);

  // Log the request
  logger.http(`${req.method} ${req.originalUrl} - ${ip}`);

  // Override res.end to log response time
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - start;
    
    // Log response with status code and duration
    logger.http(
      `${req.method} ${req.originalUrl} - ${ip} - ${res.statusCode} - ${duration}ms`
    );
    
    // Call the original end method
    originalEnd.apply(this, args);
  };

  next();
};

module.exports = requestLogger;
