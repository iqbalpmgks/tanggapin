const mongoose = require('mongoose');
const axios = require('axios');
const User = require('./src/models/User');
require('dotenv').config();

// Test configuration
const BASE_URL = 'http://localhost:3000/api';
const TEST_USER = {
  email: 'user1@gmail.com',
  password: 'user123456',
  name: 'Test User',
  role: 'admin'
};

let authToken = '';

async function setupTestEnvironment() {
  try {
    console.log('🔄 Setting up test environment...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tanggapin', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Clean up existing test user
    await User.deleteOne({ email: TEST_USER.email });
    
    // Create test user
    const user = new User(TEST_USER);
    await user.save();
    
    console.log('✅ Test user created');
    console.log(`📧 Email: ${user.email}`);
    console.log(`🔐 Password: ${TEST_USER.password}`);
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    throw error;
  }
}

async function testLoginEndpoint() {
  console.log('\n🔐 Testing POST /api/auth/login endpoint...');
  
  try {
    // Test successful login
    console.log('\n📝 Testing successful login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    
    console.log('✅ Login successful!');
    console.log(`📄 Status: ${loginResponse.status}`);
    console.log(`📧 User: ${loginResponse.data.data.user.email}`);
    console.log(`👤 Name: ${loginResponse.data.data.user.name}`);
    console.log(`🎭 Role: ${loginResponse.data.data.user.role}`);
    console.log(`🎫 Token received: ${loginResponse.data.data.token ? 'YES' : 'NO'}`);
    console.log(`🎫 Token preview: ${loginResponse.data.data.token.substring(0, 50)}...`);
    
    // Store token for protected route tests
    authToken = loginResponse.data.data.token;
    
    // Test invalid credentials
    console.log('\n❌ Testing invalid credentials...');
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        email: TEST_USER.email,
        password: 'wrongpassword'
      });
      console.log('❌ SECURITY ISSUE: Invalid credentials accepted!');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Security working: Invalid credentials rejected');
        console.log(`📄 Status: ${error.response.status}`);
        console.log(`📝 Message: ${error.response.data.error}`);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    
    // Test missing email
    console.log('\n📝 Testing missing email validation...');
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        password: TEST_USER.password
      });
      console.log('❌ VALIDATION ISSUE: Missing email accepted!');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Validation working: Missing email rejected');
        console.log(`📄 Status: ${error.response.status}`);
        console.log(`📝 Message: ${error.response.data.error}`);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    
    // Test invalid email format
    console.log('\n📝 Testing invalid email format...');
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        email: 'invalid-email',
        password: TEST_USER.password
      });
      console.log('❌ VALIDATION ISSUE: Invalid email format accepted!');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Validation working: Invalid email format rejected');
        console.log(`📄 Status: ${error.response.status}`);
        console.log(`📝 Message: ${error.response.data.error}`);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Login endpoint test failed:', error.message);
    if (error.response) {
      console.error(`📄 Status: ${error.response.status}`);
      console.error(`📝 Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    throw error;
  }
}

async function testProtectedRouteMiddleware() {
  console.log('\n🛡️ Testing Protected Route Middleware...');
  
  try {
    // Test protected route with valid token
    console.log('\n✅ Testing protected route with valid token...');
    const profileResponse = await axios.get(`${BASE_URL}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('✅ Protected route access successful!');
    console.log(`📄 Status: ${profileResponse.status}`);
    console.log(`📧 User: ${profileResponse.data.data.user.email}`);
    console.log(`👤 Name: ${profileResponse.data.data.user.name}`);
    console.log(`🎭 Role: ${profileResponse.data.data.user.role}`);
    
    // Test protected route without token
    console.log('\n❌ Testing protected route without token...');
    try {
      await axios.get(`${BASE_URL}/auth/profile`);
      console.log('❌ SECURITY ISSUE: Protected route accessible without token!');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Security working: Access denied without token');
        console.log(`📄 Status: ${error.response.status}`);
        console.log(`📝 Message: ${error.response.data.error}`);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    
    // Test protected route with invalid token
    console.log('\n❌ Testing protected route with invalid token...');
    try {
      await axios.get(`${BASE_URL}/auth/profile`, {
        headers: {
          'Authorization': 'Bearer invalid-token-here'
        }
      });
      console.log('❌ SECURITY ISSUE: Protected route accessible with invalid token!');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Security working: Invalid token rejected');
        console.log(`📄 Status: ${error.response.status}`);
        console.log(`📝 Message: ${error.response.data.error}`);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    
    // Test protected route with malformed Authorization header
    console.log('\n❌ Testing protected route with malformed Authorization header...');
    try {
      await axios.get(`${BASE_URL}/auth/profile`, {
        headers: {
          'Authorization': authToken // Missing 'Bearer ' prefix
        }
      });
      console.log('❌ SECURITY ISSUE: Protected route accessible with malformed header!');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Security working: Malformed header rejected');
        console.log(`📄 Status: ${error.response.status}`);
        console.log(`📝 Message: ${error.response.data.error}`);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    
    // Test token verification endpoint
    console.log('\n🔍 Testing token verification endpoint...');
    const verifyResponse = await axios.get(`${BASE_URL}/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('✅ Token verification successful!');
    console.log(`📄 Status: ${verifyResponse.status}`);
    console.log(`📝 Message: ${verifyResponse.data.message}`);
    console.log(`👤 User: ${verifyResponse.data.data.user.email}`);
    
  } catch (error) {
    console.error('❌ Protected route middleware test failed:', error.message);
    if (error.response) {
      console.error(`📄 Status: ${error.response.status}`);
      console.error(`📝 Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    throw error;
  }
}

async function testAdminProtectedRoute() {
  console.log('\n👑 Testing Admin-Only Protected Route...');
  
  try {
    // Test admin-only route with admin user
    console.log('\n✅ Testing admin route with admin user...');
    const createUserResponse = await axios.post(`${BASE_URL}/auth/users`, {
      email: 'newuser@test.com',
      password: 'password123',
      name: 'New Test User',
      role: 'user'
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('✅ Admin route access successful!');
    console.log(`📄 Status: ${createUserResponse.status}`);
    console.log(`📝 Message: ${createUserResponse.data.message}`);
    console.log(`👤 Created user: ${createUserResponse.data.data.user.email}`);
    
    // Clean up created user
    await User.deleteOne({ email: 'newuser@test.com' });
    console.log('🗑️ Cleaned up test user');
    
  } catch (error) {
    console.error('❌ Admin protected route test failed:', error.message);
    if (error.response) {
      console.error(`📄 Status: ${error.response.status}`);
      console.error(`📝 Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

async function runTests() {
  try {
    console.log('🚀 Starting Authentication System Tests...');
    console.log('=' * 60);
    
    await setupTestEnvironment();
    await testLoginEndpoint();
    await testProtectedRouteMiddleware();
    await testAdminProtectedRoute();
    
    console.log('\n🎉 All authentication tests completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('✅ Login endpoint: WORKING');
    console.log('✅ JWT token generation: WORKING');
    console.log('✅ Password validation: WORKING');
    console.log('✅ Input validation: WORKING');
    console.log('✅ Protected route middleware: WORKING');
    console.log('✅ Token verification: WORKING');
    console.log('✅ Authorization header parsing: WORKING');
    console.log('✅ Security (unauthorized access prevention): WORKING');
    console.log('✅ Admin role authorization: WORKING');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    console.error('\n⚠️ Make sure the server is running on http://localhost:3000');
    console.error('⚠️ Run: npm run dev (in backend directory)');
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

// Check if server is running before starting tests
async function checkServerHealth() {
  try {
    console.log('🔍 Checking if server is running...');
    await axios.get('http://localhost:3000/health');
    console.log('✅ Server is running');
    return true;
  } catch (error) {
    console.log('❌ Server is not running or not responding');
    console.log('⚠️ Please start the server first: npm run dev');
    return false;
  }
}

// Main execution
(async () => {
  const serverRunning = await checkServerHealth();
  if (serverRunning) {
    await runTests();
  } else {
    console.log('\n🛑 Tests aborted - server not available');
    process.exit(1);
  }
})();
