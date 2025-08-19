import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    // Test environment configuration
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    
    // Global test configuration
    globals: true,
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.js',
        'dist/',
        'coverage/'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    },
    
    // Test file patterns
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    exclude: ['node_modules/', 'dist/', '.git/'],
    
    // Test timeout
    testTimeout: 10000,
    
    // Watch mode configuration
    watch: {
      clearScreen: false
    }
  },
  
  // Resolve configuration for tests
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@pages': resolve(__dirname, './src/pages'),
      '@hooks': resolve(__dirname, './src/hooks'),
      '@services': resolve(__dirname, './src/services'),
      '@utils': resolve(__dirname, './src/utils'),
      '@context': resolve(__dirname, './src/context')
    }
  }
})
