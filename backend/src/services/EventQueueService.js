const logger = require('../config/logger');
const EventEmitter = require('events');

/**
 * Event Queue Service
 * Simple queue system for processing webhook events one at a time
 */
class EventQueueService extends EventEmitter {
  constructor() {
    super();
    this.queue = [];
    this.isProcessing = false;
    this.maxRetries = 3;
    this.retryDelay = 3000; // 3 seconds
    this.processingStats = {
      totalProcessed: 0,
      totalSuccess: 0,
      totalFailed: 0,
      totalRetries: 0,
      averageProcessingTime: 0,
      lastProcessedAt: null
    };
    this.isInitialized = false;
  }

  /**
   * Initialize the queue service
   */
  initialize() {
    this.isInitialized = true;
    logger.info('EventQueueService initialized successfully');
    
    // Set up event listeners
    this.on('eventAdded', () => {
      if (!this.isProcessing) {
        this.processNext();
      }
    });

    this.on('eventProcessed', (result) => {
      this.updateStats(result);
      this.processNext();
    });

    this.on('eventFailed', (result) => {
      this.updateStats(result);
      this.processNext();
    });
  }

  /**
   * Add event to queue
   */
  async addEvent(eventData, processor, options = {}) {
    if (!this.isInitialized) {
      throw new Error('EventQueueService not initialized');
    }

    const queueItem = {
      id: this.generateEventId(),
      eventData,
      processor,
      options: {
        maxRetries: options.maxRetries || this.maxRetries,
        retryDelay: options.retryDelay || this.retryDelay,
        priority: options.priority || 0,
        timeout: options.timeout || 30000, // 30 seconds default timeout
        ...options
      },
      status: 'PENDING',
      retryCount: 0,
      createdAt: new Date(),
      startedAt: null,
      completedAt: null,
      error: null,
      result: null
    };

    // Insert based on priority (higher priority first)
    const insertIndex = this.queue.findIndex(item => item.options.priority < queueItem.options.priority);
    if (insertIndex === -1) {
      this.queue.push(queueItem);
    } else {
      this.queue.splice(insertIndex, 0, queueItem);
    }

    logger.info(`Event added to queue: ${queueItem.id} (priority: ${queueItem.options.priority}, queue size: ${this.queue.length})`);
    
    this.emit('eventAdded', queueItem);
    return queueItem.id;
  }

  /**
   * Process next event in queue
   */
  async processNext() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const queueItem = this.queue.shift();
    
