# 🧱 Catalogue des composants

> Tous les composants sont en `<script setup lang="ts">`, avec `interface Props`
> typé, `withDefaults()` pour les défauts et `defineEmits<{ … }>()` typé.
> Les props commentées dans le code le sont aussi ici.

Sommaire : [UI — formulaires](#ui--formulaires) · [UI — structure & feedback](#ui--structure--feedback) ·
[Layout](#layout) · [Métier](#métier) · [Pages](#pages)

---

## UI — formulaires

Champ contrôlé commun : `v-model` = `modelValue` + `update:modelValue`.
Tous gèrent `label`, `hint`, `error` (avec `aria-invalid` + `aria-describedby`),
`required`, `disabled`, `inputId` (repli sur `useId()`) et `name`.

### `BaseInput` — `components/ui/BaseInput.vue`

| Prop | Type | Défaut | Description |
|---|---|---|---|
| `modelValue` | `string` | — | Valeur (v-model) |
| `label` | `string` | — | Libellé visible (obligatoire) |
| `type` | `string` | `'text'` | Type natif (`text`, `email`, `tel`, `url`…) |
| `autocomplete` | `string` | `'off'` | Attribut natif |
| `placeholder` | `string` | `''` | Texte d'invite |
| `hint` | `string?` | — | Message d'aide |
| `error` | `string?` | — | Message d'erreur (`role="alert"`) |
| `required` / `disabled` | `boolean` | `false` | États natifs |
| `inputId` / `name` | `string?` | auto / — | Id accessible / nom technique |

**Emits** : `update:modelValue: [string]` · **Slots** : aucun

```vue
<BaseInput v-model="form.email" label="Adresse email" type="email" required
           :error="errors.email" autocomplete="email" />
```

### `BaseTextarea` — `components/ui/BaseTextarea.vue`

Ajoute `rows` (défaut `5`), `maxlength` (affiche un **compteur** `aria-live`
« 0/… »). Emits : `update:modelValue: [string]`.

### `BaseSelect` — `components/ui/BaseSelect.vue`

| Prop | Type | Défaut | Description |
|---|---|---|---|
| `options` | `SelectOption[]` | — | `{ value, label, disabled? }` |
| `placeholder` | `string?` | — | Option vide `value=""` |

Emits : `update:modelValue: [string]` · Export : `interface SelectOption`.

### `BaseCheckbox` — `components/ui/BaseCheckbox.vue`

| Prop | Type | Défaut |
|---|---|---|
| `modelValue` | `boolean` | — |
| `label` | `string` | — |
| `hint` | `string?` | — |
| `indeterminate` | `boolean` | `false` (sync DOM via ref) |
| `disabled` / `required` | `boolean` | `false` |

Emits : `update:modelValue: [boolean]`.

### `BaseRadioGroup` — `components/ui/BaseRadioGroup.vue`

`<fieldset>` + `<legend>` ; gère `name` commun, `orientation`
(`vertical` par défaut / `horizontal`), `error` (`role="alert"` + `aria-invalid`
sur le fieldset), `required`, `disabled`, `hideLegend`.

| Prop | Type |
|---|---|
| `modelValue` | `string` |
| `legend` | `string` |
| `options` | `RadioOption[]` — `{ value, label, hint?, disabled? }` |

Emits : `update:modelValue: [string]` · Export : `RadioOption`.

### `BaseRadio` — `components/ui/BaseRadio.vue`

Bouton isolé (à préférer `BaseRadioGroup`) : `modelValue`, `value`, `label`,
`name` (obligatoire), `hint?`, `disabled?`, `inputId?`. Emits : `update:modelValue: [string]`.

### `BaseDatePicker` — `components/ui/BaseDatePicker.vue`

Champ `type="date"` : `modelValue: string` (ISO `AAAA-MM-JJ`), `label`, `min?`,
`max?`, `placeholder?`, `hint?`, `error?`, `required?`, `disabled?`, `inputId?`,
`name?`. Emits : `update:modelValue: [string]`.

### `BaseFileInput` — `components/ui/BaseFileInput.vue`

Dépôt **glisser-déposer** + sélection, avec aperçu image :

| Prop | Type | Défaut |
|---|---|---|
| `modelValue` | `File \| null` | — |
| `label` | `string` | — |
| `accept` | `string` | `'image/*'` |
| `hint` / `error` | `string?` | — |
| `required` / `disabled` | `boolean` | `false` |

Emits : `update:modelValue: [File | null]`.

### `TagInput` — `components/ui/TagInput.vue`

Combobox de tags avec autocomplétion (`role="combobox"` / `listbox` / `option`).

| Prop | Type | Défaut |
|---|---|---|
| `modelValue` | `string[]` | — |
| `placeholder` | `string` | `'Ajouter un élément…'` |
| `suggestions` | `string[]` | `[]` |
| `maxTags` | `number` | `0` (= illimité) |
| `inputId` | `string?` | auto |
| `readonly` | `boolean` | `false` (affichage seul) |

Emits : `update:modelValue: [string[]]`.

### `BaseButton` — `components/ui/BaseButton.vue`

Rendu polymorphe : `<button>` par défaut, `<RouterLink>` si `to`, `<a
target="_blank" rel="noopener noreferrer">` si `href`.

| Prop | Type | Défaut |
|---|---|---|
| `variant` | `'primary' \| 'secondary' \| 'outline' \| 'ghost' \| 'danger' \| 'discord'` | `'primary'` |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` |
| `loading` | `boolean` | `false` (spinner + désactivation) |
| `disabled` | `boolean` | `false` |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` |
| `to` | `string?` | route interne |
| `href` | `string?` | lien externe |

**Slot** : défaut (libellé) · les classes passées (`class`) sont fusionnées sur
le nœud racine unique.

---

## UI — structure & feedback

### `Accordion` — `components/ui/Accordion.vue`

Hauteur animée sans mesure JS (`grid-template-rows: 0fr → 1fr`), boutons
`aria-expanded`, panneaux `role="region"`.

| Prop | Type | Défaut |
|---|---|---|
| `items` | `AccordionItem[]` | — (`{ id?, title, content? }`) |
| `single` | `boolean` | `false` (ouverture multiple) |
| `defaultOpen` | `number[]` | `[]` |

**Slots** : `content` — `{ item, index }` (fallback : `item.content`).

### `Stepper` — `components/ui/Stepper.vue`

Progression multi-étapes ; `aria-current="step"` sur l'étape courante, états
`done`/`current`/`upcoming`, étapes franchies cliquables, annonce
`role="status" aria-live="polite"`.

| Prop | Type | Description |
|---|---|---|
| `steps` | `string[]` | Libellés des étapes |
| `currentStep` | `number` | Index courant (**0-based**) |

**Emits** : `step-click: [index: number]` (index **0-based**, la page convertit : `@step-click="goToStep($event + 1)"`).

### `ImageCarousel` — `components/ui/ImageCarousel.vue`

Auto-play (`interval` ms), pause au survol/focus, pause si l'onglet est masqué,
points (`role="tab"`) + flèches, légende `aria-live="polite"`.

| Prop | Type | Défaut |
|---|---|---|
| `items` | `CarouselItem[]` | — (`{ src, alt, label? }`) |
| `interval` | `number` | `4000` |
| `label` | `string` | `'Carrousel'` |

### `ModalHost` — `components/ui/ModalHost.vue`

Hôte de la **modale globale** (monté une fois dans `App.vue`, `<Teleport to="body">`).

- Lit `useModal()` : rend `content` avec `props`, en-tête `title` + bouton fermer.
- `role="dialog"` + `aria-modal`, piège de focus (`useFocusTrap`), `Escape`,
  clic sur le voile, **lock scroll** du `<body>` (restauré à la fermeture).
- Taille : `size: 'md'` (défaut, `max-w-lg`) | `'xl'` (`max-w-3xl`).

**Props** : aucune (état lu via `useModal()`).

### `ToastHost` — `components/ui/ToastHost.vue`

Rend `appStore.toasts` : bordure gauche selon le type (`success` émeraude,
`error` rouge, `info` bleu), `role="status" aria-live="polite"`, bouton « Fermer »
accessible, transition `slide-fade`.

### `CookieBanner` — `components/ui/CookieBanner.vue`

Bandeau RGPD fixe en bas (`role="dialog"`, visible si `status === 'pending'`) :
**Tout accepter** / **Refuser** / **Personnaliser** (ouvre
`CookiePreferencesPanel` dans la modale globale).

### `CookiePreferencesPanel` — `components/ui/CookiePreferencesPanel.vue`

Stub des préférences détaillées rendu dans la modale : case « mesure d'audience »,
**Tout accepter** / **Tout refuser**, confirmation toast, fermeture.

---

## Layout

### `DefaultLayout` — `layouts/DefaultLayout.vue`

```vue
<a href="#main-content" class="skip-link">Aller au contenu principal</a>
<SiteHeader />
<main id="main-content" role="main"><slot /></main>
<SiteFooter />
```

**Slot** : défaut (contenu de la page).

### `SiteHeader` — `components/layout/SiteHeader.vue`

Logo, navigation (`nav-link` + état actif `router-link-exact-active`), menu
mobile (fermeture Échap / clic extérieur via `useFocusTrap`,
`aria-expanded` sur le bouton), lien Discord (`variant="discord"`).
**Props/slots/emits** : aucun.

Les raccourcis sont déclarés dans [`src/data/navigation.json`](../src/data/navigation.json)
et résolus par [`src/utils/navigation.ts`](../src/utils/navigation.ts) : le menu
desktop (`PRIMARY_NAV` + `CONTACT_NAV`) et le menu mobile (`MAIN_NAV`) partagent
la même source, ce qui empêche qu'un lien n'apparaisse que sur un seul format.
Ajouter/retirer un raccourci = modifier uniquement le JSON (routes nommées de
`routeNames`).

### `SiteFooter` — `components/layout/SiteFooter.vue`

Liens rapides (toutes les routes), coordonnées, réseaux sociaux (Discord,
Instagram, X), mentions légales, crédit. **Props/slots/emits** : aucun.

---

## Métier

### Cartes (liste)

| Composant | Props | Emits | Notes |
|---|---|---|---|
| `AssociationCard` | `association: Association` | `open: []` | Découpe la CSV `games` en tags, repli placeholder logo |
| `EventCard` | `event: EventItem` | `open: []` | Badge date, statut (`resolveEventStatus`), localisation |
| `NewsCard` | `news: NewsItem` | `open: []` | `variant: 'featured' \| 'default' \| 'compact'` (défaut `'default'`) |

### Modales de détail

Rendues via `useModal().open(X, { … })` dans `ModalHost`.

| Composant | Props | Props absorbées |
|---|---|---|
| `AssociationDetailModal` | `association: Association` | `title?`, `size?` (défaut `'xl'`) |
| `EventDetailModal` | `event: EventItem` | `title?`, `size?` |
| `NewsDetailModal` | `news: NewsItem` | `title?`, `size?` |

Chacun expose `close()` (via `useModal`) sur son bouton de fermeture.

### `HeroSection` — `components/HeroSection.vue`

Bloc d'en-tête de page portant le **seul `<h1>`** de la vue.

| Prop | Type | Défaut |
|---|---|---|
| `title` | `string` | — |
| `subtitle` | `string?` | — |
| `eyebrow` | `string?` | — |

**Slot** : `actions` (boutons CTA sous le titre).

### `CategoryFilter` — `components/CategoryFilter.vue`

Filtre à puces — **deux modes** :

- **radio** (défaut) : `modelValue` / `update:modelValue`
- **multiple** : dès que `selected` est fourni → `v-model:selected`

| Prop | Type | Défaut |
|---|---|---|
| `options` | `CategoryOption[]` | — (`{ id, label, count? }`) |
| `legend` | `string` | — (obligatoire, `sr-only` si `hideLegend`) |
| `hideLegend` | `boolean` | `true` |

### `SearchInput` — `components/SearchInput.vue`

Champ débouncé (défaut 300 ms) avec bouton « Effacer » ; synchronisation
descendante si le parent réinitialise `modelValue`.

| Prop | Type | Défaut |
|---|---|---|
| `modelValue` | `string` | — |
| `label` | `string` | `'Rechercher'` |
| `placeholder` | `string` | `'Rechercher…'` |
| `debounce` | `number` | `300` |
| `inputId` | `string` | `'search-input'` |

Emits : `update:modelValue: [string]`.

### `Pagination` — `components/Pagination.vue`

Fenêtre de pages centrée sur la courante, bornée `[1, totalPages]`.

| Prop | Type | Défaut |
|---|---|---|
| `modelValue` | `number` | — (page 1-based) |
| `totalPages` | `number` | — |
| `maxPages` | `number` | `5` |
| `label` | `string` | `'Pagination'` |

Emits : `update:modelValue: [number]`.

### `StatsCounter` — `components/StatsCounter.vue`

Compteurs animés déclenchés par `useIntersectionObserver` (seuil 0.3),
format `fr-FR` via `formatNumber`.

| Prop | Type | Défaut |
|---|---|---|
| `stats` | `StatItem[]` | — (`{ value, label, suffix? }`) |
| `duration` | `number` | `1500` (ms) |

Grille adaptative : 2 stats → 2 colonnes, 4 → 2×2 mobile puis 4 colonnes desktop.

### `ContactForm` — `components/forms/ContactForm.vue`

Validation locale (champs requis + `@`), envoi `formStore.submitContact()`,
toasts de succès/erreur (`appStore`), erreurs en `role="alert"`, confirmation en
`aria-live`. **Props/slots/emits** : aucun (état interne).

---

## Pages

10 vues dans `src/pages/`, une par route + `NotFoundView`
(voir la table des routes dans [`ARCHITECTURE.md`](../ARCHITECTURE.md#4-routage-vue-router-4)) :

`HomeView` · `AssociationsView` · `EventsView` · `NewsView` · `AboutView` ·
`ContactView` · `LegalView` · `VolunteerView` · `AdhesionView` · `NotFoundView`

Responsabilités typiques : charger `dataStore.loadAll()`, filtrer/paginer localement,
synchroniser les filtres avec l'URL (débouncés), ouvrir les fiches en modale,
injecter le JSON-LD (`NewsView`), orchestrer les formulaires (`VolunteerView`,
`AdhesionView`, `ContactView`).

---

## Conventions

1. **`v-model`** = `modelValue` + `update:modelValue` (un seul composant émet
   plusieurs v-models : `CategoryFilter` avec `update:selected`).
2. **Props commentées** en TSDoc dans le SFC *et* dans ce catalogue.
3. **Accessibilité** : id auto (`useId`), `role="alert"` erreurs, `aria-live`
   confirmations, focus trap sur toute couche superposée.
4. **Tests** : `tests/components/ui/` (`BaseButton`, `BaseInput`, `Stepper`).
5. Ajout d'un composant → mettre à jour ce catalogue + ajouter ses tests.
