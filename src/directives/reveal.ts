import type { Directive } from 'vue';

/** Décalage entre deux éléments d'une même série (ms). */
const STAGGER_MS = 60;
/** Rang maximal pris en compte : au-delà, pas d'attente supplémentaire. */
const MAX_STAGGER_INDEX = 5;

let observer: IntersectionObserver | null = null;

/** Observer partagé par tous les éléments `v-reveal` (créé à la demande). */
function getObserver(): IntersectionObserver {
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-revealed');
        observer?.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.1 }
  );
  return observer;
}

/**
 * Révèle un élément à sa première entrée dans le viewport (fondu + montée de
 * 12px, cf. `.reveal` dans main.css). La valeur optionnelle est le rang de
 * l'élément dans une série, pour un léger décalage en cascade.
 *
 * Sans IntersectionObserver, l'élément reste simplement visible.
 *
 * @example
 * <EventCard v-for="(event, i) in events" :key="event.id" v-reveal="i" />
 */
export const vReveal: Directive<HTMLElement, number | undefined> = {
  mounted(el, { value }) {
    if (typeof IntersectionObserver === 'undefined') return;
    if (value) {
      el.style.setProperty('--reveal-delay', `${Math.min(value, MAX_STAGGER_INDEX) * STAGGER_MS}ms`);
    }
    el.classList.add('reveal');
    getObserver().observe(el);
  },
  unmounted(el) {
    observer?.unobserve(el);
  },
};

declare module 'vue' {
  interface GlobalDirectives {
    /** Révélation au scroll (cf. {@link vReveal}) */
    vReveal: typeof vReveal;
  }
}