    try {
      await this.processEvent(queueItem);
    } catch (error) {
      logger.error('Unexpected error in processNext:', error);
      queueItem.status = 'FAILED';
      queueItem.error = error.message;
      queueItem.completedAt = new Date();
      this.emit('eventFailed', queueItem);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process individual event with retry logic
   */
  async processEvent(queueItem) {
    queueItem.status = 'PROCESSING';
    queueItem.startedAt = new Date();
    
    logger.info(`Processing event: ${queueItem.id} (attempt ${queueItem.retryCount + 1}/${queueItem.options.maxRetries + 1})`);

    try {
      // Set up timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Event processing timeout')), queueItem.options.timeout);
      });

      // Process the event
      const processingPromise = queueItem.processor(queueItem.eventData);
      
      // Race between processing and timeout
      const result = await Promise.race([processingPromise, timeoutPromise]);
      
      // Success
      queueItem.status = 'SUCCESS';
      queueItem.result = result;
      queueItem.completedAt = new Date();
      
      logger.info(`Event processed successfully: ${queueItem.id} (processing time: ${queueItem.completedAt - queueItem.startedAt}ms)`);
      
      this.emit('eventProcessed', queueItem);
      
    } catch (error) {
      logger.error(`Event processing failed: ${queueItem.id}`, error);
      
      queueItem.retryCount++;
      queueItem.error = error.message;
      
      // Check if we should retry
      if (queueItem.retryCount <= queueItem.options.maxRetries) {
        logger.info(`Retrying event: ${queueItem.id} in ${queueItem.options.retryDelay}ms (attempt ${queueItem.retryCount}/${queueItem.options.maxRetries})`);
        
        // Reset status for retry
        queueItem.status = 'PENDING';
        queueItem.startedAt = null;
        
        // Schedule retry
        setTimeout(() => {
          // Add back to front of queue for immediate processing
          this.queue.unshift(queueItem);
          this.emit('eventAdded', queueItem);
        }, queueItem.options.retryDelay);
        
        this.processingStats.totalRetries++;
        
      } else {
        // Max retries exceeded
        queueItem.status = 'FAILED';
        queueItem.completedAt = new Date();
        
        logger.error(`Event failed after ${queueItem.retryCount} attempts: ${queueItem.id}`);
        
        this.emit('eventFailed', queueItem);
      }
    }
  }

  /**
   * Update processing statistics
   */
  updateStats(queueItem) {
    this.processingStats.totalProcessed++;
    this.processingStats.lastProcessedAt = new Date();
    
    if (queueItem.status === 'SUCCESS') {
      this.processingStats.totalSuccess++;
    } else if (queueItem.status === 'FAILED') {
      this.processingStats.totalFailed++;
    }
    
    // Update average processing time
    if (queueItem.startedAt && queueItem.completedAt) {
      const processingTime = queueItem.completedAt - queueItem.startedAt;
      const totalTime = this.processingStats.averageProcessingTime * (this.processingStats.totalProcessed - 1);
      this.processingStats.averageProcessingTime = (totalTime + processingTime) / this.processingStats.totalProcessed;
    }
  }

  /**
   * Generate unique event ID
   */
  generateEventId() {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      isProcessing: this.isProcessing,
      queueSize: this.queue.length,
      pendingEvents: this.queue.filter(item => item.status === 'PENDING').length,
      processingEvents: this.queue.filter(item => item.status === 'PROCESSING').length,
      statistics: { ...this.processingStats },
      uptime: this.isInitialized ? Date.now() - this.processingStats.lastProcessedAt : 0
    };
  }

  /**
   * Get queue items with optional filtering
   */
  getQueueItems(filter = {}) {
    let items = [...this.queue];
    
    if (filter.status) {
      items = items.filter(item => item.status === filter.status);
    }
    
    if (filter.limit) {
      items = items.slice(0, filter.limit);
    }
    
    return items.map(item => ({
      id: item.id,
      status: item.status,
      retryCount: item.retryCount,
      priority: item.options.priority,
      createdAt: item.createdAt,
      startedAt: item.startedAt,
      completedAt: item.completedAt,
      error: item.error,
      eventType: item.eventData?.type || 'unknown',
      processingTime: item.startedAt && item.completedAt ? 
        item.completedAt - item.startedAt : null
    }));
  }

  /**
   * Clear completed events from queue
   */
  clearCompleted() {
    const beforeCount = this.queue.length;
    this.queue = this.queue.filter(item => 
      item.status !== 'SUCCESS' && item.status !== 'FAILED'
    );
    const clearedCount = beforeCount - this.queue.length;
    
    logger.info(`Cleared ${clearedCount} completed events from queue`);
    return clearedCount;
  }

  /**
   * Pause queue processing
   */
  pause() {
    this.isProcessing = true; // Prevent new processing
    logger.info('Queue processing paused');
  }

  /**
   * Resume queue processing
   */
  resume() {
    this.isProcessing = false;
    logger.info('Queue processing resumed');
    
    // Start processing if there are pending events
    if (this.queue.length > 0) {
      this.processNext();
    }
  }

  /**
   * Clear all events from queue
   */
  clear() {
    const clearedCount = this.queue.length;
    this.queue = [];
    logger.info(`Cleared ${clearedCount} events from queue`);
    return clearedCount;
  }

  /**
   * Get event by ID
   */
  getEvent(eventId) {
    const item = this.queue.find(item => item.id === eventId);
    if (!item) {
      return null;
    }
    
    return {
      id: item.id,
      status: item.status,
      retryCount: item.retryCount,
      maxRetries: item.options.maxRetries,
      priority: item.options.priority,
      createdAt: item.createdAt,
      startedAt: item.startedAt,
      completedAt: item.completedAt,
      error: item.error,
      result: item.result,
      eventData: item.eventData,
      processingTime: item.startedAt && item.completedAt ? 
        item.completedAt - item.startedAt : null
    };
  }

  /**
   * Cancel event by ID
   */
  cancelEvent(eventId) {
    const index = this.queue.findIndex(item => item.id === eventId);
    if (index === -1) {
      return false;
    }
    
    const item = this.queue[index];
    if (item.status === 'PROCESSING') {
      logger.warn(`Cannot cancel event ${eventId} - currently processing`);
      return false;
    }
    
    this.queue.splice(index, 1);
    logger.info(`Event cancelled: ${eventId}`);
    return true;
  }

  /**
   * Get processing statistics
   */
  getStatistics() {
    const stats = { ...this.processingStats };
    
    // Calculate success rate
    stats.successRate = stats.totalProcessed > 0 ? 
      (stats.totalSuccess / stats.totalProcessed * 100).toFixed(2) : 0;
    
    // Calculate failure rate
    stats.failureRate = stats.totalProcessed > 0 ? 
      (stats.totalFailed / stats.totalProcessed * 100).toFixed(2) : 0;
    
    // Calculate retry rate
    stats.retryRate = stats.totalProcessed > 0 ? 
      (stats.totalRetries / stats.totalProcessed * 100).toFixed(2) : 0;
    
    return stats;
  }
}

// Create singleton instance
const eventQueueService = new EventQueueService();

module.exports = eventQueueService;
