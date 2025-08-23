const mongoose = require('mongoose');
require('dotenv').config();

// Import services
const keywordMatchingService = require('./src/services/KeywordMatchingService');
const responseTemplateService = require('./src/services/ResponseTemplateService');
const eventQueueService = require('./src/services/EventQueueService');
const { initializeWebhookServices, processWebhookEvent } = require('./src/controllers/webhookController');

// Import models
const User = require('./src/models/User');
const Post = require('./src/models/Post');
const Keyword = require('./src/models/Keyword');
const Activity = require('./src/models/Activity');

/**
 * Complete System Integration Test
 * Tests all three systems working together:
 * 1. Response Template System
 * 2. Queue System for event processing
 * 3. Error handling and retry logic
 */

let testUser, testPost, testKeywords;

async function setupTestData() {
  console.log('\n=== Setting up test data ===');
  
  try {
    // Create test user
    testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashedpassword123',
      role: 'admin'
    });
    console.log('✓ Test user created');

    // Create test post
    testPost = await Post.create({
      userId: testUser._id,
      title: 'Test Product Post',
      description: 'Testing our amazing product',
      instagramPostId: 'test_post_123',
      productLink: 'https://example.com/product/123',
      automationSettings: {
        isEnabled: true,
        replyMode: 'DMS_WITH_FALLBACK'
      },
      status: 'ACTIVE'
    });
    console.log('✓ Test post created');

    // Create test keywords
    const keywordData = [
      {
        postId: testPost._id,
        keyword: 'harga',
        tag: 'harga',
        settings: {
          matchType: 'EXACT',
          isActive: true,
          priority: 1
        }
      },
      {
        postId: testPost._id,
        keyword: 'stok',
        tag: 'stok',
        settings: {
          matchType: 'EXACT',
          isActive: true,
          priority: 2
        }
      },
      {
        postId: testPost._id,
        keyword: 'cara order',
        tag: 'cara_order',
        settings: {
          matchType: 'CONTAINS',
          isActive: true,
          priority: 3
        }
      }
    ];

    testKeywords = await Keyword.insertMany(keywordData);
    console.log('✓ Test keywords created');

    return { testUser, testPost, testKeywords };
  } catch (error) {
    console.error('✗ Failed to setup test data:', error);
    throw error;
  }
}

async function testResponseTemplateService() {
  console.log('\n=== Testing Response Template Service ===');
  
  try {
    // Initialize service
    await responseTemplateService.initialize();
    console.log('✓ Response Template Service initialized');

    // Test getting templates
    const templates = responseTemplateService.getAllTemplates();
    console.log(`✓ Loaded ${templates.length} templates`);

    // Test getting response data
    const responseData = responseTemplateService.getResponseData('harga', {
      productLink: 'https://example.com/product/123'
    });
    console.log('✓ Response data retrieved:', {
      tag: responseData.tag,
      dmMessage: responseData.dmMessage.substring(0, 50) + '...',
      fallbackComment: responseData.fallbackComment
    });

    // Test template statistics
    const stats = responseTemplateService.getStatistics();
    console.log('✓ Template statistics:', stats);

    return true;
  } catch (error) {
    console.error('✗ Response Template Service test failed:', error);
    return false;
  }
}

