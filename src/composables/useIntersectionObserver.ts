import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue';

/** Options de {@link useIntersectionObserver}. */
export interface IntersectionObserverOptions {
  /** Seuil d'intersection (0 à 1). Défaut : 0.1 */
  threshold?: number;
  /** Racine d'observation. Défaut : viewport */
  root?: Element | null;
  /** Marge d'observation. Défaut : "0px" */
  rootMargin?: string;
  /** Observe automatiquement `target` au montage. Défaut : true */
  immediate?: boolean;
}

/** Contrôleur retourné par {@link useIntersectionObserver}. */
export interface IntersectionObserverController {
  /** Vrai quand l'élément observé entre dans le viewport */
  isIntersecting: Ref<boolean>;
  /** Démarre l'observation d'un élément */
  observe: (element: Element | null | undefined) => void;
  /** Arrête l'observation d'un élément */
  unobserve: (element: Element | null | undefined) => void;
  /** Observe la cible passée au composable (utile si `immediate: false`) */
  start: () => void;
  /** Déconnecte l'observer et nettoie */
  stop: () => void;
}

/**
 * Wrapper léger de `IntersectionObserver` (lazy-load d'images, reveal au scroll).
 * L'observer est créé à la demande et détruit automatiquement au démontage.
 *
 * @param target Élément à observer (optionnel si `observe()` est appelé manuellement)
 * @param options `{ threshold?, root?, rootMargin?, immediate? }`
 * @returns `{ isIntersecting, observe, unobserve, start, stop }`
 * @example
 * const cardRef = ref<HTMLElement | null>(null);
 * const { isIntersecting } = useIntersectionObserver(cardRef, { threshold: 0.3 });
 */
export function useIntersectionObserver(
  target?: Ref<Element | null> | null,
  options: IntersectionObserverOptions = {}
): IntersectionObserverController {
  const { threshold = 0.1, root = null, rootMargin = '0px', immediate = true } = options;

  const isIntersecting = ref(false);
  let observer: IntersectionObserver | null = null;

  function ensureObserver(): IntersectionObserver | null {
    if (observer || typeof IntersectionObserver === 'undefined') return observer;
    observer = new IntersectionObserver(
      (entries) => {
        isIntersecting.value = entries.some((entry) => entry.isIntersecting);
      },
      { threshold, root, rootMargin }
    );
    return observer;
  }

  function observe(element: Element | null | undefined): void {
    if (!element || typeof IntersectionObserver === 'undefined') return;
    ensureObserver()?.observe(element);
  }

  function unobserve(element: Element | null | undefined): void {
    if (!element) return;
    observer?.unobserve(element);
    isIntersecting.value = false;
  }

  function start(): void {
    observe(target?.value);
  }

  function stop(): void {
    observer?.disconnect();
    observer = null;
    isIntersecting.value = false;
  }

  onMounted(() => {
    if (immediate) start();
  });

  onBeforeUnmount(stop);

  return { isIntersecting, observe, unobserve, start, stop };
}
