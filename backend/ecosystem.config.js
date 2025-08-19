module.exports = {
  apps: [
    {
      // Application configuration
      name: 'tanggapin-backend',
      script: 'src/server.js',
      
      // Environment configuration
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      
      // Process management
      instances: 1, // Single instance for development
      exec_mode: 'fork', // Use fork mode for single instance
      
      // Auto-restart configuration
      watch: false, // Disable watch in production
      ignore_watch: [
        'node_modules',
        'logs',
        'uploads',
        'tests',
        'coverage'
      ],
      
      // Memory and CPU limits
      max_memory_restart: '500M',
      
      // Logging configuration
      log_file: 'logs/combined.log',
      out_file: 'logs/out.log',
      error_file: 'logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Advanced options
      kill_timeout: 5000,
      listen_timeout: 3000,
      
      // Auto-restart on file changes (development only)
      watch_options: {
        followSymlinks: false,
        usePolling: false
      },
      
      // Environment variables
      env_file: '.env',
      
      // Graceful shutdown
      shutdown_with_message: true,
      
      // Health monitoring
      min_uptime: '10s',
      max_restarts: 10,
      
      // Source map support
      source_map_support: true,
      
      // Node.js options
      node_args: '--max-old-space-size=512'
    }
  ],
  
  // Deployment configuration
  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:tanggapin/tanggapin-backend.git',
      path: '/var/www/tanggapin-backend',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'apt update && apt install git -y'
    },
    
    staging: {
      user: 'deploy',
      host: 'staging-server.com',
      ref: 'origin/develop',
      repo: 'git@github.com:tanggapin/tanggapin-backend.git',
      path: '/var/www/tanggapin-backend-staging',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env staging'
    }
  }
}
