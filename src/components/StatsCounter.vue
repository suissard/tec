<script setup lang="ts">
/**
 * Bandeau de statistiques animées : chaque compteur s'incrémente de 0 à sa
 * valeur lorsque la section entre dans le viewport (IntersectionObserver).
 * Respecte `prefers-reduced-motion` (affichage immédiat sans animation).
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue';

import { useIntersectionObserver } from '@/composables/useIntersectionObserver';
import { formatNumber } from '@/utils/helpers';

/** Un compteur affiché dans le bandeau */
export interface StatItem {
  /** Valeur cible */
  value: number;
  /** Libellé sous le compteur */
  label: string;
  /** Suffixe optionnel (« + », « € »…) */
  suffix?: string;
}

interface Props {
  /** Statistiques à afficher */
  stats: StatItem[];
  /** Durée de l'animation (ms) */
  duration?: number;
}

const props = withDefaults(defineProps<Props>(), {
  duration: 1500,
});

const sectionRef = ref<HTMLElement | null>(null);
const { isIntersecting } = useIntersectionObserver(sectionRef, { threshold: 0.3 });

/** Grille adaptative : 4 stats → 2×2 (mobile) puis 4 colonnes (desktop). */
const gridClasses = computed(() => {
  if (props.stats.length === 2) return 'sm:grid-cols-2';
  if (props.stats.length === 4) return 'sm:grid-cols-2 lg:grid-cols-4';
  return 'sm:grid-cols-3';
});

/** Valeurs courantes affichées (initialisées à 0). */
const displayed = ref<number[]>(props.stats.map(() => 0));

let animationFrame = 0;

/** Démore l'animation des compteurs (une seule fois, à la première intersection). */
function startCounters(): void {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    displayed.value = props.stats.map((stat) => stat.value);
    return;
  }

  const start = performance.now();
  const tick = (now: number): void => {
    const progress = Math.min((now - start) / props.duration, 1);
    // Décélération douce (ease-out cubic)
    const eased = 1 - Math.pow(1 - progress, 3);
    displayed.value = props.stats.map((stat) => Math.round(stat.value * eased));
    if (progress < 1) {
      animationFrame = requestAnimationFrame(tick);
    }
  };
  animationFrame = requestAnimationFrame(tick);
}

// Démarre l'animation à la première intersection.
let started = false;
const stopWatch = watch(isIntersecting, (visible) => {
  if (visible && !started) {
    started = true;
    startCounters();
    stopWatch();
  }
});

onBeforeUnmount(() => {
  if (animationFrame) cancelAnimationFrame(animationFrame);
});
</script>

<template>
  <section
    ref="sectionRef"
    class="max-w-6xl mx-auto px-4 py-12 md:py-16"
    aria-label="Chiffres clés du réseau"
  >
    <dl class="grid grid-cols-1 gap-6" :class="gridClasses">
      <div
        v-for="(stat, index) in stats"
        :key="stat.label"
        class="glass-card rounded-2xl p-6 text-center"
      >
        <dt class="text-sm uppercase tracking-wider text-gray-400">{{ stat.label }}</dt>
        <dd class="mt-2 font-bebas text-5xl text-white glow-text">
          {{ formatNumber(displayed[index] ?? 0) }}<span v-if="stat.suffix">{{ stat.suffix }}</span>
        </dd>
      </div>
    </dl>
  </section>
</template>
