import { cpSync, existsSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath, URL } from 'node:url';

import { defineConfig, type Plugin } from 'vite';
import vue from '@vitejs/plugin-vue';
import sitemap from 'vite-plugin-sitemap';

const PROJECT_ROOT = fileURLToPath(new URL('.', import.meta.url));
const DATA_DIR = join(PROJECT_ROOT, 'data');
const DIST_DATA_DIR = join(PROJECT_ROOT, 'dist', 'data');

/**
 * Sert `data/*.json` à l'URL `/data/*.json` :
 * - en dev via un middleware (les JSON restent la source unique à la racine) ;
 * - en build via une copie vers `dist/data` (requis pour `vite preview`).
 */
function tecDataAssets(): Plugin {
  return {
    name: 'tec:data-assets',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const url = (request.url ?? '').split('?')[0];
        if (!url.startsWith('/data/') || !url.endsWith('.json')) {
          next();
          return;
        }
        // `basename` interdit toute traversée de répertoire hors de ./data
        const filePath = join(DATA_DIR, basename(url));
        if (!existsSync(filePath)) {
          next();
          return;
        }
        response.setHeader('Content-Type', 'application/json; charset=utf-8');
        response.end(readFileSync(filePath, 'utf8'));
      });
    },
    closeBundle() {
      if (existsSync(DATA_DIR)) {
        cpSync(DATA_DIR, DIST_DATA_DIR, { recursive: true });
      }
    },
  };
}

/**
 * URL canonique du site, transmise à `vite-plugin-sitemap` pour générer
 * `dist/sitemap.xml` et `dist/robots.txt`. Surchargeable (CI, hébergeur,
 * prévisualisation…) via `VITE_SITE_URL`.
 */
const SITE_URL = (process.env.VITE_SITE_URL || 'https://tec-asso.fr').replace(/\/+$/, '');

/**
 * Routes statiques du sitemap — miroir de `src/router/index.ts`
 * (la route 404 `/:pathMatch(.*)*` est volontairement absente).
 */
const STATIC_ROUTES: readonly string[] = [
  '/',
  '/associations',
  '/evenements',
  '/actualites',
  '/qui-sommes-nous',
  '/contact',
  '/mentions-legales',
  '/benevolat',
  '/adhesion',
];

/** Fréquence de changement déclarée par route (`'*'` = valeur par défaut). */
const CHANGEFREQ: Record<string, string> = {
  '/': 'weekly',
  '/associations': 'monthly',
  '/evenements': 'weekly',
  '/actualites': 'weekly',
  '/qui-sommes-nous': 'yearly',
  '/contact': 'monthly',
  '/mentions-legales': 'yearly',
  '/benevolat': 'monthly',
  '/adhesion': 'monthly',
  '*': 'monthly',
};

/** Priorité déclarée par route, de 0 à 1 (`'*'` = valeur par défaut). */
const PRIORITY: Record<string, number> = {
  '/': 1,
  '/associations': 0.8,
  '/evenements': 0.8,
  '/actualites': 0.7,
  '/qui-sommes-nous': 0.6,
  '/contact': 0.5,
  '/mentions-legales': 0.3,
  '/benevolat': 0.6,
  '/adhesion': 0.7,
  '*': 0.5,
};

/**
 * Construit les URLs dynamiques du sitemap à partir de `data/associations.json` :
 * `/adhesion?asso=<id>` préremplit le formulaire d'adhésion (cf.
 * `AssociationDetailModal` et `AdhesionView`).
 *
 * @returns `string[]` — liste vide si le JSON est illisible (build non bloquant)
 */
function associationRoutes(): string[] {
  try {
    const items = JSON.parse(readFileSync(join(DATA_DIR, 'associations.json'), 'utf8')) as Array<{
      id?: unknown;
    }>;
    return items
      .map((item) => item.id)
      .filter((id): id is string => typeof id === 'string' && id.length > 0)
      .map((id) => `/adhesion?asso=${encodeURIComponent(id)}`);
  } catch (error) {
    console.warn(
      '[sitemap] data/associations.json illisible — routes dynamiques ignorées :',
      error instanceof Error ? error.message : error
    );
    return [];
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tecDataAssets(),
    sitemap({
      hostname: SITE_URL,
      // `/` est déjà détecté par le plugin (scan de `dist/index.html`) :
      // ne pas le redéclarer ici, sinon il apparaîtrait deux fois.
      dynamicRoutes: [...STATIC_ROUTES.filter((route) => route !== '/'), ...associationRoutes()],
      changefreq: CHANGEFREQ,
      priority: PRIORITY,
      // Génère `dist/sitemap.xml` + `dist/robots.txt` (et écrase les copies
      // statiques de `public/`, utilisées comme repli en `vite dev`).
      generateRobotsTxt: true,
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  css: {
    devSourcemap: true,
  },
  build: {
    cssCodeSplit: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        // Vite 8 (Rolldown) : l'objet `manualChunks` n'est plus supporté.
        // Chunking vendors via l'API native `advancedChunks.groups`.
        advancedChunks: {
          groups: [
            { name: 'vendor-vue', test: /node_modules[\\/](vue|vue-router|pinia)[\\/]/ },
            { name: 'vendor-zod', test: /node_modules[\\/]zod[\\/]/ },
            { name: 'vendor-ui', test: /node_modules[\\/]@vueuse[\\/]core[\\/]/ },
          ],
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
