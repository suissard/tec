import { computed, onBeforeUnmount, ref, watch, type ComputedRef, type Ref } from 'vue';

/**
 * Fait compter des valeurs de 0 à leur cible, une seule fois, dès que
 * `trigger` devient vrai (typiquement l'entrée dans le viewport).
 * Respecte `prefers-reduced-motion` (affichage immédiat sans animation).
 * Les cibles restent réactives : une valeur chargée après coup est suivie.
 *
 * @param targets Valeurs cibles
 * @param trigger Déclencheur (ex. `isIntersecting` d'un observer)
 * @param duration Durée de l'animation (ms). Défaut : 1500
 * @returns Valeurs courantes, à 0 tant que l'animation n'a pas démarré
 */
export function useCountUp(
  targets: () => number[],
  trigger: Ref<boolean>,
  duration = 1500
): ComputedRef<number[]> {
  /** Avancement adouci, de 0 à 1 */
  const eased = ref(0);
  let animationFrame = 0;

  function start(): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      eased.value = 1;
      return;
    }

    const startTime = performance.now();
    const tick = (now: number): void => {
      const progress = Math.min((now - startTime) / duration, 1);
      // Décélération douce (ease-out cubic)
      eased.value = 1 - Math.pow(1 - progress, 3);
      if (progress < 1) {
        animationFrame = requestAnimationFrame(tick);
      }
    };
    animationFrame = requestAnimationFrame(tick);
  }

  const stopWatch = watch(trigger, (active) => {
    if (!active) return;
    start();
    stopWatch();
  });

  onBeforeUnmount(() => {
    if (animationFrame) cancelAnimationFrame(animationFrame);
  });

  return computed(() => targets().map((value) => Math.round(value * eased.value)));
}
