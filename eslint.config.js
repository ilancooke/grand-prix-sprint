import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'test-results/**', 'playwright-report/**', '.npm-cache/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/game/**/*.ts'],
    rules: {
      'no-restricted-globals': ['error', 'window', 'document', 'localStorage', 'performance', 'Date', 'requestAnimationFrame', 'AudioContext', 'setTimeout', 'setInterval'],
      'no-restricted-imports': ['error', { patterns: ['../platform/*', '../render/*', '../ui/*', '../app/*'] }],
    },
  },
);
