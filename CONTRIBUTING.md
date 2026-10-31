# 🤝 CONTRIBUTING — Toulouse Esport Connect (TEC)

Merci de votre contribution ! Ce guide décrit le workflow, les conventions de code
et les exigences de validation avant merge.

---

## 1. Workflow Git

| Branche | Préfixe | Objet | Exemple |
|---|---|---|---|
| Base | `main` | État stable, déployable | `main` |
| Fonctionnalité | `feature/*` | Nouvelle fonctionnalité | `feature/annuaire-filtres-villes` |
| Correction | `fix/*` | Correctif de bug | `fix/toast-doublon-contact` |
| Release | `release/*` | Préparation d'une version | `release/2.1.0` |
| Hotfix | `fix/*` (depuis `main`) | Correctif urgent en production | `fix/csp-posthog` |

```bash
git checkout main && git pull
git checkout -b feature/description-courte

# … commits conventionnels …

git push -u origin feature/description-courte
# → ouvrir une Pull Request sur `main`
```

Règles :

- Toujours **rebase/merge `main`** avant d'ouvrir la PR ; jamais de commit direct
  sur `main`.
- Une PR = un sujet ; découper les grosses évolutions.
- Supprimer la branche après merge.

---

## 2. Convention de commits — [Conventional Commits](https://www.conventionalcommits.org/)

```text
<type>(<scope>) : <description en français, impératif, minuscule>

[corps optionnel — pourquoi, pas quoi]

[pied de page optionnel : BREAKING CHANGE / Closes #12]
```

Types autorisés :

| Type | Usage |
|---|---|
| `feat` | Nouvelle fonctionnalité |
| `fix` | Correction de bug |
| `docs` | Documentation (`README`, `ARCHITECTURE`, `docs/`, docstrings) |
| `refactor` | Restructuration sans changement de comportement |
| `test` | Ajout / correction de tests |
| `chore` | Dépendances, config, outillage |
| `style` | Formatage (Prettier) sans impact logique |
| `perf` | Gain de performance |
| `build` / `ci` | Config build / pipelines |

Exemples :

```text
feat(form): ajouter la validation Zod du formulaire bénévole
fix(router): corriger le scroll des ancres sous le header sticky
docs(stores): documenter les getters de dataStore
refactor(composables): extraire useFocusTrap de ModalHost
test(helpers): couvrir truncate et groupBy
chore(deps): passer Vite en 8.3
```

---

## 3. Standards de code

| Outil | Réglage | Vérification |
|---|---|---|
| **TypeScript** | `tsconfig.json` (mode permissif actuel, cible `strict`) | `npm run typecheck` |
| **ESLint** | Flat config `eslint.config.mjs` : Vue essential + TS recommended + Prettier | `npm run lint` |
| **Prettier** | `.prettierrc` : `singleQuote`, `semi`, `printWidth: 100`, `tabWidth: 2`, `trailingComma: es5` | via ESLint |
| **Nommage** | `camelCase` variables/fonctions, `PascalCase` composants/types, `UPPER_SNAKE` constantes | revue |

Bonnes pratiques :

- **`<script setup lang="ts">`** obligatoirement, avec `interface Props` typé et
  `withDefaults` pour les valeurs par défaut ; `defineEmits<{ … }>()` typé.
- **Composition API uniquement** — pas d'options API, pas de `this`.
- **Imports** : alias `@/` (`src/`) ; groupes `vue` → paquets → `@/…` → types,
  séparés par une ligne vide.
- **Docstrings TSDoc** (`/** … */`) sur **tous les exports publics** :
  stores (`@param` / `@returns`), composables (`@param` / `@returns` / `@example`),
  utilitaires (`@param` / `@returns` / `@example`), props de composants.
- **Pas de `console.log`** en production (règle `no-console: warn`).
- **Données** : ne jamais `fetch` depuis une page — passer par `stores/data.ts`
  et `services/api.ts`.
