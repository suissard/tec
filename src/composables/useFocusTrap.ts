import { onBeforeUnmount, watch, type Ref } from 'vue';

/** Sélecteur des éléments recevant le focus au clavier. */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/** Options de {@link useFocusTrap}. */
export interface FocusTrapOptions {
  /** Piège actif ou non (booléen ou ref réactive — ex. `isOpen`). */
  active?: boolean | Ref<boolean>;
  /** Appelé lorsque l'utilisateur presse la touche Échap. */
  onEscape?: () => void;
  /** Restaure le focus initial à la fermeture (défaut : `true`). */
  restoreFocus?: boolean;
}

/**
 * Piège de focus clavier pour une couche superposée (modale, tiroir, menu mobile).
 *
 * - À l'activation : mémorise l'élément focusé puis donne le focus au premier
 *   élément focusable du conteneur (ou au conteneur lui-même s'il est vide) ;
 * - Tab / Shift+Tab cyclent à l'intérieur du conteneur ;
 * - Échap déclenche `onEscape` ;
 * - À la fermeture : le focus revient à l'élément mémorisé (si toujours dans le DOM).
 *
 * `target` est réévalué à chaque changement d'état, ce qui permet de l'utiliser
 * avec un conteneur monté/démonté via `v-if`.
 *
 * @param target Conteneur piégé (`Ref<HTMLElement | null>`)
 * @param options `{ active?, onEscape?, restoreFocus? }`
 * @returns `{void}` — l'activation/désactivation est pilotée par `options.active`
 * @example
 * const panelRef = ref<HTMLElement | null>(null);
 * useFocusTrap(panelRef, { active: isOpen, onEscape: () => (isOpen.value = false) });
 */
export function useFocusTrap(
  target: Ref<HTMLElement | null>,
  options: FocusTrapOptions = {}
): void {
  const { active = true, onEscape, restoreFocus = true } = options;

  let previouslyFocused: HTMLElement | null = null;
  let listenerAttached = false;

  function isActive(): boolean {
    return typeof active === 'boolean' ? active : active.value;
  }

  /** Éléments focusable réellement visibles dans le conteneur. */
  function getFocusable(): HTMLElement[] {
    const container = target.value;
    if (!container) return [];
    return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
      (element) => element.getClientRects().length > 0
    );
  }

  function focusFirst(): void {
    const container = target.value;
    if (!container) return;
    const focusables = getFocusable();
    if (focusables.length > 0) {
      focusables[0].focus({ preventScroll: true });
    } else if (container.hasAttribute('tabindex') || container.tagName === 'A') {
      container.focus({ preventScroll: true });
    }
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (!isActive()) return;

    if (event.key === 'Escape') {
      onEscape?.();
      return;
    }

    if (event.key !== 'Tab') return;

    const container = target.value;
    if (!container) return;

    const focusables = getFocusable();
    if (focusables.length === 0) {
      event.preventDefault();
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const activeElement = document.activeElement;
    const isOutside = activeElement === null || !container.contains(activeElement);

    if (event.shiftKey) {
      if (isOutside || activeElement === first) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      }
    } else if (isOutside || activeElement === last) {
      event.preventDefault();
      first.focus({ preventScroll: true });
    }
  }

  function activate(): void {
    if (!listenerAttached) {
      previouslyFocused =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      document.addEventListener('keydown', handleKeydown, true);
      listenerAttached = true;
    }
    focusFirst();
  }

  function deactivate(): void {
    if (!listenerAttached) return;

    document.removeEventListener('keydown', handleKeydown, true);
    listenerAttached = false;

    const toRestore = previouslyFocused;
    previouslyFocused = null;
    if (restoreFocus && toRestore && document.contains(toRestore)) {
      toRestore.focus({ preventScroll: true });
    }
  }

  // `flush: 'post'` : le callback s'exécute après le rendu DOM, donc `target`
  // est renseigné quand le conteneur est piloté par `v-if`.
  watch(
    [() => isActive(), target],
    ([nowActive]) => {
      if (nowActive) {
        activate();
      } else {
        deactivate();
      }
    },
    { immediate: true, flush: 'post' }
  );

  onBeforeUnmount(deactivate);
}
