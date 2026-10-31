# 🗄️ Stores Pinia — API complète

> Trois stores Setup (`defineStore('id', () => { … })`), instanciés en **singleton**
> par Pinia. Tout composant y accède via `useXStore()` (appel en top-level du
> `<script setup>`, jamais dans une callback).

Sommaire : [`app`](#store-app) · [`data`](#store-data) · [`forms`](#store-forms)

---

## Store `app`

**Fichier** : [`src/stores/app.ts`](../src/stores/app.ts) — état transverse de
l'interface (hors données métier et formulaires).

### State

| Propriété | Type | Description |
|---|---|---|
| `isMobileMenuOpen` | `ref<boolean>` | Ouverture du menu mobile (header) |
| `isLoading` | `ref<boolean>` | Indicateur de chargement global |
| `toasts` | `ref<Toast[]>` | Pile de notifications visible (max **3**) |

`Toast = { id: string; message: string; type: 'success' | 'error' | 'info' }`

### Getters

Aucun (l'état est déjà minimal).

### Actions

| Action | Signature | Retour | Description |
|---|---|---|---|
| `toggleMobileMenu` | `(): void` | `{void}` | Bascule l'état du menu mobile |
| `openMobileMenu` | `(): void` | `{void}` | Ouvre le menu mobile |
| `closeMobileMenu` | `(): void` | `{void}` | Ferme le menu mobile |
| `setLoading` | `(value: boolean): void` | `{void}` | Active/désactive l'indicateur global |
| `showToast` | `(message: string, type?: ToastType): void` | `{void}` | Ajoute un toast auto-masqué après `TOAST_DURATION` (4000 ms) ; la pile est bornée à 3 (les plus anciens sont retirés et leur timer nettoyé) |
| `hideToast` | `(id?: string): void` | `{void}` | Masque le toast `id`, ou **tous** les toasts si `id` est omis (timers compris) |

```ts
import { useAppStore } from '@/stores/app';

const appStore = useAppStore();
appStore.showToast('Message envoyé !', 'success');
appStore.closeMobileMenu();
```

**Effets de bord** : timers (`setTimeout`) stockés dans une `Map` module — un
retour de `showToast` avec un message identique recrée un toast (id unique).

---

## Store `data`

**Fichier** : [`src/stores/data.ts`](../src/stores/data.ts) — source unique des
données métier (JSON locaux chargés via `services/api.ts`).

### State

| Propriété | Type | Description |
|---|---|---|
| `associations` | `ref<Association[]>` | Contenu de `src/data/associations.json` |
| `events` | `ref<EventItem[]>` | Contenu de `src/data/evenements.json` |
| `news` | `ref<NewsItem[]>` | Contenu de `src/data/news.json` |
| `loading` | `ref<boolean>` | `true` pendant `loadAll()` |
| `error` | `ref<string \| null>` | Message d'erreur (jamais de throw vers l'appelant) |

### Getters (`computed`)

| Getter | Type | Description |
|---|---|---|
| `sortedEvents` | `ComputedRef<EventItem[]>` | Événements du plus proche au plus lointain |
| `sortedNews` | `ComputedRef<NewsItem[]>` | Actualités de la plus récente à la plus ancienne |
| `isLoaded` | `ComputedRef<boolean>` | `true` si les 3 jeux sont remplis (sert de cache) |

### Actions

| Action | Signature | Retour | Description |
|---|---|---|---|
| `getAssociationBySlug` | `(slug: string)` | `Association \| undefined` | Trouve une association par son `id` JSON ; `undefined` si `slug` vide ou absent |
| `getUpcomingEvents` | `(limit?: number)` | `EventItem[]` | Événements avec `date >= aujourd'hui`, tri croissant, tronqués à `limit` si fourni |
| `getLatestNews` | `(limit?: number)` | `NewsItem[]` | Actualités par date décroissante, tronquées à `limit` si fourni |
| `getEventsByCategory` | `(category: string)` | `EventItem[]` | Filtre par catégorie (casse et accents ignorés) ; chaîne vide = tous |
| `searchAssociations` | `(query: string)` | `Association[]` | Recherche multi-termes sur `name`, `description`, `games`, `category` — **tous** les termes doivent correspondre (`AND`) |
| `loadAll` | `(options?: { force?: boolean })` | `Promise<void>` | `Promise.all` des 3 fetch ; no-op si `isLoaded` sauf `force: true` ; renseigne `error` en cas d'échec |
| `forceRefresh` | `()` | `Promise<void>` | Recharge systématiquement (`loadAll({ force: true })`) |
| `clear` | `()` | `{void}` | Vide les listes, `loading`, `error` |

```ts
import { useDataStore } from '@/stores/data';

const dataStore = useDataStore();
await dataStore.loadAll();                 // appelé une fois par page

const events = dataStore.getUpcomingEvents(3);
const results = dataStore.searchAssociations('rétro toulouse');
```

**Normalisation** : `normalize()` (module privé) supprime les accents
(`NFD`) et met en minuscules pour la recherche et les filtres.

---

## Store `forms`

**Fichier** : [`src/stores/forms.ts`](../src/stores/forms.ts) — formulaires
(contact, bénévolat, adhésion), validation Zod et persistance `localStorage`.
Documentation des schémas : [`docs/forms.md`](./forms.md).

### State

Chaque formulaire expose **ses données** (`reactive`) et **son état de soumission** :

| Formulaire | Données | État |
|---|---|---|
| Contact | `contact: ContactFormData` | `contactState: FormSubmissionState` |
| Bénévolat | `volunteer: VolunteerFormData` | `volunteerState: FormSubmissionState` |
| Adhésion | `adhesionIndiv: AdhesionIndivData`, `adhesionAsso: AdhesionAssoData` | `adhesionState: FormSubmissionState` (commun aux 2 modes) |

`FormSubmissionState = { submitting: boolean; success: boolean; error: string | null }`

### Constantes exportées

| Export | Type | Contenu |
|---|---|---|
| `VOLUNTEER_INTERESTS` | `readonly string[]` | Domaines d'intérêt : Événementiel, Communication, Technique, Encadrement, Logistique |
| `VOLUNTEER_AVAILABILITIES` | `readonly { id, label }[]` | Journée / Soirée / Week-end |
| `CONTRIBUTION_OPTIONS` | `readonly { value, label }[]` | 1 € membre individuel, 5 € membre sympathisant |
| `PAYMENT_OPTIONS` | `readonly { value, label }[]` | Carte bancaire / Chèque / Virement (stub — aucun paiement en ligne) |

### Actions

| Action | Signature | Retour | Description |
|---|---|---|---|
| `submitContact` | `(data?: ContactFormData)` | `Promise<boolean>` | Synchronise `data` dans le store, valide (champs requis + regex email), persiste dans `tec_contacts`, réinitialise puis `success = true` |
| `submitVolunteer` | `(data?: VolunteerFormData)` | `Promise<boolean>` | Validation **Zod** `volunteerSchema`, persistance `tec_volunteer_draft` → `tec_volunteers`, réinitialisation complète (listes incluses) |
| `submitAdhesion` | `(data, kind: 'indiv' \| 'asso')` | `Promise<boolean>` | Choisit `adhesionIndivSchema` ou `adhesionAssoSchema`, persistance `tec_adhesions` (avec `kind`), réinitialise le formulaire concerné |
| `resetContact` | `()` | `{void}` | Champs + état de soumission |
| `resetVolunteer` | `()` | `{void}` | Champs (`interests`, `availability`, `skills` vidés) + état |
| `resetAdhesionIndiv` | `()` | `{void}` | Champs de l'adhésion particulier |
| `resetAdhesionAsso` | `()` | `{void}` | Champs de l'adhésion structure (`games` vidé) |
| `resetAdhesion` | `()` | `{void}` | Les 2 formulaires d'adhésion + état |
| `isValidEmail` | `(email: string)` | `boolean` | Regex pragmatique `[^\s@]+@[^\s@]+\.[^\s@]+` (exporté pour l'UI) |

**Contrat de retour** : `true` = succès (`state.success = true`, données
réinitialisées) ; `false` = échec (`state.error` = message lisible,
`state.submitting = false`).

**Erreurs de persistance** : un `localStorage` indisponible (mode privé strict,
quota dépassé) produit une erreur métier traduite
(`"Impossible d'enregistrer votre demande (stockage local indisponible)."`).

```ts
import { useAppStore } from '@/stores/app';
import { useFormStore } from '@/stores/forms';

const formStore = useFormStore();
const ok = await formStore.submitVolunteer(draft);

if (ok) appStore.showToast('Candidature envoyée !', 'success');
else error.value = formStore.volunteerState.error;
```

---

## Conventions transverses

1. **Setup stores uniquement** — pas de `state()`/`getters()`/`actions()` options.
2. **Getters = `computed`**, jamais de duplication manuelle d'un état dérivé.
3. **Aucun `console.*`** : les erreurs remontent via `state.error` ou un toast.
4. **Docstrings TSDoc** obligatoires (`@param`, `@returns`) sur chaque action/getter.
5. **Tests** : `tests/stores/{app,data,forms}.test.ts` (couverture ≥ 80 %).
