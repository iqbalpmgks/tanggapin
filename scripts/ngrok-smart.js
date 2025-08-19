#!/usr/bin/env node

/**
 * Smart Ngrok Script for Tanggapin
 * 
 * This script automatically detects the backend server port and starts ngrok tunnel.
 * It handles cases where the default port (3000) is busy and the server runs on a different port.
 */

const { spawn, exec } = require('child_process')
const fs = require('fs')
const path = require('path')
const net = require('net')

// Load environment variables from backend/.env
const envPath = path.join(__dirname, '..', 'backend', '.env')
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath })
}

// Configuration
const CONFIG = {
  defaultPort: 3000,
  maxPortScan: 3010, // Scan up to port 3010
  authToken: process.env.NGROK_AUTH_TOKEN,
  subdomain: process.env.NGROK_SUBDOMAIN || null,
  region: process.env.NGROK_REGION || 'us',
  logLevel: process.env.NGROK_LOG_LEVEL || 'info'
}

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

/**
 * Print colored console messages
 */
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  header: (msg) => console.log(`${colors.cyan}${colors.bright}${msg}${colors.reset}`)
}

/**
 * Check if a port is in use
 */
function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer()
    
    server.listen(port, (err) => {
      if (err) {
        resolve(true) // Port is in use
      } else {
        server.once('close', () => {
          resolve(false) // Port is free
        })
        server.close()
      }
    })
    
    server.on('error', () => {
      resolve(true) // Port is in use
    })
  })
}

/**
 * Find which port the backend server is running on
 */
async function findBackendPort() {
  log.info('Scanning for backend server...')
  
  // First check the default port
  const defaultPortInUse = await isPortInUse(CONFIG.defaultPort)
  if (defaultPortInUse) {
    log.success(`Found server running on default port ${CONFIG.defaultPort}`)
    return CONFIG.defaultPort
  }
  
  // Scan for alternative ports
  for (let port = CONFIG.defaultPort + 1; port <= CONFIG.maxPortScan; port++) {
    const portInUse = await isPortInUse(port)
    if (portInUse) {
      // Verify it's actually our backend server by checking health endpoint
      const isBackendServer = await checkBackendHealth(port)
      if (isBackendServer) {
        log.success(`Found backend server running on port ${port}`)
        return port
      }
    }
  }
  
  return null
}

/**
 * Check if the server on given port is our backend server
 */
function checkBackendHealth(port) {
  return new Promise((resolve) => {
    const http = require('http')
    
    const req = http.get(`http://localhost:${port}/health`, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        try {
          const response = JSON.parse(data)
          // Check if it's our Tanggapin backend
          resolve(response.status === 'OK' || response.message === 'Tanggapin API Server')
        } catch (error) {
          resolve(false)
        }
      })
    })
    
    req.on('error', () => {
      resolve(false)
    })
    
    req.setTimeout(2000, () => {
      req.destroy()
      resolve(false)
    })
  })
}

/**
 * Check if ngrok is installed
 */
function checkNgrokInstallation() {
  return new Promise((resolve) => {
    exec('ngrok version', (error) => {
      resolve(!error)
    })
  })
}

/**
 * Install ngrok if not present
 */
function installNgrok() {
  return new Promise((resolve, reject) => {
    log.info('Installing ngrok...')
    
    const npm = spawn('npm', ['install', '-g', 'ngrok'], { 
      stdio: 'inherit',
      shell: true 
    })
    
    npm.on('close', (code) => {
      if (code === 0) {
        log.success('Ngrok installed successfully')
        resolve()
      } else {
        reject(new Error('Failed to install ngrok'))
      }
    })
    
    npm.on('error', (error) => {
      reject(error)
    })
  })
}

/**
 * Setup ngrok auth token
 */
function setupAuthToken() {
  return new Promise((resolve) => {
    if (!CONFIG.authToken) {
      log.warning('No NGROK_AUTH_TOKEN found in backend/.env')
      log.info('Get your token from: https://dashboard.ngrok.com/get-started/your-authtoken')
      log.info('Add it to backend/.env: NGROK_AUTH_TOKEN=your_token_here')
      resolve(false)
      return
    }
    
    log.info('Configuring ngrok auth token...')
    
    exec(`ngrok config add-authtoken ${CONFIG.authToken}`, (error) => {
      if (error) {
        log.error('Failed to configure auth token')
        resolve(false)
      } else {
        log.success('Auth token configured successfully')
        resolve(true)
      }
    })
  })
}

/**
 * Start ngrok tunnel
 */
