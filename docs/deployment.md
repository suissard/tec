# 🚀 Déploiement

> Build statique, prévisualisation, variables d'environnement, hébergement et CI/CD.

---

## 1. Build de production

```bash
npm ci                # installation déterministe (package-lock.json)
npm run typecheck     # vue-tsc (app) + tsc (config Node)
npm run lint          # ESLint + Prettier
npm run test:unit     # Vitest (95 tests)
npm run build         # → dist/
npm run preview       # sert dist/ en local (vérification finale)
```

### Ce que produit `npm run build`

| Sortie | Description |
|---|---|
| `dist/index.html` | Point d'entrée (preload des chunks critiques) |
| `dist/assets/*.js` | Chunks : app, pages (lazy) + **`vendor-vue`**, **`vendor-zod`**, **`vendor-ui`** via `advancedChunks.groups` (Vite 8 / Rolldown) |
| `dist/assets/*.css` | CSS Tailwind compilé (`cssCodeSplit: true`) |
| `dist/assets/*` | Fonts self-hosted (Bebas Neue, Rajdhani, Inter) et médias |
| `dist/data/*.json` | **Copie de `data/`** réalisée par le plugin `tecDataAssets` (`closeBundle`) — indispensable au fonctionnement |
| `dist/assets/*.map` | Sourcemaps (`sourcemap: true`) |

Options notables de [`vite.config.ts`](../vite.config.ts) :

- alias `@` → `src/` ;
- plugin maison `tecDataAssets` : sert `/data/*.json` en dev (middleware Vite,
  `basename()` contre la traversée de répertoire) et copie `data/` au build ;
- `server.port = 3000`, `open: true`, `css.devSourcemap: true`.

### Prévisualisation

```bash
npm run preview     # http://localhost:4173
```

Vérifier en priorité : navigation multi-routes (refresh direct sur `/actualites`),
chargement des JSON (`/data/news.json`), modales, formulaires, mobile.

> ⚠️ `vite preview` n'a **pas** de rewrite SPA : testez avec
> `VITE_HASH_ROUTER=true` si l'hébergeur cible n'en a pas non plus.

---

## 2. Variables d'environnement

Toutes facultatives, préfixées `VITE_`, définies dans `.env` / `.env.local`
(**gitignorés** : `.env`, `.env.*`) — valeurs exposées côté client, donc
**aucun secret à y mettre**.

| Variable | Défaut | Effet |
|---|---|---|
| `VITE_HASH_ROUTER` | *(absente → History API)* | `'true'` → `createWebHashHistory` (`/#/…`). À utiliser **sans** rewrite serveur |
| `VITE_POSTHOG_KEY` | *(absente → aucun tracker)* | Clé PostHog. Le SDK n'est injecté que si le consentement est `granted` |
| `VITE_POSTHOG_HOST` | `https://eu.i.posthog.com` | Hébergeur du SDK PostHog |

Typage TypeScript : [`src/vite-env.d.ts`](../src/vite-env.d.ts).

```bash
# .env (exemple)
VITE_HASH_ROUTER=true
VITE_POSTHOG_KEY=phc_xxxxxxxxxxxx
VITE_POSTHOG_HOST=https://eu.i.posthog.com
```

Variables à définir **dans les secrets du CI** (Settings → Secrets → Actions) et
dans la console de l'hébergeur : idem, jamais de secret réel côté client.

---

## 3. Hébergement

### Prérequis communs

1. Publier **tout le contenu de `dist/`** (y compris `data/`).
2. Réécriture SPA : `/* → /index.html` (les extensions `.js`, `.css`, `.json`,
   `.map`, `.svg`, `.jpg` doivent servir les vrais fichiers).
   *Alternative* : `VITE_HASH_ROUTER=true` → aucun rewrite nécessaire.
3. Headers recommandés :

