<script setup lang="ts">
/**
 * Zone de texte TEC : label, aide, erreur, compteur de caractères (maxlength).
 */
import { computed, useId } from 'vue';

interface Props {
  /** Valeur de la zone de texte (v-model) */
  modelValue: string;
  /** Libellé visible du champ */
  label: string;
  /** Nombre de lignes visibles */
  rows?: number;
  /** Longueur maximale (affiche le compteur) */
  maxlength?: number;
  /** Texte d'invite (placeholder) */
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
  inputId?: string;
  /** Nom technique du champ */
  name?: string;
}

const props = withDefaults(defineProps<Props>(), {
  rows: 5,
  maxlength: undefined,
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
const id = computed(() => props.inputId ?? `textarea-${autoId}`);
const hintId = computed(() => `${id.value}-hint`);
const errorId = computed(() => `${id.value}-error`);

const showCounter = computed(() => typeof props.maxlength === 'number' && props.maxlength > 0);

const describedBy = computed(() => {
  const ids = [
    props.hint ? hintId.value : null,
    props.error ? errorId.value : null,
    showCounter.value ? counterId.value : null,
  ];
  return ids.filter(Boolean).join(' ');
});

const counterId = computed(() => `${id.value}-counter`);

function onInput(event: Event): void {
  emit('update:modelValue', (event.target as HTMLTextAreaElement).value);
}
</script>

<template>
  <div class="w-full">
    <label :for="id" class="block text-xs font-medium text-gray-300 mb-1">
      {{ label }}
      <span v-if="required" class="text-brand-red-light" aria-hidden="true">*</span>
    </label>
    <textarea
      :id="id"
      class="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white placeholder-gray-500 transition-colors focus:border-brand-red resize-y disabled:opacity-50 disabled:cursor-not-allowed"
      :class="error ? 'border-rose-500/70' : ''"
      :value="modelValue"
      :rows="rows"
      :maxlength="maxlength"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      :name="name"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="describedBy || undefined"
      @input="onInput"
    ></textarea>
    <div class="mt-1 flex items-start justify-between gap-4">
      <div class="min-w-0">
        <p v-if="hint" :id="hintId" class="text-xs text-gray-500">{{ hint }}</p>
        <p v-if="error" :id="errorId" class="text-xs text-rose-400" role="alert">{{ error }}</p>
      </div>
      <p
        v-if="showCounter"
        :id="counterId"
        class="shrink-0 text-xs text-gray-500"
        aria-live="polite"
      >
        {{ modelValue.length }} / {{ maxlength }}
      </p>
    </div>
  </div>
</template>
