<script setup lang="ts">
/**
 * Bouton radio individuel TEC. Usage typique via `BaseRadioGroup`,
 * ce composant reste exporté pour les cas ponctuels.
 */
import { computed, useId } from 'vue';

interface Props {
  /** Valeur du groupe (v-model) */
  modelValue: string;
  /** Valeur portée par ce bouton */
  value: string;
  /** Libellé visible */
  label: string;
  /** Nom technique commun au groupe (radio exclusifs) */
  name: string;
  /** Message d'aide */
  hint?: string;
  /** Désactive le bouton */
  disabled?: boolean;
  /** Identifiant accessible imposé */
  inputId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  hint: undefined,
  disabled: false,
  inputId: undefined,
});

const emit = defineEmits<{ 'update:modelValue': [string] }>();

const autoId = useId();
const id = computed(() => props.inputId ?? `radio-${autoId}`);
const hintId = computed(() => `${id.value}-hint`);
const checked = computed(() => props.modelValue === props.value);

function onChange(event: Event): void {
  emit('update:modelValue', (event.target as HTMLInputElement).value);
}
</script>

<template>
  <div class="flex items-start gap-3">
    <input
      :id="id"
      type="radio"
      class="mt-0.5 h-4 w-4 shrink-0 border-white/20 bg-white/5 text-brand-red cursor-pointer focus:ring-brand-red focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
      :name="name"
      :value="value"
      :checked="checked"
      :disabled="disabled"
      :aria-describedby="hint ? hintId : undefined"
      @change="onChange"
    />
    <div class="min-w-0">
      <label :for="id" class="text-sm text-gray-200 cursor-pointer select-none">
        {{ label }}
      </label>
      <p v-if="hint" :id="hintId" class="mt-0.5 text-xs text-gray-500">{{ hint }}</p>
    </div>
  </div>
</template>