```nginx
# gzip / brotli + cache immuable sur les assets hachés
location /assets/ {
  add_header Cache-Control "public, max-age=31536000, immutable";
}
location / {
  try_files $uri $uri/ /index.html;
  add_header Cache-Control "no-cache";       # index.html toujours fraîche
}
# Sécurité (compatible CSP : aucun script inline exécuté)
add_header Content-Security-Policy "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self' https://eu.i.posthog.com; connect-src 'self' https://eu.i.posthog.com;" always;
```

### Netlify (`netlify.toml`)

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Vercel

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### GitHub Pages

Base path à passer via `vite.config.ts` (`base: '/tec/'`) **et**
`VITE_HASH_ROUTER=true` (pas de rewrite sur Pages).

### Site vanilla (repli)

```bash
npm run legacy:build   # sections/ → index.legacy.html + css/tailwind.min.css
npm run legacy:serve   # vérification sur http://localhost:8080
```

---

## 4. CI / CD — GitHub Actions

> **État actuel du dépôt** : aucun workflow n'est encore versionné
> (dossier `.github/workflows/` absent). Le modèle ci-dessous est prêt à l'être
> déposé tel quel ; il reflète les commandes réelles du projet.

### `.github/workflows/ci.yml` (modèle)

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test:coverage
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist

  # Déploiement conditionnel sur main (décommenter + configurer l'ID de dépôt)
  # deploy:
  #   needs: quality
  #   if: github.ref == 'refs/heads/main'
  #   runs-on: ubuntu-latest
  #   steps:
  #     - uses: actions/checkout@v4
  #     - uses: actions/setup-node@v4
  #       with: { node-version: 20, cache: npm }
  #     - run: npm ci && npm run build
  #     - name: Deploy to GitHub Pages
  #       uses: peaceiris/actions-gh-pages@v3
  #       with:
  #         github_token: ${{ secrets.GITHUB_TOKEN }}
  #         publish_dir: ./dist
  #       env:
  #         VITE_HASH_ROUTER: 'true'   # Pages n'offre pas de rewrite
```

**Ordre des états** : `lint` → `typecheck` → `test:coverage` → `build` — même
séquence que la checklist de [`CONTRIBUTING.md`](../CONTRIBUTING.md#5-pull-request).

Les seuils de couverture (80/80/70/80) font échouer `test:coverage` en cas de
régression : le job `quality` devient alors bloquant pour la PR.

---

## 5. Tests E2E (Playwright)

`@playwright/test` est installé (devDependency). La suite n'est pas encore
versionnée : ajouter

```bash
npm run test:e2e      # à ajouter : "test:e2e": "playwright test"
```

avec :

1. `playwright.config.ts` à la racine :

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: { baseURL: 'http://localhost:4173' },
  webServer: {
    command: 'npm run build && npm run preview',
    port: 4173,
    reuseExistingServer: true,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'] } },
  ],
});
```

2. parcours critiques dans `tests/e2e/*.spec.ts` : navigation des 9 routes,
   filtre annuaire + modale, formulaire de contact (succès/échec), stepper
   bénévole (brouillon persistant), consentement cookies, 404.

Prérequis CI : `npx playwright install --with-deps chromium`.

---

## 6. Check-list de mise en production

- [ ] `npm run lint` · `npm run typecheck` · `npm run test:unit` verts
- [ ] `npm run build` sans erreur, `dist/data/` présent
- [ ] `npm run preview` : parcours principal vérifié (desktop + mobile)
- [ ] Rewrite SPA configuré **ou** `VITE_HASH_ROUTER=true`
- [ ] Variables d'env définies sur l'hébergeur (PostHog si suivi d'audience)
- [ ] HTTPS actif (requis pour `localStorage` en contexte sûr et PostHog)
- [ ] `sitemap.xml` / `robots.txt` mis à jour si les routes changent
- [ ] Tag git de version + [`CHANGELOG.md`](../CHANGELOG.md) mis à jour
