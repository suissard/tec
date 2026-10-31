# 🎮 Toulouse Esport Connect (TEC)

> **Site officiel de Toulouse Esport Connect (TEC) — SPA Vue 3.**

**Toulouse Esport Connect (TEC)** est le réseau fédérateur des associations
esportives toulousaines, porté par l'association **Toulouse Esport Connect** (Loi 1901).
Le site rassemble les associations, joueurs compétitifs, créateurs de contenus et
organisateurs d'événements de la métropole toulousaine et d'Occitanie.

L'application est une **Single Page Application (SPA) Vue 3** — moderne, responsive,
accessible (WCAG AA) et pensée pour être hébergée en **statique** (aucun backend requis).

> 📖 Documentation détaillée : [`ARCHITECTURE.md`](./ARCHITECTURE.md) ·
> [`CONTRIBUTING.md`](./CONTRIBUTING.md) · [`CHANGELOG.md`](./CHANGELOG.md) ·
> [`docs/`](./docs/)

---

## ✨ Fonctionnalités

| Route | Page | Contenu |
|---|---|---|
| `/` | **Accueil** | Hero, compteurs animés, dernières actualités, prochains événements, annuaire |
| `/associations` | **Associations** | Annuaire filtrable (catégories + recherche), fiche détaillée en modale |
| `/evenements` | **Événements** | Agenda trié, filtres par catégorie, statuts (`open` / `full` / `past`), modale |
| `/actualites` | **Actualités** | Liste paginée, article mis en avant, JSON-LD `NewsArticle`, modale |
| `/qui-sommes-nous` | **Qui sommes-nous ?** | Mission, valeurs, gouvernance |
| `/contact` | **Contact** | Formulaire validé + toasts de confirmation |
| `/benevolat` | **Devenir bénévole** | Formulaire multi-étapes (4 étapes) avec brouillon persistant |
| `/adhesion` | **Adhésion** | Adhésion individuelle ou structure (SIRET, jeux, cotisation) |
| `/mentions-legales` | **Mentions légales** | Statut, hébergement, données personnelles |
| `/:pathMatch(.*)*` | **404** | Page introuvable avec retour à l'accueil |

Transversal : menu mobile, bannière de consentement cookies (RGPD), notifications
toasts, modale globale accessible, prefetch des routes principales, SEO (titre +
meta description + Open Graph + JSON-LD injectés à chaque navigation).

---

## 🛠️ Stack technique

| Domaine | Outil | Version |
|---|---|---|
| Framework | **Vue 3** (Composition API, `<script setup lang="ts">`) | 3.4 |
| Bundler / dev server | **Vite** (Rolldown, chunks vendors avancés) | 8 |
| État global | **Pinia** (3 stores : `app`, `data`, `forms`) | 2 |
| Routage | **Vue Router 4** (History API + repli hash) | 4 |
| Styles | **Tailwind CSS 4** (`@theme`, `@utility`, `@source`) | 4 |
| Validation | **Zod 4** (schémas de formulaires) | 4 |
| Utilitaires | **VueUse** (`useId`, …) | 10 |
| Tests unitaires | **Vitest** + `@vue/test-utils` + jsdom + coverage V8 | 5 |
| Tests E2E | **Playwright** | 1.64 |
| Lint / format | **ESLint 10** (flat config) + **Prettier** | — |
| Typage | **TypeScript** + `vue-tsc` | 5.6 |

---

## 🚀 Démarrage rapide

```bash
# 1. Installer les dépendances
npm install

# 2. Lancer le serveur de développement (http://localhost:3000, ouverture auto)
npm run dev
```

