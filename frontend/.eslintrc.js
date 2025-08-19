module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    '@vitejs/eslint-config-react',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'prettier'
  ],
  ignorePatterns: ['dist', '.eslintrc.js', 'node_modules'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  settings: {
    react: {
      version: 'detect'
    }
  },
  plugins: [
    'react',
    'react-hooks',
    'react-refresh',
    'jsx-a11y'
  ],
  rules: {
    // React specific rules
    'react/react-in-jsx-scope': 'off', // Not needed with React 17+
    'react/prop-types': 'warn',
    'react/jsx-uses-react': 'off',
    'react/jsx-uses-vars': 'error',
    'react/jsx-key': 'error',
    'react/no-unescaped-entities': 'warn',
    'react/display-name': 'off',
    
    // React Hooks rules
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    
    // React Refresh rules
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    
    // General JavaScript rules
    'no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    'no-console': ['warn', { 
      allow: ['warn', 'error'] 
    }],
    'no-debugger': 'error',
    'no-alert': 'warn',
    'no-var': 'error',
    'prefer-const': 'error',
    'prefer-arrow-callback': 'error',
    'arrow-spacing': 'error',
    
    // Code style rules
    'indent': ['error', 2, { SwitchCase: 1 }],
    'quotes': ['error', 'single', { avoidEscape: true }],
    'semi': ['error', 'never'],
    'comma-dangle': ['error', 'never'],
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    'space-before-blocks': 'error',
    'keyword-spacing': 'error',
    
    // Import rules
    'import/order': ['error', {
      groups: [
        'builtin',
        'external',
        'internal',
        'parent',
        'sibling',
        'index'
      ],
      'newlines-between': 'always'
    }],
    
    // Accessibility rules
    'jsx-a11y/alt-text': 'error',
    'jsx-a11y/anchor-has-content': 'error',
    'jsx-a11y/click-events-have-key-events': 'warn',
    'jsx-a11y/no-static-element-interactions': 'warn'
  },
  overrides: [
    {
      files: ['**/*.test.{js,jsx}', '**/*.spec.{js,jsx}'],
      env: {
        jest: true,
        'vitest-globals/env': true
      },
      extends: ['plugin:testing-library/react'],
      rules: {
        'no-console': 'off',
        'react/prop-types': 'off'
      }
    }
  ]
}
