<script setup lang="ts">
/**
 * Filtre par catégories en puces (chips) TEC : radios stylisés,
 * défilement horizontal sur mobile.
 * Deux modes de pilotage :
 * - `v-model` (chaîne) : sélection unique (radios) ;
 * - `v-model:selected` (tableau) : sélection multiple (cases à cocher).
 */
import { computed, useId } from 'vue';

/** Option d'un `CategoryFilter` */
export interface CategoryOption {
  /** Identifiant de la catégorie */
  id: string;
  /** Libellé affiché */
  label: string;
  /** Nombre d'éléments (affiché à côté du libellé) */
  count?: number;
}

interface Props {
  /** Identifiant de la catégorie sélectionnée (v-model) — mode radio */
  modelValue?: string;
  /** Identifiants sélectionnés (v-model:selected) — active le mode multiple */
  selected?: string[];
  /** Options de filtre */
  options: CategoryOption[];
  /** Légende accessible du groupe */
  legend: string;
  /** Masque visuellement la légende */
  hideLegend?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  hideLegend: true,
});

const emit = defineEmits<{
  'update:modelValue': [string];
  'update:selected': [string[]];
}>();

const groupName = useId();

/** Vrai dès que `selected` est fourni : les puces deviennent des checkboxes. */
const isMultiple = computed(() => props.selected !== undefined);

/** Liste courante des sélections multiples (jamais `undefined`). */
const currentSelection = computed(() => props.selected ?? []);

/** État coché d'une option selon le mode de pilotage. */
function isChecked(optionId: string): boolean {
  return isMultiple.value
    ? currentSelection.value.includes(optionId)
    : props.modelValue === optionId;
}

/** Bascule (multiple) ou remplace (unique) la sélection courante. */
function onSelect(optionId: string): void {
  if (isMultiple.value) {
    const selection = currentSelection.value;
    emit(
      'update:selected',
      selection.includes(optionId)
        ? selection.filter((id) => id !== optionId)
        : [...selection, optionId]
    );
    return;
  }
  emit('update:modelValue', optionId);
}
</script>

<template>
  <fieldset class="min-w-0 border-0 p-0 m-0">
    <legend
      class="block text-xs font-medium text-gray-300 mb-2"
      :class="hideLegend ? 'sr-only' : ''"
    >
      {{ legend }}
    </legend>
    <div
      class="flex flex-wrap gap-2"
      :role="isMultiple ? 'group' : 'radiogroup'"
      :aria-label="legend"
    >
      <label v-for="option in options" :key="option.id" class="shrink-0 cursor-pointer">
        <input
          :type="isMultiple ? 'checkbox' : 'radio'"
          class="peer sr-only"
          :name="isMultiple ? `${groupName}-${option.id}` : groupName"
          :value="option.id"
          :checked="isChecked(option.id)"
          @change="onSelect(option.id)"
        />
        <span
          class="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand-red peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-brand-dark"
          :class="
            isChecked(option.id)
              ? 'border-brand-red bg-brand-red/15 text-white'
              : 'border-brand-card-border bg-white/5 text-gray-300 hover:border-brand-red/50 hover:text-white'
          "
        >
          {{ option.label }}
          <span
            v-if="typeof option.count === 'number'"
            class="rounded-full bg-white/10 px-1.5 text-[10px] text-gray-300"
          >
            {{ option.count }}
          </span>
        </span>
      </label>
    </div>
  </fieldset>
</template>
