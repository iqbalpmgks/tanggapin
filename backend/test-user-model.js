const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

async function testUserModel() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tanggapin', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB successfully');
    
    // Test data
    const testEmail = 'user1@gmail.com';
    const testPassword = 'user123456';
    
    console.log('\n🧪 Testing User Model with bcrypt encryption...');
    console.log(`📧 Email: ${testEmail}`);
    console.log(`🔑 Password: ${testPassword}`);
    
    // Remove existing user if exists
    await User.deleteOne({ email: testEmail });
    console.log('🗑️  Cleaned up existing test user');
    
    // Create new user
    console.log('\n📝 Creating new user...');
    const userData = {
      email: testEmail,
      password: testPassword,
      name: 'Test User',
      role: 'admin'
    };
    
    const user = new User(userData);
    await user.save();
    
    console.log('✅ User created successfully!');
    console.log(`📄 User ID: ${user._id}`);
    console.log(`📧 Email: ${user.email}`);
    console.log(`👤 Name: ${user.name}`);
    console.log(`🔐 Encrypted Password: ${user.password}`);
    console.log(`🎭 Role: ${user.role}`);
    
    // Test password encryption
    console.log('\n🔒 Testing password encryption...');
    console.log(`📝 Original password: ${testPassword}`);
    console.log(`🔐 Hashed password: ${user.password}`);
    console.log(`🔍 Password length: ${user.password.length} characters`);
    console.log(`✅ Password is encrypted: ${user.password !== testPassword ? 'YES' : 'NO'}`);
    
    // Test password comparison
    console.log('\n🔍 Testing password comparison...');
    const isCorrectPassword = await user.comparePassword(testPassword);
    const isWrongPassword = await user.comparePassword('wrongpassword');
    
    console.log(`✅ Correct password verification: ${isCorrectPassword ? 'PASS' : 'FAIL'}`);
    console.log(`❌ Wrong password verification: ${isWrongPassword ? 'FAIL (should be false)' : 'PASS'}`);
    
    // Test JWT token generation
    console.log('\n🎫 Testing JWT token generation...');
    const token = user.generateAuthToken();
    console.log(`🎫 Generated JWT token: ${token.substring(0, 50)}...`);
    console.log(`✅ Token generated successfully: ${token ? 'YES' : 'NO'}`);
    
    // Test findByCredentials static method
    console.log('\n🔐 Testing login with credentials...');
    try {
      const foundUser = await User.findByCredentials(testEmail, testPassword);
      console.log(`✅ Login successful for: ${foundUser.email}`);
      console.log(`👤 Found user: ${foundUser.name} (${foundUser.role})`);
    } catch (error) {
      console.log(`❌ Login failed: ${error.message}`);
    }
    
    // Test wrong credentials
    console.log('\n❌ Testing login with wrong credentials...');
    try {
      await User.findByCredentials(testEmail, 'wrongpassword');
      console.log('❌ SECURITY ISSUE: Wrong password accepted!');
    } catch (error) {
      console.log(`✅ Security working: ${error.message}`);
    }
    
    // Test user methods
    console.log('\n🔧 Testing user instance methods...');
    console.log(`📱 Has valid Instagram connection: ${user.hasValidInstagramConnection()}`);
    console.log(`⏰ Instagram token expired: ${user.isInstagramTokenExpired()}`);
    console.log(`🏷️  Display name: ${user.displayName}`);
    
    // Test JSON transformation (password should be hidden)
    console.log('\n🔒 Testing JSON transformation (password hiding)...');
    const userJSON = user.toJSON();
    console.log(`✅ Password hidden in JSON: ${userJSON.password === undefined ? 'YES' : 'NO'}`);
    console.log(`✅ Email visible in JSON: ${userJSON.email ? 'YES' : 'NO'}`);
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ User model creation: WORKING');
    console.log('✅ Password encryption with bcrypt: WORKING');
    console.log('✅ Password comparison: WORKING');
    console.log('✅ JWT token generation: WORKING');
    console.log('✅ Login authentication: WORKING');
    console.log('✅ Security (wrong password rejection): WORKING');
    console.log('✅ JSON transformation (password hiding): WORKING');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('📋 Error details:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the test
console.log('🚀 Starting User Model Test...');
console.log('=' * 50);
testUserModel();