async function testEventQueueService() {
  console.log('\n=== Testing Event Queue Service ===');
  
  try {
    // Initialize service
    eventQueueService.initialize();
    console.log('✓ Event Queue Service initialized');

    // Test adding events to queue
    const mockProcessor = async (data) => {
      console.log(`Processing event: ${data.type} - ${data.text}`);
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate processing
      return { success: true, processed: data.type };
    };

    const eventId1 = await eventQueueService.addEvent(
      { type: 'comment', text: 'Test comment', priority: 1 },
      mockProcessor,
      { priority: 1, maxRetries: 2 }
    );

    const eventId2 = await eventQueueService.addEvent(
      { type: 'message', text: 'Test message', priority: 2 },
      mockProcessor,
      { priority: 2, maxRetries: 2 }
    );

    console.log(`✓ Added events to queue: ${eventId1}, ${eventId2}`);

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check queue status
    const status = eventQueueService.getStatus();
    console.log('✓ Queue status:', {
      isProcessing: status.isProcessing,
      queueSize: status.queueSize,
      totalProcessed: status.statistics.totalProcessed
    });

    // Get statistics
    const stats = eventQueueService.getStatistics();
    console.log('✓ Queue statistics:', {
      totalProcessed: stats.totalProcessed,
      successRate: stats.successRate + '%',
      averageProcessingTime: Math.round(stats.averageProcessingTime) + 'ms'
    });

    return true;
  } catch (error) {
    console.error('✗ Event Queue Service test failed:', error);
    return false;
  }
}

