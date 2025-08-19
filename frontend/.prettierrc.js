module.exports = {
  // Basic formatting
  semi: false,
  singleQuote: true,
  quoteProps: 'as-needed',
  trailingComma: 'none',
  
  // Indentation
  tabWidth: 2,
  useTabs: false,
  
  // Line length
  printWidth: 80,
  
  // Bracket spacing
  bracketSpacing: true,
  bracketSameLine: false,
  
  // Arrow functions
  arrowParens: 'avoid',
  
  // JSX specific
  jsxSingleQuote: true,
  
  // End of line
  endOfLine: 'lf',
  
  // Embedded language formatting
  embeddedLanguageFormatting: 'auto',
  
  // HTML whitespace sensitivity
  htmlWhitespaceSensitivity: 'css',
  
  // Prose wrap
  proseWrap: 'preserve',
  
  // Plugin configuration for Tailwind CSS
  plugins: ['prettier-plugin-tailwindcss'],
  
  // File-specific overrides
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 120,
        tabWidth: 2
      }
    },
    {
      files: '*.md',
      options: {
        printWidth: 100,
        proseWrap: 'always'
      }
    },
    {
      files: '*.css',
      options: {
        printWidth: 120
      }
    }
  ]
}