- **Accessibilité** : un `<h1>` par page, `aria-*` sur les retours d'erreur,
  piège de focus pour toute couche superposée.
- **CSS** : utilitaires Tailwind 4 (`@theme`, `@utility`) — pas de `style` inline
  sauf valeur dynamique justifiée.

---

## 4. Tests

### Unitaires (Vitest) — obligatoires pour toute nouvelle logique

```bash
npm run test:unit         # exécution
npm run test:coverage     # + couverture (seuils bloquants)
```

- Emplacement : `tests/<domaine>/<Nom>.test.ts` miroir de `src/` (`stores/`,
  `composables/`, `utils/`, `components/ui/`).
- Style : `describe` → `it` en français, assertions explicites, aucune dépendance
  réseau (données injectées ou fichiers JSON).
- **Couverture minimale** : 80 % lignes / fonctions / statements, 70 % branches —
  une régression sous les seuils fait échouer le pipeline.

À couvrir en priorité : helpers purs, schemas Zod, actions de stores, composables
avec état, comportements UI critiques (soumission, focus, pagination).

### E2E (Playwright) — pour les parcours transverses

Le package `@playwright/test` est installé ; la suite `tests/e2e/` et le script
`test:e2e` seront ajoutés avec la phase dédiée (voir
[`docs/deployment.md`](./docs/deployment.md#tests-e2e-playwright)). En attendant,
couvrir les parcours critiques en tests de composant.

---

## 5. Pull Request

### Checklist avant ouverture

- [ ] `npm run lint` : aucun avertissement nouveau
- [ ] `npm run typecheck` : OK
- [ ] `npm run test:unit` : tous les tests verts
- [ ] `npm run test:coverage` : sous les seuils ? → compléter
- [ ] `npm run build` : build de production réussi
- [ ] `npm run preview` : parcours principal vérifié à la main (desktop **et** mobile)
- [ ] Accessibilité : navigation clavier, focus visible, lecteur d'écran sur les
      zones modifiées
- [ ] Docstrings mises à jour ; `README.md` / `docs/` touchés si comportement modifié
- [ ] Commits conformes à Conventional Commits

### Description (modèle)

```markdown
## Ce que fait la PR
…

## Pourquoi
…

## Comment tester
1. npm run dev
2. …

## Checklist
- [ ] lint / typecheck / tests / build verts
- [ ] docs mises à jour
- [ ] impact a11y vérifié
```

### Revue

- **1 approbation** minimum d'un mainteneur.
- Le CI (lint + typecheck + tests + build) doit être vert.
- Les commentaires sont résolus avant merge (squash ou merge commit selon la
  convention d'équipe).

---

## 6. Release

- **SemVer** (`MAJ.MIN.PATCH`) : `major` = breaking change (routage, API store
  publique, structure des JSON), `minor` = fonctionnalité, `patch` = correctif.
- Mettre à jour `version` dans `package.json` **et** [`CHANGELOG.md`](./CHANGELOG.md)
  (format *Keep a Changelog*) dans la PR de release.
- Tag git signé/annoté : `git tag -a v2.1.0 -m "v2.1.0"` puis `git push --tags`.
- La CI publie `dist/` sur l'environnement cible (voir
  [`docs/deployment.md`](./docs/deployment.md#ci--cd-github-actions)).

---

## 7. Structure des dossiers à respecter

```text
src/
├── pages/         # 1 vue = 1 route (PageView.vue)
├── components/    # ui/ (générique) · layout/ · forms/ · métier (Carte/Modal)
├── stores/        # 1 store = 1 domaine (app, data, forms)
├── composables/   # use* : singleton si état global, factory sinon
├── services/      # toute la couche HTTP
├── utils/         # purs, sans Vue (testables tels quels)
└── types/         # types métier partagés (alignés sur src/data/*.json)
```

Une nouvelle page suit le chemin : `types` → `utils` (validation si besoin) →
`stores` → `components` → `pages` → `router` (route + `meta`) → `tests` → `docs`.
