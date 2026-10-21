<script setup lang="ts">
/**
 * Champ date TEC (input[type=date]) : label, min/max, aide et erreur ARIA.
 * La valeur est une date ISO `AAAA-MM-JJ` (ou chaîne vide).
 */
import { computed, useId } from 'vue';

interface Props {
  /** Valeur ISO AAAA-MM-JJ (v-model) */
  modelValue: string;
  /** Libellé visible du champ */
  label: string;
  /** Date ISO minimale acceptée */
  min?: string;
  /** Date ISO maximale acceptée */
  max?: string;
  /** Texte d'invite */
  placeholder?: string;
  /** Message d'aide affiché sous le champ */
  hint?: string;
  /** Message d'erreur (affiché + `aria-invalid`) */
  error?: string;
  /** Champ obligatoire */
  required?: boolean;
  /** Désactive le champ */
  disabled?: boolean;
  /** Identifiant accessible imposé */
  inputId?: string;
  /** Nom technique du champ */
  name?: string;
}

const props = withDefaults(defineProps<Props>(), {
  min: undefined,
  max: undefined,
  placeholder: '',
  hint: undefined,
  error: undefined,
  required: false,
  disabled: false,
  inputId: undefined,
  name: undefined,
});

const emit = defineEmits<{ 'update:modelValue': [string] }>();

const autoId = useId();
const id = computed(() => props.inputId ?? `date-${autoId}`);
const hintId = computed(() => `${id.value}-hint`);
const errorId = computed(() => `${id.value}-error`);

const describedBy = computed(() =>
  [props.hint ? hintId.value : null, props.error ? errorId.value : null].filter(Boolean).join(' ')
);

function onChange(event: Event): void {
  emit('update:modelValue', (event.target as HTMLInputElement).value);
}
</script>

<template>
  <div class="w-full">
    <label :for="id" class="block text-xs font-medium text-gray-300 mb-1">
      {{ label }}
      <span v-if="required" class="text-brand-red-light" aria-hidden="true">*</span>
    </label>
    <input
      :id="id"
      type="date"
      class="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white placeholder-gray-500 transition-colors focus:border-brand-red [color-scheme:dark] disabled:opacity-50 disabled:cursor-not-allowed"
      :class="error ? 'border-rose-500/70' : ''"
      :value="modelValue"
      :min="min"
      :max="max"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      :name="name"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="describedBy || undefined"
      @change="onChange"
    />
    <p v-if="hint" :id="hintId" class="mt-1 text-xs text-gray-500">
      {{ hint }}
    </p>
    <p v-if="error" :id="errorId" class="mt-1 text-xs text-rose-400" role="alert">
      {{ error }}
    </p>
  </div>
</template>