function startTunnel(port) {
  return new Promise((resolve, reject) => {
    log.info(`Starting ngrok tunnel for port ${port}...`)
    
    // Build ngrok command
    const args = ['http', port.toString()]
    
    // Only add subdomain if it's not empty and warn about free plan
    if (CONFIG.subdomain && CONFIG.subdomain.trim() !== '') {
      log.warning('Custom subdomain detected - this requires a paid ngrok plan')
      log.info('If you have a free plan, remove NGROK_SUBDOMAIN from .env')
      args.push('--subdomain', CONFIG.subdomain)
    } else {
      log.info('Using random ngrok URL (suitable for free plan)')
    }
    
    if (CONFIG.region) {
      args.push('--region', CONFIG.region)
    }
    
    args.push('--log', CONFIG.logLevel)
    
    log.info(`Running: ngrok ${args.join(' ')}`)
    
    const ngrok = spawn('ngrok', args, {
      stdio: 'inherit',
      shell: true
    })
    
    ngrok.on('close', (code) => {
      if (code === 0) {
        log.success('Ngrok tunnel closed')
      } else {
        log.error(`Ngrok exited with code ${code}`)
        
        // Provide helpful error messages for common issues
        if (code === 1) {
          log.info('\n🔧 Common solutions:')
          log.info('• Check your auth token in backend/.env')
          log.info('• Remove NGROK_SUBDOMAIN if using free plan')
          log.info('• Ensure backend server is running')
          log.info('• Try: npm run ngrok:simple')
        }
      }
      resolve()
    })
    
    ngrok.on('error', (error) => {
      log.error(`Error starting ngrok: ${error.message}`)
      reject(error)
    })
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      log.info('Shutting down ngrok tunnel...')
      ngrok.kill('SIGINT')
    })
    
    process.on('SIGTERM', () => {
      log.info('Shutting down ngrok tunnel...')
      ngrok.kill('SIGTERM')
    })
  })
}

/**
 * Display helpful information
 */
function displayInfo(port) {
  log.header('\n🚀 Smart Ngrok Tunnel for Tanggapin')
  log.info(`Detected backend server on port ${port}`)
  log.info('Creating secure tunnel for webhook testing...')
  
  if (CONFIG.subdomain) {
    log.info(`Using custom subdomain: ${CONFIG.subdomain}`)
  }
  
  log.info('\n📝 Next steps after tunnel starts:')
  log.info('1. Copy the HTTPS URL from ngrok output')
  log.info('2. Update WEBHOOK_BASE_URL in backend/.env')
  log.info('3. Configure Instagram webhook in Meta Developer Console')
  log.info('4. Access ngrok web interface at http://localhost:4040')
  
  log.info('\n🔗 Useful endpoints:')
  log.info(`• Health check: https://your-url.ngrok.io/health`)
  log.info(`• API status: https://your-url.ngrok.io/api`)
  log.info(`• Webhook: https://your-url.ngrok.io/api/webhook/instagram`)
  console.log('')
}

/**
 * Show usage instructions
 */
function showUsage() {
  log.header('\n📖 Usage Instructions')
  log.info('This script automatically detects your backend server port and starts ngrok.')
  log.info('')
  log.info('Available commands:')
  log.info('• npm run ngrok           - Smart detection and tunnel')
  log.info('• npm run ngrok:simple    - Basic tunnel on port 3000')
  log.info('• npm run ngrok:backend   - Use backend workspace ngrok')
  log.info('')
  log.info('Environment variables (in backend/.env):')
  log.info('• NGROK_AUTH_TOKEN        - Your ngrok auth token (required)')
  log.info('• NGROK_SUBDOMAIN         - Custom subdomain (optional)')
  log.info('• NGROK_REGION            - Server region (default: us)')
  log.info('')
  log.info('Make sure your backend server is running before starting ngrok!')
  console.log('')
}

/**
 * Main execution function
 */
async function main() {
  try {
    // Check command line arguments
    const args = process.argv.slice(2)
    if (args.includes('--help') || args.includes('-h')) {
      showUsage()
      return
    }
    
    // Check if ngrok is installed
    const isInstalled = await checkNgrokInstallation()
    
    if (!isInstalled) {
      log.warning('Ngrok is not installed')
      await installNgrok()
    }
    
    // Setup auth token
    const tokenConfigured = await setupAuthToken()
    
    if (!tokenConfigured) {
      log.error('Cannot start tunnel without auth token')
      log.info('Run with --help for setup instructions')
      process.exit(1)
    }
    
    // Find backend server port
    const backendPort = await findBackendPort()
    
    if (!backendPort) {
      log.error('Backend server not found!')
      log.info('Please make sure your backend server is running.')
      log.info('Try: npm run dev:backend')
      log.info('')
      log.info('If your server is running on a custom port, you can specify it:')
      log.info('ngrok http YOUR_PORT')
      process.exit(1)
    }
    
    // Display info and start tunnel
    displayInfo(backendPort)
    await startTunnel(backendPort)
    
  } catch (error) {
    log.error(`Setup failed: ${error.message}`)
    process.exit(1)
  }
}

// Handle specific port argument
if (process.argv.length > 2 && !isNaN(process.argv[2])) {
  const customPort = parseInt(process.argv[2])
  log.info(`Using custom port: ${customPort}`)
  CONFIG.defaultPort = customPort
  CONFIG.maxPortScan = customPort
}

// Run the script
if (require.main === module) {
  main()
}

module.exports = {
  findBackendPort,
  checkBackendHealth,
  startTunnel,
  CONFIG
}
