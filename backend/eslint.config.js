// Lint configuration (ESLint 9 flat config). Run with `npm run lint`.
// Errors are real defects (undefined names, unreachable code). Warnings such as unused variables do not fail the
// command, so they can be cleaned up gradually.
import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['node_modules/**', 'uploads/**', '.runtime/**', 'coverage/**'] },
  {
    files: ['**/*.{js,mjs}'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: { ...globals.node } },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' }],
      'no-empty': ['warn', { allowEmptyCatch: true }],
    },
  },
  // Verification scripts drive a browser; code passed to page.evaluate runs there.
  { files: ['scripts/verify-*.js'], languageOptions: { globals: { ...globals.node, ...globals.browser } } },
  { files: ['**/*.cjs'], languageOptions: { sourceType: 'commonjs', globals: { ...globals.node } } },
];
