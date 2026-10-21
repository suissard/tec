<script setup lang="ts">
/**
 * Champ fichier TEC : drag & drop, aperçu image et bouton de suppression.
 * La valeur (v-model) est un `File | null` — aucun envoi réseau ici (stub).
 */
import { computed, onBeforeUnmount, ref, useId, watch } from 'vue';

interface Props {
  /** Fichier sélectionné (v-model) */
  modelValue: File | null;
  /** Libellé visible du champ */
  label: string;
  /** Types MIME acceptés (attribut `accept`) */
  accept?: string;
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
}

const props = withDefaults(defineProps<Props>(), {
  accept: 'image/*',
  hint: undefined,
  error: undefined,
  required: false,
  disabled: false,
  inputId: undefined,
});

const emit = defineEmits<{ 'update:modelValue': [File | null] }>();

const autoId = useId();
const id = computed(() => props.inputId ?? `file-${autoId}`);
const hintId = computed(() => `${id.value}-hint`);
const errorId = computed(() => `${id.value}-error`);

const inputRef = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);
const previewUrl = ref('');

const describedBy = computed(() =>
  [props.hint ? hintId.value : null, props.error ? errorId.value : null].filter(Boolean).join(' ')
);

/** Libellé du bouton : fichier choisi ou invite. */
const buttonLabel = computed(() => props.modelValue?.name ?? 'Parcourir…');

/** Aperçu image : recrée l'URL objet à chaque fichier, révoque l'ancienne. */
watch(
  () => props.modelValue,
  (file) => {
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value);
      previewUrl.value = '';
    }
    if (file && file.type.startsWith('image/')) {
      previewUrl.value = URL.createObjectURL(file);
    }
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
});

function openPicker(): void {
  if (props.disabled) return;
  inputRef.value?.click();
}

function setFile(file: File | null | undefined): void {
  emit('update:modelValue', file ?? null);
}

function onInputChange(event: Event): void {
  setFile((event.target as HTMLInputElement).files?.[0]);
}

function onDrop(event: DragEvent): void {
  isDragging.value = false;
  if (props.disabled) return;
  setFile(event.dataTransfer?.files?.[0]);
}

function clear(): void {
  if (props.disabled) return;
  setFile(null);
  if (inputRef.value) inputRef.value.value = '';
}
</script>

<template>
  <div class="w-full">
    <span class="block text-xs font-medium text-gray-300 mb-1">
      {{ label }}
      <span v-if="required" class="text-brand-red-light" aria-hidden="true">*</span>
    </span>

    <div
      class="rounded-lg border border-dashed p-4 text-center transition-colors"
      :class="[
        isDragging ? 'border-brand-red bg-brand-red/10' : 'border-white/20 bg-white/5',
        error ? 'border-rose-500/70' : '',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
      ]"
      role="button"
      tabindex="0"
      :aria-label="`${label} — glissez un fichier ou appuyez sur Entrée pour parcourir`"
      :aria-describedby="describedBy || undefined"
      @click="openPicker"
      @keydown.enter.prevent="openPicker"
      @keydown.space.prevent="openPicker"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="onDrop"
    >
      <input
        :id="id"
        ref="inputRef"
        type="file"
        class="sr-only"
        :accept="accept"
        :required="required"
        :disabled="disabled"
        :aria-invalid="error ? 'true' : undefined"
        @change="onInputChange"
      />

      <img
        v-if="previewUrl"
        :src="previewUrl"
        alt="Aperçu du fichier sélectionné"
        class="mx-auto mb-3 max-h-32 rounded-lg object-contain"
      />
      <p v-else class="mb-2 text-2xl text-gray-500" aria-hidden="true">⬆</p>

      <p class="truncate text-sm text-gray-200">{{ buttonLabel }}</p>
      <p class="mt-1 text-xs text-gray-500">ou glissez-déposez le fichier ici</p>
    </div>

    <div class="mt-2 flex items-center justify-between gap-4">
      <div class="min-w-0">
        <p v-if="hint" :id="hintId" class="text-xs text-gray-500">{{ hint }}</p>
        <p v-if="error" :id="errorId" class="text-xs text-rose-400" role="alert">{{ error }}</p>
      </div>
      <button
        v-if="modelValue"
        type="button"
        class="shrink-0 text-xs text-brand-red-light hover:text-white transition-colors"
        :disabled="disabled"
        @click="clear"
      >
        Retirer le fichier
      </button>
    </div>
  </div>
</template>
