const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
require('dotenv').config();

const logger = require('./config/logger');
const { connectDB } = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');

const app = express();
const PORT = parseInt(process.env.PORT) || 3000;

// Function to find available port
const findAvailablePort = (startPort) => {
  return new Promise((resolve, reject) => {
    const server = require('net').createServer();
    server.listen(startPort, (err) => {
      if (err) {
        server.close();
        findAvailablePort(startPort + 1).then(resolve).catch(reject);
      } else {
        const port = server.address().port;
        server.close();
        resolve(port);
      }
    });
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        findAvailablePort(startPort + 1).then(resolve).catch(reject);
      } else {
        reject(err);
      }
    });
  });
};

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
const authRoutes = require('./routes/auth');
const postsRoutes = require('./routes/posts');
const keywordsRoutes = require('./routes/keywords');
const activitiesRoutes = require('./routes/activities');
const webhookRoutes = require('./routes/webhook');

// API routes placeholder
app.get('/api', (req, res) => {
  res.json({
    message: 'Tanggapin API Server',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth: '/api/auth',
      posts: '/api/posts',
      keywords: '/api/keywords',
      activities: '/api/activities',
      webhook: '/api/webhook',
      health: '/health',
      database: '/api/db'
    }
  });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Posts routes
app.use('/api/posts', postsRoutes);

// Keywords routes
app.use('/api/keywords', keywordsRoutes);

// Activities routes
app.use('/api/activities', activitiesRoutes);

// Webhook routes
app.use('/api/webhook', webhookRoutes);

// Database status endpoints
app.get('/api/db/status', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  res.json({
    database: {
      status: states[dbState] || 'unknown',
      readyState: dbState,
      host: mongoose.connection.host || 'unknown',
      name: mongoose.connection.name || 'unknown',
      port: mongoose.connection.port || 'unknown'
    },
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/api/db/test', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Simple database test - check if we can perform a basic operation
    await mongoose.connection.db.admin().ping();
    
    const responseTime = Date.now() - startTime;
    
    res.json({
      database: {
        status: 'connected',
        test: 'passed',
        responseTime: `${responseTime}ms`,
        host: mongoose.connection.host,
        name: mongoose.connection.name
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Database test failed:', error);
    res.status(500).json({
      database: {
        status: 'error',
        test: 'failed',
        error: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use(errorHandler);

// Connect to database and start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Find available port
    const availablePort = await findAvailablePort(PORT);
    
    if (availablePort !== PORT) {
      logger.warn(`Port ${PORT} is busy, using port ${availablePort} instead`);
    }
    
    // Start server
    const server = app.listen(availablePort, () => {
      logger.info(`Server running on port ${availablePort}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      if (availablePort !== PORT) {
        logger.info(`Original port ${PORT} was busy, server started on ${availablePort}`);
      }
    });

    // Enhanced error handling for server
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${availablePort} is already in use`);
        process.exit(1);
      } else {
        logger.error('Server error:', error);
        process.exit(1);
      }
    });

    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      logger.info(`${signal} received, shutting down gracefully`);
      server.close((err) => {
        if (err) {
          logger.error('Error during server shutdown:', err);
          process.exit(1);
        }
        logger.info('Server closed successfully');
        mongoose.connection.close(false, () => {
          logger.info('MongoDB connection closed');
          process.exit(0);
        });
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;
