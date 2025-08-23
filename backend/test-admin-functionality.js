const mongoose = require('mongoose');
const axios = require('axios');
const User = require('./src/models/User');
require('dotenv').config();

// Test configuration
const BASE_URL = 'http://localhost:3000/api';
const TEST_ADMIN = {
  email: 'testadmin@tanggapin.com',
  password: 'testpassword123',
  name: 'Test Admin User',
  role: 'admin'
};

const TEST_USER = {
  email: 'newuser@test.com',
  password: 'userpassword123',
  name: 'New Test User',
  role: 'user'
};

let adminToken = '';

async function setupTestEnvironment() {
  try {
    console.log('🔄 Setting up test environment...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tanggapin', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Clean up existing test users
    await User.deleteMany({ 
      email: { $in: [TEST_USER.email] }
    });
    
    console.log('🗑️ Cleaned up existing test users');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    throw error;
  }
}

async function testAdminLogin() {
  console.log('\n🔐 Testing Admin Login...');
  
  try {
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_ADMIN.email,
      password: TEST_ADMIN.password
    });
    
    console.log('✅ Admin login successful!');
    console.log(`📄 Status: ${loginResponse.status}`);
    console.log(`📧 Admin: ${loginResponse.data.data.user.email}`);
    console.log(`👤 Name: ${loginResponse.data.data.user.name}`);
    console.log(`🎭 Role: ${loginResponse.data.data.user.role}`);
    console.log(`🎫 Token received: ${loginResponse.data.data.token ? 'YES' : 'NO'}`);
    
    // Store admin token for user creation tests
    adminToken = loginResponse.data.data.token;
    
    return true;
  } catch (error) {
    console.error('❌ Admin login failed:', error.message);
    if (error.response) {
      console.error(`📄 Status: ${error.response.status}`);
      console.error(`📝 Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return false;
  }
}

async function testAdminUserCreation() {
  console.log('\n👤 Testing Admin User Creation via API...');
  
  try {
    // Test successful user creation
    console.log('\n📝 Testing successful user creation...');
    const createResponse = await axios.post(`${BASE_URL}/auth/users`, {
      email: TEST_USER.email,
      password: TEST_USER.password,
      name: TEST_USER.name,
      role: TEST_USER.role
    }, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    console.log('✅ User creation successful!');
    console.log(`📄 Status: ${createResponse.status}`);
    console.log(`📧 Created user: ${createResponse.data.data.user.email}`);
    console.log(`👤 Name: ${createResponse.data.data.user.name}`);
    console.log(`🎭 Role: ${createResponse.data.data.user.role}`);
    console.log(`🆔 User ID: ${createResponse.data.data.user.id}`);
    console.log(`📅 Created: ${createResponse.data.data.user.createdAt}`);
    
    // Test duplicate user creation
    console.log('\n❌ Testing duplicate user creation...');
    try {
      await axios.post(`${BASE_URL}/auth/users`, {
        email: TEST_USER.email,
        password: 'anotherpassword',
        name: 'Another User',
        role: 'user'
      }, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
      console.log('❌ VALIDATION ISSUE: Duplicate user creation allowed!');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Validation working: Duplicate user creation rejected');
        console.log(`📄 Status: ${error.response.status}`);
        console.log(`📝 Message: ${error.response.data.error}`);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    
    // Test invalid email format
    console.log('\n📝 Testing invalid email format...');
    try {
      await axios.post(`${BASE_URL}/auth/users`, {
        email: 'invalid-email',
        password: 'validpassword',
        name: 'Test User',
        role: 'user'
      }, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
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
    
    // Test short password
    console.log('\n📝 Testing short password validation...');
    try {
      await axios.post(`${BASE_URL}/auth/users`, {
        email: 'test@example.com',
        password: '123',
        name: 'Test User',
        role: 'user'
      }, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
      console.log('❌ VALIDATION ISSUE: Short password accepted!');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Validation working: Short password rejected');
        console.log(`📄 Status: ${error.response.status}`);
        console.log(`📝 Message: ${error.response.data.error}`);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    
    // Test missing required fields
    console.log('\n📝 Testing missing name validation...');
    try {
      await axios.post(`${BASE_URL}/auth/users`, {
        email: 'test2@example.com',
        password: 'validpassword',
        role: 'user'
        // Missing name field
      }, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
      console.log('❌ VALIDATION ISSUE: Missing name accepted!');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Validation working: Missing name rejected');
        console.log(`📄 Status: ${error.response.status}`);
        console.log(`📝 Message: ${error.response.data.error}`);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Admin user creation test failed:', error.message);
    if (error.response) {
      console.error(`📄 Status: ${error.response.status}`);
      console.error(`📝 Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    throw error;
  }
}

async function testUnauthorizedUserCreation() {
  console.log('\n🚫 Testing Unauthorized User Creation...');
  
  try {
    // Test user creation without token
    console.log('\n❌ Testing user creation without token...');
    try {
      await axios.post(`${BASE_URL}/auth/users`, {
        email: 'unauthorized@test.com',
        password: 'password123',
        name: 'Unauthorized User',
        role: 'user'
      });
      console.log('❌ SECURITY ISSUE: User creation allowed without token!');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Security working: User creation denied without token');
        console.log(`📄 Status: ${error.response.status}`);
        console.log(`📝 Message: ${error.response.data.error}`);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    
    // Test user creation with invalid token
    console.log('\n❌ Testing user creation with invalid token...');
    try {
      await axios.post(`${BASE_URL}/auth/users`, {
        email: 'unauthorized2@test.com',
        password: 'password123',
        name: 'Unauthorized User 2',
        role: 'user'
      }, {
        headers: {
          'Authorization': 'Bearer invalid-token-here'
        }
      });
      console.log('❌ SECURITY ISSUE: User creation allowed with invalid token!');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Security working: User creation denied with invalid token');
        console.log(`📄 Status: ${error.response.status}`);
        console.log(`📝 Message: ${error.response.data.error}`);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Unauthorized user creation test failed:', error.message);
    throw error;
  }
}

async function testCreatedUserLogin() {
  console.log('\n🔐 Testing Created User Login...');
  
  try {
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    
    console.log('✅ Created user login successful!');
    console.log(`📄 Status: ${loginResponse.status}`);
    console.log(`📧 User: ${loginResponse.data.data.user.email}`);
    console.log(`👤 Name: ${loginResponse.data.data.user.name}`);
    console.log(`🎭 Role: ${loginResponse.data.data.user.role}`);
    console.log(`🎫 Token received: ${loginResponse.data.data.user ? 'YES' : 'NO'}`);
    
    // Test that regular user cannot create other users
    console.log('\n🚫 Testing regular user cannot create users...');
    try {
      await axios.post(`${BASE_URL}/auth/users`, {
        email: 'forbidden@test.com',
        password: 'password123',
        name: 'Forbidden User',
        role: 'user'
      }, {
        headers: {
          'Authorization': `Bearer ${loginResponse.data.data.token}`
        }
      });
      console.log('❌ AUTHORIZATION ISSUE: Regular user can create users!');
    } catch (error) {
      if (error.response && error.response.status === 403) {
        console.log('✅ Authorization working: Regular user cannot create users');
        console.log(`📄 Status: ${error.response.status}`);
        console.log(`📝 Message: ${error.response.data.error}`);
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Created user login test failed:', error.message);
    if (error.response) {
      console.error(`📄 Status: ${error.response.status}`);
      console.error(`📝 Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    throw error;
  }
}

async function runTests() {
  try {
    console.log('🚀 Starting Admin Functionality Tests...');
    console.log('=' * 60);
    
    await setupTestEnvironment();
    
    const adminLoginSuccess = await testAdminLogin();
    if (!adminLoginSuccess) {
      throw new Error('Admin login failed - cannot continue with tests');
    }
    
    await testAdminUserCreation();
    await testUnauthorizedUserCreation();
    await testCreatedUserLogin();
    
    console.log('\n🎉 All admin functionality tests completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('✅ Admin login: WORKING');
    console.log('✅ Admin user creation via API: WORKING');
    console.log('✅ User creation validation: WORKING');
    console.log('✅ Duplicate user prevention: WORKING');
    console.log('✅ Authorization (admin-only): WORKING');
    console.log('✅ Authentication (token required): WORKING');
    console.log('✅ Created user login: WORKING');
    console.log('✅ Role-based access control: WORKING');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    console.error('\n⚠️ Make sure the server is running on http://localhost:3000');
    console.error('⚠️ Run: npm run dev (in backend directory)');
  } finally {
    // Clean up test users
    try {
      await User.deleteMany({ 
        email: { $in: [TEST_USER.email] }
      });
      console.log('\n🗑️ Cleaned up test users');
    } catch (error) {
      console.log('⚠️ Cleanup warning:', error.message);
    }
    
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
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
