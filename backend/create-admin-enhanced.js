require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');
const User = require('./src/models/User');
const logger = require('./src/config/logger');

/**
 * Enhanced Admin User Creation Script for Tanggapin
 * Provides interactive and command-line options for creating admin users
 */

// Command line interface for input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Utility function to ask questions
const askQuestion = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
};

// Utility function to validate email
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Utility function to validate password
const isValidPassword = (password) => {
  return password.length >= 6;
};

// Default admin data
const defaultAdminData = {
  email: 'admin@tanggapin.com',
  password: 'admin123456',
  name: 'Admin Tanggapin',
  role: 'admin'
};

/**
 * Interactive admin creation
 */
async function createAdminInteractive() {
  console.log('🔧 Interactive Admin User Creation\n');
  
  try {
    // Get admin details from user input
    let email = await askQuestion(`📧 Enter admin email (default: ${defaultAdminData.email}): `);
    if (!email) email = defaultAdminData.email;
    
    while (!isValidEmail(email)) {
      console.log('❌ Invalid email format. Please try again.');
      email = await askQuestion('📧 Enter admin email: ');
    }
    
    let password = await askQuestion(`🔒 Enter admin password (default: ${defaultAdminData.password}): `);
    if (!password) password = defaultAdminData.password;
    
    while (!isValidPassword(password)) {
      console.log('❌ Password must be at least 6 characters. Please try again.');
      password = await askQuestion('🔒 Enter admin password: ');
    }
    
    let name = await askQuestion(`👤 Enter admin name (default: ${defaultAdminData.name}): `);
    if (!name) name = defaultAdminData.name;
    
    const adminData = {
      email: email.toLowerCase(),
      password,
      name,
      role: 'admin',
      isActive: true
    };
    
    return adminData;
  } catch (error) {
    throw new Error(`Interactive input failed: ${error.message}`);
  }
}

/**
 * Create admin user from command line arguments
 */
function createAdminFromArgs() {
  const args = process.argv.slice(2);
  const adminData = { ...defaultAdminData };
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];
    
    switch (key) {
      case '--email':
      case '-e':
        adminData.email = value;
        break;
      case '--password':
      case '-p':
        adminData.password = value;
        break;
      case '--name':
      case '-n':
        adminData.name = value;
        break;
    }
  }
  
  // Validate inputs
  if (!isValidEmail(adminData.email)) {
    throw new Error('Invalid email format');
  }
  
  if (!isValidPassword(adminData.password)) {
    throw new Error('Password must be at least 6 characters');
  }
  
  adminData.email = adminData.email.toLowerCase();
  adminData.isActive = true;
  
  return adminData;
}

/**
 * Main admin creation function
 */
