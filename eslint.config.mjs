import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript';
import pluginVue from 'eslint-plugin-vue';
import prettier from 'eslint-plugin-prettier';
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting';

export default defineConfigWithVueTs(
  {
    // Global ignores (objet sans `files` = ignores globaux)
    name: 'app/ignores',
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/coverage/**',
      // Site vanilla legacy (linté via eslint.legacy.config.mjs)
      'js/**',
      'scripts/**',
      'css/**',
      'media/**',
      'sections/**',
      'data/**',
      'index.legacy.html',
      'OLD*.html',
      '**/*.legacy.js',
      'eslint.legacy.config.mjs',
      '**/*.tsbuildinfo',
    ],
  },
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },
  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,
  {
    name: 'app/prettier',
    plugins: { prettier },
    rules: { 'prettier/prettier': 'error' },
  },
  skipFormatting,
  {
    name: 'app/rules',
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/no-unused-vars': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-console': 'warn',
    },
  }
);
