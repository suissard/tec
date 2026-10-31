import { cpSync, existsSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath, URL } from 'node:url';

import { defineConfig, type Plugin } from 'vite';
import vue from '@vitejs/plugin-vue';
import sitemap from 'vite-plugin-sitemap';

import { validateContent } from './src/utils/contentSchema';

const PROJECT_ROOT = fileURLToPath(new URL('.', import.meta.url));
const DATA_DIR = join(PROJECT_ROOT, 'data');
const DIST_DATA_DIR = join(PROJECT_ROOT, 'dist', 'data');
const CONTENT_FILE = join(PROJECT_ROOT, 'src', 'data', 'content.json');

/**
 * Base path public du site (préfixe de toutes les URL d'assets).
 *
 * - `/` (défaut) : domaine dédié (tec-asso.fr, Netlify, Vercel…).
 * - `/tec/` : GitHub Pages « project site » (`https://<user>.github.io/tec/`),
 *   surchargeable en CI via `VITE_BASE_PATH`.
 *
 * Sans ce préfixe, le `index.html` déployé demande `/assets/index-*.js` à la
 * racine de `github.io` → 404 → page blanche.
 */
function normalizeBasePath(value: string | undefined): string {
  const trimmed = (value ?? '').trim();
  if (!trimmed || trimmed === '/') return '/';
  return `/${trimmed.replace(/^\/+|\/+$/g, '')}/`;
}

const BASE_PATH = normalizeBasePath(process.env.VITE_BASE_PATH);

/**
 * Hash routing (`/#/contact`) : obligatoire sur GitHub Pages, qui ne sait pas
 * réécrire les URL profondes vers `index.html` (pas de fallback SPA).
 * `VITE_HASH_ROUTER` force le mode (utile pour un domaine dédié).
 */
const USE_HASH_ROUTER =
  process.env.VITE_HASH_ROUTER === 'true' ||
  (process.env.VITE_HASH_ROUTER !== 'false' && BASE_PATH !== '/');

/**
 * Réécrit les URL absolues du dossier public (`/media/...`) dans le CSS émis.
 *
 * Vite ne préfixe pas `base` sur les `url('/media/…')` écrites à la main dans
 * les feuilles de style : sur un sous-chemin (`/tec/`), elles pointeraient vers
 * la racine du domaine. Les composants, eux, utilisent `publicUrl()`.
 */
function tecPublicBaseAssets(): Plugin {
  let base = '/';
  return {
    name: 'tec:public-base-assets',
    configResolved(config) {
      base = config.base;
    },
    generateBundle(_options, bundle) {
      if (base === '/') return;
      const prefix = base.replace(/\/+$/, '');
      for (const file of Object.values(bundle)) {
        if (file.type !== 'asset' || !file.fileName.endsWith('.css')) continue;
        const source =
          typeof file.source === 'string' ? file.source : new TextDecoder().decode(file.source);
        file.source = source
          .replace(/url\('\/media\//g, `url('${prefix}/media/`)
          .replace(/url\("\/media\//g, `url("${prefix}/media/`)
          .replace(/url\(\/media\//g, `url(${prefix}/media/`);
      }
    },
    // `vite-plugin-sitemap` injecte `<link rel="sitemap" href="/sitemap.xml">`
    // sans tenir compte du `base` : on corrige après son passage.
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        if (base === '/') return html;
        const prefix = base.replace(/\/+$/, '');
        return html.replace(/href="\/sitemap\.xml"/g, `href="${prefix}/sitemap.xml"`);
      },
    },
  };
}

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
        // En dev avec un `base` non racine (`VITE_BASE_PATH=/tec/`), l'URL
        // reçue est `/tec/data/…` : on retire le préfixe avant de résoudre.
        const pathname = url.startsWith(BASE_PATH) ? `/${url.slice(BASE_PATH.length)}` : url;
        if (!pathname.startsWith('/data/') || !pathname.endsWith('.json')) {
          next();
          return;
        }
        // `basename` interdit toute traversée de répertoire hors de ./data
        const filePath = join(DATA_DIR, basename(pathname));
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
 * Vérifie `src/data/content.json` (textes des pages, édités par des humains)
 * contre `contentSchema` :
 * - au build : toute erreur fait échouer `vite build` avec la liste des
 *   champs fautifs (ex. `pages.home.hero.title : Texte vide`) ;
 * - en dev : la vérification est rejouée à chaque sauvegarde du fichier et
 *   les erreurs s'affichent dans le terminal (l'overlay Vite signale aussi un
 *   JSON syntaxiquement invalide).
 */
function tecContentValidation(): Plugin {
  function validate(): string[] {
    let parsed: unknown;
    try {
      parsed = JSON.parse(readFileSync(CONTENT_FILE, 'utf8'));
    } catch (error) {
      return [`JSON invalide : ${error instanceof Error ? error.message : String(error)}`];
    }
    return validateContent(parsed);
  }

  function report(errors: string[]): string {
    return `[content] src/data/content.json contient ${errors.length} erreur(s) :\n  - ${errors.join('\n  - ')}`;
  }

  return {
    name: 'tec:content-validation',
    buildStart() {
      const errors = validate();
      if (errors.length === 0) return;
      if (this.meta.watchMode) {
        this.warn(report(errors));
        return;
      }
      this.error(report(errors));
    },
    configureServer(server) {
      server.watcher.add(CONTENT_FILE);
      server.watcher.on('change', (file) => {
        if (file !== CONTENT_FILE) return;
        const errors = validate();
        if (errors.length > 0) server.config.logger.error(report(errors));
      });
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
  base: BASE_PATH,
  plugins: [
    vue(),
    tecContentValidation(),
    tecDataAssets(),
    tecPublicBaseAssets(),
    sitemap({
      hostname: SITE_URL,
      // Préfixe les URL du sitemap/robots pour un déploiement en sous-chemin.
      basePath: BASE_PATH === '/' ? '' : BASE_PATH.replace(/\/+$/, ''),
      // `/` est déjà détecté par le plugin (scan de `dist/index.html`) :
      // ne pas le redéclarer ici, sinon il apparaîtrait deux fois.
      // En hash routing, les URL profondes n'existent pas côté serveur : seul
      // `/` est indexable.
      dynamicRoutes: USE_HASH_ROUTER
        ? []
        : [...STATIC_ROUTES.filter((route) => route !== '/'), ...associationRoutes()],
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