async function createAdminUser() {
  try {
    console.log('🚀 Enhanced Admin User Creation for Tanggapin\n');
    console.log('=' * 50);

    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tanggapin', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    // Determine creation mode
    const hasArgs = process.argv.length > 2;
    let adminData;
    
    if (hasArgs && !process.argv.includes('--interactive')) {
      console.log('🔧 Using command line arguments...\n');
      adminData = createAdminFromArgs();
    } else {
      adminData = await createAdminInteractive();
    }
    
    console.log('\n📋 Admin User Data:');
    console.log(`   📧 Email: ${adminData.email}`);
    console.log(`   👤 Name: ${adminData.name}`);
    console.log(`   🔑 Role: ${adminData.role}`);
    console.log(`   🔒 Password: ${'*'.repeat(adminData.password.length)}`);

    // Check if admin user already exists
    console.log('\n🔍 Checking if admin user already exists...');
    const existingAdmin = await User.findOne({ email: adminData.email });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log('📧 Email:', existingAdmin.email);
      console.log('👤 Name:', existingAdmin.name);
      console.log('🔑 Role:', existingAdmin.role);
      console.log('📅 Created:', existingAdmin.createdAt);
      
      const overwrite = await askQuestion('\n❓ Do you want to update the existing admin? (y/N): ');
      
      if (overwrite.toLowerCase() === 'y' || overwrite.toLowerCase() === 'yes') {
        // Update existing admin
        existingAdmin.password = adminData.password;
        existingAdmin.name = adminData.name;
        existingAdmin.isActive = true;
        await existingAdmin.save();
        
        console.log('\n✅ Admin user updated successfully!');
        console.log('📋 Updated Admin Details:');
        console.log('   📧 Email:', existingAdmin.email);
        console.log('   👤 Name:', existingAdmin.name);
        console.log('   🔑 Role:', existingAdmin.role);
        console.log('   📅 Updated:', new Date().toISOString());
      } else {
        console.log('\n❌ Admin creation cancelled.');
        return;
      }
    } else {
      // Create new admin user
      console.log('\n👤 Creating new admin user...');
      const adminUser = new User(adminData);
      await adminUser.save();

      console.log('✅ Admin user created successfully!\n');
      console.log('📋 New Admin Details:');
      console.log('   📧 Email:', adminUser.email);
      console.log('   👤 Name:', adminUser.name);
      console.log('   🔑 Role:', adminUser.role);
      console.log('   🆔 ID:', adminUser._id);
      console.log('   📅 Created:', adminUser.createdAt);
      console.log('   ✅ Active:', adminUser.isActive);
    }

    console.log('\n🎉 Success! You can now login with these credentials:');
    console.log(`   📧 Email: ${adminData.email}`);
    console.log(`   🔒 Password: ${adminData.password}`);

    console.log('\n🔧 Next Steps:');
    console.log('   1. Start the backend server: npm run dev');
    console.log('   2. Test login with the admin credentials');
    console.log('   3. Use the admin account to create additional users');
    console.log('   4. Change the admin password after first login');
    
    console.log('\n📚 Usage Examples:');
    console.log('   Interactive mode: node create-admin-enhanced.js');
    console.log('   Command line: node create-admin-enhanced.js -e admin@example.com -p mypassword -n "My Admin"');
    console.log('   Force interactive: node create-admin-enhanced.js --interactive');

  } catch (error) {
    console.error('\n❌ Error creating admin user:', error.message);
    
    if (error.code === 11000) {
      console.error('   Duplicate key error - user with this email already exists');
    } else if (error.name === 'ValidationError') {
      console.error('   Validation error:', error.message);
    } else {
      console.error('   Full error:', error);
    }
  } finally {
    // Close readline interface
    rl.close();
    
    // Close database connection
    await mongoose.disconnect();
    console.log('\n📡 Disconnected from MongoDB');
    process.exit(0);
  }
}

/**
 * Display help information
 */
function showHelp() {
  console.log('🔧 Enhanced Admin User Creation for Tanggapin\n');
  console.log('Usage:');
  console.log('  node create-admin-enhanced.js [options]\n');
  console.log('Options:');
  console.log('  -e, --email <email>       Admin email address');
  console.log('  -p, --password <password> Admin password (min 6 characters)');
  console.log('  -n, --name <name>         Admin full name');
  console.log('  --interactive             Force interactive mode');
  console.log('  -h, --help                Show this help message\n');
  console.log('Examples:');
  console.log('  node create-admin-enhanced.js');
  console.log('  node create-admin-enhanced.js -e admin@example.com -p mypassword');
  console.log('  node create-admin-enhanced.js --email admin@test.com --name "Test Admin"');
  console.log('  node create-admin-enhanced.js --interactive\n');
}

// Handle script termination
process.on('SIGINT', async () => {
  console.log('\n⚠️  Script interrupted');
  rl.close();
  await mongoose.disconnect();
  process.exit(0);
});

// Check for help flag
if (process.argv.includes('-h') || process.argv.includes('--help')) {
  showHelp();
  process.exit(0);
}

// Run the script
createAdminUser();