async function testWebhookIntegration() {
  console.log('\n=== Testing Webhook Integration ===');
  
  try {
    // Initialize webhook services
    await initializeWebhookServices();
    console.log('✓ Webhook services initialized');

    // Test webhook event processing
    const testEvents = [
      {
        type: 'comment',
        postId: testPost.instagramPostId,
        fromUserId: 'user123',
        fromUsername: 'testuser123',
        text: 'Berapa harga produk ini?',
        commentId: 'comment123',
        timestamp: new Date()
      },
      {
        type: 'message',
        postId: testPost.instagramPostId,
        fromUserId: 'user456',
        fromUsername: 'testuser456',
        text: 'Masih ada stok?',
        messageId: 'message456',
        timestamp: new Date()
      },
      {
        type: 'comment',
        postId: testPost.instagramPostId,
        fromUserId: 'user789',
        fromUsername: 'testuser789',
        text: 'Gimana cara order nya?',
        commentId: 'comment789',
        timestamp: new Date()
      }
    ];

    console.log('Processing test events...');
    
    for (const eventData of testEvents) {
      // Add event to queue
      const eventId = await eventQueueService.addEvent(
        eventData,
        processWebhookEvent,
        {
          priority: eventData.type === 'message' ? 2 : 1,
          maxRetries: 3,
          retryDelay: 1000, // Faster for testing
          timeout: 10000
        }
      );
      
      console.log(`✓ Added ${eventData.type} event to queue: ${eventId}`);
    }

    // Wait for all events to process
    console.log('Waiting for events to process...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Check final queue status
    const finalStatus = eventQueueService.getStatus();
    console.log('✓ Final queue status:', {
      queueSize: finalStatus.queueSize,
      totalProcessed: finalStatus.statistics.totalProcessed,
      successRate: finalStatus.statistics.successRate + '%'
    });

    // Check activities created
    const activities = await Activity.find({ postId: testPost._id }).sort({ createdAt: -1 });
    console.log(`✓ Created ${activities.length} activity records`);

    activities.forEach((activity, index) => {
      console.log(`  Activity ${index + 1}:`, {
        type: activity.type,
        status: activity.status,
        tag: activity.matchingData?.tag,
        templateUsed: activity.matchingData?.templateUsed,
        retryCount: activity.response?.retryCount || 0
      });
    });

    return true;
  } catch (error) {
    console.error('✗ Webhook integration test failed:', error);
    return false;
  }
}

async function testErrorHandlingAndRetry() {
  console.log('\n=== Testing Error Handling and Retry Logic ===');
  
  try {
    // Create a processor that fails initially then succeeds
    let attemptCount = 0;
    const flakyProcessor = async (data) => {
      attemptCount++;
      console.log(`Attempt ${attemptCount} for event: ${data.text}`);
      
      if (attemptCount < 3) {
        throw new Error(`Simulated failure on attempt ${attemptCount}`);
      }
      
      return { success: true, processed: data.text, attempts: attemptCount };
    };

    // Add event that will fail and retry
    const eventId = await eventQueueService.addEvent(
      { type: 'test', text: 'Retry test event' },
      flakyProcessor,
      {
        priority: 5,
        maxRetries: 3,
        retryDelay: 500, // Fast retry for testing
        timeout: 5000
      }
    );

    console.log(`✓ Added flaky event to queue: ${eventId}`);

    // Wait for processing with retries
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check event status
    const eventStatus = eventQueueService.getEvent(eventId);
    if (eventStatus) {
      console.log('✓ Event status after retries:', {
        status: eventStatus.status,
        retryCount: eventStatus.retryCount,
        error: eventStatus.error
      });
    }

    // Test timeout scenario
    const timeoutProcessor = async (data) => {
      console.log('Starting long-running process...');
      await new Promise(resolve => setTimeout(resolve, 8000)); // Longer than timeout
      return { success: true };
    };

    const timeoutEventId = await eventQueueService.addEvent(
      { type: 'timeout', text: 'Timeout test' },
      timeoutProcessor,
      {
        priority: 1,
        maxRetries: 1,
        retryDelay: 500,
        timeout: 2000 // Short timeout
      }
    );

    console.log(`✓ Added timeout test event: ${timeoutEventId}`);

    // Wait for timeout
    await new Promise(resolve => setTimeout(resolve, 4000));

    const timeoutStatus = eventQueueService.getEvent(timeoutEventId);
    if (timeoutStatus) {
      console.log('✓ Timeout event status:', {
        status: timeoutStatus.status,
        error: timeoutStatus.error
      });
    }

    return true;
  } catch (error) {
    console.error('✗ Error handling test failed:', error);
    return false;
  }
}

async function cleanupTestData() {
  console.log('\n=== Cleaning up test data ===');
  
  try {
    await Activity.deleteMany({ postId: testPost._id });
    await Keyword.deleteMany({ postId: testPost._id });
    await Post.findByIdAndDelete(testPost._id);
    await User.findByIdAndDelete(testUser._id);
    
    console.log('✓ Test data cleaned up');
  } catch (error) {
    console.error('✗ Cleanup failed:', error);
  }
}

async function runCompleteSystemTest() {
  console.log('🚀 Starting Complete System Integration Test');
  console.log('Testing: Response Templates + Queue System + Error Handling');
  
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tanggapin_test');
    console.log('✓ Connected to MongoDB');

    // Setup test data
    await setupTestData();

    // Run all tests
    const results = {
      responseTemplates: await testResponseTemplateService(),
      eventQueue: await testEventQueueService(),
      webhookIntegration: await testWebhookIntegration(),
      errorHandling: await testErrorHandlingAndRetry()
    };

    // Print results
    console.log('\n=== Test Results ===');
    Object.entries(results).forEach(([test, passed]) => {
      console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
    });

    const allPassed = Object.values(results).every(result => result);
    console.log(`\n${allPassed ? '🎉' : '💥'} Overall: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);

    // Cleanup
    await cleanupTestData();

    // Final statistics
    const queueStats = eventQueueService.getStatistics();
    const templateStats = responseTemplateService.getStatistics();
    
    console.log('\n=== Final Statistics ===');
    console.log('Queue Service:', {
      totalProcessed: queueStats.totalProcessed,
      successRate: queueStats.successRate + '%',
      retryRate: queueStats.retryRate + '%'
    });
    console.log('Template Service:', {
      totalTemplates: templateStats.totalTemplates,
      activeTemplates: templateStats.activeTemplates,
      totalUsage: templateStats.totalUsage
    });

    process.exit(allPassed ? 0 : 1);
    
  } catch (error) {
    console.error('💥 Test suite failed:', error);
    await cleanupTestData();
    process.exit(1);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  runCompleteSystemTest();
}

module.exports = {
  runCompleteSystemTest,
  setupTestData,
  testResponseTemplateService,
  testEventQueueService,
  testWebhookIntegration,
  testErrorHandlingAndRetry,
  cleanupTestData
};
