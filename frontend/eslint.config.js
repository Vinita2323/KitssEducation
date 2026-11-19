// Lint configuration (ESLint 9 flat config). Run with `npm run lint`.
// Errors are real defects (undefined names, broken hook order, unreachable code). Warnings are tidy-ups such as
// unused variables or a missing effect dependency; they do not fail the command, so they can be cleaned up gradually.
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  // Build output, dependencies and test output (test-artifacts holds thousands of generated files).
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'test-artifacts/**', 'frontend/**'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...js.configs.recommended.rules,
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // JSX use counts as use; capitalised names are components or constants imported for JSX.
      'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_', caughtErrors: 'none' }],
      'no-empty': ['warn', { allowEmptyCatch: true }],
    },
  },
  // Service worker, Node-run tests and build configuration.
  { files: ['src/shared/push/firebase-sw.js', 'public/**/*.js'], languageOptions: { globals: { ...globals.serviceworker } } },
  { files: ['tests/**/*.js', '**/*.test.js', 'vite.config.js', 'eslint.config.js'], languageOptions: { globals: { ...globals.node, axe: 'readonly' } } },
];
