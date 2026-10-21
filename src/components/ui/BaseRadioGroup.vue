<script setup lang="ts">
/**
 * Groupe de boutons radio TEC : `fieldset` + `legend`, orientation
 * verticale/horizontale, erreur affichée avec `role="alert"`.
 */
import { computed, useId } from 'vue';

import BaseRadio from '@/components/ui/BaseRadio.vue';

/** Option d'un `BaseRadioGroup` */
export interface RadioOption {
  /** Valeur de l'option */
  value: string;
  /** Libellé affiché */
  label: string;
  /** Message d'aide */
  hint?: string;
  /** Option désactivée */
  disabled?: boolean;
}

interface Props {
  /** Valeur sélectionnée (v-model) */
  modelValue: string;
  /** Légende du groupe (fieldset) */
  legend: string;
  /** Options du groupe */
  options: RadioOption[];
  /** Nom technique commun aux boutons */
  name?: string;
  /** Orientation : verticale (défaut) ou horizontale */
  orientation?: 'vertical' | 'horizontal';
  /** Message d'erreur (affiché + `aria-invalid` sur le fieldset) */
  error?: string;
  /** Groupe obligatoire */
  required?: boolean;
  /** Désactive le groupe */
  disabled?: boolean;
  /** Masque visuellement la légende */
  hideLegend?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  name: undefined,
  orientation: 'vertical',
  error: undefined,
  required: false,
  disabled: false,
  hideLegend: false,
});

const emit = defineEmits<{ 'update:modelValue': [string] }>();

const autoId = useId();
const name = computed(() => props.name ?? `radio-group-${autoId}`);
const errorId = computed(() => `${name.value}-error`);
</script>

<template>
  <fieldset
    class="min-w-0 border-0 p-0 m-0"
    :aria-invalid="error ? 'true' : undefined"
    :aria-describedby="error ? errorId : undefined"
  >
    <legend
      class="block text-xs font-medium text-gray-300 mb-2"
      :class="hideLegend ? 'sr-only' : ''"
    >
      {{ legend }}
      <span v-if="required" class="text-brand-red-light" aria-hidden="true">*</span>
    </legend>
    <div
      class="flex gap-3"
      :class="orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap gap-x-6'"
    >
      <BaseRadio
        v-for="option in options"
        :key="option.value"
        :model-value="modelValue"
        :value="option.value"
        :label="option.label"
        :hint="option.hint"
        :name="name"
        :disabled="disabled || option.disabled"
        @update:model-value="emit('update:modelValue', $event)"
      />
    </div>
    <p v-if="error" :id="errorId" class="mt-2 text-xs text-rose-400" role="alert">
      {{ error }}
    </p>
  </fieldset>
</template>
