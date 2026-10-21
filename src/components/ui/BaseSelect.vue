<script setup lang="ts">
/**
 * Sélecteur natif TEC : label, aide, erreur et ARIA complets.
 */
import { computed, useId } from 'vue';

/** Option d'un `BaseSelect` */
export interface SelectOption {
  /** Valeur de l'option */
  value: string;
  /** Libellé affiché */
  label: string;
  /** Option désactivée */
  disabled?: boolean;
}

interface Props {
  /** Valeur sélectionnée (v-model) */
  modelValue: string;
  /** Libellé visible du champ */
  label: string;
  /** Options du sélecteur */
  options: SelectOption[];
  /** Option vide d'invite (value="") */
  placeholder?: string;
  /** Message d'aide affiché sous le champ */
  hint?: string;
  /** Message d'erreur (affiché + `aria-invalid`) */
  error?: string;
  /** Champ obligatoire */
  required?: boolean;
  /** Désactive le champ */
  disabled?: boolean;
  /** Identifiant accessible imposé (repli sur un id auto) */
  selectId?: string;
  /** Nom technique du champ */
  name?: string;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: undefined,
  hint: undefined,
  error: undefined,
  required: false,
  disabled: false,
  selectId: undefined,
  name: undefined,
});

const emit = defineEmits<{ 'update:modelValue': [string] }>();

const autoId = useId();
const id = computed(() => props.selectId ?? `select-${autoId}`);
const hintId = computed(() => `${id.value}-hint`);
const errorId = computed(() => `${id.value}-error`);

const describedBy = computed(() =>
  [props.hint ? hintId.value : null, props.error ? errorId.value : null].filter(Boolean).join(' ')
);

function onChange(event: Event): void {
  emit('update:modelValue', (event.target as HTMLSelectElement).value);
}
</script>

<template>
  <div class="w-full">
    <label :for="id" class="block text-xs font-medium text-gray-300 mb-1">
      {{ label }}
      <span v-if="required" class="text-brand-red-light" aria-hidden="true">*</span>
    </label>
    <select
      :id="id"
      class="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white transition-colors focus:border-brand-red appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      :class="error ? 'border-rose-500/70' : ''"
      :value="modelValue"
      :required="required"
      :disabled="disabled"
      :name="name"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="describedBy || undefined"
      @change="onChange"
    >
      <option v-if="placeholder !== undefined" value="" disabled>{{ placeholder }}</option>
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
    <p v-if="hint" :id="hintId" class="mt-1 text-xs text-gray-500">
      {{ hint }}
    </p>
    <p v-if="error" :id="errorId" class="mt-1 text-xs text-rose-400" role="alert">
      {{ error }}
    </p>
  </div>
</template>
