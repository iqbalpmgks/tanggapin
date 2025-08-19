#!/usr/bin/env node

/**
 * Ngrok Setup Script for Tanggapin Backend
 * 
 * This script helps developers set up Ngrok tunneling for webhook testing
 * with Instagram API integration.
 */

const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')
require('dotenv').config()

// Configuration
const CONFIG = {
  port: process.env.PORT || 3000,
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
 * Check if ngrok is installed
 */
function checkNgrokInstallation() {
  return new Promise((resolve) => {
    const ngrok = spawn('ngrok', ['version'], { stdio: 'pipe' })
    
    ngrok.on('close', (code) => {
      resolve(code === 0)
    })
    
    ngrok.on('error', () => {
      resolve(false)
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
 * Set up ngrok auth token
 */
function setupAuthToken() {
  return new Promise((resolve, reject) => {
    if (!CONFIG.authToken) {
      log.warning('No NGROK_AUTH_TOKEN found in environment variables')
      log.info('Please get your auth token from: https://dashboard.ngrok.com/get-started/your-authtoken')
      log.info('Then add it to your .env file: NGROK_AUTH_TOKEN=your_token_here')
      resolve(false)
      return
    }
    
    log.info('Setting up ngrok auth token...')
    
    const ngrok = spawn('ngrok', ['config', 'add-authtoken', CONFIG.authToken], {
      stdio: 'pipe',
      shell: true
    })
    
    ngrok.on('close', (code) => {
      if (code === 0) {
        log.success('Auth token configured successfully')
        resolve(true)
      } else {
        log.error('Failed to configure auth token')
        resolve(false)
      }
    })
    
    ngrok.on('error', (error) => {
      log.error(`Error setting up auth token: ${error.message}`)
      resolve(false)
    })
  })
}

/**
 * Start ngrok tunnel
 */
function startTunnel() {
  return new Promise((resolve, reject) => {
    log.info(`Starting ngrok tunnel for port ${CONFIG.port}...`)
    
    // Build ngrok command
    const args = ['http', CONFIG.port.toString()]
    
    if (CONFIG.subdomain) {
      args.push('--subdomain', CONFIG.subdomain)
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
function displayInfo() {
  log.header('\n🚀 Ngrok Tunnel Setup for Tanggapin')
  log.info('This will create a public tunnel to your local backend server')
  log.info(`Local server should be running on port ${CONFIG.port}`)
  log.info('The tunnel URL will be displayed once ngrok starts')
  
  if (CONFIG.subdomain) {
    log.info(`Using custom subdomain: ${CONFIG.subdomain}`)
  }
  
  log.info('\n📝 Next steps:')
  log.info('1. Make sure your backend server is running on port ' + CONFIG.port)
  log.info('2. Copy the ngrok URL and update your Instagram webhook settings')
  log.info('3. Update WEBHOOK_BASE_URL in your .env file with the ngrok URL')
  log.info('\n🔗 Useful links:')
  log.info('• Ngrok dashboard: https://dashboard.ngrok.com/')
  log.info('• Instagram webhook setup: https://developers.facebook.com/docs/instagram-basic-display-api/webhooks')
  log.info('• Meta Developer Console: https://developers.facebook.com/apps/')
  console.log('')
}

/**
 * Main execution function
 */
async function main() {
  try {
    displayInfo()
    
    // Check if ngrok is installed
    const isInstalled = await checkNgrokInstallation()
    
    if (!isInstalled) {
      log.warning('Ngrok is not installed')
      await installNgrok()
    } else {
      log.success('Ngrok is already installed')
    }
    
    // Setup auth token
    const tokenConfigured = await setupAuthToken()
    
    if (!tokenConfigured) {
      log.error('Cannot start tunnel without auth token')
      process.exit(1)
    }
    
    // Start the tunnel
    await startTunnel()
    
  } catch (error) {
    log.error(`Setup failed: ${error.message}`)
    process.exit(1)
  }
}

// Run the script
if (require.main === module) {
  main()
}

module.exports = {
  checkNgrokInstallation,
  installNgrok,
  setupAuthToken,
  startTunnel,
  CONFIG
}