### Commandes

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de développement Vite (port **3000**) |
| `npm run build` | Build de production dans `dist/` (sourcemaps + chunks vendors) |
| `npm run preview` | Prévisualise le build (`dist/`) |
| `npm run lint` | ESLint + Prettier avec auto-correction |
| `npm run lint:fix` | Identique à `lint` (alias) |
| `npm run typecheck` | `vue-tsc` (app) + `tsc` (config Node) en `--noEmit` |
| `npm run test:unit` | Tests unitaires Vitest (13 fichiers, **95 tests**) |
| `npm run test:coverage` | Tests + couverture V8 (seuils : 80 % lignes/fonctions, 70 % branches) |
| `npm run legacy:build` | Assemble le site vanilla (`sections/` → `index.legacy.html`) + compile Tailwind |
| `npm run legacy:build:css` | Compile uniquement `css/tailwind.min.css` |
| `npm run legacy:watch:css` | Recompile le CSS legacy en continu |
| `npm run legacy:serve` | Sert le site legacy (http://localhost:8080) |
| `npm run legacy:lint` | Lint du JS vanilla (`js/`) |

> **Tests E2E** : `@playwright/test` est installé et la couverture unitaire est en place.
> Le script `test:e2e` et la suite `tests/e2e/` seront ajoutés lors de la phase dédiée
> (voir [`docs/deployment.md`](./docs/deployment.md#tests-e2e-playwright)).

---

## 🔐 Variables d'environnement

Aucune variable n'est requise pour démarrer. Elles sont toutes facultatives et
préfixées `VITE_` (définies dans `.env` — ignoré par git — ou `.env.local`) :

| Variable | Défaut | Rôle |
|---|---|---|
| `VITE_BASE_PATH` | `/` | Préfixe public du site (`base` Vite). Sur GitHub Pages « project site » : `/tec/` (sinon les assets sont cherchés à la racine de `github.io` → page blanche) |
| `VITE_HASH_ROUTER` | *(auto)* | `'true'`/`'false'` force le mode. Par défaut : hash history (`/#/contact`) dès que `VITE_BASE_PATH !== '/'`, History API sinon |
| `VITE_POSTHOG_KEY` | *(absente)* | Clé API PostHog. Sans cette clé, aucune injection de tracker (no-op) |
| `VITE_POSTHOG_HOST` | `https://eu.i.posthog.com` | Hébergeur du SDK PostHog (injecté **uniquement** après consentement) |

Exemple `.env` :

```bash
# Déploiement GitHub Pages « project site »
VITE_BASE_PATH=/tec/
VITE_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxxxxxx
VITE_POSTHOG_HOST=https://eu.i.posthog.com
```

Le typage de ces variables vit dans [`src/vite-env.d.ts`](./src/vite-env.d.ts).

---

## 📁 Structure du projet

```text
tec/
├── index.html                 # Point d'entrée Vite (app Vue 3)
├── vite.config.ts             # Plugin Vue, alias @/, plugin data/ (dev + build)
├── vitest.config.ts           # jsdom, globals, setup tests, seuils de couverture
├── eslint.config.mjs          # Flat config ESLint (Vue + TS + Prettier)
├── eslint.legacy.config.mjs   # Flat config séparée pour le site legacy
├── tsconfig*.json             # TS app (strict-ish) / TS Node
├── postcss.config.js          # @tailwindcss/postcss (Tailwind 4)
│
├── data/                      # 📦 Données métier JSON (source unique)
│   ├── associations.json      # 6 associations
│   ├── evenements.json        # 8 événements
│   └── news.json              # 4 actualités
│
├── src/                       # 🧩 Application Vue 3 (voir ci-dessous)
│
├── tests/                     # 🧪 Tests unitaires Vitest
│   ├── setup.ts
│   ├── stores/                # app, data, forms
│   ├── composables/           # useModal, useDebounce, useLocalStorage, …
│   ├── components/ui/         # BaseButton, BaseInput, Stepper
│   └── utils/                 # helpers, validation
│
├── docs/                      # 📚 Documentation technique
│   ├── stores.md
│   ├── composables.md
│   ├── components.md
│   ├── forms.md
│   └── deployment.md
│
├── js/ · css/ · sections/     # 🕰️ Site vanilla legacy (assemblé par scripts/build.js)
├── index.legacy.html          # Sortie du build legacy
├── media/                     # Logos, photos, favicon, bannière Open Graph
└── dist/                      # Build de production (gitignoré)
```

### `src/` — l'application

```text
src/
├── main.ts                    # Bootstrap : createApp + Pinia + Router + CSS global
├── App.vue                    # Shell : DefaultLayout + <RouterView> animé +
│                              #   <Teleport body> (ModalHost, ToastHost, CookieBanner)
│                              #   + consentement cookies + prefetch des routes
├── assets/
│   ├── css/main.css           # Point d'entrée Tailwind 4 (@theme, @utility, @source)
│   ├── css/variables.css      # CSS custom properties (glassmorphism, glows)
│   └── fonts/                 # Fonts self-hosted (Bebas Neue, Rajdhani, Inter)
├── components/
│   ├── ui/                    # 20 composants génériques (Base*, ModalHost, Stepper…)
│   ├── layout/                # SiteHeader, SiteFooter
│   ├── forms/                 # ContactForm
│   └── *.vue                  # Cartes métier (Association/Event/News), Hero, Pagination…
├── composables/               # 6 composables réutilisables
├── layouts/DefaultLayout.vue  # Skip-link + header + <main> + footer
├── pages/                     # 10 vues (9 routes + NotFound)
├── router/index.ts            # Routes, guards SEO, scrollBehavior, history/hash
├── services/api.ts            # Couche HTTP typée (ApiError + fetch JSON local)
├── stores/                    # Pinia : app.ts, data.ts, forms.ts
├── types/index.ts             # Types métier alignés sur data/*.json
└── utils/                     # constants, helpers, validation (Zod), seo (JSON-LD)
```

---

## 🏗️ Architecture en bref

```text
data/*.json ──▶ services/api.ts ──▶ stores/data.ts ──▶ pages/*.vue ──▶ components/*
                                     ▲                      │
                       stores/app.ts (toasts, menu) ◀───────┤
                       stores/forms.ts (validation Zod) ◀───┘
```

- **Stores Pinia (singleton)** : `app` (menu mobile, chargement, toasts),
  `data` (associations, événements, actualités + cache), `forms` (contact,
  bénévolat, adhésion + persistance localStorage).
- **Composables** : modale globale (`useModal`, singleton), consentement cookies
  (`useCookieConsent`, singleton), `useLocalStorage`, `useDebounce`,
  `useFocusTrap`, `useIntersectionObserver`.
- **Routeur** : 9 routes + 404, `meta.title` / `meta.description` appliqués par
  `beforeEach` (onglet + `<meta>` + Open Graph), lazy loading par `import()`,
  `scrollBehavior` (ancres avec offset 96 px sous le header sticky), prefetch des
  4 routes principales dans `App.vue`.
- **CSS** : Tailwind 4 sans `tailwind.config.js` — tokens de marque dans `@theme`,
  patterns réutilisables (`btn`, `input-base`, `glass-card`, `skip-link`).

Le détail complet se trouve dans [`ARCHITECTURE.md`](./ARCHITECTURE.md) et
[`docs/`](./docs/).

---

## 📦 Données

Les données sont **locales et statiques** : trois fichiers JSON dans `data/`
(`associations.json`, `evenements.json`, `news.json`), servis en `/data/*.json`
par un plugin Vite dédié (`tecDataAssets` dans `vite.config.ts`) :

- **dev** : middleware Vite qui lit `data/` (interdit toute traversée de répertoire) ;
- **build** : copie de `data/` vers `dist/data/` (requis pour `vite preview`).

Le passage à une API distante se fait uniquement dans [`src/services/api.ts`](./src/services/api.ts)
(les stores et pages ne connaissent que `fetchAssociations()`, `fetchEvents()`, …).

---

## 📝 Formulaires

- **Validation Zod** centralisée dans [`src/utils/validation.ts`](./src/utils/validation.ts) :
  `volunteerSchema` (4 sous-schemas d'étapes), `adhesionIndivSchema`,
  `adhesionAssoSchema`, helper `validateForm(data, schema) → { valid, errors, data }`.
- **Soumission** via `useFormStore` : `submitContact()`, `submitVolunteer()`,
  `submitAdhesion(data, kind)` — état `submitting / success / error` exposé aux vues.
- **Persistance** : chaque envoi validé est écrit dans `localStorage`
  (`tec_contacts`, `tec_volunteers`, `tec_adhesions`) avec horodatage ; le brouillon
  du formulaire bénévole est sauvegardé sous `tec_volunteer_draft`.
- **UI** : composants `Base*` avec `aria-invalid`, `aria-describedby`, `role="alert"`
  sur les erreurs et `aria-live` sur les confirmations.

Détail des schémas : [`docs/forms.md`](./docs/forms.md).

---

## ♿ Accessibilité

- **Skip link** « Aller au contenu principal » (`DefaultLayout`), `<main id="main-content">`.
- **Focus trap** clavier sur la modale, le menu mobile et la bannière cookies
  (`useFocusTrap` : Tab cyclique, Échap, restauration du focus).
- **ARIA** : `role="dialog"` + `aria-modal`, `role="alert"` sur les erreurs de champ,
  `aria-live="polite"` sur les toasts/stepper/compteur, `aria-expanded` sur les
  boutons d'accordéon et de menu.
- **Hiérarchie de titres** : un seul `<h1>` par page (fourni par `HeroSection`).
- **Contraste** : palette validée sur fond sombre (rouge `#E30613`, gris `#A1A1AA`+),
  focus visible `ring-2 ring-brand-red`.
- **Compatibilité** : formulaires natifs (`required`, `type="email"`, `autocomplete`),
  cibles tactiles ≥ 40 px, navigation clavier complète.

---

## 🧪 Tests

```bash
npm run test:unit       # 15 fichiers, 104 tests
npm run test:coverage   # V8 : seuils bloquants 80/80/70/80
```

Couverture cible (seuils bloquants dans `vitest.config.ts`) : **80 %** lignes /
fonctions / statements, **70 %** branches.

---

## 🚢 Déploiement

### Production : GitHub Pages

**URL : <https://suissard.github.io/tec/>**

Le workflow [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml)
construit `dist/` puis le publie avec `actions/deploy-pages` après une CI verte
sur `main`.

#### Réglage indispensable (une seule fois)

**Settings → Pages → Build and deployment → Source = « GitHub Actions »**
(et non « Deploy from a branch »).

> ⚠️ Avec « Deploy from a branch », GitHub publie la **racine du dépôt** : le
> `index.html` source référence `/src/main.ts` (non exécutable par le
> navigateur), d'où la **page blanche**. C'est la cause du problème constaté en
> production ; le build `dist/` doit être publié à la place.

#### Variables de dépôt (valeurs de production)

Elles sont **facultatives** — le workflow calcule les mêmes valeurs par défaut —
mais les définir explicitement évite toute surprise. Elles se créent dans
**Settings → Secrets and variables → Actions → Variables** :

| Variable | Valeur en prod | Rôle |
|---|---|---|
| `BASE_PATH` | `/tec/` | Préfixe public du site (assets, médias, JSON) |
| `HASH_ROUTER` | `true` | `/#/associations` : Pages n'a pas de rewrite SPA |
| `SITE_URL` | `https://suissard.github.io/tec` | URL canonique (sitemap, robots, OG) |

Création en une commande (nécessite `gh` authentifié avec les droits admin) :

```bash
./scripts/setup-github-pages.sh
```

Le script définit les 3 variables **et** bascule la source Pages sur
« GitHub Actions ». Pour un domaine dédié :

```bash
SITE_URL=https://tec-asso.fr BASE_PATH=/ HASH_ROUTER=false \
  ./scripts/setup-github-pages.sh
```

#### Ce qui change en production (`base = /tec/`)

- `index.html` charge `/tec/assets/index-*.js` (et non `/assets/…`, qui
  renvoyait 404 → page blanche).
- Tous les médias passent par `publicUrl()` (`src/utils/paths.ts`) :
  `/tec/media/…`, et les JSON par `/tec/data/…`.
- Le CSS est réécrit au build par le plugin `tecPublicBaseAssets`
  (`url(/tec/media/…)`).
- Le routeur bascule automatiquement en **hash history** dès que
  `BASE_PATH !== '/'` : les URL profondes sont des fragments
  (`/tec/#/contact`), donc aucun rewrite serveur n'est nécessaire.
- Sitemap/robots et le prefetch de routes tiennent compte du préfixe (pas de
  requêtes vers la racine de `github.io`).
- En local, `npm run build` reste sur `/` (History API). Pour reproduire la
  prod : `VITE_BASE_PATH=/tec/ VITE_HASH_ROUTER=true npm run build`.

#### Vérifier un déploiement

```bash
curl -s https://suissard.github.io/tec/ | grep -E 'src="[^"]+"'
# ✅ attendu : src="/tec/assets/index-*.js"
# ❌ interdit : src="/src/main.ts" (Pages publie encore la branche)
```

Puis dans le navigateur : accueil, `/tec/#/associations`, logos, ouverture
d'une fiche association, rechargement direct d'une URL en hash.

#### Redéployer

1. Pousser sur `main` → la **CI** (lint, typecheck, tests, build) se lance.
2. Si elle passe, **Deploy** publie `dist/` (l'artefact du commit validé).
3. En cas d'échec : Actions → **Deploy** → *Re-run all jobs*, ou relancer la CI.

### Autres hébergeurs (Netlify, Vercel, nginx)

Build **100 % statique** (`npm run build` → `dist/` + `dist/data/`). Sur un
hébergeur avec rewrite SPA (`/* → /index.html`), garder des URL propres :
définir `BASE_PATH=/` (sinon le workflow déduit `/tec/`) et `HASH_ROUTER=false`.
Déployer tout le contenu de `dist/`, `data/` inclus.

---

## 🕰️ Site vanilla (legacy)

Le site d'origine (HTML assemblé + JS vanilla) reste disponible et buildable :

```bash
npm run legacy:build   # sections/ → index.legacy.html + css/tailwind.min.css
npm run legacy:serve   # http://localhost:8080
```

Il est conservé comme référence et en repli de production ; il est exclu du lint
principal (`eslint.legacy.config.mjs`).

---

## 🌐 Liens & Contact

- **Email** : [contact@toulouse-esport-connect.fr](mailto:contact@toulouse-esport-connect.fr)
- **Discord** : [Rejoindre le serveur communautaire](https://discord.gg/VH98qQWEhh)
- **Instagram** : [@toulouseec__](https://www.instagram.com/toulouseec__/)
- **Siège** : Toulouse, Haute-Garonne (31), France

---

## 📄 Licence

MIT — © 2026 **Toulouse Esport Connect**. Tous droits réservés pour les contenus
et les logos des structures partenaires / affiliées.
