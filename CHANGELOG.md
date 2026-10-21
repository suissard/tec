# 📋 CHANGELOG

Toutes les modifications notables de ce dépôt sont documentées ici.
Format : [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) —
Versioning : [Semantic Versioning](https://semver.org/lang/fr/).

---

## [Unreleased]

### À venir

- Suite E2E Playwright (`tests/e2e/` + script `npm run test:e2e`).
- Pipeline GitHub Actions (lint → typecheck → tests → build → deploy).
- Bascule clair/sombre (`dark` variant prêt côté `@theme`, voir `ARCHITECTURE.md`).

---

## [2.0.0] — 2026-10-21

Migration complète du site **vanilla JS (HTML assemblé)** vers une **SPA Vue 3**
typée, testée et accessible.

### Added

- **Stack moderne** : Vue 3.4 (Composition API, `<script setup lang="ts">`),
  Vite 8 (Rolldown, chunks `vendor-vue` / `vendor-zod` / `vendor-ui`),
  Pinia 2, Vue Router 4, Tailwind CSS 4 (`@theme` / `@utility` / `@source`),
  Zod 4, VueUse, TypeScript 5.6 + `vue-tsc`.
- **9 pages complètes** + 404 : Accueil, Associations, Événements, Actualités,
  Qui sommes-nous, Contact, Mentions légales, Devenir bénévole, Adhésion
  (avec 2 modes : particulier / structure).
- **3 stores Pinia** : `app` (menu mobile, chargement, toasts bornés à 3),
  `data` (associations, événements, actualités + getters/tris/recherche + cache),
  `forms` (contact, bénévolat, adhésion + persistance localStorage).
- **6 composables** : `useModal`, `useCookieConsent` (singleton),
  `useLocalStorage`, `useDebounce` (factory), `useFocusTrap`,
  `useIntersectionObserver`.
- **20+ composants** : famille `Base*` accessible (`BaseInput`, `BaseTextarea`,
  `BaseSelect`, `BaseCheckbox`, `BaseRadio(Group)`, `BaseDatePicker`,
  `BaseFileInput`, `BaseButton`), `TagInput`, `Stepper`, `Accordion`,
  `ImageCarousel`, `ModalHost`, `ToastHost`, `CookieBanner`,
  `CookiePreferencesPanel`, cartes métier (`Association/Event/NewsCard`) et
  leurs modales de détail, `Pagination`, `SearchInput`, `CategoryFilter`,
  `StatsCounter`, `HeroSection`, `SiteHeader`, `SiteFooter`, `ContactForm`.
- **Validation Zod** centralisée (`utils/validation.ts`) : schémas par étape du
  formulaire bénévole (`volunteerStepSchemas`), adhésion individuelle et structure
  (SIRET 14 chiffres, URL, cotisation, CGU) + helper `validateForm()`.
- **Persistance localStorage** : brouillon du formulaire bénévole
  (`tec_volunteer_draft`) et historique horodaté des soumissions
  (`tec_contacts`, `tec_volunteers`, `tec_adhesions`).
- **SEO** : `meta.title` / `meta.description` / Open Graph appliqués par
  `router.beforeEach`, injection JSON-LD (`NewsArticle`, listes) via `utils/seo.ts`.
- **Tests unitaires Vitest** : 13 fichiers, **95 tests**, couverture
  **96 %** instructions / **97,7 %** lignes / **99,2 %** fonctions
  (seuils bloquants : 80-80-70-80).
- **Outillage qualité** : ESLint flat config (`eslint.config.mjs`) + Prettier,
  config legacy séparée (`eslint.legacy.config.mjs`), `typecheck` app + Node.
- **Documentation** : `README.md`, `ARCHITECTURE.md`, `CONTRIBUTING.md`,
  `CHANGELOG.md` et `docs/` (stores, composables, composants, formulaires,
  déploiement).

### Changed

- **Migration vanilla JS → Vue 3 Composition API** : routage par hash/History
  API remplacé par Vue Router 4, manipulation DOM manuelle remplacée par des
  composants réactifs, state global (module JS) remplacé par Pinia.
- Feuilles Tailwind compilées via PostCSS (`@tailwindcss/postcss`) au lieu de la
  CLI et de `tailwind.config.js` — configuration désormais dans `src/assets/css/main.css`.
- Fonts **self-hosted** (Bebas Neue, Rajdhani, Inter) : plus de Google Fonts externe.
- Les scripts `legacy:*` restent disponibles ; le site d'origine est conservé
  (`index.legacy.html`, `sections/`, `js/`, `css/`) comme repli et référence.

### Fixed

- **CSP-ready** : aucun script inline exécuté, aucun CDN tiers ; PostHog n'est
  injecté qu'après consentement explicite (`VITE_POSTHOG_KEY` facultative).
- **XSS** : interpolation Vue uniquement (pas de `v-html` sur données externes),
  JSON-LD sérialisé via `JSON.stringify`.
- **Accessibilité WCAG AA** : skip link, `<main>` identifié, focus trap
  (modale / menu mobile / bandeau cookies) avec restauration du focus,
  `role="dialog"` + `aria-modal`, `role="alert"` sur les erreurs de champ,
  `aria-live` sur toasts et stepper, un seul `<h1>` par page, focus visible,
  hiérarchie de titres respectée.
- Erreurs de données gérées proprement : `ApiError` typée, état `error` du store,
  placeholders d'images en cas de visuel absent.
- Timeouts de toasts nettoyés (pas de fuite mémoire), pile bornée à 3 entrées.

---

## [1.x] — 2022 … 2026-10

Site vitrine **vanilla** : HTML sémantique assemblé depuis `sections/`
(`scripts/build.js`), JavaScript ES6+ (routage SPA par hash + History API,
modale accessible avec piège de focus), Tailwind CSS compilé statiquement,
tracking d'audience.

Version de départ du dépôt : `1.0.0` (site statique unique).

---

[unreleased]: https://github.com/toulouse-esport-connect/tec/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/toulouse-esport-connect/tec/compare/v1.0.0...v2.0.0
[1.x]: https://github.com/toulouse-esport-connect/tec/releases/tag/v1.0.0
