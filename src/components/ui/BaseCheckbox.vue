<script setup lang="ts">
/**
 * Case à cocher TEC : label, aide, état intermédiaire (indeterminate).
 */
import { computed, onMounted, ref, useId, watch } from 'vue';

interface Props {
  /** État coché (v-model) */
  modelValue: boolean;
  /** Libellé visible */
  label: string;
  /** Message d'aide affiché sous la case */
  hint?: string;
  /** État intermédiaire (ex. « tout sélectionner ») */
  indeterminate?: boolean;
  /** Désactive la case */
  disabled?: boolean;
  /** Case obligatoire (astérisque + `required`) */
  required?: boolean;
  /** Identifiant accessible imposé (repli sur un id auto) */
  inputId?: string;
  /** Nom technique du champ */
  name?: string;
}

const props = withDefaults(defineProps<Props>(), {
  hint: undefined,
  indeterminate: false,
  disabled: false,
  required: false,
  inputId: undefined,
  name: undefined,
});

const emit = defineEmits<{ 'update:modelValue': [boolean] }>();

const autoId = useId();
const id = computed(() => props.inputId ?? `checkbox-${autoId}`);
const hintId = computed(() => `${id.value}-hint`);

const inputRef = ref<HTMLInputElement | null>(null);

function syncIndeterminate(): void {
  if (inputRef.value) {
    inputRef.value.indeterminate = props.indeterminate;
  }
}

onMounted(syncIndeterminate);
watch(() => props.indeterminate, syncIndeterminate);

function onChange(event: Event): void {
  emit('update:modelValue', (event.target as HTMLInputElement).checked);
}
</script>

<template>
  <div class="flex items-start gap-3">
    <input
      :id="id"
      ref="inputRef"
      type="checkbox"
      class="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-white/5 text-brand-red cursor-pointer focus:ring-brand-red focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
      :checked="modelValue"
      :disabled="disabled"
      :required="required"
      :name="name"
      :aria-describedby="hint ? hintId : undefined"
      @change="onChange"
    />
    <div class="min-w-0">
      <label :for="id" class="text-sm text-gray-200 cursor-pointer select-none">
        {{ label }}
        <span v-if="required" class="text-brand-red-light" aria-hidden="true">*</span>
      </label>
      <p v-if="hint" :id="hintId" class="mt-0.5 text-xs text-gray-500">{{ hint }}</p>
    </div>
  </div>
</template>
