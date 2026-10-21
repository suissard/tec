<script setup lang="ts">
/**
 * Champ de saisie générique TEC : label, aide, erreur et ARIA complets
 * (`aria-invalid`, `aria-describedby` liant hint + erreur).
 */
import { computed, useId } from 'vue';

interface Props {
  /** Valeur du champ (v-model) */
  modelValue: string;
  /** Libellé visible du champ */
  label: string;
  /** Type natif de l'input (text, email, tel, url…) */
  type?: string;
  /** Attribut `autocomplete` natif */
  autocomplete?: string;
  /** Texte d'invite (placeholder) */
  placeholder?: string;
  /** Message d'aide affiché sous le champ */
  hint?: string;
  /** Message d'erreur (affiché + `aria-invalid`) */
  error?: string;
  /** Champ obligatoire (astérisque + `required`) */
  required?: boolean;
  /** Désactive le champ */
  disabled?: boolean;
  /** Identifiant accessible imposé (repli sur un id auto) */
  inputId?: string;
  /** Nom technique du champ (formulaire natif) */
  name?: string;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  autocomplete: 'off',
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
const id = computed(() => props.inputId ?? `input-${autoId}`);
const hintId = computed(() => `${id.value}-hint`);
const errorId = computed(() => `${id.value}-error`);

/** Liste des ids décrits par l'input (aide puis erreur). */
const describedBy = computed(() =>
  [props.hint ? hintId.value : null, props.error ? errorId.value : null].filter(Boolean).join(' ')
);

function onInput(event: Event): void {
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
      class="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white placeholder-gray-500 transition-colors focus:border-brand-red disabled:opacity-50 disabled:cursor-not-allowed"
      :class="error ? 'border-rose-500/70' : ''"
      :type="type"
      :value="modelValue"
      :autocomplete="autocomplete"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      :name="name"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="describedBy || undefined"
      @input="onInput"
    />
    <p v-if="hint" :id="hintId" class="mt-1 text-xs text-gray-500">
      {{ hint }}
    </p>
    <p v-if="error" :id="errorId" class="mt-1 text-xs text-rose-400" role="alert">
      {{ error }}
    </p>
  </div>
</template>
