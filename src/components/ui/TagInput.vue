<script setup lang="ts">
/**
 * Saisie de tags avec autocomplétion.
 * - Entrée ou virgule : ajoute la saisie courante
 * - Flèches haut/bas + Entrée : sélection dans les suggestions
 * - Clic (ou Entrée) sur un tag : suppression
 */
import { computed, nextTick, ref } from 'vue';

interface Props {
  /** Tags sélectionnés (v-model) */
  modelValue: string[];
  /** Texte d'invite */
  placeholder?: string;
  /** Suggestions d'autocomplétion */
  suggestions?: string[];
  /** Nombre maximum de tags (0 = illimité) */
  maxTags?: number;
  /** Identifiant accessible du champ */
  inputId?: string;
  /** Mode lecture seule : affiche les tags sans saisie ni suppression */
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Ajouter un élément…',
  suggestions: () => [],
  maxTags: 0,
  inputId: undefined,
  readonly: false,
});

const emit = defineEmits<{ 'update:modelValue': [string[]] }>();

const inputValue = ref('');
const activeIndex = ref(-1);
const showSuggestions = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);

/**
 * Liste défensive des tags : un parent peut monter le composant avant d'avoir
 * fourni un tableau (ex. formulaire à onglets dont le modèle n'est pas encore
 * initialisé). Évite un crash de rendu sur `modelValue.length`.
 */
const tags = computed<string[]>(() =>
  Array.isArray(props.modelValue) ? props.modelValue : []
);

/** Suggestions non encore sélectionnées, filtrées par la saisie courante */
const filteredSuggestions = computed(() => {
  const needle = inputValue.value.trim().toLowerCase();
  return props.suggestions
    .filter((suggestion) => !tags.value.includes(suggestion))
    .filter((suggestion) => !needle || suggestion.toLowerCase().includes(needle))
    .slice(0, 8);
});

const canAddMore = computed(() => props.maxTags === 0 || tags.value.length < props.maxTags);

function addTag(value: string): void {
  const tag = value.trim();
  if (!tag || !canAddMore.value) return;
  if (tags.value.includes(tag)) {
    inputValue.value = '';
    activeIndex.value = -1;
    return;
  }
  emit('update:modelValue', [...tags.value, tag]);
  inputValue.value = '';
  activeIndex.value = -1;
}

function removeTag(index: number): void {
  const next = tags.value.filter((_, position) => position !== index);
  emit('update:modelValue', next);
  nextTick(() => inputRef.value?.focus());
}

function onInput(): void {
  activeIndex.value = -1;
  showSuggestions.value = true;
}

function onKeydown(event: KeyboardEvent): void {
  const suggestions = filteredSuggestions.value;

  if (event.key === 'ArrowDown' && suggestions.length > 0) {
    event.preventDefault();
    showSuggestions.value = true;
    activeIndex.value = (activeIndex.value + 1) % suggestions.length;
    return;
  }
  if (event.key === 'ArrowUp' && suggestions.length > 0) {
    event.preventDefault();
    activeIndex.value = activeIndex.value <= 0 ? suggestions.length - 1 : activeIndex.value - 1;
    return;
  }
  if (event.key === 'Enter') {
    event.preventDefault();
    if (activeIndex.value >= 0 && suggestions[activeIndex.value]) {
      addTag(suggestions[activeIndex.value]);
    } else {
      addTag(inputValue.value);
    }
    showSuggestions.value = false;
    return;
  }
  if (event.key === ',' || event.key === ';') {
    event.preventDefault();
    addTag(inputValue.value);
    return;
  }
  if (event.key === 'Backspace' && inputValue.value === '' && tags.value.length > 0) {
    removeTag(tags.value.length - 1);
    return;
  }
  if (event.key === 'Escape') {
    showSuggestions.value = false;
    activeIndex.value = -1;
  }
}

function onBlur(): void {
  // Délai court pour laisser le clic sur une suggestion s'exécuter
  window.setTimeout(() => {
    showSuggestions.value = false;
  }, 150);
}
</script>

<template>
  <div class="relative">
    <div
      class="w-full rounded-lg bg-white/5 border border-white/10 px-2 py-1.5 flex flex-wrap gap-2 items-center"
      :class="readonly ? '' : 'focus-within:border-brand-red transition-colors'"
      @click="readonly ? undefined : inputRef?.focus()"
    >
      <span
        v-for="(tag, index) in tags"
        :key="tag"
        class="inline-flex items-center gap-1.5 rounded-md bg-brand-red/15 border border-brand-red/40 px-2 py-0.5 text-xs text-gray-100"
      >
        {{ tag }}
        <button
          v-if="!readonly"
          type="button"
          class="text-brand-red-light hover:text-white transition-colors"
          :aria-label="`Retirer ${tag}`"
          @click.stop="removeTag(index)"
        >
          ✕
        </button>
      </span>

      <input
        v-if="!readonly"
        :id="inputId"
        ref="inputRef"
        v-model="inputValue"
        type="text"
        role="combobox"
        class="flex-1 min-w-[8rem] bg-transparent border-0 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-0 py-0.5"
        :placeholder="tags.length === 0 ? placeholder : ''"
        :aria-expanded="showSuggestions && filteredSuggestions.length > 0"
        :aria-controls="inputId ? `${inputId}-listbox` : undefined"
        :aria-autocomplete="'list'"
        :aria-activedescendant="
          inputId && activeIndex >= 0 ? `${inputId}-option-${activeIndex}` : undefined
        "
        @input="onInput"
        @keydown="onKeydown"
        @blur="onBlur"
        @focus="showSuggestions = true"
      />
    </div>

    <ul
      v-if="showSuggestions && filteredSuggestions.length > 0"
      :id="inputId ? `${inputId}-listbox` : undefined"
      role="listbox"
      class="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border border-brand-card-border bg-brand-card-bg shadow-xl"
    >
      <li
        v-for="(suggestion, index) in filteredSuggestions"
        :id="inputId ? `${inputId}-option-${index}` : undefined"
        :key="suggestion"
        role="option"
        :aria-selected="index === activeIndex"
        class="px-3 py-2 text-sm cursor-pointer transition-colors"
        :class="
          index === activeIndex ? 'bg-brand-red/20 text-white' : 'text-gray-300 hover:bg-white/5'
        "
        @mousedown.prevent="addTag(suggestion)"
      >
        {{ suggestion }}
      </li>
    </ul>

    <p v-if="maxTags > 0" class="mt-1 text-xs text-gray-500">
      {{ tags.length }} / {{ maxTags }} maximum
    </p>
  </div>
</template>
