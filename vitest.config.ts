import { defineConfig, mergeConfig } from 'vitest/config';

import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./tests/setup.ts'],
      // Tests indépendants d'un éventuel `.env.local` : site en mode JSON pur
      // (les tests PocketBase activent l'URL eux-mêmes).
      env: { VITE_POCKETBASE_URL: '' },
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        thresholds: {
          lines: 80,
          functions: 80,
          branches: 70,
          statements: 80,
        },
      },
    },
  })
);
