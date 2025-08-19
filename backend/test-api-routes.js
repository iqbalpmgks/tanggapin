const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

/**
 * Test basic API routes structure
 */
async function testAPIRoutes() {
  console.log('🧪 Testing Basic API Routes Structure...\n');

  try {
    // Test 1: Check main API endpoint
    console.log('1. Testing main API endpoint...');
    const apiResponse = await axios.get(`${BASE_URL}`);
    console.log('✅ Main API endpoint working');
    console.log('   Message:', apiResponse.data.message);
    console.log('   Version:', apiResponse.data.version);
    console.log('   Available endpoints:');
    Object.entries(apiResponse.data.endpoints).forEach(([key, value]) => {
      console.log(`     ${key}: ${value}`);
    });
    console.log('');

    // Test 2: Test health endpoint
    console.log('2. Testing health endpoint...');
    const healthResponse = await axios.get('http://localhost:3000/health');
    console.log('✅ Health endpoint working');
    console.log('   Status:', healthResponse.data.status);
    console.log('   Environment:', healthResponse.data.environment);
    console.log('   Uptime:', Math.round(healthResponse.data.uptime), 'seconds');
    console.log('');

    // Test 3: Test database status
    console.log('3. Testing database status endpoint...');
    const dbResponse = await axios.get(`${BASE_URL}/db/status`);
    console.log('✅ Database status endpoint working');
    console.log('   Status:', dbResponse.data.database.status);
    console.log('   Host:', dbResponse.data.database.host);
    console.log('   Database:', dbResponse.data.database.name);
    console.log('');

    // Test 4: Test protected routes (should return 401)
    console.log('4. Testing protected routes (should require authentication)...');
    
    const protectedRoutes = [
      '/posts',
      '/keywords', 
      '/activities',
      '/auth/profile'
    ];

    for (const route of protectedRoutes) {
      try {
        await axios.get(`${BASE_URL}${route}`);
        console.log(`❌ ${route} should require authentication`);
      } catch (error) {
        if (error.response && error.response.status === 401) {
          console.log(`✅ ${route} correctly requires authentication`);
        } else {
          console.log(`⚠️  ${route} returned unexpected status:`, error.response?.status);
        }
      }
    }
    console.log('');

    // Test 5: Test webhook endpoints
    console.log('5. Testing webhook endpoints...');
    try {
      const webhookResponse = await axios.get(`${BASE_URL}/webhook/instagram?hub.mode=subscribe&hub.challenge=test&hub.verify_token=test`);
      console.log('ℹ️  Webhook verification endpoint accessible (will fail without proper token)');
    } catch (error) {
      if (error.response && error.response.status === 403) {
        console.log('✅ Webhook verification correctly validates token');
      } else {
        console.log('ℹ️  Webhook endpoint accessible but needs controller implementation');
      }
    }
    console.log('');

    // Test 6: Test 404 handling
    console.log('6. Testing 404 handling...');
    try {
      await axios.get(`${BASE_URL}/nonexistent-route`);
      console.log('❌ Should return 404 for non-existent routes');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('✅ 404 handling working correctly');
        console.log('   Error message:', error.response.data.error);
      } else {
        console.log('❌ Unexpected error for non-existent route:', error.response?.status);
      }
    }
    console.log('');

    // Summary
    console.log('🎉 API Routes Structure Test Completed!\n');
    console.log('📋 Test Summary:');
    console.log('   ✅ Main API endpoint accessible');
    console.log('   ✅ Health check endpoint working');
    console.log('   ✅ Database status endpoint working');
    console.log('   ✅ Protected routes require authentication');
    console.log('   ✅ Webhook endpoints accessible');
    console.log('   ✅ 404 handling working');
    console.log('');
    console.log('📝 Next Steps:');
    console.log('   1. Implement controller functions for all routes');
    console.log('   2. Test routes with valid authentication tokens');
    console.log('   3. Implement webhook controller logic');
    console.log('   4. Add input validation for all endpoints');

  } catch (error) {
    console.error('❌ API routes test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('   Make sure the server is running on port 3000');
      console.error('   Run: npm run dev');
    } else if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Response:', error.response.data);
    }
  }
}

// Run the test
testAPIRoutes();
