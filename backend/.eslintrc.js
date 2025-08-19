module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
    jest: true
  },
  extends: [
    'eslint:recommended',
    'airbnb-base',
    'prettier'
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  plugins: [
    'import',
    'prettier'
  ],
  rules: {
    // General JavaScript rules
    'no-console': ['warn', { 
      allow: ['warn', 'error', 'info'] 
    }],
    'no-debugger': 'error',
    'no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    'no-var': 'error',
    'prefer-const': 'error',
    'prefer-arrow-callback': 'error',
    
    // Code style rules
    'indent': ['error', 2, { SwitchCase: 1 }],
    'quotes': ['error', 'single', { avoidEscape: true }],
    'semi': ['error', 'never'],
    'comma-dangle': ['error', 'never'],
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    'space-before-blocks': 'error',
    'keyword-spacing': 'error',
    'arrow-spacing': 'error',
    
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
      'newlines-between': 'always',
      alphabetize: {
        order: 'asc',
        caseInsensitive: true
      }
    }],
    'import/no-unresolved': 'error',
    'import/no-extraneous-dependencies': ['error', {
      devDependencies: [
        '**/*.test.js',
        '**/*.spec.js',
        '**/tests/**',
        '**/scripts/**',
        'jest.config.js',
        'jest.setup.js'
      ]
    }],
    
    // Node.js specific rules
    'no-process-exit': 'error',
    'no-path-concat': 'error',
    'handle-callback-err': 'error',
    
    // Security rules
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    
    // Best practices
    'consistent-return': 'error',
    'default-case': 'error',
    'dot-notation': 'error',
    'eqeqeq': ['error', 'always'],
    'no-alert': 'error',
    'no-caller': 'error',
    'no-else-return': 'error',
    'no-empty-function': 'warn',
    'no-magic-numbers': ['warn', { 
      ignore: [-1, 0, 1, 2, 100, 200, 201, 400, 401, 403, 404, 500],
      ignoreArrayIndexes: true,
      enforceConst: true
    }],
    'no-multi-spaces': 'error',
    'no-return-assign': 'error',
    'no-self-compare': 'error',
    'no-throw-literal': 'error',
    'no-useless-concat': 'error',
    'radix': 'error',
    'yoda': 'error',
    
    // Variable rules
    'no-shadow': 'error',
    'no-undef-init': 'error',
    'no-undefined': 'error',
    'no-use-before-define': ['error', { functions: false }],
    
    // Stylistic rules
    'camelcase': ['error', { properties: 'never' }],
    'func-names': ['error', 'as-needed'],
    'max-len': ['error', { 
      code: 100,
      ignoreUrls: true,
      ignoreStrings: true,
      ignoreTemplateLiterals: true,
      ignoreRegExpLiterals: true
    }],
    'new-cap': 'error',
    'no-array-constructor': 'error',
    'no-new-object': 'error',
    'no-underscore-dangle': ['error', { 
      allow: ['_id', '__dirname', '__filename'] 
    }],
    'object-shorthand': 'error',
    'one-var': ['error', 'never'],
    'prefer-template': 'error'
  },
  overrides: [
    {
      files: ['**/*.test.js', '**/*.spec.js'],
      env: {
        jest: true
      },
      rules: {
        'no-console': 'off',
        'no-magic-numbers': 'off',
        'max-len': 'off',
        'import/no-extraneous-dependencies': 'off'
      }
    },
    {
      files: ['scripts/**/*.js'],
      rules: {
        'no-console': 'off',
        'no-process-exit': 'off'
      }
    }
  ]
}
