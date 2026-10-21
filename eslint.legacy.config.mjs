/**
 * Config ESLint flat dédiée au site vanilla legacy (js/).
 * Usage : `npm run legacy:lint` → `eslint -c eslint.legacy.config.mjs js/`
 */
import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: ['js/tailwind-config.js', 'css/tailwind.min.css'],
  },
  {
    name: 'legacy/files',
    files: ['js/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser },
    },
    rules: {
      ...js.configs.recommended.rules,
      indent: ['error', 4],
      quotes: ['error', 'single'],
      semi: ['error', 'always'],
      'no-unused-vars': 'warn',
      'no-console': 'warn',
      'eol-last': 'error',
    },
  },
];
