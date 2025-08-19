require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const logger = require('./src/config/logger');

/**
 * Script to create an admin user in MongoDB
 * This script will create the first admin user for the Tanggapin application
 */

async function createAdminUser() {
  try {
    console.log('🔧 Creating Admin User for Tanggapin...\n');

    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    // Admin user details
    const adminData = {
      email: 'admin@tanggapin.com',
      password: 'admin123456',
      name: 'Admin Tanggapin',
      role: 'admin',
      isActive: true
    };

    // Check if admin user already exists
    console.log('🔍 Checking if admin user already exists...');
    const existingAdmin = await User.findOne({ email: adminData.email });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log('📧 Email:', existingAdmin.email);
      console.log('👤 Name:', existingAdmin.name);
      console.log('🔑 Role:', existingAdmin.role);
      console.log('📅 Created:', existingAdmin.createdAt);
      console.log('\n✨ You can use these credentials to login:');
      console.log('   Email: admin@tanggapin.com');
      console.log('   Password: admin123456');
      return;
    }

    // Create admin user
    console.log('👤 Creating admin user...');
    const adminUser = new User(adminData);
    await adminUser.save();

    console.log('✅ Admin user created successfully!\n');
    console.log('📋 Admin User Details:');
    console.log('   📧 Email:', adminUser.email);
    console.log('   👤 Name:', adminUser.name);
    console.log('   🔑 Role:', adminUser.role);
    console.log('   🆔 ID:', adminUser._id);
    console.log('   📅 Created:', adminUser.createdAt);
    console.log('   ✅ Active:', adminUser.isActive);

    console.log('\n🎉 Success! You can now login with these credentials:');
    console.log('   📧 Email: admin@tanggapin.com');
    console.log('   🔒 Password: admin123456');

    console.log('\n🔧 Next Steps:');
    console.log('   1. Start the backend server: npm run dev');
    console.log('   2. Test login with the admin credentials');
    console.log('   3. Use the admin account to create additional users');
    console.log('   4. Change the admin password after first login');

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    
    if (error.code === 11000) {
      console.error('   Duplicate key error - user with this email already exists');
    } else if (error.name === 'ValidationError') {
      console.error('   Validation error:', error.message);
    } else {
      console.error('   Full error:', error);
    }
  } finally {
    // Close database connection
    await mongoose.disconnect();
    console.log('\n📡 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Handle script termination
process.on('SIGINT', async () => {
  console.log('\n⚠️  Script interrupted');
  await mongoose.disconnect();
  process.exit(0);
});

// Run the script
createAdminUser();
