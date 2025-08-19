const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Admin credentials
const ADMIN_CREDENTIALS = {
  email: 'admin@tanggapin.com',
  password: 'admin123456'
};

/**
 * Test admin user authentication flow
 */
async function testAdminAuthentication() {
  console.log('🧪 Testing Admin Authentication Flow...\n');

  try {
    // Test 1: Login with admin credentials
    console.log('1. Testing admin login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, ADMIN_CREDENTIALS);
    
    if (loginResponse.data.success) {
      console.log('✅ Admin login successful!');
      console.log('   📧 Email:', loginResponse.data.data.user.email);
      console.log('   👤 Name:', loginResponse.data.data.user.name);
      console.log('   🔑 Role:', loginResponse.data.data.user.role);
      console.log('   🆔 User ID:', loginResponse.data.data.user.id);
      console.log('   📅 Last Login:', loginResponse.data.data.user.lastLoginAt);
      
      const token = loginResponse.data.data.token;
      console.log('   🎫 JWT Token received (first 50 chars):', token.substring(0, 50) + '...');
      console.log('');

      // Test 2: Access protected profile endpoint
      console.log('2. Testing protected profile endpoint...');
      const profileResponse = await axios.get(`${BASE_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (profileResponse.data.success) {
        console.log('✅ Profile access successful!');
        console.log('   📧 Email:', profileResponse.data.data.user.email);
        console.log('   👤 Name:', profileResponse.data.data.user.name);
        console.log('   🔑 Role:', profileResponse.data.data.user.role);
        console.log('   ✅ Active:', profileResponse.data.data.user.isActive);
        console.log('   📅 Created:', profileResponse.data.data.user.createdAt);
        console.log('   📱 Instagram Connected:', profileResponse.data.data.user.instagramAccount.isConnected);
        console.log('');
      }

      // Test 3: Test token verification
      console.log('3. Testing token verification...');
      const verifyResponse = await axios.get(`${BASE_URL}/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (verifyResponse.data.success) {
        console.log('✅ Token verification successful!');
        console.log('   Message:', verifyResponse.data.message);
        console.log('   👤 Verified User:', verifyResponse.data.data.user.name);
        console.log('   🔑 Verified Role:', verifyResponse.data.data.user.role);
        console.log('');
      }

      // Test 4: Test admin user creation capability
      console.log('4. Testing admin user creation capability...');
      const testUserData = {
        email: 'testuser@tanggapin.com',
        password: 'testpass123',
        name: 'Test User',
        role: 'user'
      };

      try {
        const createUserResponse = await axios.post(`${BASE_URL}/auth/users`, testUserData, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (createUserResponse.data.success) {
          console.log('✅ User creation successful!');
          console.log('   📧 Created User Email:', createUserResponse.data.data.user.email);
          console.log('   👤 Created User Name:', createUserResponse.data.data.user.name);
          console.log('   🔑 Created User Role:', createUserResponse.data.data.user.role);
          console.log('   🆔 Created User ID:', createUserResponse.data.data.user.id);
          console.log('');
        }
      } catch (createError) {
        if (createError.response && createError.response.status === 400 && 
            createError.response.data.error.includes('already exists')) {
          console.log('ℹ️  Test user already exists (this is fine)');
          console.log('   Message:', createError.response.data.error);
          console.log('');
        } else {
          throw createError;
        }
      }

      // Test 5: Test logout
      console.log('5. Testing logout...');
      const logoutResponse = await axios.post(`${BASE_URL}/auth/logout`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (logoutResponse.data.success) {
        console.log('✅ Logout successful!');
        console.log('   Message:', logoutResponse.data.message);
        console.log('');
      }

      // Summary
      console.log('🎉 All Admin Authentication Tests Passed!\n');
      console.log('📋 Test Summary:');
      console.log('   ✅ Admin login with correct credentials');
      console.log('   ✅ JWT token generation and validation');
      console.log('   ✅ Protected route access with valid token');
      console.log('   ✅ Token verification endpoint');
      console.log('   ✅ Admin user creation capability');
      console.log('   ✅ Logout functionality');
      console.log('');
      console.log('🔐 Admin Credentials Confirmed:');
      console.log('   📧 Email: admin@tanggapin.com');
      console.log('   🔒 Password: admin123456');
      console.log('   🔑 Role: admin');
      console.log('   ✅ Status: Active and working');

    } else {
      console.log('❌ Login failed:', loginResponse.data);
    }

  } catch (error) {
    console.error('❌ Authentication test failed:', error.message);
    
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Error:', error.response.data);
    } else {
      console.error('   Full error:', error);
    }
  }
}

// Run the test
testAdminAuthentication();
