const mongoose = require('mongoose');
const keywordMatchingService = require('./src/services/KeywordMatchingService');
const Keyword = require('./src/models/Keyword');
const Post = require('./src/models/Post');
const User = require('./src/models/User');

// Test configuration
const TEST_CONFIG = {
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/tanggapin_test',
  testTimeout: 30000
};

/**
 * Test suite for KeywordMatchingService
 */
class KeywordMatchingTest {
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
      console.log('🔧 Initializing test environment...');
      
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
        email: 'test@example.com',
        password: 'hashedpassword123',
        role: 'admin'
      });
      console.log('✅ Test user created');

      // Create test post
      this.testPost = await Post.create({
        userId: this.testUser._id,
        instagramPostId: 'test_post_123',
        instagramMediaId: 'test_media_123',
        postType: 'IMAGE',
        caption: 'Test post for keyword matching',
        permalink: 'https://instagram.com/p/test_post_123',
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

      console.log('🎯 Test environment ready!\n');
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
        synonyms: ['price', 'berapa', 'cost'],
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
        synonyms: ['stock', 'tersedia', 'available'],
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
        synonyms: ['shipping', 'kirim', 'delivery'],
        response: {
          dmMessage: 'Pengiriman gratis untuk pembelian minimal Rp 50.000!',
          fallbackComment: 'Info pengiriman ada di DM!',
          includeProductLink: false
        },
        settings: {
          isActive: true,
          matchType: 'CONTAINS',
          caseSensitive: false,
          priority: 6
        }
      },
      {
        keyword: 'warna',
        synonyms: ['color', 'colour'],
        response: {
          dmMessage: 'Tersedia dalam 5 warna: merah, biru, hijau, kuning, hitam.',
          fallbackComment: 'Pilihan warna lengkap, cek DM!',
          includeProductLink: false
        },
        settings: {
          isActive: true,
          matchType: 'EXACT',
          caseSensitive: false,
          priority: 5
        }
      },
      {
        keyword: 'inactive_keyword',
        synonyms: ['disabled'],
        response: {
          dmMessage: 'This should not match',
          fallbackComment: 'This should not match',
          includeProductLink: false
        },
        settings: {
          isActive: false,
          matchType: 'CONTAINS',
          caseSensitive: false,
          priority: 1
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
   * Run all tests
   */
  async runAllTests() {
    console.log('🚀 Starting Keyword Matching Service Tests\n');
    
    const tests = [
      () => this.testBasicMatching(),
      () => this.testSynonymMatching(),
      () => this.testPriorityOrdering(),
      () => this.testMatchTypes(),
      () => this.testFuzzyMatching(),
      () => this.testWordBoundaryMatching(),
      () => this.testBatchProcessing(),
      () => this.testCaching(),
      () => this.testInactiveKeywords(),
      () => this.testEdgeCases(),
      () => this.testPerformance()
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
   * Test basic keyword matching
   */
  async testBasicMatching() {
    console.log('📝 Testing basic keyword matching...');
    
    const testCases = [
      {
        text: 'Berapa harga produk ini?',
        expectedMatches: 1,
        expectedKeyword: 'harga'
      },
      {
        text: 'Apakah stok masih ada?',
        expectedMatches: 1,
        expectedKeyword: 'stok'
      },
      {
        text: 'Bagaimana pengiriman ke Jakarta?',
        expectedMatches: 1,
        expectedKeyword: 'pengiriman'
      },
      {
        text: 'Produk ini bagus sekali',
        expectedMatches: 0
      }
    ];

    for (const testCase of testCases) {
      const result = await keywordMatchingService.matchMessage(
        this.testPost._id,
        testCase.text
      );

      const success = result.success && 
                     result.matches.length === testCase.expectedMatches &&
                     (testCase.expectedMatches === 0 || 
                      result.matches[0].keyword.keyword === testCase.expectedKeyword);

      this.addTestResult(
        `Basic matching: "${testCase.text}"`,
        success,
        success ? 'Passed' : `Expected ${testCase.expectedMatches} matches, got ${result.matches.length}`
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
        expectedMatchedTerm: 'price'
      },
      {
        text: 'Is it available?',
        expectedKeyword: 'stok',
        expectedMatchedTerm: 'available'
      },
      {
        text: 'How about shipping?',
        expectedKeyword: 'pengiriman',
        expectedMatchedTerm: 'shipping'
      }
    ];

    for (const testCase of testCases) {
      const result = await keywordMatchingService.matchMessage(
        this.testPost._id,
        testCase.text
      );

      const success = result.success && 
                     result.matches.length > 0 &&
                     result.matches[0].keyword.keyword === testCase.expectedKeyword &&
                     result.matches[0].matchedTerm === testCase.expectedMatchedTerm;

      this.addTestResult(
        `Synonym matching: "${testCase.text}"`,
        success,
        success ? 'Passed' : `Expected keyword ${testCase.expectedKeyword}, got ${result.matches[0]?.keyword?.keyword}`
      );
    }
  }

  /**
   * Test priority ordering
   */
  async testPriorityOrdering() {
    console.log('📝 Testing priority ordering...');
    
    // Text that matches multiple keywords
    const text = 'Berapa harga dan apakah stok tersedia?';
    
    const result = await keywordMatchingService.matchMessage(
      this.testPost._id,
      text
    );

    // Should match both 'harga' (priority 9) and 'stok' (priority 8)
    // 'harga' should come first due to higher priority
    const success = result.success && 
                   result.matches.length >= 2 &&
                   result.matches[0].keyword.keyword === 'harga' &&
                   result.matches[1].keyword.keyword === 'stok';

    this.addTestResult(
      'Priority ordering',
      success,
      success ? 'Passed' : `Expected harga first, got ${result.matches[0]?.keyword?.keyword}`
    );
  }

  /**
   * Test different match types
   */
  async testMatchTypes() {
    console.log('📝 Testing match types...');
    
    const testCases = [
      {
        text: 'warna',
        expectedMatches: 1,
        description: 'EXACT match should work'
      },
      {
        text: 'warna merah',
        expectedMatches: 0,
        description: 'EXACT match should not match partial'
      },
      {
        text: 'harga murah',
        expectedMatches: 1,
        description: 'CONTAINS match should work'
      }
    ];

    for (const testCase of testCases) {
      const result = await keywordMatchingService.matchMessage(
        this.testPost._id,
        testCase.text
      );

      const success = result.success && result.matches.length === testCase.expectedMatches;

      this.addTestResult(
        `Match type: ${testCase.description}`,
        success,
        success ? 'Passed' : `Expected ${testCase.expectedMatches} matches, got ${result.matches.length}`
      );
    }
  }

  /**
   * Test fuzzy matching
   */
  async testFuzzyMatching() {
    console.log('📝 Testing fuzzy matching...');
    
    const testCases = [
      {
        text: 'hrga produk ini berapa?', // typo: 'hrga' instead of 'harga'
        options: { enableFuzzyMatching: true, fuzzyThreshold: 0.7 },
        expectedMatches: 1,
        description: 'Should match with typo'
      },
      {
        text: 'hrga produk ini berapa?',
        options: { enableFuzzyMatching: false },
        expectedMatches: 0,
        description: 'Should not match with fuzzy disabled'
      }
    ];

    for (const testCase of testCases) {
      const result = await keywordMatchingService.matchMessage(
        this.testPost._id,
        testCase.text,
        testCase.options
      );

      const success = result.success && result.matches.length === testCase.expectedMatches;

      this.addTestResult(
        `Fuzzy matching: ${testCase.description}`,
        success,
        success ? 'Passed' : `Expected ${testCase.expectedMatches} matches, got ${result.matches.length}`
      );
    }
  }

  /**
   * Test word boundary matching
   */
  async testWordBoundaryMatching() {
    console.log('📝 Testing word boundary matching...');
    
    const testCases = [
      {
        text: 'harga murah',
        options: { enableWordBoundary: true },
        expectedMatches: 1,
        description: 'Should match whole word'
      },
      {
        text: 'harganya murah',
        options: { enableWordBoundary: true },
        expectedMatches: 0,
        description: 'Should not match partial word with boundary'
      },
      {
        text: 'harganya murah',
        options: { enableWordBoundary: false },
        expectedMatches: 1,
        description: 'Should match partial word without boundary'
      }
    ];

    for (const testCase of testCases) {
      const result = await keywordMatchingService.matchMessage(
        this.testPost._id,
        testCase.text,
        testCase.options
      );

      const success = result.success && result.matches.length === testCase.expectedMatches;

      this.addTestResult(
        `Word boundary: ${testCase.description}`,
        success,
        success ? 'Passed' : `Expected ${testCase.expectedMatches} matches, got ${result.matches.length}`
      );
    }
  }

  /**
   * Test batch processing
   */
  async testBatchProcessing() {
    console.log('📝 Testing batch processing...');
    
    const messages = [
      'Berapa harga produk ini?',
      'Apakah stok masih ada?',
      'Bagaimana pengiriman?',
      'Produk ini bagus',
      'What is the price?'
    ];

    const result = await keywordMatchingService.matchMessages(
      this.testPost._id,
      messages
    );

    const success = result.success && 
                   result.results.length === 5 &&
                   result.summary.messagesWithMatches === 4 &&
                   result.summary.messagesWithoutMatches === 1;

    this.addTestResult(
      'Batch processing',
      success,
      success ? 'Passed' : `Expected 4 matches, 1 no-match, got ${result.summary.messagesWithMatches} matches`
    );
  }

  /**
   * Test caching functionality
   */
  async testCaching() {
    console.log('📝 Testing caching...');
    
    // Clear cache first
    keywordMatchingService.clearCache();
    
    // First call should be cache miss
    const result1 = await keywordMatchingService.matchMessage(
      this.testPost._id,
      'Berapa harga?'
    );

    // Second call should be cache hit
    const result2 = await keywordMatchingService.matchMessage(
      this.testPost._id,
      'Berapa harga?'
    );

    const success = result1.success && result2.success &&
                   !result1.cacheHit && result2.cacheHit;

    this.addTestResult(
      'Caching functionality',
      success,
      success ? 'Passed' : `Cache behavior incorrect: first=${result1.cacheHit}, second=${result2.cacheHit}`
    );
  }

  /**
   * Test inactive keywords are ignored
   */
  async testInactiveKeywords() {
    console.log('📝 Testing inactive keywords...');
    
    const result = await keywordMatchingService.matchMessage(
      this.testPost._id,
      'inactive_keyword should not match'
    );

    const success = result.success && result.matches.length === 0;

    this.addTestResult(
      'Inactive keywords ignored',
      success,
      success ? 'Passed' : `Inactive keyword matched: ${result.matches.length} matches`
    );
  }

  /**
   * Test edge cases
   */
  async testEdgeCases() {
    console.log('📝 Testing edge cases...');
    
    const testCases = [
      {
        postId: this.testPost._id,
        text: '',
        description: 'Empty text',
        expectedSuccess: false
      },
      {
        postId: null,
        text: 'test',
        description: 'Null postId',
        expectedSuccess: false
      },
      {
        postId: 'invalid_id',
        text: 'test',
        description: 'Invalid postId',
        expectedSuccess: true,
        expectedMatches: 0
      }
    ];

    for (const testCase of testCases) {
      const result = await keywordMatchingService.matchMessage(
        testCase.postId,
        testCase.text
      );

      const success = result.success === testCase.expectedSuccess &&
                     (testCase.expectedMatches === undefined || 
                      result.matches.length === testCase.expectedMatches);

      this.addTestResult(
        `Edge case: ${testCase.description}`,
        success,
        success ? 'Passed' : `Expected success=${testCase.expectedSuccess}, got ${result.success}`
      );
    }
  }

  /**
   * Test performance
   */
  async testPerformance() {
    console.log('📝 Testing performance...');
    
    const iterations = 100;
    const startTime = Date.now();
    
    for (let i = 0; i < iterations; i++) {
      await keywordMatchingService.matchMessage(
        this.testPost._id,
        `Test message ${i} with harga keyword`
      );
    }
    
    const endTime = Date.now();
    const averageTime = (endTime - startTime) / iterations;
    
    // Should be under 50ms per match on average
    const success = averageTime < 50;
    
    this.addTestResult(
      'Performance test',
      success,
      success ? `Passed (${averageTime.toFixed(2)}ms avg)` : `Too slow: ${averageTime.toFixed(2)}ms avg`
    );

    // Test metrics
    const metrics = keywordMatchingService.getMetrics();
    console.log('📊 Service metrics:', metrics);
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
    console.log('\n📋 Test Results Summary');
    console.log('========================');
    
    const passed = this.testResults.filter(r => r.success).length;
    const total = this.testResults.length;
    const percentage = Math.round((passed / total) * 100);
    
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${total - passed}`);
    console.log(`Success Rate: ${percentage}%`);
    
    if (passed === total) {
      console.log('\n🎉 All tests passed!');
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
      await User.deleteMany({ email: 'test@example.com' });
      await Post.deleteMany({ instagramPostId: 'test_post_123' });
      await Keyword.deleteMany({ keyword: { $in: ['harga', 'stok', 'pengiriman', 'warna', 'inactive_keyword'] } });
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
 * Run the test suite
 */
async function runTests() {
  const tester = new KeywordMatchingTest();
  
  try {
    await tester.initialize();
    await tester.runAllTests();
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  } finally {
    await tester.close();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { KeywordMatchingTest, runTests };
