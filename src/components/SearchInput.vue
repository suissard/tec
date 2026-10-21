<script setup lang="ts">
/**
 * Champ de recherche TEC avec debounce interne de 300 ms.
 * Émet la valeur stabilisée via `update:modelValue` (bouton Effacer inclus).
 */
import { ref, watch } from 'vue';

import { useDebounce } from '@/composables/useDebounce';

interface Props {
  /** Valeur débouncée pilotée par le parent (v-model) */
  modelValue: string;
  /** Libellé accessible du champ */
  label?: string;
  /** Texte d'invite */
  placeholder?: string;
  /** Délai de debounce (ms) */
  debounce?: number;
  /** Identifiant accessible imposé */
  inputId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Rechercher',
  placeholder: 'Rechercher…',
  debounce: 300,
  inputId: 'search-input',
});

const emit = defineEmits<{ 'update:modelValue': [string] }>();

/** Saisie immédiate (non débouncée) */
const query = ref(props.modelValue);
const debouncedQuery = useDebounce(query, props.debounce);

// Synchronisation descendante (ex. réinitialisation par l'URL ou bouton Effacer).
watch(
  () => props.modelValue,
  (value) => {
    if (value !== query.value && value !== debouncedQuery.value) {
      query.value = value;
    }
  }
);

// Remontée débouncée vers le parent.
watch(debouncedQuery, (value) => {
  if (value !== props.modelValue) {
    emit('update:modelValue', value);
  }
});

function clear(): void {
  query.value = '';
  emit('update:modelValue', '');
}
</script>

<template>
  <div class="relative w-full">
    <label :for="inputId" class="block text-xs font-medium text-gray-300 mb-1">
      {{ label }}
    </label>
    <div class="relative">
      <!-- Loupe -->
      <svg
        class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        :id="inputId"
        v-model="query"
        type="search"
        class="w-full rounded-lg bg-white/5 border border-white/10 pl-9 pr-9 py-2.5 text-sm text-white placeholder-gray-500 transition-colors focus:border-brand-red"
        :placeholder="placeholder"
        :aria-label="label"
      />
      <button
        v-if="query.length > 0"
        type="button"
        class="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:text-white transition-colors"
        :aria-label="`Effacer la recherche : ${query}`"
        @click="clear"
      >
        ✕
      </button>
    </div>
  </div>
</template>
