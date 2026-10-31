<script setup lang="ts">
/**
 * Bandeau de statistiques animées : chaque compteur s'incrémente de 0 à sa
 * valeur lorsque la section entre dans le viewport (IntersectionObserver).
 * Respecte `prefers-reduced-motion` (affichage immédiat sans animation).
 */
import { computed, ref } from 'vue';

import { useCountUp } from '@/composables/useCountUp';
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

/** Valeurs courantes affichées (comptent de 0 à la cible à l'apparition). */
const displayed = useCountUp(() => props.stats.map((stat) => stat.value), isIntersecting, props.duration);
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
