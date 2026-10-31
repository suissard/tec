<script setup lang="ts">
/**
 * Bandeau sombre des chiffres clés (affiché en bas de chaque page).
 */
import { computed, ref } from 'vue';

import { useCountUp } from '@/composables/useCountUp';
import { useIntersectionObserver } from '@/composables/useIntersectionObserver';
import { useDataStore } from '@/stores/data';

const dataStore = useDataStore();

const stats = computed(() => [
  { icon: 'users', value: dataStore.associations.length || 10, label: ['Associations', 'membres'] },
  { icon: 'calendar', value: 30, label: ['Événements', 'par an'] },
  { icon: 'gamepad', value: 200, label: ['Joueurs', 'touchés'] },
]);

const bandRef = ref<HTMLElement | null>(null);
const { isIntersecting } = useIntersectionObserver(bandRef, { threshold: 0.4 });

/** Chiffres qui comptent de 0 à leur valeur à l'apparition du bandeau. */
const displayed = useCountUp(() => stats.value.map((stat) => stat.value), isIntersecting, 1200);
</script>

<template>
  <section ref="bandRef" class="bg-[#232323] border-t-4 border-white/80" aria-label="Chiffres clés">
    <ul class="max-w-5xl mx-auto px-4 py-6 grid gap-6 md:grid-cols-3 md:divide-x md:divide-white/40">
      <li v-for="(stat, index) in stats" :key="stat.icon" class="stat flex items-center justify-center gap-3 text-white">
        <svg class="h-10 w-10 text-brand-red" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
          <template v-if="stat.icon === 'users'"><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.5-3.5 3.2-5.5 6.5-5.5s6 2 6.5 5.5" /><circle cx="17" cy="9" r="2.5" /><path d="M16 14.5c3 0 5 1.8 5.5 4.5" /></template>
          <template v-else-if="stat.icon === 'calendar'"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4M7 14h2M11 14h2M15 14h2M7 17h2M11 17h2" /></template>
          <template v-else><rect x="2" y="7" width="20" height="11" rx="5" /><path d="M7 10.5v4M5 12.5h4" /><circle cx="15.5" cy="11.5" r=".8" /><circle cx="17.5" cy="13.5" r=".8" /></template>
        </svg>
        <span class="font-bebas text-5xl tabular-nums">+{{ displayed[index] }}</span>
        <span class="text-xs font-bold uppercase leading-tight">{{ stat.label[0] }}<br />{{ stat.label[1] }}</span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.stat svg {
  transition: transform 0.3s;
}
.stat:hover svg {
  transform: scale(1.15) rotate(-6deg);
}
</style>
