const mongoose = require('mongoose');
const logger = require('./logger');

/**
 * Connect to MongoDB database
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    
    // Log database name
    logger.info(`Database: ${conn.connection.name}`);
    
    return conn;
  } catch (error) {
    logger.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
};

/**
 * Disconnect from MongoDB database
 */
const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB Disconnected');
  } catch (error) {
    logger.error(`Database disconnection error: ${error.message}`);
  }
};

/**
 * Handle MongoDB connection events
 */
mongoose.connection.on('connected', () => {
  logger.info('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  logger.error(`Mongoose connection error: ${err}`);
});

mongoose.connection.on('disconnected', () => {
  logger.info('Mongoose disconnected from MongoDB');
});

// Handle application termination
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  logger.info('Mongoose connection closed through app termination');
  process.exit(0);
});

module.exports = {
  connectDB,
  disconnectDB
};
