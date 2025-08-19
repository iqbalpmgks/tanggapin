const { MongoMemoryServer } = require('mongodb-memory-server')
const mongoose = require('mongoose')

// Global test setup
let mongoServer

// Setup before all tests
beforeAll(async () => {
  // Start in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create()
  const mongoUri = mongoServer.getUri()
  
  // Connect to the in-memory database
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
})

// Cleanup after all tests
afterAll(async () => {
  // Close database connection
  await mongoose.connection.dropDatabase()
  await mongoose.connection.close()
  
  // Stop the in-memory MongoDB instance
  await mongoServer.stop()
})

// Clear all test data after each test
afterEach(async () => {
  const collections = mongoose.connection.collections
  
  for (const key in collections) {
    const collection = collections[key]
    await collection.deleteMany({})
  }
})

// Mock console methods to reduce noise in tests
const originalConsole = { ...console }

beforeAll(() => {
  console.log = jest.fn()
  console.info = jest.fn()
  console.warn = jest.fn()
  console.error = jest.fn()
})

afterAll(() => {
  console.log = originalConsole.log
  console.info = originalConsole.info
  console.warn = originalConsole.warn
  console.error = originalConsole.error
})

// Mock environment variables for tests
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-jwt-secret-key'
process.env.JWT_EXPIRES_IN = '1h'
process.env.MONGODB_URI = 'mongodb://localhost:27017/tanggapin-test'

// Mock Instagram API responses
const mockInstagramAPI = {
  getComments: jest.fn(),
  sendMessage: jest.fn(),
  postComment: jest.fn(),
  getUserInfo: jest.fn()
}

// Global test utilities
global.testUtils = {
  // Create test user
  createTestUser: async () => {
    const User = require('../src/models/User')
    const bcrypt = require('bcryptjs')
    
    const hashedPassword = await bcrypt.hash('testpassword', 12)
    
    return await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: hashedPassword,
      instagramAccountId: 'test_instagram_id',
      isActive: true
    })
  },
  
  // Create test post
  createTestPost: async (userId) => {
    const Post = require('../src/models/Post')
    
    return await Post.create({
      userId,
      instagramPostId: 'test_post_id',
      postUrl: 'https://instagram.com/p/test',
      caption: 'Test post caption',
      isActive: true,
      automationSettings: {
        enableCommentReply: true,
        enableDMReply: true,
        fallbackToComment: true
      }
    })
  },
  
  // Create test keyword
  createTestKeyword: async (postId, keyword = 'test', response = 'Test response') => {
    const Keyword = require('../src/models/Keyword')
    
    return await Keyword.create({
      postId,
      keyword,
      response,
      isActive: true,
      matchType: 'contains'
    })
  },
  
  // Generate JWT token for testing
  generateTestToken: (userId) => {
    const jwt = require('jsonwebtoken')
    return jwt.sign(
      { userId, username: 'testuser' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    )
  },
  
  // Mock Instagram API
  mockInstagramAPI
}

// Global test constants
global.testConstants = {
  VALID_USER_DATA: {
    username: 'testuser',
    email: 'test@example.com',
    password: 'testpassword',
    instagramAccountId: 'test_instagram_id'
  },
  
  VALID_POST_DATA: {
    instagramPostId: 'test_post_id',
    postUrl: 'https://instagram.com/p/test',
    caption: 'Test post caption'
  },
  
  VALID_KEYWORD_DATA: {
    keyword: 'price',
    response: 'The price is $99. DM us for more details!',
    matchType: 'contains'
  },
  
  INSTAGRAM_WEBHOOK_EVENT: {
    object: 'instagram',
    entry: [{
      id: 'test_page_id',
      time: Date.now(),
      changes: [{
        value: {
          from: {
            id: 'test_user_id',
            username: 'testuser'
          },
          media: {
            id: 'test_media_id'
          },
          text: 'What is the price?',
          id: 'test_comment_id'
        },
        field: 'comments'
      }]
    }]
  }
}

// Suppress specific warnings in tests
const originalWarn = console.warn
console.warn = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('DeprecationWarning') ||
     args[0].includes('ExperimentalWarning'))
  ) {
    return
  }
  originalWarn.apply(console, args)
}
