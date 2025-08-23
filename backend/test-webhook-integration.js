const mongoose = require('mongoose');
const keywordMatchingService = require('./src/services/KeywordMatchingService');
const { processWebhookEvent } = require('./src/controllers/webhookController');
const Keyword = require('./src/models/Keyword');
const Post = require('./src/models/Post');
const User = require('./src/models/User');
const Activity = require('./src/models/Activity');

// Test configuration
const TEST_CONFIG = {
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/tanggapin_test',
  testTimeout: 30000
};

/**
 * Test suite for Webhook Integration with Keyword Matching
 */
class WebhookIntegrationTest {
  constructor() {
    this.testResults = [];
    this.testUser = null;
    this.testPost = null;
    this.testKeywords = [];
  }

  /**
   * Initialize test environment
   */
  async initialize() {
    try {
      console.log('🔧 Initializing webhook integration test environment...');
      
      // Connect to test database
      await mongoose.connect(TEST_CONFIG.mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      console.log('✅ Connected to test database');

      // Clean up existing test data
      await this.cleanup();

      // Create test user
      this.testUser = await User.create({
        name: 'Test User',
        email: 'webhook-test@example.com',
        password: 'hashedpassword123',
        role: 'admin'
      });
      console.log('✅ Test user created');

      // Create test post
      this.testPost = await Post.create({
        userId: this.testUser._id,
        instagramPostId: 'webhook_test_post_123',
        instagramMediaId: 'webhook_test_media_123',
        postType: 'IMAGE',
        caption: 'Test post for webhook integration',
        permalink: 'https://instagram.com/p/webhook_test_post_123',
        mediaUrl: 'https://example.com/image.jpg',
        timestamp: new Date(),
        automationSettings: {
          isEnabled: true,
          replyMode: 'BOTH'
        },
        status: 'ACTIVE'
      });
      console.log('✅ Test post created');

      // Create test keywords
      await this.createTestKeywords();
      console.log('✅ Test keywords created');

      console.log('🎯 Webhook integration test environment ready!\n');
    } catch (error) {
      console.error('❌ Failed to initialize test environment:', error);
      throw error;
    }
  }

  /**
   * Create test keywords with various configurations
   */
  async createTestKeywords() {
    const keywordConfigs = [
      {
        keyword: 'harga',
        synonyms: ['price', 'berapa', 'cost', 'biaya'],
        response: {
          dmMessage: 'Harga produk ini adalah Rp 100.000. Silakan DM untuk info lebih lanjut!',
          fallbackComment: 'Silakan cek DM untuk info harga ya!',
          includeProductLink: true,
          productLink: 'https://tokopedia.com/product/123'
        },
        settings: {
          isActive: true,
          matchType: 'CONTAINS',
          caseSensitive: false,
          priority: 9
        }
      },
      {
        keyword: 'stok',
        synonyms: ['stock', 'tersedia', 'available', 'ready'],
        response: {
          dmMessage: 'Stok masih tersedia! Ready stock untuk pengiriman hari ini.',
          fallbackComment: 'Stok tersedia, cek DM ya!',
          includeProductLink: false
        },
        settings: {
          isActive: true,
          matchType: 'CONTAINS',
          caseSensitive: false,
          priority: 8
        }
      },
      {
        keyword: 'pengiriman',
        synonyms: ['shipping', 'kirim', 'delivery', 'ongkir'],
        response: {
          dmMessage: 'Pengiriman gratis untuk pembelian minimal Rp 50.000!',
          fallbackComment: 'Info pengiriman ada di DM!',
          includeProductLink: false
        },
        settings: {
          isActive: true,
          matchType: 'CONTAINS',
          caseSensitive: false,
          priority: 7
        }
      },
      {
        keyword: 'warna',
        synonyms: ['color', 'colour', 'variant'],
        response: {
          dmMessage: 'Tersedia dalam 5 warna: merah, biru, hijau, kuning, hitam.',
          fallbackComment: 'Pilihan warna lengkap, cek DM!',
          includeProductLink: false
        },
        settings: {
          isActive: true,
          matchType: 'EXACT',
          caseSensitive: false,
          priority: 6
        }
      }
    ];

    for (const config of keywordConfigs) {
      const keyword = await Keyword.create({
        userId: this.testUser._id,
        postId: this.testPost._id,
        ...config
      });
      this.testKeywords.push(keyword);
    }
  }

  /**
   * Run all integration tests
   */
  async runAllTests() {
    console.log('🚀 Starting Webhook Integration Tests\n');
    
    const tests = [
      () => this.testBasicWebhookProcessing(),
      () => this.testKeywordMatching(),
      () => this.testSynonymMatching(),
      () => this.testPriorityHandling(),
      () => this.testFuzzyMatching(),
      () => this.testActivityLogging(),
      () => this.testNoMatchScenario(),
      () => this.testInactivePostScenario(),
      () => this.testErrorHandling(),
      () => this.testPerformanceMetrics()
    ];

    for (const test of tests) {
      try {
        await test();
      } catch (error) {
        this.addTestResult(test.name, false, error.message);
      }
    }

    this.printResults();
  }

  /**
   * Test basic webhook event processing
   */
  async testBasicWebhookProcessing() {
    console.log('📝 Testing basic webhook event processing...');
    
    const webhookEvent = {
      type: 'comment',
      postId: this.testPost.instagramPostId,
      fromUserId: 'test_user_123',
      fromUsername: 'testuser',
      text: 'Berapa harga produk ini?',
      commentId: 'comment_123',
      timestamp: new Date()
    };

    const result = await this.processWebhookEventSafely(webhookEvent);
    
    const success = result.success && 
                   result.action === 'replied' &&
                   result.keyword === 'harga' &&
                   result.activityId;

    this.addTestResult(
      'Basic webhook processing',
      success,
      success ? 'Passed' : `Expected successful reply, got: ${JSON.stringify(result)}`
    );
  }

  /**
   * Test keyword matching functionality
   */
  async testKeywordMatching() {
    console.log('📝 Testing keyword matching...');
    
    const testCases = [
      {
        text: 'Apakah stok masih ada?',
        expectedKeyword: 'stok',
        description: 'Stock inquiry'
      },
      {
        text: 'Bagaimana pengiriman ke Jakarta?',
        expectedKeyword: 'pengiriman',
        description: 'Shipping inquiry'
      },
      {
        text: 'warna apa saja yang tersedia?',
        expectedKeyword: 'warna',
        description: 'Color inquiry (exact match)'
      }
    ];

    for (const testCase of testCases) {
      const webhookEvent = {
        type: 'comment',
        postId: this.testPost.instagramPostId,
        fromUserId: 'test_user_456',
        fromUsername: 'testuser2',
        text: testCase.text,
        commentId: `comment_${Date.now()}`,
        timestamp: new Date()
      };

      const result = await this.processWebhookEventSafely(webhookEvent);
      
      const success = result.success && result.keyword === testCase.expectedKeyword;
      
      this.addTestResult(
        `Keyword matching: ${testCase.description}`,
        success,
        success ? 'Passed' : `Expected ${testCase.expectedKeyword}, got ${result.keyword}`
      );
    }
  }

  /**
   * Test synonym matching
   */
  async testSynonymMatching() {
    console.log('📝 Testing synonym matching...');
    
    const testCases = [
      {
        text: 'What is the price?',
        expectedKeyword: 'harga',
        expectedTerm: 'price',
        description: 'English synonym for harga'
      },
      {
        text: 'Is it available?',
        expectedKeyword: 'stok',
        expectedTerm: 'available',
        description: 'English synonym for stok'
      },
      {
        text: 'How about shipping cost?',
        expectedKeyword: 'pengiriman',
        expectedTerm: 'shipping',
        description: 'English synonym for pengiriman'
      }
    ];

    for (const testCase of testCases) {
      const webhookEvent = {
        type: 'comment',
        postId: this.testPost.instagramPostId,
        fromUserId: 'test_user_789',
        fromUsername: 'testuser3',
        text: testCase.text,
        commentId: `comment_${Date.now()}`,
        timestamp: new Date()
      };

      const result = await this.processWebhookEventSafely(webhookEvent);
      
      const success = result.success && 
                     result.keyword === testCase.expectedKeyword;
      
      this.addTestResult(
        `Synonym matching: ${testCase.description}`,
        success,
        success ? 'Passed' : `Expected ${testCase.expectedKeyword}, got ${result.keyword}`
      );
    }
  }

  /**
   * Test priority handling
   */
  async testPriorityHandling() {
    console.log('📝 Testing priority handling...');
    
    // Text that matches multiple keywords
    const webhookEvent = {
      type: 'comment',
      postId: this.testPost.instagramPostId,
      fromUserId: 'test_user_priority',
      fromUsername: 'prioritytest',
      text: 'Berapa harga dan apakah stok tersedia untuk pengiriman?',
      commentId: `comment_priority_${Date.now()}`,
      timestamp: new Date()
    };

    const result = await this.processWebhookEventSafely(webhookEvent);
    
    // Should match 'harga' first due to highest priority (9)
    const success = result.success && result.keyword === 'harga';
    
    this.addTestResult(
      'Priority handling',
      success,
      success ? 'Passed' : `Expected harga (priority 9), got ${result.keyword}`
    );
  }

  /**
   * Test fuzzy matching
   */
  async testFuzzyMatching() {
    console.log('📝 Testing fuzzy matching...');
    
    const webhookEvent = {
      type: 'comment',
      postId: this.testPost.instagramPostId,
      fromUserId: 'test_user_fuzzy',
      fromUsername: 'fuzzytest',
      text: 'hrga produk ini berapa ya?', // typo: 'hrga' instead of 'harga'
      commentId: `comment_fuzzy_${Date.now()}`,
      timestamp: new Date()
    };

    const result = await this.processWebhookEventSafely(webhookEvent);
    
    // Should match 'harga' with fuzzy matching enabled
    const success = result.success && result.keyword === 'harga';
    
    this.addTestResult(
      'Fuzzy matching',
      success,
      success ? 'Passed' : `Expected harga with fuzzy match, got ${result.keyword || 'no match'}`
    );
  }

  /**
   * Test activity logging
   */
  async testActivityLogging() {
    console.log('📝 Testing activity logging...');
    
    const webhookEvent = {
      type: 'comment',
      postId: this.testPost.instagramPostId,
      fromUserId: 'test_user_logging',
      fromUsername: 'loggingtest',
      text: 'Test activity logging dengan keyword stok',
      commentId: `comment_logging_${Date.now()}`,
      timestamp: new Date()
    };

    const result = await this.processWebhookEventSafely(webhookEvent);
    
    if (result.success && result.activityId) {
      // Check if activity was logged correctly
      const activity = await Activity.findById(result.activityId);
      
      const success = activity && 
                     activity.type === 'COMMENT_RECEIVED' &&
                     activity.status === 'SUCCESS' &&
                     activity.instagramData.fromUsername === 'loggingtest' &&
                     activity.matchingData &&
                     activity.matchingData.tag;
      
      this.addTestResult(
        'Activity logging',
        success,
        success ? 'Passed' : 'Activity not logged correctly'
      );
    } else {
      this.addTestResult(
        'Activity logging',
        false,
        'Webhook processing failed, cannot test logging'
      );
    }
  }

  /**
   * Test no match scenario
   */
  async testNoMatchScenario() {
    console.log('📝 Testing no match scenario...');
    
    const webhookEvent = {
      type: 'comment',
      postId: this.testPost.instagramPostId,
      fromUserId: 'test_user_nomatch',
      fromUsername: 'nomatchtest',
      text: 'This text should not match any keywords',
      commentId: `comment_nomatch_${Date.now()}`,
      timestamp: new Date()
    };

    const result = await this.processWebhookEventSafely(webhookEvent);
    
    const success = result.success && 
                   result.reason === 'No matching keywords' &&
                   result.action === 'logged';
    
    this.addTestResult(
      'No match scenario',
      success,
      success ? 'Passed' : `Expected no match, got: ${JSON.stringify(result)}`
    );
  }

  /**
   * Test inactive post scenario
   */
  async testInactivePostScenario() {
    console.log('📝 Testing inactive post scenario...');
    
    const webhookEvent = {
      type: 'comment',
      postId: 'nonexistent_post_123',
      fromUserId: 'test_user_inactive',
      fromUsername: 'inactivetest',
      text: 'Berapa harga produk ini?',
      commentId: `comment_inactive_${Date.now()}`,
      timestamp: new Date()
    };

    const result = await this.processWebhookEventSafely(webhookEvent);
    
    const success = !result.success && 
                   result.reason === 'Post not found or automation disabled';
    
    this.addTestResult(
      'Inactive post scenario',
      success,
      success ? 'Passed' : `Expected post not found, got: ${JSON.stringify(result)}`
    );
  }

  /**
   * Test error handling
   */
  async testErrorHandling() {
    console.log('📝 Testing error handling...');
    
    const webhookEvent = {
      type: 'comment',
      postId: this.testPost.instagramPostId,
      fromUserId: null, // Invalid data to trigger error
      fromUsername: 'errortest',
      text: 'Test error handling',
      commentId: `comment_error_${Date.now()}`,
      timestamp: new Date()
    };

    const result = await this.processWebhookEventSafely(webhookEvent);
    
    const success = !result.success && result.reason;
    
    this.addTestResult(
      'Error handling',
      success,
      success ? 'Passed' : 'Error not handled correctly'
    );
  }

  /**
   * Test performance metrics
   */
  async testPerformanceMetrics() {
    console.log('📝 Testing performance metrics...');
    
    const iterations = 10;
    const startTime = Date.now();
    let successCount = 0;
    
    for (let i = 0; i < iterations; i++) {
      const webhookEvent = {
        type: 'comment',
        postId: this.testPost.instagramPostId,
        fromUserId: `test_user_perf_${i}`,
        fromUsername: `perftest${i}`,
        text: `Performance test ${i} dengan keyword harga`,
        commentId: `comment_perf_${Date.now()}_${i}`,
        timestamp: new Date()
      };

      const result = await this.processWebhookEventSafely(webhookEvent);
      if (result.success) successCount++;
    }
    
    const endTime = Date.now();
    const averageTime = (endTime - startTime) / iterations;
    
    // Should process under 100ms per event on average
    const success = averageTime < 100 && successCount === iterations;
    
    this.addTestResult(
      'Performance metrics',
      success,
      success ? `Passed (${averageTime.toFixed(2)}ms avg, ${successCount}/${iterations} success)` : 
                `Too slow or failed: ${averageTime.toFixed(2)}ms avg, ${successCount}/${iterations} success`
    );

    // Get service metrics
    const metrics = keywordMatchingService.getMetrics();
    console.log('📊 Service metrics after tests:', metrics);
  }

  /**
   * Safely process webhook event with error handling
   */
  async processWebhookEventSafely(eventData) {
    try {
      // Import the function dynamically to avoid circular dependencies
      const { processWebhookEvent } = require('./src/controllers/webhookController');
      return await processWebhookEvent(eventData);
    } catch (error) {
      return { success: false, reason: error.message };
    }
  }

  /**
   * Add test result
   */
  addTestResult(testName, success, message) {
    this.testResults.push({ testName, success, message });
    const icon = success ? '✅' : '❌';
    console.log(`${icon} ${testName}: ${message}`);
  }

  /**
   * Print final test results
   */
  printResults() {
    console.log('\n📋 Webhook Integration Test Results');
    console.log('===================================');
    
    const passed = this.testResults.filter(r => r.success).length;
    const total = this.testResults.length;
    const percentage = Math.round((passed / total) * 100);
    
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${total - passed}`);
    console.log(`Success Rate: ${percentage}%`);
    
    if (passed === total) {
      console.log('\n🎉 All webhook integration tests passed!');
    } else {
      console.log('\n⚠️  Some tests failed:');
      this.testResults
        .filter(r => !r.success)
        .forEach(r => console.log(`   ❌ ${r.testName}: ${r.message}`));
    }
  }

  /**
   * Clean up test data
   */
  async cleanup() {
    try {
      await User.deleteMany({ email: 'webhook-test@example.com' });
      await Post.deleteMany({ instagramPostId: 'webhook_test_post_123' });
      await Keyword.deleteMany({ 
        keyword: { $in: ['harga', 'stok', 'pengiriman', 'warna'] },
        userId: { $exists: true }
      });
      await Activity.deleteMany({ 
        'instagramData.fromUsername': { 
          $in: ['testuser', 'testuser2', 'testuser3', 'prioritytest', 'fuzzytest', 'loggingtest', 'nomatchtest', 'inactivetest', 'errortest']
        }
      });
      console.log('✅ Test data cleaned up');
    } catch (error) {
      console.log('⚠️  Cleanup warning:', error.message);
    }
  }

  /**
   * Close database connection
   */
  async close() {
    await this.cleanup();
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  }
}

/**
 * Run the webhook integration test suite
 */
async function runWebhookIntegrationTests() {
  const tester = new WebhookIntegrationTest();
  
  try {
    await tester.initialize();
    await tester.runAllTests();
  } catch (error) {
    console.error('❌ Webhook integration test suite failed:', error);
  } finally {
    await tester.close();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runWebhookIntegrationTests().catch(console.error);
}

module.exports = { WebhookIntegrationTest, runWebhookIntegrationTests };
