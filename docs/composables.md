# 🧩 Composables — API complète

> Les composables vivent dans [`src/composables/`](../src/composables/) et suivent
> deux patterns distincts — voir [*singleton vs factory*](#patterns).

| Composable | Pattern | État partagé ? | Retour |
|---|---|---|---|
| [`useModal`](#usemodal) | Singleton | ✅ une seule modale globale | `ModalController` |
| [`useCookieConsent`](#usecookieconsent) | Singleton | ✅ un seul consentement | `CookieConsentController` |
| [`useLocalStorage`](#uselocalstorage) | Factory | ❌ par clé | `LocalStorageRef<T>` |
| [`useDebounce`](#usedebounce) | Factory | ❌ par `Ref` | `Ref<T>` |
| [`useFocusTrap`](#usefocustrap) | Factory (side-effect) | ❌ par conteneur | `void` |
| [`useIntersectionObserver`](#useintersectionobserver) | Factory (side-effect) | ❌ par cible | `IntersectionObserverController` |

---

## Patterns

### Singleton — état au niveau module

```ts
const isOpen = ref(false);      // déclaré HORS de la fonction
export function useModal() {
  return { isOpen, … };          // toutes les appels partagent la même Ref
}
```

À utiliser pour **un état applicatif unique** (modale, consentement). Attention :
l'état survit au démontage des composants — c'est voulu ici.

### Factory — état par appel

```ts
export function useLocalStorage<T>(key: string, defaultValue: T) {
  const value = ref(read());    // déclaré DANS la fonction
  …
}
```

À utiliser pour de l'état **local et reproductible** (brouillons, debounce, observers).

---

## `useModal`

**Fichier** : [`src/composables/useModal.ts`](../src/composables/useModal.ts)
**Pattern** : singleton · **Rendu** : `<ModalHost />` (Teleport `body` dans `App.vue`)

Gère le contenu de la modale globale : le composant à afficher et ses props.
Le focus trap, la touche Échap, le lock scroll et les attributs ARIA sont assurés
par `ModalHost`.

### Signature

```ts
function useModal(): ModalController
```

### `ModalController`

| Membre | Type | Description |
|---|---|---|
| `isOpen` | `Ref<boolean>` | État ouvert/fermé |
| `content` | `Ref<Component \| null>` | Composant rendu dans la modale |
| `props` | `Ref<Record<string, unknown>>` | Props transmises au composant |
| `open(component?, props?)` | `(c?: Component \| null, p?: Record<string, unknown>) => void` | Ouvre (composant facultatif = modale simple) |
| `close()` | `() => void` | Ferme |
| `toggle()` | `() => void` | Bascule |

### Exemple

```ts
import { useModal } from '@/composables/useModal';
import AssociationDetailModal from '@/components/AssociationDetailModal.vue';

const modal = useModal();
modal.open(AssociationDetailModal, {
  association,
  title: association.name,   // affiché dans l'en-tête de ModalHost
  size: 'xl',                // 'md' (défaut) | 'xl'
});
```

Dans le contenu : `const { close } = useModal();` puis `close()` sur le bouton
« Fermer ». Les props `title`/`size` sont **absorbées** par `ModalHost`.

---

## `useCookieConsent`

**Fichier** : [`src/composables/useCookieConsent.ts`](../src/composables/useCookieConsent.ts)
**Pattern** : singleton (statut persisté via `useLocalStorage`)

Consentement RGPD : la bannière s'affiche tant que `status === 'pending'`, le SDK
PostHog n'est injecté **qu'après** `accept()` (et seulement si
`VITE_POSTHOG_KEY` est défini — sinon no-op).

### Signature

```ts
function useCookieConsent(): CookieConsentController
```

### `CookieConsentController`

| Membre | Type | Description |
|---|---|---|
| `status` | `Ref<CookieConsentStatus>` | `'granted' \| 'denied' \| 'pending'` |
| `needsConsent` | `ComputedRef<boolean>` | `status === 'pending'` → bannière visible |
| `hasAccepted` | `ComputedRef<boolean>` | `status === 'granted'` → trackers autorisés |
| `accept()` | `() => void` | Persiste `'granted'` + injecte PostHog |
| `decline()` | `() => void` | Persiste `'denied'` |
| `init()` | `() => void` | À appeler au montage : injecte PostHog si déjà accordé |

Clé de stockage : `tec_cookie_consent` (`COOKIE_CONSENT_STORAGE_KEY`).

### Exemple

```ts
// App.vue
const { init } = useCookieConsent();
onMounted(init);   // injection conditionnelle au chargement
```

---

## `useLocalStorage`

**Fichier** : [`src/composables/useLocalStorage.ts`](../src/composables/useLocalStorage.ts)
**Pattern** : factory

Wrapper réactif de `localStorage` : lecture au montage, écriture automatique
(sync profond), tolérance aux environnements sans stockage.

### Signature

```ts
function useLocalStorage<T>(key: string, defaultValue: T): LocalStorageRef<T>
```

### Paramètres & retour

| Paramètre | Type | Description |
|---|---|---|
| `key` | `string` | Clé localStorage |
| `defaultValue` | `T` | Repli (absent, JSON corrompu, stockage désactivé) — cloné (shallow) pour éviter les références partagées |

| Retour | Type | Description |
|---|---|---|
| `value` | `Ref<T>` | Valeur réactive persistée |
| `remove()` | `() => void` | Supprime la clé **sans** la réécrire, restaure le défaut |

### Exemple

```ts
const { value: draft, remove } = useLocalStorage('tec_volunteer_draft', initialDraft);
draft.value = { … };   // écriture immédiate dans localStorage
remove();              // nettoyage après soumission
```

Écriture en `flush: 'sync'` → état toujours cohérent avant rendu. Les erreurs de
quota sont ignorées silencieusement (le reste de l'app continue).

---

## `useDebounce`

**Fichier** : [`src/composables/useDebounce.ts`](../src/composables/useDebounce.ts)
**Pattern** : factory

Publie une `Ref` après `delay` ms sans nouvel événement ; le timer est nettoyé au
détachement du scope.

### Signature

```ts
function useDebounce<T>(source: Ref<T>, delay?: number): Ref<T>
```

| Paramètre | Type | Défaut | Description |
|---|---|---|---|
| `source` | `Ref<T>` | — | Référence observée (saisie, filtre…) |
| `delay` | `number` | `300` | Délai de silence en ms |

**Retour** : nouvelle `Ref<T>` mise à jour avec décalage.

### Exemple

```ts
const query = ref('');
const debounced = useDebounce(query, 300);
watch(debounced, (value) => { /* filtrage réseau/URL */ });
```

Utilisé par `SearchInput` et par la synchronisation filtres → URL des pages
Associations/Événements.

---

## `useFocusTrap`

**Fichier** : [`src/composables/useFocusTrap.ts`](../src/composables/useFocusTrap.ts)
**Pattern** : factory (side-effect pur, retourne `void`)

Piège de focus clavier pour une couche superposée :

- mémorise l'élément focusé à l'activation, donne le focus au premier focusable ;
- `Tab` / `Shift+Tab` cyclent à l'intérieur du conteneur ;
- `Escape` appelle `onEscape` ;
- à la fermeture, restaure le focus initial (si toujours dans le DOM) ;
- `target` est réévalué à chaque changement → compatible `v-if`.

### Signature

```ts
function useFocusTrap(target: Ref<HTMLElement | null>, options?: FocusTrapOptions): void
```

| Option | Type | Défaut | Description |
|---|---|---|---|
| `active` | `boolean \| Ref<boolean>` | `true` | Active le piège (souvent `isOpen`) |
| `onEscape` | `() => void` | — | Callback Échap |
| `restoreFocus` | `boolean` | `true` | Restaure le focus à la fermeture |

### Exemple

```ts
const panelRef = ref<HTMLElement | null>(null);
const isOpen = ref(false);

useFocusTrap(panelRef, {
  active: isOpen,
  onEscape: () => (isOpen.value = false),
});
```

Utilisé par `ModalHost`, le menu mobile de `SiteHeader` et `CookieBanner`.

---

## `useIntersectionObserver`

**Fichier** : [`src/composables/useIntersectionObserver.ts`](../src/composables/useIntersectionObserver.ts)
**Pattern** : factory (side-effect)

Wrapper de `IntersectionObserver` : reveal au scroll, lazy-load, déclenchement
d'animations. L'observer est créé à la demande et déconnecté au démontage.

### Signature

```ts
function useIntersectionObserver(
  target?: Ref<Element | null> | null,
  options?: IntersectionObserverOptions
): IntersectionObserverController
```

| Option | Type | Défaut | Description |
|---|---|---|---|
| `threshold` | `number` | `0.1` | Seuil d'intersection (0 → 1) |
| `root` | `Element \| null` | `null` (viewport) | Racine d'observation |
| `rootMargin` | `string` | `'0px'` | Marge d'observation |
| `immediate` | `boolean` | `true` | Observe `target` au montage |

| Retour | Type | Description |
|---|---|---|
| `isIntersecting` | `Ref<boolean>` | `true` quand la cible entre dans la zone |
| `observe(el)` | `(el: Element \| null \| undefined) => void` | Observe un élément |
| `unobserve(el)` | `(el: Element \| null \| undefined) => void` | Arrête l'observation (reset `isIntersecting`) |
| `start()` | `() => void` | Observe la cible passée au composable |
| `stop()` | `() => void` | Déconnecte totalement |

### Exemple

```ts
const sectionRef = ref<HTMLElement | null>(null);
const { isIntersecting } = useIntersectionObserver(sectionRef, { threshold: 0.3 });

watch(isIntersecting, (visible) => visible && startCounters());
```

Utilisé par `StatsCounter` (compteurs animés) et les animations de reveal.

---

## Vérifier un composable

- Chaque composable expose une **docstring TSDoc** avec `@param`, `@returns`, `@example`.
- Tests associés : `tests/composables/use{Modal,CookieConsent,Debounce,LocalStorage,IntersectionObserver}.test.ts`.
- Un composable ne doit **pas** importer de composant Vue ni de store — il peut en
  revanche en être consommé (ex. `useCookieConsent` utilise `useLocalStorage`).
