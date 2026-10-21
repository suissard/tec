<script setup lang="ts">
/**
 * Pagination TEC accessible : `<nav aria-label>`, `aria-current="page"`,
 * fenêtre de `maxPages` pages autour de la page courante.
 */
import { computed } from 'vue';

interface Props {
  /** Page courante (1-based, v-model) */
  modelValue: number;
  /** Nombre total de pages */
  totalPages: number;
  /** Largeur de la fenêtre de pages affichées */
  maxPages?: number;
  /** Libellé accessible de la pagination */
  label?: string;
}

const props = withDefaults(defineProps<Props>(), {
  maxPages: 5,
  label: 'Pagination',
});

const emit = defineEmits<{ 'update:modelValue': [number] }>();

/**
 * Fenêtre de pages à afficher : centrée sur la page courante,
 * bornée à [1, totalPages] et limitée à `maxPages` entrées.
 */
const visiblePages = computed<number[]>(() => {
  const total = Math.max(1, props.totalPages);
  const current = Math.min(Math.max(1, props.modelValue), total);
  const width = Math.max(1, props.maxPages);

  let start = current - Math.floor(width / 2);
  let end = start + width - 1;
  if (start < 1) {
    start = 1;
    end = Math.min(total, width);
  } else if (end > total) {
    end = total;
    start = Math.max(1, total - width + 1);
  }

  const pages: number[] = [];
  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }
  return pages;
});

const hasPrevious = computed(() => props.modelValue > 1);
const hasNext = computed(() => props.modelValue < props.totalPages);

function goTo(page: number): void {
  if (page >= 1 && page <= props.totalPages && page !== props.modelValue) {
    emit('update:modelValue', page);
  }
}
</script>

<template>
  <nav v-if="totalPages > 1" :aria-label="label" class="flex justify-center">
    <ul class="flex items-center gap-1">
      <li>
        <button
          type="button"
          class="rounded-lg px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          :disabled="!hasPrevious"
          :aria-label="`Page précédente (page ${modelValue - 1})`"
          @click="goTo(modelValue - 1)"
        >
          ‹
        </button>
      </li>

      <li v-for="page in visiblePages" :key="page">
        <button
          type="button"
          class="h-9 w-9 rounded-lg text-sm transition-colors"
          :class="
            page === modelValue
              ? 'bg-brand-red text-white font-bold glow-red-sm'
              : 'text-gray-300 hover:text-white hover:bg-white/5'
          "
          :aria-current="page === modelValue ? 'page' : undefined"
          :aria-label="`Page ${page}`"
          @click="goTo(page)"
        >
          {{ page }}
        </button>
      </li>

      <li>
        <button
          type="button"
          class="rounded-lg px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          :disabled="!hasNext"
          :aria-label="`Page suivante (page ${modelValue + 1})`"
          @click="goTo(modelValue + 1)"
        >
          ›
        </button>
      </li>
    </ul>
  </nav>
</template>
